import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Analyze meeting transcription using Gemini AI
 * Extracts: action items, decisions, summaries, sentiment
 */
export async function analyzeWithAI(meetingId, data) {
  const { transcription, speakers } = data;

  console.log(`Analyzing meeting ${meetingId} with AI...`);

  // Format transcription for AI
  const formattedTranscript = formatTranscriptForAI(transcription);

  // Run all analyses
  const [actionItems, decisions, summary, sentiment] = await Promise.all([
    extractActionItems(formattedTranscript),
    extractDecisions(formattedTranscript),
    generateSummary(formattedTranscript),
    analyzeSentiment(transcription, speakers),
  ]);

  return {
    actionItems,
    decisions,
    summary,
    sentiment,
  };
}

function formatTranscriptForAI(segments) {
  return segments
    .map(
      (seg) =>
        `[${formatTime(seg.start)} - ${formatTime(seg.end)}] ${seg.speaker}: ${seg.text}`
    )
    .join('\n');
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Extract action items from transcription
 */
async function extractActionItems(transcript) {
  if (!genAI) {
    return getMockActionItems();
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze this meeting transcript and extract all action items. For each action item, identify:
1. The task description
2. Who is assigned (if mentioned)
3. Due date (if mentioned, relative to the meeting)
4. Priority (high, medium, or low based on urgency language)
5. Timestamp (approximate time in the meeting)

Return the results as a JSON array with format:
[{"task": "...", "assignee": "...", "dueDate": "YYYY-MM-DD or null", "priority": "high|medium|low", "timestamp": 123.4}]

Transcript:
${transcript}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('AI action item extraction failed:', error);
    return getMockActionItems();
  }
}

/**
 * Extract key decisions from transcription
 */
async function extractDecisions(transcript) {
  if (!genAI) {
    return getMockDecisions();
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze this meeting transcript and extract all key decisions made. For each decision:
1. What was decided
2. The reasoning/justification
3. Who made the decision
4. Timestamp (approximate time)

Return as JSON array:
[{"decision": "...", "reasoning": "...", "madeBy": "...", "timestamp": 123.4}]

Transcript:
${transcript}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('AI decision extraction failed:', error);
    return getMockDecisions();
  }
}

/**
 * Generate meeting summaries (short, medium, full)
 */
async function generateSummary(transcript) {
  if (!genAI) {
    return getMockSummary();
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze this meeting transcript and create three summaries of different lengths:
1. SHORT (30-second read, 1-2 sentences): Key takeaway only
2. MEDIUM (2-minute read, 2-3 sentences): Main points and decisions
3. FULL (5-minute read, paragraph): Comprehensive overview with context, decisions, and next steps
4. TOPICS: Array of 3-5 main topics discussed

Return as JSON:
{
  "short": "...",
  "medium": "...",
  "full": "...",
  "topics": ["Topic 1", "Topic 2", ...]
}

Transcript:
${transcript}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return getMockSummary();
  } catch (error) {
    console.error('AI summary generation failed:', error);
    return getMockSummary();
  }
}

/**
 * Analyze sentiment throughout the meeting
 */
async function analyzeSentiment(segments, speakers) {
  if (!genAI) {
    return getMockSentiment(segments, speakers);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const transcript = formatTranscriptForAI(segments);

    const prompt = `Analyze the sentiment and emotional tone of this meeting. Provide:
1. Overall sentiment (positive, neutral, or negative)
2. Timeline of sentiment values (0-100 scale) at key moments
3. Tension points (times when discussion became heated or concerning)
4. Per-speaker sentiment breakdown

Return as JSON:
{
  "overall": "positive|neutral|negative",
  "timeline": [{"time": "0:00", "value": 75, "speaker": "..."}],
  "tensionPoints": [{"time": "1:23", "reason": "..."}],
  "speakers": {"Speaker Name": {"positive": 80, "neutral": 15, "negative": 5, "engagement": 85}}
}

Transcript:
${transcript}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return getMockSentiment(segments, speakers);
  } catch (error) {
    console.error('AI sentiment analysis failed:', error);
    return getMockSentiment(segments, speakers);
  }
}

// Mock data functions for when API is not available
function getMockActionItems() {
  return [
    {
      task: 'Move 2 engineers to mobile team',
      assignee: 'Mike Johnson',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'high',
      timestamp: 42.0,
    },
    {
      task: 'Complete CRM API integration',
      assignee: 'David Kim',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'high',
      timestamp: 51.5,
    },
    {
      task: 'Draft comprehensive mobile roadmap',
      assignee: 'Product Team',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium',
      timestamp: 52.0,
    },
  ];
}

function getMockDecisions() {
  return [
    {
      decision: 'Prioritize mobile experience for Q1',
      reasoning: '60% of users are on mobile devices',
      madeBy: 'Team consensus',
      timestamp: 33.0,
    },
    {
      decision: 'Reallocate 2 engineers from web to mobile',
      reasoning: 'Need more mobile development capacity',
      madeBy: 'Sarah Chen',
      timestamp: 42.0,
    },
  ];
}

function getMockSummary() {
  return {
    short: 'Team decided to prioritize mobile experience in Q1 by reallocating engineering resources and completing critical API integration.',
    medium: 'The meeting reviewed Q4 progress (85% completion) and set Q1 priorities focused on mobile experience. Key decisions include moving 2 engineers to mobile team and completing CRM API integration.',
    full: 'This quarterly strategy meeting covered Q4 achievements and Q1 planning. The team completed 85% of planned features but faced delays with API integration. Analytics revealed 60% of users are now on mobile, prompting a strategic shift to prioritize mobile experience. Major decisions include reallocating 2 engineers from web to mobile development, completing CRM API integration by end of Q1, and drafting a comprehensive mobile roadmap. The team will follow up with design team and HR to execute these changes.',
    topics: ['Q1 Planning', 'Mobile Strategy', 'Resource Allocation', 'API Integration', 'Product Roadmap'],
  };
}

function getMockSentiment(segments, speakers) {
  const timeline = segments.map((seg, index) => ({
    time: formatTime(seg.start),
    value: 70 + Math.floor(Math.random() * 25), // 70-95
    speaker: seg.speaker,
  }));

  const speakerSentiment = {};
  speakers.forEach((speaker) => {
    speakerSentiment[speaker.label] = {
      positive: 75 + Math.floor(Math.random() * 20), // 75-95
      neutral: 10 + Math.floor(Math.random() * 15), // 10-25
      negative: Math.floor(Math.random() * 10), // 0-10
      engagement: 75 + Math.floor(Math.random() * 20), // 75-95
    };
  });

  return {
    overall: 'positive',
    timeline,
    tensionPoints: [],
    speakers: speakerSentiment,
  };
}

export default analyzeWithAI;
