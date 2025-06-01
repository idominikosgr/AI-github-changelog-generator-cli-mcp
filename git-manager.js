#!/usr/bin/env node

/**
 * Enhanced Git Operations for Changelog Generation
 * Provides robust git integration with error handling and validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitManager {
  constructor() {
    this.validateGitRepository();
    this.gitConfig = this.loadGitConfig();
  }

  validateGitRepository() {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      this.isGitRepo = true;
    } catch (error) {
      this.isGitRepo = false;
      throw new Error('Not a git repository. Please run this tool in a git repository.');
    }
  }

  loadGitConfig() {
    try {
      const remoteUrl = this.execGit('git config --get remote.origin.url').trim();
      const userName = this.execGit('git config --get user.name').trim();
      const userEmail = this.execGit('git config --get user.email').trim();

      return {
        remoteUrl: this.parseRemoteUrl(remoteUrl),
        userName,
        userEmail,
        repository: this.extractRepositoryInfo(remoteUrl)
      };
    } catch (error) {
      console.warn('⚠️  Could not load git config:', error.message);
      return {};
    }
  }

  parseRemoteUrl(url) {
    if (!url) return null;

    // Handle different Git URL formats
    const patterns = [
      /https:\/\/github\.com\/(.+)\/(.+?)(?:\.git)?$/,
      /git@github\.com:(.+)\/(.+?)(?:\.git)?$/,
      /https:\/\/gitlab\.com\/(.+)\/(.+?)(?:\.git)?$/,
      /git@gitlab\.com:(.+)\/(.+?)(?:\.git)?$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          platform: url.includes('github.com') ? 'github' : 'gitlab',
          owner: match[1],
          repo: match[2],
          url: url
        };
      }
    }

    return { url };
  }

  extractRepositoryInfo(url) {
    const parsed = this.parseRemoteUrl(url);
    if (parsed && parsed.platform === 'github') {
      return `https://github.com/${parsed.owner}/${parsed.repo}`;
    }
    return null;
  }

  execGit(command, options = {}) {
    try {
      return execSync(command, {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024, // 1MB buffer
        ...options
      });
    } catch (error) {
      throw new Error(`Git command failed: ${command}\nError: ${error.message}`);
    }
  }

  getCommits(options = {}) {
    const {
      count = 20,
      since = null,
      until = null,
      author = null,
      grep = null,
      format = 'full',
      excludeMerges = true,
      branch = null
    } = options;

    let command = 'git log';

    // Add branch if specified
    if (branch) {
      command += ` ${branch}`;
    }

    // Add count limit
    if (count) {
      command += ` -${count}`;
    }

    // Add date range
    if (since) {
      command += ` --since="${since}"`;
    }
    if (until) {
      command += ` --until="${until}"`;
    }

    // Add author filter
    if (author) {
      command += ` --author="${author}"`;
    }

    // Add grep filter
    if (grep) {
      command += ` --grep="${grep}"`;
    }

    // Exclude merge commits
    if (excludeMerges) {
      command += ' --no-merges';
    }

    // Set format based on what we need
    if (format === 'simple') {
      command += ' --pretty=format:"%h|%s|%an|%ad" --date=short';
    } else if (format === 'full') {
      command += ' --pretty=format:"%H|%h|%s|%b|%an|%ae|%ad|%cd" --date=iso';
    } else if (format === 'oneline') {
      command += ' --oneline';
    }

    try {
      const output = this.execGit(command);
      return this.parseCommitOutput(output, format);
    } catch (error) {
      console.error('Error getting commits:', error.message);
      return [];
    }
  }

  parseCommitOutput(output, format) {
    if (!output.trim()) return [];

    const lines = output.trim().split('\n');

    if (format === 'oneline') {
      return lines.map(line => {
        const [hash, ...messageParts] = line.split(' ');
        return {
          hash: hash,
          shortHash: hash,
          message: messageParts.join(' ')
        };
      });
    }

    if (format === 'simple') {
      return lines.map(line => {
        const [shortHash, message, author, date] = line.split('|');
        return {
          shortHash,
          message,
          author,
          date,
          type: this.extractCommitType(message),
          scope: this.extractCommitScope(message)
        };
      });
    }

    if (format === 'full') {
      return lines.map(line => {
        const [fullHash, shortHash, subject, body, author, email, authorDate, commitDate] = line.split('|');
        return {
          hash: fullHash,
          shortHash,
          subject,
          body: body || '',
          message: subject + (body ? '\n\n' + body : ''),
          author,
          email,
          authorDate,
          commitDate,
          type: this.extractCommitType(subject),
          scope: this.extractCommitScope(subject),
          breaking: this.isBreakingChange(subject, body)
        };
      });
    }

    return [];
  }

  extractCommitType(message) {
    const conventionalCommitRegex = /^(\w+)(\(.+\))?!?:/;
    const match = message.match(conventionalCommitRegex);
    return match ? match[1] : 'other';
  }

  extractCommitScope(message) {
    const scopeRegex = /^\w+\((.+)\)!?:/;
    const match = message.match(scopeRegex);
    return match ? match[1] : null;
  }

  isBreakingChange(subject, body = '') {
    return subject.includes('!:') ||
           body.includes('BREAKING CHANGE:') ||
           body.includes('BREAKING-CHANGE:');
  }

  getStagedChanges() {
    try {
      const output = this.execGit('git diff --cached --name-status');
      return this.parseDiffOutput(output);
    } catch (error) {
      console.error('Error getting staged changes:', error.message);
      return [];
    }
  }

  getUnstagedChanges() {
    try {
      const output = this.execGit('git diff --name-status');
      return this.parseDiffOutput(output);
    } catch (error) {
      console.error('Error getting unstaged changes:', error.message);
      return [];
    }
  }

  parseDiffOutput(output) {
    if (!output.trim()) return [];

    return output.trim().split('\n').map(line => {
      const [status, ...pathParts] = line.split('\t');
      const path = pathParts.join('\t');
      return {
        status: this.mapDiffStatus(status),
        path,
        type: this.getFileType(path)
      };
    });
  }

  mapDiffStatus(status) {
    const statusMap = {
      'A': 'added',
      'M': 'modified',
      'D': 'deleted',
      'R': 'renamed',
      'C': 'copied',
      'U': 'unmerged'
    };
    return statusMap[status[0]] || status;
  }

  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const typeMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.md': 'documentation',
      '.json': 'config',
      '.yml': 'config',
      '.yaml': 'config'
    };
    return typeMap[ext] || 'other';
  }

  getBranchInfo() {
    try {
      const currentBranch = this.execGit('git branch --show-current').trim();
      const remoteBranch = this.execGit(`git config --get branch.${currentBranch}.remote`).trim();
      const upstreamBranch = this.execGit(`git config --get branch.${currentBranch}.merge`).trim().replace('refs/heads/', '');

      return {
        current: currentBranch,
        remote: remoteBranch,
        upstream: upstreamBranch,
        tracking: remoteBranch && upstreamBranch ? `${remoteBranch}/${upstreamBranch}` : null
      };
    } catch (error) {
      console.warn('Could not get branch info:', error.message);
      return { current: 'unknown' };
    }
  }

  getRepositoryStats() {
    try {
      const totalCommits = parseInt(this.execGit('git rev-list --count HEAD').trim());
      const contributors = this.execGit('git shortlog -sn --all').trim().split('\n').length;
      const firstCommitDate = this.execGit('git log --reverse --pretty=format:"%ad" --date=short | head -1').trim();
      const lastCommitDate = this.execGit('git log -1 --pretty=format:"%ad" --date=short').trim();

      return {
        totalCommits,
        contributors,
        firstCommit: firstCommitDate,
        lastCommit: lastCommitDate,
        age: this.calculateRepoAge(firstCommitDate)
      };
    } catch (error) {
      console.warn('Could not get repository stats:', error.message);
      return {};
    }
  }

  calculateRepoAge(firstCommitDate) {
    if (!firstCommitDate) return null;

    const first = new Date(firstCommitDate);
    const now = new Date();
    const diffTime = Math.abs(now - first);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  }

  validateCommitHash(hash) {
    try {
      this.execGit(`git cat-file -e ${hash}`);
      return true;
    } catch {
      return false;
    }
  }

  getCommitDiff(hash) {
    try {
      return this.execGit(`git show ${hash} --name-status --pretty=format:""`).trim();
    } catch (error) {
      console.error(`Error getting diff for commit ${hash}:`, error.message);
      return '';
    }
  }
}

module.exports = GitManager;

// CLI usage for testing
if (require.main === module) {
  const git = new GitManager();
  const command = process.argv[2];

  if (command === 'info') {
    console.log('Git Repository Info:');
    console.log('Config:', git.gitConfig);
    console.log('Branch:', git.getBranchInfo());
    console.log('Stats:', git.getRepositoryStats());
  } else if (command === 'commits') {
    const count = parseInt(process.argv[3]) || 5;
    console.log(`Last ${count} commits:`);
    const commits = git.getCommits({ count, format: 'simple' });
    commits.forEach(commit => {
      console.log(`${commit.shortHash} - ${commit.message} (${commit.author})`);
    });
  } else if (command === 'staged') {
    console.log('Staged changes:');
    const changes = git.getStagedChanges();
    changes.forEach(change => {
      console.log(`${change.status}: ${change.path}`);
    });
  } else {
    console.log('Usage:');
    console.log('  node git-manager.js info      # Show repository info');
    console.log('  node git-manager.js commits 10 # Show last 10 commits');
    console.log('  node git-manager.js staged    # Show staged changes');
  }
}
