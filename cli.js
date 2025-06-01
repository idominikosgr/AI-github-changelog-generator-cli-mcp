#!/usr/bin/env node

/**
 * Enhanced CLI interface for AI Changelog Generator
 * Provides better argument parsing and user experience
 */

require('dotenv').config({ path: '.env.local' });
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import the main generator
const EnhancedAIChangelogGenerator = require('./generate-ai-changelog');

const argv = yargs(hideBin(process.argv))
  .usage(chalk.blue('Usage: $0 [options]'))
  .example('$0', 'Generate changelog from recent commits')
  .example('$0 --commits 10', 'Analyze last 10 commits')
  .example('$0 --since "2 weeks ago"', 'Analyze commits from 2 weeks ago')
  .example('$0 --staged', 'Analyze staged changes')
  .example('$0 --output CHANGELOG.md', 'Output to custom file')
  .options({
    'commits': {
      alias: 'c',
      type: 'number',
      description: 'Number of recent commits to analyze',
      default: 20
    },
    'since': {
      alias: 's',
      type: 'string',
      description: 'Analyze commits since date (e.g., "2 weeks ago", "2023-01-01")'
    },
    'staged': {
      type: 'boolean',
      description: 'Analyze staged changes only'
    },
    'output': {
      alias: 'o',
      type: 'string',
      description: 'Output file name',
      default: 'AI_CHANGELOG.md'
    },
    'format': {
      alias: 'f',
      type: 'string',
      choices: ['standard', 'keep-a-changelog', 'simple'],
      description: 'Changelog format',
      default: 'standard'
    },
    'verbose': {
      alias: 'v',
      type: 'boolean',
      description: 'Show detailed output'
    },
    'dry-run': {
      type: 'boolean',
      description: 'Preview without writing to file'
    },
    'config': {
      type: 'string',
      description: 'Path to config file'
    }
  })
  .help('h')
  .alias('h', 'help')
  .version()
  .epilog(chalk.gray('For more information, visit: https://github.com/your-repo'))
  .argv;

async function main() {
  console.log(chalk.blue.bold('🤖 AI Changelog Generator\n'));

  // Check if we're in a git repository first
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch (error) {
    console.error(chalk.red('❌ Not a git repository'));
    console.log(chalk.yellow('💡 Please run this tool in a git repository directory'));
    console.log(chalk.gray('\nTo initialize a git repository:'));
    console.log(chalk.gray('  git init'));
    console.log(chalk.gray('  git add .'));
    console.log(chalk.gray('  git commit -m "Initial commit"'));
    process.exit(1);
  }

  // Validate environment
  if (argv.verbose) {
    console.log(chalk.gray('Configuration:'));
    console.log(chalk.gray(`- Output file: ${argv.output}`));
    console.log(chalk.gray(`- Format: ${argv.format}`));
    console.log(chalk.gray(`- Commits: ${argv.commits}`));
    if (argv.since) console.log(chalk.gray(`- Since: ${argv.since}`));
    if (argv.staged) console.log(chalk.gray('- Analyzing staged changes'));
    console.log();
  }  try {
    const generator = new EnhancedAIChangelogGenerator();

    let result;

    if (argv.staged) {
      console.log(chalk.yellow('📋 Staged changes analysis not yet implemented in main generator'));
      console.log(chalk.gray('💡 Use the enhanced version: npm run enhanced'));
      return;
    } else if (argv.since) {
      console.log(chalk.blue(`🔍 Generating changelog since: ${argv.since}`));
      result = await generator.generateChangelog(null, argv.since);
    } else {
      console.log(chalk.blue(`🔍 Generating changelog from last ${argv.commits} commits`));
      // For recent commits, we'll use a date calculation
      const daysAgo = Math.floor(argv.commits / 3); // Rough estimate
      const since = `${daysAgo} days ago`;
      result = await generator.generateChangelog(null, since);
    }

    if (result === undefined) {
      console.log(chalk.green(`✅ Changelog generated: ${argv.output}`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
    if (argv.verbose) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, argv };
