import express from 'express';
import { query } from '../models/db.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Create exports directory if it doesn't exist
const exportsDir = join(__dirname, '../../exports');
try {
  mkdirSync(exportsDir, { recursive: true });
} catch (err) {
  console.error('Failed to create exports directory:', err);
}

// Export meeting transcript as TXT
router.get('/:meetingId/transcript/txt', async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Get meeting details
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

    // Format transcript
    let content = `${meeting.title}\n`;
    content += `Date: ${new Date(meeting.created_at).toLocaleDateString()}\n`;
    content += `Duration: ${Math.floor(meeting.duration / 60)}:${String(meeting.duration % 60).padStart(2, '0')}\n\n`;
    content += '='.repeat(80) + '\n\n';

    transcriptsResult.rows.forEach(t => {
      const time = `${Math.floor(t.start_time / 60)}:${String(Math.floor(t.start_time % 60)).padStart(2, '0')}`;
      const speaker = t.speaker_name || t.speaker_label || 'Unknown';
      content += `[${time}] ${speaker}: ${t.text}\n\n`;
    });

    // Save export record
    await query(
      `INSERT INTO exports (meeting_id, user_id, export_type)
       VALUES ($1, $2, $3)`,
      [meetingId, meeting.user_id, 'transcript_txt']
    );

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${meeting.title.replace(/[^a-z0-9]/gi, '_')}_transcript.txt"`);
    res.send(content);
  } catch (error) {
    console.error('Export transcript error:', error);
    res.status(500).json({ error: 'Failed to export transcript' });
  }
});

// Export meeting summary as TXT
router.get('/:meetingId/summary/txt', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meetingResult = await query(
      'SELECT * FROM meetings WHERE id = $1',
      [meetingId]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meeting = meetingResult.rows[0];

    const summaryResult = await query(
      'SELECT * FROM summaries WHERE meeting_id = $1',
      [meetingId]
    );

    const actionItemsResult = await query(
      'SELECT * FROM action_items WHERE meeting_id = $1 ORDER BY priority DESC',
      [meetingId]
    );

    const decisionsResult = await query(
      'SELECT * FROM decisions WHERE meeting_id = $1 ORDER BY timestamp ASC',
      [meetingId]
    );

    let content = `${meeting.title}\n`;
    content += `Date: ${new Date(meeting.created_at).toLocaleDateString()}\n`;
    content += `Duration: ${Math.floor(meeting.duration / 60)}:${String(meeting.duration % 60).padStart(2, '0')}\n\n`;
    content += '='.repeat(80) + '\n\n';

    if (summaryResult.rows.length > 0) {
      const summary = summaryResult.rows[0];
      content += 'SUMMARY\n';
      content += '-'.repeat(80) + '\n';
      content += summary.summary_full || summary.summary_medium || summary.summary_short || 'No summary available';
      content += '\n\n';

      if (summary.topics) {
        const topics = typeof summary.topics === 'string' ? JSON.parse(summary.topics) : summary.topics;
        if (Array.isArray(topics) && topics.length > 0) {
          content += 'KEY TOPICS\n';
          content += '-'.repeat(80) + '\n';
          topics.forEach((topic, i) => {
            content += `${i + 1}. ${topic}\n`;
          });
          content += '\n';
        }
      }
    }

    if (actionItemsResult.rows.length > 0) {
      content += 'ACTION ITEMS\n';
      content += '-'.repeat(80) + '\n';
      actionItemsResult.rows.forEach((item, i) => {
        content += `${i + 1}. ${item.text}\n`;
        if (item.assignee) content += `   Assignee: ${item.assignee}\n`;
        if (item.due_date) content += `   Due: ${item.due_date}\n`;
        content += `   Priority: ${item.priority}\n`;
        content += `   Status: ${item.status}\n\n`;
      });
    }

    if (decisionsResult.rows.length > 0) {
      content += 'KEY DECISIONS\n';
      content += '-'.repeat(80) + '\n';
      decisionsResult.rows.forEach((decision, i) => {
        content += `${i + 1}. ${decision.decision_text}\n`;
        if (decision.reasoning) content += `   Reasoning: ${decision.reasoning}\n`;
        if (decision.made_by) content += `   Made by: ${decision.made_by}\n`;
        content += '\n';
      });
    }

    await query(
      `INSERT INTO exports (meeting_id, user_id, export_type)
       VALUES ($1, $2, $3)`,
      [meetingId, meeting.user_id, 'summary_txt']
    );

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${meeting.title.replace(/[^a-z0-9]/gi, '_')}_summary.txt"`);
    res.send(content);
  } catch (error) {
    console.error('Export summary error:', error);
    res.status(500).json({ error: 'Failed to export summary' });
  }
});

// Get export history
router.get('/history', async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;

    let queryText = `
      SELECT e.*, m.title as meeting_title
      FROM exports e
      JOIN meetings m ON e.meeting_id = m.id
    `;

    const params = [];

    if (userId) {
      queryText += ' WHERE e.user_id = $1';
      params.push(userId);
    }

    queryText += ' ORDER BY e.created_at DESC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit));

    const result = await query(queryText, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get export history error:', error);
    res.status(500).json({ error: 'Failed to fetch export history' });
  }
});

export default router;
