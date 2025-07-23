import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MCPServerConfig } from "@/types/mcp";

import type { MCPConfigStorage } from "./create-mcp-clients-manager";
import { createMCPClientsManager, MCPClientsManager } from "./create-mcp-clients-manager";

// Mock dependencies
vi.mock("./create-mcp-client", () => {
    return {
        createMCPClient: vi.fn(),
    };
});

vi.mock("./mcp-tool-id", () => {
    return {
        createMCPToolId: vi.fn((serverName, toolName) => `${serverName}:${toolName}`),
    };
});

vi.mock("lib/utils", () => {
    return {
        Locker: vi.fn(() => {
            return {
                isLocked: false,
                lock: vi.fn(),
                unlock: vi.fn(),
                wait: vi.fn(),
            };
        }),
    };
});

vi.mock("ts-safe", () => {
    return {
        safe: vi.fn((function_) => {
            return {
                // ifOk: vi.fn((nextFn) => ({
                ifOk: vi.fn((anotherFunction) => {
                    return {
                        watch: vi.fn((watchFunction) => {
                            return {
                                unwrap: vi.fn(() => {
                                    function_();

                                    // nextFn();
                                    if (typeof anotherFunction === "function") {
                                        return anotherFunction();
                                    }

                                    watchFunction();
                                }),
                            };
                        }),
                    };
                }),
                // })),
            };
        }),
    };
});

const mockCreateMCPClient = await import("./create-mcp-client").then((m) => m.createMCPClient);

