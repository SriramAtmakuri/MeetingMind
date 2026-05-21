import express from 'express';
import { query } from '../models/db.js';

const router = express.Router();

// Get all meetings for a user
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0, category, status, isFavorite, sortBy = 'created_at', sortOrder = 'desc', tags } = req.query;
    const userId = req.userId;

    let queryText = `
      SELECT
        m.*,
        COUNT(DISTINCT ai.id) as action_items_count,
        COUNT(DISTINCT d.id) as decisions_count,
        COUNT(DISTINCT s.id) as speakers_count,
        sa.overall_sentiment
      FROM meetings m
      LEFT JOIN action_items ai ON m.id = ai.meeting_id
      LEFT JOIN decisions d ON m.id = d.meeting_id
      LEFT JOIN speakers s ON m.id = s.meeting_id
      LEFT JOIN sentiment_analysis sa ON m.id = sa.meeting_id
    `;

    const params = [];
    const conditions = [];
    let paramCount = 1;

    conditions.push(`m.user_id = $${paramCount++}`);
    params.push(userId);

    if (category) {
      conditions.push(`m.category = $${paramCount++}`);
      params.push(category);
    }

    if (status) {
      conditions.push(`m.status = $${paramCount++}`);
      params.push(status);
    }

    if (isFavorite === 'true') {
      conditions.push(`m.is_favorite = 1`);
    }

    if (tags) {
      conditions.push(`m.tags LIKE $${paramCount++}`);
      params.push(`%${tags}%`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['created_at', 'title', 'duration', 'updated_at'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    queryText += `
      GROUP BY m.id, sa.overall_sentiment
      ORDER BY m.${validSortBy} ${validSortOrder}
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    res.json({
      meetings: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Get meeting by ID with all details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get meeting details
    const meetingResult = await query(
      'SELECT * FROM meetings WHERE id = $1',
      [id]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meeting = meetingResult.rows[0];

    // Get speakers
    const speakersResult = await query(
      'SELECT * FROM speakers WHERE meeting_id = $1 ORDER BY talk_time DESC',
      [id]
    );

    // Get transcripts
    const transcriptsResult = await query(
      `SELECT t.*, s.custom_name as speaker_name, s.label as speaker_label
       FROM transcripts t
       LEFT JOIN speakers s ON t.speaker_id = s.id
       WHERE t.meeting_id = $1
       ORDER BY t.start_time ASC`,
      [id]
    );

    // Get action items
    const actionItemsResult = await query(
      'SELECT * FROM action_items WHERE meeting_id = $1 ORDER BY priority DESC, due_date ASC',
      [id]
    );

    // Get decisions
    const decisionsResult = await query(
      'SELECT * FROM decisions WHERE meeting_id = $1 ORDER BY timestamp ASC',
      [id]
    );

    // Get summary
    const summaryResult = await query(
      'SELECT * FROM summaries WHERE meeting_id = $1',
      [id]
    );

    // Get sentiment analysis
    const sentimentResult = await query(
      'SELECT * FROM sentiment_analysis WHERE meeting_id = $1',
      [id]
    );

    res.json({
      ...meeting,
      speakers: speakersResult.rows,
      transcript: transcriptsResult.rows,
      actionItems: actionItemsResult.rows,
      decisions: decisionsResult.rows,
      summary: summaryResult.rows[0] || null,
      sentiment: sentimentResult.rows[0] || null
    });
  } catch (error) {
    console.error('Get meeting details error:', error);
    res.status(500).json({ error: 'Failed to fetch meeting details' });
  }
});

// Update meeting
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, status } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);

    const result = await query(
      `UPDATE meetings SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// Delete meeting
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM meetings WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// Update action item
router.patch('/:meetingId/actions/:actionId', async (req, res) => {
  try {
    const { actionId } = req.params;
    const { status, text, assignee, dueDate, priority } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);

      if (status === 'completed') {
        updates.push(`completed_at = NOW()`);
      }
    }

    if (text) {
      updates.push(`text = $${paramCount++}`);
      values.push(text);
    }

    if (assignee) {
      updates.push(`assignee = $${paramCount++}`);
      values.push(assignee);
    }

    if (dueDate) {
      updates.push(`due_date = $${paramCount++}`);
      values.push(dueDate);
    }

    if (priority) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(actionId);

    const result = await query(
      `UPDATE action_items SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Action item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update action item error:', error);
    res.status(500).json({ error: 'Failed to update action item' });
  }
});

// Update speaker name
router.patch('/:meetingId/speakers/:speakerId', async (req, res) => {
  try {
    const { speakerId } = req.params;
    const { customName, color, email, role } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (customName !== undefined) {
      updates.push(`custom_name = $${paramCount++}`);
      values.push(customName);
    }

    if (color) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }

    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (role) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(speakerId);

    const result = await query(
      `UPDATE speakers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Speaker not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update speaker error:', error);
    res.status(500).json({ error: 'Failed to update speaker' });
  }
});

// Toggle favorite
router.patch('/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;

    const meetingResult = await query('SELECT is_favorite FROM meetings WHERE id = $1', [id]);

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const newFavoriteStatus = meetingResult.rows[0].is_favorite ? 0 : 1;

    const result = await query(
      'UPDATE meetings SET is_favorite = $1 WHERE id = $2 RETURNING *',
      [newFavoriteStatus, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Update meeting metadata (tags, category, notes)
router.patch('/:id/metadata', async (req, res) => {
  try {
    const { id } = req.params;
    const { tags, category, notes } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (tags !== undefined) {
      updates.push(`tags = $${paramCount++}`);
      values.push(Array.isArray(tags) ? tags.join(',') : tags);
    }

    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);

    const result = await query(
      `UPDATE meetings SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update metadata error:', error);
    res.status(500).json({ error: 'Failed to update metadata' });
  }
});

// Bulk delete meetings
router.post('/bulk-delete', async (req, res) => {
  try {
    const { meetingIds } = req.body;

    if (!Array.isArray(meetingIds) || meetingIds.length === 0) {
      return res.status(400).json({ error: 'Meeting IDs array is required' });
    }

    const placeholders = meetingIds.map((_, i) => `$${i + 1}`).join(',');

    const result = await query(
      `DELETE FROM meetings WHERE id IN (${placeholders}) RETURNING id`,
      meetingIds
    );

    res.json({
      success: true,
      deletedCount: result.rowCount,
      deletedIds: result.rows.map(r => r.id)
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to delete meetings' });
  }
});

// Add comment to meeting
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, text, transcriptId, timestamp } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const result = await query(
      `INSERT INTO comments (meeting_id, user_id, text, transcript_id, timestamp)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, userId || '00000000-0000-0000-0000-000000000000', text, transcriptId || null, timestamp || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get comments for meeting
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT c.*, u.name as user_name, u.email as user_email
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.meeting_id = $1
       ORDER BY c.created_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add highlight to meeting
router.post('/:id/highlights', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, startTime, endTime, text, color } = req.body;

    if (startTime === undefined || endTime === undefined) {
      return res.status(400).json({ error: 'Start and end time are required' });
    }

    const result = await query(
      `INSERT INTO highlights (meeting_id, user_id, start_time, end_time, text, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, userId || '00000000-0000-0000-0000-000000000000', startTime, endTime, text || null, color || '#fbbf24']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add highlight error:', error);
    res.status(500).json({ error: 'Failed to add highlight' });
  }
});

// Get highlights for meeting
router.get('/:id/highlights', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM highlights WHERE meeting_id = $1 ORDER BY start_time ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get highlights error:', error);
    res.status(500).json({ error: 'Failed to fetch highlights' });
  }
});

// Delete highlight
router.delete('/:meetingId/highlights/:highlightId', async (req, res) => {
  try {
    const { highlightId } = req.params;

    const result = await query(
      'DELETE FROM highlights WHERE id = $1 RETURNING id',
      [highlightId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Highlight not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete highlight error:', error);
    res.status(500).json({ error: 'Failed to delete highlight' });
  }
});

export default router;
