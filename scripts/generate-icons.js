const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgPath = path.join(__dirname, '../src/app/icon.svg');
const appleIconPath = path.join(__dirname, '../src/app/apple-icon.png');
const iconPngPath = path.join(__dirname, '../src/app/icon.png');

async function run() {
  if (!fs.existsSync(svgPath)) {
    console.error(`Source SVG not found at: ${svgPath}`);
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(svgPath);

  // 1. Generate 180x180 apple-icon.png (for WebKit/Safari home screen & touch bookmark)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleIconPath);
  console.log(`Successfully generated apple-icon.png at ${appleIconPath}`);

  // 2. Generate 32x32 icon.png (standard favicon PNG for fallback)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(iconPngPath);
  console.log(`Successfully generated icon.png at ${iconPngPath}`);
}

run().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
