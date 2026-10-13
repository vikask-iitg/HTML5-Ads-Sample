// Google Ads (Display Network, HTML5): generates 24 banners (3 concepts × 8 sizes) in google-ads/,
// plus upload-ready ZIPs in google-ads/export/zip/ (each checked against Google's 150 KB limit).
// Usage: npm run build
import { mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SRC, '..');
const OUT = join(ROOT, 'google-ads');
const ZIP_DIR = join(OUT, 'export', 'zip');
const MAX_ZIP = 150 * 1024;
export const END_MS = 9000;

// o-v = vertical stack (text under photo), o-h = horizontal (text left, photo right)
export const GSIZES = {
  '300x250': { w: 300, h: 250, o: 'v', label: 'Medium Rectangle' },
  '336x280': { w: 336, h: 280, o: 'v', label: 'Large Rectangle' },
  '728x90':  { w: 728, h: 90,  o: 'h', label: 'Leaderboard' },
  '970x250': { w: 970, h: 250, o: 'h', label: 'Billboard' },
  '160x600': { w: 160, h: 600, o: 'v', label: 'Wide Skyscraper' },
  '300x600': { w: 300, h: 600, o: 'v', label: 'Half-Page' },
  '320x50':  { w: 320, h: 50,  o: 'h', label: 'Mobile Banner' },
  '320x100': { w: 320, h: 100, o: 'h', label: 'Large Mobile Banner' },
};

const UTM = (c) => `utm_source=google&utm_medium=display&utm_campaign=ets_${c}`;

// Photo: source file in src/assets + focal point (0–1). Crops place the focal point
// upper-centre for vertical sizes and on the right for horizontal ones.
export const GCONCEPTS = [
  {
    id: 'a-hard-to-fill', cls: 'c-a', name: 'A · Hard-to-fill roles, filled', audience: 'Employers',
    photo: { file: 'hero-rig.jpg', fx: .3, fy: .38 },
    url: `https://energytalentsearch.com/?${UTM('hard_to_fill')}`,
    headline: ['Hard-to-fill energy roles?', 'We know [who to call.]'],
    sub: 'Engineers, field leaders &amp; executives across Oil &amp; Gas, Renewables and Mining.',
    cta: 'Start a Search', ctaShort: 'Start a Search',
  },
  {
    id: 'b-five-step-process', cls: 'c-b', name: 'B · The 5-step process', audience: 'Employers',
    photo: null,
    url: `https://energytalentsearch.com/?${UTM('five_steps')}`,
    headline: ['First call to first day', 'in [5 clear steps.]'],
    steps: ['Discovery', 'Sourcing', 'Vetting', 'Shortlist', 'After the hire'],
    cta: 'See How We Hire', ctaShort: 'See How We Hire',
  },
  {
    id: 'c-passive-talent', cls: 'c-c', name: 'C · Passive talent', audience: 'Job seekers',
    photo: { file: 'hero-engineer.jpg', fx: .74, fy: .36 },
    url: `https://energytalentsearch.com/job-seekers/?${UTM('passive_talent')}`,
    headline: ['The best energy jobs', '[never hit the job boards.]'],
    sub: 'Confidential. We call you first. 20+ years in energy recruiting.',
    cta: 'Start Your Job Search', ctaShort: 'Start Your Search',
  },
];

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function headlineHtml(lines) {
  let m = 0;
  return lines.map((line, i) => {
    const html = line.replace(/\[(.+?)\]/g, (_, t) => `<span class="mark" style="--md:${(1.3 + m++ * .5).toFixed(2)}s">${t}</span>`);
    return `<span class="ln" style="--i:${i}"><span class="t">${html}</span></span>`;
  }).join('');
}

