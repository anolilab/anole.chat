# @anolilab/models-database

A TypeScript package for accessing and searching AI model information from [models.dev](https://models.dev).

**Data Source**: This package uses the comprehensive AI models database from [SST's models.dev project](https://github.com/sst/models.dev/tree/dev) - an open-source database of AI model specifications, pricing, and capabilities.

## Features

- 🔍 **Smart Search**: Search models by name, provider, features, and pricing
- 📊 **Rich Filtering**: Filter by vision capabilities, tool support, reasoning, and more
- 💰 **Price Comparison**: Sort and filter models by input/output pricing
- 🏢 **Provider Info**: Get detailed information about AI providers
- 📈 **Statistics**: Get insights about the models database
- 🚀 **Simple API**: Easy-to-use functions for all common use cases
- 🌟 **Fresh Data**: Downloads latest model data from the official [models.dev API](https://models.dev/api.json)

## Installation

```sh
npm install --save-dev @anolilab/models-database
```

```sh
yarn add -D @anolilab/models-database
```

```sh
pnpm add -D @anolilab/models-database
```

## Quick Start

### 1. Search and Query Models

```typescript
import { 
    searchModels, 
    getModel, 
    getModelsByProvider,
    getStats 
} from '@anolilab/models-database';

// Get database statistics
const stats = getStats();
console.log(`Total models: ${stats.totalModels}`);
console.log(`Vision models: ${stats.features.vision}`);

// Search for models
const gptModels = searchModels({ query: 'gpt' });
const visionModels = searchModels({ features: { vision: true } });
const affordableModels = searchModels({ 
    pricing: { maxInputPrice: 5 },
    sortBy: 'input_price' 
});

// Get specific model
const gpt4 = getModel('gpt-4');
console.log(gpt4?.name, gpt4?.cost?.input);

// Get all models from a provider
const openaiModels = getModelsByProvider('openai');
```

## API Reference

### Search Functions

#### `searchModels(options?: SearchOptions): ModelInfo[]`

Search for models with various filters:

```typescript
const results = searchModels({
    query: 'gpt',                    // Text search
    providers: ['openai', 'anthropic'], // Filter by providers
    features: {
        vision: true,                // Has vision capabilities
        tools: true,                 // Supports tool calling
        reasoning: true,             // Has reasoning capabilities
    },
    pricing: {
        maxInputPrice: 10,          // Max input price per 1M tokens
        maxOutputPrice: 30,         // Max output price per 1M tokens
        freeOnly: false             // Only free models
    },
    contextWindow: {
        min: 8000,                  // Minimum context window
        max: 128000                 // Maximum context window
    },
    sortBy: 'input_price',          // Sort by field
    sortOrder: 'asc',               // Sort order
    limit: 10                       // Max results
});
```

#### `getModel(modelId: string, providerId?: string): ModelInfo | undefined`

Get a specific model by ID:

```typescript
const gpt4 = getModel('gpt-4');
const claudeHaiku = getModel('claude-3-haiku-20240307', 'anthropic');
```

#### `getModelsByProvider(providerId: string): ModelInfo[]`

Get all models from a specific provider:

```typescript
const openaiModels = getModelsByProvider('openai');
const anthropicModels = getModelsByProvider('anthropic');
```

### Information Functions

#### `getProvider(providerId: string): ProviderInfo | undefined`

Get detailed provider information:

```typescript
const openai = getProvider('openai');
console.log(openai?.api);   // API endpoint
console.log(openai?.npm);   // NPM package
console.log(openai?.env);   // Environment variables
```

#### `getProviders(): Array<{ id: string; name: string; count: number }>`

Get all providers with model counts:

```typescript
const providers = getProviders();
providers.forEach(p => console.log(`${p.name}: ${p.count} models`));
```

#### `getStats()`

Get database statistics:

```typescript
const stats = getStats();
console.log(stats.totalModels);      // Total number of models
console.log(stats.totalProviders);   // Total number of providers
console.log(stats.features);         // Feature counts
console.log(stats.pricing);          // Pricing breakdown
```

#### `getAllModels(): ModelInfo[]`

Get all models in the database:

```typescript
const allModels = getAllModels();
```

## Types

### `ModelInfo`

```typescript
interface ModelInfo {
    id: string;
    name: string;
    provider: string;
    attachment?: boolean;        // Vision capabilities
    reasoning?: boolean;         // Reasoning capabilities  
    temperature?: boolean;       // Streaming support
    tool_call?: boolean;        // Tool calling support
    knowledge?: string;         // Knowledge cutoff
    release_date?: string;      // Release date
    last_updated?: string;      // Last update
    modalities?: {
        input?: string[];       // Input modalities
        output?: string[];      // Output modalities
    };
    open_weights?: boolean;     // Open source weights
    cost?: {
        input?: number;         // Input price per 1M tokens
        output?: number;        // Output price per 1M tokens
        cache_read?: number;    // Cache read price
        cache_write?: number;   // Cache write price
    };
    limit?: {
        context?: number;       // Context window size
        output?: number;        // Max output tokens
    };
}
```

### `SearchOptions`

```typescript
interface SearchOptions {
    query?: string;
    providers?: string | string[];
    features?: {
        vision?: boolean;
        tools?: boolean;
        reasoning?: boolean;
        streaming?: boolean;
    };
    pricing?: {
        maxInputPrice?: number;
        maxOutputPrice?: number;
        freeOnly?: boolean;
    };
    contextWindow?: {
        min?: number;
        max?: number;
    };
    sortBy?: 'name' | 'provider' | 'input_price' | 'output_price' | 'context_window';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
}
```

## Examples

### Find the best models for different use cases

```typescript
// Best free models
const freeModels = searchModels({ 
    pricing: { freeOnly: true },
    sortBy: 'context_window',
    sortOrder: 'desc' 
});

// Best vision models under $10 per 1M tokens
const affordableVision = searchModels({
    features: { vision: true },
    pricing: { maxInputPrice: 10 },
    sortBy: 'input_price'
});

// Models with large context windows
const largeContext = searchModels({
    contextWindow: { min: 100000 },
    sortBy: 'context_window',
    sortOrder: 'desc'
});

// Best reasoning models
const reasoningModels = searchModels({
    features: { reasoning: true },
    sortBy: 'input_price'
});
```

### Compare providers

```typescript
const providers = getProviders();
console.log('Provider comparison:');
providers.forEach(provider => {
    const models = getModelsByProvider(provider.id);
    const avgPrice = models.reduce((sum, m) => sum + (m.cost?.input || 0), 0) / models.length;
    console.log(`${provider.name}: ${models.length} models, avg $${avgPrice.toFixed(2)}/1M tokens`);
});
```

## Scripts

- `pnpm run download` - Download latest model data from models.dev
- `pnpm run build` - Build the package
- `pnpm run test` - Run tests
- `pnpm run examples:basic` - Basic usage example
- `pnpm run examples:search` - Search and filters example
- `pnpm run examples:providers` - Provider information example
- `pnpm run examples:pricing` - Pricing comparison example
- `pnpm run examples:details` - Model details example

## Examples

The package includes comprehensive examples in the [`examples/`](./examples/) folder:

- **[basic-usage.js](./examples/basic-usage.js)** - Core functionality and basic operations
- **[search-filters.js](./examples/search-filters.js)** - Advanced search and filtering
- **[provider-info.js](./examples/provider-info.js)** - Provider analysis and comparison
- **[pricing-comparison.js](./examples/pricing-comparison.js)** - Cost analysis and pricing insights
- **[model-details.js](./examples/model-details.js)** - In-depth model information

Run individual examples: `pnpm run examples:basic`, `pnpm run examples:search`, etc.

See the [examples README](./examples/README.md) for detailed information about each example.

## Data Source & Credits

This package uses data from the [models.dev](https://models.dev) project, which is an open-source database of AI model specifications, pricing, and capabilities created by the maintainers of [SST](https://sst.dev).

- **Source Repository**: [https://github.com/sst/models.dev](https://github.com/sst/models.dev/tree/dev)
- **API Endpoint**: [https://models.dev/api.json](https://models.dev/api.json)
- **Created by**: [SST team](https://sst.dev)

The models.dev project is a community-contributed database that addresses the lack of a single comprehensive source for AI model information. We're grateful to the SST team and contributors for maintaining this valuable resource.

## License

MIT License - see LICENSE file for details.
