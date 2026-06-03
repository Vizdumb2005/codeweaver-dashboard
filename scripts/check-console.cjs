#!/usr/bin/env node

/**
 * Production Build Console Check
 * This script checks for console.log statements in production builds
 * and fails the build if any are found (except console.warn and console.error)
 */

const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const BANNED_CONSOLE_METHODS = ['log', 'info', 'debug', 'trace', 'dir', 'time', 'timeEnd', 'table', 'group', 'groupCollapsed', 'groupEnd'];
const ALLOWED_CONSOLE_METHODS = ['warn', 'error'];

/**
 * Check if a line contains a banned console method
 */
function hasBannedConsole(line, filePath) {
  // Skip node_modules and test files
  if (filePath.includes('node_modules') || filePath.includes('.test.') || filePath.includes('.spec.') || filePath.includes('__tests__')) {
    return false;
  }

  // Check for console.xxx calls
  for (const method of BANNED_CONSOLE_METHODS) {
    // Match console.method(
    const consolePattern = new RegExp(`console\\.${method}\\s*\\(`);
    // Match console['method'](
    const bracketPattern = new RegExp(`console\\s*['"]${method}['"]\\s*\\(`);
    
    if (consolePattern.test(line) || bracketPattern.test(line)) {
      return { method, pattern: consolePattern };
    }
  }

  return false;
}

/**
 * Main check function
 */
function checkConsoleUsage() {
  const errors = [];
  
  // Get all JS/TS files in src/ and js/ directories
  const files = [
    ...globSync('src/**/*.{js,jsx,ts,tsx}', { nodir: true }),
    ...globSync('js/**/*.{js,jsx,ts,tsx}', { nodir: true }),
  ];

  const isFix = process.argv.includes('--fix');
  console.log(`Checking ${files.length} files for console statements...\n`);

  for (const filePath of files) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      let fileHasError = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const result = hasBannedConsole(line, filePath);
        
        if (result) {
          fileHasError = true;
          errors.push({
            file: filePath,
            line: i + 1,
            method: result.method,
            code: line.trim().substring(0, 100),
          });
        }
      }

      if (fileHasError && isFix) {
        let modified = false;
        for (const method of BANNED_CONSOLE_METHODS) {
          const consolePattern = new RegExp(`console\\.${method}\\s*\\(`, 'g');
          const bracketPattern = new RegExp(`console\\s*['"]${method}['"]\\s*\\(`, 'g');
          
          if (consolePattern.test(content) || bracketPattern.test(content)) {
            content = content.replace(consolePattern, 'console.warn(');
            content = content.replace(bracketPattern, "console['warn'](");
            modified = true;
          }
        }
        if (modified) {
          fs.writeFileSync(filePath, content, 'utf-8');
          console.log(`  Fixed console statements in ${filePath}`);
        }
      }
    } catch (error) {
      console.error(`Error reading/writing file ${filePath}:`, error.message);
    }
  }

  if (isFix) {
    console.log('\nAuto-fix complete. Re-running check...');
    // Clear errors array and run check without fixing (or just exit 0 if we fixed them)
    if (errors.length > 0) {
      console.log(`Fixed console statements. Please run build again.`);
      process.exit(0);
    }
  }

  if (errors.length > 0) {
    console.error('\n❌ Found banned console statements:\n');
    for (const error of errors) {
      console.error(`  ${error.file}:${error.line}`);
      console.error(`    console.${error.method}(...)`);
      console.error(`    ${error.code}\n`);
    }
    console.error(`\nFound ${errors.length} console statement(s) that are not allowed in production.`);
    console.error('Only console.warn() and console.error() are allowed.');
    console.error('\nTo fix, either:');
    console.error('  1. Remove the console statement');
    console.error('  2. Replace with a proper logging library');
    console.error('  3. Use console.warn() or console.error() for error logging\n');
    process.exit(1);
  } else {
    console.log('✅ No banned console statements found!');
    console.log('   Only console.warn() and console.error() are allowed.\n');
    process.exit(0);
  }
}

// Run the check
checkConsoleUsage();
