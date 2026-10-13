// Builds index.html (the site home page on Vercel): Meta ads (scaled to fit) and Google Display banners (actual size).
// Usage: npm run build
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONCEPTS, SIZES } from './build.mjs';
import { GCONCEPTS, GSIZES } from './build-google.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const frame = (src, w, h, title) => `
          <div class="frame" style="--w:${w};--h:${h}">
            <iframe src="${src}" width="${w}" height="${h}" loading="lazy" title="${title}"></iframe>
          </div>`;

const dl = (links) => `<span class="dl"><span class="dl-label">Download Ads</span>${links.map(([t, href]) => `<a href="${href}" download>${t}</a>`).join('')}</span>`;

// Same four formats, same order, on both platforms.
const downloads = (group, id, key) => [
  ['ZIP', `${group}/export/zip/ets_${id}_${key}.zip`],
  ['PNG', `${group}/export/png/${id}_${key}.png`],
  ['MP4', `${group}/export/mp4/${id}_${key}.mp4`],
  ['GIF', `${group}/export/gif/${id}_${key}.gif`],
];

const metaRows = CONCEPTS.map(c => `
      <section class="row">
        <header><h3>${c.name}</h3><span class="tag">${c.audience}</span></header>
        <div class="grid">${Object.entries(SIZES).map(([key, s]) => `
          <figure>${frame(`meta-ads/${c.id}/${key}/index.html`, s.w, s.h, `${c.name} ${key}`)}
            <figcaption><b>${key}</b> ${s.label}${dl(downloads('meta-ads', c.id, key))}</figcaption>
          </figure>`).join('')}
        </div>
      </section>`).join('');

// Order: rectangles and banners first, then the tall skyscrapers on their own row at the end.
const ORDER = ['300x250', '336x280', '728x90', '970x250', '320x50', '320x100', '300x600', '160x600'];
const isTall = (s) => s.h > s.w * 1.5;
const gFigure = (c, key, s) => `
          <figure class="g" style="--w:${s.w}">${frame(`google-ads/${c.id}/${key}/index.html?loop`, s.w, s.h, `${c.name} ${key}`)}
            <figcaption><b>${key}</b> ${s.label}${dl(downloads('google-ads', c.id, key))}</figcaption>
          </figure>`;
const gSizes = ORDER.filter(k => GSIZES[k]).map(k => [k, GSIZES[k]]);

const googleRows = GCONCEPTS.map(c => `
      <section class="row">
        <header><h3>${c.name}</h3><span class="tag">${c.audience}</span></header>
        <div class="flow">${gSizes.filter(([, s]) => !isTall(s)).map(([k, s]) => gFigure(c, k, s)).join('')}
        </div>
        <div class="flow tall">${gSizes.filter(([, s]) => isTall(s)).map(([k, s]) => gFigure(c, k, s)).join('')}
        </div>
      </section>`).join('');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Energy Talent Search · Ads preview</title>
<style>
  :root { --navy:#101E39; --navy-dark:#0B1628; --green:#6FA83A; --green-btn:#4F7F24; --green-dark:#4B7922; --green-soft:#EEF5E6; --mist:#F3F6FA; --line:#E3E8EF; --muted:#606D81; --red:#C62828; --red-bg:#FDECEC; --red-line:#F3B9B9; }
  /* Note: soft red panel with a strong red edge and label */
  .platform > p.note { display: flex; gap: 12px; align-items: center; margin: 18px 0 0; padding: 12px 18px; max-width: 980px; background: var(--red-bg); border: 1px solid var(--red-line); border-left: 5px solid var(--red); border-radius: 10px; color: #8E1C1C; font-size: 15px; font-weight: 600; line-height: 1.45; box-shadow: 0 4px 12px rgba(198,40,40,.10); }
  .note svg { flex: none; width: 22px; height: 22px; color: var(--red); }
  .note b { flex: none; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; background: var(--red); color: #fff; padding: 3px 9px; border-radius: 6px; }
  .note kbd { font: 700 13px system-ui, sans-serif; background: #fff; color: #8E1C1C; border: 1px solid var(--red-line); border-radius: 5px; padding: 1px 7px; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--mist); color: var(--navy); font: 15px/1.5 system-ui, sans-serif; }
  .top { position: sticky; top: 0; z-index: 2; display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center; justify-content: space-between; padding: 14px 32px; background: #fff; border-bottom: 1px solid var(--line); }
  .top h1 { margin: 0; font-size: 18px; }
  /* Platform toggle — segmented control, one platform visible at a time */
  .toggle { display: inline-flex; gap: 4px; padding: 4px; background: var(--mist); border: 1px solid var(--line); border-radius: 12px; }
  .toggle button { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: var(--navy); font: 700 15px system-ui, sans-serif; padding: 10px 22px; border-radius: 9px; transition: background .15s, color .15s; }
  .toggle button:hover { background: #fff; }
  .toggle button[aria-selected="true"] { background: var(--navy); color: #fff; box-shadow: 0 4px 12px rgba(16,30,57,.25); }
  .toggle button:focus-visible { outline: 3px solid var(--green); outline-offset: 2px; }
  .toggle .count { font-size: 12px; font-weight: 700; padding: 1px 8px; border-radius: 999px; background: var(--line); color: var(--muted); }
  .toggle button[aria-selected="true"] .count { background: rgba(255,255,255,.18); color: #fff; }
  .platform[hidden] { display: none; }
  button { font: 600 14px system-ui; color: #fff; background: var(--green-btn); border: 0; border-radius: 10px; padding: 10px 18px; cursor: pointer; }
  main { padding: 8px 32px 64px; max-width: 1400px; margin: 0 auto; }
  .platform { margin-top: 36px; padding-top: 8px; scroll-margin-top: 80px; }
  .platform > h2 { margin: 0; font-size: 24px; display: flex; align-items: center; gap: 10px; }
  .platform > p { margin: 4px 0 0; color: var(--muted); font-size: 14px; max-width: 900px; }
  .badge { font-size: 12px; font-weight: 700; letter-spacing: .04em; color: #fff; background: var(--navy); padding: 4px 10px; border-radius: 6px; }
  .row { margin-top: 24px; padding: 20px; background: #fff; border: 1px solid var(--line); border-radius: 14px; }
  .row header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 14px; }
  .row h3 { margin: 0; font-size: 18px; }
  .tag { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--green-dark); background: var(--green-soft); padding: 3px 8px; border-radius: 6px; }
  .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; align-items: end; }
  .flow { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
  .flow.tall { margin-top: 28px; padding-top: 24px; border-top: 1px dashed var(--line); }
  figure.g { min-width: 160px; }
  figure { margin: 0; min-width: 0; }
  figure.g { width: calc(var(--w) * 1px); max-width: 100%; }
  .frame { position: relative; width: 100%; aspect-ratio: var(--w) / var(--h); overflow: hidden; border-radius: 10px; box-shadow: 0 8px 24px rgba(16,30,57,.16); background: var(--navy-dark); }
  figure.g .frame { border-radius: 2px; }
  .frame iframe { position: absolute; top: 0; left: 0; border: 0; transform-origin: 0 0; }
  figcaption { margin-top: 8px; font-size: 13px; color: var(--muted); }
  figcaption b { color: var(--navy); margin-right: 6px; }
  .dl { display: inline-flex; flex-wrap: wrap; gap: 6px; margin-left: 8px; vertical-align: 1px; }
  figure.g figcaption { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 0; }
  figure.g .dl { flex-basis: 100%; margin: 4px 0 0; }
  .dl-label { font-size: 12px; font-weight: 700; color: var(--red); align-self: center; margin-right: 2px; }
  .dl a { font-size: 11px; font-weight: 700; letter-spacing: .04em; color: var(--green-dark); background: var(--green-soft); text-decoration: none; padding: 2px 7px; border-radius: 5px; }
  .dl a:hover { background: var(--green); color: #fff; }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } main, .top { padding-left: 16px; padding-right: 16px; } }
</style>
</head>
<body>
  <div class="top">
    <h1>Energy Talent Search · Ads preview</h1>
    <div class="toggle" role="tablist" aria-label="Ad platform">
      <button type="button" role="tab" id="tab-meta" aria-controls="meta" aria-selected="true">Meta Ads <span class="count">${CONCEPTS.length * Object.keys(SIZES).length}</span></button>
      <button type="button" role="tab" id="tab-google" aria-controls="google" aria-selected="false">Google Ads <span class="count">${GCONCEPTS.length * Object.keys(GSIZES).length}</span></button>
    </div>
    <button type="button" onclick="document.querySelectorAll('iframe').forEach(f => f.src = f.src)">Replay all</button>
  </div>
  <main>
    <section class="platform" id="meta" role="tabpanel" aria-labelledby="tab-meta">
      <h2><span class="badge">META ADS</span> Facebook &amp; Instagram</h2>
      <p>3 concepts × 3 sizes, scaled to fit. Upload the <b>MP4</b> as a video ad (Meta doesn't accept HTML5) or the <b>PNG</b> as an image ad. <b>ZIP</b> is the HTML5 source of each ad. <b>GIF</b> is a full-size animated version (10 fps). Copy for Ads Manager is in <code>meta-ads/ad-copy.md</code>.</p>
      <p class="note" role="note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg><b>Note</b><span>To play an animated GIF on a Mac, select the GIF file in Finder and press the <kbd>Space</kbd> bar to use Quick Look.</span></p>${metaRows}
    </section>
    <section class="platform" id="google" role="tabpanel" aria-labelledby="tab-google" hidden>
      <h2><span class="badge">GOOGLE ADS</span> Display Network · HTML5</h2>
      <p>3 concepts × 8 sizes, shown at actual size. Upload the <b>ZIP</b> as an HTML5 ad (under 150 KB, clickTag-ready; plays twice ≈ 21s to meet Google's 30s limit, though this preview loops them continuously). <b>GIF</b> is the animated image-ad version (under 150 KB, 4 fps, stops within 30s) for accounts without HTML5 access. <b>MP4</b> is a 30fps video of each banner. <b>PNG</b> is the static backup image.</p>
      <p class="note" role="note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg><b>Note</b><span>To play an animated GIF on a Mac, select the GIF file in Finder and press the <kbd>Space</kbd> bar to use Quick Look.</span></p>${googleRows}
    </section>
  </main>
  <script>
    // Scale each fixed-size ad iframe to its frame width (never above 100%).
    const ro = new ResizeObserver(entries => entries.forEach(e => {
      const f = e.target.querySelector('iframe');
      f.style.transform = 'scale(' + Math.min(1, e.contentRect.width / f.width) + ')';
    }));
    document.querySelectorAll('.frame').forEach(el => ro.observe(el));

    // Platform toggle: show one section, restart its ads, remember it in the URL (#meta / #google).
    const tabs = [...document.querySelectorAll('.toggle [role="tab"]')];
    function show(id, replay) {
      tabs.forEach(t => {
        const on = t.getAttribute('aria-controls') === id;
        t.setAttribute('aria-selected', on);
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (replay) document.querySelectorAll('#' + id + ' iframe').forEach(f => f.src = f.src);
      history.replaceState(null, '', '#' + id);
      window.scrollTo(0, 0);
    }
    tabs.forEach(t => t.addEventListener('click', () => show(t.getAttribute('aria-controls'), true)));
    show(location.hash === '#google' ? 'google' : 'meta', false);
  </script>
</body>
</html>
`;

writeFileSync(join(ROOT, 'index.html'), html);
console.log('Preview: index.html (Meta + Google sections)');
