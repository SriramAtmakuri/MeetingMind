/**
 * MeetingMind — Demo GIF recorder
 *
 * Records a full walkthrough of the app using Playwright, then converts
 * the captured video to an optimised GIF via ffmpeg.
 *
 * Prerequisites:
 *   npm install -D playwright
 *   npx playwright install chromium
 *   ffmpeg must be on PATH
 *
 * Usage:
 *   node scripts/record-demo.js                  # headless, uses DEMO_URL env or default
 *   HEADLESS=false node scripts/record-demo.js   # show browser window
 *   DEMO_URL=https://staging.example.com node scripts/record-demo.js
 *
 * Output: demo/meetingmind-demo.gif
 */

import { chromium } from 'playwright';
import { execSync, spawnSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const FRONTEND_URL = process.env.DEMO_URL || 'http://localhost:5173';
const HEADLESS = process.env.HEADLESS !== 'false';
const OUTPUT_DIR = join(ROOT, 'demo');
const VIDEO_DIR = join(OUTPUT_DIR, 'video');
const GIF_PATH = join(OUTPUT_DIR, 'meetingmind-demo.gif');

const VIEWPORT = { width: 1280, height: 800 };
const GIF_FPS = 12;
const GIF_WIDTH = 1280;

// ── helpers ──────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

function ensureDirs() {
  [OUTPUT_DIR, VIDEO_DIR].forEach(d => {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  });
  // Clear previous video files so we get a clean take
  readdirSync(VIDEO_DIR).forEach(f => unlinkSync(join(VIDEO_DIR, f)));
}

function checkFfmpeg() {
  const r = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (r.status !== 0 && r.error) {
    console.error('ffmpeg not found. Install it and ensure it is on your PATH.');
    process.exit(1);
  }
}

// ── recording ─────────────────────────────────────────────────────────────────

async function record() {
  const browser = await chromium.launch({
    headless: HEADLESS,
    slowMo: 55,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: VIDEO_DIR, size: VIEWPORT },
    colorScheme: 'dark',
    // Disable animations so the recording looks intentional, not janky
    reducedMotion: 'no-preference',
  });

  const page = await context.newPage();

  // Hide the Playwright automation banner in some builds
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    // ── Scene 1: Landing page ──────────────────────────────────────
    console.log('[1/7] Landing page');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await sleep(1800);

    // Scroll down to show feature cards
    await page.evaluate(() => window.scrollBy({ top: 380, behavior: 'smooth' }));
    await sleep(1100);
    await page.evaluate(() => window.scrollBy({ top: 380, behavior: 'smooth' }));
    await sleep(1100);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(900);

    // ── Scene 2: Login → guest mode ────────────────────────────────
    console.log('[2/7] Login as guest');
    await page.click('text=Get Started Free');
    await page.waitForURL('**/login', { timeout: 8000 });
    await sleep(900);
    await page.click('text=Continue as Guest');
    await page.waitForURL('**/dashboard', { timeout: 8000 });
    await sleep(1000);

    // Dismiss onboarding modal if present (it intercepts all pointer events)
    const skipTour = page.getByRole('button', { name: /skip tour/i });
    if (await skipTour.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipTour.click();
      await sleep(600);
    }
    // Also try pressing Escape in case skip tour isn't visible but modal is open
    await page.keyboard.press('Escape');
    await sleep(500);

    await sleep(900);

    // ── Scene 3: Seed demo data ────────────────────────────────────
    console.log('[3/7] Seeding demo data');

    // Get the userId the app stored in localStorage after guest login
    const userId = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('meetingmind_user') || '{}').id; } catch { return null; }
    });
    console.log(`    userId: ${userId}`);

    // Seed via Node.js API call — captures meeting IDs directly from the response
    const API_BASE = 'http://localhost:3001/api';
    let firstMeetingId = null;
    try {
      const seedResp = await fetch(`${API_BASE}/seed`, {
        method: 'POST',
        headers: { 'X-User-Id': userId },
      });
      const seedData = await seedResp.json();
      console.log(`    seed response (${seedResp.status}):`, JSON.stringify(seedData).slice(0, 120));

      if (seedData.seeded && seedData.meetings?.length) {
        // Fresh seed — IDs are in the response
        firstMeetingId = seedData.meetings[0].id;
      } else {
        // Already seeded — fetch existing meetings
        const resp = await fetch(`${API_BASE}/meetings?limit=5`, {
          headers: { 'X-User-Id': userId },
        });
        const data = await resp.json();
        firstMeetingId = data?.meetings?.[0]?.id || null;
      }
      console.log(`    first meeting id: ${firstMeetingId}`);
    } catch (e) {
      console.warn('    could not seed/fetch meetings:', e.message);
    }

    // Reload dashboard so the seeded meetings appear in the UI, then pause
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(600);
    // Dismiss any modal that may have reappeared after reload
    await page.keyboard.press('Escape');
    await sleep(400);
    // Wait for at least one meeting card to render before scrolling
    await page.waitForSelector('text=/\\[Demo\\]/', { timeout: 8000 }).catch(() => {});
    await sleep(800);

    // Scroll dashboard to show meeting cards
    await page.evaluate(() => window.scrollBy({ top: 260, behavior: 'smooth' }));
    await sleep(1200);

    // ── Scene 4: Open first meeting ────────────────────────────────
    console.log('[4/7] Opening meeting detail');
    if (firstMeetingId) {
      await page.goto(`${FRONTEND_URL}/meeting/${firstMeetingId}`, { waitUntil: 'networkidle' });
    } else {
      await page.locator('text=/\\[Demo\\]/').first().click({ timeout: 5000 }).catch(() => {});
      await page.waitForURL('**/meeting/**', { timeout: 8000 }).catch(() => {});
    }
    await page.waitForLoadState('networkidle');
    // Wait for transcript segments to render (not skeleton)
    await page.waitForSelector('[class*="transcript"], text=/Speaker/', { timeout: 6000 }).catch(() => {});
    await sleep(1600);

    // Scroll to show transcript segments
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
    await sleep(1100);

    // ── Scene 5: Action Items tab ──────────────────────────────────
    console.log('[5/7] Action Items tab');
    const actionsTab = page.getByRole('tab', { name: /actions/i });
    if (await actionsTab.isVisible({ timeout: 4000 }).catch(() => false)) {
      await actionsTab.click();
      // Wait for action item rows to render (not skeleton)
      await page.waitForSelector('[class*="action"], text=/pending|completed|in_progress/i', { timeout: 5000 }).catch(() => {});
      await sleep(1800);
    } else {
      console.warn('    actions tab not found — skipping');
    }

    // ── Scene 6: Decisions tab ─────────────────────────────────────
    console.log('[6/7] Decisions tab');
    const decisionsTab = page.getByRole('tab', { name: /decisions/i });
    if (await decisionsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await decisionsTab.click();
      await page.waitForLoadState('networkidle');
      await sleep(1800);
    } else {
      console.warn('    decisions tab not found — skipping');
    }

    // ── Scene 7: Search ───────────────────────────────────────────
    console.log('[7/7] Semantic search');
    await page.goto(`${FRONTEND_URL}/search`, { waitUntil: 'networkidle' });
    await sleep(800);
    const searchInput = page.getByPlaceholder(/search for topics/i);
    await searchInput.click();
    await searchInput.type('mobile initiative', { delay: 90 });
    // Wait for debounce + results (skeleton → real cards)
    await page.waitForFunction(
      () => {
        const skeletons = document.querySelectorAll('[class*="skeleton"],[class*="animate-pulse"]');
        const cards = document.querySelectorAll('[class*="card"],[class*="result"]');
        return skeletons.length === 0 && cards.length > 0;
      },
      { timeout: 6000 }
    ).catch(() => sleep(3500));
    await sleep(800);
    await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'smooth' }));
    await sleep(1500);

    // Final hold before stopping
    await sleep(1000);
  } finally {
    await context.close();
    await browser.close();
  }
}

