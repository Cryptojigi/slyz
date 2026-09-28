import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const projectRoot = process.cwd();
const logoPath = path.join(projectRoot, 'public', 'slyzlogo.png');
const logoB64 = fs.readFileSync(logoPath).toString('base64');

// HTML template for headless browser rendering at exactly 1200x630
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Slyz Social Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1200px;
      height: 630px;
      overflow: hidden;
      background-color: #0B0E14;
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #FFFFFF;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 60px;
      position: relative;
    }

    /* Ambient Background Glows */
    .glow-top-left {
      position: absolute;
      top: -150px;
      left: 15%;
      width: 560px;
      height: 500px;
      background: radial-gradient(circle, rgba(141, 138, 255, 0.22) 0%, rgba(141, 138, 255, 0) 70%);
      filter: blur(95px);
      pointer-events: none;
      z-index: 0;
    }
    .glow-bottom-right {
      position: absolute;
      bottom: -130px;
      right: 15%;
      width: 520px;
      height: 460px;
      background: radial-gradient(circle, rgba(205, 224, 106, 0.17) 0%, rgba(205, 224, 106, 0) 70%);
      filter: blur(95px);
      pointer-events: none;
      z-index: 0;
    }

    /* Subtle Geometric Background Grid */
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 44px 44px;
      mask-image: radial-gradient(ellipse 80% 75% at 50% 50%, #000 35%, transparent 100%);
      -webkit-mask-image: radial-gradient(ellipse 80% 75% at 50% 50%, #000 35%, transparent 100%);
      pointer-events: none;
      z-index: 0;
    }

    /* Sleek Perimeter Border */
    .card-border {
      position: absolute;
      inset: 16px;
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 22px;
      pointer-events: none;
      z-index: 10;
    }

    /* Top Bar - Clean & Minimal */
    .top-bar {
      position: absolute;
      top: 44px;
      right: 56px;
      z-index: 1;
    }
    .domain-tag {
      font-size: 15px;
      font-weight: 600;
      color: #7B8CA3;
      letter-spacing: 0.04em;
    }

    /* Center Hero Brand Section */
    .hero-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      z-index: 1;
    }
    .brand-mark-wrap {
      position: relative;
      margin-bottom: 20px;
      filter: drop-shadow(0 14px 34px rgba(141, 138, 255, 0.35));
    }
    .brand-logo {
      width: 124px;
      height: auto;
      object-fit: contain;
      display: block;
    }
    .brand-title {
      font-size: 88px;
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1;
      margin-bottom: 18px;
      background: linear-gradient(180deg, #FFFFFF 40%, #E2E8F0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-tagline {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.015em;
      color: #FFFFFF;
      margin-bottom: 16px;
    }
    .brand-tagline span {
      color: #CDE06A;
    }
    .brand-desc {
      font-size: 19px;
      font-weight: 400;
      line-height: 1.55;
      color: #8F9CAE;
      max-width: 760px;
    }
  </style>
</head>
<body>
  <div class="glow-top-left"></div>
  <div class="glow-bottom-right"></div>
  <div class="grid-pattern"></div>
  <div class="card-border"></div>

  <!-- Top Bar: Clean, Minimal Domain -->
  <div class="top-bar">
    <div class="domain-tag">useslyz.vercel.app</div>
  </div>

  <!-- Center Hero Brand Section -->
  <div class="hero-center">
    <div class="brand-mark-wrap">
      <img src="data:image/png;base64,${logoB64}" class="brand-logo" alt="Slyz Logo" />
    </div>
    <h1 class="brand-title">Slyz</h1>
    <h2 class="brand-tagline">Thematic Stock Basket Investing <span>on Solana</span></h2>
    <p class="brand-desc">
      Non-custodial fractional US equities, 1-click curated baskets, and zero-fee stock gifting.
    </p>
  </div>
</body>
</html>`;

const htmlFilePath = path.join(projectRoot, 'scripts', 'og-template.html');
fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');

// Render PNG
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetHtml = `file:///${htmlFilePath.replace(/\\/g, '/')}`;
const outImg = path.join(projectRoot, 'public', 'og-image.png');

console.log('Rendering high-res 1200x630 OG image...');
execFileSync(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1200,630',
  `--screenshot=${outImg}`,
  targetHtml
]);

// Also copy to src/app/opengraph-image.png and src/app/twitter-image.png
fs.copyFileSync(outImg, path.join(projectRoot, 'src', 'app', 'opengraph-image.png'));
fs.copyFileSync(outImg, path.join(projectRoot, 'src', 'app', 'twitter-image.png'));
console.log('Successfully saved to public/og-image.png, src/app/opengraph-image.png, and src/app/twitter-image.png');

// Generate matching pure vector public/og-image.svg
const svgContent = `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&amp;display=swap');
      .txt { font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    </style>
    <radialGradient id="bg-glow-purple" cx="30%" cy="10%" r="45%">
      <stop offset="0%" stop-color="#8D8AFF" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#8D8AFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bg-glow-lime" cx="75%" cy="90%" r="40%">
      <stop offset="0%" stop-color="#CDE06A" stop-opacity="0.17"/>
      <stop offset="100%" stop-color="#CDE06A" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M 44 0 L 0 0 0 44" fill="none" stroke="rgba(255, 255, 255, 0.025)" stroke-width="1"/>
    </pattern>
    <linearGradient id="title-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="30%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#E2E8F0"/>
    </linearGradient>
    <filter id="logo-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="17" flood-color="#8D8AFF" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="630" fill="#0B0E14"/>

  <!-- Subtle Radial Ambient Glows -->
  <rect width="1200" height="630" fill="url(#bg-glow-purple)"/>
  <rect width="1200" height="630" fill="url(#bg-glow-lime)"/>

  <!-- Subtle Grid -->
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- Card Border -->
  <rect x="16" y="16" width="1168" height="598" rx="22" fill="none" stroke="rgba(255, 255, 255, 0.09)" stroke-width="1.5"/>

  <!-- Top Bar: Clean, Domain only -->
  <g transform="translate(56, 44)">
    <text x="1088" y="16" text-anchor="end" class="txt" font-size="15" font-weight="600" fill="#7B8CA3" letter-spacing="0.5">useslyz.vercel.app</text>
  </g>

  <!-- Center Brand Hero -->
  <g filter="url(#logo-shadow)">
    <image x="538" y="125" width="124" height="140" href="data:image/png;base64,${logoB64}"/>
  </g>

  <!-- Title Slyz -->
  <text x="600" y="348" text-anchor="middle" class="txt" font-size="88" font-weight="900" fill="url(#title-grad)" letter-spacing="-2.5">Slyz</text>

  <!-- Tagline -->
  <text x="600" y="405" text-anchor="middle" class="txt" font-size="32" font-weight="700" fill="#FFFFFF" letter-spacing="-0.4">
    Thematic Stock Basket Investing <tspan fill="#CDE06A">on Solana</tspan>
  </text>

  <!-- Description -->
  <text x="600" y="452" text-anchor="middle" class="txt" font-size="19" font-weight="400" fill="#8F9CAE">
    Non-custodial fractional US equities, 1-click curated baskets, and zero-fee stock gifting.
  </text>
</svg>`;

const outSvg = path.join(projectRoot, 'public', 'og-image.svg');
fs.writeFileSync(outSvg, svgContent, 'utf8');
console.log('Successfully saved to public/og-image.svg (clean, authentic design, no glowing dots or dock)');
