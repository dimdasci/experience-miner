import {
	type GenerateContentConfig,
	type GenerateContentParameters,
	type GenerateContentResponse,
	GoogleGenAI,
} from "@google/genai";
import * as Sentry from "@sentry/node";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import type { ZodTypeAny, z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { aiConfig, type RateLimitConfig } from "@/config/ai.js";
import { AppError, BadRequestError, ServiceUnavailableError } from "@/errors";
import type { IGenerativeAIProvider } from "@/providers/ai/IGenerativeAIProvider";
import type { MediaData, ModelResponse, Usage } from "./types.js";

interface RequestTracker {
	requests: number[];
	dailyRequests: number;
	lastReset: Date;
}

export class GeminiProvider implements IGenerativeAIProvider {
	private client: GoogleGenAI;
	private rateLimitConfig: RateLimitConfig;
	private requestTracker: RequestTracker;
	private isProviderHealthy: boolean = true;

	constructor() {
		this.client = new GoogleGenAI({
			apiKey: aiConfig.apiKey,
		});

		this.rateLimitConfig = aiConfig.rateLimits;

		this.requestTracker = {
			requests: [],
			dailyRequests: 0,
			lastReset: new Date(),
		};

		this.testConnection().catch(() => {
			// Test connection error is already logged in testConnection
		});
	}

	private async testConnection(): Promise<void> {
		try {
			await this.client.models.generateContent({
				model: aiConfig.models.topicGeneration,
				contents: [{ parts: [{ text: "Test connection" }] }],
			});
			this.isProviderHealthy = true;
			Sentry.logger?.info?.("Gemini AI connection established successfully");
		} catch (error) {
			this.isProviderHealthy = false;
			Sentry.logger?.error?.("Failed to connect to Gemini AI", {
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	private resetDailyCounterIfNeeded(): void {
		const now = new Date();
		const timeSinceLastReset =
			now.getTime() - this.requestTracker.lastReset.getTime();
		const oneDayMs = 24 * 60 * 60 * 1000;
		if (timeSinceLastReset >= oneDayMs) {
			this.requestTracker.dailyRequests = 0;
			this.requestTracker.lastReset = now;
		}
	}

	private canMakeRequest(): { allowed: boolean; waitTime?: number } {
		this.resetDailyCounterIfNeeded();
		if (
			this.requestTracker.dailyRequests >= this.rateLimitConfig.requestsPerDay
		) {
			const msUntilReset =
				24 * 60 * 60 * 1000 -
				(Date.now() - this.requestTracker.lastReset.getTime());
			return { allowed: false, waitTime: msUntilReset };
		}
		const now = Date.now();
		const oneMinuteAgo = now - 60000;
		this.requestTracker.requests = this.requestTracker.requests.filter(
			(ts) => ts > oneMinuteAgo,
		);
		if (
			this.requestTracker.requests.length >=
			this.rateLimitConfig.requestsPerMinute
		) {
			const oldestRequest = Math.min(...this.requestTracker.requests);
			const waitTime = 60000 - (now - oldestRequest);
			return { allowed: false, waitTime: Math.max(0, waitTime) };
		}
		return { allowed: true };
	}

	private trackRequest(): void {
		const now = Date.now();
		this.requestTracker.requests.push(now);
		this.requestTracker.dailyRequests++;
		Sentry.logger?.debug?.("Gemini API request tracked", {
			requestsThisMinute: this.requestTracker.requests.length,
			requestsToday: this.requestTracker.dailyRequests,
			dailyLimit: this.rateLimitConfig.requestsPerDay,
		});
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Functional overload signatures
	generateCompletion<T extends ZodTypeAny>(
		model: string,
		systemPrompt: string,
		userPrompt: string,
		media: MediaData | undefined,
		temperature: number | undefined,
		maxOutputTokens: number | undefined,
		responseSchema: T,
	): TE.TaskEither<AppError, ModelResponse<z.infer<T>>>;

	generateCompletion(
		model: string,
		systemPrompt: string,
		userPrompt: string,
		media: MediaData | undefined,
		temperature: number | undefined,
		maxOutputTokens: number | undefined,
		responseSchema: string,
	): TE.TaskEither<AppError, ModelResponse<string>>;

	// Functional implementation
	generateCompletion<T extends ZodTypeAny>(
		model: string,
		systemPrompt: string,
		userPrompt: string,
		media?: MediaData,
		temperature?: number,
		maxOutputTokens?: number,
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
			TE.bind("request", ({ isStructuredCall }) => {
				const request: GenerateContentParameters = isStructuredCall
					? this.makeStructuredRequest(
							model,
							systemPrompt,
							userPrompt,
							zodToJsonSchema(responseSchema as ZodTypeAny),
							media,
							temperature,
							maxOutputTokens,
						)
					: this.makeRequest(
							model,
							systemPrompt,
							userPrompt,
							media,
							temperature,
							maxOutputTokens,
						);
				return TE.right(request);
			}),
			TE.bind("response", ({ request }) => this.callModel(request)),
			TE.flatMap(({ isStructuredCall, request, response }) => {
				// Log request and response details to Sentry
				Sentry.logger?.debug?.("Gemini API request made", {
					request: {
						model: request.model,
						userPrompt: request.contents,
						maxOutputTokens: request.config?.maxOutputTokens,
						temperature: request.config?.temperature,
					},
					response: {
						candidates: response.candidates?.map((c) => ({
							content: c.content,
							finishReason: c.finishReason,
							tokenCount: c.tokenCount,
						})),
						usage: {
							promptTokenCount: response.usageMetadata?.promptTokenCount || 0,
							cachedContentTokenCount:
								response.usageMetadata?.cachedContentTokenCount || 0,
							candidatesTokenCount:
								response.usageMetadata?.candidatesTokenCount || 0,
							toolUsePromptTokenCount:
								response.usageMetadata?.toolUsePromptTokenCount || 0,
							thoughtsTokenCount:
								response.usageMetadata?.thoughtsTokenCount || 0,
							totalTokenCount: response.usageMetadata?.totalTokenCount || 0,
						},
					},
				});

				if (isStructuredCall) {
					if (!response.text) {
						Sentry.logger?.error?.("Gemini API returned empty response", {
							model: request.model,
							hasUsageMetadata: !!response.usageMetadata,
							responseKeys: Object.keys(response),
							fullResponse: response,
						});
						return TE.left(new BadRequestError("Gemini API response is empty"));
					}

					// At this point, response.text is guaranteed to be defined
					const responseText = response.text;

					return TE.tryCatch(
						() =>
							Promise.resolve({
								data: (responseSchema as ZodTypeAny).parse(
									JSON.parse(responseText),
								),
								usage: {
									inputTokens: response.usageMetadata?.promptTokenCount || 0,
									outputTokens:
										response.usageMetadata?.candidatesTokenCount || 0,
								} as Usage,
							} as ModelResponse<z.infer<T>>),
						(error) => {
							Sentry.logger?.error?.("Failed to parse Gemini API response", {
								error: error instanceof Error ? error.message : "Unknown error",
								schema: zodToJsonSchema(responseSchema as ZodTypeAny),
								responseText: responseText,
								responseLength: responseText.length,
							});
							return new BadRequestError("Failed to parse Gemini API response");
						},
					);
				} else {
					return TE.right({
						data: response.text ?? "",
						usage: {
							inputTokens: response.usageMetadata?.promptTokenCount || 0,
							outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
						} as Usage,
					} as ModelResponse<string>);
				}
			}),
		);
	}

	private callModel(
		request: GenerateContentParameters,
	): TE.TaskEither<AppError, GenerateContentResponse> {
		return TE.tryCatch(
			async () => {
				// Health check
				if (!this.isHealthy) {
					throw new ServiceUnavailableError(
						"Gemini AI connection is not healthy",
					);
				}

				let attempt = 0;
				let backoffMs = 1000;

				while (attempt < this.rateLimitConfig.maxRetries) {
					const rateLimitCheck = this.canMakeRequest();
					if (!rateLimitCheck.allowed && rateLimitCheck.waitTime) {
						if (rateLimitCheck.waitTime > 5000) {
							throw new ServiceUnavailableError(
								`Rate limit exceeded. Wait ${Math.ceil(rateLimitCheck.waitTime / 1000)} seconds.`,
							);
						}
						await this.sleep(rateLimitCheck.waitTime);
					}

					try {
						this.trackRequest();
						const result: GenerateContentResponse =
							await this.client.models.generateContent(request);

						backoffMs = 1000;
						Sentry.logger?.debug?.("Gemini API request successful", {
							attempt: attempt + 1,
						});

						return result;
					} catch (error) {
						attempt++;
						Sentry.logger?.warn?.("Gemini API request failed", {
							attempt,
							maxRetries: this.rateLimitConfig.maxRetries,
							error: error instanceof Error ? error.message : "Unknown error",
							backoffMs,
						});

						if (attempt >= this.rateLimitConfig.maxRetries) {
							this.isProviderHealthy = false;
							Sentry.captureException(error, {
								tags: { service: "gemini", operation: "generateCompletion" },
								extra: { attempts: attempt, finalBackoff: backoffMs },
							});
							throw new ServiceUnavailableError(
								`Gemini AI request failed after ${attempt} attempts: ${
									error instanceof Error ? error.message : "Unknown error"
								}`,
							);
						}
						await this.sleep(backoffMs);
						backoffMs *= this.rateLimitConfig.backoffMultiplier;
					}
				}
				throw new ServiceUnavailableError("Unexpected end of retry loop");
			},
			(error) => {
				if (error instanceof AppError) {
					return error;
				}
				return new ServiceUnavailableError(
					error instanceof Error ? error.message : String(error),
				);
			},
		);
	}

	private makeRequest(
		model: string,
		systemPrompt: string,
		userPrompt: string,
		media?: MediaData,
		temperature?: number,
		maxOutputTokens?: number,
	): GenerateContentParameters {
		const config = {
			systemInstruction: systemPrompt,
			temperature: temperature,
			maxOutputTokens: maxOutputTokens,
		} as GenerateContentConfig;

		const contents = this.makeContent(userPrompt, media);

		// if media is provided, wrap it into parts

		return {
			model: model,
			contents: contents,
			config: config,
		};
	}

	private makeStructuredRequest(
		model: string,
		systemPrompt: string,
		userPrompt: string,
		responseSchema: object,
		media?: MediaData,
		temperature?: number,
		maxOutputTokens?: number,
	): GenerateContentParameters {
		const config = {
			systemInstruction: systemPrompt,
			temperature: temperature,
			maxOutputTokens: maxOutputTokens,
			responseMimeType: "application/json",
			responseSchema: responseSchema,
		} as GenerateContentConfig;

		const contents = this.makeContent(userPrompt, media);

		return {
			model: model,
			contents: contents,
			config: config,
		};
	}

	private makeContent(
		userPrompt: string,
		media?: MediaData,
	):
		| string
		| {
				parts: (
					| { text: string }
					| { inlineData: { mimeType: string; data: string } }
				)[];
		  } {
		if (media?.mimeType && media?.data) {
			const base64data = media.data.toString("base64");
			return {
				parts: [
					{ text: userPrompt },
					{
						inlineData: {
							mimeType: media.mimeType,
							data: base64data,
						},
					},
				],
			};
		} else {
			return userPrompt;
		}
	}

	getHealthStatus(): {
		healthy: boolean;
		requestsThisMinute: number;
		requestsToday: number;
		dailyLimitRemaining: number;
	} {
		this.resetDailyCounterIfNeeded();
		const now = Date.now();
		const oneMinuteAgo = now - 60000;
		const currentMinuteRequests = this.requestTracker.requests.filter(
			(ts) => ts > oneMinuteAgo,
		).length;
		return {
			healthy: this.isProviderHealthy,
			requestsThisMinute: currentMinuteRequests,
			requestsToday: this.requestTracker.dailyRequests,
			dailyLimitRemaining:
				this.rateLimitConfig.requestsPerDay - this.requestTracker.dailyRequests,
		};
	}

	close(): void {
		this.isProviderHealthy = false;
		Sentry.logger?.info?.("Gemini provider closed");
	}

	isHealthy(): boolean {
		return this.isProviderHealthy;
	}
}
