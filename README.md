# 🚀 AI Changelog Generator

<p align="center">
  <strong>Generate professional changelogs from git commits using AI</strong><br>
  Works as a standalone CLI tool or MCP server for AI assistants
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ai-github-changelog-generator-cli-mcp">
    <img src="https://img.shields.io/npm/v/ai-github-changelog-generator-cli-mcp.svg" alt="npm version">
  </a>
  <a href="https://github.com/idominikosgr/AI-Git-Changelog-Generator/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/ai-github-changelog-generator-cli-mcp.svg" alt="license">
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/node/v/ai-github-changelog-generator-cli-mcp.svg" alt="node version">
  </a>
</p>

---

## ✨ Features

- 🤖 **AI-Powered**: Uses GPT-4.1 series, o3/o4 reasoning models with intelligent selection
- 🔧 **Dual Mode**: Works as standalone CLI or MCP server for Claude Desktop and other AI tools
- 📊 **Comprehensive Analysis**: Beyond commits - branches, dangling commits, untracked files
- 🎯 **Model Override**: Force specific models when needed (`--model gpt-4.1`, `--model o4`)
- 🎮 **Interactive Mode**: Professional commit selection and analysis interface
- ⚡ **Zero Config**: Works out of the box with intelligent fallbacks
- 🔐 **Multi-Provider**: Supports both OpenAI and Azure OpenAI with auto-detection

## 🚀 Quick Start

### Installation

```sh
# Install globally for CLI use
npm install -g ai-github-changelog-generator-cli-mcp

# Or locally in your project
npm install ai-github-changelog-generator-cli-mcp
```

### Basic Usage

```sh
# Generate changelog (if installed globally)
ai-changelog

# Or using npm scripts (if installed locally)
npm run changelog

# Start MCP server for AI assistants (if installed globally)
ai-changelog-mcp

# Or using npm scripts (if installed locally)
npm run mcp
```

