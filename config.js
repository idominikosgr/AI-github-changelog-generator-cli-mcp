#!/usr/bin/env node

/**
 * Configuration Management for AI Changelog Generator
 * Handles configuration loading, validation, and defaults
 */

const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor(configPath = null) {
    this.configPath = configPath || this.findConfigFile();
    this.config = this.loadConfig();
    this.validate();
  }

  findConfigFile() {
    const possiblePaths = [
      '.env.local',
      '.changelog.config.js',
      'changelog.config.json',
      path.join(process.cwd(), '.env.local')
    ];

    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }

    return '.env.local'; // Default
  }

  loadConfig() {
    const defaults = {
      // AI Provider Settings
      AI_PROVIDER: process.env.AI_PROVIDER || 'auto',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,

      // Azure OpenAI Settings
      AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
      AZURE_OPENAI_KEY: process.env.AZURE_OPENAI_KEY,
      AZURE_OPENAI_DEPLOYMENT_NAME: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
      AZURE_OPENAI_API_VERSION: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',

      // Model Configuration
      AI_MODEL: process.env.AI_MODEL || 'gpt-4o',
      AI_MODEL_SIMPLE: process.env.AI_MODEL_SIMPLE || 'gpt-4o-mini',
      AI_MODEL_COMPLEX: process.env.AI_MODEL_COMPLEX || 'o3-mini',
      AI_MODEL_REASONING: process.env.AI_MODEL_REASONING || 'o1',

      // Changelog Settings
      CHANGELOG_FILE: process.env.CHANGELOG_FILE || 'AI_CHANGELOG.md',
      CHANGELOG_FORMAT: process.env.CHANGELOG_FORMAT || 'standard',
      DEFAULT_COMMIT_COUNT: parseInt(process.env.DEFAULT_COMMIT_COUNT || '20'),

      // Output Settings
      INCLUDE_COMMIT_HASH: process.env.INCLUDE_COMMIT_HASH !== 'false',
      INCLUDE_AUTHOR: process.env.INCLUDE_AUTHOR !== 'false',
      INCLUDE_DATE: process.env.INCLUDE_DATE !== 'false',
      GROUP_BY_TYPE: process.env.GROUP_BY_TYPE !== 'false',

      // Git Settings
      EXCLUDE_MERGE_COMMITS: process.env.EXCLUDE_MERGE_COMMITS !== 'false',
      EXCLUDE_WIP_COMMITS: process.env.EXCLUDE_WIP_COMMITS !== 'false',

      // AI Settings
      AI_TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
      AI_MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS || '1000'),
      AI_TIMEOUT: parseInt(process.env.AI_TIMEOUT || '30000')
    };

    // Load from config file if it exists
    if (this.configPath && fs.existsSync(this.configPath)) {
      if (this.configPath.endsWith('.json')) {
        const fileConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        return { ...defaults, ...fileConfig };
      } else if (this.configPath.endsWith('.js')) {
        const fileConfig = require(path.resolve(this.configPath));
        return { ...defaults, ...fileConfig };
      }
    }

    return defaults;
  }

  validate() {
    const errors = [];

    // Validate AI provider configuration
    if (this.config.AI_PROVIDER === 'openai' && !this.config.OPENAI_API_KEY) {
      errors.push('OPENAI_API_KEY is required when AI_PROVIDER is set to "openai"');
    }

    if (this.config.AI_PROVIDER === 'azure') {
      if (!this.config.AZURE_OPENAI_ENDPOINT) {
        errors.push('AZURE_OPENAI_ENDPOINT is required when AI_PROVIDER is set to "azure"');
      }
      if (!this.config.AZURE_OPENAI_KEY) {
        errors.push('AZURE_OPENAI_KEY is required when AI_PROVIDER is set to "azure"');
      }
    }

    // Validate numeric values
    if (this.config.DEFAULT_COMMIT_COUNT < 1) {
      errors.push('DEFAULT_COMMIT_COUNT must be a positive integer');
    }

    if (this.config.AI_TEMPERATURE < 0 || this.config.AI_TEMPERATURE > 2) {
      errors.push('AI_TEMPERATURE must be between 0 and 2');
    }

    if (this.config.AI_MAX_TOKENS < 1) {
      errors.push('AI_MAX_TOKENS must be a positive integer');
    }

    if (errors.length > 0) {
      console.warn('⚠️  Configuration warnings:');
      errors.forEach(error => console.warn(`   - ${error}`));
      console.warn('   Some features may not work as expected.\n');
    }

    return errors.length === 0;
  }

  get(key) {
    return this.config[key];
  }

  getAll() {
    return { ...this.config };
  }

  isAIAvailable() {
    return !!(this.config.OPENAI_API_KEY ||
             (this.config.AZURE_OPENAI_ENDPOINT && this.config.AZURE_OPENAI_KEY));
  }

  createSampleConfig() {
    const sampleConfig = `# AI Changelog Generator Configuration
# Copy this to .env.local and fill in your values

# AI Provider (auto, openai, azure)
AI_PROVIDER=auto

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your-azure-openai-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Model Configuration
AI_MODEL=gpt-4o
AI_MODEL_SIMPLE=gpt-4o-mini
AI_MODEL_COMPLEX=o3-mini
AI_MODEL_REASONING=o1

# Changelog Settings
CHANGELOG_FILE=AI_CHANGELOG.md
CHANGELOG_FORMAT=standard
DEFAULT_COMMIT_COUNT=20

# Output Settings
INCLUDE_COMMIT_HASH=true
INCLUDE_AUTHOR=true
INCLUDE_DATE=true
GROUP_BY_TYPE=true

# Git Settings
EXCLUDE_MERGE_COMMITS=true
EXCLUDE_WIP_COMMITS=true

# AI Settings
AI_TEMPERATURE=0.3
AI_MAX_TOKENS=1000
AI_TIMEOUT=30000
`;

    fs.writeFileSync('.env.local.example', sampleConfig);
    console.log('✅ Sample configuration created: .env.local.example');
    console.log('💡 Copy this file to .env.local and update with your values');
  }
}

module.exports = ConfigManager;

// CLI usage
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'create-sample') {
    const config = new ConfigManager();
    config.createSampleConfig();
  } else if (command === 'validate') {
    const config = new ConfigManager();
    console.log('🔍 Validating configuration...');
    if (config.validate()) {
      console.log('✅ Configuration is valid');
    } else {
      console.log('❌ Configuration has issues (see warnings above)');
    }
  } else {
    console.log('Usage:');
    console.log('  node config.js create-sample  # Create sample config file');
    console.log('  node config.js validate       # Validate current config');
  }
}
