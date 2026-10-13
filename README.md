# Energy Talent Search: HTML5 ads for Meta and Google

Animated ad set for **[Energy Talent Search](https://energytalentsearch.com/)**, a Denver energy recruiting firm.
It has 3 concepts, each built for both platforms:

| Concept | Audience | Headline | CTA |
|---|---|---|---|
| **A** · Hard-to-fill roles | Employers | Hard-to-fill energy roles? We know who to call. | Start a Search |
| **B** · The 5-step process | Employers | First call to first day in 5 clear steps. | See How We Hire |
| **C** · Passive talent | Job seekers | The best energy jobs never hit the job boards. | Start Your Job Search |

| Platform | Ads | Sizes | Files to upload |
|---|---|---|---|
| **Meta** (Facebook + Instagram) | 9 | 1080×1080 · 1440×1800 · 1080×1920 | MP4 (video ads) or PNG (image ads) |
| **Google Ads** (Display Network) | 24 | 300×250 · 336×280 · 728×90 · 970×250 · 160×600 · 300×600 · 320×50 · 320×100 | ZIP (HTML5), or GIF/PNG (image ads) |

Logo, photos, colors and fonts all come from the client's website.
The only figure used anywhere is "20+ years"; there are no invented stats or testimonials.

## View the ads

`index.html` is the preview page. It's also the site's home page when deployed to Vercel.

- A **Meta Ads / Google Ads** toggle at the top shows one platform at a time. Add `#google` to the URL to open on Google Ads.
- Every ad plays live, and **Replay all** restarts them.
- Each ad has **Download Ads** buttons: **MP4 · PNG** for Meta, and **ZIP · MP4 · GIF · PNG** for Google.
- To play a downloaded GIF on a Mac, select it in Finder and press **Space** (Quick Look).

To view locally, serve the folder rather than opening the file directly, so the fonts load:

```bash
python3 -m http.server 8080      # then open http://localhost:8080
```

## What's in the repo

```
index.html                    preview page / Vercel home page (generated)
meta-ads/                     Meta: 3 concepts × 3 sizes
  <concept>/<size>/           index.html · style.css · assets/
  export/mp4/                 ← upload to Meta as video ads (H.264 · 30fps · 10s)
  export/png/                 static end frames (image ads)
  ad-copy.md                  primary text / headline / description / CTA per concept
google-ads/                   Google Display: 3 concepts × 8 sizes
  <concept>/<size>/           index.html · style.css · assets/ (cropped photo, logo, subset fonts)
  export/zip/                 ← upload to Google Ads as HTML5 ads (all < 150 KB)
  export/gif/                 animated GIF image ads (< 150 KB, 4 fps, stop within 30s)
  export/mp4/                 30fps video of each banner
  export/png/                 static backup images
src/                          source: build.mjs (Meta), build-google.mjs (Google), preview.mjs, style.css, google.css, assets/
scripts/                      export tools: capture-png.mjs · record-mp4.mjs · record-gif.mjs
vercel.json                   static hosting config (no build step on Vercel)
```

## Editing and rebuilding

Everything in `meta-ads/`, `google-ads/` and `index.html` is generated from `src/`. Don't edit those by hand; the next build overwrites them.

| To change | Edit |
|---|---|
| Meta copy, line breaks, landing URLs | `src/build.mjs` |
| Google copy, sizes, landing URLs, photo focal points | `src/build-google.mjs` |
| Styles and animation | `src/style.css` (Meta) · `src/google.css` (Google) |
| Preview page | `src/preview.mjs` |
| Photos and logo | `src/assets/` (see [Image slots](#image-slots)) |

```bash
npm install          # puppeteer-core only; uses your installed Chrome (or set CHROME_PATH)
npm run export       # build + PNG + MP4 + GIF for everything (needs ffmpeg; takes several minutes)

npm run build        # regenerate ad folders, Google ZIPs and index.html only
npm run png          # end-frame PNGs (both platforms)
npm run mp4          # MP4s (both platforms)
npm run gif          # Google GIFs, each checked against the 150 KB limit
npm run png -- google 300x250        # filter: every term must match "<platform folder>/<concept>_<size>"
```

Exports are frame-accurate: the scripts pause every CSS animation and seek it frame by frame in headless Chrome, then encode with ffmpeg.

## Deploy to Vercel

The site is static and every file, including the exports, is committed, so Vercel serves the repo as-is.

1. Go to [vercel.com/new](https://vercel.com/new) and import `vikask-iitg/HTML5-Ads-Sample`.
2. Leave **Framework Preset** on *Other* and keep the default build settings. `vercel.json` already skips the install and build steps, because they need ffmpeg and Chrome.
3. Click **Deploy**. The preview page goes live at the project URL, and `/preview.html` redirects there.

After that, every push to `main` redeploys automatically. When you change the ads, run `npm run export` locally, commit the regenerated files and push.

> This repo is **public**, so the client's logo and creative are visible to anyone. To restrict access, make the repo private (Vercel still deploys it) and/or turn on Vercel's Deployment Protection.

## Meta upload
Ads Manager doesn't accept HTML5, so upload the **MP4s** as video ads (or the PNGs as image ads).
Use placement asset customization: 1:1 for Feed/Marketplace/Right Column, 4:5 for Feed, 9:16 for Stories/Reels.

## Google Ads upload
In a new **Display campaign** ad, choose **Upload display ads** and add the ZIPs from `google-ads/export/zip/`.
Each banner:
- has an `ad.size` meta tag
- routes its click through `clickTag` (the landing URL with UTM parameters, set in `src/build-google.mjs`)
- plays twice (≈21s, under Google's 30s limit) and stays on the end frame
- has no external requests: fonts are subset to Latin, and photos are pre-cropped for each size at 2× for retina screens

Google only allows HTML5 uploads from accounts with a good policy history and enough past spend.
If the upload option is missing, upload the animated GIFs from `google-ads/export/gif/` as image ads instead.
They follow Google's animated-image rules: under 150 KB, slower than 5 fps, and they stop within 30s.
The GIFs keep the text, underline, step and CTA animation, but hold the photo still (the zoom would push them over 150 KB).
The static PNGs are the final fallback.

| Size | Name | Layout |
|---|---|---|
| 300×250 · 336×280 | Medium / Large Rectangle | Photo, headline, CTA. Concept B shows a 5-dot step ticker |
| 728×90 | Leaderboard | Logo · headline · CTA in one row. Concept B adds the step ticker |
| 970×250 | Billboard | Headline, sub-line and CTA over the photo. Concept B shows the full step list |
| 160×600 · 300×600 | Wide Skyscraper / Half-Page | Photo on top, copy below. Concept B shows the full step list |
| 320×50 | Mobile Banner | Two-part headline: the question, then the answer |
| 320×100 | Large Mobile Banner | Logo and CTA on top, two-line headline below |

## Meta: safe zones and type
- 9:16: nothing between y=0–300 or y=1520–1920 (Meta's profile bar and CTA overlay). Side margins are 64px.
- 1:1 and 4:5: 64px padding on every side (85px on the 1440-wide canvas).
- 4:5 is laid out on a 1080×1350 stage and scaled ×4/3, so text and margins scale proportionally.
- Headline sizes are 78/86/96px at 1080 wide.

## Image slots
All photos come from energytalentsearch.com. To swap one, replace the file in `src/assets/` with the same name, then run `npm run build`.
The Google build re-crops each photo per banner around a focal point (`fx`/`fy` in `src/build-google.mjs`), so update that point too if the subject moves.

| Slot | Used by | Current | Ideal replacement |
|---|---|---|---|
| `assets/hero-rig.jpg` | A | Pump jacks at sunset, Colorado plains (2880×1646) | Landscape ≥2400px wide. Rig or pump jack at dusk with the subject in the **left third** and a darker lower half for the text. No people facing camera. |
| `assets/bg-control-room.jpg` | B | Energy control room (900px). Shown at 16% opacity as texture | Any industrial interior or control room, ≥1600px. Low detail matters more than resolution because it sits under navy. |
| `assets/hero-engineer.jpg` | C | Engineer in PPE with wind turbines (2880×1646) | Landscape ≥2400px. Engineer or technician in PPE on site, subject **right of centre** and looking down or away. Wind, solar or rig background. |
| `assets/logo.png` | All | Site logo (456×276, transparent) | Transparent PNG, any width. Displayed 84–96px tall on a white chip. |

Avoid handshakes and call-center stock photos.

## Motion (9s)
| t | A / C | B |
|---|---|---|
| 0–9s | Ken Burns on photo (1.04 → 1.16) | Ken Burns on texture |
| 0.1s | Logo drops in | Logo |
| 0.4–1.2s | Headline lines rise in (staggered) | Headline |
| 1.35s | Green underline draws under key phrase | Underline under "5 clear steps." |
| 2.0s | Sub-line | Steps 01→05 tick in every 0.55s with a growing green rail |
| 2.6s | CTA pops, arrow nudges, light sweeps ×2 | CTA at 5.1s |

`prefers-reduced-motion` jumps straight to the end frame. The whole ad is one click target pointing at `clickTag`.
