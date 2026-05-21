import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '../models/db.js';
import dotenv from 'dotenv';

dotenv.config();

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const USE_POSTGRES = !!process.env.DATABASE_URL;

async function generateEmbedding(text) {
  if (!genAI) return null;
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values; // float[768]
  } catch (err) {
    console.error('Embedding generation error:', err.message);
    return null;
  }
}

function createChunks(segments, maxWords = 300) {
  const chunks = [];
  let current = { text: '', startTime: 0, endTime: 0, wordCount: 0 };

  for (const seg of segments) {
    const words = seg.text.split(' ').length;
    if (current.wordCount === 0) current.startTime = seg.start;
    current.text += (current.text ? ' ' : '') + seg.text;
    current.endTime = seg.end;
    current.wordCount += words;

    if (current.wordCount >= maxWords) {
      chunks.push({ ...current });
      current = { text: '', startTime: 0, endTime: 0, wordCount: 0 };
    }
  }
  if (current.wordCount > 0) chunks.push(current);
  return chunks;
}

export async function generateEmbeddings(meetingId, segments) {
  console.log(`Generating embeddings for meeting ${meetingId}...`);
  const chunks = createChunks(segments);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk.text);

    if (USE_POSTGRES && embedding) {
      // Store as pgvector — pgvector accepts '[1.0,2.0,...]' string with ::vector cast
      await query(
        `INSERT INTO vector_chunks (meeting_id, chunk_text, chunk_index, start_time, end_time, vector_embedding)
         VALUES ($1, $2, $3, $4, $5, $6::vector)`,
        [meetingId, chunk.text, i, chunk.startTime, chunk.endTime, JSON.stringify(embedding)]
      );
    } else {
      // SQLite: no vector support, store text only
      await query(
        `INSERT INTO vector_chunks (meeting_id, chunk_text, chunk_index, start_time, end_time, embedding_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [meetingId, chunk.text, i, chunk.startTime, chunk.endTime, `emb-${meetingId}-${i}`]
      );
    }
  }

  console.log(`✓ Stored ${chunks.length} chunks for meeting ${meetingId}${USE_POSTGRES && genAI ? ' with vector embeddings' : ' (text-only fallback)'}`);
}

export async function semanticSearch(queryText, userId = null, limit = 10) {
  console.log(`Semantic search: "${queryText}"`);

  if (USE_POSTGRES && genAI) {
    const embedding = await generateEmbedding(queryText);
    if (embedding) {
      const vectorStr = JSON.stringify(embedding);
      const params = userId
        ? [vectorStr, limit, userId]
        : [vectorStr, limit];
      const userFilter = userId ? 'AND m.user_id = $3' : '';

      const result = await query(
        `SELECT
          vc.chunk_text AS text,
          vc.start_time,
          vc.end_time,
          m.id AS meeting_id,
          m.title AS meeting_title,
          m.created_at AS meeting_date,
          1 - (vc.vector_embedding <=> $1::vector) AS similarity
         FROM vector_chunks vc
         JOIN meetings m ON vc.meeting_id = m.id
         WHERE vc.vector_embedding IS NOT NULL
           ${userFilter}
         ORDER BY vc.vector_embedding <=> $1::vector
         LIMIT $2`,
        params
      );
      return result.rows;
    }
  }

  // Fallback: text search (SQLite or no API key)
  // Params must be ordered to match positional appearance in SQL ($1 first, $2 second, etc.)
  const likeOp = USE_POSTGRES ? 'ILIKE' : 'LIKE';
  const pattern = `%${queryText}%`;
  const params = userId ? [pattern, userId, limit] : [pattern, limit];

  const result = await query(
    `SELECT
      vc.chunk_text AS text,
      vc.start_time,
      vc.end_time,
      m.id AS meeting_id,
      m.title AS meeting_title,
      m.created_at AS meeting_date,
      0.5 AS similarity
     FROM vector_chunks vc
     JOIN meetings m ON vc.meeting_id = m.id
     WHERE vc.chunk_text ${likeOp} $1
       ${userId ? 'AND m.user_id = $2' : ''}
     ORDER BY m.created_at DESC
     LIMIT $${userId ? 3 : 2}`,
    params
  );
  return result.rows;
}

export default { generateEmbeddings, semanticSearch };
