#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon that we can use for PWA
const createIconSVG = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#1f2937"/>
  <circle cx="${size * 0.5}" cy="${size * 0.35}" r="${size * 0.15}" fill="#3b82f6"/>
  <rect x="${size * 0.2}" y="${size * 0.55}" width="${size * 0.6}" height="${size * 0.05}" rx="${size * 0.025}" fill="#3b82f6"/>
  <rect x="${size * 0.25}" y="${size * 0.65}" width="${size * 0.5}" height="${size * 0.05}" rx="${size * 0.025}" fill="#3b82f6"/>
  <rect x="${size * 0.3}" y="${size * 0.75}" width="${size * 0.4}" height="${size * 0.05}" rx="${size * 0.025}" fill="#3b82f6"/>
</svg>`;

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Check if we have sharp for PNG conversion
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not available, generating SVG placeholders only');
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

for (const size of iconSizes) {
  const svgContent = createIconSVG(size);
  const filename = `icon-${size}x${size}`;
  
  if (sharp) {
    // Convert SVG to PNG using sharp if available
    try {
      sharp(Buffer.from(svgContent))
        .png()
        .toFile(path.join(iconsDir, `${filename}.png`))
        .then(() => console.log(`Generated ${filename}.png`))
        .catch(err => {
          console.error(`Failed to generate ${filename}.png:`, err.message);
          // Fallback to SVG
          fs.writeFileSync(path.join(iconsDir, `${filename}.svg`), svgContent);
          console.log(`Generated fallback ${filename}.svg`);
        });
    } catch (err) {
      // Fallback to SVG
      fs.writeFileSync(path.join(iconsDir, `${filename}.svg`), svgContent);
      console.log(`Generated fallback ${filename}.svg`);
    }
  } else {
    // Just create SVG files as fallback
    fs.writeFileSync(path.join(iconsDir, `${filename}.svg`), svgContent);
    console.log(`Generated ${filename}.svg`);
  }
}

// Create shortcut icons
const shortcutIcons = ['shortcut-discover', 'shortcut-activity', 'shortcut-create'];
for (const shortcut of shortcutIcons) {
  const svgContent = createIconSVG(96);
  fs.writeFileSync(path.join(iconsDir, `${shortcut}.png`), svgContent);
  console.log(`Generated ${shortcut}.png`);
}

console.log('Icon generation complete!');