import { FILE_BASED_MCP_CONFIG } from "lib/const";

import type { MCPClientsManager } from "./create-mcp-clients-manager";
import { createMCPClientsManager } from "./create-mcp-clients-manager";
import { createDbBasedMCPConfigsStorage as createDatabaseBasedMCPConfigsStorage } from "./db-mcp-config-storage";
import { createFileBasedMCPConfigsStorage } from "./fb-mcp-config-storage";

declare global {
    var __mcpClientsManager__: MCPClientsManager;
}

if (!globalThis.__mcpClientsManager__) {
    // Choose the appropriate storage implementation based on environment
    const storage = FILE_BASED_MCP_CONFIG ? createFileBasedMCPConfigsStorage() : createDatabaseBasedMCPConfigsStorage();

    globalThis.__mcpClientsManager__ = createMCPClientsManager(storage);
}

export const initMCPManager = async () => globalThis.__mcpClientsManager__.init();

export const mcpClientsManager = globalThis.__mcpClientsManager__;
