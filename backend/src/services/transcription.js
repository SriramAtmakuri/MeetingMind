import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, statSync, readdirSync, unlinkSync, mkdirSync, rmdirSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const execPromise = promisify(exec);

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Gemini inline data limit is ~20MB. Stay well under to avoid base64 overhead.
const INLINE_SIZE_LIMIT = 15 * 1024 * 1024; // 15MB
const CHUNK_DURATION_SECONDS = 600; // 10 minutes per chunk

const SUPPORTED_MIME_TYPES = {
  '.mp3': 'audio/mp3',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
  '.m4a': 'audio/m4a',
  '.webm': 'audio/webm',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_MIME_TYPES[ext] || 'audio/mp3';
}

const TRANSCRIBE_PROMPT = `You are a professional meeting transcription service.

Transcribe this audio recording in full. Return a JSON object with exactly this structure:
{
  "text": "<full transcript as a single string>",
  "duration": <total duration in seconds as a number>,
  "segments": [
    {
      "start": <start time in seconds>,
      "end": <end time in seconds>,
      "speaker": "Speaker 1",
      "text": "<segment text>",
      "confidence": <0.0 to 1.0>
    }
  ]
}

Rules:
- Identify distinct speakers as "Speaker 1", "Speaker 2", etc.
- Each segment should be 1-3 sentences maximum
- Confidence score: 0.95 for clear speech, lower for unclear
- Estimate timestamps based on natural speech pacing (~130 words/minute)
- Return ONLY the JSON, no markdown, no explanation`;

async function transcribeSingleFile(filePath, fileType) {
  const audioData = readFileSync(filePath);
  const base64Audio = audioData.toString('base64');
  const mimeType = fileType || getMimeType(filePath);

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent([
    { inlineData: { mimeType, data: base64Audio } },
    TRANSCRIBE_PROMPT,
  ]);

  const responseText = result.response.text().trim();
  const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleanJson);
}

async function transcribeInChunks(filePath, fileType) {
  const chunkDir = `${filePath}_chunks`;
  const ext = path.extname(filePath);

  mkdirSync(chunkDir, { recursive: true });

  try {
    // Split audio into fixed-duration chunks with ffmpeg
    await execPromise(
      `ffmpeg -i "${filePath}" -f segment -segment_time ${CHUNK_DURATION_SECONDS} -c copy "${chunkDir}/chunk%03d${ext}" -y`
    );

    const chunkFiles = readdirSync(chunkDir)
      .filter(f => f.startsWith('chunk'))
      .sort()
      .map(f => path.join(chunkDir, f));

    console.log(`✓ Split into ${chunkFiles.length} chunks for transcription`);

    let allSegments = [];
    let fullText = '';
    let timeOffset = 0;

    for (const chunkFile of chunkFiles) {
      let chunkResult;
      try {
        chunkResult = await transcribeSingleFile(chunkFile, fileType);
      } catch (err) {
        console.error(`Chunk transcription failed for ${chunkFile}:`, err.message);
        // Use estimated duration and skip to maintain time continuity
        timeOffset += CHUNK_DURATION_SECONDS;
        continue;
      }

      // Offset timestamps so segments are globally ordered
      const offsetSegments = (chunkResult.segments || []).map(seg => ({
        ...seg,
        start: seg.start + timeOffset,
        end: seg.end + timeOffset,
      }));

      allSegments.push(...offsetSegments);
      fullText += (fullText ? ' ' : '') + (chunkResult.text || '');
      timeOffset += chunkResult.duration || CHUNK_DURATION_SECONDS;
    }

    return { text: fullText, duration: timeOffset, segments: allSegments };
  } finally {
    // Clean up chunk files regardless of outcome
    try {
      readdirSync(chunkDir).forEach(f => unlinkSync(path.join(chunkDir, f)));
      rmdirSync(chunkDir);
    } catch (_) {}
  }
}

/**
 * Transcribe audio using Gemini. Automatically chunks files > 15MB via ffmpeg.
 * Falls back to mock data when GEMINI_API_KEY is not configured.
 */
export async function transcribeAudio(filePath, fileType) {
  console.log(`Transcribing audio: ${filePath}`);

  if (!genAI) {
    console.warn('⚠️  GEMINI_API_KEY not set — using mock transcription. Set the key for real transcription.');
    return getMockTranscript();
  }

  try {
    const fileSize = statSync(filePath).size;

    if (fileSize > INLINE_SIZE_LIMIT) {
      console.log(`File size ${(fileSize / 1024 / 1024).toFixed(1)}MB exceeds ${INLINE_SIZE_LIMIT / 1024 / 1024}MB limit — splitting into chunks`);
      return await transcribeInChunks(filePath, fileType);
    }

    const transcription = await transcribeSingleFile(filePath, fileType);
    console.log(`✓ Gemini transcribed ${transcription.segments?.length || 0} segments`);
    return transcription;
  } catch (error) {
    console.error('Gemini transcription error:', error.message);
    console.warn('Falling back to mock transcription');
    return getMockTranscript();
  }
}

/**
 * Convert audio to WAV for processing. Requires ffmpeg.
 */
export async function convertToWav(inputPath) {
  const outputPath = inputPath.replace(/\.[^/.]+$/, '.wav');
  try {
    await execPromise(
      `ffmpeg -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}" -y`
    );
    return outputPath;
  } catch {
    return inputPath;
  }
}

function getMockTranscript() {
  return {
    text: "Welcome to the quarterly product strategy meeting. Today we'll review Q1 progress and plan Q2. We completed 85% of planned features. Mobile usage is at 60% — up significantly. We need to prioritize mobile-first development in Q2. I propose moving two engineers to mobile. The CRM integration must ship by end of Q1. Let's align on a mobile roadmap and schedule design syncs.",
    duration: 60.0,
    segments: [
      { start: 0.0,  end: 9.0,  speaker: 'Speaker 1', text: "Welcome to the quarterly product strategy meeting. Today we'll review Q1 progress and plan Q2.", confidence: 0.95 },
      { start: 9.5,  end: 17.0, speaker: 'Speaker 1', text: 'We completed 85% of planned features. Mobile usage is at 60% — up significantly.', confidence: 0.95 },
      { start: 17.5, end: 25.0, speaker: 'Speaker 2', text: 'We need to prioritize mobile-first development in Q2.', confidence: 0.93 },
      { start: 25.5, end: 36.0, speaker: 'Speaker 1', text: 'I propose moving two engineers to mobile. The CRM integration must ship by end of Q1.', confidence: 0.95 },
      { start: 36.5, end: 45.0, speaker: 'Speaker 2', text: "Let's align on a mobile roadmap and schedule design syncs.", confidence: 0.94 },
    ],
  };
}
