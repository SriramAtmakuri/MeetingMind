import express from 'express';
import { query } from '../models/db.js';

const router = express.Router();

// Get notifications for user
router.get('/', async (req, res) => {
  try {
    const { userId, isRead, limit = 50 } = req.query;

    let queryText = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (userId) {
      queryText += ` AND user_id = $${paramCount++}`;
      params.push(userId);
    }

    if (isRead !== undefined) {
      queryText += ` AND is_read = $${paramCount++}`;
      params.push(isRead === 'true' ? 1 : 0);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    const result = await query(queryText, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE notifications SET is_read = 1 WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all as read
router.patch('/mark-all-read', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = $1 AND is_read = 0',
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Create notification
router.post('/', async (req, res) => {
  try {
    const { userId, type, title, message, meetingId } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: 'Type and title are required' });
    }

    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, meeting_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId || '00000000-0000-0000-0000-000000000000', type, title, message || null, meetingId || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM notifications WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
