import { Router } from 'express';
import db from '../models/db.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();

function uid() {
  return crypto.randomUUID();
}

// POST /api/seed  — creates demo meetings for a given userId
router.post('/', (req, res) => {
  const userId = req.userId;

  try {
    // Ensure the user row exists (guest users are never inserted into the users table).
    // Use userId as a unique email to avoid UNIQUE constraint conflicts.
    db.prepare(
      `INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, 'Guest User')`
    ).run(userId, `${userId}@guest.local`);

    // Check if demo data already seeded for this user
    const existing = db.prepare(
      `SELECT COUNT(*) as count FROM meetings WHERE user_id = ? AND title LIKE '%[Demo]%'`
    ).get(userId);
    if (existing.count >= 3) {
      return res.json({ message: 'Demo data already exists', seeded: false });
    }

    const seedMeetings = [
      {
        title: '[Demo] Q1 Product Strategy Review',
        duration: 2700,
        summary: 'The team reviewed Q1 OKR progress, discussed roadmap priorities for Q2, and aligned on the mobile-first strategy. Three key initiatives were approved: redesigning the onboarding flow, launching the API beta, and hiring two senior engineers.',
        overall_sentiment: 'positive',
        category: 'Strategy',
        tags: 'q1,roadmap,okrs',
        topics: 'OKR Review, Roadmap, Hiring, Mobile Strategy',
        speakers: [
          { name: 'Sarah Chen', color: '#3b82f6', role: 'Product Manager', talk_time: 900 },
          { name: 'Marcus Johnson', color: '#10b981', role: 'Engineering Lead', talk_time: 720 },
          { name: 'Priya Patel', color: '#f59e0b', role: 'Designer', talk_time: 480 },
          { name: 'David Kim', color: '#8b5cf6', role: 'CEO', talk_time: 600 },
        ],
        transcript: [
          { speaker: 0, start: 0, end: 45, text: "Good morning everyone. Let's start by reviewing our Q1 OKR progress. Overall we're at 78% completion which is ahead of last quarter." },
          { speaker: 3, start: 46, end: 90, text: "That's great news. The mobile initiative especially exceeded expectations. Can you walk us through the engineering side Marcus?" },
          { speaker: 1, start: 91, end: 150, text: "Absolutely. We shipped 14 features in Q1, reduced API latency by 40%, and the new infrastructure can now handle 10x our current load. Team did excellent work." },
          { speaker: 2, start: 151, end: 210, text: "From the design perspective, user testing showed a 35% improvement in task completion rate after the onboarding redesign. Users are finding value much faster now." },
          { speaker: 0, start: 211, end: 280, text: "For Q2 I'm proposing we focus on three things: the API beta launch, mobile app v2, and expanding the enterprise tier. I'll share the detailed breakdown after this call." },
          { speaker: 3, start: 281, end: 340, text: "I'm fully behind the API beta. That's our biggest growth lever for the year. Let's make sure we have the right team bandwidth for it." },
          { speaker: 1, start: 341, end: 400, text: "We'll need two senior engineers to pull this off on schedule. I've already started the JD. Should have candidates by end of month." },
          { speaker: 0, start: 401, end: 460, text: "Perfect. Let's also schedule weekly syncs starting next Monday. I'll send a calendar invite. Any blockers we should address today?" },
          { speaker: 2, start: 461, end: 520, text: "One thing — we need design system alignment between web and mobile. I'd like to propose a two-day design sprint in week 3." },
          { speaker: 1, start: 521, end: 580, text: "Engineering can allocate time for that. Let's make it happen. I'll coordinate with Priya on the specifics." },
        ],
        action_items: [
          { text: 'Share Q2 roadmap breakdown document with team', assignee: 'Sarah Chen', priority: 'high', status: 'pending' },
          { text: 'Post two senior engineer job descriptions', assignee: 'Marcus Johnson', priority: 'high', status: 'in_progress' },
          { text: 'Schedule weekly Q2 sync starting next Monday', assignee: 'Sarah Chen', priority: 'medium', status: 'completed' },
          { text: 'Organize 2-day design sprint in week 3', assignee: 'Priya Patel', priority: 'medium', status: 'pending' },
          { text: 'Coordinate design sprint logistics with Marcus', assignee: 'Priya Patel', priority: 'low', status: 'pending' },
        ],
        decisions: [
          { text: 'Approve Q2 focus on API beta, mobile v2, and enterprise tier expansion', reasoning: 'Aligns with annual growth targets and team bandwidth' },
          { text: 'Hire two senior engineers in Q2', reasoning: 'Required to deliver API beta on schedule' },
          { text: 'Run mobile-first design sprint in week 3', reasoning: 'Critical for web/mobile design system alignment' },
        ],
      },
      {
        title: '[Demo] Weekly Engineering Standup',
        duration: 900,
        summary: 'Quick engineering sync covering sprint progress, blockers, and deployment plan. Team is on track for Friday release. One blocker identified around database migration that needs immediate attention.',
        overall_sentiment: 'neutral',
        category: 'Engineering',
        tags: 'standup,sprint,engineering',
        topics: 'Sprint Progress, Blockers, Deployment, Code Review',
        speakers: [
          { name: 'Marcus Johnson', color: '#10b981', role: 'Engineering Lead', talk_time: 360 },
          { name: 'Alex Rivera', color: '#ef4444', role: 'Backend Engineer', talk_time: 240 },
          { name: 'Taylor Wong', color: '#06b6d4', role: 'Frontend Engineer', talk_time: 300 },
        ],
        transcript: [
          { speaker: 0, start: 0, end: 40, text: "Morning team. Let's keep this quick — 15 minutes max. Alex, what's your status?" },
          { speaker: 1, start: 41, end: 90, text: "Auth service is done, tests passing. But I hit a blocker on the database migration — the production schema has an extra column that's not in staging. Need 30 minutes to sort it out." },
          { speaker: 0, start: 91, end: 130, text: "Flag that immediately. We can't go to prod with schema drift. Taylor, frontend?" },
          { speaker: 2, start: 131, end: 200, text: "Dashboard redesign is 90% done. Just need to wire up the new analytics endpoint once Alex ships it. I also finished the mobile responsive fixes — tested on iPhone and Android." },
          { speaker: 0, start: 201, end: 250, text: "Good. Deployment plan: staging Thursday 4pm, production Friday 10am. Everyone confirm availability." },
          { speaker: 1, start: 251, end: 300, text: "I'll have the migration fix done by noon today. Should be in staging by EOD." },
          { speaker: 2, start: 301, end: 350, text: "I'm available both days. Will have the analytics endpoint integration done by Thursday morning." },
          { speaker: 0, start: 351, end: 400, text: "Perfect. Alex — get someone to review your migration script before you run it. Taylor — good work on mobile, that was a long-standing issue. See you all Thursday." },
        ],
        action_items: [
          { text: 'Fix database migration schema drift (production vs staging)', assignee: 'Alex Rivera', priority: 'high', status: 'in_progress' },
          { text: 'Get migration script reviewed before running on production', assignee: 'Alex Rivera', priority: 'high', status: 'pending' },
          { text: 'Complete analytics endpoint integration in dashboard', assignee: 'Taylor Wong', priority: 'medium', status: 'pending' },
          { text: 'Deploy to staging Thursday 4pm', assignee: 'Marcus Johnson', priority: 'high', status: 'pending' },
        ],
        decisions: [
          { text: 'Deploy to staging Thursday 4pm, production Friday 10am', reasoning: 'Sprint deadline and team availability aligned' },
          { text: 'Block production deployment until schema drift is resolved', reasoning: 'Risk of data corruption if migration runs with mismatched schema' },
        ],
      },
      {
        title: '[Demo] User Research Findings — Onboarding',
        duration: 3600,
        summary: 'UX research team presented findings from 12 user interviews focused on onboarding friction. Key insight: 60% of users abandon before completing profile setup. Three design solutions proposed and voted on. Team agreed to proceed with progressive disclosure approach.',
        overall_sentiment: 'mixed',
        category: 'Research',
        tags: 'ux,research,onboarding,users',
        topics: 'User Research, Onboarding, Drop-off Analysis, Design Solutions',
        speakers: [
          { name: 'Priya Patel', color: '#f59e0b', role: 'Lead Designer', talk_time: 1440 },
          { name: 'Jordan Lee', color: '#ec4899', role: 'UX Researcher', talk_time: 1080 },
          { name: 'Sarah Chen', color: '#3b82f6', role: 'Product Manager', talk_time: 720 },
          { name: 'Chris Taylor', color: '#14b8a6', role: 'Data Analyst', talk_time: 360 },
        ],
        transcript: [
          { speaker: 1, start: 0, end: 80, text: "Thanks everyone for joining. I'll walk through what we found in our 12 user interviews. The headline finding is that 60% of new users abandon before completing profile setup." },
          { speaker: 3, start: 81, end: 150, text: "That aligns with our funnel data. We see a massive drop at step 3 of onboarding — the profile photo and bio fields. Users don't understand why it's required." },
          { speaker: 2, start: 151, end: 220, text: "Was there a consistent reason for abandonment in the interviews?" },
          { speaker: 1, start: 221, end: 310, text: "Three main reasons: form feels too long, unclear value proposition at that point, and one annoying bug where the photo upload fails silently on slow connections." },
          { speaker: 0, start: 311, end: 400, text: "I have three design proposals to address this. First: progressive disclosure — show only email and name initially, reveal more fields after first value moment. Second: social proof injection — show how many meetings users with complete profiles have analyzed. Third: skip and remind later — let users skip and remind them in-app after they've seen value." },
          { speaker: 2, start: 401, end: 470, text: "I love option 1. Progressive disclosure is best practice and it respects the user's time. What's the implementation complexity?" },
          { speaker: 0, start: 471, end: 540, text: "Low — it's mostly a UI change. We can ship it in the current sprint without touching the backend." },
          { speaker: 3, start: 541, end: 600, text: "I'd combine options 1 and 3 — progressive disclosure with a persistent skip. That gives maximum flexibility." },
          { speaker: 1, start: 601, end: 660, text: "That was actually the most popular option in our prototype tests too. 8 out of 12 users preferred it." },
          { speaker: 2, start: 661, end: 720, text: "Agreed. Let's go with progressive disclosure plus skip. Priya can you have a prototype ready by next Tuesday for stakeholder review?" },
          { speaker: 0, start: 721, end: 780, text: "Yes, I'll have high-fidelity mockups ready Monday so we have buffer for feedback." },
        ],
        action_items: [
          { text: 'Create high-fidelity mockups for progressive disclosure onboarding', assignee: 'Priya Patel', priority: 'high', status: 'in_progress' },
          { text: 'Fix silent photo upload failure on slow connections', assignee: 'Alex Rivera', priority: 'high', status: 'pending' },
          { text: 'Schedule stakeholder review for Tuesday', assignee: 'Sarah Chen', priority: 'medium', status: 'completed' },
          { text: 'Prepare A/B test plan to measure onboarding improvement', assignee: 'Jordan Lee', priority: 'medium', status: 'pending' },
          { text: 'Update funnel tracking to capture progressive disclosure interactions', assignee: 'Chris Taylor', priority: 'low', status: 'pending' },
        ],
        decisions: [
          { text: 'Implement progressive disclosure with persistent skip option', reasoning: '8/12 users preferred it in prototype tests; low implementation complexity' },
          { text: 'Deprioritize social proof injection for now', reasoning: 'Requires backend changes; progressive disclosure alone should significantly reduce drop-off' },
        ],
      },
    ];

    const insertedMeetings = [];

    for (const m of seedMeetings) {
      const meetingId = uid();
      const now = new Date();
      const daysAgo = Math.floor(Math.random() * 14) + 1;
      const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();

      // Insert meeting (only columns that exist in schema)
      db.prepare(`
        INSERT INTO meetings (id, user_id, title, duration, status, category, tags, created_at, processed_at)
        VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, ?)
      `).run(meetingId, userId, m.title, m.duration, m.category, m.tags, createdAt, createdAt);

      // Insert summary (separate table)
      db.prepare(`
        INSERT INTO summaries (id, meeting_id, summary_short, summary_medium, summary_full, topics)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uid(), meetingId, m.summary, m.summary, m.summary, m.topics);

      // Insert sentiment (separate table)
      db.prepare(`
        INSERT INTO sentiment_analysis (id, meeting_id, overall_sentiment)
        VALUES (?, ?, ?)
      `).run(uid(), meetingId, m.overall_sentiment);

      // Insert speakers
      const speakerIds = [];
      for (const s of m.speakers) {
        const spId = uid();
        speakerIds.push(spId);
        db.prepare(`
          INSERT INTO speakers (id, meeting_id, label, custom_name, color, role, talk_time)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(spId, meetingId, `Speaker ${speakerIds.length}`, s.name, s.color, s.role, s.talk_time);
      }

      // Insert transcript
      for (const t of m.transcript) {
        db.prepare(`
          INSERT INTO transcripts (id, meeting_id, speaker_id, text, start_time, end_time, confidence)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(uid(), meetingId, speakerIds[t.speaker] || speakerIds[0], t.text, t.start, t.end, 0.95);
      }

      // Insert vector_chunks for text search fallback (one chunk per transcript segment)
      for (let i = 0; i < m.transcript.length; i++) {
        const t = m.transcript[i];
        db.prepare(`
          INSERT INTO vector_chunks (id, meeting_id, chunk_text, chunk_index, start_time, end_time, embedding_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(uid(), meetingId, t.text, i, t.start, t.end, `seed-${meetingId}-${i}`);
      }

      // Insert action items
      for (const a of m.action_items) {
        db.prepare(`
          INSERT INTO action_items (id, meeting_id, text, assignee, priority, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(uid(), meetingId, a.text, a.assignee, a.priority, a.status);
      }

      // Insert decisions (column is decision_text, not text)
      for (const d of m.decisions) {
        db.prepare(`
          INSERT INTO decisions (id, meeting_id, decision_text, reasoning)
          VALUES (?, ?, ?, ?)
        `).run(uid(), meetingId, d.text, d.reasoning || null);
      }

      insertedMeetings.push({ id: meetingId, title: m.title });
    }

    res.json({ message: 'Demo data seeded successfully', meetings: insertedMeetings, seeded: true });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/seed — remove all demo meetings for a user
router.delete('/', (req, res) => {
  const userId = req.userId;

  try {
    const result = db.prepare(
      `DELETE FROM meetings WHERE user_id = ? AND title LIKE '%[Demo]%'`
    ).run(userId);
    res.json({ message: `Removed ${result.changes} demo meetings`, count: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
