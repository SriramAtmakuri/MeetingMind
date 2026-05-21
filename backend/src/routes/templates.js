import express from 'express';
import { query } from '../models/db.js';

const router = express.Router();

// Get all templates for user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    const queryText = userId
      ? 'SELECT * FROM meeting_templates WHERE user_id = $1 ORDER BY name ASC'
      : 'SELECT * FROM meeting_templates ORDER BY name ASC';

    const result = await query(queryText, userId ? [userId] : []);

    res.json(result.rows);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create template
router.post('/', async (req, res) => {
  try {
    const { userId, name, category, defaultTags, actionItemTemplates } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    const result = await query(
      `INSERT INTO meeting_templates (user_id, name, category, default_tags, action_item_templates)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userId || '00000000-0000-0000-0000-000000000000',
        name,
        category || null,
        Array.isArray(defaultTags) ? defaultTags.join(',') : (defaultTags || null),
        actionItemTemplates ? JSON.stringify(actionItemTemplates) : null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, defaultTags, actionItemTemplates } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }

    if (defaultTags !== undefined) {
      updates.push(`default_tags = $${paramCount++}`);
      values.push(Array.isArray(defaultTags) ? defaultTags.join(',') : defaultTags);
    }

    if (actionItemTemplates !== undefined) {
      updates.push(`action_item_templates = $${paramCount++}`);
      values.push(actionItemTemplates ? JSON.stringify(actionItemTemplates) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);

    const result = await query(
      `UPDATE meeting_templates SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM meeting_templates WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Get categories (unique values from meetings and templates)
router.get('/categories', async (req, res) => {
  try {
    const { userId } = req.query;

    const meetingCategoriesQuery = userId
      ? 'SELECT DISTINCT category FROM meetings WHERE user_id = $1 AND category IS NOT NULL'
      : 'SELECT DISTINCT category FROM meetings WHERE category IS NOT NULL';

    const templateCategoriesQuery = userId
      ? 'SELECT DISTINCT category FROM meeting_templates WHERE user_id = $1 AND category IS NOT NULL'
      : 'SELECT DISTINCT category FROM meeting_templates WHERE category IS NOT NULL';

    const [meetingResult, templateResult] = await Promise.all([
      query(meetingCategoriesQuery, userId ? [userId] : []),
      query(templateCategoriesQuery, userId ? [userId] : [])
    ]);

    const categories = new Set([
      ...meetingResult.rows.map(r => r.category),
      ...templateResult.rows.map(r => r.category)
    ]);

    res.json(Array.from(categories).sort());
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
