import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { interviewRouter } from './interviewRouter.js';
import { 
  mockTranscriptionResponse, 
  mockExtractionResponse, 
  createMockFile,
  createTestTranscript,
  expectServiceResponse,
  expectValidExtractedFacts 
} from '../../test/helpers.js';

// Mock the Gemini service
vi.mock('@/services/geminiService.js', () => ({
  geminiService: {
    transcribeAudio: vi.fn(),
    extractFacts: vi.fn(),
  },
}));

describe('Interview Router', () => {
  let app: express.Application;
  let mockGeminiService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/api/interview', interviewRouter);
    
    // Get the mocked gemini service
    const { geminiService } = await import('@/services/geminiService.js');
    mockGeminiService = geminiService;
  });

  describe('POST /transcribe', () => {
    it('should transcribe audio successfully', async () => {
      mockGeminiService.transcribeAudio.mockResolvedValueOnce(mockTranscriptionResponse.text);

      const response = await request(app)
        .post('/api/interview/transcribe')
        .attach('audio', Buffer.from('mock audio data'), 'test-audio.webm')
        .expect(200);

      expectServiceResponse(response.body, true);
      expect(response.body.message).toBe('Audio transcribed successfully');
      expect(response.body.responseObject.transcript).toBe(mockTranscriptionResponse.text);
      
      expect(mockGeminiService.transcribeAudio).toHaveBeenCalledWith(
        expect.any(Buffer),
        'audio/webm'
      );
    });

    it('should return 400 when no audio file is provided', async () => {
      const response = await request(app)
        .post('/api/interview/transcribe')
        .expect(400);

      expectServiceResponse(response.body, false);
      expect(response.body.message).toBe('No audio file provided');
      expect(mockGeminiService.transcribeAudio).not.toHaveBeenCalled();
    });

    it('should handle transcription errors', async () => {
      mockGeminiService.transcribeAudio.mockRejectedValueOnce(
        new Error('Gemini transcription failed')
      );

      const response = await request(app)
        .post('/api/interview/transcribe')
        .attach('audio', Buffer.from('mock audio data'), 'test-audio.webm')
        .expect(500);

      expectServiceResponse(response.body, false);
      expect(response.body.message).toBe('Failed to transcribe audio');
    });

    it('should handle different audio mime types', async () => {
      mockGeminiService.transcribeAudio.mockResolvedValueOnce(mockTranscriptionResponse.text);

      await request(app)
        .post('/api/interview/transcribe')
        .attach('audio', Buffer.from('mock audio data'), {
          filename: 'test-audio.mp3',
          contentType: 'audio/mp3',
        })
        .expect(200);

      expect(mockGeminiService.transcribeAudio).toHaveBeenCalledWith(
        expect.any(Buffer),
        'audio/mp3'
      );
    });

    it('should respect file size limits', async () => {
      const largeBuffer = Buffer.alloc(15 * 1024 * 1024); // 15MB (over 10MB limit)
      
      const response = await request(app)
        .post('/api/interview/transcribe')
        .attach('audio', largeBuffer, 'large-audio.webm')
        .expect(413); // Payload too large

      expect(mockGeminiService.transcribeAudio).not.toHaveBeenCalled();
    });
  });

  describe('POST /extract', () => {
    it('should extract facts successfully', async () => {
      const transcript = createTestTranscript();
      mockGeminiService.extractFacts.mockResolvedValueOnce(mockExtractionResponse);

      const response = await request(app)
        .post('/api/interview/extract')
        .send({ transcript })
        .expect(200);

      expectServiceResponse(response.body, true);
      expect(response.body.message).toBe('Facts extracted successfully');
      expectValidExtractedFacts(response.body.responseObject);
      
      expect(mockGeminiService.extractFacts).toHaveBeenCalledWith(transcript);
    });

    it('should return 400 when no transcript is provided', async () => {
      const response = await request(app)
        .post('/api/interview/extract')
        .send({})
        .expect(400);

      expectServiceResponse(response.body, false);
      expect(response.body.message).toBe('No transcript provided or invalid format');
      expect(mockGeminiService.extractFacts).not.toHaveBeenCalled();
    });

    it('should return 400 when transcript is not a string', async () => {
      const response = await request(app)
        .post('/api/interview/extract')
        .send({ transcript: 123 })
        .expect(400);

      expectServiceResponse(response.body, false);
      expect(response.body.message).toBe('No transcript provided or invalid format');
      expect(mockGeminiService.extractFacts).not.toHaveBeenCalled();
    });

    it('should return 400 when transcript is empty string', async () => {
      const response = await request(app)
        .post('/api/interview/extract')
        .send({ transcript: '' })
        .expect(400);

      expectServiceResponse(response.body, false);
      expect(response.body.message).toBe('No transcript provided or invalid format');
      expect(mockGeminiService.extractFacts).not.toHaveBeenCalled();
    });

    it('should handle extraction errors', async () => {
      const transcript = createTestTranscript();
      mockGeminiService.extractFacts.mockRejectedValueOnce(
        new Error('Gemini extraction failed')
      );

      const response = await request(app)
        .post('/api/interview/extract')
        .send({ transcript })
        .expect(500);

      expectServiceResponse(response.body, false);
      expect(response.body.message).toBe('Failed to extract facts from transcript');
    });

    it('should handle long transcripts', async () => {
      const longTranscript = 'A'.repeat(10000); // Very long transcript
      mockGeminiService.extractFacts.mockResolvedValueOnce(mockExtractionResponse);

      const response = await request(app)
        .post('/api/interview/extract')
        .send({ transcript: longTranscript })
        .expect(200);

      expect(mockGeminiService.extractFacts).toHaveBeenCalledWith(longTranscript);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete transcription -> extraction workflow', async () => {
      // First transcribe
      mockGeminiService.transcribeAudio.mockResolvedValueOnce(mockTranscriptionResponse.text);

      const transcribeResponse = await request(app)
        .post('/api/interview/transcribe')
        .attach('audio', Buffer.from('mock audio data'), 'test-audio.webm')
        .expect(200);

      const transcript = transcribeResponse.body.responseObject.transcript;

      // Then extract
      mockGeminiService.extractFacts.mockResolvedValueOnce(mockExtractionResponse);

      const extractResponse = await request(app)
        .post('/api/interview/extract')
        .send({ transcript })
        .expect(200);

      expectServiceResponse(extractResponse.body, true);
      expectValidExtractedFacts(extractResponse.body.responseObject);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle malformed audio files', async () => {
      mockGeminiService.transcribeAudio.mockRejectedValueOnce(
        new Error('Invalid audio format')
      );

      const response = await request(app)
        .post('/api/interview/transcribe')
        .attach('audio', Buffer.from('not actual audio data'), 'fake.webm')
        .expect(500);

      expectServiceResponse(response.body, false);
    });

    it('should handle network errors to Gemini API', async () => {
      mockGeminiService.transcribeAudio.mockRejectedValueOnce(
        new Error('Network error: Connection timeout')
      );

      const response = await request(app)
        .post('/api/interview/transcribe')
        .attach('audio', Buffer.from('mock audio data'), 'test-audio.webm')
        .expect(500);

      expectServiceResponse(response.body, false);
    });
  });
});