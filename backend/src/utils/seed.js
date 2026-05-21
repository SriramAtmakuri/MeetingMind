import { query } from '../models/db.js';

async function seedDatabase() {
  console.log('Seeding database with sample data...');

  try {
    // Create a demo user
    const userResult = await query(
      `INSERT INTO users (email, name)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET name = $2
       RETURNING id`,
      ['demo@meetingmind.com', 'Demo User']
    );

    const userId = userResult.rows[0].id;
    console.log('✅ Created demo user:', userId);

    // Create a sample meeting
    const meetingResult = await query(
      `INSERT INTO meetings (user_id, title, duration, status, processed_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [userId, 'Q1 Product Strategy Review', 2700, 'completed']
    );

    const meetingId = meetingResult.rows[0].id;
    console.log('✅ Created sample meeting:', meetingId);

    // Create speakers
    const speakers = [
      { label: 'SPEAKER_00', custom_name: 'Sarah Chen', talk_time: 756 },
      { label: 'SPEAKER_01', custom_name: 'Mike Johnson', talk_time: 594 },
      { label: 'SPEAKER_02', custom_name: 'Emily Rodriguez', talk_time: 486 },
      { label: 'SPEAKER_03', custom_name: 'David Kim', talk_time: 432 },
    ];

    const speakerIds = [];
    for (const speaker of speakers) {
      const result = await query(
        `INSERT INTO speakers (meeting_id, label, custom_name, talk_time)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [meetingId, speaker.label, speaker.custom_name, speaker.talk_time]
      );
      speakerIds.push(result.rows[0].id);
    }
    console.log('✅ Created speakers');

    // Create sample transcripts
    const transcripts = [
      { speaker_id: speakerIds[0], text: "Alright everyone, thanks for joining. Let's dive into our Q1 product strategy.", start_time: 0.0, end_time: 5.2, confidence: 0.95 },
      { speaker_id: speakerIds[1], text: "Great. We've completed 85% of our planned features for Q4. The main blocker was the API integration.", start_time: 5.5, end_time: 12.3, confidence: 0.92 },
      { speaker_id: speakerIds[2], text: "I think we need to prioritize the mobile experience. Our analytics show 60% of users are on mobile now.", start_time: 13.0, end_time: 20.5, confidence: 0.94 },
      { speaker_id: speakerIds[3], text: "Agreed. We should allocate more resources to the mobile team. I propose we move two engineers from web to mobile.", start_time: 21.0, end_time: 28.7, confidence: 0.93 },
    ];

    for (const transcript of transcripts) {
      await query(
        `INSERT INTO transcripts (meeting_id, speaker_id, text, start_time, end_time, confidence)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [meetingId, transcript.speaker_id, transcript.text, transcript.start_time, transcript.end_time, transcript.confidence]
      );
    }
    console.log('✅ Created sample transcripts');

    // Create action items
    const actionItems = [
      { text: 'Move 2 engineers to mobile team', assignee: 'Mike Johnson', due_date: '2025-01-20', priority: 'high', timestamp: 28.7 },
      { text: 'Complete API integration with CRM', assignee: 'David Kim', due_date: '2025-01-25', priority: 'high', timestamp: 12.3 },
      { text: 'Analyze mobile user experience metrics', assignee: 'Emily Rodriguez', due_date: '2025-01-18', priority: 'medium', timestamp: 20.5, status: 'completed' },
    ];

    for (const item of actionItems) {
      await query(
        `INSERT INTO action_items (meeting_id, text, assignee, due_date, priority, timestamp, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [meetingId, item.text, item.assignee, item.due_date, item.priority, item.timestamp, item.status || 'pending']
      );
    }
    console.log('✅ Created action items');

    // Create decisions
    const decisions = [
      {
        decision_text: 'Prioritize mobile experience for Q1',
        reasoning: '60% of users on mobile, significant growth opportunity',
        made_by: 'Sarah Chen',
        timestamp: 20.5
      },
      {
        decision_text: 'Reallocate 2 engineers from web to mobile',
        reasoning: 'Need more mobile development capacity',
        made_by: 'Team consensus',
        timestamp: 28.7
      },
    ];

    for (const decision of decisions) {
      await query(
        `INSERT INTO decisions (meeting_id, decision_text, reasoning, made_by, timestamp)
         VALUES ($1, $2, $3, $4, $5)`,
        [meetingId, decision.decision_text, decision.reasoning, decision.made_by, decision.timestamp]
      );
    }
    console.log('✅ Created decisions');

    // Create summary
    await query(
      `INSERT INTO summaries (meeting_id, summary_short, summary_medium, summary_full, topics)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        meetingId,
        'Team decided to prioritize mobile experience in Q1 by moving 2 engineers from web to mobile. CRM API integration remains top priority.',
        'The Q1 product strategy meeting focused on addressing mobile user growth (60% of total users). Key decisions included reallocating engineering resources to mobile development and completing the delayed CRM API integration.',
        'This 45-minute strategy session reviewed Q4 achievements (85% feature completion) and set Q1 priorities. The team unanimously agreed to shift focus to mobile experience based on analytics showing 60% mobile users. Major decisions: 1) Move 2 engineers from web to mobile team, 2) Complete CRM API integration by Q1 end, 3) Draft comprehensive mobile roadmap.',
        ['Mobile Strategy', 'Resource Allocation', 'API Integration', 'Q1 Planning']
      ]
    );
    console.log('✅ Created summary');

    // Create sentiment analysis
    await query(
      `INSERT INTO sentiment_analysis (meeting_id, overall_sentiment, timeline, tension_points, speaker_sentiment)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        meetingId,
        'positive',
        JSON.stringify([
          { time: '00:00', value: 75, speaker: 'Sarah Chen' },
          { time: '00:05', value: 72, speaker: 'Sarah Chen' },
          { time: '00:15', value: 65, speaker: 'Mike Johnson' },
          { time: '00:22', value: 80, speaker: 'Emily Rodriguez' },
          { time: '00:28', value: 85, speaker: 'David Kim' },
        ]),
        JSON.stringify([
          { time: '00:15', reason: 'Discussion of API integration delays' }
        ]),
        JSON.stringify({
          'Sarah Chen': { positive: 85, neutral: 10, negative: 5, engagement: 92 },
          'Mike Johnson': { positive: 70, neutral: 25, negative: 5, engagement: 78 },
          'Emily Rodriguez': { positive: 80, neutral: 15, negative: 5, engagement: 85 },
          'David Kim': { positive: 75, neutral: 20, negative: 5, engagement: 82 },
        })
      ]
    );
    console.log('✅ Created sentiment analysis');

    console.log('\n🎉 Database seeded successfully!');
    console.log(`Demo user ID: ${userId}`);
    console.log(`Sample meeting ID: ${meetingId}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
