import { ModelResponse, MediaData } from "@/types/ai";
import { z, ZodTypeAny } from "zod";

export interface IGenerativeAIProvider {
    generateCompletion<T extends ZodTypeAny>(
        model: string,
        systemPrompt: string,
        userPrompt: string,
        media?: MediaData,
        temperature?: number,
        maxOutputTokens?: number,
        responseSchema?: T,        
    ): Promise<ModelResponse<z.infer<T>>>;

    generateCompletion(
        model: string,
        systemPrompt: string,
        userPrompt: string,
        media?: MediaData,
        temperature?: number,
        maxOutputTokens?: number,
        responseSchema?: string, 
    ): Promise<ModelResponse<string>>;
}