describe("MCPClientsManager", () => {
    let manager: MCPClientsManager;
    let mockStorage: MCPConfigStorage;
    let mockClient: any;

    const mockServerConfig: MCPServerConfig = {
        args: ["test.py"],
        command: "python",
    };

    const mockServer = {
        config: mockServerConfig,
        createdAt: new Date(),
        enabled: true,
        id: "test-server",
        name: "test-server",
        updatedAt: new Date(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock process.on to prevent actual listener registration
        vi.spyOn(process, "on").mockImplementation(() => process);

        mockClient = {
            connect: vi.fn().mockResolvedValue(undefined),
            disconnect: vi.fn().mockResolvedValue(undefined),
            getInfo: vi.fn(() => {
                return {
                    config: mockServerConfig,
                    name: "test-server",
                    status: "connected" as const,
                    toolInfo: [
                        {
                            description: "A test tool",
                            inputSchema: {},
                            name: "test-tool",
                        },
                    ],
                };
            }),
            tools: {
                "test-tool": vi.fn(),
            },
        };

        vi.mocked(mockCreateMCPClient).mockReturnValue(mockClient);

        mockStorage = {
            delete: vi.fn(),
            get: vi.fn(),
            has: vi.fn(),
            init: vi.fn(),
            loadAll: vi.fn().mockResolvedValue([]),
            save: vi.fn(),
        };
    });

    afterEach(async () => {
        vi.clearAllTimers();

        // Clean up any manager instances to prevent memory leaks
        if (manager) {
            await manager.cleanup();
        }
    });

    describe("constructor", () => {
        it("should create manager without storage", () => {
            manager = new MCPClientsManager();
            expect(manager).toBeInstanceOf(MCPClientsManager);
        });

        it("should create manager with storage", () => {
            manager = new MCPClientsManager(mockStorage);
            expect(manager).toBeInstanceOf(MCPClientsManager);
        });

        it("should create manager with custom auto-disconnect timeout", () => {
            manager = new MCPClientsManager(mockStorage, 1800); // 30 minutes
            expect(manager).toBeInstanceOf(MCPClientsManager);
        });
    });

    describe("init", () => {
        beforeEach(() => {
            manager = new MCPClientsManager(mockStorage);
        });

        it("should initialize without storage", async () => {
            manager = new MCPClientsManager();
            await expect(manager.init()).resolves.toBeUndefined();
        });

        it("should initialize with storage and load existing configs", async () => {
            vi.mocked(mockStorage.loadAll).mockResolvedValue([mockServer]);

            await manager.init();

            expect(mockStorage.init).toHaveBeenCalledWith(manager);
            expect(mockStorage.loadAll).toHaveBeenCalled();
            expect(mockCreateMCPClient).toHaveBeenCalledWith("test-server", mockServerConfig, { autoDisconnectSeconds: 1800 });
            expect(mockClient.connect).toHaveBeenCalled();
        });

        it("should handle storage initialization errors", async () => {
            vi.mocked(mockStorage.init).mockRejectedValue(new Error("Storage error"));

            await expect(manager.init()).rejects.toThrow("Storage error");
        });
    });

    describe("addClient", () => {
        beforeEach(async () => {
            manager = new MCPClientsManager(mockStorage);
            await manager.init();
        });

        it("should add new client", async () => {
            await manager.addClient("new-server", "new-server", mockServerConfig);

            expect(mockCreateMCPClient).toHaveBeenCalledWith("new-server", mockServerConfig, { autoDisconnectSeconds: 1800 });
            expect(mockClient.connect).toHaveBeenCalled();
        });

        it("should replace existing client", async () => {
            // Add first client
            await manager.addClient("test-server", "test-server", mockServerConfig);

            const firstClient = mockClient;
            const secondClient = { ...mockClient, disconnect: vi.fn() };

            vi.mocked(mockCreateMCPClient).mockReturnValue(secondClient);

            // Add client with same ID
            await manager.addClient("test-server", "test-server", mockServerConfig);

            expect(firstClient.disconnect).toHaveBeenCalled();
            expect(secondClient.connect).toHaveBeenCalled();
        });
    });

    describe("persistClient", () => {
        beforeEach(async () => {
            manager = new MCPClientsManager(mockStorage);
            await manager.init();
        });

        it("should persist client with storage", async () => {
            const serverToSave = {
                config: mockServerConfig,
                name: "new-server",
            };

            vi.mocked(mockStorage.save).mockResolvedValue({
                ...serverToSave,
                id: "new-server-id",
            });

            await manager.persistClient(serverToSave);

            expect(mockStorage.save).toHaveBeenCalledWith(serverToSave);
            expect(mockCreateMCPClient).toHaveBeenCalledWith("new-server", mockServerConfig, { autoDisconnectSeconds: 1800 });
        });

        it("should persist client without storage", async () => {
            manager = new MCPClientsManager();
            await manager.init();

            const serverToSave = {
                config: mockServerConfig,
                name: "new-server",
            };

            await manager.persistClient(serverToSave);

            expect(mockCreateMCPClient).toHaveBeenCalledWith("new-server", mockServerConfig, { autoDisconnectSeconds: 1800 });
        });
    });

    describe("removeClient", () => {
        beforeEach(async () => {
            manager = new MCPClientsManager(mockStorage);
            await manager.init();
            await manager.addClient("test-server", "test-server", mockServerConfig);
        });

        it("should remove client with storage", async () => {
            vi.mocked(mockStorage.has).mockResolvedValue(true);

            await manager.removeClient("test-server");

            expect(mockStorage.has).toHaveBeenCalledWith("test-server");
            expect(mockStorage.delete).toHaveBeenCalledWith("test-server");
            expect(mockClient.disconnect).toHaveBeenCalled();
        });

        it("should remove client without storage persistence", async () => {
            vi.mocked(mockStorage.has).mockResolvedValue(false);

            await manager.removeClient("test-server");

            expect(mockStorage.has).toHaveBeenCalledWith("test-server");
            expect(mockStorage.delete).not.toHaveBeenCalled();
            expect(mockClient.disconnect).toHaveBeenCalled();
        });

        it("should handle removing non-existent client", async () => {
            vi.mocked(mockStorage.has).mockResolvedValue(false);

            await manager.removeClient("non-existent");

            expect(mockStorage.delete).not.toHaveBeenCalled();
        });
    });

    describe("refreshClient", () => {
        beforeEach(async () => {
            manager = new MCPClientsManager(mockStorage);
            await manager.init();
            await manager.addClient("test-server", "test-server", mockServerConfig);
        });

        it("should refresh client with storage", async () => {
            const updatedConfig = { args: ["test.js"], command: "node" };
            const updatedServer = {
                ...mockServer,
                config: updatedConfig,
            };

            vi.mocked(mockStorage.get).mockResolvedValue(updatedServer);

            const newClient = { ...mockClient };

            vi.mocked(mockCreateMCPClient).mockReturnValue(newClient);

            await manager.refreshClient("test-server");

            expect(mockStorage.get).toHaveBeenCalledWith("test-server");
            expect(mockCreateMCPClient).toHaveBeenCalledWith("test-server", updatedConfig, { autoDisconnectSeconds: 1800 });
        });

        it("should refresh client without storage", async () => {
            manager = new MCPClientsManager();
            await manager.init();
            await manager.addClient("test-server", "test-server", mockServerConfig);

            const newClient = { ...mockClient };

            vi.mocked(mockCreateMCPClient).mockReturnValue(newClient);

            await manager.refreshClient("test-server");

            expect(mockCreateMCPClient).toHaveBeenCalledWith("test-server", mockServerConfig, { autoDisconnectSeconds: 1800 });
        });

        it("should throw error for non-existent client", async () => {
            await expect(manager.refreshClient("non-existent")).rejects.toThrow("Client non-existent not found");
        });

        it("should throw error when storage client not found", async () => {
            vi.mocked(mockStorage.get).mockResolvedValue(null);

            await expect(manager.refreshClient("test-server")).rejects.toThrow("Client test-server not found");
        });
    });

    describe("getClients", () => {
        beforeEach(async () => {
            manager = new MCPClientsManager(mockStorage);
            await manager.init();
        });

        it("should return empty array when no clients", async () => {
            const clients = await manager.getClients();

            expect(clients).toEqual([]);
        });

        it("should return all clients", async () => {
            await manager.addClient("server1", "server1", mockServerConfig);
            await manager.addClient("server2", "server2", mockServerConfig);

            const clients = await manager.getClients();

            expect(clients).toHaveLength(2);
            expect(clients[0]).toEqual({
                client: mockClient,
                id: "server1",
            });
            expect(clients[1]).toEqual({
                client: mockClient,
                id: "server2",
            });
        });
    });

    describe("tools", () => {
        beforeEach(async () => {
            manager = new MCPClientsManager(mockStorage);
            await manager.init();
        });

        it("should return empty object when no clients", async () => {
            const tools = await manager.tools();

            expect(tools).toEqual({});
        });

        it("should exclude clients with no tools", async () => {
            const clientWithoutTools = {
                ...mockClient,
                getInfo: vi.fn(() => {
                    return {
                        config: mockServerConfig,
                        name: "empty-server",
                        status: "connected" as const,
                        toolInfo: [],
                    };
                }),
                tools: {},
            };

            vi.mocked(mockCreateMCPClient).mockReturnValue(clientWithoutTools);
            await manager.addClient("empty-server", "empty-server", mockServerConfig);

            const tools = await manager.tools();

            expect(tools).toEqual({});
        });
    });

    describe("cleanup", () => {
        beforeEach(async () => {
            manager = new MCPClientsManager(mockStorage);
            await manager.init();
        });

        it("should disconnect all clients", async () => {
            await manager.addClient("server1", "server1", mockServerConfig);
            await manager.addClient("server2", "server2", mockServerConfig);

            await manager.cleanup();

            expect(mockClient.disconnect).toHaveBeenCalledTimes(2);
        });

        it("should clear clients map", async () => {
            await manager.addClient("test-server", "test-server", mockServerConfig);

            await manager.cleanup();

            const clients = await manager.getClients();

            expect(clients).toEqual([]);
        });
    });

    describe("createMCPClientsManager factory function", () => {
        it("should create manager without storage", () => {
            const manager = createMCPClientsManager();

            expect(manager).toBeInstanceOf(MCPClientsManager);
        });

        it("should create manager with storage", () => {
            const manager = createMCPClientsManager(mockStorage);

            expect(manager).toBeInstanceOf(MCPClientsManager);
        });

        it("should create manager with custom timeout", () => {
            const manager = createMCPClientsManager(mockStorage, 3600);

            expect(manager).toBeInstanceOf(MCPClientsManager);
        });
    });

    describe("process signal handlers", () => {
        it("should register cleanup handlers for SIGINT and SIGTERM", () => {
            // Clear previous mocks for this specific test
            vi.clearAllMocks();
            const processSpy = vi.spyOn(process, "on").mockImplementation(() => process);

            new MCPClientsManager(mockStorage);

            expect(processSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function));
            expect(processSpy).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
        });
    });
});
