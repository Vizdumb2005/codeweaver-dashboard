const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist/assets');
if (!fs.existsSync(distDir)) {
  console.error('Error: dist/assets directory not found. Run npm run build first.');
  process.exit(1);
}

const files = fs.readdirSync(distDir);
let exceeded = false;

const MAIN_BUDGET_KB = 200;
const SCREEN_BUDGET_KB = 150;

console.log('\n=== Checking Bundle Size Budgets ===');

files.forEach((file) => {
  if (!file.endsWith('.js')) return;

  const filePath = path.join(distDir, file);
  const stats = fs.statSync(filePath);
  const sizeKB = stats.size / 1024;

  // Enforce main chunk budget
  if (file.startsWith('index-') || file.startsWith('vendor-') || file.startsWith('vendor-other-')) {
    console.log(`Main Chunk: ${file} | Size: ${sizeKB.toFixed(2)} KB | Budget: ${MAIN_BUDGET_KB} KB`);
    if (sizeKB > MAIN_BUDGET_KB) {
      console.error(`❌ EXCEEDED BUDGET: Main chunk ${file} is ${sizeKB.toFixed(2)} KB (Limit: ${MAIN_BUDGET_KB} KB)`);
      exceeded = true;
    }
  } else {
    // Enforce screen/other chunks budget
    console.log(`Screen/Asset Chunk: ${file} | Size: ${sizeKB.toFixed(2)} KB | Budget: ${SCREEN_BUDGET_KB} KB`);
    if (sizeKB > SCREEN_BUDGET_KB) {
      console.error(`❌ EXCEEDED BUDGET: Chunk ${file} is ${sizeKB.toFixed(2)} KB (Limit: ${SCREEN_BUDGET_KB} KB)`);
      exceeded = true;
    }
  }
});

if (exceeded) {
  console.error('❌ Build failed: Bundle size budgets exceeded.\n');
  process.exit(1);
} else {
  console.log('✅ All chunks within budget!\n');
  process.exit(0);
}
