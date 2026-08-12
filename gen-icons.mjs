import fs from 'fs';

// Simple 1x1 purple PNG header + IDAT with solid color for PWA icon
// We'll use SVG-based icons instead since modern PWA supports SVG
const svgContent = fs.readFileSync('frontend/public/favicon.svg', 'utf-8');

// Create a proper SVG icon with background for PWA
function makePWAIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0F172A"/>
      <stop offset="100%" style="stop-color:#1E293B"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <g transform="translate(${size * 0.2}, ${size * 0.12}) scale(${(size * 0.6) / 48})">
    <path fill="#863bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
  </g>
  <text x="${size / 2}" y="${size * 0.92}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="${size * 0.1}" fill="white">KYNEX</text>
</svg>`;
}

fs.writeFileSync('frontend/public/icons/icon-192.svg', makePWAIcon(192));
fs.writeFileSync('frontend/public/icons/icon-512.svg', makePWAIcon(512));
console.log('PWA icons created (SVG)');
