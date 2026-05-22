const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'dist', 'assets');
const destDir = path.join(__dirname, 'assets');

try {
  // Ensure destination directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log('Created assets directory:', destDir);
  }

  // Read files from source directory
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
    console.error('Source assets directory not found:', srcDir);
    process.exit(1);
  }
} catch (err) {
  console.error('Error copying assets:', err);
  process.exit(1);
}
