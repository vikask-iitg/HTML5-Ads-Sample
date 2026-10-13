// Renders the Google Display banners as animated GIFs → google-ads/export/gif/,
// built to Google Ads' animated-image rules so they can be uploaded as image ads:
//   ≤150 KB · slower than 5 fps (4 fps here) · stops within 30s (plays twice ≈ 20s).
// The photo's Ken Burns zoom is switched off for GIFs only: a moving photo changes every pixel
// of every frame and would blow the 150 KB budget. Text, underline, steps and CTA still animate.
// Usage: npm run gif                    (all 24)
//        npm run gif -- c-passive 300x600   (filter)
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ROOT, listAds, serve, launch, openAd } from './lib.mjs';

const FPS = 4;
const HOLD = 1;                  // seconds on the end frame before the GIF repeats
const MAX = 150 * 1024;
const PALETTES = [128, 96, 64, 48, 32]; // fewer colours until the file fits
const outDir = join(ROOT, 'google-ads', 'export', 'gif');
mkdirSync(outDir, { recursive: true });

const server = await serve();
const browser = await launch();
let failed = 0;
try {
  for (const ad of listAds(undefined, ['google-ads'])) {
    const { page, end, seek } = await openAd(browser, server.origin, ad);
    await page.addStyleTag({ content: '.bg { animation: none !important; transform: none !important; }' });
    const tmp = join(tmpdir(), `ets-gif-${ad.id}`);
    rmSync(tmp, { recursive: true, force: true });
    mkdirSync(tmp, { recursive: true });
    const frames = Math.round((end / 1000 + HOLD) * FPS);
    for (let f = 0; f < frames; f++) {
      await seek(Math.min((f / FPS) * 1000, end));
      writeFileSync(join(tmp, `f${String(f).padStart(4, '0')}.png`),
        await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: ad.w, height: ad.h } }));
    }
    await page.close();

    const file = join(outDir, `${ad.id}.gif`);
    let kb, colors;
    for (colors of PALETTES) {
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(tmp, 'f%04d.png'),
        '-vf', `split[a][b];[a]palettegen=max_colors=${colors}:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
        '-loop', '1', file]);
      kb = statSync(file).size / 1024;
      if (kb * 1024 <= MAX) break;
    }
    rmSync(tmp, { recursive: true, force: true });
    const ok = kb * 1024 <= MAX;
    if (!ok) failed++;
    console.log(`${ok ? '✓' : '✗'} ${file.replace(ROOT + '/', '')}  ${ad.w}×${ad.h} · ${FPS}fps · ${colors} colours · ${kb.toFixed(0)} KB`);
  }
} finally { await browser.close(); server.close(); }
if (failed) { console.error(`${failed} GIF(s) over 150 KB`); process.exitCode = 1; }
