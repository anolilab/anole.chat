import { describe, expect, it, vi } from "vitest";

import type { OpenAICompatibleProvider } from "./create-openai-compatiable";
import { createOpenAICompatibleModels } from "./create-openai-compatiable";

// Mock the @ai-sdk/openai-compatible module
vi.mock("@ai-sdk/openai-compatible", () => {
    return {
        createOpenAICompatible: vi.fn(() =>
            vi.fn((apiName: string) => {
                return { apiName };
            }),
        ),
    };
});

describe("createOpenAICompatibleModels", () => {
    it("should return empty providers and unsupportedModels when config is empty", () => {
        const result = createOpenAICompatibleModels([]);

        expect(result.providers).toEqual({});
        expect(result.unsupportedModels.size).toBe(0);
    });

    it("should return empty providers and unsupportedModels when config is undefined", () => {
        const result = createOpenAICompatibleModels(undefined as any);

        expect(result.providers).toEqual({});
        expect(result.unsupportedModels.size).toBe(0);
    });

    it("should create providers and models correctly", () => {
        const mockConfig: OpenAICompatibleProvider[] = [
            {
                apiKey: "TEST_API_KEY",
                baseUrl: "https://api.test.com/v1",
                models: [
                    {
                        apiName: "test-model-1",
                        supportsTools: true,
                        uiName: "Test Model 1",
                    },
                    {
                        apiName: "test-model-2",
                        supportsTools: false,
                        uiName: "Test Model 2",
                    },
                ],
                provider: "test-provider",
            },
        ];

        const result = createOpenAICompatibleModels(mockConfig);

        expect(result.providers).toHaveProperty("test-provider");
        expect(result.providers["test-provider"]).toHaveProperty("Test Model 1");
        expect(result.providers["test-provider"]).toHaveProperty("Test Model 2");
        expect(result.unsupportedModels.size).toBe(1);
    });

    it("should handle multiple providers", () => {
        const mockConfig: OpenAICompatibleProvider[] = [
            {
                apiKey: "API_KEY_1",
                baseUrl: "https://api1.test.com/v1",
                models: [
                    {
                        apiName: "model-1",
                        supportsTools: true,
                        uiName: "Model 1",
                    },
                ],
                provider: "provider-1",
            },
            {
                apiKey: "API_KEY_2",
                baseUrl: "https://api2.test.com/v1",
                models: [
                    {
                        apiName: "model-2",
                        supportsTools: false,
                        uiName: "Model 2",
                    },
                ],
                provider: "provider-2",
            },
        ];

        const result = createOpenAICompatibleModels(mockConfig);

        expect(result.providers).toHaveProperty("provider-1");
        expect(result.providers).toHaveProperty("provider-2");
        expect(result.providers["provider-1"]).toHaveProperty("Model 1");
        expect(result.providers["provider-2"]).toHaveProperty("Model 2");
        expect(result.unsupportedModels.size).toBe(1);
    });

    it("should track unsupported models correctly", () => {
        const mockConfig: OpenAICompatibleProvider[] = [
            {
                apiKey: "TEST_API_KEY",
                baseUrl: "https://api.test.com/v1",
                models: [
                    {
                        apiName: "supported-model",
                        supportsTools: true,
                        uiName: "Supported Model",
                    },
                    {
                        apiName: "unsupported-model-1",
                        supportsTools: false,
                        uiName: "Unsupported Model 1",
                    },
                    {
                        apiName: "unsupported-model-2",
                        supportsTools: false,
                        uiName: "Unsupported Model 2",
                    },
                ],
                provider: "test-provider",
            },
        ];

        const result = createOpenAICompatibleModels(mockConfig);

        expect(result.providers["test-provider"]).toHaveProperty("Supported Model");
        expect(result.providers["test-provider"]).toHaveProperty("Unsupported Model 1");
        expect(result.providers["test-provider"]).toHaveProperty("Unsupported Model 2");
        expect(result.unsupportedModels.size).toBe(2);
    });
});
