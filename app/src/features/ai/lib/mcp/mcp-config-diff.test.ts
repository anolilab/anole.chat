import { describe, expect, it } from "vitest";

import type { MCPServerConfig } from "@/types/mcp";

import { detectConfigChanges } from "./mcp-config-diff";

describe("MCP Config Diff", () => {
    describe("detectConfigChanges", () => {
        it("should detect added configurations", () => {
            const previous: Record<string, MCPServerConfig> = {};
            const next: Record<string, MCPServerConfig> = {
                newConfig: {
                    url: "https://example.com/sse",
                },
            };

            const changes = detectConfigChanges(previous, next);

            expect(changes.length).toBe(1);
            expect(changes[0]).toEqual({
                key: "newConfig",
                type: "add",
                value: {
                    url: "https://example.com/sse",
                },
            });
        });

        it("should detect removed configurations", () => {
            const previous: Record<string, MCPServerConfig> = {
                oldConfig: {
                    command: "python3",
                },
            };
            const next: Record<string, MCPServerConfig> = {};

            const changes = detectConfigChanges(previous, next);

            expect(changes.length).toBe(1);
            expect(changes[0]).toEqual({
                key: "oldConfig",
                type: "remove",
                value: {
                    command: "python3",
                },
            });
        });

        it("should detect updated configurations", () => {
            const previous: Record<string, MCPServerConfig> = {
                config: {
                    url: "https://old-example.com/sse",
                },
            };
            const next: Record<string, MCPServerConfig> = {
                config: {
                    url: "https://new-example.com/sse",
                },
            };

            const changes = detectConfigChanges(previous, next);

            expect(changes.length).toBe(1);
            expect(changes[0]).toEqual({
                key: "config",
                type: "update",
                value: {
                    url: "https://new-example.com/sse",
                },
            });
        });

        it("should detect multiple changes", () => {
            const previous: Record<string, MCPServerConfig> = {
                config1: {
                    url: "https://example.com/sse1",
                },
                config2: {
                    command: "python",
                },
            };
            const next: Record<string, MCPServerConfig> = {
                config1: {
                    url: "https://example.com/sse1-updated",
                },
                config3: {
                    command: "node",
                },
            };

            const changes = detectConfigChanges(previous, next);

            expect(changes.length).toBe(3);

            // Check that we have one of each type of change
            const changeTypes = changes.map((change) => change.type);

            expect(changeTypes).toContain("add");
            expect(changeTypes).toContain("remove");
            expect(changeTypes).toContain("update");

            // Verify the specific changes
            const addChange = changes.find((change) => change.type === "add");

            expect(addChange?.key).toBe("config3");

            const removeChange = changes.find((change) => change.type === "remove");

            expect(removeChange?.key).toBe("config2");

            const updateChange = changes.find((change) => change.type === "update");

            expect(updateChange?.key).toBe("config1");
        });

        it("should not detect changes for identical configurations", () => {
            const config: Record<string, MCPServerConfig> = {
                config: {
                    url: "https://example.com/sse",
                },
            };

            const changes = detectConfigChanges(config, { ...config });

            expect(changes.length).toBe(0);
        });

        it("should throw error for invalid configurations", () => {
            const previous: Record<string, unknown> = {};
            const next: Record<string, unknown> = {
                invalidConfig: {
                    type: "invalid",
                },
            };

            expect(() => detectConfigChanges(previous, next)).toThrow();
        });
    });
});
