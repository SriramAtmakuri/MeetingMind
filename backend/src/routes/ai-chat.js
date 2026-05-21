import express from 'express';
import { query } from '../models/db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { validate, schemas } from '../middleware/validate.js';

dotenv.config();

const router = express.Router();

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Chat with meeting data
router.post('/:meetingId/chat', validate(schemas.aiChat), async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Get meeting data
    const meetingResult = await query(
      'SELECT * FROM meetings WHERE id = $1',
      [meetingId]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meeting = meetingResult.rows[0];

    // Get transcripts
    const transcriptsResult = await query(
      `SELECT t.*, s.custom_name as speaker_name, s.label as speaker_label
       FROM transcripts t
       LEFT JOIN speakers s ON t.speaker_id = s.id
       WHERE t.meeting_id = $1
       ORDER BY t.start_time ASC`,
      [meetingId]
    );

    // Get action items
    const actionItemsResult = await query(
      'SELECT * FROM action_items WHERE meeting_id = $1',
      [meetingId]
    );

    // Get decisions
    const decisionsResult = await query(
      'SELECT * FROM decisions WHERE meeting_id = $1',
      [meetingId]
    );

    // Get summary
    const summaryResult = await query(
      'SELECT * FROM summaries WHERE meeting_id = $1',
      [meetingId]
    );

    if (!genAI) {
      // Return mock response if no API key
      return res.json({
        answer: "I'm a mock AI assistant. To enable real AI chat, please add your GEMINI_API_KEY to the backend .env file. I can help answer questions about your meeting like:\n\n- What were the main decisions?\n- Who was assigned which tasks?\n- What topics were discussed?\n- When did we talk about [specific topic]?",
        sources: []
      });
    }

    // Build context for AI
    const transcript = transcriptsResult.rows.map(t => {
      const speaker = t.speaker_name || t.speaker_label || 'Unknown';
      return `[${Math.floor(t.start_time / 60)}:${String(Math.floor(t.start_time % 60)).padStart(2, '0')}] ${speaker}: ${t.text}`;
    }).join('\n');

    const actionItems = actionItemsResult.rows.map((a, i) =>
      `${i + 1}. ${a.text} (Assignee: ${a.assignee || 'Unassigned'}, Status: ${a.status})`
    ).join('\n');

    const decisions = decisionsResult.rows.map((d, i) =>
      `${i + 1}. ${d.decision_text} (Made by: ${d.made_by || 'Unknown'})`
    ).join('\n');

    const summary = summaryResult.rows[0]?.summary_full || 'No summary available';

    const context = `
Meeting Title: ${meeting.title}
Date: ${new Date(meeting.created_at).toLocaleDateString()}

Summary:
${summary}

${actionItems ? `Action Items:\n${actionItems}\n` : ''}
${decisions ? `Key Decisions:\n${decisions}\n` : ''}

Full Transcript:
${transcript}
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a helpful AI assistant analyzing a meeting. Answer the following question based on the meeting data provided.

${context}

Question: ${question}

Provide a clear, concise answer. If you reference specific information, mention the timestamp or speaker if available.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    res.json({
      answer,
      meetingTitle: meeting.title,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// Search across all meetings with AI
router.post('/search-all', async (req, res) => {
  try {
    const { question, userId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Get all user meetings with summaries
    const meetingsResult = await query(
      `SELECT
        m.id,
        m.title,
        m.created_at,
        s.summary_short,
        s.topics
       FROM meetings m
       LEFT JOIN summaries s ON m.id = s.meeting_id
       WHERE m.user_id = $1 AND m.status = 'completed'
       ORDER BY m.created_at DESC
       LIMIT 20`,
      [userId || '00000000-0000-0000-0000-000000000000']
    );

    if (!genAI) {
      return res.json({
        answer: "AI search is not available. Please add GEMINI_API_KEY to enable this feature.",
        relevantMeetings: []
      });
    }

    const meetingsContext = meetingsResult.rows.map(m => {
      const topics = m.topics ? (typeof m.topics === 'string' ? JSON.parse(m.topics) : m.topics) : [];
      return `Meeting: ${m.title}
Date: ${new Date(m.created_at).toLocaleDateString()}
Summary: ${m.summary_short || 'No summary'}
Topics: ${Array.isArray(topics) ? topics.join(', ') : 'None'}
ID: ${m.id}`;
    }).join('\n\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a helpful AI assistant analyzing multiple meetings. Answer the following question based on the meetings data provided.

Meetings:
${meetingsContext}

Question: ${question}

Provide a clear, concise answer. Mention which meeting(s) contain relevant information.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    res.json({
      answer,
      relevantMeetings: meetingsResult.rows.map(m => ({
        id: m.id,
        title: m.title,
        date: m.created_at
      }))
    });
  } catch (error) {
    console.error('AI search all error:', error);
    res.status(500).json({ error: 'Failed to process search request' });
  }
});

export default router;
