import { v } from "convex/values";

export const extendedUserFields = {
    customerId: v.optional(v.string()),
    email: v.string(),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("banned")),
};

export const userSettingsFields = {
    codeFont: v.optional(v.union(v.literal("fira-code"), v.literal("mono"), v.literal("consolas"), v.literal("jetbrains"), v.literal("source-code-pro"))),
    disableExternalLinkWarning: v.optional(v.boolean()),
    hidePersonalInfo: v.optional(v.boolean()),
    isAdvancedUser: v.optional(v.boolean()),
    lastChatId: v.optional(v.string()),
    mainFont: v.optional(v.union(v.literal("inter"), v.literal("system"), v.literal("serif"), v.literal("mono"), v.literal("roboto-slab"))),
    notifications: v.optional(v.object({ vouchReceived: v.optional(v.boolean()) })),
    sendBehavior: v.optional(v.union(v.literal("enter"), v.literal("shiftEnter"), v.literal("button"))),
    onboardingCompleted: v.optional(v.boolean()),
};

export const aiUserPreferencesFields = {
    searchProvider: v.optional(v.union(v.literal("firecrawl"), v.literal("brave"), v.literal("tavily"), v.literal("serper"))),
    showTimestamps: v.optional(v.boolean()),
    selectedModel: v.optional(v.string()),
    searchIncludeSourcesByDefault: v.optional(v.boolean()),
    customModels: v.optional(v.record(
        v.string(),
        v.object({
            enabled: v.boolean(),
            name: v.optional(v.string()),
            modelId: v.string(),
            providerId: v.union(...["openai", "anthropic", "google", "groq", "fal"].map((p) => v.literal(p)), v.literal("openrouter"), v.string()),
            contextLength: v.number(),
            maxTokens: v.number(),
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
                )
            ),
        }),
    )),
    mcpServers: v.optional(
        v.array(
            v.object({
                name: v.string(),
                url: v.string(),
                protocol: v.union(v.literal("sse"), v.literal("http")),
                enabled: v.boolean(),
                headers: v.optional(
                    v.array(
                        v.object({
                            key: v.string(),
                            value: v.string(),
                        }),
                    ),
                ),
            }),
        ),
    ),
    customization: v.optional(
        v.object({
            name: v.optional(v.string()),
            aiPersonality: v.optional(v.string()),
            additionalContext: v.optional(v.string()),
            traits: v.optional(v.array(v.string())),
        }),
    ),
    customAIProviders: v.optional(v.record(
        v.string(),
        v.object({
            name: v.string(),
            enabled: v.boolean(),
            endpoint: v.string(),
            encryptedKey: v.string(),
        }),
    )),
    generalProviders: v.optional(v.object({
        supermemory: v.optional(v.object({ enabled: v.boolean(), encryptedKey: v.string() })),
        firecrawl: v.optional(v.object({ enabled: v.boolean(), encryptedKey: v.string() })),
        tavily: v.optional(v.object({ enabled: v.boolean(), encryptedKey: v.string() })),
        brave: v.optional(
            v.object({
                enabled: v.boolean(),
                encryptedKey: v.string(),
                country: v.optional(v.string()),
                searchLang: v.optional(v.string()),
                safesearch: v.optional(v.union(v.literal("off"), v.literal("moderate"), v.literal("strict"))),
            }),
        ),
        serper: v.optional(
            v.object({
                enabled: v.boolean(),
                encryptedKey: v.string(),
                language: v.optional(v.string()),
                country: v.optional(v.string()),
            }),
        ),
    })),
};