function bannerHtml(c, key) {
  const s = GSIZES[key];
  const steps = c.steps ? `
      <ol class="steps">${c.steps.map((t, i) => `
        <li class="step" style="--i:${i}"><span class="dot">${CHECK}</span><span class="num">0${i + 1}</span><span class="label">${t}</span></li>`).join('')}
      </ol>
      <div class="tick" aria-hidden="true">
        <span class="dots">${c.steps.map((_, i) => `<i style="--i:${i}"></i>`).join('')}</span>
        <span class="labels">${c.steps.map((t, i) => `<b style="--i:${i}"><em>0${i + 1}</em>${t}</b>`).join('')}<b class="fin">${c.steps[0]} → ${c.steps.at(-1)}</b></span>
      </div>` : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="ad.size" content="width=${s.w},height=${s.h}">
  <title>Energy Talent Search · ${c.name} · ${key}</title>
  <link rel="stylesheet" href="style.css">
  <style>html,body{width:${s.w}px;height:${s.h}px}</style>
  <script>var clickTag = "${c.url}";</script>
</head>
<body>
  <a class="ad wait ${c.cls} z-${key} o-${s.o}" id="ad" href="javascript:window.open(window.clickTag)"
     style="--w:${s.w}px;--h:${s.h}px" aria-label="${c.cta} — Energy Talent Search">
    ${c.photo ? '<img class="bg" src="assets/photo.jpg" alt="">' : ''}
    <div class="scrim"></div>
    <div class="safe">
      <span class="logo"><img src="assets/logo.jpg" alt="Energy Talent Search"></span>
      <div class="copy">
        <h1 class="headline">${headlineHtml(c.headline)}</h1>${c.sub ? `
        <p class="sub">${c.sub}</p>` : ''}
      </div>${steps}
      <span class="cta"><span class="full">${c.cta}</span><span class="short">${c.ctaShort}</span>${ARROW}</span>
    </div>
  </a>
  <script>
  (function () {
    var END = ${END_MS};
    var ad = document.getElementById('ad');
    var capture = /[?&]capture\\b/.test(location.search);
    function anims() { return document.getAnimations ? document.getAnimations() : []; }
    window.__ad = { END: END, seek: function (ms) { anims().forEach(function (a) { a.pause(); a.currentTime = ms; }); } };
    window.__adReady = Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise(function (r) { if (document.readyState === 'complete') r(); else addEventListener('load', r); })
    ]);
    if (capture) return;
    window.__adReady.then(function () {
      ad.classList.remove('wait');
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { window.__ad.seek(END); return; }
      // 2 plays total (≈21s, within Google's 30s animation limit), then rest on the end frame.
      setTimeout(function () { anims().forEach(function (a) { a.currentTime = 0; a.play(); }); }, END + 2500);
    });
  })();
  </script>
</body>
</html>
`;
}

const ff = (...args) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
const SRC_DIMS = { 'hero-rig.jpg': [2880, 1646], 'hero-engineer.jpg': [2880, 1646] };

/** Crop the source photo to the banner's aspect around its focal point, at 2× for retina. */
function cropPhoto(photo, s, dest) {
  const [W, H] = SRC_DIMS[photo.file];
  const ar = s.w / s.h;
  const [cw, ch] = W / H > ar ? [Math.round(H * ar), H] : [W, Math.round(W / ar)];
  const [px, py] = s.o === 'h' ? [.78, .45] : [.5, .3];
  const clamp = (v, max) => Math.max(0, Math.min(max, Math.round(v)));
  const x = clamp(photo.fx * W - px * cw, W - cw);
  const y = clamp(photo.fy * H - py * ch, H - ch);
  const scale = Math.min(2, cw / s.w);
  ff('-i', join(SRC, 'assets', photo.file), '-vf', `crop=${cw}:${ch}:${x}:${y},scale=${Math.round(s.w * scale)}:${Math.round(s.h * scale)}:flags=lanczos`, '-q:v', '7', dest);
}

function build() {
  const css = readFileSync(join(SRC, 'google.css'), 'utf8');
  const tmp = join(OUT, '.cache');
  mkdirSync(tmp, { recursive: true });
  // Logo on white, as JPG (it always sits on a white chip) — far smaller than the PNG.
  const logo = join(tmp, 'logo.jpg');
  if (!existsSync(logo)) ff('-f', 'lavfi', '-i', 'color=white:s=264x160', '-i', join(SRC, 'assets', 'logo.png'),
    '-filter_complex', '[1]scale=264:160[l];[0][l]overlay=0:0', '-frames:v', '1', '-q:v', '3', logo);

  rmSync(ZIP_DIR, { recursive: true, force: true });
  mkdirSync(ZIP_DIR, { recursive: true });
  const report = [];
  for (const c of GCONCEPTS) {
    for (const [key, s] of Object.entries(GSIZES)) {
      const dir = join(OUT, c.id, key);
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(join(dir, 'assets', 'fonts'), { recursive: true });
      writeFileSync(join(dir, 'index.html'), bannerHtml(c, key));
      writeFileSync(join(dir, 'style.css'), css);
      copyFileSync(logo, join(dir, 'assets', 'logo.jpg'));
      for (const f of ['space-grotesk.woff2', 'plus-jakarta-sans.woff2']) {
        copyFileSync(join(SRC, 'assets', 'display', 'fonts', f), join(dir, 'assets', 'fonts', f));
      }
      if (c.photo) cropPhoto(c.photo, s, join(dir, 'assets', 'photo.jpg'));

      const zip = join(ZIP_DIR, `ets_${c.id}_${key}.zip`);
      execFileSync('zip', ['-q', '-r', '-9', '-X', zip, '.', '-x', '.*'], { cwd: dir });
      const kb = statSync(zip).size / 1024;
      report.push({ zip: zip.replace(ROOT + '/', ''), kb });
    }
  }
  const over = report.filter(r => r.kb * 1024 > MAX_ZIP);
  console.log(`Google: built ${report.length} banners → google-ads/ (largest zip ${Math.max(...report.map(r => r.kb)).toFixed(0)} KB)`);
  if (over.length) {
    over.forEach(r => console.error(`  ✗ ${r.zip} is ${r.kb.toFixed(0)} KB (> 150 KB)`));
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) build();
