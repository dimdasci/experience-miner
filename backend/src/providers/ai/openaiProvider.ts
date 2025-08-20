import * as Sentry from "@sentry/node";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ParsedChatCompletion } from "openai/resources/chat/completions";
import type { ZodTypeAny, z } from "zod";
import { aiConfig, type OpenAIProviderConfig } from "@/config/ai.js";
import {
	AppError,
	BadRequestError,
	ForbiddenError,
	InternalError,
	NotFoundError,
	RateLimitExceededError,
	ServiceUnavailableError,
	UnauthorizedError,
	ValidationFailedError,
} from "@/errors";
import type { IGenerativeAIProvider } from "@/providers/ai/IGenerativeAIProvider";
import type { MediaData, ModelResponse, Usage } from "./types.js";

export class OpenAIProvider implements IGenerativeAIProvider {
	private client: OpenAI;
	private config: OpenAIProviderConfig;
	private isProviderHealthy: boolean = true;

	constructor() {
		this.config = aiConfig.providers.openai;
		this.client = new OpenAI({
			apiKey: this.config.apiKey,
			maxRetries: this.config.sdkOptions.maxRetries,
			timeout: this.config.sdkOptions.timeout,
		});

		this.testConnection().catch(() => {
			// Test connection error is already logged in testConnection
		});
	}

