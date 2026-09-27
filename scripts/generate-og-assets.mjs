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
      justify-content: space-between;
      align-items: center;
      padding: 48px 60px 48px 60px;
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
      width: 100%;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      position: relative;
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
      margin-top: -12px;
    }
    .brand-mark-wrap {
      position: relative;
      margin-bottom: 16px;
      filter: drop-shadow(0 14px 34px rgba(141, 138, 255, 0.3));
    }
    .brand-logo {
      width: 114px;
      height: auto;
      object-fit: contain;
      display: block;
    }
    .brand-title {
      font-size: 82px;
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1;
      margin-bottom: 16px;
      background: linear-gradient(180deg, #FFFFFF 40%, #E2E8F0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-tagline {
      font-size: 30px;
      font-weight: 700;
      letter-spacing: -0.015em;
      color: #FFFFFF;
      margin-bottom: 12px;
    }
    .brand-tagline span {
      color: #CDE06A;
    }
    .brand-desc {
      font-size: 18px;
      font-weight: 400;
      line-height: 1.55;
      color: #8F9CAE;
      max-width: 720px;
    }

    /* Bottom Infrastructure Dock */
    .infra-dock {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 13px 36px;
      background: rgba(18, 23, 34, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 9999px;
      backdrop-filter: blur(20px);
      box-shadow: 0 12px 38px rgba(0, 0, 0, 0.5);
    }
    .infra-item {
      display: flex;
      align-items: center;
      gap: 9px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: #FFFFFF;
    }
    .infra-item.lime {
      color: #CDE06A;
    }
    .infra-item.periwinkle {
      color: #A5A3FF;
    }
    .infra-divider {
      color: rgba(255, 255, 255, 0.22);
      font-size: 15px;
    }

    /* Logos */
    .sol-icon {
      width: 22px;
      height: 17px;
      display: block;
    }
    .jup-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: linear-gradient(135deg, #F3841E, #F9D058);
      box-shadow: 0 0 8px #F3841E;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="glow-top-left"></div>
  <div class="glow-bottom-right"></div>
  <div class="grid-pattern"></div>
  <div class="card-border"></div>

  <!-- Top Bar: Clean, No glowing-dot pill badge -->
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
      Non-custodial fractional US equities, 1-click theme swaps, and zero-fee stock gifting.
    </p>
  </div>

  <!-- Infrastructure Dock -->
  <div class="infra-dock">
    <div class="infra-item">
      <svg class="sol-icon" viewBox="0 0 397 311" fill="none">
        <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h313.7c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#sg1)"/>
        <path d="M64.6 3.8C67 1.4 70.3 0 73.8 0h313.7c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="url(#sg2)"/>
        <path d="M332.9 120.9c-2.4-2.4-5.7-3.8-9.2-3.8H10c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h313.7c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#sg3)"/>
        <defs>
          <linearGradient id="sg1" x1="363.3" y1="310.8" x2="26.7" y2="234.1" gradientUnits="userSpaceOnUse"><stop stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/></linearGradient>
          <linearGradient id="sg2" x1="363.3" y1="77.6" x2="26.7" y2="0.9" gradientUnits="userSpaceOnUse"><stop stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/></linearGradient>
          <linearGradient id="sg3" x1="26.7" y1="198.5" x2="363.3" y2="117.1" gradientUnits="userSpaceOnUse"><stop stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/></linearGradient>
        </defs>
      </svg>
      <span>Solana</span>
    </div>

    <span class="infra-divider">•</span>

    <div class="infra-item periwinkle">
      <span>Token-2022</span>
    </div>

    <span class="infra-divider">•</span>

    <div class="infra-item">
      <span class="jup-dot"></span>
      <span>Jupiter DEX</span>
    </div>

    <span class="infra-divider">•</span>

    <div class="infra-item lime">
      <span>xStocks &amp; PreStocks</span>
    </div>
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
    <linearGradient id="sg1" x1="363.3" y1="310.8" x2="26.7" y2="234.1" gradientUnits="userSpaceOnUse"><stop stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/></linearGradient>
    <linearGradient id="sg2" x1="363.3" y1="77.6" x2="26.7" y2="0.9" gradientUnits="userSpaceOnUse"><stop stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/></linearGradient>
    <linearGradient id="sg3" x1="26.7" y1="198.5" x2="363.3" y2="117.1" gradientUnits="userSpaceOnUse"><stop stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/></linearGradient>
    <linearGradient id="title-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="30%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#E2E8F0"/>
    </linearGradient>
    <linearGradient id="jup-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F3841E"/>
      <stop offset="100%" stop-color="#F9D058"/>
    </linearGradient>
    <filter id="logo-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="17" flood-color="#8D8AFF" flood-opacity="0.3"/>
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
  <g transform="translate(56, 48)">
    <text x="1088" y="16" text-anchor="end" class="txt" font-size=\"15\" font-weight="600" fill="#7B8CA3" letter-spacing="0.5">useslyz.vercel.app</text>
  </g>

  <!-- Center Brand Hero -->
  <g filter="url(#logo-shadow)">
    <image x="543" y="112" width="114" height="129" href="data:image/png;base64,${logoB64}"/>
  </g>

  <!-- Title Slyz -->
  <text x="600" y="322" text-anchor="middle" class="txt" font-size="82" font-weight="900" fill="url(#title-grad)" letter-spacing="-2.5">Slyz</text>

  <!-- Tagline -->
  <text x="600" y="374" text-anchor="middle" class="txt" font-size="30" font-weight="700" fill="#FFFFFF" letter-spacing="-0.4">
    Thematic Stock Basket Investing <tspan fill="#CDE06A">on Solana</tspan>
  </text>

  <!-- Description -->
  <text x="600" y="416" text-anchor="middle" class="txt" font-size="18" font-weight="400" fill="#8F9CAE">
    Non-custodial fractional US equities, 1-click theme swaps, and zero-fee stock gifting.
  </text>

  <!-- Bottom Infrastructure Dock -->
  <g transform="translate(250, 526)">
    <rect x="0" y="0" width="700" height="50" rx="25" fill="rgba(18, 23, 34, 0.9)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.2"/>
    
    <!-- Solana -->
    <g transform="translate(38, 16)">
      <svg width="22" height="17" viewBox="0 0 397 311" fill="none">
        <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h313.7c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#sg1)"/>
        <path d="M64.6 3.8C67 1.4 70.3 0 73.8 0h313.7c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="url(#sg2)"/>
        <path d="M332.9 120.9c-2.4-2.4-5.7-3.8-9.2-3.8H10c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h313.7c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#sg3)"/>
      </svg>
      <text x="32" y="14" class="txt" font-size="15" font-weight="700" fill="#FFFFFF">Solana</text>
    </g>

    <text x="165" y="31" text-anchor="middle" class="txt" font-size="15" fill="rgba(255, 255, 255, 0.25)">•</text>

    <!-- Token-2022 -->
    <g transform="translate(198, 31)">
      <text x="0" y="0" class="txt" font-size="15" font-weight="700" fill="#A5A3FF">Token-2022</text>
    </g>

    <text x="328" y="31" text-anchor="middle" class="txt" font-size="15" fill="rgba(255, 255, 255, 0.25)">•</text>

    <!-- Jupiter DEX -->
    <g transform="translate(360, 19)">
      <circle cx="5" cy="10" r="5" fill="url(#jup-grad)"/>
      <text x="18" y="12" class="txt" font-size="15" font-weight="700" fill="#FFFFFF">Jupiter DEX</text>
    </g>

    <text x="500" y="31" text-anchor="middle" class="txt" font-size="15" fill="rgba(255, 255, 255, 0.25)">•</text>

    <!-- xStocks & PreStocks -->
    <g transform="translate(530, 31)">
      <text x="0" y="0" class="txt" font-size="15" font-weight="700" fill="#CDE06A">xStocks &amp; PreStocks</text>
    </g>
  </g>
</svg>`;

const outSvg = path.join(projectRoot, 'public', 'og-image.svg');
fs.writeFileSync(outSvg, svgContent, 'utf8');
console.log('Successfully saved to public/og-image.svg without the pill badge');
