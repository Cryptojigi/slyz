import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const projectRoot = process.cwd();
const logoPath = path.join(projectRoot, 'public', 'slyzlogo.png');
const logoB64 = fs.readFileSync(logoPath).toString('base64');

// Minimalist, stylish, ultra-clean HTML template (Logo + Name only)
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Slyz</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=swap" rel="stylesheet">
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
      background-color: #090C11;
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #FFFFFF;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
    }

    /* Soft, elegant neutral ambient backlight — not too colorful */
    .ambient-light {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -55%);
      width: 600px;
      height: 480px;
      background: radial-gradient(circle, rgba(141, 138, 255, 0.10) 0%, rgba(205, 224, 106, 0.05) 40%, transparent 70%);
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
    }

    /* Subtle fine grid texture */
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.018) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.018) 1px, transparent 1px);
      background-size: 40px 40px;
      mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, #000 30%, transparent 100%);
      -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, #000 30%, transparent 100%);
      pointer-events: none;
      z-index: 0;
    }

    /* Sleek outer border frame */
    .card-border {
      position: absolute;
      inset: 20px;
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 24px;
      pointer-events: none;
      z-index: 10;
    }

    /* Centered Brand Unit: Logo + Name Only */
    .brand-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      z-index: 1;
      gap: 28px;
    }

    .brand-logo-wrap {
      position: relative;
      filter: drop-shadow(0 20px 38px rgba(0, 0, 0, 0.6)) drop-shadow(0 8px 24px rgba(141, 138, 255, 0.18));
    }

    .brand-logo {
      width: 152px;
      height: auto;
      object-fit: contain;
      display: block;
    }

    .brand-title {
      font-size: 110px;
      font-weight: 900;
      letter-spacing: -0.04em;
      line-height: 0.95;
      background: linear-gradient(180deg, #FFFFFF 45%, #CBD5E1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
  </style>
</head>
<body>
  <div class="ambient-light"></div>
  <div class="grid-pattern"></div>
  <div class="card-border"></div>

  <!-- Logo and Name Only -->
  <div class="brand-container">
    <div class="brand-logo-wrap">
      <img src="data:image/png;base64,${logoB64}" class="brand-logo" alt="Slyz" />
    </div>
    <h1 class="brand-title">Slyz</h1>
  </div>
</body>
</html>`;

const htmlFilePath = path.join(projectRoot, 'scripts', 'og-template.html');
fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');

// Render PNG
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetHtml = `file:///${htmlFilePath.replace(/\\/g, '/')}`;
const outImg = path.join(projectRoot, 'public', 'og-image.png');

console.log('Rendering minimalist stylish 1200x630 OG image...');
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
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&amp;display=swap');
      .txt { font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    </style>
    <radialGradient id="ambient" cx="50%" cy="45%" r="45%">
      <stop offset="0%" stop-color="#8D8AFF" stop-opacity="0.10"/>
      <stop offset="50%" stop-color="#CDE06A" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#090C11" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.018)" stroke-width="1"/>
    </pattern>
    <linearGradient id="title-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="45%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#CBD5E1"/>
    </linearGradient>
    <filter id="logo-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="22" flood-color="#000000" flood-opacity="0.6"/>
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#8D8AFF" flood-opacity="0.18"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="630" fill="#090C11"/>

  <!-- Soft Ambient Backlight -->
  <rect width="1200" height="630" fill="url(#ambient)"/>

  <!-- Subtle Grid -->
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- Card Border -->
  <rect x="20" y="20" width="1160" height="590" rx="24" fill="none" stroke="rgba(255, 255, 255, 0.07)" stroke-width="1"/>

  <!-- Center Brand Hero: Logo + Name Only -->
  <g filter="url(#logo-shadow)">
    <image x="524" y="160" width="152" height="172" href="data:image/png;base64,${logoB64}"/>
  </g>

  <!-- Title Slyz -->
  <text x="600" y="445" text-anchor="middle" class="txt" font-size="110" font-weight="900" fill="url(#title-grad)" letter-spacing="-4.4">Slyz</text>
</svg>`;

const outSvg = path.join(projectRoot, 'public', 'og-image.svg');
fs.writeFileSync(outSvg, svgContent, 'utf8');
console.log('Successfully saved to public/og-image.svg (minimalist Logo + Name only)');
