#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

/**
 * Enhanced AI Provider for Changelog Generation
 * Supports both OpenAI and Azure OpenAI with intelligent fallback
 */
class AIProvider {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'auto';
    this.openaiKey = process.env.OPENAI_API_KEY;

    // Model configuration with smart defaults
    this.modelConfig = {
      default: process.env.AI_MODEL || 'gpt-4o',
      simple: process.env.AI_MODEL_SIMPLE || 'gpt-4o-mini',
      complex: process.env.AI_MODEL_COMPLEX || 'o3-mini',
      reasoning: process.env.AI_MODEL_REASONING || 'o1'
    };

    this.azureConfig = {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      key: process.env.AZURE_OPENAI_KEY,
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || this.modelConfig.default,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
    };

    this.activeProvider = this.determineActiveProvider();
    this.isAvailable = this.activeProvider !== 'none';

    if (this.isAvailable) {
      console.log(`🤖 AI Provider: ${this.activeProvider.toUpperCase()} (${this.getProviderInfo()})`);
    } else {
      console.log('⚠️  No AI provider configured. Using enhanced rule-based analysis...');
    }
  }

  determineActiveProvider() {
    // Auto mode: try Azure first, then OpenAI
    if (this.provider === 'auto') {
      if (this.isAzureConfigured()) return 'azure';
      if (this.isOpenAIConfigured()) return 'openai';
      return 'none';
    }

    // Explicit provider selection
    if (this.provider === 'azure' && this.isAzureConfigured()) return 'azure';
    if (this.provider === 'openai' && this.isOpenAIConfigured()) return 'openai';

    // Fallback
    if (this.isAzureConfigured()) return 'azure';
    if (this.isOpenAIConfigured()) return 'openai';

    return 'none';
  }

  isAzureConfigured() {
    return !!(this.azureConfig.endpoint && this.azureConfig.key);
  }

  isOpenAIConfigured() {
    return !!this.openaiKey;
  }

  getProviderInfo() {
    if (this.activeProvider === 'azure') {
      const resourceName = this.azureConfig.endpoint?.match(/https:\/\/([^.]+)\.openai\.azure\.com/)?.[1] || 'unknown';
      return `${resourceName} / ${this.azureConfig.deploymentName}`;
    }
    if (this.activeProvider === 'openai') {
      return `api.openai.com`;
    }
    return 'none';
  }

  async generateCompletion(messages, options = {}) {
    if (!this.isAvailable) {
      throw new Error('No AI provider available');
    }

    const defaultOptions = {
      temperature: 0.3,
      max_tokens: 1000,
      model: 'gpt-4'
    };

    const settings = { ...defaultOptions, ...options };

    try {
      if (this.activeProvider === 'azure') {
        return await this.callAzureOpenAI(messages, settings);
      } else {
        return await this.callOpenAI(messages, settings);
      }
    } catch (error) {
      console.error(`❌ ${this.activeProvider.toUpperCase()} API error:`, error.message);

      // Try fallback provider if auto mode
      if (this.provider === 'auto') {
        const fallbackProvider = this.activeProvider === 'azure' ? 'openai' : 'azure';
        if (fallbackProvider === 'openai' && this.isOpenAIConfigured()) {
          console.log('🔄 Falling back to OpenAI...');
          return await this.callOpenAI(messages, settings);
        }
        if (fallbackProvider === 'azure' && this.isAzureConfigured()) {
          console.log('🔄 Falling back to Azure OpenAI...');
          return await this.callAzureOpenAI(messages, settings);
        }
      }

      throw error;
    }
  }

  async callAzureOpenAI(messages, settings) {
    // Determine if we're using the next-generation v1 API
    const isNextGenAPI = this.azureConfig.apiVersion === 'preview';

    let url;
    if (isNextGenAPI) {
      // Next Generation v1 API - no deployment name in URL, model specified in body
      url = `${this.azureConfig.endpoint}/openai/v1/chat/completions?api-version=${this.azureConfig.apiVersion}`;
    } else {
      // Legacy API - deployment name in URL
      url = `${this.azureConfig.endpoint}/openai/deployments/${this.azureConfig.deploymentName}/chat/completions?api-version=${this.azureConfig.apiVersion}`;
    }

    // Build request body
    const requestBody = {
      messages
    };

    // For next-gen API, specify model in body instead of URL
    if (isNextGenAPI) {
      requestBody.model = this.azureConfig.deploymentName;
    }

    // Use max_completion_tokens for newer API versions (2025-01-01-preview and later) or next-gen
    if (isNextGenAPI || this.azureConfig.apiVersion >= '2025-01-01-preview') {
      requestBody.max_completion_tokens = settings.max_tokens;
    } else {
      requestBody.max_tokens = settings.max_tokens;
    }

    // Some models (like o4-mini, o1) only support temperature = 1 or don't support temperature
    if (this.azureConfig.deploymentName.includes('o4-mini') ||
        this.azureConfig.deploymentName.includes('o1') ||
        this.azureConfig.deploymentName.includes('o3')) {
      // Don't set temperature for reasoning models - they use default
    } else {
      requestBody.temperature = settings.temperature;
    }

    console.log(`🌐 Using ${isNextGenAPI ? 'Next-Gen v1' : 'Legacy'} Azure OpenAI API`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.azureConfig.key
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content,
      usage: data.usage,
      model: data.model || this.azureConfig.deploymentName
    };
  }

  async callOpenAI(messages, settings) {
    // Try to use the existing OpenAI package if available
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: this.openaiKey });

      const response = await openai.chat.completions.create({
        model: settings.model,
        messages,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens
      });

      return {
        content: response.choices[0]?.message?.content,
        usage: response.usage,
        model: response.model
      };
    } catch (packageError) {
      // Fallback to direct API call if package not available
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages,
          temperature: settings.temperature,
          max_tokens: settings.max_tokens
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0]?.message?.content,
        usage: data.usage,
        model: data.model
      };
    }
  }

  /**
   * Select the optimal model based on commit complexity
   */
  selectModelForCommit(commitInfo) {
    const filesChanged = commitInfo.files?.length || 0;
    const linesChanged = commitInfo.additions + commitInfo.deletions || 0;
    const hasBreakingChanges = commitInfo.message?.includes('BREAKING') || commitInfo.message?.includes('!:');

    // Complex commit criteria
    if (filesChanged > 50 || linesChanged > 2000 || hasBreakingChanges) {
      return this.modelConfig.complex; // o3-mini for complex analysis
    }

    // Simple commit criteria
    if (filesChanged < 5 && linesChanged < 100) {
      return this.modelConfig.simple; // gpt-4o-mini for quick analysis
    }

    // Default for most commits
    return this.modelConfig.default; // gpt-4o for balanced analysis
  }

  /**
   * Enhanced generate method with model selection
   */
  async generate(prompt, commitInfo = null, options = {}) {
    if (!this.isAvailable) {
      throw new Error('No AI provider available');
    }

    // Select model based on commit complexity if provided
    const selectedModel = commitInfo ? this.selectModelForCommit(commitInfo) : this.modelConfig.default;

    // Update deployment name for Azure or model for OpenAI
    const originalDeployment = this.azureConfig.deploymentName;
    if (this.activeProvider === 'azure') {
      this.azureConfig.deploymentName = selectedModel;
    }

    const messages = [
      {
        role: 'system',
        content: options.systemPrompt || 'You are an expert software engineer analyzing code changes for changelog generation.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const settings = {
      temperature: options.temperature || 0.3,
      max_tokens: options.max_tokens || 1000,
      model: selectedModel
    };

    console.log(`🎯 Using model: ${selectedModel} for this analysis`);

    try {
      const result = await this.callProvider(messages, settings);

      // Restore original deployment name
      if (this.activeProvider === 'azure') {
        this.azureConfig.deploymentName = originalDeployment;
      }

      return result;
    } catch (error) {
      // Restore original deployment name on error
      if (this.activeProvider === 'azure') {
        this.azureConfig.deploymentName = originalDeployment;
      }
      throw error;
    }
  }

  async callProvider(messages, settings) {
    if (this.activeProvider === 'azure') {
      return await this.callAzureOpenAI(messages, settings);
    } else {
      return await this.callOpenAI(messages, settings);
    }
  }

  // Test the AI provider connection
  async testConnection() {
    if (!this.isAvailable) {
      return { success: false, error: 'No AI provider configured' };
    }

    try {
      const testMessages = [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with exactly: {"test": "success"}'
        },
        {
          role: 'user',
          content: 'Test connection'
        }
      ];

      const result = await this.generateCompletion(testMessages, { max_tokens: 50 });

      return {
        success: true,
        provider: this.activeProvider,
        model: result.model,
        response: result.content
      };
    } catch (error) {
      return {
        success: false,
        provider: this.activeProvider,
        error: error.message
      };
    }
  }
}

module.exports = AIProvider;
