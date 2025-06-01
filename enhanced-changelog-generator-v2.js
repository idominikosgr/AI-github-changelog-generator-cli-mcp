#!/usr/bin/env node

/**
 * Enhanced AI Changelog Generator with Multiple Analysis Modes
 *
 * Features:
 * - Analyze specific commits
 * - Analyze commit ranges
 * - Analyze staged changes
 * - Analyze unstaged changes
 * - Interactive mode for commit selection
 * - Custom AI prompts for different analysis types
 */

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const AIProvider = require('../ai-provider');

// Dynamic import for inquirer since it's an ES module
let inquirer;
async function getInquirer() {
  if (!inquirer) {
    inquirer = await import('inquirer');
  }
  return inquirer.default;
}

class AdvancedChangelogGenerator {
  constructor() {
    this.aiProvider = new AIProvider();
    this.hasAI = this.aiProvider.isAvailable;

    // Custom AI prompts for different analysis types
    this.aiPrompts = {
      commit: `Analyze this git commit and provide:
1. Brief description of the changes
2. Business impact and benefits
3. Technical implementation details
4. Risk assessment (Low/Medium/High)
5. Migration notes if applicable

Focus on business value and technical implications.`,

      feature: `Analyze these changes as a feature implementation:
1. What new feature or capability is being added?
2. How does this benefit users?
3. Technical architecture and implementation approach
4. Dependencies and integrations
5. Testing and quality considerations`,

      bugfix: `Analyze these changes as a bug fix:
1. What issue is being resolved?
2. Root cause analysis
3. Solution approach and implementation
4. Impact on users and system stability
5. Prevention measures for similar issues`,

      refactor: `Analyze these changes as a refactoring effort:
1. What code/architecture is being improved?
2. Technical debt being addressed
3. Performance and maintainability benefits
4. Risk assessment for the refactoring
5. Impact on existing functionality`,

      migration: `Analyze these changes as a migration or upgrade:
1. What is being migrated or upgraded?
2. Benefits of the new approach/version
3. Breaking changes and compatibility impacts
4. Migration strategy and steps
5. Rollback considerations`,

      staged: `Analyze these staged changes (ready to commit):
1. Summary of what's being prepared for commit
2. Readiness assessment for deployment
3. Testing requirements before commit
4. Dependencies with other pending changes
5. Commit message suggestions`,

      unstaged: `Analyze these unstaged working directory changes:
1. Development work in progress
2. Completeness assessment
3. Areas that need attention before staging
4. Potential conflicts or issues
5. Next steps recommendations`
    };

    if (!this.hasAI) {
      console.log('⚠️  No AI provider configured. Using rule-based analysis...');
    }
  }

  // Parse command line arguments
  parseArgs() {
    const args = process.argv.slice(2);
    const options = {
      mode: 'recent', // recent, all, range, commit, staged, unstaged
      commitHash: null,
      range: null,
      count: 10,
      output: 'AI_CHANGELOG.md',
      interactive: false,
      analysisType: 'commit' // commit, feature, bugfix, refactor, migration
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case '--commit':
        case '-c':
          options.mode = 'commit';
          options.commitHash = args[i + 1];
          i++;
          break;
        case '--range':
        case '-r':
          options.mode = 'range';
          options.range = args[i + 1];
          i++;
          break;
        case '--staged':
        case '-s':
          options.mode = 'staged';
          break;
        case '--unstaged':
        case '-u':
          options.mode = 'unstaged';
          break;
        case '--all':
        case '-a':
          options.mode = 'all';
          break;
        case '--recent':
          options.mode = 'recent';
          options.count = parseInt(args[i + 1]) || 10;
          i++;
          break;
        case '--interactive':
        case '-i':
          options.interactive = true;
          break;
        case '--type':
        case '-t':
          options.analysisType = args[i + 1];
          i++;
          break;
        case '--output':
        case '-o':
          options.output = args[i + 1];
          i++;
          break;
        case '--help':
        case '-h':
          this.showHelp();
          process.exit(0);
      }
    }

