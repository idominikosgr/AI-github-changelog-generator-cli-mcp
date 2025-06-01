# AI Changelog Generator

🤖 An intelligent changelog generator that uses AI to create meaningful changelogs from your git commits.

## Features

- 🔄 **Multiple AI Providers**: Supports OpenAI and Azure OpenAI
- 📊 **Smart Analysis**: Analyze commits, staged changes, or specific ranges
- 🎯 **Conventional Commits**: Automatic categorization with emojis
- 🤝 **Interactive Mode**: Select commits interactively
- 📝 **Custom Templates**: Multiple analysis types (feature, bugfix, refactor, etc.)
- 🛡️ **Fallback Mode**: Works without AI using enhanced rule-based analysis

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure AI provider (optional but recommended):**
   ```bash
   # For OpenAI
   echo "OPENAI_API_KEY=your-key-here" > .env.local

   # For Azure OpenAI
   echo "AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com" >> .env.local
   echo "AZURE_OPENAI_KEY=your-key-here" >> .env.local
   echo "AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4" >> .env.local
   ```

3. **Generate changelog:**
   ```bash
   npm start
   ```

## Usage Examples

### Basic Usage
```bash
# Generate changelog from recent commits
node generate-ai-changelog.js

# Enhanced mode with analysis options
node enhanced-changelog-generator-v2.js
```

### Advanced Options
```bash
# Analyze specific commit as a feature
node enhanced-changelog-generator-v2.js --commit abc1234 --type feature

# Analyze staged changes as bugfix
node enhanced-changelog-generator-v2.js --staged --type bugfix

# Analyze recent commits
node enhanced-changelog-generator-v2.js --recent 10 --type refactor
```

### Available Analysis Types
- `commit` - General commit analysis
- `feature` - Feature implementation analysis
- `bugfix` - Bug fix analysis
- `refactor` - Code refactoring analysis
- `migration` - Migration/upgrade analysis

## Configuration

Create `.env.local` file with your AI provider settings:

```env
# AI Provider (auto, openai, azure)
AI_PROVIDER=auto

# OpenAI Configuration
OPENAI_API_KEY=your-openai-key

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your-azure-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Model Configuration
AI_MODEL=gpt-4o
AI_MODEL_SIMPLE=gpt-4o-mini
AI_MODEL_COMPLEX=o3-mini
```

## Scripts

- `npm start` - Run basic changelog generator
- `npm run enhanced` - Run enhanced version with analysis modes
- `npm run demo` - Show interactive demo
- `npm test` - Test AI provider configuration
- `npm run setup` - Setup Azure OpenAI configuration

## Output

The tool generates `AI_CHANGELOG.md` with:
- 📅 Timestamp and version info
- 📊 Categorized changes with emojis
- 🔍 AI-powered insights and analysis
- 📋 Commit details and impact assessment

## Requirements

- Node.js 14+
- Git repository
- OpenAI API key or Azure OpenAI access (optional)

## License

MIT
