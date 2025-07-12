import { createAnthropic } from "@ai-sdk/anthropic";
import { createFal } from "@ai-sdk/fal";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import type { ProviderV1 } from "@ai-sdk/provider";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, GROQ_API_KEY, FAL_API_KEY } from "../../env";

export const CoreProviders = ["openai", "anthropic", "google", "groq", "fal"] as const;
export type CoreProvider = (typeof CoreProviders)[number];
export type ModelDefinitionProviders =
    | CoreProvider // user BYOK key
    | `internal-${CoreProvider}` // internal API key
    | "openrouter";

export type RegistryKey = `${ModelDefinitionProviders | string}:${string}`;
export type Provider = RegistryKey extends `${infer P}:${string}` ? P : never;

export type BaseAspects = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "2:3" | "3:2";
export type BaseResolution = `${number}x${number}`;
export type AllAspects = (BaseAspects | `${BaseAspects}-hd`) & {};
export type ImageSize = (AllAspects | BaseResolution) & {};

export type SharedModel = {
    abilities: string[];
    adapters: RegistryKey[];
    contextLength?: number;
    customIcon?: "stability-ai" | "openai" | "bflabs" | "google" | "meta";
    id: string;
    maxTokens?: number;
    mode?: "text" | "image" | "speech-to-text";
    name: string;
    shortName?: string;
    supportedImageSizes?: ImageSize[];
    supportsDisablingReasoning?: boolean;
};