    return options;
  }

  showHelp() {
    console.log(`
🤖 Enhanced AI Changelog Generator

Usage:
  node enhanced-changelog-generator.js [options]

Analysis Modes:
  --commit, -c <hash>     Analyze specific commit
  --range, -r <range>     Analyze commit range (e.g., HEAD~5..HEAD)
  --staged, -s            Analyze staged changes (ready to commit)
  --unstaged, -u          Analyze unstaged changes (working directory)
  --all, -a               Analyze all commits in repository
  --recent [count]        Analyze recent commits (default: 10)
  --interactive, -i       Interactive mode to choose commits

Analysis Types (AI Prompts):
  --type, -t <type>       Analysis type: commit, feature, bugfix, refactor, migration

Options:
  --output, -o <file>     Output file (default: AI_CHANGELOG.md)
  --help, -h              Show this help

Examples:
  # Analyze last 5 commits
  node enhanced-changelog-generator.js --recent 5

  # Analyze specific commit as a feature
  node enhanced-changelog-generator.js --commit abc1234 --type feature

  # Analyze staged changes as a bugfix
  node enhanced-changelog-generator.js --staged --type bugfix

  # Analyze unstaged changes
  node enhanced-changelog-generator.js --unstaged

  # Interactive mode
  node enhanced-changelog-generator.js --interactive

Environment Variables:
  AZURE_OPENAI_KEY        Azure OpenAI API key
  AZURE_OPENAI_ENDPOINT   Azure OpenAI endpoint
  OPENAI_API_KEY          OpenAI API key (fallback)
`);
  }

  // Get commits based on mode
  async getCommitsForMode(options) {
    switch (options.mode) {
      case 'commit':
        return options.commitHash ? [options.commitHash] : [];

      case 'range':
        return this.getCommitsInRange(options.range);

      case 'staged':
        return ['STAGED'];

      case 'unstaged':
        return ['UNSTAGED'];

      case 'all':
        return this.getAllCommits();

      case 'recent':
        return this.getRecentCommits(options.count);

      default:
        return this.getRecentCommits(10);
    }
  }

  getCommitsInRange(range) {
    try {
      const output = execSync(`git log ${range} --pretty=format:"%H" --reverse`, { encoding: 'utf8' });
      return output.split('\n').filter(Boolean);
    } catch (error) {
      console.error('❌ Error getting commits in range:', error.message);
      return [];
    }
  }

  getAllCommits() {
    try {
      const output = execSync('git log --pretty=format:"%H" --reverse', { encoding: 'utf8' });
      return output.split('\n').filter(Boolean);
    } catch (error) {
      console.error('❌ Error getting all commits:', error.message);
      return [];
    }
  }

  getRecentCommits(count) {
    try {
      const output = execSync(`git log -${count} --pretty=format:"%H" --reverse`, { encoding: 'utf8' });
      return output.split('\n').filter(Boolean);
    } catch (error) {
      console.error('❌ Error getting recent commits:', error.message);
      return [];
    }
  }

  // Interactive mode for commit selection
  async runInteractiveMode() {
    console.log('🔍 Interactive Mode - Select commits to analyze\n');

    const inquirer = await getInquirer();

    const choices = [
      { name: 'Analyze staged changes', value: 'staged' },
      { name: 'Analyze unstaged changes', value: 'unstaged' },
      { name: 'Select specific commits', value: 'select' },
      { name: 'Analyze recent commits', value: 'recent' },
      { name: 'Analyze all commits', value: 'all' }
    ];

    const { mode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'What would you like to analyze?',
        choices
      }
    ]);

    switch (mode) {
      case 'staged':
        return ['STAGED'];

      case 'unstaged':
        return ['UNSTAGED'];

      case 'recent':
        const inquirer2 = await getInquirer();
        const { count } = await inquirer2.prompt([
          {
            type: 'input',
            name: 'count',
            message: 'How many recent commits?',
            default: '10',
            validate: (input) => !isNaN(parseInt(input)) || 'Please enter a number'
          }
        ]);
        return this.getRecentCommits(parseInt(count));

      case 'all':
        const inquirer3 = await getInquirer();
        const { confirmAll } = await inquirer3.prompt([
          {
            type: 'confirm',
            name: 'confirmAll',
            message: 'This will analyze ALL commits in the repository. Continue?',
            default: false
          }
        ]);
        return confirmAll ? this.getAllCommits() : [];

      case 'select':
        return await this.selectSpecificCommits();

      default:
        return [];
    }
  }

  async selectSpecificCommits() {
    const recentCommits = this.getRecentCommits(20);
    const commitChoices = [];

    for (const hash of recentCommits) {
      try {
        const subject = execSync(`git log -1 --pretty=format:"%s" ${hash}`, { encoding: 'utf8' });
        const date = execSync(`git log -1 --pretty=format:"%ad" --date=short ${hash}`, { encoding: 'utf8' });
        const author = execSync(`git log -1 --pretty=format:"%an" ${hash}`, { encoding: 'utf8' });

        commitChoices.push({
          name: `${hash.substring(0, 7)} - ${subject} (${author}, ${date})`,
          value: hash
        });
      } catch (error) {
        commitChoices.push({
          name: `${hash.substring(0, 7)} - Error getting info`,
          value: hash
        });
      }
    }

    const inquirer = await getInquirer();
    const { selectedCommits } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedCommits',
        message: 'Select commits to analyze (use spacebar to select):',
        choices: commitChoices,
        pageSize: 10
      }
    ]);

    return selectedCommits;
  }

  // Analyze staged changes
  async analyzeStagedChanges(analysisType) {
    try {
      const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();

      if (!stagedFiles) {
        console.log('⚠️  No staged changes found. Use "git add" to stage files first.');
        return null;
      }

      console.log('📋 Analyzing staged changes...');

      const diff = execSync('git diff --cached', { encoding: 'utf8' });
      const stats = this.getStagedStats();

      const analysis = {
        type: 'staged',
        title: 'Staged Changes Analysis',
        files: stagedFiles.split('\n').filter(Boolean),
        stats,
        diff: diff.substring(0, 5000) // Limit diff size for AI
      };

      if (this.hasAI) {
        analysis.aiSummary = await this.generateAISummary(analysis, analysisType);
      }

      return analysis;
    } catch (error) {
      console.error('❌ Error analyzing staged changes:', error.message);
      return null;
    }
  }

  // Analyze unstaged changes
  async analyzeUnstagedChanges(analysisType) {
    try {
      const unstagedFiles = execSync('git diff --name-only', { encoding: 'utf8' }).trim();

      if (!unstagedFiles) {
        console.log('⚠️  No unstaged changes found.');
        return null;
      }

      console.log('📋 Analyzing unstaged changes...');

      const diff = execSync('git diff', { encoding: 'utf8' });
      const stats = this.getUnstagedStats();

      const analysis = {
        type: 'unstaged',
        title: 'Unstaged Changes Analysis',
        files: unstagedFiles.split('\n').filter(Boolean),
        stats,
        diff: diff.substring(0, 5000) // Limit diff size for AI
      };

      if (this.hasAI) {
        analysis.aiSummary = await this.generateAISummary(analysis, analysisType);
      }

      return analysis;
    } catch (error) {
      console.error('❌ Error analyzing unstaged changes:', error.message);
      return null;
    }
  }

  getStagedStats() {
    try {
      const output = execSync('git diff --cached --stat', { encoding: 'utf8' });
      return this.parseGitStats(output);
    } catch {
      return { files: 0, insertions: 0, deletions: 0 };
    }
  }

  getUnstagedStats() {
    try {
      const output = execSync('git diff --stat', { encoding: 'utf8' });
      return this.parseGitStats(output);
    } catch {
      return { files: 0, insertions: 0, deletions: 0 };
    }
  }

  parseGitStats(output) {
    const lines = output.split('\n').filter(Boolean);
    const summary = lines[lines.length - 1];

    if (summary && summary.includes('changed')) {
      const match = summary.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
      if (match) {
        return {
          files: parseInt(match[1]),
          insertions: parseInt(match[2] || 0),
          deletions: parseInt(match[3] || 0)
        };
      }
    }

    return { files: 0, insertions: 0, deletions: 0 };
  }

  // Analyze single commit
  async analyzeCommit(commitHash, analysisType) {
    if (commitHash === 'STAGED') {
      return await this.analyzeStagedChanges(analysisType);
    } else if (commitHash === 'UNSTAGED') {
      return await this.analyzeUnstagedChanges(analysisType);
    }

    try {
      console.log(`📋 Analyzing commit ${commitHash}...`);

      const subject = execSync(`git log -1 --pretty=format:"%s" ${commitHash}`, { encoding: 'utf8' });
      const author = execSync(`git log -1 --pretty=format:"%an" ${commitHash}`, { encoding: 'utf8' });
      const date = execSync(`git log -1 --pretty=format:"%ad" --date=short ${commitHash}`, { encoding: 'utf8' });
      const body = execSync(`git log -1 --pretty=format:"%b" ${commitHash}`, { encoding: 'utf8' });
      const diff = execSync(`git show ${commitHash}`, { encoding: 'utf8' });
      const stats = this.getCommitStats(commitHash);
      const files = this.getCommitFiles(commitHash);

      const analysis = {
        hash: commitHash,
        subject: subject.trim(),
        author: author.trim(),
        date: date.trim(),
        body: body.trim(),
        files,
        stats,
        diff: diff.substring(0, 5000), // Limit diff size for AI
        type: this.categorizeCommit(subject, body),
        breaking: this.isBreakingChange(subject, body)
      };

      if (this.hasAI) {
        analysis.aiSummary = await this.generateAISummary(analysis, analysisType);
      }

      return analysis;
    } catch (error) {
      console.error(`❌ Error analyzing commit ${commitHash}:`, error.message);
      return null;
    }
  }

  getCommitStats(hash) {
    try {
      const output = execSync(`git show --stat ${hash}`, { encoding: 'utf8' });
      return this.parseGitStats(output);
    } catch {
      return { files: 0, insertions: 0, deletions: 0 };
    }
  }

  getCommitFiles(hash) {
    try {
      const output = execSync(`git show --name-status ${hash}`, { encoding: 'utf8' });
      const lines = output.split('\n').filter(line => line.match(/^[AMDRTUX]\s+/));

      return lines.map(line => {
        const [status, ...pathParts] = line.split('\t');
        return {
          status: status.trim(),
          path: pathParts.join('\t')
        };
      });
    } catch {
      return [];
    }
  }

  categorizeCommit(subject, body) {
    const text = (subject + ' ' + body).toLowerCase();

    if (text.includes('feat') || text.includes('feature')) return 'feat';
    if (text.includes('fix') || text.includes('bug')) return 'fix';
    if (text.includes('docs') || text.includes('documentation')) return 'docs';
    if (text.includes('style') || text.includes('format')) return 'style';
    if (text.includes('refactor')) return 'refactor';
    if (text.includes('test') || text.includes('spec')) return 'test';
    if (text.includes('chore') || text.includes('maintenance')) return 'chore';
    if (text.includes('perf') || text.includes('performance')) return 'perf';
    if (text.includes('ci') || text.includes('build')) return 'ci';

    return 'other';
  }

  isBreakingChange(subject, body) {
    const text = (subject + ' ' + body).toLowerCase();
    return text.includes('breaking') || text.includes('!:') || subject.includes('!');
  }

  // Generate AI summary with custom prompts
  async generateAISummary(analysis, analysisType = 'commit') {
    if (!this.hasAI) return null;

    try {
      let prompt;
      const basePrompt = this.aiPrompts[analysisType] || this.aiPrompts.commit;

      if (analysis.type === 'staged') {
        prompt = `${this.aiPrompts.staged}

Files changed: ${analysis.files.join(', ')}
Stats: ${analysis.stats.files} files, +${analysis.stats.insertions} -${analysis.stats.deletions}

Diff preview:
${analysis.diff}`;
      } else if (analysis.type === 'unstaged') {
        prompt = `${this.aiPrompts.unstaged}

Files changed: ${analysis.files.join(', ')}
Stats: ${analysis.stats.files} files, +${analysis.stats.insertions} -${analysis.stats.deletions}

Diff preview:
${analysis.diff}`;
      } else {
        prompt = `${basePrompt}

Commit: ${analysis.hash}
Subject: ${analysis.subject}
Author: ${analysis.author}
Files: ${analysis.files.map(f => `${f.status} ${f.path}`).join(', ')}
Stats: ${analysis.stats.files} files, +${analysis.stats.insertions} -${analysis.stats.deletions}

Diff preview:
${analysis.diff}`;
      }

      const result = await this.aiProvider.generate(prompt, analysis);
      return result.content;
    } catch (error) {
      console.error('❌ AI analysis failed:', error.message);
      return null;
    }
  }

  // Generate report
  async generateReport(analyses, options) {
    const timestamp = new Date().toISOString().split('T')[0];
    let report = `# Changelog Analysis Report - ${timestamp}\n\n`;

    if (options.mode === 'staged') {
      report += `## Staged Changes Analysis\n`;
      report += `Analysis Type: ${options.analysisType}\n\n`;
    } else if (options.mode === 'unstaged') {
      report += `## Unstaged Changes Analysis\n`;
      report += `Analysis Type: ${options.analysisType}\n\n`;
    } else {
      report += `## Analysis Mode: ${options.mode}\n`;
      report += `Analysis Type: ${options.analysisType}\n`;
      report += `Commits analyzed: ${analyses.filter(a => a).length}\n\n`;
    }

    analyses.forEach(analysis => {
      if (!analysis) return;

      if (analysis.type === 'staged') {
        report += `### 📋 Staged Changes\n\n`;
        report += `**Files:** ${analysis.files.length} files\n`;
        report += `**Stats:** +${analysis.stats.insertions} -${analysis.stats.deletions}\n\n`;
      } else if (analysis.type === 'unstaged') {
        report += `### 🔧 Unstaged Changes\n\n`;
        report += `**Files:** ${analysis.files.length} files\n`;
        report += `**Stats:** +${analysis.stats.insertions} -${analysis.stats.deletions}\n\n`;
      } else {
        report += `### ${analysis.hash} - ${analysis.subject}\n\n`;
        report += `**Author:** ${analysis.author}\n`;
        report += `**Date:** ${analysis.date}\n`;
        report += `**Type:** ${analysis.type}\n`;
        report += `**Files:** ${analysis.stats.files} files (+${analysis.stats.insertions} -${analysis.stats.deletions})\n`;
        if (analysis.breaking) report += `**⚠️ BREAKING CHANGE**\n`;
        report += `\n`;
      }

      if (analysis.aiSummary) {
        report += `**AI Analysis:**\n${analysis.aiSummary}\n\n`;
      }

      report += `---\n\n`;
    });

    // Write to file
    fs.writeFileSync(options.output, report);
    console.log(`✅ Report saved to ${options.output}`);
  }

  // Main execution
  async run() {
    const options = this.parseArgs();

    console.log(`🚀 Enhanced Changelog Generator (Mode: ${options.mode})`);
    if (this.hasAI) {
      console.log(`🤖 AI Provider: ${this.aiProvider.activeProvider.toUpperCase()}`);
    }
    console.log(`🎯 Analysis Type: ${options.analysisType}`);
    console.log('');

    let commits;

    if (options.interactive) {
      commits = await this.runInteractiveMode();
    } else {
      commits = await this.getCommitsForMode(options);
    }

    if (!commits.length) {
      console.log('❌ No commits found for analysis.');
      return;
    }

    console.log(`📋 Analyzing ${commits.length} commit(s)...\n`);

    // Analyze each commit
    const analyses = [];
    for (const commit of commits) {
      const analysis = await this.analyzeCommit(commit, options.analysisType);
      if (analysis) {
        analyses.push(analysis);

        // Show preview
        if (analysis.type === 'staged') {
          console.log(`✅ Staged changes: ${analysis.files.length} files`);
        } else if (analysis.type === 'unstaged') {
          console.log(`✅ Unstaged changes: ${analysis.files.length} files`);
        } else {
          console.log(`✅ ${analysis.hash}: ${analysis.subject}`);
        }

        if (analysis.aiSummary) {
          console.log(`   🤖 ${analysis.aiSummary.substring(0, 100)}...`);
        }
        console.log('');
      }
    }

    // Generate report
    await this.generateReport(analyses, options);
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new AdvancedChangelogGenerator();
  generator.run().catch(console.error);
}

module.exports = AdvancedChangelogGenerator;