// ── GIF conversion ────────────────────────────────────────────────────────────

function convertToGif() {
  const files = readdirSync(VIDEO_DIR).filter(f => f.endsWith('.webm'));
  if (!files.length) {
    console.error('No recorded video found in', VIDEO_DIR);
    process.exit(1);
  }

  const videoPath = join(VIDEO_DIR, files[0]);
  const palettePath = join(VIDEO_DIR, 'palette.png');
  const scaleFilter = `fps=${GIF_FPS},scale=${GIF_WIDTH}:-1:flags=lanczos`;

  console.log('\nConverting video → GIF (this takes ~30s)...');

  // Pass 1: generate perceptually-optimised palette
  execSync(
    `ffmpeg -i "${videoPath}" -vf "${scaleFilter},palettegen=stats_mode=diff" -update 1 "${palettePath}" -y`,
    { stdio: 'inherit' }
  );

  // Pass 2: render GIF using palette — two inputs require -filter_complex in newer ffmpeg
  execSync(
    `ffmpeg -i "${videoPath}" -i "${palettePath}" ` +
    `-filter_complex "[0:v]${scaleFilter}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" ` +
    `"${GIF_PATH}" -y`,
    { stdio: 'inherit' }
  );

  // Report file size
  const { size } = statSync(GIF_PATH);
  const mb = (size / 1024 / 1024).toFixed(1);
  console.log(`\n✓ GIF saved → ${GIF_PATH}  (${mb} MB)`);
}

// ── main ──────────────────────────────────────────────────────────────────────

(async () => {
  ensureDirs();
  checkFfmpeg();

  console.log(`Recording demo at ${FRONTEND_URL}  headless=${HEADLESS}\n`);
  await record();

  convertToGif();
})();
