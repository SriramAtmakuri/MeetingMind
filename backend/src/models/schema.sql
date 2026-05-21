-- MeetingMind Database Schema
-- SQLite 3

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_name TEXT,
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT,
  duration INTEGER,
  status TEXT DEFAULT 'uploading',
  error_message TEXT,
  category TEXT,
  tags TEXT,
  notes TEXT,
  is_favorite INTEGER DEFAULT 0,
  calendar_event_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME
);

-- Speakers table
CREATE TABLE IF NOT EXISTS speakers (
  id TEXT PRIMARY KEY,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  custom_name TEXT,
  talk_time INTEGER DEFAULT 0,
  color TEXT,
  email TEXT,
  role TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id TEXT PRIMARY KEY,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
  speaker_id TEXT REFERENCES speakers(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  start_time REAL NOT NULL,
  end_time REAL NOT NULL,
  confidence REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Action Items table
CREATE TABLE IF NOT EXISTS action_items (
  id TEXT PRIMARY KEY,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  assignee TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  timestamp REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
  decision_text TEXT NOT NULL,
  reasoning TEXT,
  made_by TEXT,
  disagreements TEXT,
  category TEXT,
  timestamp REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Summaries table
CREATE TABLE IF NOT EXISTS summaries (
  id TEXT PRIMARY KEY,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
  summary_short TEXT,
  summary_medium TEXT,
  summary_full TEXT,
  topics TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sentiment Analysis table
CREATE TABLE IF NOT EXISTS sentiment_analysis (
  id TEXT PRIMARY KEY,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
  overall_sentiment TEXT,
  timeline TEXT,
  tension_points TEXT,
  speaker_sentiment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vector embeddings for RAG search
CREATE TABLE IF NOT EXISTS vector_chunks (
  id TEXT PRIMARY KEY,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
  speaker_id TEXT REFERENCES speakers(id) ON DELETE SET NULL,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  start_time REAL,
  end_time REAL,
  embedding_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_speakers_meeting_id ON speakers(meeting_id);

CREATE INDEX IF NOT EXISTS idx_transcripts_meeting_id ON transcripts(meeting_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_speaker_id ON transcripts(speaker_id);

CREATE INDEX IF NOT EXISTS idx_action_items_meeting_id ON action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date);

CREATE INDEX IF NOT EXISTS idx_decisions_meeting_id ON decisions(meeting_id);

CREATE INDEX IF NOT EXISTS idx_vector_chunks_meeting_id ON vector_chunks(meeting_id);
CREATE INDEX IF NOT EXISTS idx_vector_chunks_embedding_id ON vector_chunks(embedding_id);

-- Comments table (for collaborative features)
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  transcript_id TEXT REFERENCES transcripts(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Highlights table (for bookmarking important moments)
CREATE TABLE IF NOT EXISTS highlights (
  id TEXT PRIMARY KEY,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  start_time REAL NOT NULL,
  end_time REAL NOT NULL,
  text TEXT,
  color TEXT DEFAULT '#fbbf24',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Search history table
CREATE TABLE IF NOT EXISTS search_history (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Meeting templates table
CREATE TABLE IF NOT EXISTS meeting_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  default_tags TEXT,
  action_item_templates TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Exports table (track export history)
CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,
  file_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Meeting comparisons table
CREATE TABLE IF NOT EXISTS meeting_comparisons (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  meeting_id_1 TEXT REFERENCES meetings(id) ON DELETE CASCADE,
  meeting_id_2 TEXT REFERENCES meetings(id) ON DELETE CASCADE,
  comparison_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_meetings_category ON meetings(category);
CREATE INDEX IF NOT EXISTS idx_meetings_is_favorite ON meetings(is_favorite);
CREATE INDEX IF NOT EXISTS idx_comments_meeting_id ON comments(meeting_id);
CREATE INDEX IF NOT EXISTS idx_highlights_meeting_id ON highlights(meeting_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_meeting_id ON exports(meeting_id);

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_meetings_updated_at
AFTER UPDATE ON meetings
BEGIN
  UPDATE meetings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_action_items_updated_at
AFTER UPDATE ON action_items
BEGIN
  UPDATE action_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_users_updated_at
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_comments_updated_at
AFTER UPDATE ON comments
BEGIN
  UPDATE comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
