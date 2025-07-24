import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { debounce } from "@tanstack/react-pacer";
import type { FSWatcher } from "chokidar";
import chokidar from "chokidar";
import { colorize } from "consola/utils";
import equal from "fast-deep-equal";
import type { McpServerSchema } from "lib/db/pg/schema.pg";
import defaultLogger from "logger";

import type { MCPServerConfig } from "@/types/mcp";

import { MCP_CONFIG_PATH } from "../lib/mcp/config-path";
import type { MCPClientsManager, MCPConfigStorage } from "./create-mcp-clients-manager";

const logger = defaultLogger.withDefaults({
    message: colorize("gray", `MCP File Config Storage: `),
});

/**
 * Creates a file-based implementation of MCPServerStorage
 */
export function createFileBasedMCPConfigsStorage(path?: string): MCPConfigStorage {
    const configPath = path || MCP_CONFIG_PATH;
    let watcher: FSWatcher | null = null;
    let manager: MCPClientsManager;
    const debounceFunction = (function_: () => void, delay: number) => {
        const debouncedFunction = debounce(function_, { wait: delay });

        debouncedFunction();
    };

    /**
     * Reads config from file
     */
    async function readConfigFile(): Promise<(typeof McpServerSchema.$inferSelect)[]> {
        try {
            const configText = await readFile(configPath, { encoding: "utf-8" });
            const config = JSON.parse(configText ?? "{}") as {
                [name: string]: MCPServerConfig;
            };

            return toMcpServerArray(config);
        } catch (error_: any) {
            if (error_.code === "ENOENT") {
                return [];
            }

            const error = error_ instanceof SyntaxError ? new Error(`Config file ${configPath} has invalid JSON: ${error_.message}`) : error_;

            throw error;
        }
    }

    /**
     * Writes config to file
     */
    async function writeConfigFile(config: Record<string, MCPServerConfig>): Promise<void> {
        const dir = dirname(configPath);

        await mkdir(dir, { recursive: true });
        await writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
    }

    async function checkAndRefreshClients() {
        try {
            logger.debug("Checking MCP clients Diff");
            const fileConfig = await readConfigFile();

            const fileConfigs = fileConfig.sort((a, b) => a.id.localeCompare(b.id));

            // Get current manager configs
            const managerConfigs = await manager
                .getClients()
                .then((clients) =>
                    clients.map(({ client, id }) => {
                        return {
                            config: client.getInfo().config,
                            id,
                            name: client.getInfo().name,
                        };
                    }),
                )
                .then((configs) => configs.sort((a, b) => a.name.localeCompare(b.name)));

            let shouldRefresh = false;

            if (fileConfigs.length !== managerConfigs.length) {
                shouldRefresh = true;
            } else if (!equal(fileConfigs, managerConfigs)) {
                shouldRefresh = true;
            }

            if (shouldRefresh) {
                const refreshPromises = fileConfigs.map(async ({ config, id, name }) => {
                    const managerConfig = await manager.getClient(id);

                    if (!managerConfig) {
                        logger.debug(`Adding MCP client ${id}`);

                        return manager.addClient(id, name, config);
                    }

                    if (!equal(managerConfig.client.getInfo().config, config)) {
                        logger.debug(`Refreshing MCP client ${id}`);

                        return manager.refreshClient(id);
                    }
                });
                const deletePromises = managerConfigs
                    .filter((c) => {
                        const fileConfig = fileConfigs.find((c2) => c2.id === c.id);

                        return !fileConfig;
                    })
                    .map((c) => {
                        logger.debug(`Removing MCP client ${c.id}`);

                        return manager.removeClient(c.id);
                    });

                await Promise.allSettled([...refreshPromises, ...deletePromises]);
            }
        } catch (error) {
            logger.error("Error checking and refreshing clients:", error);
        }
    }

    /**
     * Initializes storage by reading existing config or creating empty file
     */
    async function init(_manager: MCPClientsManager): Promise<void> {
        manager = _manager;

        // Stop existing watcher if any
        if (watcher) {
            await watcher.close();
            watcher = null;
        }

        // Ensure config file exists
        try {
            await readConfigFile();
        } catch (error: any) {
            if (error.code === "ENOENT") {
                // Create empty config file if doesn't exist
                await writeConfigFile({});
            } else {
                throw error;
            }
        }

        // Setup file watcher
        watcher = chokidar.watch(configPath, {
            awaitWriteFinish: true,
            ignoreInitial: true,
            persistent: true,
        });

        watcher.on("change", () => debounceFunction(checkAndRefreshClients, 1000));
    }

    return {
        // Deletes a configuration by name
        async delete(id) {
            const currentConfig = await readConfigFile();
            const newConfig = currentConfig.filter((s) => s.id !== id);

            await writeConfigFile(toMcpServerRecord(newConfig));
        },
        async get(id) {
            const currentConfig = await readConfigFile();

            return currentConfig.find((s) => s.id === id) ?? null;
        },
        // Checks if a configuration exists
        async has(id) {
            const currentConfig = await readConfigFile();

            return currentConfig.some((s) => s.id === id);
        },
        init,

        async loadAll() {
            return await readConfigFile();
        },
        // Saves a configuration with the given name
        async save(server) {
            const currentConfig = await readConfigFile().then(toMcpServerRecord);

            currentConfig[server.name] = server.config;
            await writeConfigFile(currentConfig);

            return fillMcpServerSchema(server);
        },
    };
}

function fillMcpServerSchema(server: typeof McpServerSchema.$inferInsert): typeof McpServerSchema.$inferSelect {
    return {
        ...server,
        createdAt: new Date(),
        enabled: true,
        id: server.name,
        updatedAt: new Date(),
    };
}

function toMcpServerArray(config: Record<string, MCPServerConfig>): (typeof McpServerSchema.$inferSelect)[] {
    return Object.entries(config).map(([name, config]) =>
        fillMcpServerSchema({
            config,
            id: name,
            name,
        }),
    );
}

function toMcpServerRecord(servers: (typeof McpServerSchema.$inferSelect)[]): Record<string, MCPServerConfig> {
    return servers.reduce(
        (accumulator, server) => {
            accumulator[server.name] = server.config;

            return accumulator;
        },
        {} as Record<string, MCPServerConfig>,
    );
}
