# Energy Talent Search: Meta + Google ads

Open **`index.html`** to see every ad (the preview page, and the home page on Vercel). It has two sections, **Meta Ads** and **Google Ads**, with download links under each ad.

```
meta-ads/                     Facebook + Instagram: 3 concepts × 3 sizes (1080x1080, 1440x1800, 1080x1920)
  <concept>/<size>/           index.html · style.css · assets/
  export/mp4/                 ← UPLOAD THESE to Meta (video ads): H.264 · 30fps · 10s
  export/png/                 static end frames (image ads)
  ad-copy.md                  primary text / headline / description / CTA per concept
google-ads/                   Google Display Network HTML5: 3 concepts × 8 sizes
  <concept>/<size>/           index.html · style.css · assets/ (cropped photo, logo, subset fonts)
  export/zip/                 ← UPLOAD THESE to Google Ads (one zip per banner, all < 150 KB)
  export/gif/                 animated GIF image ads (< 150 KB, 4 fps, stop within 30s)
  export/mp4/                 30fps video of each banner
  export/png/                 static backup images (same sizes)
src/                          the source: build.mjs (Meta), build-google.mjs (Google), preview.mjs, *.css, assets/
scripts/                      capture-png.mjs · record-mp4.mjs (both platforms) · record-gif.mjs (Google)
```

Concepts: **A** Hard-to-fill roles (employers), **B** The 5-step process (employers), **C** Passive talent (job seekers).

## Commands

```bash
npm install          # puppeteer-core only; uses your installed Chrome (or set CHROME_PATH)
npm run build        # regenerate meta-ads/, google-ads/ (+ zips) and index.html from src/
npm run png          # end-frame PNGs for both platforms
npm run mp4          # MP4s for both platforms (needs ffmpeg)
npm run gif          # Google animated GIFs, each checked against the 150 KB limit
npm run png -- google 300x250        # filter: every term must match "<platform folder>/<concept>_<size>"
```

To change copy, line breaks or URLs, edit `src/build.mjs` (Meta) or `src/build-google.mjs` (Google). Styles are in `src/style.css` and `src/google.css`. Don't edit the generated ad folders by hand; the next build overwrites them.
Rendering is deterministic: the export scripts pause every CSS animation and seek it frame by frame.

## Deploying (GitHub + Vercel)
The site is static and every file is committed, including the exports, so Vercel serves the repo as-is.
`vercel.json` turns off Vercel's install and build steps, because they would need ffmpeg and Chrome.
After changing ads, run the full rebuild locally (`npm run export`) and commit. Vercel redeploys on push.
`/preview.html` redirects to `/`.

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
