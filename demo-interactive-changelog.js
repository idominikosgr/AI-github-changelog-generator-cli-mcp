#!/usr/bin/env node

/**
 * Demo Interactive Changelog Generator
 * Simplified version to demonstrate interactive mode capabilities
 */

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');
const fs = require('fs');

async function demoInteractiveMode() {
  console.log('🔍 Interactive Mode Demo - Enhanced Changelog Generator\n');

  console.log('Available Analysis Modes:');
  console.log('1. Analyze staged changes');
  console.log('2. Analyze unstaged changes');
  console.log('3. Select specific commits');
  console.log('4. Analyze recent commits');
  console.log('5. Analyze all commits\n');

  console.log('Available Analysis Types:');
  console.log('- commit: General commit analysis');
  console.log('- feature: Feature implementation analysis');
  console.log('- bugfix: Bug fix analysis');
  console.log('- refactor: Refactoring analysis');
  console.log('- migration: Migration/upgrade analysis\n');

  console.log('Example usage commands:');
  console.log('# Analyze unstaged changes as feature work');
  console.log('node enhanced-changelog-generator-v2.js --unstaged --type feature\n');

  console.log('# Analyze specific commit as refactor');
  console.log('node enhanced-changelog-generator-v2.js --commit abc1234 --type refactor\n');

  console.log('# Analyze staged changes as bugfix');
  console.log('node enhanced-changelog-generator-v2.js --staged --type bugfix\n');

  console.log('# Analyze recent commits as migration');
  console.log('node enhanced-changelog-generator-v2.js --recent 5 --type migration\n');

  // Demo showing recent commits that could be selected
  console.log('📋 Recent commits available for analysis:');
  try {
    const commits = execSync('git log -10 --pretty=format:"%h - %s (%an, %ad)" --date=short', { encoding: 'utf8' });
    const commitLines = commits.split('\n');
    commitLines.forEach((line, index) => {
      console.log(`${index + 1}. ${line}`);
    });
  } catch (error) {
    console.log('Error getting recent commits');
  }

  console.log('\n✨ Interactive mode with inquirer is ready but requires proper terminal interaction.');
  console.log('The enhanced changelog generator supports all these modes and analysis types!');
}

if (require.main === module) {
  demoInteractiveMode().catch(console.error);
}
