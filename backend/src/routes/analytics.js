import express from 'express';
import { query } from '../models/db.js';

const router = express.Router();

// Get analytics summary for a user
router.get('/summary', async (req, res) => {
  try {
    const userId = req.userId;

    // Total meetings
    const meetingsCount = await query(
      `SELECT COUNT(*) as total FROM meetings WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );

    // Total action items (CASE WHEN used for SQLite/PostgreSQL compatibility)
    const actionItemsCount = await query(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN ai.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN ai.status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM action_items ai
       JOIN meetings m ON ai.meeting_id = m.id
       WHERE m.user_id = $1`,
      [userId]
    );

    // Total time in meetings
    const totalTime = await query(
      `SELECT COALESCE(SUM(duration), 0) as total_seconds
       FROM meetings
       WHERE user_id = $1 AND status = 'completed' AND duration IS NOT NULL`,
      [userId]
    );

    // Average sentiment
    const avgSentiment = await query(
      `SELECT
        sa.overall_sentiment,
        COUNT(*) as count
       FROM sentiment_analysis sa
       JOIN meetings m ON sa.meeting_id = m.id
       WHERE m.user_id = $1
       GROUP BY sa.overall_sentiment`,
      [userId]
    );

    const totalSeconds = parseInt(totalTime.rows[0].total_seconds) || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    res.json({
      meetings: {
        total: parseInt(meetingsCount.rows[0].total),
      },
      actionItems: {
        total: parseInt(actionItemsCount.rows[0].total),
        completed: parseInt(actionItemsCount.rows[0].completed),
        pending: parseInt(actionItemsCount.rows[0].pending),
        completionRate: actionItemsCount.rows[0].total > 0
          ? Math.round((actionItemsCount.rows[0].completed / actionItemsCount.rows[0].total) * 100)
          : 0
      },
      totalTime: {
        seconds: totalSeconds,
        formatted: `${hours}h ${minutes}m`
      },
      sentiment: avgSentiment.rows
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get meeting trends
router.get('/trends', async (req, res) => {
  try {
    const { userId, days = 30 } = req.query;

    const result = await query(
      `SELECT
        DATE(created_at) as date,
        COUNT(*) as meetings_count,
        COALESCE(SUM(duration), 0) as total_duration
       FROM meetings
       WHERE user_id = $1
         AND status = 'completed'
         AND created_at >= NOW() - INTERVAL '${parseInt(days)} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [userId]
    );

    res.json({
      period: `${days} days`,
      data: result.rows
    });
  } catch (error) {
    console.error('Analytics trends error:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

export default router;
