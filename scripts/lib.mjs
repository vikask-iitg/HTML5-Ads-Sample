// Shared helpers for the export scripts: static server, Chrome lookup, ad discovery.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

/** Every ad folder: <group>/<concept>/<WxH>/index.html, group = meta-ads | google-ads.
 *  Optional CLI filter, e.g. `npm run png -- google 300x250` (all terms must match). */
export function listAds(filters = process.argv.slice(2), groups = ['meta-ads', 'google-ads']) {
  const ads = [];
  for (const group of groups) {
    if (!existsSync(join(ROOT, group))) continue;
    for (const concept of readdirSync(join(ROOT, group)).sort()) {
      if (concept.startsWith('.') || concept === 'export' || !statSync(join(ROOT, group, concept)).isDirectory()) continue;
      for (const size of readdirSync(join(ROOT, group, concept)).sort()) {
        const [w, h] = size.split('x').map(Number);
        if (!w || !h) continue;
        const id = `${concept}_${size}`;
        if (filters.length && !filters.every(f => `${group}/${id}`.includes(f))) continue;
        ads.push({ id, group, concept, size, w, h, path: `${group}/${concept}/${size}/index.html` });
      }
    }
  }
  return ads;
}

export async function serve() {
  const server = createServer(async (req, res) => {
    const file = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    try {
      if (!file.startsWith(ROOT) || !(await stat(file)).isFile()) throw 0;
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(await readFile(file));
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

export function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ].filter(Boolean);
  const hit = candidates.find(p => existsSync(p));
  if (!hit) throw new Error('Chrome not found. Set CHROME_PATH=/path/to/chrome');
  return hit;
}

export const launch = () => puppeteer.launch({
  executablePath: findChrome(), headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
});

/** Open an ad paused in capture mode, at its exact resolution. */
export async function openAd(browser, origin, ad) {
  const page = await browser.newPage();
  await page.setViewport({ width: ad.w, height: ad.h, deviceScaleFactor: 1 });
  await page.goto(`${origin}/${ad.path}?capture`, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => { await window.__adReady; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
  const end = await page.evaluate(() => window.__ad.END);
  const seek = ms => page.evaluate(t => { window.__ad.seek(t); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, ms);
  return { page, end, seek };
}
