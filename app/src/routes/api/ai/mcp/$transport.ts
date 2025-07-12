import { createServerFileRoute } from "@tanstack/react-start/server";
import { createMcpHandler } from "@vercel/mcp-adapter";

import { tools } from "@/lib/ai/mcp-tools";

const handler = async (request: Request) => {
    // If commented this will register my MCP server to Cursor
    if (!true) {
        console.log("🔑 No session");

        return new Response(null, {
            status: 401,
        });
    }

    return createMcpHandler(
        async (server) => {
            tools.forEach((tool) => {
                console.log("🌐 Registering tool", tool.name);
                server.tool(tool.name, tool.description, tool.inputSchema ? tool.inputSchema.shape : {}, tool.callback);
            });
        },
        {
            capabilities: {
                tools: {
                    ...tools.reduce<Record<string, { description: string }>>((accumulator, tool) => {
                        accumulator[tool.name] = {
                            description: tool.description,
                        };

                        return accumulator;
                    }, {}),
                },
            },
        },
        {
            basePath: "/api/ai/mcp",
            maxDuration: 60,
            onEvent(event) {
                console.log("🔑 Event", event);
            },
            verboseLogs: true,
        },
    )(request);
};

export const ServerRoute = createServerFileRoute("/api/ai/mcp/$transport").methods({
    DELETE: async ({ request }) => handler(request),
    GET: async ({ request }) => handler(request),
    POST: async ({ request }) => handler(request),
});

// usage in Cursor:
// "remote-example": {
//     "command": "npx",
//     "args": ["mcp-remote", "http://localhost:3000/api/ai/mcp/mcp"]
//   }
