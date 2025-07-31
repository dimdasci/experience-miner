import {
    GoogleGenAI,
    type GenerateContentParameters,
    type GenerateContentConfig,
    type GenerateContentResponse,
} from "@google/genai";
import * as Sentry from "@sentry/node";
import { aiConfig, RateLimitConfig } from "@/config/ai.js";
import { ModelResponse, MediaData, Usage } from "@/types/ai";
import { IGenerativeAIProvider } from "@/interfaces/providers/IGenerativeAIProvider";
import { z, ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

interface RequestTracker {
    requests: number[];
    dailyRequests: number;
    lastReset: Date;
}

export class GeminiProvider implements IGenerativeAIProvider {
    private client: GoogleGenAI;
    private rateLimitConfig: RateLimitConfig;
    private requestTracker: RequestTracker;
    private isHealthy: boolean = true;

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

        this.testConnection();
    }

    private async testConnection(): Promise<void> {
        try {
            await this.client.models.generateContent({
                model: aiConfig.models.topicGeneration,
                contents: [{ parts: [{ text: "Test connection" }] }],
            });
            this.isHealthy = true;
            Sentry.logger?.info?.("Gemini AI connection established successfully");
        } catch (error) {
            this.isHealthy = false;
            Sentry.logger?.error?.("Failed to connect to Gemini AI", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    private resetDailyCounterIfNeeded(): void {
        const now = new Date();
        const timeSinceLastReset = now.getTime() - this.requestTracker.lastReset.getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (timeSinceLastReset >= oneDayMs) {
            this.requestTracker.dailyRequests = 0;
            this.requestTracker.lastReset = now;
        }
    }

    private canMakeRequest(): { allowed: boolean; waitTime?: number } {
        this.resetDailyCounterIfNeeded();
        if (this.requestTracker.dailyRequests >= this.rateLimitConfig.requestsPerDay) {
            const msUntilReset = 24 * 60 * 60 * 1000 - (Date.now() - this.requestTracker.lastReset.getTime());
            return { allowed: false, waitTime: msUntilReset };
        }
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        this.requestTracker.requests = this.requestTracker.requests.filter(ts => ts > oneMinuteAgo);
        if (this.requestTracker.requests.length >= this.rateLimitConfig.requestsPerMinute) {
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

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Overload signatures
    async generateCompletion<T extends ZodTypeAny>(
        model: string,
        systemPrompt: string,
        userPrompt: string,
        media: MediaData | undefined,
        temperature: number | undefined,
        maxOutputTokens: number | undefined,
        responseSchema: T
    ): Promise<ModelResponse<z.infer<T>>>;

    async generateCompletion(
        model: string,
        systemPrompt: string,
        userPrompt: string,
        media: MediaData | undefined,
        temperature: number | undefined,
        maxOutputTokens: number | undefined,
        responseSchema: string
    ): Promise<string>;

    // Implementation
    async generateCompletion<T extends ZodTypeAny>(
        model: string,
        systemPrompt: string,
        userPrompt: string,
        media?: MediaData,
        temperature?: number,
        maxOutputTokens?: number,
        responseSchema?: T | string,
    ): Promise<ModelResponse<z.infer<T>> | string> {
        const isStructuredCall = responseSchema && typeof (responseSchema as ZodTypeAny).safeParse === "function";

        // Request construction
        const request: GenerateContentParameters = isStructuredCall
            ? await this.makeStructuredRequest(
                model,
                systemPrompt,
                userPrompt,
                zodToJsonSchema(responseSchema as ZodTypeAny),
                media,
                temperature,
                maxOutputTokens,
            )
            : await this.makeRequest(
                model,
                systemPrompt,
                userPrompt,
                media,
                temperature,
                maxOutputTokens,
            );

        // Single call
        const response = await this.callModel(request);

        // Response processing
        if (isStructuredCall) {
            if (!response.text) {
                throw new Error("Gemini API response is empty");
            }
            try {
                const parsedObject = (responseSchema as ZodTypeAny).parse(JSON.parse(response.text));
                return {
                    data: parsedObject,
                    usage: {
                        inputTokens: response.usageMetadata?.promptTokenCount || 0,
                        outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
                    } as Usage,
                } as ModelResponse<z.infer<T>>;
            } catch (error) {
                Sentry.logger?.error?.("Failed to parse Gemini API response", {
                    error: error instanceof Error ? error.message : "Unknown error",
                    schema: zodToJsonSchema(responseSchema as ZodTypeAny),
                    result: response.text,
                });
                throw new Error("Failed to parse Gemini API response");
            }
        } else {
            return {
                data: response.text ?? "",
                usage: {
                    inputTokens: response.usageMetadata?.promptTokenCount || 0,
                    outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
                } as Usage,
            } as ModelResponse<string>;
        }
    }

    private async callModel(request: GenerateContentParameters): Promise<GenerateContentResponse> {
        // Implementation for calling the model with the request
        if (!this.isHealthy) {
            throw new Error("Gemini AI connection is not healthy");
        }
        let attempt = 0;
        let backoffMs = 1000;

        while (attempt < this.rateLimitConfig.maxRetries) {
            const rateLimitCheck = this.canMakeRequest();
            if (!rateLimitCheck.allowed && rateLimitCheck.waitTime) {
                if (rateLimitCheck.waitTime > 5000) {
                    throw new Error(`Rate limit exceeded. Wait ${Math.ceil(rateLimitCheck.waitTime / 1000)} seconds.`);
                }
                await this.sleep(rateLimitCheck.waitTime);
            }

            try {
                this.trackRequest();
                const result: GenerateContentResponse = await this.client.models.generateContent(request);

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
                    this.isHealthy = false;
                    Sentry.captureException(error, {
                        tags: { service: "gemini", operation: "generateCompletion" },
                        extra: { attempts: attempt, finalBackoff: backoffMs },
                    });
                    throw new Error(
                        `Gemini AI request failed after ${attempt} attempts: ${error instanceof Error ? error.message : "Unknown error"
                        }`
                    );
                }
                await this.sleep(backoffMs);
                backoffMs *= this.rateLimitConfig.backoffMultiplier;
            }
        }
        throw new Error("Unexpected end of retry loop");
    }

    private async makeRequest(
        model: string,
        systemPrompt: string,
        userPrompt: string,
        media?: MediaData,
        temperature?: number,
        maxOutputTokens?: number,
    ): Promise<GenerateContentParameters> {

        let config = {
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
        } as GenerateContentParameters;
    }

    private async makeStructuredRequest(
        model: string,
        systemPrompt: string,
        userPrompt: string,
        responseSchema: object,
        media?: MediaData,
        temperature?: number,
        maxOutputTokens?: number,
    ): Promise<GenerateContentParameters> {

        let config = {
            systemInstruction: systemPrompt,
            temperature: temperature,
            maxOutputTokens: maxOutputTokens,
            responseMimeType: "application/json",
            responseSchema: responseSchema
        } as GenerateContentConfig;

        const contents = this.makeContent(userPrompt, media);

        return {
            model: model,
            contents: contents,
            config: config,
        } as GenerateContentParameters;
    }

    private makeContent(
        userPrompt: string,
        media?: MediaData,
    ): string | { parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] } {
        if (media && media.mimeType && media.data) {
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
        const currentMinuteRequests = this.requestTracker.requests.filter(ts => ts > oneMinuteAgo).length;
        return {
            healthy: this.isHealthy,
            requestsThisMinute: currentMinuteRequests,
            requestsToday: this.requestTracker.dailyRequests,
            dailyLimitRemaining: this.rateLimitConfig.requestsPerDay - this.requestTracker.dailyRequests,
        };
    }

    async close(): Promise<void> {
        this.isHealthy = false;
        Sentry.logger?.info?.("Gemini provider closed");
    }
}