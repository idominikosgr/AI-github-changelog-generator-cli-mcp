#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Enhanced AI Provider (supports OpenAI and Azure OpenAI)
const AIProvider = require('./ai-provider');

// Configuration
const CHANGELOG_FILE = 'AI_CHANGELOG.md';
const COMMIT_TYPES = {
  feat: '🚀 Features',
  fix: '🐛 Bug Fixes',
  docs: '📚 Documentation',
  style: '💎 Styling',
  refactor: '♻️ Code Refactoring',
  perf: '⚡ Performance Improvements',
  test: '🧪 Tests',
  chore: '🔧 Maintenance',
  ci: '👷 CI/CD',
  build: '📦 Build System',
  db: '🗄️ Database',
  api: '🔌 API Changes',
  ui: '🎨 UI/UX',
  auth: '🔐 Authentication',
  config: '⚙️ Configuration'
};

class EnhancedAIChangelogGenerator {
  constructor() {
    this.gitExists = this.checkGitRepository();
    this.aiProvider = new AIProvider();
    this.hasAI = this.aiProvider.isAvailable;

    if (!this.hasAI) {
      console.log('⚠️  No AI provider configured. Using enhanced rule-based analysis...');
      console.log('💡 Configure AZURE_OPENAI_* or OPENAI_API_KEY in .env.local for AI-powered analysis');
    }
  }

