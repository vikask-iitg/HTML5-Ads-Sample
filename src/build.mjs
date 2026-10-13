// Meta (Facebook + Instagram) ads: generates the 9 self-contained ad folders in meta-ads/.
// Usage: npm run build
import { mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SRC, '..');
const OUT = join(ROOT, 'meta-ads');

export const END_MS = 9000;

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, lw: 1080, lh: 1080, cls: 's-sq', label: '1:1 Square · Feed, Marketplace, Right Column' },
  '1440x1800': { w: 1440, h: 1800, lw: 1080, lh: 1350, cls: 's-fe', label: '4:5 Vertical · Facebook & Instagram Feed' },
  '1080x1920': { w: 1080, h: 1920, lw: 1080, lh: 1920, cls: 's-st', label: '9:16 Full-screen · Stories & Reels' },
};

const UTM = (c) => `utm_source=meta&utm_medium=paid_social&utm_campaign=ets_${c}`;

// Headline lines per size. [brackets] = key phrase that gets the drawn green underline.
export const CONCEPTS = [
  {
    id: 'a-hard-to-fill',
    cls: 'c-a',
    name: 'A · Hard-to-fill roles, filled',
    audience: 'Employers',
    image: 'hero-rig.jpg',
    url: `https://energytalentsearch.com/?${UTM('hard_to_fill')}`,
    eyebrow: 'For energy employers',
    headline: {
      '1080x1080': ['Hard-to-fill energy roles?', 'We know [who to call.]'],
      '1440x1800': ['Hard-to-fill', 'energy roles?', 'We know [who to call.]'],
      '1080x1920': ['Hard-to-fill', 'energy roles?', 'We know', '[who to call.]'],
    },
    sub: 'Engineers, field leaders &amp; executives across Oil &amp; Gas, Renewables and Mining.',
    cta: 'Start a Search',
  },
  {
    id: 'b-five-step-process',
    cls: 'c-b',
    name: 'B · The 5-step process',
    audience: 'Employers',
    image: 'bg-control-room.jpg',
    url: `https://energytalentsearch.com/?${UTM('five_steps')}`,
    eyebrow: 'How we hire',
    headline: {
      '1080x1080': ['First call to', 'first day in', '[5 clear steps.]'],
      '1440x1800': ['First call to', 'first day in', '[5 clear steps.]'],
      '1080x1920': ['First call to', 'first day in', '[5 clear steps.]'],
    },
    steps: ['Discovery', 'Sourcing', 'Vetting', 'Shortlist', 'After the hire'],
    cta: 'See How We Hire',
  },
  {
    id: 'c-passive-talent',
    cls: 'c-c',
    name: 'C · Passive talent',
    audience: 'Job seekers',
    image: 'hero-engineer.jpg',
    url: `https://energytalentsearch.com/job-seekers/?${UTM('passive_talent')}`,
    eyebrow: 'For energy professionals',
    headline: {
      '1080x1080': ['The best energy jobs', '[never hit the job boards.]'],
      '1440x1800': ['The best energy jobs', '[never hit the]', '[job boards.]'],
      '1080x1920': ['The best energy', 'jobs [never hit]', '[the job boards.]'],
    },
    sub: 'Confidential. We call you first. 20+ years in energy recruiting.',
    cta: 'Start Your Job Search',
  },
];

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function headlineHtml(lines) {
  let markIdx = 0;
  return lines.map((line, i) => {
    const html = line.replace(/\[(.+?)\]/g, (_, t) =>
      `<span class="mark" style="--md:${(1.35 + markIdx++ * 0.55).toFixed(2)}s">${t}</span>`);
    return `<span class="ln" style="--i:${i}">${html}</span>`;
  }).join('\n          ');
}

function adHtml(c, sizeKey) {
  const s = SIZES[sizeKey];
  const k = +(s.w / s.lw).toFixed(6);
  const steps = c.steps ? `
        <ol class="steps">
          ${c.steps.map((t, i) => `<li class="step" style="--i:${i}"><span class="dot">${CHECK}</span><span class="num">0${i + 1}</span><span class="label">${t}</span></li>`).join('\n          ')}
        </ol>` : '';
  const sub = c.sub ? `\n          <p class="sub">${c.sub}</p>` : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=${s.w}">
  <meta name="ad.size" content="width=${s.w},height=${s.h}">
  <title>Energy Talent Search · ${c.name} · ${sizeKey}</title>
  <link rel="preload" href="assets/fonts/space-grotesk.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/plus-jakarta-sans.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="style.css">
  <style>html,body{width:${s.w}px;height:${s.h}px;overflow:hidden}</style>
  <script>var clickTag = "${c.url}";</script>
</head>
<body>
  <a class="ad wait" id="ad" href="${c.url}" target="_blank" rel="noopener"
     style="--w:${s.w}px;--h:${s.h}px;--lw:${s.lw}px;--lh:${s.lh}px;--k:${k}"
     aria-label="${c.cta} — Energy Talent Search">
    <div class="stage ${c.cls} ${s.cls}">
      <!-- IMAGE SLOT: assets/${c.image} (see README.md › Image slots) -->
      <img class="bg" src="assets/${c.image}" alt="">
      <div class="scrim"></div>

      <div class="safe">
        <!-- LOGO SLOT: swap assets/logo.png (transparent PNG, any width, shown 84–96px tall) -->
        <span class="logo"><img src="assets/logo.png" alt="Energy Talent Search"></span>
        <div class="push"></div>
        <div class="copy">
          <p class="eyebrow">${c.eyebrow}</p>
          <h1 class="headline">
          ${headlineHtml(c.headline[sizeKey])}
          </h1>${sub}
        </div>${steps}
        <span class="cta">${c.cta} ${ARROW}</span>
      </div>
    </div>
  </a>
  <script>
  (function () {
    var END = ${END_MS};
    var ad = document.getElementById('ad');
    var capture = /[?&]capture\\b/.test(location.search);
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function anims() { return document.getAnimations ? document.getAnimations() : []; }
    // Deterministic seek, used by the PNG/MP4 export scripts.
    window.__ad = {
      END: END,
      seek: function (ms) { anims().forEach(function (a) { a.pause(); a.currentTime = ms; }); }
    };
    var ready = Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise(function (r) { if (document.readyState === 'complete') r(); else addEventListener('load', r); })
    ]);
    window.__adReady = ready;
    if (capture) return;
    ready.then(function () {
      if (reduce) { ad.classList.remove('wait'); window.__ad.seek(END); return; }
      ad.classList.remove('wait');
      // Loop 2 of 2: hold the end frame, then play once more and rest on the end frame.
      setTimeout(function () {
        anims().forEach(function (a) { a.currentTime = 0; a.play(); });
      }, END + 2500);
    });
  })();
  </script>
</body>
</html>
`;
}

function build() {
  const css = readFileSync(join(SRC, 'style.css'), 'utf8');
  for (const c of CONCEPTS) {
    for (const key of Object.keys(SIZES)) {
      const dir = join(OUT, c.id, key);
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(join(dir, 'assets', 'fonts'), { recursive: true });
      writeFileSync(join(dir, 'index.html'), adHtml(c, key));
      writeFileSync(join(dir, 'style.css'), css);
      for (const f of ['logo.png', c.image, 'fonts/space-grotesk.woff2', 'fonts/plus-jakarta-sans.woff2']) {
        copyFileSync(join(SRC, 'assets', f), join(dir, 'assets', f));
      }
    }
  }
  console.log(`Meta: built ${CONCEPTS.length * Object.keys(SIZES).length} ads → meta-ads/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) build();
