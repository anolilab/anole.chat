/**
 * Model Details Example
 * 
 * Demonstrates getting detailed information about specific models:
 * - Getting model by ID
 * - Comparing similar models
 * - Model specifications analysis
 * - Feature comparisons
 */

import { getModel, searchModels } from '../dist/index.mjs';

console.log('=== Model Details Example ===');
console.log('Data source: https://github.com/sst/models.dev (SST project)\n');

// Get specific models
console.log('🎯 Specific Model Details:');

const gpt4 = getModel('gpt-4');
if (gpt4) {
    console.log('GPT-4 Details:');
    console.log(`  Name: ${gpt4.name}`);
    console.log(`  Provider: ${gpt4.provider}`);
    console.log(`  ID: ${gpt4.id}`);
    console.log(`  Vision Support: ${gpt4.attachment ? 'Yes' : 'No'}`);
    console.log(`  Tool Calling: ${gpt4.tool_call ? 'Yes' : 'No'}`);
    console.log(`  Reasoning: ${gpt4.reasoning ? 'Yes' : 'No'}`);
    console.log(`  Temperature Control: ${gpt4.temperature ? 'Yes' : 'No'}`);
    console.log(`  Knowledge Cutoff: ${gpt4.knowledge || 'Unknown'}`);
    console.log(`  Release Date: ${gpt4.release_date || 'Unknown'}`);
    console.log(`  Last Updated: ${gpt4.last_updated || 'Unknown'}`);
    console.log(`  Context Window: ${gpt4.limit?.context?.toLocaleString() || 'Unknown'} tokens`);
    console.log(`  Max Output: ${gpt4.limit?.output?.toLocaleString() || 'Unknown'} tokens`);
    console.log(`  Input Price: $${gpt4.cost?.input || 0}/1M tokens`);
    console.log(`  Output Price: $${gpt4.cost?.output || 0}/1M tokens`);
    console.log(`  Input Modalities: ${gpt4.modalities?.input?.join(', ') || 'Unknown'}`);
    console.log(`  Output Modalities: ${gpt4.modalities?.output?.join(', ') || 'Unknown'}`);
    console.log(`  Open Weights: ${gpt4.open_weights ? 'Yes' : 'No'}`);
    console.log();
}

const claude35Sonnet = getModel('claude-3-5-sonnet-20241022');
if (claude35Sonnet) {
    console.log('Claude 3.5 Sonnet Details:');
    console.log(`  Name: ${claude35Sonnet.name}`);
    console.log(`  Provider: ${claude35Sonnet.provider}`);
    console.log(`  ID: ${claude35Sonnet.id}`);
    console.log(`  Vision Support: ${claude35Sonnet.attachment ? 'Yes' : 'No'}`);
    console.log(`  Tool Calling: ${claude35Sonnet.tool_call ? 'Yes' : 'No'}`);
    console.log(`  Reasoning: ${claude35Sonnet.reasoning ? 'Yes' : 'No'}`);
    console.log(`  Context Window: ${claude35Sonnet.limit?.context?.toLocaleString() || 'Unknown'} tokens`);
    console.log(`  Max Output: ${claude35Sonnet.limit?.output?.toLocaleString() || 'Unknown'} tokens`);
    console.log(`  Input Price: $${claude35Sonnet.cost?.input || 0}/1M tokens`);
    console.log(`  Output Price: $${claude35Sonnet.cost?.output || 0}/1M tokens`);
    console.log();
}

// Compare similar models
console.log('⚖️ Model Comparisons:');

// Compare GPT models
console.log('GPT Models Comparison:');
const gptModels = searchModels({ query: 'gpt', providers: 'openai' });
gptModels.slice(0, 5).forEach(model => {
    const features = [];
    if (model.attachment) features.push('Vision');
    if (model.tool_call) features.push('Tools');
    if (model.reasoning) features.push('Reasoning');

    console.log(`  ${model.name}:`);
    console.log(`    Price: $${model.cost?.input || 0}/$${model.cost?.output || 0} (in/out per 1M tokens)`);
    console.log(`    Context: ${model.limit?.context?.toLocaleString() || 'Unknown'} tokens`);
    console.log(`    Features: ${features.join(', ') || 'Basic'}`);
    console.log(`    Knowledge: ${model.knowledge || 'Unknown'}`);
});
console.log();

