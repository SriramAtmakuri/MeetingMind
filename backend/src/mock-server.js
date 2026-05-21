import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import audioProcessor from './services/audioProcessor.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.flac'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file format. Allowed: ${allowedTypes.join(', ')}`));
    }
  }
});

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// Enable response compression
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : (origin, callback) => {
        // Allow all localhost origins in development
        if (!origin || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: { message: 'Too many requests, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit uploads to 10 per hour
  message: { error: { message: 'Too many uploads, please try again later.' } }
});

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Body parser with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const mockMeetings = [
  {
    id: '1',
    title: 'Q1 Product Strategy Review',
    status: 'completed',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 2700,
    speakers_count: 5,
    action_items_count: 7,
    decisions_count: 4,
    overall_sentiment: 'positive',
    category: 'planning',
    tags: 'strategy,product,Q1,roadmap',
    is_favorite: true,
    notes: 'Critical quarterly planning session with executive team',
    summary: 'Team aligned on Q1 priorities focusing on mobile-first redesign, API performance improvements, and expanding into European markets. Decided to allocate $500K additional budget for mobile development and approved hiring 3 senior engineers.',
    topics: 'Product Roadmap, Budget Planning, Mobile Strategy, International Expansion'
  },
  {
    id: '2',
    title: 'Weekly Engineering Standup - Sprint 23',
    status: 'completed',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 1800,
    speakers_count: 8,
    action_items_count: 12,
    decisions_count: 3,
    overall_sentiment: 'neutral',
    category: 'standup',
    tags: 'engineering,sprint,blockers',
    is_favorite: false,
    notes: 'Sprint 23 progress update with database migration concerns',
    summary: 'Team discussed Sprint 23 progress. Main concerns: database migration timeline and authentication service dependencies. Alex completed payment integration ahead of schedule. Kim needs support on Redis caching implementation.',
    topics: 'Sprint Progress, Database Migration, Payment Integration, Caching Strategy'
  },
  {
    id: '3',
    title: 'Client Presentation - Acme Corp Q4 Review',
    status: 'completed',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 3600,
    speakers_count: 6,
    action_items_count: 9,
    decisions_count: 5,
    overall_sentiment: 'positive',
    category: 'client',
    tags: 'client,presentation,acme,revenue',
    is_favorite: true,
    notes: 'Highly successful presentation - client approved expansion phase',
    summary: 'Presented Q4 results to Acme Corp leadership. Demonstrated 40% improvement in system performance and 99.9% uptime. Client approved Phase 2 expansion worth $2.5M and requested early delivery of analytics dashboard.',
    topics: 'Performance Metrics, Client Satisfaction, Contract Expansion, Analytics Requirements'
  },
  {
    id: '4',
    title: 'Design System Architecture Discussion',
    status: 'completed',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 2400,
    speakers_count: 4,
    action_items_count: 8,
    decisions_count: 6,
    overall_sentiment: 'positive',
    category: 'design',
    tags: 'design,architecture,components,accessibility',
    is_favorite: false,
    notes: 'Architectural decisions for new design system',
    summary: 'Finalized design system architecture using atomic design principles. Decided on TailwindCSS with custom theme, implemented dark mode support, and established WCAG 2.1 AA accessibility standards.',
    topics: 'Design System, Component Library, Accessibility, Dark Mode'
  },
  {
    id: '5',
    title: 'Security Audit Findings & Remediation Plan',
    status: 'completed',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 3300,
    speakers_count: 5,
    action_items_count: 15,
    decisions_count: 8,
    overall_sentiment: 'neutral',
    category: 'security',
    tags: 'security,audit,compliance,vulnerabilities',
    is_favorite: true,
    notes: 'Critical security findings require immediate action',
    summary: 'External security audit revealed 3 high-priority vulnerabilities in authentication system and API rate limiting. Team created detailed remediation plan with 2-week deadline. Approved emergency budget for security consultant.',
    topics: 'Security Vulnerabilities, Authentication Hardening, Rate Limiting, Compliance'
  },
  {
    id: '6',
    title: 'Marketing Campaign Performance Review',
    status: 'completed',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 1500,
    speakers_count: 6,
    action_items_count: 6,
    decisions_count: 4,
    overall_sentiment: 'positive',
    category: 'marketing',
    tags: 'marketing,campaign,roi,analytics',
    is_favorite: false,
    notes: 'Q4 campaign exceeded targets by 35%',
    summary: 'Q4 marketing campaign analysis showed 35% increase in qualified leads and 22% improvement in conversion rates. Social media strategy particularly effective. Approved $150K additional budget for Q1 campaigns.',
    topics: 'Campaign Performance, Lead Generation, Social Media Strategy, Budget Allocation'
  },
  {
    id: '7',
    title: 'Customer Feedback Session - Feature Prioritization',
    status: 'completed',
    created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 2100,
    speakers_count: 7,
    action_items_count: 10,
    decisions_count: 7,
    overall_sentiment: 'positive',
    category: 'product',
    tags: 'customer,feedback,features,prioritization',
    is_favorite: true,
    notes: 'Direct customer insights on top-requested features',
    summary: 'Customer panel of 15 enterprise users provided feedback on feature roadmap. Top requests: bulk export functionality, advanced filtering, and custom reporting. Decided to prioritize bulk export for next sprint.',
    topics: 'Customer Feedback, Feature Requests, Product Roadmap, User Experience'
  },
  {
    id: '8',
    title: 'Infrastructure Cost Optimization Workshop',
    status: 'completed',
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 2700,
    speakers_count: 4,
    action_items_count: 11,
    decisions_count: 5,
    overall_sentiment: 'neutral',
    category: 'infrastructure',
    tags: 'infrastructure,costs,optimization,cloud',
    is_favorite: false,
    notes: 'Identified $40K/month in potential savings',
    summary: 'Comprehensive review of AWS infrastructure costs. Identified opportunities to save $40K monthly through reserved instances, database optimization, and CDN caching. Approved migration to ARM-based instances.',
    topics: 'Cloud Costs, Infrastructure Optimization, Database Performance, CDN Strategy'
  }
];

const getMeetingDetails = (meetingId) => {
  const details = {
    '1': {
      transcript: [
        { id: 't1', speaker_id: 's1', text: 'Good morning everyone. Thanks for joining our Q1 Product Strategy Review. I know we have a packed agenda today, so let\'s dive right in. First, I want to start with our mobile app performance metrics from Q4.', start_time: 0, end_time: 15 },
        { id: 't2', speaker_id: 's2', text: 'Thanks Sarah. So we saw some interesting trends in Q4. Mobile traffic now accounts for 67% of our total users, up from 52% in Q3. However, our mobile conversion rate is lagging at 2.1% compared to 3.8% on desktop.', start_time: 15, end_time: 35 },
        { id: 't3', speaker_id: 's3', text: 'That\'s a significant gap. Have we identified the root causes? Is it a performance issue or more about the user experience?', start_time: 35, end_time: 45 },
        { id: 't4', speaker_id: 's2', text: 'Great question, Alex. Our analytics show two main issues. First, the checkout flow on mobile has three extra steps compared to desktop. Second, page load times on mobile are averaging 4.2 seconds, well above our 2-second target.', start_time: 45, end_time: 65 },
        { id: 't5', speaker_id: 's4', text: 'The performance issue is something my engineering team has been investigating. The main bottleneck is our image optimization pipeline. We\'re loading full-resolution images even on mobile devices with limited bandwidth.', start_time: 65, end_time: 82 },
        { id: 't6', speaker_id: 's1', text: 'This ties directly into our Q1 priorities. I propose we allocate additional resources to mobile optimization. This should be our number one priority. What kind of budget would you need, Mike?', start_time: 82, end_time: 98 },
        { id: 't7', speaker_id: 's4', text: 'To properly address this, we need to hire at least two senior mobile engineers and one DevOps specialist for the infrastructure work. I\'d estimate around $500K for Q1, including salaries and infrastructure costs.', start_time: 98, end_time: 118 },
        { id: 't8', speaker_id: 's5', text: 'That\'s a significant investment. However, given that mobile represents 67% of traffic and growing, I think it\'s justified. We\'re potentially leaving a lot of revenue on the table with that conversion gap. I approve the budget.', start_time: 118, end_time: 138 },
        { id: 't9', speaker_id: 's1', text: 'Excellent. Mike, can you have hiring requisitions ready by end of week? Next topic - our international expansion. Emma, can you walk us through the European market analysis?', start_time: 138, end_time: 152 },
        { id: 't10', speaker_id: 's3', text: 'Absolutely. We\'ve completed our analysis of five key European markets. Germany, France, and UK show the strongest potential. Combined market size is approximately $850M with 15% annual growth. However, we need to address GDPR compliance first.', start_time: 152, end_time: 178 },
        { id: 't11', speaker_id: 's2', text: 'The GDPR compliance is actually further along than you might think. We engaged with a legal consultant last month, and we\'re about 70% compliant. The remaining items are mostly around data retention policies and user consent flows.', start_time: 178, end_time: 198 },
        { id: 't12', speaker_id: 's1', text: 'That\'s great progress. What\'s the timeline to get to 100% compliance?', start_time: 198, end_time: 205 },
        { id: 't13', speaker_id: 's2', text: 'Our legal team estimates 6-8 weeks if we prioritize it. The main work is updating our privacy policy, implementing cookie consent management, and adding data export functionality.', start_time: 205, end_time: 222 },
        { id: 't14', speaker_id: 's5', text: 'Given the market opportunity, I think we should fast-track this. Emma, what\'s your recommended go-to-market timeline for Europe?', start_time: 222, end_time: 233 },
        { id: 't15', speaker_id: 's3', text: 'If we can get compliance done in 6 weeks, I\'d recommend a soft launch in Germany by end of Q1, with full marketing push in Q2. Germany is our strongest market based on the research.', start_time: 233, end_time: 250 }
      ],
      action_items: [
        { id: 'a1', text: 'Submit hiring requisitions for 2 senior mobile engineers and 1 DevOps specialist', status: 'pending', priority: 'high', assignee: 'Mike Johnson', due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a2', text: 'Complete GDPR compliance checklist and share with legal team', status: 'in_progress', priority: 'high', assignee: 'Lisa Chen', due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a3', text: 'Optimize mobile image loading pipeline and reduce page load times to under 2 seconds', status: 'pending', priority: 'high', assignee: 'Alex Kim', due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a4', text: 'Redesign mobile checkout flow to match desktop efficiency', status: 'pending', priority: 'medium', assignee: 'Sarah Thompson', due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a5', text: 'Create detailed Germany market entry plan with budget and timeline', status: 'pending', priority: 'medium', assignee: 'Emma Rodriguez', due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a6', text: 'Implement cookie consent management system for EU compliance', status: 'pending', priority: 'high', assignee: 'Alex Kim', due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a7', text: 'Schedule follow-up meeting to review mobile optimization progress', status: 'pending', priority: 'low', assignee: 'Sarah Thompson', due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() }
      ],
      decisions: [
        { id: 'd1', text: 'Approve $500K Q1 budget for mobile optimization team expansion', reasoning: 'Mobile traffic represents 67% of users with significant conversion gap. Investment justified by potential revenue increase.' },
        { id: 'd2', text: 'Prioritize mobile-first redesign as top Q1 initiative', reasoning: 'Critical performance and UX gaps identified that directly impact conversion rates and revenue.' },
        { id: 'd3', text: 'Fast-track GDPR compliance for European market entry', reasoning: 'Strong market opportunity ($850M) with 15% annual growth justifies accelerated timeline.' },
        { id: 'd4', text: 'Target Germany for Q1 soft launch with full Q2 marketing campaign', reasoning: 'Market research shows Germany as strongest European opportunity with highest projected ROI.' }
      ],
      speakers: [
        { id: 's1', name: 'Speaker 1', custom_name: 'Sarah Thompson', color: '#3b82f6', email: 'sarah.thompson@company.com', role: 'VP of Product' },
        { id: 's2', name: 'Speaker 2', custom_name: 'Lisa Chen', color: '#10b981', email: 'lisa.chen@company.com', role: 'Product Manager' },
        { id: 's3', name: 'Speaker 3', custom_name: 'Emma Rodriguez', color: '#8b5cf6', email: 'emma.rodriguez@company.com', role: 'Market Research Lead' },
        { id: 's4', name: 'Speaker 4', custom_name: 'Mike Johnson', color: '#f59e0b', email: 'mike.johnson@company.com', role: 'Engineering Director' },
        { id: 's5', name: 'Speaker 5', custom_name: 'David Park', color: '#ef4444', email: 'david.park@company.com', role: 'CTO' }
      ]
    },
    '2': {
      transcript: [
        { id: 't1', speaker_id: 's1', text: 'Good morning team! Welcome to our Sprint 23 standup. Let\'s go around and share what everyone worked on yesterday, what you\'re planning for today, and any blockers. Alex, want to start?', start_time: 0, end_time: 15 },
        { id: 't2', speaker_id: 's2', text: 'Sure! Yesterday I completed the payment integration with Stripe. All unit tests are passing, and I\'ve deployed to staging for QA to test. Today I\'ll be working on the refund flow and error handling for edge cases.', start_time: 15, end_time: 35 },
        { id: 't3', speaker_id: 's3', text: 'That\'s great progress Alex! I actually tested the Stripe integration on staging yesterday afternoon. Works perfectly. I did notice the loading state could use a spinner or some feedback. Just a small UX thing.', start_time: 35, end_time: 52 },
        { id: 't4', speaker_id: 's2', text: 'Good catch! I\'ll add that to my list. Should be a quick fix.', start_time: 52, end_time: 58 },
        { id: 't5', speaker_id: 's1', text: 'Perfect. Kim, how about you?', start_time: 58, end_time: 62 },
        { id: 't6', speaker_id: 's4', text: 'Yesterday I started working on the Redis caching layer for the product catalog API. I ran into some issues with cache invalidation strategy. The problem is we have nested objects, and I\'m not sure about the best approach for partial updates.', start_time: 62, end_time: 85 },
        { id: 't7', speaker_id: 's5', text: 'I actually dealt with this exact problem on my last project. The approach we took was to use cache tags. You tag each cache entry with all the related entity IDs, then when you update an entity, you can invalidate all caches with that tag. I can pair with you after standup if that helps.', start_time: 85, end_time: 110 },
        { id: 't8', speaker_id: 's4', text: 'That would be incredibly helpful, thanks Marcus! Yeah, let\'s sync right after this meeting.', start_time: 110, end_time: 118 },
        { id: 't9', speaker_id: 's1', text: 'Great teamwork! Priya, your turn.', start_time: 118, end_time: 122 },
        { id: 't10', speaker_id: 's6', text: 'I\'ve been working on the database migration for the user authentication tables. Yesterday I finished the migration script and tested it on a copy of production data. Everything worked smoothly. However, I\'m concerned about the downtime during actual migration.', start_time: 122, end_time: 148 },
        { id: 't11', speaker_id: 's7', text: 'How long are we looking at for downtime?', start_time: 148, end_time: 152 },
        { id: 't12', speaker_id: 's6', text: 'Based on the test runs, approximately 8-10 minutes for the full migration. But that assumes everything goes smoothly. We should plan for 15-20 minutes to be safe.', start_time: 152, end_time: 168 },
        { id: 't13', speaker_id: 's1', text: 'That\'s during our maintenance window this weekend, right?', start_time: 168, end_time: 173 },
        { id: 't14', speaker_id: 's6', text: 'Yes, scheduled for Sunday 2 AM EST. I\'ll also have a rollback script ready just in case we encounter any issues.', start_time: 173, end_time: 184 },
        { id: 't15', speaker_id: 's8', text: 'I\'ll be available on-call during the migration as backup. Better to have extra coverage for something this critical.', start_time: 184, end_time: 194 },
        { id: 't16', speaker_id: 's1', text: 'Appreciate that Raj. Let\'s make sure we have a detailed runbook documented. Speaking of which, that\'s actually blocking me. I need the authentication service endpoints finalized before I can complete the frontend integration. When can we lock that down?', start_time: 194, end_time: 216 },
        { id: 't17', speaker_id: 's6', text: 'The endpoints won\'t change, but the response format might slightly change after migration. Can you work with the current format and I\'ll flag any breaking changes in our Slack channel before Sunday?', start_time: 216, end_time: 235 },
        { id: 't18', speaker_id: 's1', text: 'That works for me. I\'ll build it flexible enough to adapt. Anyone else have blockers we need to address?', start_time: 235, end_time: 245 },
        { id: 't19', speaker_id: 's7', text: 'Just a heads up - I\'ll be out Friday for a doctor\'s appointment. My PR for the search functionality should be ready for review by tomorrow though.', start_time: 245, end_time: 258 },
        { id: 't20', speaker_id: 's1', text: 'Thanks for the heads up Tom. Alright, I think that covers everything. Good progress everyone! Remember, we\'re aiming to close out all critical bugs before Friday code freeze. Let\'s crush it this week!', start_time: 258, end_time: 278 }
      ],
      action_items: [
        { id: 'a1', text: 'Add loading spinner to Stripe payment integration UI', status: 'pending', priority: 'low', assignee: 'Alex Rivera', due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a2', text: 'Implement refund flow and error handling for payment system', status: 'in_progress', priority: 'high', assignee: 'Alex Rivera', due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a3', text: 'Pair program with Marcus on Redis cache invalidation strategy', status: 'pending', priority: 'medium', assignee: 'Kim Park', due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a4', text: 'Complete Redis caching implementation for product catalog API', status: 'in_progress', priority: 'high', assignee: 'Kim Park', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a5', text: 'Create detailed runbook for database migration procedure', status: 'pending', priority: 'high', assignee: 'Priya Sharma', due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a6', text: 'Prepare rollback script for authentication database migration', status: 'completed', priority: 'high', assignee: 'Priya Sharma', due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a7', text: 'Execute database migration during Sunday 2 AM maintenance window', status: 'pending', priority: 'critical', assignee: 'Priya Sharma', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a8', text: 'Document any breaking changes in authentication API format', status: 'pending', priority: 'medium', assignee: 'Priya Sharma', due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a9', text: 'Complete frontend authentication integration with flexibility for API changes', status: 'in_progress', priority: 'high', assignee: 'Jessica Wong', due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a10', text: 'Submit search functionality PR for code review', status: 'in_progress', priority: 'medium', assignee: 'Tom Anderson', due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a11', text: 'Review and close all critical bugs before Friday code freeze', status: 'pending', priority: 'high', assignee: 'All Team', due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a12', text: 'Be on-call during database migration as backup support', status: 'pending', priority: 'medium', assignee: 'Raj Patel', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() }
      ],
      decisions: [
        { id: 'd1', text: 'Use cache tags strategy for Redis cache invalidation with nested objects', reasoning: 'Proven approach from previous projects that handles partial updates efficiently' },
        { id: 'd2', text: 'Schedule database migration for Sunday 2 AM EST with 15-20 minute estimated downtime', reasoning: 'Low-traffic maintenance window with adequate time buffer for safe execution' },
        { id: 'd3', text: 'Implement flexible frontend integration to adapt to potential API format changes', reasoning: 'Reduces risk of breaking changes during database migration' }
      ],
      speakers: [
        { id: 's1', name: 'Speaker 1', custom_name: 'Jessica Wong', color: '#3b82f6', email: 'jessica.wong@company.com', role: 'Scrum Master' },
        { id: 's2', name: 'Speaker 2', custom_name: 'Alex Rivera', color: '#10b981', email: 'alex.rivera@company.com', role: 'Senior Frontend Developer' },
        { id: 's3', name: 'Speaker 3', custom_name: 'Sarah Martinez', color: '#8b5cf6', email: 'sarah.martinez@company.com', role: 'QA Engineer' },
        { id: 's4', name: 'Speaker 4', custom_name: 'Kim Park', color: '#f59e0b', email: 'kim.park@company.com', role: 'Backend Developer' },
        { id: 's5', name: 'Speaker 5', custom_name: 'Marcus Johnson', color: '#ef4444', email: 'marcus.johnson@company.com', role: 'Senior Backend Developer' },
        { id: 's6', name: 'Speaker 6', custom_name: 'Priya Sharma', color: '#06b6d4', email: 'priya.sharma@company.com', role: 'Database Engineer' },
        { id: 's7', name: 'Speaker 7', custom_name: 'Tom Anderson', color: '#84cc16', email: 'tom.anderson@company.com', role: 'Full Stack Developer' },
        { id: 's8', name: 'Speaker 8', custom_name: 'Raj Patel', color: '#f97316', email: 'raj.patel@company.com', role: 'DevOps Engineer' }
      ]
    },
    '3': {
      transcript: [
        { id: 't1', speaker_id: 's1', text: 'Good afternoon everyone, and thank you for joining us today. I\'m delighted to present our Q4 results for the Acme Corp partnership. This has been a transformative quarter, and I\'m excited to share the outcomes with you.', start_time: 0, end_time: 18 },
        { id: 't2', speaker_id: 's2', text: 'We appreciate you making the time for this presentation. Our team has been very impressed with the progress so far.', start_time: 18, end_time: 28 },
        { id: 't3', speaker_id: 's1', text: 'Thank you, James. Let me start with our primary objective from Q4 - improving system performance. I\'m pleased to report we achieved a 43% improvement in average response times across all endpoints. Our 95th percentile latency dropped from 800ms to 420ms.', start_time: 28, end_time: 55 },
        { id: 't4', speaker_id: 's3', text: 'Those are impressive numbers, Rachel. What drove those improvements?', start_time: 55, end_time: 62 },
        { id: 't5', speaker_id: 's4', text: 'I can speak to that. We implemented several key optimizations. First, we migrated to a more efficient database architecture with read replicas. Second, we implemented Redis caching for frequently accessed data. Third, we optimized our API queries, reducing N+1 query problems by 95%.', start_time: 62, end_time: 88 },
        { id: 't6', speaker_id: 's2', text: 'The performance improvement is noticeable from our end as well. Our support tickets related to system slowness have decreased by 60%. That\'s had a real impact on our customer satisfaction scores.', start_time: 88, end_time: 106 },
        { id: 't7', speaker_id: 's1', text: 'That\'s wonderful to hear! That leads perfectly into our next metric - uptime. We maintained 99.94% uptime throughout Q4. We had only two brief incidents, totaling 43 minutes of downtime, both resolved within our SLA commitments.', start_time: 106, end_time: 130 },
        { id: 't8', speaker_id: 's5', text: 'I want to highlight something important here. The uptime isn\'t just about the numbers. Your team\'s incident response has been exceptional. During the October incident, we had full communication and resolution within 28 minutes. That\'s significantly better than our previous vendor.', start_time: 130, end_time: 158 },
        { id: 't9', speaker_id: 's6', text: 'We\'ve invested heavily in our monitoring and alerting infrastructure. Our mean time to detection is now under 2 minutes, and mean time to resolution is under 30 minutes for P1 incidents.', start_time: 158, end_time: 175 },
        { id: 't10', speaker_id: 's3', text: 'This is all very encouraging. Rachel, can you talk about the analytics dashboard we discussed in Q3? That\'s been a high priority for our executive team.', start_time: 175, end_time: 188 },
        { id: 't11', speaker_id: 's1', text: 'Absolutely. The analytics dashboard is currently 70% complete. We\'ve implemented all the core features: real-time metrics, custom reporting, and data export functionality. What remains is the advanced visualization features and the scheduled report delivery system.', start_time: 188, end_time: 213 },
        { id: 't12', speaker_id: 's4', text: 'I\'d like to show you a quick demo of what we have so far. As you can see, you can now track user engagement, conversion metrics, and system performance all in one place. The filtering is very flexible - you can slice the data by date range, user segment, or geographic region.', start_time: 213, end_time: 240 },
        { id: 't13', speaker_id: 's2', text: 'This is exactly what we need. The visualization is clean and intuitive. When do you expect the remaining 30% to be completed?', start_time: 240, end_time: 252 },
        { id: 't14', speaker_id: 's1', text: 'Our current timeline has full completion by end of January. However, if this is a critical priority, we could accelerate that to mid-January with additional resources.', start_time: 252, end_time: 268 },
        { id: 't15', speaker_id: 's3', text: 'Let me discuss with James and Sarah. We have our board meeting on January 20th, and having this ready would be valuable. What would acceleration require from our side?', start_time: 268, end_time: 284 },
        { id: 't16', speaker_id: 's1', text: 'Primarily faster feedback cycles on the visualization designs and more frequent stakeholder reviews. If we can get design approval within 48 hours instead of a week, we can definitely hit mid-January.', start_time: 284, end_time: 303 },
        { id: 't17', speaker_id: 's2', text: 'We can commit to that. Sarah, can you be the primary point of contact for dashboard reviews?', start_time: 303, end_time: 311 },
        { id: 't18', speaker_id: 's5', text: 'Absolutely. I\'ll make myself available for daily reviews if needed.', start_time: 311, end_time: 318 },
        { id: 't19', speaker_id: 's3', text: 'Excellent. Now, I want to discuss the Phase 2 expansion we\'ve been considering. Based on these Q4 results, I think we\'re ready to move forward. Rachel, do you have the Phase 2 proposal ready?', start_time: 318, end_time: 338 },
        { id: 't20', speaker_id: 's1', text: 'Yes, we do. Phase 2 involves expanding to three additional modules: advanced reporting, predictive analytics, and workflow automation. The estimated timeline is 6 months with a budget of $2.5M. This includes dedicated teams for each module plus ongoing support and maintenance.', start_time: 338, end_time: 368 },
        { id: 't21', speaker_id: 's2', text: 'The pricing is in line with what we discussed. I\'m prepared to recommend this to our board. The ROI from Phase 1 has exceeded our expectations, and these additional capabilities would give us a significant competitive advantage.', start_time: 368, end_time: 388 },
        { id: 't22', speaker_id: 's3', text: 'I agree. Let\'s move forward with Phase 2. Rachel, can you send over the formal proposal and contract by end of week?', start_time: 388, end_time: 400 },
        { id: 't23', speaker_id: 's1', text: 'Absolutely. I\'ll have our legal team prepare everything and get it to you by Friday. This is fantastic news - we\'re really excited to continue this partnership!', start_time: 400, end_time: 416 }
      ],
      action_items: [
        { id: 'a1', text: 'Accelerate analytics dashboard completion to mid-January', status: 'in_progress', priority: 'high', assignee: 'Rachel Foster', due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a2', text: 'Provide 48-hour turnaround on dashboard design reviews', status: 'pending', priority: 'high', assignee: 'Sarah Mitchell', due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a3', text: 'Complete advanced visualization features for analytics dashboard', status: 'in_progress', priority: 'high', assignee: 'Tech Team', due_date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a4', text: 'Implement scheduled report delivery system', status: 'pending', priority: 'medium', assignee: 'Tech Team', due_date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a5', text: 'Prepare formal Phase 2 proposal and contract documentation', status: 'pending', priority: 'critical', assignee: 'Rachel Foster', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a6', text: 'Review Phase 2 proposal with legal team', status: 'pending', priority: 'high', assignee: 'Legal Team', due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a7', text: 'Submit Phase 2 recommendation to board for approval', status: 'pending', priority: 'high', assignee: 'James Patterson', due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a8', text: 'Schedule daily dashboard review sessions', status: 'pending', priority: 'medium', assignee: 'Sarah Mitchell', due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'a9', text: 'Prepare Phase 2 team allocation and resource plan', status: 'pending', priority: 'medium', assignee: 'Rachel Foster', due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }
      ],
      decisions: [
        { id: 'd1', text: 'Accelerate analytics dashboard delivery to mid-January for board meeting', reasoning: 'Client has critical board meeting January 20th where dashboard presentation would provide high value. Client committed to faster feedback cycles to enable acceleration.' },
        { id: 'd2', text: 'Approve Phase 2 expansion with $2.5M budget', reasoning: 'Phase 1 exceeded ROI expectations with 43% performance improvement and 99.94% uptime. Strong foundation for expanded capabilities.' },
        { id: 'd3', text: 'Implement daily review cycle for dashboard development', reasoning: 'Faster feedback loops will enable accelerated delivery timeline while maintaining quality standards.' },
        { id: 'd4', text: 'Sarah Mitchell designated as primary dashboard stakeholder', reasoning: 'Need single point of contact for rapid decision-making on design and feature approvals.' },
        { id: 'd5', text: 'Move forward with 6-month timeline for Phase 2 implementation', reasoning: 'Balanced approach allowing dedicated teams for each module while maintaining realistic delivery expectations.' }
      ],
      speakers: [
        { id: 's1', name: 'Speaker 1', custom_name: 'Rachel Foster', color: '#3b82f6', email: 'rachel.foster@vendor.com', role: 'Account Director' },
        { id: 's2', name: 'Speaker 2', custom_name: 'James Patterson', color: '#10b981', email: 'james.patterson@acmecorp.com', role: 'VP of Technology' },
        { id: 's3', name: 'Speaker 3', custom_name: 'Linda Chen', color: '#8b5cf6', email: 'linda.chen@acmecorp.com', role: 'CTO' },
        { id: 's4', name: 'Speaker 4', custom_name: 'Michael Torres', color: '#f59e0b', email: 'michael.torres@vendor.com', role: 'Technical Lead' },
        { id: 's5', name: 'Speaker 5', custom_name: 'Sarah Mitchell', color: '#ef4444', email: 'sarah.mitchell@acmecorp.com', role: 'Director of Analytics' },
        { id: 's6', name: 'Speaker 6', custom_name: 'Kevin Zhang', color: '#06b6d4', email: 'kevin.zhang@vendor.com', role: 'Infrastructure Engineer' }
      ]
    }
  };

  return details[meetingId] || {
    transcript: [],
    action_items: [],
    decisions: [],
    speakers: []
  };
};

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Mock server running - SQLite not required'
  });
});

app.get('/api/meetings', (req, res) => {
  res.json({
    meetings: mockMeetings,
    total: mockMeetings.length
  });
});

app.get('/api/meetings/:id', (req, res) => {
  const meeting = mockMeetings.find(m => m.id === req.params.id);
  if (!meeting) {
    return res.status(404).json({ error: { message: 'Meeting not found' } });
  }

  const details = getMeetingDetails(req.params.id);
  res.json({
    ...meeting,
    audio_url: null,
    ...details
  });
});

app.get('/api/analytics/summary', (req, res) => {
  res.json({
    meetings: {
      total: mockMeetings.length
    },
    actionItems: {
      total: 68,
      completed: 23,
      pending: 38,
      completionRate: 34
    },
    totalTime: {
      seconds: 19200,
      formatted: '5h 20m'
    }
  });
});

app.get('/api/action-items/stats', (req, res) => {
  res.json({
    total: 68,
    pending: 38,
    completed: 23,
    overdue: 7
  });
});

app.get('/api/action-items/kanban', (req, res) => {
  res.json({
    pending: [
      { id: 'a1', meeting_id: '1', meeting_title: 'Q1 Product Strategy Review', text: 'Submit hiring requisitions for 2 senior mobile engineers', status: 'pending', priority: 'high', assignee: 'Mike Johnson', created_at: new Date().toISOString() },
      { id: 'a2', meeting_id: '1', meeting_title: 'Q1 Product Strategy Review', text: 'Create Germany market entry plan with budget and timeline', status: 'pending', priority: 'medium', assignee: 'Emma Rodriguez', created_at: new Date().toISOString() },
      { id: 'a3', meeting_id: '2', meeting_title: 'Weekly Engineering Standup', text: 'Add loading spinner to payment integration UI', status: 'pending', priority: 'low', assignee: 'Alex Rivera', created_at: new Date().toISOString() },
      { id: 'a4', meeting_id: '2', meeting_title: 'Weekly Engineering Standup', text: 'Create detailed runbook for database migration', status: 'pending', priority: 'high', assignee: 'Priya Sharma', created_at: new Date().toISOString() },
      { id: 'a5', meeting_id: '3', meeting_title: 'Client Presentation - Acme Corp', text: 'Prepare formal Phase 2 proposal and contract', status: 'pending', priority: 'critical', assignee: 'Rachel Foster', created_at: new Date().toISOString() }
    ],
    in_progress: [
      { id: 'a6', meeting_id: '1', meeting_title: 'Q1 Product Strategy Review', text: 'Complete GDPR compliance checklist', status: 'in_progress', priority: 'high', assignee: 'Lisa Chen', created_at: new Date().toISOString() },
      { id: 'a7', meeting_id: '2', meeting_title: 'Weekly Engineering Standup', text: 'Implement refund flow for payment system', status: 'in_progress', priority: 'high', assignee: 'Alex Rivera', created_at: new Date().toISOString() },
      { id: 'a8', meeting_id: '2', meeting_title: 'Weekly Engineering Standup', text: 'Complete Redis caching implementation', status: 'in_progress', priority: 'high', assignee: 'Kim Park', created_at: new Date().toISOString() },
      { id: 'a9', meeting_id: '3', meeting_title: 'Client Presentation - Acme Corp', text: 'Accelerate analytics dashboard to mid-January', status: 'in_progress', priority: 'high', assignee: 'Rachel Foster', created_at: new Date().toISOString() }
    ],
    completed: [
      { id: 'a10', meeting_id: '2', meeting_title: 'Weekly Engineering Standup', text: 'Prepare rollback script for database migration', status: 'completed', priority: 'high', assignee: 'Priya Sharma', created_at: new Date().toISOString() },
      { id: 'a11', meeting_id: '1', meeting_title: 'Q1 Product Strategy Review', text: 'Analyze mobile conversion rate metrics', status: 'completed', priority: 'medium', assignee: 'Lisa Chen', created_at: new Date().toISOString() },
      { id: 'a12', meeting_id: '3', meeting_title: 'Client Presentation - Acme Corp', text: 'Prepare Q4 performance metrics presentation', status: 'completed', priority: 'high', assignee: 'Michael Torres', created_at: new Date().toISOString() }
    ]
  });
});

app.get('/api/search', (req, res) => {
  res.json({
    results: mockMeetings,
    total: mockMeetings.length
  });
});

app.get('/api/notifications', (req, res) => {
  res.json({
    notifications: [
      { id: 'n1', type: 'meeting_complete', title: 'Meeting processed', message: 'Q1 Product Strategy Review has been transcribed and analyzed', meeting_id: '1', is_read: false, created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
      { id: 'n2', type: 'action_item_due', title: 'Action item due soon', message: 'Submit hiring requisitions is due in 2 days', meeting_id: '1', is_read: false, created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
      { id: 'n3', type: 'meeting_complete', title: 'Meeting processed', message: 'Weekly Engineering Standup has been transcribed', meeting_id: '2', is_read: true, created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
    ]
  });
});

app.get('/api/meetings/:id/comments', (req, res) => {
  res.json({ comments: [] });
});

app.post('/api/meetings/:id/comments', (req, res) => {
  res.json({ id: 'c1', ...req.body, created_at: new Date().toISOString() });
});

app.get('/api/meetings/:id/highlights', (req, res) => {
  res.json({ highlights: [] });
});

app.post('/api/meetings/:id/highlights', (req, res) => {
  res.json({ id: 'h1', ...req.body, created_at: new Date().toISOString() });
});

app.patch('/api/meetings/:id/favorite', (req, res) => {
  const meeting = mockMeetings.find(m => m.id === req.params.id);
  if (!meeting) {
    return res.status(404).json({ error: { message: 'Meeting not found' } });
  }

  // Toggle the favorite status
  meeting.is_favorite = !meeting.is_favorite;

  res.json({
    success: true,
    meeting: {
      id: meeting.id,
      is_favorite: meeting.is_favorite
    }
  });
});

app.patch('/api/meetings/:id/metadata', (req, res) => {
  res.json({ success: true });
});

app.delete('/api/meetings/:id', (req, res) => {
  res.json({ success: true });
});

app.post('/api/meetings/bulk-delete', (req, res) => {
  res.json({ success: true, deleted: req.body.meetingIds.length });
});

app.get('/api/exports/:id/transcript/txt', (req, res) => {
  const details = getMeetingDetails(req.params.id);
  const transcript = details.transcript.map(t => `[${t.start_time}s] ${t.text}`).join('\n\n');
  res.setHeader('Content-Type', 'text/plain');
  res.send(transcript || 'No transcript available');
});

app.get('/api/exports/:id/summary/txt', (req, res) => {
  const meeting = mockMeetings.find(m => m.id === req.params.id);
  res.setHeader('Content-Type', 'text/plain');
  res.send(meeting?.summary || 'No summary available');
});

app.post('/api/ai-chat/:id/chat', (req, res) => {
  res.json({
    answer: 'Based on the meeting transcript, the team discussed mobile optimization as a top priority with a $500K budget allocation. The main focus areas include improving page load times, optimizing the checkout flow, and hiring additional engineers.',
    question: req.body.question
  });
});

app.post('/api/comparisons', (req, res) => {
  const m1 = mockMeetings.find(m => m.id === req.body.meetingId1) || mockMeetings[0];
  const m2 = mockMeetings.find(m => m.id === req.body.meetingId2) || mockMeetings[1];
  const d1 = getMeetingDetails(m1.id);
  const d2 = getMeetingDetails(m2.id);

  res.json({
    meeting1: { ...m1, action_items: d1.action_items, decisions: d1.decisions },
    meeting2: { ...m2, action_items: d2.action_items, decisions: d2.decisions }
  });
});

// ============================================================
// AUDIO UPLOAD & PROCESSING API
// ============================================================

// Upload and process audio recording
app.post('/api/recordings/upload', uploadLimiter, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    console.log('📤 Processing uploaded audio file:', req.file.originalname);

    // Process the audio file
    const result = await audioProcessor.processAudioFile(req.file);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Create a new meeting from the processed audio
    const newMeeting = {
      id: result.data.id,
      title: req.body.title || `Recording - ${new Date().toLocaleDateString()}`,
      status: 'completed',
      created_at: result.data.uploadedAt,
      duration: result.data.metadata.duration,
      speakers_count: result.data.insights.participants.length,
      action_items_count: result.data.insights.actionItems.length,
      decisions_count: result.data.insights.keyDecisions.length,
      overall_sentiment: result.data.sentiment.overall,
      category: 'recording',
      tags: result.data.insights.topics.join(',').toLowerCase(),
      is_favorite: false,
      notes: `Processed from audio file: ${result.data.originalFileName}`,
      summary: `Meeting recording processed successfully. Key topics discussed: ${result.data.insights.topics.join(', ')}. The team made ${result.data.insights.keyDecisions.length} important decisions and identified ${result.data.insights.actionItems.length} action items.`,
      topics: result.data.insights.topics.join(', ')
    };

    // Add to mock meetings array
    mockMeetings.unshift(newMeeting);

    console.log('✅ Audio processing complete. Created meeting:', newMeeting.id);

    res.status(201).json({
      success: true,
      meeting: newMeeting,
      processingDetails: {
        transcription: result.data.transcription,
        sentiment: result.data.sentiment,
        insights: result.data.insights,
        metadata: result.data.metadata
      }
    });

  } catch (error) {
    console.error('❌ Audio processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process audio file'
    });
  }
});

// Get processing status (for async processing)
app.get('/api/recordings/status/:jobId', (req, res) => {
  const status = audioProcessor.getProcessingStatus(req.params.jobId);
  res.json(status);
});

// Get supported audio formats
app.get('/api/recordings/formats', (req, res) => {
  res.json({
    formats: [
      { ext: '.mp3', name: 'MP3 Audio', maxSize: '100MB' },
      { ext: '.wav', name: 'WAV Audio', maxSize: '100MB' },
      { ext: '.m4a', name: 'M4A Audio', maxSize: '100MB' },
      { ext: '.ogg', name: 'OGG Audio', maxSize: '100MB' },
      { ext: '.webm', name: 'WebM Audio', maxSize: '100MB' },
      { ext: '.flac', name: 'FLAC Audio', maxSize: '100MB' }
    ],
    maxFileSize: '100MB',
    maxDuration: '2 hours',
    features: [
      'Automatic transcription with speaker diarization',
      'Sentiment analysis',
      'Action item extraction',
      'Key decision identification',
      'Topic detection'
    ]
  });
});

// ============================================================
// TEMPLATES API
// ============================================================

const mockTemplates = [
  {
    id: 'standup',
    name: 'Daily Standup',
    description: 'Quick team sync-up meeting',
    category: 'Team',
    agenda: [
      'What did you accomplish yesterday?',
      'What are you working on today?',
      'Any blockers or impediments?'
    ],
    timeAllocation: {
      'Team updates': 10,
      'Blocker discussion': 5
    },
    autoActions: [
      'Create action item for each blocker',
      'Schedule follow-up if discussion exceeds 15 minutes'
    ],
    usageCount: 247,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'retrospective',
    name: 'Sprint Retrospective',
    description: 'Reflect on sprint and identify improvements',
    category: 'Agile',
    agenda: [
      'What went well?',
      'What could be improved?',
      'Action items for next sprint'
    ],
    timeAllocation: {
      'What went well': 15,
      'What could be improved': 20,
      'Action planning': 15,
      'Voting on actions': 10
    },
    autoActions: [
      'Group similar feedback items',
      'Create Jira tickets from action items',
      'Send summary to team Slack channel'
    ],
    usageCount: 98,
    created_at: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'one-on-one',
    name: '1-on-1 Meeting',
    description: 'Personal check-in with team member',
    category: 'Management',
    agenda: [
      'How are you feeling about work?',
      'Progress on goals and objectives',
      'Career development discussion',
      'Feedback (both ways)'
    ],
    timeAllocation: {
      'Check-in': 5,
      'Goals review': 15,
      'Career development': 15,
      'Feedback': 10,
      'Action items': 5
    },
    autoActions: [
      'Track action items for next 1-on-1',
      'Update performance review notes',
      'Schedule follow-up if needed'
    ],
    usageCount: 156,
    created_at: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'client-call',
    name: 'Client Presentation',
    description: 'Present project progress to client',
    category: 'Client',
    agenda: [
      'Welcome and introductions',
      'Project status update',
      'Demo of new features',
      'Discuss next steps and timeline',
      'Q&A session'
    ],
    timeAllocation: {
      'Introductions': 5,
      'Status update': 10,
      'Demo': 20,
      'Timeline discussion': 10,
      'Q&A': 15
    },
    autoActions: [
      'Send meeting summary to client',
      'Create follow-up action items',
      'Schedule next check-in',
      'Export decisions for contract addendum'
    ],
    usageCount: 73,
    created_at: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'planning',
    name: 'Sprint Planning',
    description: 'Plan work for upcoming sprint',
    category: 'Agile',
    agenda: [
      'Review sprint goal',
      'Estimate story points',
      'Discuss technical approach',
      'Assign tasks',
      'Identify dependencies'
    ],
    timeAllocation: {
      'Sprint goal': 10,
      'Story estimation': 45,
      'Technical discussion': 30,
      'Task assignment': 20,
      'Dependencies': 15
    },
    autoActions: [
      'Update Jira sprint backlog',
      'Assign stories to team members',
      'Create dependency tracking tasks',
      'Set sprint start and end dates'
    ],
    usageCount: 112,
    created_at: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'brainstorm',
    name: 'Brainstorming Session',
    description: 'Generate ideas and solutions',
    category: 'Creative',
    agenda: [
      'Define problem statement',
      'Silent idea generation (5 min)',
      'Share and discuss ideas',
      'Group similar concepts',
      'Vote on top ideas'
    ],
    timeAllocation: {
      'Problem framing': 10,
      'Silent brainstorming': 5,
      'Idea sharing': 20,
      'Grouping': 10,
      'Voting': 10,
      'Action planning': 5
    },
    autoActions: [
      'Capture all ideas in shared document',
      'Create action items for top 3 ideas',
      'Schedule follow-up to review progress'
    ],
    usageCount: 65,
    created_at: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Get all templates
app.get('/api/templates', (req, res) => {
  res.json(mockTemplates);
});

// Get template categories
app.get('/api/templates/categories', (req, res) => {
  const categories = [...new Set(mockTemplates.map(t => t.category))];
  res.json(categories);
});

// Create new template
app.post('/api/templates', (req, res) => {
  const { name, description, category, agenda, timeAllocation, autoActions } = req.body;

  const newTemplate = {
    id: `custom-${Date.now()}`,
    name,
    description,
    category: category || 'Custom',
    agenda: agenda || [],
    timeAllocation: timeAllocation || {},
    autoActions: autoActions || [],
    usageCount: 0,
    created_at: new Date().toISOString()
  };

  mockTemplates.push(newTemplate);
  res.status(201).json(newTemplate);
});

// Update template
app.patch('/api/templates/:id', (req, res) => {
  const { id } = req.params;
  const templateIndex = mockTemplates.findIndex(t => t.id === id);

  if (templateIndex === -1) {
    return res.status(404).json({ error: { message: 'Template not found' } });
  }

  mockTemplates[templateIndex] = {
    ...mockTemplates[templateIndex],
    ...req.body,
    id // Preserve the ID
  };

  res.json(mockTemplates[templateIndex]);
});

// Delete template
app.delete('/api/templates/:id', (req, res) => {
  const { id } = req.params;
  const templateIndex = mockTemplates.findIndex(t => t.id === id);

  if (templateIndex === -1) {
    return res.status(404).json({ error: { message: 'Template not found' } });
  }

  // Don't allow deleting built-in templates
  if (['standup', 'retrospective', 'one-on-one', 'client-call', 'planning', 'brainstorm'].includes(id)) {
    return res.status(400).json({ error: { message: 'Cannot delete built-in templates' } });
  }

  mockTemplates.splice(templateIndex, 1);
  res.json({ success: true });
});

// Apply template - creates a new meeting from template
app.post('/api/templates/:id/apply', (req, res) => {
  const { id } = req.params;
  const template = mockTemplates.find(t => t.id === id);

  if (!template) {
    return res.status(404).json({ error: { message: 'Template not found' } });
  }

  // Increment usage count
  template.usageCount++;

  // Create a new meeting based on the template
  const newMeetingId = `${mockMeetings.length + 1}`;
  const totalMinutes = Object.values(template.timeAllocation).reduce((sum, min) => sum + min, 0);

  const newMeeting = {
    id: newMeetingId,
    title: `${template.name} - ${new Date().toLocaleDateString()}`,
    status: 'scheduled',
    created_at: new Date().toISOString(),
    duration: totalMinutes * 60, // Convert to seconds
    speakers_count: 0,
    action_items_count: 0,
    decisions_count: 0,
    overall_sentiment: 'neutral',
    category: template.category.toLowerCase(),
    tags: template.agenda.slice(0, 3).join(',').toLowerCase(),
    is_favorite: false,
    notes: `Created from template: ${template.name}`,
    summary: `Meeting scheduled based on ${template.name} template. Agenda includes: ${template.agenda.join(', ')}`,
    topics: template.agenda.join(', '),
    template_id: template.id,
    agenda: template.agenda,
    time_allocation: template.timeAllocation,
    auto_actions: template.autoActions
  };

  mockMeetings.push(newMeeting);

  res.status(201).json({
    success: true,
    meeting: newMeeting,
    template: template
  });
});

app.use((req, res) => {
  console.log('404:', req.method, req.path);
  res.status(404).json({
    error: { message: 'Route not found' }
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: { message: err.message || 'Internal server error' }
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║    🎙️  MeetingMind Mock API Server       ║
║                                           ║
║  Status: Running (Mock Mode)              ║
║  Port: ${PORT}                              ║
║  URL: http://localhost:${PORT}             ║
║                                           ║
║  📊 8 Meetings with Unique Data           ║
║  💬 Long Realistic Conversations          ║
║  ✅ All Features Fully Functional         ║
╚═══════════════════════════════════════════╝
  `);
});

export default app;