export const MODELS_SHARED: SharedModel[] = [
    {
        abilities: ["text", "function_calling", "image", "document", "reasoning"],
        adapters: ["openai:gpt-4o", "openrouter:openai/gpt-4o"],
        id: "gpt-4o",
        name: "GPT 4o",
        shortName: "4o",
    },
    {
        abilities: ["text", "function_calling", "image", "document", "reasoning"],
        adapters: ["internal-openai:gpt-4o-mini", "openai:gpt-4o-mini", "openrouter:openai/gpt-4o-mini"],
        id: "gpt-4o-mini",
        name: "GPT 4o mini",
        shortName: "4o mini",
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: ["openai:o3-mini", "openrouter:openai/o3-mini"],
        id: "o3-mini",
        name: "o3 mini",
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: ["openai:o4-mini", "openrouter:openai/o4-mini"],
        id: "o4-mini",
        name: "o4 mini",
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: ["openai:o3", "openrouter:openai/o3"],
        id: "o3",
        name: "o3",
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: ["openai:o3-pro", "openrouter:openai/o3-pro"],
        id: "o3-pro",
        name: "o3 pro",
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: ["openai:gpt-4.1", "openrouter:openai/gpt-4.1"],
        id: "gpt-4.1",
        name: "GPT 4.1",
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: ["internal-openai:gpt-4.1-mini", "openai:gpt-4.1-mini", "openrouter:openai/gpt-4.1-mini"],
        id: "gpt-4.1-mini",
        name: "GPT 4.1 mini",
        shortName: "4.1 mini",
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: ["internal-openai:gpt-4.1-nano", "openai:gpt-4.1-nano", "openrouter:openai/gpt-4.1-nano"],
        id: "gpt-4.1-nano",
        name: "GPT 4.1 nano",
        shortName: "4.1 nano",
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: ["anthropic:claude-opus-4-0", "openrouter:anthropic/claude-opus-4"],
        id: "claude-opus-4",
        name: "Claude Opus 4",
        shortName: "Opus 4",
        supportsDisablingReasoning: true,
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: ["anthropic:claude-sonnet-4-0", "openrouter:anthropic/claude-sonnet-4"],
        id: "claude-sonnet-4",
        name: "Claude Sonnet 4",
        shortName: "Sonnet 4",
        supportsDisablingReasoning: true,
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: ["anthropic:claude-3-7-sonnet", "openrouter:anthropic/claude-3.7-sonnet"],
        id: "claude-3-7-sonnet",
        name: "Claude Sonnet 3.7",
        shortName: "Sonnet 3.7",
        supportsDisablingReasoning: true,
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: ["anthropic:claude-3-5-sonnet", "openrouter:anthropic/claude-3.5-sonnet"],
        id: "claude-3-5-sonnet",
        name: "Claude Sonnet 3.5",
        shortName: "Sonnet 3.5",
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: ["internal-google:gemini-2.0-flash-lite", "google:gemini-2.0-flash-lite", "openrouter:google/gemini-2.0-flash-lite-001"],
        id: "gemini-2.0-flash-lite",
        name: "Gemini 2.0 Flash Lite",
        shortName: "2.0 Flash Lite",
    },
    {
        abilities: ["image", "reasoning"],
        adapters: ["internal-google:gemini-2.0-flash-exp", "google:gemini-2.0-flash-exp"],
        id: "gemini-2.0-flash-image-generation",
        name: "Gemini 2.0 Flash Imagen",
        shortName: "2.0 Flash Imagen",
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: ["internal-google:gemini-2.5-flash", "google:gemini-2.5-flash", "openrouter:google/gemini-2.5-flash"],
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        shortName: "2.5 Flash",
        supportsDisablingReasoning: true,
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: [
            "internal-google:gemini-2.5-flash-lite-preview-06-17",
            "google:gemini-2.5-flash-lite-preview-06-17",
            "openrouter:google/gemini-2.5-flash-lite-preview-06-17",
        ],
        id: "gemini-2.5-flash-lite",
        name: "Gemini 2.5 Flash Lite",
        shortName: "2.5 Flash Lite",
        supportsDisablingReasoning: true,
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: ["internal-google:gemini-2.0-flash", "google:gemini-2.0-flash", "openrouter:google/gemini-2.0-flash-001"],
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        shortName: "2.0 Flash",
    },
    {
        abilities: ["text", "function_calling", "reasoning"],
        adapters: ["google:gemini-2.5-pro", "openrouter:google/gemini-2.5-pro"],
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        shortName: "2.5 Pro",
        supportsDisablingReasoning: true,
    },
    // Image Generation Models
    {
        abilities: ["image", "reasoning"],
        adapters: ["openai:gpt-image-1"],
        id: "gpt-image-1",
        mode: "image",
        name: "GPT Image 1",
        supportedImageSizes: ["1024x1024", "1536x1024", "1024x1536"],
    },
    {
        abilities: ["image", "reasoning"],
        adapters: ["internal-fal:fal-ai/fast-lightning-sdxl", "fal:fal-ai/fast-lightning-sdxl"],
        customIcon: "stability-ai",
        id: "sdxl-lightning",
        mode: "image",
        name: "SDXL Lightning",
        shortName: "SDXL",
        supportedImageSizes: ["1:1", "1:1-hd", "3:4", "4:3", "9:16", "16:9"],
    },
    {
        abilities: ["image", "reasoning"],
        adapters: ["internal-fal:fal-ai/flux/schnell", "fal:fal-ai/flux/schnell"],
        customIcon: "bflabs",
        id: "flux-schnell",
        mode: "image",
        name: "FLUX.1 [schnell]",
        shortName: "flux.schnell",
        supportedImageSizes: ["1:1", "1:1-hd", "3:4", "4:3", "9:16", "16:9"],
    },
    {
        abilities: ["image", "reasoning"],
        adapters: ["fal:fal-ai/flux/dev"],
        customIcon: "bflabs",
        id: "flux-dev",
        mode: "image",
        name: "FLUX.1 [dev]",
        shortName: "flux.dev",
        supportedImageSizes: ["1:1", "1:1-hd", "3:4", "4:3", "9:16", "16:9"],
    },
    {
        abilities: ["document", "reasoning"],
        adapters: ["fal:fal-ai/imagen3/fast"],
        customIcon: "google",
        id: "google-imagen-3-fast",
        mode: "image",
        name: "Google Imagen 3 (Fast)",
        shortName: "Imagen 3 (Fast)",
        supportedImageSizes: ["1:1-hd", "16:9-hd", "9:16-hd", "3:4-hd", "4:3-hd"],
    },
    {
        abilities: ["document", "reasoning"],
        adapters: ["fal:fal-ai/imagen3"],
        customIcon: "google",
        id: "google-imagen-3",
        mode: "image",
        name: "Google Imagen 3",
        shortName: "Imagen 3",
        supportedImageSizes: ["1:1-hd", "16:9-hd", "9:16-hd", "3:4-hd", "4:3-hd"],
    },
    {
        abilities: ["document", "reasoning"],
        adapters: ["fal:fal-ai/imagen4/preview"],
        customIcon: "google",
        id: "google-imagen-4",
        mode: "image",
        name: "Google Imagen 4",
        shortName: "Imagen 4",
        supportedImageSizes: ["1:1-hd", "16:9-hd", "9:16-hd", "3:4-hd", "4:3-hd"],
    },
    {
        abilities: ["audio", "reasoning"],
        adapters: ["internal-groq:llama-3.1-8b-instant", "groq:llama-3.1-8b-instant"],
        customIcon: "meta",
        id: "llama-3-1-8b-instant",
        name: "Llama 3.1 8B Instant",
        shortName: "Llama 3.1 8B",
    },
    {
        abilities: ["audio", "reasoning"],
        adapters: ["groq:whisper-large-v3-turbo"],
        id: "whisper-large-v3-turbo",
        mode: "speech-to-text",
        name: "Whisper Large v3 Turbo",
    },
    {
        abilities: ["text", "reasoning"],
        adapters: ["internal-groq:meta-llama/llama-4-scout-17b-16e-instruct", "groq:meta-llama/llama-4-scout-17b-16e-instruct"],
        customIcon: "meta",
        id: "llama-4-scout-17b-16e-instruct",
        name: "Llama 4 Scout 17B 16E",
        shortName: "Llama 4 Scout 17B",
    },
    {
        abilities: ["text", "reasoning"],
        adapters: ["groq:meta-llama/llama-4-maverick-17b-128e-instruct"],
        customIcon: "meta",
        id: "llama-4-maverick-17b-128e-instruct",
        name: "Llama 4 Maverick 17B 128E Instruct",
        shortName: "Llama 4 Maverick 17B",
    },
] as const;

export const createProvider = (providerId: CoreProvider | "openrouter" | "fal", apiKey: string | "internal"): Omit<ProviderV1, "textEmbeddingModel"> => {
    if (apiKey !== "internal" && (!apiKey || apiKey.trim() === "")) {
        throw new Error("API key is required for non-internal providers");
    }

    switch (providerId) {
        case "openai":
            return createOpenAI({
                apiKey: apiKey === "internal" ? OPENAI_API_KEY : apiKey,
                compatibility: "strict",
            });
        case "anthropic":
            return createAnthropic({
                apiKey: apiKey === "internal" ? ANTHROPIC_API_KEY : apiKey,
            });
        case "google":
            return createGoogleGenerativeAI({
                apiKey: apiKey === "internal" ? GOOGLE_GENERATIVE_AI_API_KEY : apiKey,
            });
        case "groq":
            return createGroq({
                apiKey: apiKey === "internal" ? GROQ_API_KEY : apiKey,
            });
        case "openrouter":
            return createOpenRouter({
                apiKey,
            });
        case "fal":
            return createFal({
                apiKey: apiKey === "internal" ? FAL_API_KEY : apiKey,
            });
        default: {
            const exhaustiveCheck: never = providerId;
            throw new Error(`Unknown provider: ${exhaustiveCheck}`);
        }
    }
};
