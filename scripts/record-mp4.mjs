// Records ads to MP4 (H.264, 30fps, exact resolution) → <platform>/export/mp4/.
// Meta MP4s are the files to upload as Meta video ads; Google MP4s are video versions of the banners.
// Frames are rendered deterministically: each animation is paused and seeked to t = frame/30,
// so the video is smooth regardless of machine speed. Requires ffmpeg on PATH.
// Usage: npm run mp4                       (all 33)
//        npm run mp4 -- meta b-five 1440x1800   (filter)
//        HOLD=1.5 npm run mp4   (seconds to hold the end frame; default 1)
import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, listAds, serve, launch, openAd } from './lib.mjs';

const FPS = 30;
const HOLD = Number(process.env.HOLD ?? 1);

const server = await serve();
const browser = await launch();
try {
  for (const ad of listAds()) {
    const outDir = join(ROOT, ad.group, 'export', 'mp4');
    mkdirSync(outDir, { recursive: true });
    const { page, end, seek } = await openAd(browser, server.origin, ad);
    const frames = Math.round((end / 1000 + HOLD) * FPS);
    const file = join(outDir, `${ad.id}.mp4`);
    const ff = spawn('ffmpeg', [
      '-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '17',
      '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart',
      file,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`))));
    for (let f = 0; f < frames; f++) {
      await seek(Math.min((f / FPS) * 1000, end));
      const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: ad.w, height: ad.h } });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % FPS === 0) process.stdout.write(`\r${ad.id}  ${Math.round((f / frames) * 100)}%  `);
    }
    ff.stdin.end();
    await done;
    console.log(`\r✓ ${file.replace(ROOT + '/', '')}  ${ad.w}×${ad.h} · ${FPS}fps · ${(frames / FPS).toFixed(1)}s`);
    await page.close();
  }
} finally { await browser.close(); server.close(); }
