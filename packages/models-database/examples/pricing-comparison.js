/**
 * Pricing Comparison Example
 * 
 * Demonstrates pricing and cost analysis:
 * - Finding cheapest models
 * - Pricing tiers analysis
 * - Cost per feature analysis
 * - Budget-based model selection
 */

import { searchModels, getAllModels } from '../dist/index.mjs';

console.log('=== Pricing Comparison Example ===');
console.log('Data source: https://github.com/sst/models.dev (SST project)\n');

// Free models
console.log('🆓 Free Models:');
const freeModels = searchModels({ pricing: { freeOnly: true } });
console.log(`Found ${freeModels.length} free models:`);
freeModels.slice(0, 10).forEach(model => {
    console.log(`  ${model.name} (${model.provider})`);
});
if (freeModels.length > 10) {
    console.log(`  ... and ${freeModels.length - 10} more`);
}
console.log();

// Cheapest paid models
console.log('💰 Cheapest Paid Models by Input Price:');
const cheapestInput = searchModels({
    sortBy: 'input_price',
    sortOrder: 'asc',
    limit: 10
}).filter(m => m.cost?.input && m.cost.input > 0);

cheapestInput.forEach((model, i) => {
    const inputPrice = model.cost?.input || 0;
    const outputPrice = model.cost?.output || 0;
    console.log(`  ${i + 1}. ${model.name} (${model.provider})`);
    console.log(`     Input: $${inputPrice}/1M tokens, Output: $${outputPrice}/1M tokens`);
});
console.log();

// Most expensive models
console.log('💎 Most Expensive Models by Input Price:');
const mostExpensive = searchModels({
    sortBy: 'input_price',
    sortOrder: 'desc',
    limit: 5
}).filter(m => m.cost?.input && m.cost.input > 0);

mostExpensive.forEach((model, i) => {
    const inputPrice = model.cost?.input || 0;
    const outputPrice = model.cost?.output || 0;
    console.log(`  ${i + 1}. ${model.name} (${model.provider})`);
    console.log(`     Input: $${inputPrice}/1M tokens, Output: $${outputPrice}/1M tokens`);
});
console.log();

// Budget-based recommendations
console.log('💡 Budget-Based Recommendations:');

const budget5 = searchModels({
    pricing: { maxInputPrice: 5 },
    sortBy: 'input_price',
    sortOrder: 'asc',
    limit: 5
});
console.log('Best models under $5/1M input tokens:');
budget5.forEach(model => {
    const price = model.cost?.input || 0;
    const features = [];
    if (model.attachment) features.push('Vision');
    if (model.tool_call) features.push('Tools');
    if (model.reasoning) features.push('Reasoning');

    console.log(`  ${model.name} (${model.provider}) - $${price}/1M tokens`);
    console.log(`    Features: ${features.length > 0 ? features.join(', ') : 'Basic'}`);
    console.log(`    Context: ${model.limit?.context?.toLocaleString() || 'Unknown'} tokens`);
});
console.log();

// Feature-based cost analysis
console.log('🎯 Cost Analysis by Features:');

// Vision models pricing
const visionModels = searchModels({ features: { vision: true } }).filter(m => m.cost?.input);
if (visionModels.length > 0) {
    const avgVisionPrice = visionModels.reduce((sum, m) => sum + (m.cost?.input || 0), 0) / visionModels.length;
    const cheapestVision = visionModels.sort((a, b) => (a.cost?.input || 0) - (b.cost?.input || 0))[0];

    console.log('Vision Models:');
    console.log(`  Total: ${visionModels.length} models`);
    console.log(`  Average price: $${avgVisionPrice.toFixed(2)}/1M tokens`);
    console.log(`  Cheapest: ${cheapestVision.name} (${cheapestVision.provider}) - $${cheapestVision.cost?.input}/1M tokens`);
}

// Tool-calling models pricing
const toolModels = searchModels({ features: { tools: true } }).filter(m => m.cost?.input);
if (toolModels.length > 0) {
    const avgToolPrice = toolModels.reduce((sum, m) => sum + (m.cost?.input || 0), 0) / toolModels.length;
    const cheapestTool = toolModels.sort((a, b) => (a.cost?.input || 0) - (b.cost?.input || 0))[0];

    console.log('Tool-Calling Models:');
    console.log(`  Total: ${toolModels.length} models`);
    console.log(`  Average price: $${avgToolPrice.toFixed(2)}/1M tokens`);
    console.log(`  Cheapest: ${cheapestTool.name} (${cheapestTool.provider}) - $${cheapestTool.cost?.input}/1M tokens`);
}

