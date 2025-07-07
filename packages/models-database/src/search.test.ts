import { describe, it, expect, beforeAll } from 'vitest';
import {
    searchModels,
    getModel,
    getModelsByProvider,
    getProvider,
    getProviders,
    getStats,
    getAllModels,
} from './search.js';

describe('Models Search', () => {
    let totalModels: number;

    beforeAll(() => {
        const stats = getStats();
        totalModels = stats.totalModels;
    });

    it('should get database statistics', () => {
        const stats = getStats();
        expect(stats.totalModels).toBeGreaterThan(0);
        expect(stats.totalProviders).toBeGreaterThan(0);
        expect(typeof stats.features).toBe('object');
        expect(typeof stats.pricing).toBe('object');
    });

    it('should get all models', () => {
        const models = getAllModels();
        expect(models).toHaveLength(totalModels);
        expect(models[0]).toHaveProperty('id');
        expect(models[0]).toHaveProperty('name');
        expect(models[0]).toHaveProperty('provider');
    });

    it('should search models by query', () => {
        const gptModels = searchModels({ query: 'gpt' });
        expect(gptModels.length).toBeGreaterThan(0);
        gptModels.forEach(model => {
            expect(
                model.id.toLowerCase().includes('gpt') ||
                model.name.toLowerCase().includes('gpt') ||
                model.provider.toLowerCase().includes('gpt')
            ).toBe(true);
        });
    });

    it('should filter models by provider', () => {
        const openaiModels = searchModels({ providers: 'openai' });
        expect(openaiModels.length).toBeGreaterThan(0);
        openaiModels.forEach(model => {
            expect(model.provider.toLowerCase()).toBe('openai');
        });
    });

    it('should filter models by features', () => {
        const visionModels = searchModels({ features: { vision: true } });
        visionModels.forEach(model => {
            expect(model.attachment).toBe(true);
        });
    });

    it('should limit search results', () => {
        const limitedResults = searchModels({ limit: 5 });
        expect(limitedResults).toHaveLength(5);
    });

    it('should sort models by price', () => {
        const sortedModels = searchModels({
            sortBy: 'input_price',
            sortOrder: 'asc',
            limit: 10
        });

        for (let i = 1; i < sortedModels.length; i++) {
            const prevPrice = sortedModels[i - 1].cost?.input ?? Number.POSITIVE_INFINITY;
            const currentPrice = sortedModels[i].cost?.input ?? Number.POSITIVE_INFINITY;
            expect(prevPrice).toBeLessThanOrEqual(currentPrice);
        }
    });

    it('should get specific model by ID', () => {
        const allModels = getAllModels();
        if (allModels.length > 0) {
            const firstModel = allModels[0];
            const foundModel = getModel(firstModel.id);
            expect(foundModel).toBeDefined();
            expect(foundModel?.id).toBe(firstModel.id);
        }
    });

    it('should get models by provider', () => {
        const providers = getProviders();
        if (providers.length > 0) {
            const firstProvider = providers[0];
            const providerModels = getModelsByProvider(firstProvider.id);
            expect(providerModels.length).toBe(firstProvider.count);
            providerModels.forEach(model => {
                expect(model.provider).toBe(firstProvider.id);
            });
        }
    });

    it('should get provider information', () => {
        const providers = getProviders();
        if (providers.length > 0) {
            const firstProviderId = providers[0].id;
            const provider = getProvider(firstProviderId);
            expect(provider).toBeDefined();
            expect(provider?.id).toBe(firstProviderId);
        }
    });

    it('should get all providers', () => {
        const providers = getProviders();
        expect(providers.length).toBeGreaterThan(0);
        providers.forEach(provider => {
            expect(provider).toHaveProperty('id');
            expect(provider).toHaveProperty('name');
            expect(provider).toHaveProperty('count');
            expect(provider.count).toBeGreaterThan(0);
        });
    });

    it('should filter by pricing', () => {
        const freeModels = searchModels({ pricing: { freeOnly: true } });
        freeModels.forEach(model => {
            expect(!model.cost || (!model.cost.input && !model.cost.output)).toBe(true);
        });

        const affordableModels = searchModels({ pricing: { maxInputPrice: 5 } });
        affordableModels.forEach(model => {
            if (model.cost?.input) {
                expect(model.cost.input).toBeLessThanOrEqual(5);
            }
        });
    });

    it('should filter by context window', () => {
        const largeContextModels = searchModels({
            contextWindow: { min: 100000 }
        });
        largeContextModels.forEach(model => {
            expect(model.limit?.context).toBeGreaterThanOrEqual(100000);
        });
    });
}); 