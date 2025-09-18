const { chromium } = require('playwright');

const DEFAULT_VIEWPORT = { width: 1280, height: 720 };
const WAIT_FOR_VIDEO_TIMEOUT = 30000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatTimecode(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '00:00:00';
  }

  const total = Math.floor(totalSeconds);
  const hours = Math.floor(total / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((total % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(total % 60)
    .toString()
    .padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

function computeCapturePoints(duration) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return [];
  }

  const points = [
    { label: 'D\u00e9but', time: 0 },
    { label: 'Milieu', time: duration / 2 },
  ];

  const nearEnd = Math.max(duration - 30, duration - 1, 0);
  points.push({ label: '30s avant la fin', time: nearEnd });

  const unique = new Map();
  for (const point of points) {
    const key = Math.round(point.time);
    if (!unique.has(key)) {
      unique.set(key, point);
    }
  }

  return Array.from(unique.values()).sort((a, b) => a.time - b.time);
}

async function captureAtTime(page, videoHandle, time) {
  await page.evaluate((targetTime) => {
    const video = document.querySelector('video');
    if (!video) {
      throw new Error('Vid\u00e9o introuvable');
    }

    video.pause();
    if (Math.abs(video.currentTime - targetTime) > 0.25) {
      video.currentTime = targetTime;
    }
  }, time);

  await page.waitForFunction(
    (expected) => {
      const video = document.querySelector('video');
      return (
        video &&
        Math.abs(video.currentTime - expected) < 0.25 &&
        video.readyState >= 2
      );
    },
    time,
    { timeout: 10000 }
  );

  await delay(500);

  const screenshot = await videoHandle.screenshot({ type: 'png' });
  return screenshot.toString('base64');
}

async function analyzeVideo(url) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: DEFAULT_VIEWPORT });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('video', { timeout: WAIT_FOR_VIDEO_TIMEOUT });

    const videoHandle = await page.$('video');
    if (!videoHandle) {
      throw new Error('Aucun \u00e9l\u00e9ment vid\u00e9o trouv\u00e9 sur la page.');
    }

    const metadata = await page.evaluate(() => {
      const video = document.querySelector('video');
      if (!video) {
        throw new Error('Aucun \u00e9l\u00e9ment vid\u00e9o trouv\u00e9 sur la page.');
      }

      const duration = Number.isFinite(video.duration) ? video.duration : NaN;
      const audioTracks = video.audioTracks
        ? Array.from(video.audioTracks).map((track, index) => ({
            id: track.id || `audio-${index + 1}`,
            label: track.label || `Piste ${index + 1}`,
            language: track.language || null,
            enabled: track.enabled ?? false,
          }))
        : [];

      const textTracks = video.textTracks
        ? Array.from(video.textTracks).map((track, index) => ({
            id: track.id || `text-${index + 1}`,
            label: track.label || track.language || track.kind || `Sous-titre ${index + 1}`,
            language: track.language || null,
            kind: track.kind || null,
            mode: track.mode || null,
          }))
        : [];

      return { duration, audioTracks, textTracks };
    });

    if (!Number.isFinite(metadata.duration) || metadata.duration <= 0) {
      throw new Error('Dur\u00e9e de la vid\u00e9o introuvable ou invalide.');
    }

    const capturePoints = computeCapturePoints(metadata.duration);
    const screenshots = [];

    for (const point of capturePoints) {
      const base64 = await captureAtTime(page, videoHandle, point.time);
      screenshots.push({
        label: point.label,
        time: point.time,
        timecode: formatTimecode(point.time),
        image: base64,
      });
    }

    return {
      url,
      durationSeconds: metadata.duration,
      duration: formatTimecode(metadata.duration),
      audioTracks: metadata.audioTracks,
      textTracks: metadata.textTracks,
      screenshots,
    };
  } finally {
    await browser.close();
  }
}

module.exports = { analyzeVideo };

