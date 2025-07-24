import { debounce } from "@tanstack/react-pacer";
import { colorize } from "consola/utils";
import equal from "fast-deep-equal";
import { IS_EDGE_RUNTIME } from "lib/const";
import { mcpRepository } from "lib/db/repository";
import defaultLogger from "logger";

import type { MCPClientsManager, MCPConfigStorage } from "./create-mcp-clients-manager";

const logger = defaultLogger.withDefaults({
    message: colorize("gray", `${IS_EDGE_RUNTIME ? "[EdgeRuntime] " : " "}MCP Config Storage: `),
});

export function createDbBasedMCPConfigsStorage(): MCPConfigStorage {
    let manager: MCPClientsManager;

    const debounceFunction = (function_: () => void, delay: number) => {
        const debouncedFunction = debounce(function_, { wait: delay });

        debouncedFunction();
    };

    // Initializes the manager with configs from the database
    async function init(_manager: MCPClientsManager): Promise<void> {
        manager = _manager;
    }

    async function checkAndRefreshClients() {
        try {
            logger.info("Checking MCP clients Diff");
            const servers = await mcpRepository.selectAll();
            const databaseConfigs = servers
                .map((server) => {
                    return {
                        config: server.config,
                        id: server.id,
                        name: server.name,
                    };
                })
                .sort((a, b) => a.id.localeCompare(b.id));

            const managerConfigs = await manager
                .getClients()
                .then((clients) =>
                    clients.map(({ client, id }) => {
                        const info = client.getInfo();

                        return {
                            config: info.config,
                            id,
                            name: info.name,
                        };
                    }),
                )
                .then((configs) => configs.sort((a, b) => a.id.localeCompare(b.id)));

            let shouldRefresh = false;

            if (databaseConfigs.length !== managerConfigs.length) {
                shouldRefresh = true;
            } else if (!equal(databaseConfigs, managerConfigs)) {
                shouldRefresh = true;
            }

            if (shouldRefresh) {
                const refreshPromises = databaseConfigs.map(async ({ config, id, name }) => {
                    const managerConfig = await manager.getClient(id);

                    if (!managerConfig) {
                        logger.debug(`Adding MCP client ${name}`);

                        return manager.addClient(id, name, config);
                    }

                    if (
                        !equal(
                            { config, name },
                            {
                                config: managerConfig.client.getInfo().config,
                                name: managerConfig.name,
                            },
                        )
                    ) {
                        logger.debug(`Refreshing MCP client ${name}`);

                        return manager.refreshClient(id);
                    }
                });
                const deletePromises = managerConfigs
                    .filter((c) => {
                        const databaseConfig = databaseConfigs.find((c2) => c2.id === c.id);

                        return !databaseConfig;
                    })
                    .map((c) => {
                        logger.debug(`Removing MCP client ${c.name}`);

                        return manager.removeClient(c.id);
                    });

                await Promise.allSettled([...refreshPromises, ...deletePromises]);
            }
        } catch (error) {
            logger.error("Failed to check and refresh clients:", error);
        }
    }

    setInterval(() => debounceFunction(checkAndRefreshClients, 5000), 1000 * 60 * 5).unref();

    return {
        async delete(id) {
            try {
                await mcpRepository.deleteById(id);
            } catch (error) {
                logger.error(`Failed to delete MCP config "${id}" from database:",`, error);
                throw error;
            }
        },
        async get(id) {
            return mcpRepository.selectById(id);
        },
        async has(id: string): Promise<boolean> {
            try {
                const server = await mcpRepository.selectById(id);

                return !!server;
            } catch (error) {
                logger.error(`Failed to check MCP config "${id}" in database:`, error);

                return false;
            }
        },
        init,
        async loadAll() {
            try {
                const servers = await mcpRepository.selectAll();

                return servers;
            } catch (error) {
                logger.error("Failed to load MCP configs from database:", error);

                return [];
            }
        },
        async save(server) {
            try {
                return mcpRepository.save(server);
            } catch (error) {
                logger.error(`Failed to save MCP config "${server.name}" to database:`, error);
                throw error;
            }
        },
    };
}
