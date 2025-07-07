/**
 * Search & Filters Example
 * 
 * Demonstrates advanced search and filtering capabilities:
 * - Text search
 * - Provider filtering
 * - Feature filtering
 * - Pricing filters
 * - Context window filtering
 * - Sorting and limiting results
 */

import { searchModels } from '../dist/index.mjs';

console.log('=== Search & Filters Example ===');
console.log('Data source: https://github.com/sst/models.dev (SST project)\n');

// Text search
console.log('🔍 Text Search:');
console.log('Models with "gpt" in name:', searchModels({ query: 'gpt', limit: 5 }).map(m => `${m.name} (${m.provider})`));
console.log();

// Provider filtering
console.log('🏢 Provider Filtering:');
console.log('OpenAI models:', searchModels({ providers: 'openai', limit: 5 }).map(m => m.name));
console.log('Anthropic models:', searchModels({ providers: 'anthropic', limit: 5 }).map(m => m.name));
console.log('Multiple providers:', searchModels({ providers: ['openai', 'anthropic'], limit: 5 }).map(m => `${m.name} (${m.provider})`));
console.log();

// Feature filtering
console.log('👁️ Feature Filtering:');
const visionModels = searchModels({ features: { vision: true }, limit: 5 });
console.log('Vision models:', visionModels.map(m => `${m.name} (${m.provider})`));

const toolModels = searchModels({ features: { tools: true }, limit: 5 });
console.log('Tool-calling models:', toolModels.map(m => `${m.name} (${m.provider})`));

const reasoningModels = searchModels({ features: { reasoning: true }, limit: 5 });
console.log('Reasoning models:', reasoningModels.map(m => `${m.name} (${m.provider})`));

// Combined features
const advancedModels = searchModels({
    features: { vision: true, tools: true },
    limit: 3
});
console.log('Vision + Tools models:', advancedModels.map(m => `${m.name} (${m.provider})`));
console.log();

// Pricing filters
console.log('💰 Pricing Filters:');
const freeModels = searchModels({ pricing: { freeOnly: true }, limit: 5 });
console.log('Free models:', freeModels.map(m => `${m.name} (${m.provider})`));

const affordableModels = searchModels({
    pricing: { maxInputPrice: 5 },
    limit: 5
});
console.log('Affordable models (<$5 input):', affordableModels.map(m => {
    const price = m.cost?.input || 0;
    return `${m.name} - $${price}/1M tokens (${m.provider})`;
}));
console.log();

// Context window filtering
console.log('📏 Context Window Filtering:');
const largeContextModels = searchModels({
    contextWindow: { min: 100000 },
    sortBy: 'context_window',
    sortOrder: 'desc',
    limit: 5
});
console.log('Large context models (>100k tokens):');
largeContextModels.forEach(m => {
    console.log(`  ${m.name}: ${m.limit?.context?.toLocaleString()} tokens (${m.provider})`);
});
console.log();

// Sorting examples
console.log('📊 Sorting Examples:');
const cheapestModels = searchModels({
    sortBy: 'input_price',
    sortOrder: 'asc',
    limit: 5
});
console.log('Cheapest models by input price:');
cheapestModels.forEach(m => {
    const price = m.cost?.input || 0;
    console.log(`  ${m.name}: $${price}/1M tokens (${m.provider})`);
});

const byProvider = searchModels({
    sortBy: 'provider',
    sortOrder: 'asc',
    limit: 8
});
console.log('Models sorted by provider:', byProvider.map(m => `${m.provider}/${m.name}`));
console.log();

// Complex filtering
console.log('🎯 Complex Filtering:');
const complexSearch = searchModels({
    query: 'gpt',
    providers: ['openai'],
    features: { tools: true },
    pricing: { maxInputPrice: 20 },
    sortBy: 'input_price',
    sortOrder: 'asc'
});
console.log('GPT models from OpenAI with tools, under $20 input price:');
complexSearch.forEach(m => {
    const price = m.cost?.input || 0;
    console.log(`  ${m.name}: $${price}/1M tokens, Tools: ${m.tool_call ? 'Yes' : 'No'}`);
}); 