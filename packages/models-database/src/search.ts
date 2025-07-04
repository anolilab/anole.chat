/**
 * @anolilab/models-database
 * 
 * AI models database search and query functionality.
 * 
 * Data Source: models.dev - An open-source database of AI models by SST
 * Repository: https://github.com/sst/models.dev/tree/dev
 * API: https://models.dev/api.json
 * 
 * This package provides TypeScript interfaces and search functionality
 * for the comprehensive AI models database maintained by the SST team.
 */

import modelsData from './models.json' with { type: "json" };

export interface ModelInfo {
    id: string;
    name: string;
    provider: string;
    attachment?: boolean;
    reasoning?: boolean;
    temperature?: boolean;
    tool_call?: boolean;
    knowledge?: string;
    release_date?: string;
    last_updated?: string;
    modalities?: {
        input?: string[];
        output?: string[];
    };
    open_weights?: boolean;
    cost?: {
        input?: number;
        output?: number;
        cache_read?: number;
        cache_write?: number;
    };
    limit?: {
        context?: number;
        output?: number;
    };
    [key: string]: any;
}

export interface ProviderInfo {
    id: string;
    name: string;
    models: Record<string, any>; // Raw model data from models.dev
    env?: string[];
    npm?: string;
    api?: string;
    doc?: string;
    [key: string]: any; // Allow additional properties
}

export interface SearchOptions {
    /** Search term to match against model name, id, or provider */
    query?: string;
    /** Filter by specific provider(s) */
    providers?: string | string[];
    /** Filter by features */
    features?: {
        vision?: boolean;
        tools?: boolean;
        reasoning?: boolean;
        streaming?: boolean;
    };
    /** Filter by pricing */
    pricing?: {
        maxInputPrice?: number;
        maxOutputPrice?: number;
        freeOnly?: boolean;
    };
    /** Filter by context window size */
    contextWindow?: {
        min?: number;
        max?: number;
    };
    /** Sort results by field */
    sortBy?: 'name' | 'provider' | 'input_price' | 'output_price' | 'context_window';
    /** Sort order */
    sortOrder?: 'asc' | 'desc';
    /** Maximum number of results */
    limit?: number;
}

class ModelsSearch {
    private models: ModelInfo[] = [];
    private providers: Record<string, ProviderInfo> = {};

    constructor() {
        this.loadModels();
    }

    private loadModels() {
        this.providers = modelsData as any; // Raw data from models.dev
        this.models = [];

        for (const [providerId, providerData] of Object.entries(this.providers)) {
            if (providerData.models) {
                for (const [modelId, modelData] of Object.entries(providerData.models)) {
                    this.models.push({
                        ...modelData,
                        id: modelId,
                        provider: providerId,
                    } as ModelInfo);
                }
            }
        }
    }

