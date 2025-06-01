#!/usr/bin/env node

/**
 * Interactive Azure OpenAI setup script for MyRoomie changelog generation
 * This script helps configure Azure OpenAI credentials for enhanced AI changelog generation
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 Azure OpenAI Setup for MyRoomie Changelog Generation\n');

  console.log('This script will help you configure Azure OpenAI for enhanced changelog generation.');
  console.log('You\'ll need to have an Azure OpenAI resource already created.\n');

  const proceed = await question('Do you have an Azure OpenAI resource ready? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('\n📚 Please follow these steps first:');
    console.log('1. Go to https://portal.azure.com');
    console.log('2. Search for "OpenAI" and create a new resource');
    console.log('3. Deploy a GPT-4 model in your resource');
    console.log('4. Come back and run this script again');
    console.log('\n📖 See docs/AZURE_OPENAI_SETUP.md for detailed instructions');
    process.exit(0);
  }

  console.log('\n📝 Please provide your Azure OpenAI configuration:');

  const endpoint = await question('Azure OpenAI Endpoint (e.g., https://your-resource.openai.azure.com/): ');
  const apiKey = await question('Azure OpenAI API Key: ');
  const deploymentName = await question('Primary Deployment Name (e.g., gpt-4o): ');
  const apiVersion = await question('API Version [2024-02-15-preview]: ') || '2024-02-15-preview';

  console.log('\n🎯 Model Configuration (press Enter for recommended defaults):');
  const modelDefault = await question(`Default model [${deploymentName}]: `) || deploymentName;
  const modelSimple = await question('Simple commits model [gpt-4o-mini]: ') || 'gpt-4o-mini';
  const modelComplex = await question('Complex commits model [o3-mini]: ') || 'o3-mini';

  // Validate inputs
  if (!endpoint || !apiKey || !deploymentName) {
    console.log('❌ All fields except API Version are required!');
    process.exit(1);
  }

  if (!endpoint.includes('openai.azure.com')) {
    console.log('❌ Endpoint should be an Azure OpenAI URL (*.openai.azure.com)');
    process.exit(1);
  }

  // Load existing .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update Azure OpenAI configuration
  const azureConfig = `
# Azure OpenAI Configuration (updated by setup script)
AZURE_OPENAI_ENDPOINT=${endpoint}
AZURE_OPENAI_KEY=${apiKey}
AZURE_OPENAI_DEPLOYMENT_NAME=${deploymentName}
AZURE_OPENAI_API_VERSION=${apiVersion}

# Smart Model Selection for Changelog Generation
AI_PROVIDER=azure
AI_MODEL=${modelDefault}
AI_MODEL_SIMPLE=${modelSimple}
AI_MODEL_COMPLEX=${modelComplex}
AI_MODEL_REASONING=o1
`;

  // Remove existing Azure OpenAI config if present
  envContent = envContent.replace(/# Azure OpenAI Configuration[\s\S]*?(?=\n\n|\n#|$)/g, '');
  envContent = envContent.replace(/AZURE_OPENAI_.*?=.*?\n/g, '');
  envContent = envContent.replace(/AI_PROVIDER=.*?\n/g, '');

  // Add new config
  envContent = envContent.trim() + azureConfig;

  // Write back to file
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Azure OpenAI configuration saved to .env.local');
  console.log('\n🧪 Testing your configuration...\n');

  // Test the configuration
  const AIProvider = require('./ai-provider');
  require('dotenv').config({ path: '.env.local' });

  try {
    const provider = new AIProvider();
    const testResult = await provider.testConnection();

    if (testResult.success) {
      console.log('🎉 SUCCESS! Azure OpenAI connection working!');
      console.log(`   Model: ${testResult.model}`);
      console.log(`   Provider: ${testResult.provider}`);

      console.log('\n🚀 You can now use enhanced AI changelog generation:');
      console.log('   npm run changelog:ai        # Generate AI-powered changelog');
      console.log('   npm run changelog:ai-test   # Test AI provider');
      console.log('   npm run changelog:analyze   # Analyze current changes');

    } else {
      console.log('❌ Connection test failed:');
      console.log(`   Error: ${testResult.error}`);
      console.log('\n🔧 Please check your configuration and try again.');
    }

  } catch (error) {
    console.log('❌ Setup test failed:');
    console.log(`   Error: ${error.message}`);
    console.log('\n🔧 Please verify your Azure OpenAI configuration.');
  }

  rl.close();
}

main().catch(console.error);
