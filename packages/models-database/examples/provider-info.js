/**
 * Provider Information Example
 * 
 * Demonstrates provider-specific functionality:
 * - Getting provider details
 * - Listing models by provider
 * - Provider comparison
 * - Provider statistics
 */

import { getProvider, getProviders, getModelsByProvider, searchModels } from '../dist/index.mjs';

console.log('=== Provider Information Example ===');
console.log('Data source: https://github.com/sst/models.dev (SST project)\n');

// Get all providers overview
console.log('🏢 All Providers Overview:');
const providers = getProviders();
providers.forEach(provider => {
    console.log(`  ${provider.name}: ${provider.count} models`);
});
console.log();

// Detailed provider information
console.log('🔧 Detailed Provider Information:');

const openai = getProvider('openai');
if (openai) {
    console.log('OpenAI Details:');
    console.log(`  Name: ${openai.name}`);
    console.log(`  API: ${openai.api || 'N/A'}`);
    console.log(`  NPM Package: ${openai.npm || 'N/A'}`);
    console.log(`  Documentation: ${openai.doc || 'N/A'}`);
    console.log(`  Environment Variables: ${openai.env?.join(', ') || 'N/A'}`);
    console.log();
}

const anthropic = getProvider('anthropic');
if (anthropic) {
    console.log('Anthropic Details:');
    console.log(`  Name: ${anthropic.name}`);
    console.log(`  API: ${anthropic.api || 'N/A'}`);
    console.log(`  NPM Package: ${anthropic.npm || 'N/A'}`);
    console.log(`  Documentation: ${anthropic.doc || 'N/A'}`);
    console.log(`  Environment Variables: ${anthropic.env?.join(', ') || 'N/A'}`);
    console.log();
}

// Models by provider
console.log('🚀 Models by Provider:');

const openaiModels = getModelsByProvider('openai');
console.log(`OpenAI Models (${openaiModels.length} total):`);
openaiModels.slice(0, 8).forEach(model => {
    const price = model.cost?.input || 0;
    console.log(`  ${model.name} - $${price}/1M tokens`);
});
if (openaiModels.length > 8) {
    console.log(`  ... and ${openaiModels.length - 8} more`);
}
console.log();

const anthropicModels = getModelsByProvider('anthropic');
console.log(`Anthropic Models (${anthropicModels.length} total):`);
anthropicModels.forEach(model => {
    const price = model.cost?.input || 0;
    console.log(`  ${model.name} - $${price}/1M tokens`);
});
console.log();

// Provider comparison
console.log('📊 Provider Comparison:');
const providerStats = providers.map(provider => {
    const models = getModelsByProvider(provider.id);
    const avgInputPrice = models.reduce((sum, m) => sum + (m.cost?.input || 0), 0) / models.length;
    const avgOutputPrice = models.reduce((sum, m) => sum + (m.cost?.output || 0), 0) / models.length;
    const visionCount = models.filter(m => m.attachment).length;
    const toolsCount = models.filter(m => m.tool_call).length;
    const reasoningCount = models.filter(m => m.reasoning).length;
    const freeCount = models.filter(m => !m.cost || (!m.cost.input && !m.cost.output)).length;

    return {
        name: provider.name,
        id: provider.id,
        totalModels: models.length,
        avgInputPrice: avgInputPrice || 0,
        avgOutputPrice: avgOutputPrice || 0,
        visionModels: visionCount,
        toolModels: toolsCount,
        reasoningModels: reasoningCount,
        freeModels: freeCount
    };
}).filter(p => p.totalModels > 0); // Only show providers with models

console.log('Provider Statistics:');
providerStats.forEach(stats => {
    console.log(`${stats.name}:`);
    console.log(`  Total Models: ${stats.totalModels}`);
    console.log(`  Avg Input Price: $${stats.avgInputPrice.toFixed(2)}/1M tokens`);
    console.log(`  Avg Output Price: $${stats.avgOutputPrice.toFixed(2)}/1M tokens`);
    console.log(`  Vision Models: ${stats.visionModels}`);
    console.log(`  Tool Models: ${stats.toolModels}`);
    console.log(`  Reasoning Models: ${stats.reasoningModels}`);
    console.log(`  Free Models: ${stats.freeModels}`);
    console.log();
});

// Top providers by category
console.log('🏆 Top Providers by Category:');

// Most models
const mostModels = providerStats.sort((a, b) => b.totalModels - a.totalModels).slice(0, 3);
console.log('Most Models:');
mostModels.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}: ${p.totalModels} models`);
});

// Most affordable (lowest avg input price, excluding free)
const mostAffordable = providerStats
    .filter(p => p.avgInputPrice > 0)
    .sort((a, b) => a.avgInputPrice - b.avgInputPrice)
    .slice(0, 3);
console.log('Most Affordable (avg input price):');
mostAffordable.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}: $${p.avgInputPrice.toFixed(2)}/1M tokens`);
});

// Most vision models
const mostVision = providerStats
    .filter(p => p.visionModels > 0)
    .sort((a, b) => b.visionModels - a.visionModels)
    .slice(0, 3);
console.log('Most Vision Models:');
mostVision.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}: ${p.visionModels} vision models`);
});

// Most reasoning models
const mostReasoning = providerStats
    .filter(p => p.reasoningModels > 0)
    .sort((a, b) => b.reasoningModels - a.reasoningModels)
    .slice(0, 3);
console.log('Most Reasoning Models:');
mostReasoning.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}: ${p.reasoningModels} reasoning models`);
}); 