import express from 'express';
import { query } from '../models/db.js';

const router = express.Router();

// Compare two meetings
router.post('/', async (req, res) => {
  try {
    const { userId, meetingId1, meetingId2 } = req.body;

    if (!meetingId1 || !meetingId2) {
      return res.status(400).json({ error: 'Two meeting IDs are required' });
    }

    // Get both meetings
    const [meeting1Result, meeting2Result] = await Promise.all([
      query('SELECT * FROM meetings WHERE id = $1', [meetingId1]),
      query('SELECT * FROM meetings WHERE id = $1', [meetingId2])
    ]);

    if (meeting1Result.rows.length === 0 || meeting2Result.rows.length === 0) {
      return res.status(404).json({ error: 'One or both meetings not found' });
    }

    const meeting1 = meeting1Result.rows[0];
    const meeting2 = meeting2Result.rows[0];

    // Get speakers for both meetings
    const [speakers1Result, speakers2Result] = await Promise.all([
      query('SELECT * FROM speakers WHERE meeting_id = $1', [meetingId1]),
      query('SELECT * FROM speakers WHERE meeting_id = $1', [meetingId2])
    ]);

    // Get action items
    const [actionItems1Result, actionItems2Result] = await Promise.all([
      query('SELECT * FROM action_items WHERE meeting_id = $1', [meetingId1]),
      query('SELECT * FROM action_items WHERE meeting_id = $1', [meetingId2])
    ]);

    // Get decisions
    const [decisions1Result, decisions2Result] = await Promise.all([
      query('SELECT * FROM decisions WHERE meeting_id = $1', [meetingId1]),
      query('SELECT * FROM decisions WHERE meeting_id = $1', [meetingId2])
    ]);

    // Get summaries
    const [summary1Result, summary2Result] = await Promise.all([
      query('SELECT * FROM summaries WHERE meeting_id = $1', [meetingId1]),
      query('SELECT * FROM summaries WHERE meeting_id = $1', [meetingId2])
    ]);

    // Get sentiment
    const [sentiment1Result, sentiment2Result] = await Promise.all([
      query('SELECT * FROM sentiment_analysis WHERE meeting_id = $1', [meetingId1]),
      query('SELECT * FROM sentiment_analysis WHERE meeting_id = $1', [meetingId2])
    ]);

    const comparisonData = {
      meeting1: {
        ...meeting1,
        speakersCount: speakers1Result.rows.length,
        actionItemsCount: actionItems1Result.rows.length,
        decisionsCount: decisions1Result.rows.length,
        summary: summary1Result.rows[0] || null,
        sentiment: sentiment1Result.rows[0] || null,
        speakers: speakers1Result.rows,
        actionItems: actionItems1Result.rows,
        decisions: decisions1Result.rows
      },
      meeting2: {
        ...meeting2,
        speakersCount: speakers2Result.rows.length,
        actionItemsCount: actionItems2Result.rows.length,
        decisionsCount: decisions2Result.rows.length,
        summary: summary2Result.rows[0] || null,
        sentiment: sentiment2Result.rows[0] || null,
        speakers: speakers2Result.rows,
        actionItems: actionItems2Result.rows,
        decisions: decisions2Result.rows
      },
      insights: {
        durationDiff: Math.abs(meeting1.duration - meeting2.duration),
        speakersDiff: speakers1Result.rows.length - speakers2Result.rows.length,
        actionItemsDiff: actionItems1Result.rows.length - actionItems2Result.rows.length,
        decisionsDiff: decisions1Result.rows.length - decisions2Result.rows.length,
        timeDiff: Math.abs(new Date(meeting1.created_at) - new Date(meeting2.created_at)) / (1000 * 60 * 60 * 24) // days
      }
    };

    // Save comparison
    const result = await query(
      `INSERT INTO meeting_comparisons (user_id, meeting_id_1, meeting_id_2, comparison_data)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        userId || '00000000-0000-0000-0000-000000000000',
        meetingId1,
        meetingId2,
        JSON.stringify(comparisonData)
      ]
    );

    res.json({
      comparisonId: result.rows[0].id,
      ...comparisonData
    });
  } catch (error) {
    console.error('Compare meetings error:', error);
    res.status(500).json({ error: 'Failed to compare meetings' });
  }
});

// Get comparison history
router.get('/history', async (req, res) => {
  try {
    const { userId, limit = 20 } = req.query;

    const queryText = `
      SELECT
        mc.*,
        m1.title as meeting1_title,
        m2.title as meeting2_title
      FROM meeting_comparisons mc
      JOIN meetings m1 ON mc.meeting_id_1 = m1.id
      JOIN meetings m2 ON mc.meeting_id_2 = m2.id
      ${userId ? 'WHERE mc.user_id = $1' : ''}
      ORDER BY mc.created_at DESC
      LIMIT $${userId ? 2 : 1}
    `;

    const params = userId ? [userId, parseInt(limit)] : [parseInt(limit)];
    const result = await query(queryText, params);

    res.json(result.rows.map(row => ({
      ...row,
      comparison_data: typeof row.comparison_data === 'string' ? JSON.parse(row.comparison_data) : row.comparison_data
    })));
  } catch (error) {
    console.error('Get comparison history error:', error);
    res.status(500).json({ error: 'Failed to fetch comparison history' });
  }
});

// Get specific comparison
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
        mc.*,
        m1.title as meeting1_title,
        m2.title as meeting2_title
       FROM meeting_comparisons mc
       JOIN meetings m1 ON mc.meeting_id_1 = m1.id
       JOIN meetings m2 ON mc.meeting_id_2 = m2.id
       WHERE mc.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comparison not found' });
    }

    const row = result.rows[0];

    res.json({
      ...row,
      comparison_data: typeof row.comparison_data === 'string' ? JSON.parse(row.comparison_data) : row.comparison_data
    });
  } catch (error) {
    console.error('Get comparison error:', error);
    res.status(500).json({ error: 'Failed to fetch comparison' });
  }
});

export default router;
