const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'dist', 'assets');
const destDir = path.join(__dirname, 'assets');
const srcIndex = path.join(__dirname, 'frontend', 'dist', 'index.html');
const destIndex = path.join(__dirname, 'index.html');

try {
  // 1. Clean and ensure destination assets directory exists
  if (fs.existsSync(destDir)) {
    console.log('🧹 Cleaning old assets from:', destDir);
    const existingFiles = fs.readdirSync(destDir);
    existingFiles.forEach(file => {
      fs.unlinkSync(path.join(destDir, file));
    });
  } else {
    fs.mkdirSync(destDir, { recursive: true });
    console.log('📁 Created assets directory:', destDir);
  }

  // 2. Copy compiled assets from frontend/dist/assets to root/assets
  if (fs.existsSync(srcDir)) {
    const files = fs.readdirSync(srcDir);
    files.forEach(file => {
      const srcFile = path.join(srcDir, file);
      const destFile = path.join(destDir, file);
      fs.copyFileSync(srcFile, destFile);
      console.log(`Copied: ${file} -> assets/${file}`);
    });
    console.log('✅ Assets copied successfully!');
  } else {
    console.error('⚠️ Source assets directory not found:', srcDir);
    process.exit(1);
  }

  // 3. Copy frontend/dist/index.html to root/index.html
  if (fs.existsSync(srcIndex)) {
    fs.copyFileSync(srcIndex, destIndex);
    console.log('✅ Updated root index.html with compiled frontend build!');
  } else {
    console.error('⚠️ Compiled index.html not found:', srcIndex);
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Error during copy assets phase:', err);
  process.exit(1);
}
