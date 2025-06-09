#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const AIProvider = require('./lib/ai-provider');

/**
 * Test script to verify AI provider configuration
 * Tests both OpenAI and Azure OpenAI connections
 */
class AIProviderTest {
  async runTests() {
    console.log('🧪 Testing AI Provider Configuration\n');
    console.log('=' .repeat(50));

    const provider = new AIProvider();

    // Test 1: Configuration Check
    console.log('1️⃣ Testing Configuration...');
    this.testConfiguration(provider);

    // Test 2: Connection Test
    console.log('\n2️⃣ Testing Connection...');
    const connectionResult = await this.testConnection(provider);

    // Test 3: AI Generation Test
    console.log('\n3️⃣ Testing AI Generation...');
    await this.testGeneration(provider);

    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 Test Results Summary\n');

    if (provider.isAvailable) {
      console.log(`✅ AI Provider: ${provider.activeProvider.toUpperCase()}`);
      console.log(`✅ Configuration: Valid`);

      if (connectionResult.success) {
        console.log('✅ Connection: Working');
        console.log('🎉 AI-powered changelog generation is ready!');
        console.log('\n💡 Usage:');
        console.log('   pnpm run changelog:ai');
      } else {
        console.log('❌ Connection: Failed');
        console.log(`   Error: ${connectionResult.error}`);
      }
    } else {
      console.log('❌ No AI provider configured');
      console.log('💡 Configure environment variables in .env.local:');
      console.log('   • For Azure: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY');
      console.log('   • For OpenAI: OPENAI_API_KEY');
    }
  }

  testConfiguration(provider) {
    console.log(`   Provider mode: ${process.env.AI_PROVIDER || 'auto'}`);

    // Check OpenAI config
    const hasOpenAI = provider.isOpenAIConfigured();
    console.log(`   OpenAI: ${hasOpenAI ? '✅ Configured' : '❌ Not configured'}`);

    // Check Azure config
    const hasAzure = provider.isAzureConfigured();
    console.log(`   Azure OpenAI: ${hasAzure ? '✅ Configured' : '❌ Not configured'}`);

    if (hasAzure) {
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';
      console.log(`   Azure Endpoint: ${endpoint}`);
      console.log(`   Azure Deployment: ${deployment}`);
    }

    console.log(`   Active Provider: ${provider.activeProvider}`);
  }

  async testConnection(provider) {
    if (!provider.isAvailable) {
      console.log('   ❌ No provider available for testing');
      return { success: false, error: 'No provider configured' };
    }

    try {
      console.log(`   🔍 Testing ${provider.activeProvider.toUpperCase()} connection...`);
      const result = await provider.testConnection();

      if (result.success) {
        console.log('   ✅ Connection successful');
        console.log(`   Model: ${result.model}`);
        console.log(`   Response: ${result.response?.substring(0, 50)}...`);
      } else {
        console.log('   ❌ Connection failed');
        console.log(`   Error: ${result.error}`);
      }

      return result;
    } catch (error) {
      console.log('   ❌ Connection test failed');
      console.log(`   Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testGeneration(provider) {
    if (!provider.isAvailable) {
      console.log('   ❌ No provider available for generation test');
      return;
    }

    try {
      console.log('   🔍 Testing changelog generation...');

      const messages = [
        {
          role: 'system',
          content: 'You are a technical writer. Respond with a brief changelog entry in JSON format.'
        },
        {
          role: 'user',
          content: `Analyze this commit: "feat: add user authentication with Supabase"

Respond with JSON:
{
  "type": "feature",
  "title": "Brief title",
  "description": "One sentence description",
  "impact": "user impact"
}`
        }
      ];

      const result = await provider.generateCompletion(messages, { max_tokens: 200 });

      if (result.content) {
        console.log('   ✅ Generation successful');
        console.log(`   Sample output: ${result.content.substring(0, 100)}...`);

        // Try to parse as JSON
        try {
          JSON.parse(result.content);
          console.log('   ✅ Valid JSON response');
        } catch {
          console.log('   ⚠️ Response not in JSON format (may need prompt tuning)');
        }
      } else {
        console.log('   ❌ Empty response');
      }
    } catch (error) {
      console.log('   ❌ Generation test failed');
      console.log(`   Error: ${error.message}`);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const test = new AIProviderTest();
  test.runTests().catch(console.error);
}

module.exports = AIProviderTest;