  checkGitRepository() {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      return true;
    } catch {
      console.error('❌ Not a git repository');
      return false;
    }
  }

  // Enhanced commit analysis with comprehensive diff understanding
  async getEnhancedCommitAnalysis(commitHash) {
    try {
      // Get comprehensive commit information
      const commitInfo = execSync(`git show --pretty=format:"%H|%s|%an|%ad|%B" --no-patch ${commitHash}`, { encoding: 'utf8' });
      const lines = commitInfo.split('\n');
      const [hash, subject, author, date] = lines[0].split('|');
      const body = lines.slice(1).join('\n').trim();

      // Get files with detailed analysis
      const filesCommand = `git show --name-status --pretty=format: ${commitHash}`;
      const filesOutput = execSync(filesCommand, { encoding: 'utf8' });

      const files = await Promise.all(
        filesOutput.split('\n')
          .filter(Boolean)
          .map(async (line) => {
            const [status, filePath] = line.split('\t');
            return await this.analyzeFileChange(commitHash, status, filePath);
          })
      );

      // Get overall diff statistics
      const diffStats = this.getCommitDiffStats(commitHash);

      return {
        hash: hash.substring(0, 7),
        subject,
        author,
        date,
        body,
        files,
        diffStats,
        type: this.extractCommitType(subject),
        scope: this.extractCommitScope(subject),
        breaking: this.isBreakingChange(subject, body),
        semanticAnalysis: this.performSemanticAnalysis(files, subject, body)
      };
    } catch (error) {
      console.error(`Error analyzing commit ${commitHash}:`, error.message);
      return null;
    }
  }

  // Deep file change analysis
  async analyzeFileChange(commitHash, status, filePath) {
    try {
      // Get file diff with context
      const diffCommand = `git show ${commitHash} --pretty=format: -U5 -- "${filePath}"`;
      let diff = '';

      try {
        diff = execSync(diffCommand, { encoding: 'utf8' });
      } catch (e) {
        diff = 'Binary file or diff unavailable';
      }

      // Get file content context
      let beforeContent = '';
      let afterContent = '';

      if (status !== 'A' && diff !== 'Binary file or diff unavailable') {
        try {
          beforeContent = execSync(`git show ${commitHash}~1:"${filePath}"`, { encoding: 'utf8' }).slice(0, 1000);
        } catch (e) {
          beforeContent = '';
        }
      }

      if (status !== 'D' && diff !== 'Binary file or diff unavailable') {
        try {
          afterContent = execSync(`git show ${commitHash}:"${filePath}"`, { encoding: 'utf8' }).slice(0, 1000);
        } catch (e) {
          afterContent = '';
        }
      }

      return {
        status,
        filePath,
        diff,
        beforeContent,
        afterContent,
        category: this.categorizeFile(filePath),
        language: this.detectLanguage(filePath),
        importance: this.assessFileImportance(filePath, status),
        complexity: this.assessChangeComplexity(diff),
        semanticChanges: this.analyzeSemanticChanges(diff, filePath),
        functionalImpact: this.analyzeFunctionalImpact(diff, filePath, status),
        businessRelevance: this.assessBusinessRelevance(filePath, diff)
      };
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error.message);
      return null;
    }
  }

  // Enhanced semantic analysis
  analyzeSemanticChanges(diff, filePath) {
    const analysis = {
      changeType: 'modification',
      patterns: new Set(),
      frameworks: new Set(),
      keywords: new Set(),
      codeElements: new Set(),
      apiChanges: [],
      dataChanges: []
    };

    if (!diff || diff === 'Binary file or diff unavailable') {
      return analysis;
    }

    const addedLines = diff.split('\n').filter(line => line.startsWith('+') && !line.startsWith('+++'));
    const removedLines = diff.split('\n').filter(line => line.startsWith('-') && !line.startsWith('---'));

    // Framework detection
    if (filePath.includes('supabase/')) {
      analysis.frameworks.add('Supabase');
      if (diff.includes('CREATE TABLE') || diff.includes('ALTER TABLE')) {
        analysis.changeType = 'schema_change';
        analysis.patterns.add('database_schema');
      }
      if (diff.includes('CREATE POLICY') || diff.includes('ALTER POLICY')) {
        analysis.patterns.add('security_policy');
      }
      if (diff.includes('CREATE FUNCTION') || diff.includes('CREATE TRIGGER')) {
        analysis.patterns.add('database_function');
      }
    }

    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
      analysis.frameworks.add('React');

      // React patterns
      if (diff.includes('useState') || diff.includes('useEffect')) {
        analysis.patterns.add('react_hooks');
      }
      if (diff.includes('useCallback') || diff.includes('useMemo')) {
        analysis.patterns.add('performance_optimization');
      }
      if (diff.includes('forwardRef') || diff.includes('memo(')) {
        analysis.patterns.add('component_optimization');
      }
    }

    if (filePath.includes('/api/') || filePath.includes('route.ts')) {
      analysis.frameworks.add('Next.js API');
      analysis.changeType = 'api_change';

      // API method detection
      ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
        if (diff.includes(`export async function ${method}`) || diff.includes(`export function ${method}`)) {
          analysis.apiChanges.push(`${method} endpoint`);
          analysis.patterns.add('api_endpoint');
        }
      });
    }

    // Code element detection
    const codePatterns = {
      'function_definition': /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,
      'component_definition': /(?:export\s+)?(?:const|function)\s+(\w+Component|\w+Page|\w+Layout)/g,
      'hook_definition': /(?:export\s+)?(?:const|function)\s+(use\w+)/g,
      'type_definition': /(?:export\s+)?(?:type|interface)\s+(\w+)/g,
      'constant_definition': /(?:export\s+)?const\s+(\w+)/g
    };

    Object.entries(codePatterns).forEach(([pattern, regex]) => {
      const matches = [...diff.matchAll(regex)];
      if (matches.length > 0) {
        analysis.patterns.add(pattern);
        matches.forEach(match => analysis.codeElements.add(match[1]));
      }
    });

    // Advanced pattern detection
    const advancedPatterns = {
      'error_handling': [/try\s*{/, /catch\s*\(/, /throw\s+/, /Error\(/],
      'async_operations': [/async\s+/, /await\s+/, /Promise\./, /\.then\(/],
      'data_validation': [/zod/, /yup/, /joi/, /validate/, /schema/i],
      'authentication': [/auth/, /login/, /logout/, /token/, /jwt/, /session/i],
      'authorization': [/permission/, /role/, /access/, /policy/, /guard/i],
      'caching': [/cache/, /redis/, /memo/, /useMemo/, /useCallback/i],
      'testing': [/test/, /spec/, /mock/, /jest/, /vitest/, /describe/, /it\(/],
      'styling': [/className/, /css/, /styled/, /tailwind/, /tw-/],
      'state_management': [/useState/, /useReducer/, /zustand/, /redux/, /store/i],
      'routing': [/router/, /navigate/, /redirect/, /useRouter/, /Link/],
      'data_fetching': [/fetch/, /axios/, /useQuery/, /useMutation/, /swr/i]
    };

    Object.entries(advancedPatterns).forEach(([pattern, regexes]) => {
      if (regexes.some(regex => regex.test(diff))) {
        analysis.patterns.add(pattern);
      }
    });

    // Extract meaningful keywords
    const contentText = addedLines.concat(removedLines).join(' ')
      .replace(/[{}();,.\[\]'"]/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();

    const words = contentText.split(' ')
      .filter(word => word.length > 3 && !['const', 'function', 'export', 'import', 'return'].includes(word))
      .slice(0, 20);

    words.forEach(word => analysis.keywords.add(word));

    // Convert Sets to Arrays for JSON serialization
    analysis.patterns = Array.from(analysis.patterns);
    analysis.frameworks = Array.from(analysis.frameworks);
    analysis.keywords = Array.from(analysis.keywords);
    analysis.codeElements = Array.from(analysis.codeElements);

    return analysis;
  }

  // Enhanced functional impact analysis
  analyzeFunctionalImpact(diff, filePath, status) {
    const impact = {
      scope: this.determineChangeScope(filePath),
      breaking: false,
      userFacing: false,
      apiChanges: false,
      dataChanges: false,
      securityRelated: false,
      performanceImpact: false,
      migrationRequired: false,
      deploymentImpact: 'low'
    };

    if (!diff || diff === 'Binary file or diff unavailable') {
      return impact;
    }

    // Breaking change detection
    const breakingPatterns = [
      /BREAKING\s*CHANGE/i,
      /export\s+(?:interface|type)\s+\w+.*{/,  // Type changes
      /export\s+(?:const|function)\s+\w+/,     // Function signature changes
      /DROP\s+TABLE/i,                         // Database breaking changes
      /ALTER\s+TABLE.*DROP/i,
      /removeField/i,
      /deleteColumn/i
    ];

    impact.breaking = breakingPatterns.some(pattern => pattern.test(diff));

    // User-facing detection
    const userFacingPaths = [
      '/app/', '/pages/', '/components/', 'layout.', 'page.',
      '/public/', '.css', '.scss', 'globals.'
    ];
    impact.userFacing = userFacingPaths.some(path => filePath.includes(path));

    // API changes detection
    impact.apiChanges = filePath.includes('/api/') ||
                       filePath.includes('route.ts') ||
                       diff.includes('export async function') ||
                       diff.includes('NextRequest') ||
                       diff.includes('NextResponse');

    // Database changes detection
    impact.dataChanges = filePath.includes('supabase/') ||
                        filePath.includes('migration') ||
                        diff.includes('CREATE TABLE') ||
                        diff.includes('ALTER TABLE') ||
                        diff.includes('INSERT INTO') ||
                        diff.includes('UPDATE') ||
                        diff.includes('DELETE FROM');

    // Security-related detection
    const securityPatterns = [
      /auth/i, /security/i, /password/i, /token/i, /jwt/i,
      /encrypt/i, /decrypt/i, /hash/i, /validate/i, /sanitize/i,
      /policy/i, /permission/i, /role/i, /access/i, /cors/i
    ];
    impact.securityRelated = securityPatterns.some(pattern => pattern.test(diff));

    // Performance impact detection
    const performancePatterns = [
      /lazy/i, /memo/i, /callback/i, /optimize/i, /cache/i,
      /index/i, /query/i, /batch/i, /concurrent/i, /async/i
    ];
    impact.performanceImpact = performancePatterns.some(pattern => pattern.test(diff));

    // Migration requirement detection
    impact.migrationRequired = impact.breaking ||
                              impact.dataChanges ||
                              filePath.includes('package.json') ||
                              filePath.includes('.env') ||
                              diff.includes('MIGRATION') ||
                              diff.includes('UPGRADE');

    // Deployment impact assessment
    if (impact.breaking || impact.dataChanges) {
      impact.deploymentImpact = 'high';
    } else if (impact.apiChanges || impact.securityRelated || filePath.includes('config')) {
      impact.deploymentImpact = 'medium';
    }

    return impact;
  }

  // Business relevance assessment
  assessBusinessRelevance(filePath, diff) {
    const relevance = {
      priority: 'low',
      userImpact: 'minimal',
      businessValue: 'technical',
      customerFacing: false,
      revenueImpact: false
    };

    // High priority paths
    const highPriorityPaths = [
      '/app/dashboard', '/app/billing', '/app/auth', '/app/onboarding',
      '/checkout', '/payment', '/subscription', '/profile'
    ];

    const mediumPriorityPaths = [
      '/app/', '/components/ui', '/components/forms', '/api/auth', '/api/users'
    ];

    if (highPriorityPaths.some(path => filePath.includes(path))) {
      relevance.priority = 'high';
      relevance.customerFacing = true;
      relevance.businessValue = 'direct';
    } else if (mediumPriorityPaths.some(path => filePath.includes(path))) {
      relevance.priority = 'medium';
      relevance.customerFacing = true;
      relevance.businessValue = 'indirect';
    }

    // Revenue impact detection
    const revenueKeywords = [
      /payment/i, /billing/i, /subscription/i, /checkout/i, /stripe/i,
      /revenue/i, /pricing/i, /plan/i, /upgrade/i, /downgrade/i
    ];

    relevance.revenueImpact = revenueKeywords.some(pattern => pattern.test(diff));

    // User impact assessment
    if (relevance.customerFacing) {
      if (diff.includes('fix') || diff.includes('bug') || diff.includes('error')) {
        relevance.userImpact = 'positive';
      } else if (diff.includes('feature') || diff.includes('add') || diff.includes('new')) {
        relevance.userImpact = 'enhancement';
      } else if (diff.includes('remove') || diff.includes('deprecat')) {
        relevance.userImpact = 'reduction';
      }
    }

    return relevance;
  }

  // Enhanced AI integration with better prompts
  async generateAISummary(commitAnalysis) {
    if (!this.hasAI) {
      return this.generateEnhancedRuleBasedSummary(commitAnalysis);
    }

    try {
      const prompt = this.buildEnhancedPrompt(commitAnalysis);

      const messages = [
        {
          role: "system",
          content: `You are an expert technical writer and software engineer specializing in changelog generation for modern web applications. You understand Next.js, React, TypeScript, Supabase, and modern development practices.

Your task is to analyze git commits and generate clear, informative changelog entries that balance technical accuracy with user-friendly language.

IMPORTANT: Always respond with valid JSON in the exact format requested. Focus on user impact and business value while maintaining technical precision.`
        },
        {
          role: "user",
          content: prompt
        }
      ];

      const response = await this.aiProvider.generateCompletion(messages, {
        temperature: 0.3,
        max_tokens: 1000
      });

      if (!response.content) {
        throw new Error('Empty response from AI provider');
      }

      return this.parseAIResponse(response.content, commitAnalysis);
    } catch (error) {
      console.error('AI API error:', error.message);
      return this.generateEnhancedRuleBasedSummary(commitAnalysis);
    }
  }

  buildEnhancedPrompt(commitAnalysis) {
    const { subject, files, semanticAnalysis, diffStats } = commitAnalysis;

    // Build comprehensive context
    const filesContext = files.map(file => ({
      path: file.filePath,
      status: file.status,
      category: file.category,
      language: file.language,
      complexity: file.complexity,
      semanticChanges: file.semanticChanges,
      functionalImpact: file.functionalImpact,
      businessRelevance: file.businessRelevance,
      keyChanges: this.extractKeyDiffLines(file.diff)
    })).slice(0, 10); // Limit for token efficiency

    return `Analyze this git commit for a Next.js/Supabase web application and generate a comprehensive changelog entry.

**COMMIT CONTEXT:**
- Subject: ${subject}
- Type: ${commitAnalysis.type}
- Breaking: ${commitAnalysis.breaking}
- Files changed: ${files.length}
- Lines changed: +${diffStats.insertions} -${diffStats.deletions}

**SEMANTIC ANALYSIS:**
- Frameworks: ${semanticAnalysis.frameworks.join(', ')}
- Patterns: ${semanticAnalysis.patterns.join(', ')}
- Code elements: ${semanticAnalysis.codeElements.slice(0, 5).join(', ')}

**FILES ANALYSIS:**
${JSON.stringify(filesContext, null, 2)}

**APPLICATION CONTEXT:**
This is a modern "Living as a Service" platform built with:
- Next.js 15 with App Router
- React 19 with TypeScript
- Supabase for backend/database
- Tailwind CSS for styling
- Radix UI components
- Authentication and billing systems

**ANALYSIS REQUIREMENTS:**
1. What is the primary purpose and impact of this commit?
2. How does this affect end users vs developers?
3. What specific functionality was added/changed/fixed?
4. Are there any breaking changes or migration requirements?
5. What is the business/product impact?
6. How does this align with modern web development best practices?

**RESPONSE FORMAT:**
Respond with this exact JSON structure:
{
  "summary": "Clear, user-friendly description (1-2 sentences)",
  "technicalSummary": "Detailed technical description for developers",
  "category": "feature|fix|improvement|refactor|docs|chore|breaking|security",
  "impact": "critical|high|medium|low",
  "scope": "major|minor|patch",
  "userFacing": true|false,
  "breaking": true|false,
  "businessImpact": "How this affects users, business goals, or product value",
  "technicalImpact": "How this affects codebase, architecture, or development",
  "highlights": ["key point 1", "key point 2", "key point 3"],
  "migrationNotes": "Steps needed for upgrade/deployment" or null,
  "tags": ["tag1", "tag2", "tag3"],
  "relatedAreas": ["area1", "area2"]
}`;
  }

  parseAIResponse(content, originalCommit) {
    try {
      // Clean the response
      let jsonStr = content.trim();

      // Remove markdown code blocks
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(jsonStr);

      // Validate and enhance the response
      return {
        summary: parsed.summary || originalCommit.subject,
        technicalSummary: parsed.technicalSummary || '',
        category: parsed.category || originalCommit.type || 'other',
        impact: parsed.impact || 'low',
        scope: parsed.scope || 'patch',
        userFacing: Boolean(parsed.userFacing),
        breaking: Boolean(parsed.breaking),
        businessImpact: parsed.businessImpact || '',
        technicalImpact: parsed.technicalImpact || '',
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
        migrationNotes: parsed.migrationNotes || null,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        relatedAreas: Array.isArray(parsed.relatedAreas) ? parsed.relatedAreas : []
      };
    } catch (error) {
      console.error('Error parsing AI response:', error.message);
      return this.generateEnhancedRuleBasedSummary(originalCommit);
    }
  }

  // Enhanced rule-based analysis as fallback
  generateEnhancedRuleBasedSummary(commitAnalysis) {
    const { subject, files, semanticAnalysis, diffStats } = commitAnalysis;

    // Determine category and impact
    let category = commitAnalysis.type || 'other';
    let impact = 'low';
    let userFacing = false;

    // Analyze file changes for better categorization
    const hasUIChanges = files.some(f => f.category === 'Components' || f.category === 'Pages/Routes');
    const hasDBChanges = files.some(f => f.category === 'Database');
    const hasAPIChanges = files.some(f => f.functionalImpact.apiChanges);
    const hasSecurityChanges = files.some(f => f.functionalImpact.securityRelated);

    if (hasSecurityChanges) {
      impact = 'high';
      category = 'security';
    } else if (commitAnalysis.breaking) {
      impact = 'critical';
      category = 'breaking';
    } else if (hasDBChanges || hasAPIChanges) {
      impact = 'medium';
    } else if (hasUIChanges) {
      impact = 'medium';
      userFacing = true;
    }

    // Generate intelligent summary
    let summary = subject;
    const insights = [];

    if (semanticAnalysis.patterns.includes('new_feature')) {
      insights.push('introduces new functionality');
    }
    if (semanticAnalysis.patterns.includes('bug_fix')) {
      insights.push('resolves issues');
    }
    if (semanticAnalysis.patterns.includes('performance_optimization')) {
      insights.push('improves performance');
    }
    if (semanticAnalysis.patterns.includes('security_policy')) {
      insights.push('enhances security');
    }

    // Framework-specific insights
    if (semanticAnalysis.frameworks.includes('React')) {
      insights.push('updates React components');
    }
    if (semanticAnalysis.frameworks.includes('Supabase')) {
      insights.push('modifies database layer');
    }

    const highlights = [];
    if (diffStats.insertions > 100) highlights.push('Significant code additions');
    if (files.length > 10) highlights.push('Wide-ranging changes');
    if (hasUIChanges) highlights.push('User interface updates');
    if (hasDBChanges) highlights.push('Database modifications');

    return {
      summary: insights.length > 0 ? `${subject} (${insights.slice(0, 2).join(', ')})` : subject,
      technicalSummary: `Modified ${files.length} files with +${diffStats.insertions}/-${diffStats.deletions} lines`,
      category,
      impact,
      scope: impact === 'critical' ? 'major' : impact === 'high' ? 'minor' : 'patch',
      userFacing,
      breaking: commitAnalysis.breaking,
      businessImpact: userFacing ? 'Affects user experience' : 'Internal improvements',
      technicalImpact: `Changes in ${[...new Set(files.map(f => f.category))].join(', ')}`,
      highlights: highlights.slice(0, 3),
      migrationNotes: commitAnalysis.breaking ? 'Review breaking changes before deployment' : null,
      tags: semanticAnalysis.frameworks.concat(semanticAnalysis.patterns.slice(0, 3)),
      relatedAreas: [...new Set(files.map(f => f.category))].slice(0, 3)
    };
  }

  // Main changelog generation method
  async generateChangelog(version = null, since = null) {
    if (!this.gitExists) return;

    console.log('🔍 Starting enhanced AI-powered changelog generation...');

    const commitHashes = await this.getCommitsSince(since);
    if (commitHashes.length === 0) {
      console.log('No commits found.');
      return;
    }

    console.log(`📝 Analyzing ${commitHashes.length} commits with enhanced AI analysis...`);

    // Analyze each commit comprehensively
    const analyzedCommits = [];
    for (let i = 0; i < commitHashes.length; i++) {
      const commitHash = commitHashes[i];
      console.log(`🔍 Processing commit ${i + 1}/${commitHashes.length}: ${commitHash.substring(0, 7)}`);

      const commitAnalysis = await this.getEnhancedCommitAnalysis(commitHash);
      if (commitAnalysis) {
        const aiSummary = await this.generateAISummary(commitAnalysis);

        analyzedCommits.push({
          ...commitAnalysis,
          aiSummary
        });

        // Rate limiting for API calls
        if (this.hasOpenAI) {
          await this.sleep(200);
        }
      }
    }

    // Generate release insights
    const releaseInsights = await this.generateReleaseInsights(analyzedCommits, version);

    // Build comprehensive changelog
    const changelog = this.buildEnhancedChangelog(analyzedCommits, releaseInsights, version);

    // Write to file
    fs.writeFileSync(CHANGELOG_FILE, changelog);

    console.log(`✅ Enhanced AI changelog generated: ${CHANGELOG_FILE}`);
    console.log(`🤖 Processed ${analyzedCommits.length} commits with ${this.hasOpenAI ? 'OpenAI' : 'enhanced rule-based'} analysis`);

    return changelog;
  }

  // Additional utility methods (keeping existing ones plus new ones)
  async getCommitsSince(since) {
    try {
      const sinceArg = since ? `${since}..HEAD` : '';
      const command = `git log ${sinceArg} --pretty=format:"%H" --reverse`;
      const output = execSync(command, { encoding: 'utf8' });

      return output.split('\n').filter(Boolean);
    } catch (error) {
      console.error('Error getting commits:', error.message);
      return [];
    }
  }

  getCommitDiffStats(commitHash) {
    try {
      const command = `git show --stat --pretty=format: ${commitHash}`;
      const output = execSync(command, { encoding: 'utf8' });

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
    } catch {
      return { files: 0, insertions: 0, deletions: 0 };
    }
  }

  extractKeyDiffLines(diff) {
    if (!diff || diff === 'Binary file or diff unavailable') {
      return [];
    }

    return diff.split('\n')
      .filter(line =>
        (line.startsWith('+') || line.startsWith('-')) &&
        !line.startsWith('+++') &&
        !line.startsWith('---') &&
        line.trim().length > 10
      )
      .slice(0, 5)
      .map(line => line.substring(1).trim());
  }

  determineChangeScope(filePath) {
    if (filePath.includes('/lib/') || filePath.includes('/utils/') || filePath.includes('shared/')) {
      return 'wide';
    } else if (filePath.includes('/components/') || filePath.includes('/hooks/')) {
      return 'moderate';
    }
    return 'local';
  }

  assessChangeComplexity(diff) {
    if (!diff || diff === 'Binary file or diff unavailable') {
      return { score: 0, level: 'unknown' };
    }

    const lines = diff.split('\n');
    const changedLines = lines.filter(line => line.startsWith('+') || line.startsWith('-')).length;

    let complexity = 0;

    // Basic line count
    if (changedLines > 200) complexity += 4;
    else if (changedLines > 100) complexity += 3;
    else if (changedLines > 50) complexity += 2;
    else if (changedLines > 10) complexity += 1;

    // Complexity patterns
    const complexPatterns = [
      /class\s+\w+/g, /interface\s+\w+/g, /function\s+\w+/g,
      /async\s+/g, /await\s+/g, /Promise/g, /try\s*{/g,
      /if\s*\(/g, /for\s*\(/g, /while\s*\(/g, /switch\s*\(/g
    ];

    const patternMatches = complexPatterns.reduce((total, pattern) => {
      return total + (diff.match(pattern) || []).length;
    }, 0);

    complexity += Math.min(patternMatches, 6);

    const level = complexity >= 8 ? 'very_high' :
                  complexity >= 6 ? 'high' :
                  complexity >= 4 ? 'medium' :
                  complexity >= 2 ? 'low' : 'minimal';

    return { score: complexity, level };
  }

  performSemanticAnalysis(files, subject, body) {
    const analysis = {
      frameworks: new Set(),
      patterns: new Set(),
      codeElements: new Set(),
      overallComplexity: 0,
      changeDistribution: {}
    };

    files.forEach(file => {
      if (file && file.semanticChanges) {
        file.semanticChanges.frameworks.forEach(fw => analysis.frameworks.add(fw));
        file.semanticChanges.patterns.forEach(pattern => analysis.patterns.add(pattern));
        file.semanticChanges.codeElements.forEach(element => analysis.codeElements.add(element));
        analysis.overallComplexity += file.complexity.score;

        const category = file.category;
        analysis.changeDistribution[category] = (analysis.changeDistribution[category] || 0) + 1;
      }
    });

    // Convert Sets to Arrays
    analysis.frameworks = Array.from(analysis.frameworks);
    analysis.patterns = Array.from(analysis.patterns);
    analysis.codeElements = Array.from(analysis.codeElements);

    return analysis;
  }

  // ... (include all the other utility methods from the original script)
  categorizeFile(filePath) {
    if (filePath.startsWith('src/components/')) return 'Components';
    if (filePath.startsWith('src/app/')) return 'Pages/Routes';
    if (filePath.startsWith('src/lib/')) return 'Libraries';
    if (filePath.startsWith('src/hooks/')) return 'Hooks';
    if (filePath.startsWith('src/types/')) return 'Types';
    if (filePath.startsWith('supabase/')) return 'Database';
    if (filePath.includes('.test.') || filePath.includes('__tests__')) return 'Tests';
    if (filePath.includes('package.json') || filePath.includes('pnpm-lock.yaml')) return 'Dependencies';
    if (filePath.includes('.md')) return 'Documentation';
    if (filePath.includes('config') || filePath.includes('.config.')) return 'Configuration';
    if (filePath.startsWith('scripts/')) return 'Scripts';
    if (filePath.startsWith('public/')) return 'Assets';
    return 'Other';
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const langMap = {
      '.ts': 'typescript',
      '.tsx': 'typescript-react',
      '.js': 'javascript',
      '.jsx': 'javascript-react',
      '.sql': 'sql',
      '.md': 'markdown',
      '.json': 'json',
      '.css': 'css'
    };
    return langMap[ext] || 'unknown';
  }

  assessFileImportance(filePath, status) {
    let score = 1;

    if (filePath.startsWith('src/app/') || filePath.startsWith('src/components/')) score += 2;
    if (filePath.includes('package.json')) score += 3;
    if (filePath.startsWith('supabase/migrations/')) score += 3;
    if (filePath.includes('.config.') || filePath.includes('middleware.')) score += 2;
    if (filePath.includes('/api/')) score += 2;

    if (status === 'A') score += 1;
    if (status === 'D') score += 2;

    return score;
  }

  extractCommitType(subject) {
    const match = subject.match(/^(\w+)(\(.+\))?:/);
    return match ? match[1] : 'other';
  }

  extractCommitScope(subject) {
    const match = subject.match(/^\w+\((.+)\):/);
    return match ? match[1] : null;
  }

  isBreakingChange(subject, body) {
    return subject.includes('!') ||
           subject.includes('BREAKING') ||
           (body && body.includes('BREAKING CHANGE'));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Continue with additional methods for generating comprehensive changelog...
  async generateReleaseInsights(commits, version) {
    // Implementation similar to the Copilot version but adapted for OpenAI
    const stats = {
      totalCommits: commits.length,
      categories: {},
      impacts: {},
      userFacingChanges: 0,
      breakingChanges: 0,
      securityChanges: 0
    };

    commits.forEach(commit => {
      const category = commit.aiSummary.category;
      stats.categories[category] = (stats.categories[category] || 0) + 1;

      const impact = commit.aiSummary.impact;
      stats.impacts[impact] = (stats.impacts[impact] || 0) + 1;

      if (commit.aiSummary.userFacing) stats.userFacingChanges++;
      if (commit.aiSummary.breaking) stats.breakingChanges++;
      if (commit.aiSummary.category === 'security') stats.securityChanges++;
    });

    return {
      stats,
      releaseType: stats.breakingChanges > 0 ? 'major' :
                   stats.impacts.high > 0 || stats.categories.feature > 3 ? 'minor' : 'patch',
      headline: this.generateReleaseHeadline(stats, commits),
      keyHighlights: this.generateKeyHighlights(commits),
      riskLevel: stats.breakingChanges > 0 ? 'high' :
                stats.impacts.critical > 0 ? 'medium' : 'low'
    };
  }

  generateReleaseHeadline(stats, commits) {
    if (stats.securityChanges > 0) {
      return 'Security-focused release with enhanced protection measures';
    } else if (stats.breakingChanges > 0) {
      return `Major release with ${stats.breakingChanges} breaking changes`;
    } else if (stats.categories.feature > 3) {
      return `Feature-rich release with ${stats.categories.feature} new capabilities`;
    } else if (stats.categories.fix > stats.categories.feature) {
      return `Stability release focusing on ${stats.categories.fix} bug fixes`;
    }
    return `Incremental release with ${stats.totalCommits} improvements`;
  }

  generateKeyHighlights(commits) {
    const highlights = [];

    const highImpactCommits = commits.filter(c => c.aiSummary.impact === 'critical' || c.aiSummary.impact === 'high');
    const userFacingCommits = commits.filter(c => c.aiSummary.userFacing);
    const securityCommits = commits.filter(c => c.aiSummary.category === 'security');

    if (securityCommits.length > 0) {
      highlights.push(`Enhanced security with ${securityCommits.length} security improvements`);
    }

    if (highImpactCommits.length > 0) {
      highlights.push(`${highImpactCommits.length} high-impact changes affecting core functionality`);
    }

    if (userFacingCommits.length > 0) {
      highlights.push(`${userFacingCommits.length} user experience improvements`);
    }

    // Add specific feature highlights
    const featureCommits = commits.filter(c => c.aiSummary.category === 'feature');
    if (featureCommits.length > 0) {
      const topFeature = featureCommits.find(c => c.aiSummary.impact === 'high');
      if (topFeature) {
        highlights.push(topFeature.aiSummary.summary);
      }
    }

    return highlights.slice(0, 4);
  }

  buildEnhancedChangelog(commits, insights, version) {
    const date = new Date().toISOString().split('T')[0];
    const versionString = version || `v1.0.0-${date}`;

    let content = `# ${versionString} (${date})\n\n`;

    // Release overview
    content += `## 🚀 Release Overview\n\n`;
    content += `**${insights.headline}**\n\n`;

    if (insights.keyHighlights.length > 0) {
      content += `### ✨ Key Highlights\n\n`;
      insights.keyHighlights.forEach(highlight => {
        content += `- ${highlight}\n`;
      });
      content += '\n';
    }

    // Risk assessment
    if (insights.riskLevel === 'high') {
      content += `> ⚠️ **High Risk Release**: Contains breaking changes. Review migration notes carefully.\n\n`;
    } else if (insights.riskLevel === 'medium') {
      content += `> 🔔 **Medium Risk Release**: Contains significant changes. Test thoroughly.\n\n`;
    }

    // Breaking changes section
    const breakingCommits = commits.filter(c => c.aiSummary.breaking);
    if (breakingCommits.length > 0) {
      content += `## 💥 BREAKING CHANGES\n\n`;
      breakingCommits.forEach(commit => {
        content += `- **${commit.aiSummary.summary}** ([${commit.hash}](../../commit/${commit.hash}))\n`;
        if (commit.aiSummary.migrationNotes) {
          content += `  \`\`\`\n  ${commit.aiSummary.migrationNotes}\n  \`\`\`\n`;
        }
        if (commit.aiSummary.technicalImpact) {
          content += `  *${commit.aiSummary.technicalImpact}*\n`;
        }
      });
      content += '\n';
    }

    // Group by category with enhanced presentation
    const categoryOrder = ['security', 'feature', 'improvement', 'fix', 'refactor', 'docs', 'chore'];

    categoryOrder.forEach(category => {
      const categoryCommits = commits.filter(c => c.aiSummary.category === category);

      if (categoryCommits.length > 0) {
        const title = COMMIT_TYPES[category] || `📝 ${category.charAt(0).toUpperCase() + category.slice(1)}`;
        content += `## ${title}\n\n`;

        // Sort by impact
        const sortedCommits = categoryCommits.sort((a, b) => {
          const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return (impactOrder[b.aiSummary.impact] || 0) - (impactOrder[a.aiSummary.impact] || 0);
        });

        sortedCommits.forEach(commit => {
          const impactIcon = {
            critical: '🚨',
            high: '🔥',
            medium: '⚡',
            low: ''
          }[commit.aiSummary.impact] || '';

          content += `- ${impactIcon} **${commit.aiSummary.summary}** ([${commit.hash}](../../commit/${commit.hash}))\n`;

          if (commit.aiSummary.businessImpact) {
            content += `  *${commit.aiSummary.businessImpact}*\n`;
          }

          if (commit.aiSummary.highlights.length > 0) {
            content += `  - ${commit.aiSummary.highlights.join('\n  - ')}\n`;
          }
        });
        content += '\n';
      }
    });

    // Technical details section
    content += `## 🛠️ Technical Details\n\n`;
    content += `- **${insights.stats.totalCommits}** commits processed\n`;
    content += `- **${insights.stats.userFacingChanges}** user-facing changes\n`;
    content += `- **Release type**: ${insights.releaseType}\n`;
    content += `- **Risk level**: ${insights.riskLevel}\n\n`;

    // Migration and deployment notes
    const migrationsNeeded = commits.filter(c => c.aiSummary.migrationNotes);
    if (migrationsNeeded.length > 0) {
      content += `### 🔄 Migration Guide\n\n`;
      migrationsNeeded.forEach(commit => {
        content += `**${commit.aiSummary.summary}**\n`;
        content += `${commit.aiSummary.migrationNotes}\n\n`;
      });
    }

    // Contributors
    const contributors = [...new Set(commits.map(c => c.author))];
    if (contributors.length > 1) {
      content += `## 👥 Contributors\n\n`;
      content += `Thanks to all contributors: ${contributors.join(', ')}\n\n`;
    }

    return content;
  }
}

// CLI Interface (same as original but with enhanced options)
const args = process.argv.slice(2);
const generator = new EnhancedAIChangelogGenerator();

async function main() {
  if (args.includes('--analyze') || args.includes('-a')) {
    await generator.analyzeCurrentChanges();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Enhanced AI Changelog Generator

Usage:
  node generate-enhanced-ai-changelog.js [options]

Options:
  --analyze, -a     Analyze current working directory changes
  --version, -v     Specify version (default: auto-generated)
  --since, -s       Generate since specific commit/tag
  --help, -h        Show this help

Environment Variables:
  OPENAI_API_KEY    Required for AI-powered summaries

Examples:
  node generate-enhanced-ai-changelog.js                    # Generate AI changelog
  node generate-enhanced-ai-changelog.js --analyze          # Analyze current changes
  node generate-enhanced-ai-changelog.js --version v2.0.0   # Generate with specific version
  node generate-enhanced-ai-changelog.js --since v1.5.0     # Generate since specific version
`);
  } else {
    const version = args.find(arg => arg.startsWith('--version='))?.split('=')[1] ||
                   (args.includes('--version') || args.includes('-v') ? args[args.indexOf('--version') + 1] || args[args.indexOf('-v') + 1] : null);

    const since = args.find(arg => arg.startsWith('--since='))?.split('=')[1] ||
                 (args.includes('--since') || args.includes('-s') ? args[args.indexOf('--since') + 1] || args[args.indexOf('-s') + 1] : null);

    await generator.generateChangelog(version, since);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnhancedAIChangelogGenerator;