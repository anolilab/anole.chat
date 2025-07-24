import equal from "fast-deep-equal";

import type { MCPServerConfig } from "@/types/mcp";

import { isMaybeMCPServerConfig } from "./is-mcp-config";

// Types of changes that can occur in configuration
export type ConfigChangeType = "add" | "remove" | "update";

/**
 * Represents a change in MCP server configuration
 */
export interface ConfigChange {
    key: string;
    type: ConfigChangeType;
    value: MCPServerConfig;
}

/**
 * Validates that a config is a valid MCP server config
 */
const validate = (config: unknown) => {
    if (!isMaybeMCPServerConfig(config)) {
        throw new Error("Invalid MCP server configuration");
    }

    return config;
};

/**
 * Detects changes between two MCP server configuration objects
 * Identifies added, removed, and updated configurations
 */
export function detectConfigChanges(previous: Record<string, unknown>, next: Record<string, unknown>): ConfigChange[] {
    const changes: ConfigChange[] = [];
    const allKeys = new Set([...Object.keys(next), ...Object.keys(previous)]);

    for (const key of allKeys) {
        const previousValue = previous[key];
        const nextValue = next[key];

        if (!(key in previous)) {
            // New configuration added
            changes.push({
                key,
                type: "add",
                value: validate(nextValue),
            });
        } else if (!(key in next)) {
            // Configuration removed
            changes.push({
                key,
                type: "remove",
                value: validate(previousValue),
            });
        } else if (!equal(previousValue, nextValue)) {
            // Configuration updated
            changes.push({
                key,
                type: "update",
                value: validate(nextValue),
            });
        }
    }

    return changes;
}
