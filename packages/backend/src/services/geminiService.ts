import { GoogleGenAI } from '@google/genai';
import { Type } from '@google/genai';
import { env } from '@/common/utils/envConfig.js';
import type { ExtractedFacts } from '@/common/types/interview.js';

class GeminiService {
  private ai: GoogleGenAI;
  private readonly model = 'gemini-2.5-flash';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: env.API_KEY });
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    try {
      const base64Audio = audioBuffer.toString('base64');
      
      const audioPart = {
        inlineData: {
          mimeType,
          data: base64Audio,
        },
      };

      const request = {
        model: this.model,
        contents: [{
          parts: [
            { text: 'Transcribe the following audio recording clearly and accurately.' },
            audioPart,
          ],
        }],
      };

      const response = await this.ai.models.generateContent(request);
      
      if (!response.text) {
        throw new Error('No transcription received from Gemini');
      }

      return response.text;
    } catch (error) {
      console.error('Gemini transcription error:', error);
      throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractFacts(transcript: string): Promise<ExtractedFacts> {
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { 
          type: Type.STRING, 
          description: 'A 2-3 sentence professional summary of the user\'s experience based on the interview.' 
        },
        companies: { 
          type: Type.ARRAY, 
          description: 'List of unique company names the user has worked for.',
          items: { type: Type.STRING } 
        },
        roles: { 
          type: Type.ARRAY, 
          items: { 
            type: Type.OBJECT, 
            properties: { 
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              duration: { type: Type.STRING } 
            } 
          } 
        },
        projects: { 
          type: Type.ARRAY, 
          items: { 
            type: Type.OBJECT, 
            properties: { 
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              role: { type: Type.STRING } 
            } 
          } 
        },
        achievements: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING } 
        },
        skills: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING } 
        },
      },
      required: ['summary', 'companies', 'roles', 'projects', 'achievements', 'skills'],
    };

    try {
      const prompt = `Based on the following interview transcript, act as a professional career coach and extract the key information. The user is a job seeker trying to build their resume. Clean up the language and present it professionally.

TRANSCRIPT:
${transcript}`;

      const request = {
        model: this.model,
        contents: prompt,
        config: { 
          responseMimeType: 'application/json', 
          responseSchema: responseSchema, 
          temperature: 0.2 
        },
      };

      const response = await this.ai.models.generateContent(request);
      
      if (!response.text) {
        throw new Error('No extraction response received from Gemini');
      }

      const jsonText = response.text.trim();
      const parsedJson = JSON.parse(jsonText) as ExtractedFacts;
      
      // Validate required fields
      if (!parsedJson.summary || !Array.isArray(parsedJson.companies)) {
        throw new Error('Invalid response format from Gemini');
      }

      return parsedJson;
    } catch (error) {
      console.error('Gemini extraction error:', error);
      throw new Error(`Failed to extract facts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const geminiService = new GeminiService();