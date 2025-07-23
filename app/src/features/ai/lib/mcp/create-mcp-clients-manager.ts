import type { ToolExecutionOptions } from "ai";
import type { McpServerSchema } from "lib/db/pg/schema.pg";
import { errorToString, Locker, safeJSONParse } from "lib/utils";
import logger from "logger";
import { safe } from "ts-safe";

import type { MCPServerConfig, McpServerInsert, McpServerSelect, VercelAIMcpTool } from "@/types/mcp";

import type { MCPClient } from "./create-mcp-client";
import { createMCPClient } from "./create-mcp-client";
import { createMCPToolId } from "./mcp-tool-id";

/**
 * Interface for storage of MCP server configurations.
 * Implementations should handle persistent storage of server configs.
 *
 * IMPORTANT: When implementing this interface, be aware that:
 * - Storage can be modified externally (e.g., file edited manually)
 * - Concurrent modifications may occur from multiple processes
 * - Implementations should either handle these scenarios or document limitations
 */
export interface MCPConfigStorage {
    delete: (id: string) => Promise<void>;
    get: (id: string) => Promise<McpServerSelect | null>;
    has: (id: string) => Promise<boolean>;
    init: (manager: MCPClientsManager) => Promise<void>;
    loadAll: () => Promise<McpServerSelect[]>;
    save: (server: McpServerInsert) => Promise<McpServerSelect>;
}

export class MCPClientsManager {
    protected clients = new Map<
        string,
        {
            client: MCPClient;
            name: string;
        }
    >();

    private initializedLock = new Locker();

    // Optional storage for persistent configurations
    constructor(
        private storage?: MCPConfigStorage,
        private autoDisconnectSeconds: number = 60 * 30, // 30 minutes
    ) {
        process.on("SIGINT", this.cleanup.bind(this));
        process.on("SIGTERM", this.cleanup.bind(this));
    }

    async init() {
        logger.info("Initializing MCP clients manager");

        if (this.initializedLock.isLocked) {
            logger.info("MCP clients manager already initialized, waiting for lock");

            return this.initializedLock.wait();
        }

        return safe(() => this.initializedLock.lock())
            .ifOk(async () => {
                if (this.storage) {
                    await this.storage.init(this);
                    const configs = await this.storage.loadAll();

                    this.cleanup();
                    await Promise.allSettled(
                        configs.map(({ config, id, name }) =>
                            this.addClient(id, name, config).catch(() => {
                                `ignore error`;
                            }),
                        ),
                    );
                }
            })
            .watch(() => {
                this.initializedLock.unlock();
            })
            .unwrap();
    }

    /**
     * Returns all tools from all clients as a flat object
     */
    async tools(): Promise<Record<string, VercelAIMcpTool>> {
        await this.initializedLock.wait();

        return Object.fromEntries(
            [...this.clients.entries()]
                .filter(([_, { client }]) => client.getInfo().toolInfo.length > 0)
                .flatMap(([id, { client }]) =>
                    Object.entries(client.tools).map(([name, tool]) => [
                        createMCPToolId(client.getInfo().name, name),
                        {
                            ...tool,
                            __$ref__: "mcp",
                            _mcpServerId: id,
                            _mcpServerName: client.getInfo().name,
                            _originToolName: name,
                            execute: (parameters, options: ToolExecutionOptions) => {
                                options?.abortSignal?.throwIfAborted();

                                return this.toolCall(id, name, parameters);
                            },
                        },
                    ]),
                ),
        );
    }

    /**
     * Creates and adds a new client instance to memory only (no storage persistence)
     */
    async addClient(id: string, name: string, serverConfig: MCPServerConfig) {
        if (this.clients.has(id)) {
            const previousClient = this.clients.get(id)!;

            void previousClient.client.disconnect();
        }

        const client = createMCPClient(name, serverConfig, {
            autoDisconnectSeconds: this.autoDisconnectSeconds,
        });

        this.clients.set(id, { client, name });

        return client.connect();
    }

    /**
     * Persists a new client configuration to storage and adds the client instance to memory
     */
    async persistClient(server: typeof McpServerSchema.$inferInsert) {
        let id = server.name;

        if (this.storage) {
            const entity = await this.storage.save(server);

            id = entity.id;
        }

        return this.addClient(id, server.name, server.config);
    }

    /**
     * Removes a client by name, disposing resources and removing from storage
     */
    async removeClient(id: string) {
        if (this.storage && await this.storage.has(id)) {
            await this.storage.delete(id);
        }

        const client = this.clients.get(id);

        this.clients.delete(id);

        if (client) {
            void client.client.disconnect();
        }
    }

    /**
     * Refreshes an existing client with a new configuration or its existing config
     */
    async refreshClient(id: string) {
        logger.info(`Refreshing client ${id}`);
        const previousClient = this.clients.get(id);
        const currentConfig = previousClient?.client.getInfo().config;

        if (this.storage) {
            const server = await this.storage.get(id);

            if (!server) {
                throw new Error(`Client ${id} not found`);
            }

            return this.addClient(id, server.name, server.config);
        }

        if (!currentConfig) {
            throw new Error(`Client ${id} not found`);
        }

        return this.addClient(id, previousClient.name, currentConfig);
    }

    async cleanup() {
        const clients = [...this.clients.values()];

        this.clients.clear();
        await Promise.allSettled(clients.map(({ client }) => client.disconnect()));
    }

    async getClients() {
        await this.initializedLock.wait();

        return [...this.clients.entries()].map(([id, { client }]) => {
            return {
                client,
                id,
            };
        });
    }

    async getClient(id: string) {
        await this.initializedLock.wait();
        const client = this.clients.get(id);

        if (!client) {
            await this.refreshClient(id);
        }

        return this.clients.get(id);
    }

    async toolCallByServerName(serverName: string, toolName: string, input: unknown) {
        const clients = await this.getClients();
        const client = clients.find((c) => c.client.getInfo().name === serverName);

        if (!client) {
            if (this.storage) {
                const servers = await this.storage.loadAll();
                const server = servers.find((s) => s.name === serverName);

                if (server) {
                    return this.toolCall(server.id, toolName, input);
                }
            }

            throw new Error(`Client ${serverName} not found`);
        }

        return this.toolCall(client.id, toolName, input);
    }

    async toolCall(id: string, toolName: string, input: unknown) {
        return safe(() => this.getClient(id))
            .map((client) => {
                if (!client)
                    throw new Error(`Client ${id} not found`);

                return client.client;
            })
            .map((client) => client.callTool(toolName, input))
            .map((res) => {
                if (res?.content && Array.isArray(res.content)) {
                    const parsedResult = {
                        ...res,
                        content: res.content.map((c) => {
                            if (c?.type === "text" && c?.text) {
                                const parsed = safeJSONParse(c.text);

                                return {
                                    text: parsed.success ? parsed.value : c.text,
                                    type: "text",
                                };
                            }

                            return c;
                        }),
                    };

                    return parsedResult;
                }

                return res;
            })
            .ifFail((error) => {
                return {
                    content: [],
                    error: {
                        message: errorToString(error),
                        name: error?.name || "ERROR",
                    },
                    isError: true,
                };
            })
            .unwrap();
    }
}

export function createMCPClientsManager(
    storage?: MCPConfigStorage,
    autoDisconnectSeconds: number = 60 * 30, // 30 minutes
): MCPClientsManager {
    return new MCPClientsManager(storage, autoDisconnectSeconds);
}
