import express from 'express';
import { query } from '../models/db.js';

const router = express.Router();

// Get all action items across meetings
router.get('/', async (req, res) => {
  try {
    const { userId, status, assignee, priority, limit = 100 } = req.query;

    let queryText = `
      SELECT
        ai.*,
        m.title as meeting_title,
        m.created_at as meeting_date
      FROM action_items ai
      JOIN meetings m ON ai.meeting_id = m.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (userId) {
      queryText += ` AND m.user_id = $${paramCount++}`;
      params.push(userId);
    }

    if (status) {
      queryText += ` AND ai.status = $${paramCount++}`;
      params.push(status);
    }

    if (assignee) {
      queryText += ` AND ai.assignee LIKE $${paramCount++}`;
      params.push(`%${assignee}%`);
    }

    if (priority) {
      queryText += ` AND ai.priority = $${paramCount++}`;
      params.push(priority);
    }

    queryText += ` ORDER BY
      CASE ai.priority
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
        ELSE 4
      END,
      ai.due_date ASC NULLS LAST,
      ai.created_at DESC
      LIMIT $${paramCount}
    `;

    params.push(parseInt(limit));

    const result = await query(queryText, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get action items error:', error);
    res.status(500).json({ error: 'Failed to fetch action items' });
  }
});

// Get action items statistics
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;

    const totalQuery = userId
      ? 'SELECT COUNT(*) as total FROM action_items ai JOIN meetings m ON ai.meeting_id = m.id WHERE m.user_id = $1'
      : 'SELECT COUNT(*) as total FROM action_items';

    const pendingQuery = userId
      ? "SELECT COUNT(*) as pending FROM action_items ai JOIN meetings m ON ai.meeting_id = m.id WHERE m.user_id = $1 AND ai.status = 'pending'"
      : "SELECT COUNT(*) as pending FROM action_items WHERE status = 'pending'";

    const completedQuery = userId
      ? "SELECT COUNT(*) as completed FROM action_items ai JOIN meetings m ON ai.meeting_id = m.id WHERE m.user_id = $1 AND ai.status = 'completed'"
      : "SELECT COUNT(*) as completed FROM action_items WHERE status = 'completed'";

    const overdueQuery = userId
      ? "SELECT COUNT(*) as overdue FROM action_items ai JOIN meetings m ON ai.meeting_id = m.id WHERE m.user_id = $1 AND ai.status != 'completed' AND ai.due_date < DATE('now')"
      : "SELECT COUNT(*) as overdue FROM action_items WHERE status != 'completed' AND due_date < DATE('now')";

    const params = userId ? [userId] : [];

    const [totalResult, pendingResult, completedResult, overdueResult] = await Promise.all([
      query(totalQuery, params),
      query(pendingQuery, params),
      query(completedQuery, params),
      query(overdueQuery, params)
    ]);

    res.json({
      total: parseInt(totalResult.rows[0].total),
      pending: parseInt(pendingResult.rows[0].pending),
      completed: parseInt(completedResult.rows[0].completed),
      overdue: parseInt(overdueResult.rows[0].overdue)
    });
  } catch (error) {
    console.error('Get action items stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get action items grouped by status (for Kanban board)
router.get('/kanban', async (req, res) => {
  try {
    const { userId } = req.query;

    const queryText = `
      SELECT
        ai.*,
        m.title as meeting_title,
        m.created_at as meeting_date
      FROM action_items ai
      JOIN meetings m ON ai.meeting_id = m.id
      ${userId ? 'WHERE m.user_id = $1' : ''}
      ORDER BY ai.created_at DESC
    `;

    const result = await query(queryText, userId ? [userId] : []);

    const grouped = {
      pending: [],
      in_progress: [],
      completed: []
    };

    result.rows.forEach(item => {
      if (grouped[item.status]) {
        grouped[item.status].push(item);
      }
    });

    res.json(grouped);
  } catch (error) {
    console.error('Get kanban data error:', error);
    res.status(500).json({ error: 'Failed to fetch kanban data' });
  }
});

export default router;
