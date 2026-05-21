import express from 'express';
import { query } from '../models/db.js';
import { semanticSearch } from '../services/embeddings.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    // Prefer header-based userId (set by requireAuth), fall back to query param for backward compat
    const userId = req.userId || req.query.userId || null;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const parsedLimit = parseInt(limit);
    const searchPattern = `%${q}%`;
    const likeOp = process.env.DATABASE_URL ? 'ILIKE' : 'LIKE';

    // Primary: vector similarity search over transcript chunks
    const vectorResults = await semanticSearch(q, userId || null, Math.ceil(parsedLimit * 0.6));

    // Secondary: keyword search over action items + decisions (not yet in vector_chunks)
    const actionItemSearch = query(
      `SELECT
        ai.id, ai.text, ai.assignee, ai.due_date, ai.priority, ai.status,
        m.id as meeting_id, m.title as meeting_title, m.created_at as meeting_date,
        'action_item' as type
       FROM action_items ai
       JOIN meetings m ON ai.meeting_id = m.id
       WHERE ai.text ${likeOp} $1
       ${userId ? 'AND m.user_id = $2' : ''}
       ORDER BY m.created_at DESC
       LIMIT $${userId ? 3 : 2}`,
      userId ? [searchPattern, userId, Math.ceil(parsedLimit * 0.2)] : [searchPattern, Math.ceil(parsedLimit * 0.2)]
    );

    const decisionSearch = query(
      `SELECT
        d.id, d.decision_text as text, d.reasoning, d.made_by, d.timestamp,
        m.id as meeting_id, m.title as meeting_title, m.created_at as meeting_date,
        'decision' as type
       FROM decisions d
       JOIN meetings m ON d.meeting_id = m.id
       WHERE (d.decision_text ${likeOp} $1 OR d.reasoning ${likeOp} $2)
       ${userId ? 'AND m.user_id = $3' : ''}
       ORDER BY m.created_at DESC
       LIMIT $${userId ? 4 : 3}`,
      userId
        ? [searchPattern, searchPattern, userId, Math.ceil(parsedLimit * 0.2)]
        : [searchPattern, searchPattern, Math.ceil(parsedLimit * 0.2)]
    );

    const [actionItems, decisions] = await Promise.all([actionItemSearch, decisionSearch]);

    const vectorRows = vectorResults.map(r => ({ ...r, type: 'transcript' }));
    const results = [
      ...vectorRows,
      ...actionItems.rows,
      ...decisions.rows,
    ].sort((a, b) => {
      // Sort by similarity score if present, else by date
      if (a.similarity !== undefined && b.similarity !== undefined) return b.similarity - a.similarity;
      return new Date(b.meeting_date) - new Date(a.meeting_date);
    });

    // Save to search history
    if (userId) {
      try {
        await query(
          `INSERT INTO search_history (user_id, query, results_count)
           VALUES ($1, $2, $3)`,
          [userId, q, results.length]
        );
      } catch (historyError) {
        console.error('Failed to save search history:', historyError);
      }
    }

    res.json({
      query: q,
      total: results.length,
      results: results.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get search history
router.get('/history', async (req, res) => {
  try {
    const { userId, limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await query(
      `SELECT DISTINCT query, MAX(created_at) as last_searched, SUM(results_count) as total_results
       FROM search_history
       WHERE user_id = $1
       GROUP BY query
       ORDER BY last_searched DESC
       LIMIT $2`,
      [userId, parseInt(limit)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json({ error: 'Failed to fetch search history' });
  }
});

// Clear search history
router.delete('/history', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await query(
      'DELETE FROM search_history WHERE user_id = $1',
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Clear search history error:', error);
    res.status(500).json({ error: 'Failed to clear search history' });
  }
});

export default router;
