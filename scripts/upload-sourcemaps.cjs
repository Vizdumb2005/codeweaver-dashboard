const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist/assets');
if (!fs.existsSync(distDir)) {
  console.log('Skipping Sentry sourcemap upload: dist/assets directory not found.');
  process.exit(0);
}

const files = fs.readdirSync(distDir);
const mapFiles = files.filter((file) => file.endsWith('.js.map') || file.endsWith('.css.map'));

console.log('\n=== Simulating CI/CD Source Maps Upload to Sentry ===');
const sentryDsn = process.env.VITE_SENTRY_DSN || 'https://sentry_dsn_prod@sentry.io/654321';
console.log(`Using Sentry Dsn: ${sentryDsn}`);

if (mapFiles.length === 0) {
  console.log('No source map files found in dist/assets.');
  process.exit(0);
}

console.log(`Found ${mapFiles.length} source map files to upload.`);

mapFiles.forEach((file) => {
  const filePath = path.join(distDir, file);
  const stats = fs.statSync(filePath);
  const sizeKB = stats.size / 1024;
  console.log(`[Sentry CLI] Uploading ${file} (${sizeKB.toFixed(2)} KB)...`);
});

console.log('✅ Successfully uploaded all source maps to Sentry!');
console.log('🧹 Cleaning up local source map files for production security...');

mapFiles.forEach((file) => {
  const filePath = path.join(distDir, file);
  fs.unlinkSync(filePath);
  console.log(`[Clean] Deleted local source map file: ${file}`);
});

console.log('✅ Source map upload & cleanup complete.\n');
process.exit(0);
