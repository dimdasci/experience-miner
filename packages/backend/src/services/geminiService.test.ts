import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { geminiService } from './geminiService.js';
import { 
  mockTranscriptionResponse, 
  mockExtractionResponse, 
  createTestAudioBuffer, 
  createTestTranscript,
  expectValidExtractedFacts 
} from '../test/helpers.js';

// Mock the entire GoogleGenAI module
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
  Type: {
    OBJECT: 'object',
    ARRAY: 'array',
    STRING: 'string',
  },
}));

describe('GeminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('transcribeAudio', () => {
    it('should successfully transcribe audio', async () => {
      const audioBuffer = createTestAudioBuffer();
      const mimeType = 'audio/webm';
      
      mockGenerateContent.mockResolvedValueOnce(mockTranscriptionResponse);

      const result = await geminiService.transcribeAudio(audioBuffer, mimeType);

      expect(result).toBe(mockTranscriptionResponse.text);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [
            { text: 'Transcribe the following audio recording clearly and accurately.' },
            {
              inlineData: {
                mimeType,
                data: audioBuffer.toString('base64'),
              },
            },
          ],
        }],
      });
    });

    it('should handle transcription errors', async () => {
      const audioBuffer = createTestAudioBuffer();
      
      mockGenerateContent.mockRejectedValueOnce(new Error('Gemini API error'));

      await expect(geminiService.transcribeAudio(audioBuffer, 'audio/webm'))
        .rejects.toThrow('Failed to transcribe audio: Gemini API error');
    });

    it('should handle empty response from Gemini', async () => {
      const audioBuffer = createTestAudioBuffer();
      
      mockGenerateContent.mockResolvedValueOnce({ text: null });

      await expect(geminiService.transcribeAudio(audioBuffer, 'audio/webm'))
        .rejects.toThrow('Failed to transcribe audio: No transcription received from Gemini');
    });

    it('should handle different mime types', async () => {
      const audioBuffer = createTestAudioBuffer();
      const mimeType = 'audio/mp3';
      
      mockGenerateContent.mockResolvedValueOnce(mockTranscriptionResponse);

      await geminiService.transcribeAudio(audioBuffer, mimeType);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: [{
            parts: [
              expect.any(Object),
              expect.objectContaining({
                inlineData: expect.objectContaining({
                  mimeType: 'audio/mp3',
                }),
              }),
            ],
          }],
        })
      );
    });
  });

  describe('extractFacts', () => {
    it('should successfully extract facts from transcript', async () => {
      const transcript = createTestTranscript();
      
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(mockExtractionResponse),
      });

      const result = await geminiService.extractFacts(transcript);

      expect(result).toEqual(mockExtractionResponse);
      expectValidExtractedFacts(result);
      
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: expect.stringContaining(transcript),
        config: {
          responseMimeType: 'application/json',
          responseSchema: expect.objectContaining({
            type: 'object',
            properties: expect.objectContaining({
              summary: expect.any(Object),
              companies: expect.any(Object),
              roles: expect.any(Object),
              projects: expect.any(Object),
              achievements: expect.any(Object),
              skills: expect.any(Object),
            }),
            required: ['summary', 'companies', 'roles', 'projects', 'achievements', 'skills'],
          }),
          temperature: 0.2,
        },
      });
    });

    it('should handle extraction errors', async () => {
      const transcript = createTestTranscript();
      
      mockGenerateContent.mockRejectedValueOnce(new Error('Gemini extraction failed'));

      await expect(geminiService.extractFacts(transcript))
        .rejects.toThrow('Failed to extract facts: Gemini extraction failed');
    });

    it('should handle empty response from Gemini', async () => {
      const transcript = createTestTranscript();
      
      mockGenerateContent.mockResolvedValueOnce({ text: null });

      await expect(geminiService.extractFacts(transcript))
        .rejects.toThrow('Failed to extract facts: No extraction response received from Gemini');
    });

    it('should handle invalid JSON response', async () => {
      const transcript = createTestTranscript();
      
      mockGenerateContent.mockResolvedValueOnce({
        text: 'invalid json response',
      });

      await expect(geminiService.extractFacts(transcript))
        .rejects.toThrow('Failed to extract facts:');
    });

    it('should validate response format', async () => {
      const transcript = createTestTranscript();
      
      // Return response missing required fields
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({ summary: null, companies: 'not an array' }),
      });

      await expect(geminiService.extractFacts(transcript))
        .rejects.toThrow('Failed to extract facts: Invalid response format from Gemini');
    });

    it('should include career coaching prompt', async () => {
      const transcript = createTestTranscript();
      
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(mockExtractionResponse),
      });

      await geminiService.extractFacts(transcript);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('act as a professional career coach');
      expect(callArgs.contents).toContain('job seeker trying to build their resume');
      expect(callArgs.contents).toContain(transcript);
    });
  });

  describe('error handling', () => {
    it('should handle unknown errors gracefully', async () => {
      const audioBuffer = createTestAudioBuffer();
      
      mockGenerateContent.mockRejectedValueOnce('Unknown error type');

      await expect(geminiService.transcribeAudio(audioBuffer, 'audio/webm'))
        .rejects.toThrow('Failed to transcribe audio: Unknown error');
    });

    it('should preserve original error messages', async () => {
      const transcript = createTestTranscript();
      const originalError = new Error('Specific Gemini error message');
      
      mockGenerateContent.mockRejectedValueOnce(originalError);

      await expect(geminiService.extractFacts(transcript))
        .rejects.toThrow('Failed to extract facts: Specific Gemini error message');
    });
  });
});