	private async testConnection(): Promise<void> {
		try {
			await this.client.chat.completions.create({
				model: this.config.models.extraction || "gpt-4o-2024-08-06",
				messages: [{ role: "user", content: "Test connection" }],
				max_tokens: 1,
			});
			this.isProviderHealthy = true;
			Sentry.logger?.info?.("OpenAI connection established successfully");
		} catch (error) {
			this.isProviderHealthy = false;
			Sentry.logger?.error?.("Failed to connect to OpenAI", {
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	// Functional overload signatures
	generateCompletion<T extends ZodTypeAny>(
		task: string,
		systemPrompt: string,
		userPrompt: string,
		media: MediaData | undefined,
		responseSchema: T,
	): TE.TaskEither<AppError, ModelResponse<z.infer<T>>>;

	generateCompletion(
		task: string,
		systemPrompt: string,
		userPrompt: string,
		media: MediaData | undefined,
		responseSchema: string,
	): TE.TaskEither<AppError, ModelResponse<string>>;

	// Functional implementation
	generateCompletion<T extends ZodTypeAny>(
		task: string,
		systemPrompt: string,
		userPrompt: string,
		media?: MediaData,
		responseSchema?: T | string,
	): TE.TaskEither<
		AppError,
		ModelResponse<z.infer<T>> | ModelResponse<string>
	> {
		return pipe(
			TE.Do,
			TE.bind("isStructuredCall", () =>
				TE.right(
					responseSchema &&
						typeof (responseSchema as ZodTypeAny).safeParse === "function",
				),
			),
			TE.flatMap(({ isStructuredCall }) => {
				// Use provider-managed model, token, and temperature selection
				const selectedModel =
					this.config.models[task] ||
					this.config.models.extraction ||
					"gpt-4o-mini-2024-07-18";
				const selectedMaxTokens =
					this.config.maxTokens[task] ||
					this.config.maxTokens.extraction ||
					2000;
				const selectedTemperature =
					this.config.temperatures[task] ||
					this.config.temperatures.extraction ||
					0.0;

				return this.callModel(
					selectedModel,
					systemPrompt,
					userPrompt,
					media,
					selectedTemperature,
					selectedMaxTokens,
					isStructuredCall ? (responseSchema as ZodTypeAny) : undefined,
				);
			}),
		);
	}

	private callModel<T extends ZodTypeAny>(
		model: string,
		systemPrompt: string,
		userPrompt: string,
		media?: MediaData,
		temperature?: number,
		maxOutputTokens?: number,
		responseSchema?: T,
	): TE.TaskEither<
		AppError,
		ModelResponse<z.infer<T>> | ModelResponse<string>
	> {
		return TE.tryCatch(
			async () => {
				// Health check
				if (!this.isHealthy()) {
					throw new ServiceUnavailableError("OpenAI connection is not healthy");
				}

				// Prepare messages
				const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
					{ role: "developer", content: systemPrompt },
					{ role: "user", content: this.makeContent(userPrompt, media) },
				];

				// Prepare request parameters
				const requestParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming =
					{
						model,
						messages,
						temperature: temperature ?? 0.0,
						max_completion_tokens: maxOutputTokens,
					};

				// Add structured output if schema provided
				if (responseSchema) {
					requestParams.response_format = zodResponseFormat(
						responseSchema,
						"response",
					);
				}

				// Log request details to Sentry
				Sentry.logger?.debug?.("OpenAI API request", {
					model,
					systemPrompt,
					userPrompt,
					temperature: requestParams.temperature,
					maxTokens: requestParams.max_completion_tokens,
					hasResponseSchema: !!responseSchema,
					hasMedia: !!media,
				});

				// Make API call - use correct method based on whether we need structured output
				if (responseSchema) {
					const parsedCompletion: ParsedChatCompletion<z.infer<T>> =
						await this.client.chat.completions.parse(requestParams);

					// Process structured response using proper ParsedChatCompletion type
					const parsedMessage = parsedCompletion.choices[0]?.message;
					const usage = parsedCompletion.usage;

					if (!parsedMessage) {
						throw new BadRequestError("OpenAI API returned empty response");
					}

					// Convert token usage
					const convertedUsage: Usage = this.convertOpenAIUsage(usage);

					// Handle refusal
					if (parsedMessage.refusal) {
						Sentry.logger?.error?.("OpenAI API refused request", {
							refusal: parsedMessage.refusal,
							model: parsedCompletion.model,
						});
						throw new ValidationFailedError(
							`OpenAI refused request: ${parsedMessage.refusal}`,
						);
					}

					return {
						data: parsedMessage.parsed,
						usage: convertedUsage,
					} as ModelResponse<z.infer<T>>;
				}

				// Regular completion for text responses
				const completion =
					await this.client.chat.completions.create(requestParams);

				// Extract response data
				const message = completion.choices[0]?.message;
				const usage = completion.usage;

				if (!message?.content) {
					throw new BadRequestError("OpenAI API returned empty response");
				}

				// Convert token usage
				const convertedUsage: Usage = this.convertOpenAIUsage(usage);

				// Log response details
				Sentry.logger?.debug?.("OpenAI API response", {
					model: completion.model,
					finishReason: completion.choices[0]?.finish_reason,
					usage: convertedUsage,
					hasContent: !!message.content,
					contentLength: message.content?.length || 0,
				});

				// Handle refusal
				if (message.refusal) {
					Sentry.logger?.error?.("OpenAI API refused request", {
						refusal: message.refusal,
						model,
					});
					throw new ValidationFailedError(
						`OpenAI refused request: ${message.refusal}`,
					);
				}

				// Return text response
				return {
					data: message.content,
					usage: convertedUsage,
				} as ModelResponse<string>;
			},
			(error) => this.mapOpenAIError(error),
		);
	}

	private makeContent(
		userPrompt: string,
		media?: MediaData,
	): OpenAI.Chat.Completions.ChatCompletionContentPart[] | string {
		if (!media?.mimeType || !media?.data) {
			return userPrompt;
		}

		const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
			{ type: "text", text: userPrompt },
		];

		// Handle audio media
		if (media.mimeType.startsWith("audio/")) {
			const format = media.mimeType.split("/")[1]; // "audio/wav" → "wav"
			content.push({
				type: "input_audio",
				input_audio: {
					data: media.data.toString("base64"),
					format: (format as "wav" | "mp3") || "wav", // OpenAI supports wav and mp3 primarily
				},
			});
		}
		// Handle image media (if needed in the future)
		else if (media.mimeType.startsWith("image/")) {
			content.push({
				type: "image_url",
				image_url: {
					url: `data:${media.mimeType};base64,${media.data.toString("base64")}`,
				},
			});
		}

		return content;
	}

	private convertOpenAIUsage(
		openaiUsage: OpenAI.Completions.CompletionUsage | undefined,
	): Usage {
		return {
			inputTokens: openaiUsage?.prompt_tokens || 0,
			outputTokens: openaiUsage?.completion_tokens || 0,
		};
	}

	private mapOpenAIError(error: unknown): AppError {
		// Handle OpenAI SDK specific errors
		if (error instanceof OpenAI.AuthenticationError) {
			return new UnauthorizedError("OpenAI authentication failed");
		}
		if (error instanceof OpenAI.PermissionDeniedError) {
			return new ForbiddenError("OpenAI access denied");
		}
		if (error instanceof OpenAI.NotFoundError) {
			return new NotFoundError("OpenAI resource not found");
		}
		if (error instanceof OpenAI.RateLimitError) {
			return new RateLimitExceededError("OpenAI rate limit exceeded");
		}
		if (error instanceof OpenAI.BadRequestError) {
			return new ValidationFailedError("OpenAI request validation failed");
		}
		if (error instanceof OpenAI.UnprocessableEntityError) {
			return new ValidationFailedError("OpenAI unprocessable entity");
		}
		if (error instanceof OpenAI.APIConnectionTimeoutError) {
			return new ServiceUnavailableError("OpenAI connection timeout");
		}
		if (error instanceof OpenAI.APIError) {
			return new ServiceUnavailableError(`OpenAI API error: ${error.message}`);
		}

		// Handle already mapped AppErrors
		if (error instanceof AppError) {
			return error;
		}

		// Handle generic errors
		return new InternalError(
			error instanceof Error ? error.message : "Unknown OpenAI error",
		);
	}

	close(): void {
		this.isProviderHealthy = false;
		Sentry.logger?.info?.("OpenAI provider closed");
	}

	isHealthy(): boolean {
		return this.isProviderHealthy;
	}

	getHealthStatus(): {
		healthy: boolean;
		provider: string;
	} {
		return {
			healthy: this.isProviderHealthy,
			provider: "openai",
		};
	}
}
