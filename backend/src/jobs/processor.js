import { query } from '../models/db.js';
import { transcribeAudio } from '../services/transcription.js';
import { diarizeAudio } from '../services/diarization.js';
import { analyzeWithAI } from '../services/ai-analysis.js';
import { generateEmbeddings } from '../services/embeddings.js';

/**
 * Main processing pipeline for meeting files
 * Steps:
 * 1. Update status to 'processing'
 * 2. Transcribe audio (Whisper)
 * 3. Diarize speakers (pyannote.audio or simulated)
 * 4. Analyze with AI (Gemini - extract action items, decisions, summary)
 * 5. Generate embeddings for search (Sentence Transformers)
 * 6. Update status to 'completed'
 */
export async function processMeetingFile(jobData) {
  const { meetingId, filePath, fileName, fileType } = jobData;

  console.log(`Starting processing for meeting ${meetingId}`);

  try {
    // Step 1: Update status to processing
    await updateMeetingStatus(meetingId, 'processing');

    // Step 2: Transcribe audio
    console.log(`Transcribing audio for meeting ${meetingId}...`);
    await updateMeetingStatus(meetingId, 'transcribing');

    const transcription = await transcribeAudio(filePath, fileType);

    console.log(`Transcription complete. Text length: ${transcription.text?.length || 0}`);

    // Step 3: Speaker diarization
    console.log(`Performing speaker diarization for meeting ${meetingId}...`);
    const diarization = await diarizeAudio(filePath, transcription);

    // Save speakers
    const speakerMap = await saveSpeakers(meetingId, diarization.speakers);

    // Save transcripts with speaker info
    await saveTranscripts(meetingId, diarization.segments, speakerMap);

    // Update meeting duration
    if (transcription.duration) {
      await query(
        'UPDATE meetings SET duration = $1 WHERE id = $2',
        [Math.round(transcription.duration), meetingId]
      );
    }

    // Step 4: AI Analysis
    console.log(`Analyzing meeting with AI for meeting ${meetingId}...`);
    await updateMeetingStatus(meetingId, 'analyzing');

    const analysis = await analyzeWithAI(meetingId, {
      transcription: diarization.segments,
      speakers: diarization.speakers,
    });

    // Save AI analysis results
    await saveAnalysisResults(meetingId, analysis);

    // Step 5: Generate embeddings for search
    console.log(`Generating embeddings for meeting ${meetingId}...`);
    await generateEmbeddings(meetingId, diarization.segments);

    // Step 6: Mark as completed
    await updateMeetingStatus(meetingId, 'completed');
    await query(
      'UPDATE meetings SET processed_at = NOW() WHERE id = $1',
      [meetingId]
    );

    console.log(`✅ Successfully processed meeting ${meetingId}`);

    return { success: true, meetingId };
  } catch (error) {
    console.error(`Failed to process meeting ${meetingId}:`, error);

    // Update status to failed
    await query(
      'UPDATE meetings SET status = $1, error_message = $2 WHERE id = $3',
      ['failed', error.message, meetingId]
    );

    throw error;
  }
}

async function updateMeetingStatus(meetingId, status) {
  await query(
    'UPDATE meetings SET status = $1 WHERE id = $2',
    [status, meetingId]
  );
}

async function saveSpeakers(meetingId, speakers) {
  const speakerMap = new Map();

  for (const speaker of speakers) {
    const result = await query(
      `INSERT INTO speakers (meeting_id, label, custom_name, talk_time)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [meetingId, speaker.label, speaker.label, speaker.talkTime || 0]
    );

    speakerMap.set(speaker.label, result.rows[0].id);
  }

  return speakerMap;
}

async function saveTranscripts(meetingId, segments, speakerMap) {
  for (const segment of segments) {
    const speakerId = speakerMap.get(segment.speaker);

    await query(
      `INSERT INTO transcripts (meeting_id, speaker_id, text, start_time, end_time, confidence)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        meetingId,
        speakerId,
        segment.text,
        segment.start,
        segment.end,
        segment.confidence || 0.95,
      ]
    );
  }
}

async function saveAnalysisResults(meetingId, analysis) {
  // Save action items
  if (analysis.actionItems && analysis.actionItems.length > 0) {
    for (const item of analysis.actionItems) {
      await query(
        `INSERT INTO action_items (meeting_id, text, assignee, due_date, priority, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          meetingId,
          item.task || item.text,
          item.assignee,
          item.dueDate || null,
          item.priority || 'medium',
          item.timestamp || null,
        ]
      );
    }
  }

  // Save decisions
  if (analysis.decisions && analysis.decisions.length > 0) {
    for (const decision of analysis.decisions) {
      await query(
        `INSERT INTO decisions (meeting_id, decision_text, reasoning, made_by, timestamp)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          meetingId,
          decision.decision || decision.text,
          decision.reasoning,
          decision.madeBy || decision.decidedBy,
          decision.timestamp || null,
        ]
      );
    }
  }

  // Save summary
  if (analysis.summary) {
    await query(
      `INSERT INTO summaries (meeting_id, summary_short, summary_medium, summary_full, topics)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        meetingId,
        analysis.summary.short,
        analysis.summary.medium,
        analysis.summary.full,
        analysis.summary.topics || [],
      ]
    );
  }

  // Save sentiment analysis
  if (analysis.sentiment) {
    await query(
      `INSERT INTO sentiment_analysis (meeting_id, overall_sentiment, timeline, tension_points, speaker_sentiment)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        meetingId,
        analysis.sentiment.overall || 'neutral',
        JSON.stringify(analysis.sentiment.timeline || []),
        JSON.stringify(analysis.sentiment.tensionPoints || []),
        JSON.stringify(analysis.sentiment.speakers || {}),
      ]
    );
  }
}
