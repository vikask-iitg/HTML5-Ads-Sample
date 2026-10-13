// Captures the static end frame of every ad as a PNG at exact resolution.
// Meta → meta-ads/export/png/ (static image ads) · Google → google-ads/export/png/ (backup images).
// Usage: npm run png                         (all 33)
//        npm run png -- meta c-passive 1080x1920   (filter)
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, listAds, serve, launch, openAd } from './lib.mjs';

const server = await serve();
const browser = await launch();
try {
  for (const ad of listAds()) {
    const { page, end, seek } = await openAd(browser, server.origin, ad);
    await seek(end);
    const outDir = join(ROOT, ad.group, 'export', 'png');
    mkdirSync(outDir, { recursive: true });
    const file = join(outDir, `${ad.id}.png`);
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width: ad.w, height: ad.h } });
    console.log(`✓ ${file.replace(ROOT + '/', '')}  ${ad.w}×${ad.h}`);
    await page.close();
  }
} finally { await browser.close(); server.close(); }
