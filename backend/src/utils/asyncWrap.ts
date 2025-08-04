import type { NextFunction, Request, Response } from "express";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { ServiceResponse } from "@/api/models/serviceResponse.js";
import type { AppError } from "@/errors";

/**
 * Wrapper for async Express route handlers to automatically catch errors
 * and forward them to the error handling middleware
 */
export const wrapAsync = <
	TRequest extends Request = Request,
	TResponse extends Response = Response,
>(
	fn: (
		req: TRequest,
		res: TResponse,
		next: NextFunction,
	) => Promise<undefined | Response>,
) => {
	return (req: TRequest, res: TResponse, next: NextFunction): void => {
		// Execute the async function and catch any errors
		fn(req, res, next).catch(next);
	};
};

/**
 * Functional wrapper for TaskEither-based Express route handlers
 * Automatically handles TaskEither execution and error responses
 */
export const wrapTaskEither = <
	TRequest extends Request = Request,
	TResponse extends Response = Response,
	TData = unknown,
>(
	fn: (
		req: TRequest,
		res: TResponse,
		next: NextFunction,
	) => TE.TaskEither<AppError, TData>,
	successMessage: string = "Operation completed successfully",
) => {
	return wrapAsync(
		async (
			req: TRequest,
			res: TResponse,
			next: NextFunction,
		): Promise<Response | undefined> => {
			return await pipe(
				fn(req, res, next),
				TE.fold(
					(error: AppError) => () => {
						// Forward error to error handling middleware
						next(error);
						return Promise.resolve(undefined);
					},
					(data: TData) => () => {
						const serviceResponse = ServiceResponse.success(
							successMessage,
							data,
						);
						return Promise.resolve(
							res.status(serviceResponse.statusCode).json(serviceResponse),
						);
					},
				),
			)();
		},
	);
};

/**
 * Utility type for async route handlers
 */
export type AsyncRouteHandler<
	TRequest extends Request = Request,
	TResponse extends Response = Response,
> = (
	req: TRequest,
	res: TResponse,
	next: NextFunction,
) => Promise<undefined | Response>;

/**
 * Utility type for functional route handlers
 */
export type FunctionalRouteHandler<
	TRequest extends Request = Request,
	TResponse extends Response = Response,
	TData = unknown,
> = (
	req: TRequest,
	res: TResponse,
	next: NextFunction,
) => TE.TaskEither<AppError, TData>;
