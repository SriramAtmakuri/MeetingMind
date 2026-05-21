import express from 'express';
import upload from '../middleware/upload.js';
import { query } from '../models/db.js';
import { addToProcessingQueue } from '../services/queue.js';
import { validate, schemas } from '../middleware/validate.js';

const router = express.Router();

// Upload meeting recording
router.post('/', upload.single('file'), validate(schemas.upload), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title } = req.body;
    const effectiveUserId = req.userId;

    // Create meeting record
    const result = await query(
      `INSERT INTO meetings (user_id, title, file_name, file_url, file_size, file_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        effectiveUserId,
        title,
        req.file.originalname,
        `/uploads/${req.file.filename}`,
        req.file.size,
        req.file.mimetype,
        'uploaded'
      ]
    );

    const meeting = result.rows[0];

    // Add to processing queue
    try {
      await addToProcessingQueue(meeting.id, {
        filePath: req.file.path,
        fileName: req.file.filename,
        fileType: req.file.mimetype,
      });
    } catch (queueError) {
      console.error('Failed to add to queue:', queueError);
      // Update meeting status to indicate queue failure
      await query(
        `UPDATE meetings SET status = $1, error_message = $2 WHERE id = $3`,
        ['failed', 'Failed to queue for processing', meeting.id]
      );
    }

    res.status(201).json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        status: meeting.status,
        fileName: meeting.file_name,
        fileSize: meeting.file_size,
        createdAt: meeting.created_at
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      message: error.message
    });
  }
});

// Get upload status
router.get('/:meetingId/status', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const result = await query(
      'SELECT id, title, status, error_message, created_at, updated_at FROM meetings WHERE id = $1',
      [meetingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

export default router;
