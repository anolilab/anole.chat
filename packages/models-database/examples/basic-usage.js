/**
 * Basic Usage Example
 * 
 * Demonstrates core functionality of the models database:
 * - Getting statistics
 * - Basic search
 * - Getting all models and providers
 */

import { getStats, getAllModels, getProviders, searchModels } from '../dist/index.mjs';

console.log('=== Basic Usage Example ===');
console.log('Data source: https://github.com/sst/models.dev (SST project)');
console.log('API: https://models.dev/api.json\n');

// Get basic statistics
console.log('📊 Database Statistics:');
const stats = getStats();
console.log(`Total models: ${stats.totalModels}`);
console.log(`Total providers: ${stats.totalProviders}`);
console.log(`Vision models: ${stats.features.vision}`);
console.log(`Tool-calling models: ${stats.features.tools}`);
console.log(`Reasoning models: ${stats.features.reasoning}`);
console.log(`Free models: ${stats.pricing.free}`);
console.log(`Paid models: ${stats.pricing.paid}\n`);

// List all providers
console.log('🏢 All Providers:');
const providers = getProviders();
providers.forEach(provider => {
    console.log(`  ${provider.name} (${provider.count} models)`);
});
console.log();

// Simple search example
console.log('🔍 Simple Search Examples:');
console.log('GPT models:', searchModels({ query: 'gpt', limit: 3 }).map(m => m.name));
console.log('Claude models:', searchModels({ query: 'claude', limit: 3 }).map(m => m.name));
console.log('Gemini models:', searchModels({ query: 'gemini', limit: 3 }).map(m => m.name));
console.log();

// Get total count
const allModels = getAllModels();
console.log(`📈 Total models available: ${allModels.length}`); 