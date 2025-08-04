import * as Sentry from "@sentry/node";
import * as E from "fp-ts/lib/Either.js";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import type { CreditsRepository, CreditsService, SourceType } from "@/credits";
import { type AppError, AppErrors, BadRequestError } from "@/errors";
import type { DatabaseClient } from "@/providers";

/**
 * Base class for workflows that require user locking and credits management
 */
export abstract class WorkflowBase {
	protected creditsRepo: CreditsRepository;
	protected creditsService: CreditsService;

	constructor(creditsRepo: CreditsRepository, creditsService: CreditsService) {
		this.creditsRepo = creditsRepo;
		this.creditsService = creditsService;
	}

	/**
	 * Execute workflow with standard locking and credits management
	 */
	protected executeWithCreditsAndLocking<T>(
		userId: string,
		workflowName: string,
		operation: () => TE.TaskEither<AppError, T>,
	): TE.TaskEither<AppError, T> {
		return pipe(
			// 1. Check for concurrent operations
			TE.fromEither(this.checkUserLock(userId)),
			// 2. Set user lock
			TE.map(() => this.creditsService.setUserLock(userId)),
			// 3. Check available credits
			TE.flatMap(() => this.creditsRepo.getCurrentBalance(userId)),
			TE.flatMap((balance: number) => {
				if (balance <= 0) {
					return TE.left(AppErrors.insufficientCredits(balance));
				}
				return TE.right(balance);
			}),
			// 4. Run the operation
			TE.flatMap(() => operation()),
			// Handle cleanup and error logging
			TE.mapLeft((error) => {
				Sentry.logger?.error?.(`${workflowName} failed`, {
					user_id: userId,
					error: error instanceof Error ? error.message : String(error),
				});

				return error;
			}),
			// Always release user lock regardless of success/failure
			TE.fold(
				(error) => {
					this.creditsService.removeUserLock(userId);
					return TE.left(error);
				},
				(result) => {
					this.creditsService.removeUserLock(userId);
					return TE.right(result);
				},
			),
		);
	}

	/**
	 * Check if user has an active lock
	 */
	protected checkUserLock(userId: string): E.Either<AppError, void> {
		if (this.creditsService.checkUserLock(userId)) {
			return E.left(
				new BadRequestError(
					"Another operation is in progress, please wait and try again",
				),
			);
		}
		return E.right(undefined);
	}

	/**
	 * Consume credits for a specific operation
	 */
	protected consumeCredits(
		userId: string,
		tokenCount: number,
		operation: SourceType,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, void> {
		if (tokenCount > 0) {
			return pipe(
				this.creditsRepo.consumeCredits(userId, tokenCount, operation, client),
				TE.map(() => undefined),
			);
		}
		return TE.right(undefined);
	}
}
