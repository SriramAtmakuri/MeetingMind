import { describe, it, expect, beforeEach, vi } from 'vitest';
import audioProcessor from '../audioProcessor.js';
import fs from 'fs';
import path from 'path';

describe('AudioProcessor', () => {
  describe('validateAudioFile', () => {
    it('should validate a valid audio file', () => {
      const mockFile = {
        originalname: 'test.mp3',
        size: 5 * 1024 * 1024, // 5MB
        mimetype: 'audio/mpeg'
      };

      const result = audioProcessor.validateAudioFile(mockFile);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata.format).toBe('.mp3');
      expect(result.metadata.sizeMB).toBe('5.00');
    });

    it('should reject file that is too large', () => {
      const mockFile = {
        originalname: 'large.mp3',
        size: 150 * 1024 * 1024, // 150MB
        mimetype: 'audio/mpeg'
      };

      const result = audioProcessor.validateAudioFile(mockFile);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File too large. Maximum size: 100MB');
    });

    it('should reject unsupported file format', () => {
      const mockFile = {
        originalname: 'test.txt',
        size: 1 * 1024 * 1024,
        mimetype: 'text/plain'
      };

      const result = audioProcessor.validateAudioFile(mockFile);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Unsupported format');
    });

    it('should accept all supported audio formats', () => {
      const formats = ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.flac'];

      formats.forEach(ext => {
        const mockFile = {
          originalname: `test${ext}`,
          size: 5 * 1024 * 1024,
          mimetype: 'audio/mpeg'
        };

        const result = audioProcessor.validateAudioFile(mockFile);
        expect(result.valid).toBe(true);
      });
    });

    it('should handle missing file', () => {
      const result = audioProcessor.validateAudioFile(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No file provided');
    });
  });

  describe('extractMetadata', () => {
    it('should extract metadata from file', async () => {
      // Create a temporary test file
      const testFilePath = path.join(process.cwd(), 'test-audio.mp3');
      fs.writeFileSync(testFilePath, 'fake audio content');

      const metadata = await audioProcessor.extractMetadata(testFilePath);

      expect(metadata).toHaveProperty('duration');
      expect(metadata).toHaveProperty('format');
      expect(metadata).toHaveProperty('size');
      expect(metadata.format).toBe('mp3');
      expect(typeof metadata.duration).toBe('number');

      // Cleanup
      fs.unlinkSync(testFilePath);
    });

    it('should throw error for non-existent file', async () => {
      await expect(
        audioProcessor.extractMetadata('/nonexistent/file.mp3')
      ).rejects.toThrow();
    });
  });

  describe('transcribeAudio', () => {
    it('should generate transcription with segments', async () => {
      const testFilePath = 'test.mp3';
      const result = await audioProcessor.transcribeAudio(testFilePath);

      expect(result.success).toBe(true);
      expect(result.transcript).toHaveProperty('text');
      expect(result.transcript).toHaveProperty('confidence');
      expect(result.transcript).toHaveProperty('segments');
      expect(result.transcript.segments).toBeInstanceOf(Array);
      expect(result.transcript.segments.length).toBeGreaterThan(0);
      expect(result.transcript.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.transcript.confidence).toBeLessThanOrEqual(0.99);
    });

    it('should include speaker information when enabled', async () => {
      const result = await audioProcessor.transcribeAudio('test.mp3', {
        speakerDiarization: true
      });

      expect(result.transcript.segments[0]).toHaveProperty('speaker');
      expect(result.transcript.segments[0].speaker).toBeTruthy();
    });

    it('should not include speaker information when disabled', async () => {
      const result = await audioProcessor.transcribeAudio('test.mp3', {
        speakerDiarization: false
      });

      expect(result.transcript.segments[0].speaker).toBeNull();
    });
  });

  describe('analyzeSentiment', () => {
    it('should analyze sentiment of transcript', async () => {
      const transcript = 'This is a great meeting with positive outcomes.';
      const sentiment = await audioProcessor.analyzeSentiment(transcript);

      expect(sentiment).toHaveProperty('overall');
      expect(sentiment).toHaveProperty('score');
      expect(sentiment).toHaveProperty('breakdown');
      expect(['positive', 'neutral', 'negative']).toContain(sentiment.overall);
      expect(sentiment.breakdown).toHaveProperty('positive');
      expect(sentiment.breakdown).toHaveProperty('neutral');
      expect(sentiment.breakdown).toHaveProperty('negative');
    });
  });

  describe('extractInsights', () => {
    it('should extract insights from transcript', async () => {
      const transcript = 'We need to complete the project by Friday and schedule a follow-up meeting.';
      const insights = await audioProcessor.extractInsights(transcript);

      expect(insights).toHaveProperty('actionItems');
      expect(insights).toHaveProperty('topics');
      expect(insights).toHaveProperty('keyDecisions');
      expect(insights).toHaveProperty('participants');
      expect(insights.actionItems).toBeInstanceOf(Array);
      expect(insights.topics).toBeInstanceOf(Array);
      expect(insights.keyDecisions).toBeInstanceOf(Array);
      expect(insights.participants).toBeInstanceOf(Array);
    });
  });

  describe('processAudioFile', () => {
    it('should process complete audio file successfully', async () => {
      // Create a temporary test file
      const testFilePath = path.join(process.cwd(), 'test-upload.mp3');
      fs.writeFileSync(testFilePath, 'fake audio content');

      const mockFile = {
        originalname: 'meeting-recording.mp3',
        size: 5 * 1024 * 1024,
        mimetype: 'audio/mpeg',
        path: testFilePath
      };

      const result = await audioProcessor.processAudioFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('transcription');
      expect(result.data).toHaveProperty('sentiment');
      expect(result.data).toHaveProperty('insights');
      expect(result.data).toHaveProperty('metadata');
      expect(result.data.status).toBe('processed');

      // File should be cleaned up after processing
      expect(fs.existsSync(testFilePath)).toBe(false);
    });

    it('should handle invalid file gracefully', async () => {
      const mockFile = {
        originalname: 'invalid.txt',
        size: 1 * 1024 * 1024,
        mimetype: 'text/plain',
        path: '/nonexistent/file.txt'
      };

      const result = await audioProcessor.processAudioFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should clean up file even on error', async () => {
      const testFilePath = path.join(process.cwd(), 'test-error.mp3');
      fs.writeFileSync(testFilePath, 'fake audio content');

      const mockFile = {
        originalname: 'invalid.txt',
        size: 1 * 1024 * 1024,
        mimetype: 'text/plain',
        path: testFilePath
      };

      await audioProcessor.processAudioFile(mockFile);

      // File should be cleaned up even after error
      expect(fs.existsSync(testFilePath)).toBe(false);
    });
  });

  describe('getProcessingStatus', () => {
    it('should return processing status for a job', () => {
      const jobId = 'test-job-123';
      const status = audioProcessor.getProcessingStatus(jobId);

      expect(status).toHaveProperty('jobId');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('progress');
      expect(status.jobId).toBe(jobId);
    });
  });
});
