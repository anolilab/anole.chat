import { v } from "convex/values";

export const extendedUserFields = {
    customerId: v.optional(v.string()),
    credits: v.number().default(100), // Default 100 credits for new users
    email: v.string(),
};

export const userSettingsFields = {
    codeFont: v.optional(
        v.union(
            v.literal("fira-code"),
            v.literal("mono"),
            v.literal("consolas"),
            v.literal("jetbrains"),
            v.literal("source-code-pro"),
        ),
    ),
    disableExternalLinkWarning: v.optional(v.boolean()),
    hidePersonalInfo: v.optional(v.boolean()),
    isAdvancedUser: v.optional(v.boolean()),
    lastChatId: v.optional(v.string()),
    mainFont: v.optional(
        v.union(
            v.literal("inter"),
            v.literal("system"),
            v.literal("serif"),
            v.literal("mono"),
            v.literal("roboto-slab"),
        ),
    ),
    notifications: v.optional(
        v.object({ vouchReceived: v.optional(v.boolean()) }),
    ),
    onboardingCompleted: v.optional(v.boolean()),
    sendBehavior: v.optional(
        v.union(
            v.literal("enter"),
            v.literal("shiftEnter"),
            v.literal("button"),
        ),
    ),
};

export const aiUserPreferencesFields = {
    customAIProviders: v.optional(
        v.record(
            v.string(),
            v.object({
                enabled: v.boolean(),
                encryptedKey: v.string(),
                endpoint: v.string(),
                name: v.string(),
            }),
        ),
    ),
    customization: v.optional(
        v.object({
            additionalContext: v.optional(v.string()),
            aiPersonality: v.optional(v.string()),
            name: v.optional(v.string()),
            traits: v.optional(v.array(v.string())),
        }),
    ),
    customModels: v.optional(
        v.record(
            v.string(),
            v.object({
                abilities: v.array(
                    v.union(
                        v.literal("text"),
                        v.literal("image"),
                        v.literal("audio"),
                        v.literal("video"),
                        v.literal("document"),
                        v.literal("function_calling"),
                        v.literal("code"),
                        v.literal("reasoning"),
                    ),
                ),
                contextLength: v.number(),
                enabled: v.boolean(),
                maxTokens: v.number(),
                modelId: v.string(),
                name: v.optional(v.string()),
                providerId: v.union(
                    ...["openai", "anthropic", "google", "groq", "fal"].map(
                        (p) => v.literal(p),
                    ),
                    v.literal("openrouter"),
                    v.string(),
                ),
            }),
        ),
    ),
    generalProviders: v.optional(
        v.object({
            brave: v.optional(
                v.object({
                    country: v.optional(v.string()),
                    enabled: v.boolean(),
                    encryptedKey: v.string(),
                    safesearch: v.optional(
                        v.union(
                            v.literal("off"),
                            v.literal("moderate"),
                            v.literal("strict"),
                        ),
                    ),
                    searchLang: v.optional(v.string()),
                }),
            ),
            firecrawl: v.optional(
                v.object({ enabled: v.boolean(), encryptedKey: v.string() }),
            ),
            serper: v.optional(
                v.object({
                    country: v.optional(v.string()),
                    enabled: v.boolean(),
                    encryptedKey: v.string(),
                    language: v.optional(v.string()),
                }),
            ),
            supermemory: v.optional(
                v.object({ enabled: v.boolean(), encryptedKey: v.string() }),
            ),
            tavily: v.optional(
                v.object({ enabled: v.boolean(), encryptedKey: v.string() }),
            ),
        }),
    ),
    mcpServers: v.optional(
        v.array(
            v.object({
                enabled: v.boolean(),
                headers: v.optional(
                    v.array(
                        v.object({
                            key: v.string(),
                            value: v.string(),
                        }),
                    ),
                ),
                name: v.string(),
                protocol: v.union(v.literal("sse"), v.literal("http")),
                url: v.string(),
            }),
        ),
    ),
    searchIncludeSourcesByDefault: v.optional(v.boolean()),
    searchProvider: v.optional(
        v.union(
            v.literal("firecrawl"),
            v.literal("brave"),
            v.literal("tavily"),
            v.literal("serper"),
        ),
    ),
    selectedModel: v.optional(v.string()),
    showTimestamps: v.optional(v.boolean()),
};