// Reasoning models pricing
const reasoningModels = searchModels({ features: { reasoning: true } }).filter(m => m.cost?.input);
if (reasoningModels.length > 0) {
    const avgReasoningPrice = reasoningModels.reduce((sum, m) => sum + (m.cost?.input || 0), 0) / reasoningModels.length;
    const cheapestReasoning = reasoningModels.sort((a, b) => (a.cost?.input || 0) - (b.cost?.input || 0))[0];

    console.log('Reasoning Models:');
    console.log(`  Total: ${reasoningModels.length} models`);
    console.log(`  Average price: $${avgReasoningPrice.toFixed(2)}/1M tokens`);
    console.log(`  Cheapest: ${cheapestReasoning.name} (${cheapestReasoning.provider}) - $${cheapestReasoning.cost?.input}/1M tokens`);
}
console.log();

// Price tiers analysis
console.log('📊 Price Tiers Analysis:');
const allPaidModels = getAllModels().filter(m => m.cost?.input && m.cost.input > 0);

const priceTiers = [
    { name: 'Ultra Budget', min: 0, max: 1, models: [] },
    { name: 'Budget', min: 1, max: 5, models: [] },
    { name: 'Mid-Range', min: 5, max: 15, models: [] },
    { name: 'Premium', min: 15, max: 50, models: [] },
    { name: 'Enterprise', min: 50, max: Infinity, models: [] }
];

allPaidModels.forEach(model => {
    const price = model.cost?.input || 0;
    const tier = priceTiers.find(t => price >= t.min && price < t.max);
    if (tier) tier.models.push(model);
});

priceTiers.forEach(tier => {
    if (tier.models.length > 0) {
        const avgPrice = tier.models.reduce((sum, m) => sum + (m.cost?.input || 0), 0) / tier.models.length;
        const visionCount = tier.models.filter(m => m.attachment).length;
        const toolCount = tier.models.filter(m => m.tool_call).length;
        const reasoningCount = tier.models.filter(m => m.reasoning).length;

        console.log(`${tier.name} ($${tier.min}-${tier.max === Infinity ? '+' : tier.max}/1M tokens):`);
        console.log(`  Models: ${tier.models.length}`);
        console.log(`  Avg Price: $${avgPrice.toFixed(2)}/1M tokens`);
        console.log(`  Vision: ${visionCount} models (${(visionCount / tier.models.length * 100).toFixed(1)}%)`);
        console.log(`  Tools: ${toolCount} models (${(toolCount / tier.models.length * 100).toFixed(1)}%)`);
        console.log(`  Reasoning: ${reasoningCount} models (${(reasoningCount / tier.models.length * 100).toFixed(1)}%)`);
        console.log();
    }
});

// Cost efficiency analysis
console.log('⚡ Cost Efficiency Analysis:');
console.log('Best value models (features per dollar):');

const efficiencyScore = (model) => {
    const price = model.cost?.input || Infinity;
    if (price === 0 || price === Infinity) return 0;

    let features = 0;
    if (model.attachment) features++;
    if (model.tool_call) features++;
    if (model.reasoning) features++;
    if (model.limit?.context && model.limit.context > 100000) features++;

    return features / price;
};

const efficientModels = allPaidModels
    .map(model => ({ ...model, efficiency: efficiencyScore(model) }))
    .filter(m => m.efficiency > 0)
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 5);

efficientModels.forEach((model, i) => {
    const features = [];
    if (model.attachment) features.push('Vision');
    if (model.tool_call) features.push('Tools');
    if (model.reasoning) features.push('Reasoning');
    if (model.limit?.context && model.limit.context > 100000) features.push('Large Context');

    console.log(`  ${i + 1}. ${model.name} (${model.provider})`);
    console.log(`     Price: $${model.cost?.input}/1M tokens`);
    console.log(`     Features: ${features.join(', ')}`);
    console.log(`     Efficiency Score: ${model.efficiency.toFixed(3)}`);
}); 