    /**
     * Search for models based on criteria
     */
    search(options: SearchOptions = {}): ModelInfo[] {
        let results = [...this.models];

        // Text search
        if (options.query) {
            const searchTerm = options.query.toLowerCase();
            results = results.filter(model =>
                model.id.toLowerCase().includes(searchTerm) ||
                model.name.toLowerCase().includes(searchTerm) ||
                model.provider.toLowerCase().includes(searchTerm)
            );
        }

        // Provider filter
        if (options.providers) {
            const providerList = Array.isArray(options.providers)
                ? options.providers
                : [options.providers];
            const normalizedProviders = providerList.map(p => p.toLowerCase());
            results = results.filter(model =>
                normalizedProviders.includes(model.provider.toLowerCase())
            );
        }

        // Features filter
        if (options.features) {
            results = results.filter(model => {
                if (options.features!.vision !== undefined &&
                    model.attachment !== options.features!.vision) return false;
                if (options.features!.tools !== undefined &&
                    model.tool_call !== options.features!.tools) return false;
                if (options.features!.reasoning !== undefined &&
                    model.reasoning !== options.features!.reasoning) return false;
                if (options.features!.streaming !== undefined &&
                    model.temperature !== options.features!.streaming) return false;
                return true;
            });
        }

        // Pricing filter
        if (options.pricing) {
            results = results.filter(model => {
                if (options.pricing!.freeOnly && model.cost &&
                    (model.cost.input || model.cost.output)) return false;
                if (options.pricing!.maxInputPrice !== undefined &&
                    model.cost?.input &&
                    model.cost.input > options.pricing!.maxInputPrice) return false;
                if (options.pricing!.maxOutputPrice !== undefined &&
                    model.cost?.output &&
                    model.cost.output > options.pricing!.maxOutputPrice) return false;
                return true;
            });
        }

        // Context window filter
        if (options.contextWindow) {
            results = results.filter(model => {
                if (!model.limit?.context) return false;
                if (options.contextWindow!.min !== undefined &&
                    model.limit.context < options.contextWindow!.min) return false;
                if (options.contextWindow!.max !== undefined &&
                    model.limit.context > options.contextWindow!.max) return false;
                return true;
            });
        }

        // Sort results
        if (options.sortBy) {
            results.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (options.sortBy) {
                    case 'name':
                        aValue = a.name.toLowerCase();
                        bValue = b.name.toLowerCase();
                        break;
                    case 'provider':
                        aValue = a.provider.toLowerCase();
                        bValue = b.provider.toLowerCase();
                        break;
                    case 'input_price':
                        aValue = a.cost?.input ?? Number.POSITIVE_INFINITY;
                        bValue = b.cost?.input ?? Number.POSITIVE_INFINITY;
                        break;
                    case 'output_price':
                        aValue = a.cost?.output ?? Number.POSITIVE_INFINITY;
                        bValue = b.cost?.output ?? Number.POSITIVE_INFINITY;
                        break;
                    case 'context_window':
                        aValue = a.limit?.context ?? 0;
                        bValue = b.limit?.context ?? 0;
                        break;
                    default:
                        return 0;
                }

                const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                return options.sortOrder === 'desc' ? -comparison : comparison;
            });
        }

        // Limit results
        if (options.limit) {
            results = results.slice(0, options.limit);
        }

        return results;
    }

    /**
     * Get a specific model by ID and provider
     */
    getModel(modelId: string, providerId?: string): ModelInfo | undefined {
        if (providerId) {
            return this.models.find(m => m.id === modelId && m.provider === providerId);
        }
        return this.models.find(m => m.id === modelId);
    }

    /**
     * Get all models from a specific provider
     */
    getModelsByProvider(providerId: string): ModelInfo[] {
        return this.models.filter(m => m.provider.toLowerCase() === providerId.toLowerCase());
    }

    /**
     * Get provider information
     */
    getProvider(providerId: string): ProviderInfo | undefined {
        return this.providers[providerId];
    }

    /**
     * Get all providers with model counts
     */
    getProviders(): Array<{ id: string; name: string; count: number }> {
        return Object.entries(this.providers).map(([id, provider]) => ({
            id,
            name: provider.name || id,
            count: Object.keys(provider.models || {}).length,
        }));
    }

    /**
     * Get statistics about the models database
     */
    getStats() {
        const totalModels = this.models.length;
        const totalProviders = Object.keys(this.providers).length;

        const features = {
            vision: this.models.filter(m => m.attachment).length,
            tools: this.models.filter(m => m.tool_call).length,
            reasoning: this.models.filter(m => m.reasoning).length,
            streaming: this.models.filter(m => m.temperature).length,
        };

        const pricing = {
            free: this.models.filter(m => !m.cost || (!m.cost.input && !m.cost.output)).length,
            paid: this.models.filter(m => m.cost && (m.cost.input || m.cost.output)).length,
        };

        return {
            totalModels,
            totalProviders,
            features,
            pricing,
        };
    }

    /**
     * Get all models (for direct access)
     */
    getAllModels(): ModelInfo[] {
        return [...this.models];
    }
}

// Create a singleton instance
const modelsSearch = new ModelsSearch();

// Export convenience functions
export function searchModels(options?: SearchOptions): ModelInfo[] {
    return modelsSearch.search(options);
}

export function getModel(modelId: string, providerId?: string): ModelInfo | undefined {
    return modelsSearch.getModel(modelId, providerId);
}

export function getModelsByProvider(providerId: string): ModelInfo[] {
    return modelsSearch.getModelsByProvider(providerId);
}

export function getProvider(providerId: string): ProviderInfo | undefined {
    return modelsSearch.getProvider(providerId);
}

export function getProviders(): Array<{ id: string; name: string; count: number }> {
    return modelsSearch.getProviders();
}

export function getStats() {
    return modelsSearch.getStats();
}

export function getAllModels(): ModelInfo[] {
    return modelsSearch.getAllModels();
}

// Export the class for advanced usage
export { ModelsSearch }; 