// Compare Claude models
console.log('Claude Models Comparison:');
const claudeModels = searchModels({ query: 'claude', providers: 'anthropic' });
claudeModels.forEach(model => {
    const features = [];
    if (model.attachment) features.push('Vision');
    if (model.tool_call) features.push('Tools');
    if (model.reasoning) features.push('Reasoning');

    console.log(`  ${model.name}:`);
    console.log(`    Price: $${model.cost?.input || 0}/$${model.cost?.output || 0} (in/out per 1M tokens)`);
    console.log(`    Context: ${model.limit?.context?.toLocaleString() || 'Unknown'} tokens`);
    console.log(`    Features: ${features.join(', ') || 'Basic'}`);
    console.log(`    Knowledge: ${model.knowledge || 'Unknown'}`);
});
console.log();

// Feature analysis
console.log('🔍 Feature Analysis:');

// Models with the largest context windows
console.log('Largest Context Windows:');
const largeContext = searchModels({
    sortBy: 'context_window',
    sortOrder: 'desc',
    limit: 5
}).filter(m => m.limit?.context);

largeContext.forEach((model, i) => {
    console.log(`  ${i + 1}. ${model.name} (${model.provider}): ${model.limit?.context?.toLocaleString()} tokens`);
});
console.log();

// Most capable models (all features)
console.log('Most Capable Models (Vision + Tools + Reasoning):');
const mostCapable = searchModels({
    features: { vision: true, tools: true, reasoning: true },
    sortBy: 'input_price',
    sortOrder: 'asc'
});

if (mostCapable.length > 0) {
    mostCapable.slice(0, 5).forEach(model => {
        console.log(`  ${model.name} (${model.provider})`);
        console.log(`    Price: $${model.cost?.input || 0}/1M input tokens`);
        console.log(`    Context: ${model.limit?.context?.toLocaleString() || 'Unknown'} tokens`);
        console.log(`    Knowledge: ${model.knowledge || 'Unknown'}`);
    });
} else {
    console.log('  No models found with all three features (Vision + Tools + Reasoning)');
}
console.log();

// Latest models
console.log('🆕 Recently Updated Models:');
const allModels = searchModels({});
const modelsWithDates = allModels.filter(m => m.last_updated);

// Sort by last_updated date (most recent first)
const recentModels = modelsWithDates.sort((a, b) => {
    const dateA = new Date(a.last_updated).getTime();
    const dateB = new Date(b.last_updated).getTime();
    return dateB - dateA;
}).slice(0, 8);

recentModels.forEach(model => {
    const features = [];
    if (model.attachment) features.push('Vision');
    if (model.tool_call) features.push('Tools');
    if (model.reasoning) features.push('Reasoning');

    console.log(`  ${model.name} (${model.provider})`);
    console.log(`    Last Updated: ${model.last_updated}`);
    console.log(`    Features: ${features.join(', ') || 'Basic'}`);
    console.log(`    Price: $${model.cost?.input || 0}/1M input tokens`);
});
console.log();

// Specialty model types
console.log('🎨 Specialty Model Types:');

// Open source models
const openSource = searchModels({}).filter(m => m.open_weights);
if (openSource.length > 0) {
    console.log(`Open Source Models (${openSource.length} total):`);
    openSource.slice(0, 5).forEach(model => {
        console.log(`  ${model.name} (${model.provider})`);
    });
    if (openSource.length > 5) {
        console.log(`  ... and ${openSource.length - 5} more`);
    }
} else {
    console.log('Open Source Models: None found');
}
console.log();

// Models with multimodal support
const multimodal = searchModels({}).filter(m =>
    m.modalities?.input && m.modalities.input.length > 1
);
if (multimodal.length > 0) {
    console.log(`Multimodal Models (${multimodal.length} total):`);
    multimodal.slice(0, 5).forEach(model => {
        console.log(`  ${model.name} (${model.provider})`);
        console.log(`    Input: ${model.modalities?.input?.join(', ')}`);
        console.log(`    Output: ${model.modalities?.output?.join(', ')}`);
    });
} else {
    console.log('Multimodal Models: None found');
} 