### MCP Server Integration

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "ai-changelog-generator": {
      "command": "ai-changelog-mcp",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 📊 Functionality Matrix

| Feature | CLI | MCP | AI-Powered | Status |
|---------|-----|-----|------------|--------|
| **Basic Changelog** | ✅ | ✅ | ✅ | Excellent |
| **Staged Changes** | ✅ | ✅ | ✅ | Excellent |
| **Commit Analysis** | ✅ | ✅ | ✅ | Excellent |
| **Branch Analysis** | ✅ | ✅ | ❌ | **NEW** - Good |
| **Dangling Commits** | ✅ | ✅ | ❌ | **NEW** - Good |
| **Untracked Files** | ✅ | ✅ | ❌ | **NEW** - Good |
| **Interactive Mode** | ✅ | ❌ | ✅ | Excellent |
| **Model Override** | ✅ | ✅ | ✅ | **NEW** - Excellent |
| **Diff Analysis** | ✅ | ✅ | ✅ | Excellent |
| **Smart Model Selection** | ✅ | ✅ | ✅ | Excellent |

## 🎯 Core Commands

### Standard Changelog Generation

```sh
# Generate AI-powered changelog (global install)
ai-changelog
# Or using npm scripts (local install)
npm run changelog

# Generate with specific analysis mode (global install)
ai-changelog --detailed         # Comprehensive business + technical analysis
ai-changelog --enterprise       # Stakeholder-ready format with compliance notes
# Or using npm scripts (local install)
npm run changelog:detailed
npm run changelog:enterprise

# Generate for specific version range (global install)
ai-changelog --version v2.0.0   # Generate with specific version
ai-changelog --since v1.5.0     # Generate since specific version/commit
# For npm scripts, use: npm run changelog -- --version v2.0.0
```

### Repository Analysis

```sh
# Analyze current working directory changes (global install)
ai-changelog --analyze
# Or using npm scripts (local install)
npm run changelog:analyze

# Comprehensive repository analysis (global install)
ai-changelog --branches         # Analyze all branches and unmerged commits
ai-changelog --comprehensive    # Full repository health check
ai-changelog --untracked       # Categorize untracked files with recommendations
# For npm scripts, use: npm run changelog -- --branches
```

### Interactive Mode

```sh
# Launch interactive commit selection interface (global install)
ai-changelog --interactive
# Or using npm scripts (local install)
npm run changelog:interactive
```

**Interactive Options:**
- 📋 **Analyze staged changes** - Review what's ready for commit
- 🔍 **Analyze unstaged changes** - Check working directory modifications  
- ✅ **Select specific commits** - Cherry-pick commits with checkbox interface
- 📊 **Analyze recent commits** - Process last N commits
- 🔄 **Analyze all commits** - Full repository analysis

### Model Override

```sh
# Force specific model instead of smart selection (global install)
ai-changelog --model gpt-4.1-nano    # Ultra-efficient for small changes
ai-changelog --model gpt-4.1          # Balanced performance
ai-changelog --model o3               # Advanced reasoning (Azure-only)

# Combine with other options (global install)
ai-changelog --model gpt-4.1-mini --detailed
ai-changelog --model o3 --enterprise

# For npm scripts (local install), use:
npm run changelog -- --model gpt-4.1-nano
npm run changelog:detailed -- --model gpt-4.1-mini
```

## 🧠 Smart Model Selection

The tool automatically selects the optimal model based on change complexity:

| Change Type | Auto-Selected Model | Manual Override Available |
|-------------|-------------------|--------------------------|
| Minimal changes (<3 files, <50 lines) | `gpt-4.1-nano` | `--model gpt-4.1-nano` |
| Simple changes (3-10 files, <200 lines) | `gpt-4.1-mini` | `--model gpt-4.1-mini` |
| Standard changes (10-20 files, <1000 lines) | `gpt-4.1` | `--model gpt-4.1` |
| Complex changes (20+ files, 1000+ lines) | `gpt-4.1` | `--model gpt-4.1` |
| Architectural changes (100+ files, breaking) | `o4` (Azure) | `--model o4` |

> **💡 Tip**: Use `--model` to override smart selection for testing, cost optimization, or specific requirements.

## 🛠️ Configuration

### Option 1: Environment Variables

```sh
# OpenAI
export OPENAI_API_KEY="your-key"

# Azure OpenAI (Recommended - supports reasoning models)
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
export AZURE_OPENAI_KEY="your-key"
export AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4.1"
export AZURE_OPENAI_API_VERSION="2025-04-01-preview"
```

### Option 2: .env.local File

Create a `.env.local` file in your project root:

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1
AZURE_OPENAI_API_VERSION=2025-04-01-preview
```

### Advanced Configuration

Add these to your environment variables or `.env.local` file:

```env
# Model Configuration
AI_MODEL=gpt-4.1                    # Default model
AI_MODEL_SIMPLE=gpt-4.1-mini        # Simple changes
AI_MODEL_NANO=gpt-4.1-nano          # Minimal changes
AI_MODEL_COMPLEX=gpt-4.1            # Complex analysis
AI_MODEL_REASONING=o4-mini          # Latest reasoning model (Azure-only)
AI_MODEL_ADVANCED_REASONING=o4      # Latest advanced reasoning (Azure-only)
AI_MODEL_REASONING_LEGACY=o3-mini   # Previous gen reasoning (Azure-only)
AI_MODEL_ADVANCED_REASONING_LEGACY=o3 # Previous gen advanced reasoning (Azure-only)

# Provider Settings
AI_PROVIDER=auto                    # auto, openai, azure
AI_TEMPERATURE=0.3                  # AI creativity (0.0-1.0)
AI_MAX_TOKENS=1000                  # Response length limit
```

## 📖 Complete CLI Reference

### Global Installation Commands

```sh
# Basic usage
ai-changelog                    # Generate standard AI changelog
ai-changelog --help            # Show all available options

# Analysis modes
ai-changelog --detailed        # Comprehensive business + technical analysis
ai-changelog --enterprise      # Enterprise-ready documentation
ai-changelog --analyze         # Analyze current changes

# Repository analysis
ai-changelog --branches        # Analyze all branches and unmerged commits
ai-changelog --comprehensive   # Full repository health check  
ai-changelog --untracked      # Categorize untracked files

# Advanced options
ai-changelog --interactive     # Interactive commit selection
ai-changelog --model gpt-4.1   # Force specific model
ai-changelog --validate        # Validate configuration
ai-changelog --metrics         # Show performance metrics

# Version and range options
ai-changelog --version v2.0.0  # Generate with specific version
ai-changelog --since v1.5.0    # Generate since specific version
ai-changelog --since HEAD~5    # Generate since specific commit

# Combinations
ai-changelog --model o4 --detailed --since v1.0.0
ai-changelog --interactive --enterprise
```

### Local Installation (npm scripts)

```sh
# Basic usage
npm run changelog               # Generate standard AI changelog
npm run changelog:detailed     # Comprehensive analysis
npm run changelog:enterprise   # Enterprise documentation
npm run changelog:interactive  # Interactive mode
npm run changelog:analyze      # Analyze current changes

# MCP server
npm run mcp                     # Start MCP server

# Testing and validation
npm test                        # Run tests
npm run config:validate         # Validate configuration
npm run providers:test          # Test AI providers

# Using flags with npm scripts
npm run changelog -- --model gpt-4.1
npm run changelog -- --since v1.0.0
npm run changelog -- --detailed --interactive
```

## 🔧 MCP Server Tools

When used as an MCP server, provides these tools for AI assistants:

| Tool | Purpose | Parameters |
|------|---------|------------|
| `generate_changelog` | Generate AI changelog | `model`, `analysisMode`, `since`, `version` |
| `analyze_commits` | Analyze commit patterns | `limit`, `since` |
| `analyze_current_changes` | Analyze staged/unstaged | `includeAIAnalysis` |
| `analyze_branches` | Branch and unmerged analysis | `includeAllBranches` |
| `analyze_comprehensive` | Full repository health | - |
| `get_git_info` | Repository information | `includeStats` |
| `configure_ai_provider` | Test AI provider settings | `provider`, `testConnection` |
| `validate_models` | Check model availability | `provider`, `checkCapabilities` |

### MCP Usage Example

```javascript
// Generate changelog with model override
{
  "name": "generate_changelog",
  "arguments": {
    "model": "gpt-4.1",
    "analysisMode": "detailed",
    "since": "v1.0.0"
  }
}

// Comprehensive repository analysis
{
  "name": "analyze_comprehensive",
  "arguments": {}
}
```

## 🎮 Interactive Mode Features

The interactive mode provides an interface for precise changelog control:

```sh
# Global install
ai-changelog --interactive

# Local install
npm run changelog:interactive
```

**Features:**
- 📊 **Repository Status**: Shows current branch, staged/unstaged counts
- ✅ **Commit Selection**: Checkbox interface for cherry-picking
- 🔍 **Smart Analysis**: AI-powered commit message validation
- 💡 **Suggestions**: Commit message improvement recommendations
- 🎯 **Targeted Analysis**: Focus on specific changes or timeframes
- 🛡️ **Validation**: Conventional commit format checking

**Perfect for:**
- Code reviews and PR preparation
- Release planning and scoping  
- Understanding change impact before deployment
- Creating focused changelogs for specific features

## 🚀 What's New Today

### **Enhanced Repository Analysis**
- **Branch Analysis**: Detect unmerged commits across branches
- **Dangling Commits**: Identify unreachable commits for cleanup
- **Untracked Files**: Smart categorization with actionable recommendations
- **Comprehensive Health Check**: Full repository status analysis

### **Model Override Support**
- **CLI Flag**: `--model gpt-4.1`, `--model o3`, `--model gpt-4.1-nano`
- **MCP Parameter**: Include `"model": "gpt-4.1"` in tool calls
- **Smart Validation**: Shows model capabilities and graceful fallbacks
- **Cost Optimization**: Force efficient models for simple changes

### **Enhanced Git Parsing**
- **Multiline Commit Support**: Properly handles complex commit messages
- **Improved Diff Analysis**: Better context extraction and parsing
- **Robust Error Handling**: Graceful fallbacks for all git operations

## 💡 Example Outputs

### Standard Changelog
```markdown
# Changelog

## [v2.1.0] - 2025-06-08

### 🚀 Features
- **AI Model Override**: Force specific models with --model flag
  *Enables cost optimization and testing specific model capabilities*

### 🐛 Bug Fixes  
- **Git Parsing**: Fixed multiline commit message handling
  *Improves analysis accuracy for complex commit descriptions*

### 📊 Analysis
- **3** commits processed
- **Processing Time**: 2s
- **Model Used**: gpt-4.1 (auto-selected)
```

### Repository Health Check
```sh
# Global install
ai-changelog --comprehensive

# Local install  
npm run changelog -- --comprehensive

📊 Repository Health Check:
   • Total commits: 127
   • Contributors: 5  
   • Active branches: 3
   • Dangling commits: 2 (cleanup recommended)
   • Untracked files: 15 (categorized)
   • Repository age: 3 months
```

## 🔍 Troubleshooting

### Common Issues

**"No API key found"**
Create a `.env.local` file with your credentials:
```env
AZURE_OPENAI_KEY=your-key
```

**"No commits found"**
```sh
git log --oneline  # Check if you have commits
ai-changelog --since HEAD~5  # Try specific range (global)
npm run changelog -- --since HEAD~5  # Try specific range (local)
```

**"Model not available"**
```sh
ai-changelog --validate  # Check available models (global)
ai-changelog --model gpt-4.1  # Try different model (global)
npm run config:validate  # Check configuration (local)
npm run changelog -- --model gpt-4.1  # Try different model (local)
```

**Test your configuration:**
```sh
# Global install
ai-changelog --validate     # Check configuration
ai-changelog --analyze      # Test with current changes
ai-changelog --help         # See all options

# Local install
npm run config:validate     # Check configuration  
npm run changelog:analyze   # Test with current changes
npm run changelog -- --help # See all options
```

## 🛡️ Requirements

- **Node.js** 18+
- **Git** repository
- **API Key** for OpenAI or Azure OpenAI (optional - works offline with fallback)

## 🌟 API Providers

### Azure OpenAI
- **Models**: GPT-4.1 series + o3/o4 reasoning models (both generations)
- **Features**: Advanced reasoning, 1M token context, prompt caching
- **Enterprise**: Security, compliance, data residency
- **Cost**: 75% reduction with prompt caching

### OpenAI
- **Models**: GPT-4.1 series (best changelog quality)
- **Features**: Large context, prompt caching
- **Setup**: Simple API key configuration
- **Pricing**: Pay-per-use

> Both providers work identically. Tool auto-detects your configuration.

## 🏆 Performance

- **~1-2 seconds** for standard changes (gpt-4.1-mini)
- **~3-5 seconds** for complex analysis (gpt-4.1)
- **~5-10 seconds** for reasoning analysis (o4)
- **Instant** fallback mode when offline

**Cost Optimization:**
- Automatic model selection saves ~40% on API costs
- Prompt caching reduces costs by 75% on repeated analyses
- Ultra-efficient nano model for minimal changes

## 🎯 Use Cases

### Development Teams
- **Daily Development**: Understand current changes before commits
- **Code Reviews**: Generate comprehensive change summaries
- **Branch Management**: Track unmerged work across branches
- **Repository Maintenance**: Identify cleanup opportunities

### Release Management
- **Release Notes**: Professional changelog generation
- **Stakeholder Communication**: Business-focused change summaries
- **Risk Assessment**: Impact analysis before deployment
- **Compliance**: Enterprise-ready documentation

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Generate Changelog
  run: |
    npx ai-github-changelog-generator-cli-mcp --since ${{ github.event.before }}
    git add CHANGELOG.md
    git commit -m "docs: update changelog"
```

## 🤝 Contributing

This tool succeeds because it solves real problems simply:

- **No feature bloat** - Every feature solves a common use case
- **No configuration complexity** - Intelligent defaults, minimal setup  

```sh
git clone https://github.com/idominikosgr/AI-Git-Changelog-Generator
cd AI-Git-Changelog-Generator
npm install
npm test
```

## 🗺️ Roadmap

**Current**: Comprehensive git analysis with model override support
**Next**: Custom output formats 
**Future**: Change risk scoring, automated release note generation

No timeline promises. Features ship when they're production-ready.

---

## 📄 License

MIT - Use it however you want.

---

**Made for developers who want better changelogs without the hassle.**

*Your git repository tells a story. Let AI help you tell it better.*

---

## 📝 Copyright Notice

All trademarks belong to their respective owners. This project is not affiliated with or endorsed by OpenAI, Microsoft Azure, GitHub, or any other mentioned companies or services.
