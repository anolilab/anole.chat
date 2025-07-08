import { tools } from "@/lib/ai/mcp-tools";
import { createServerFileRoute } from "@tanstack/react-start/server";

import { createMcpHandler } from "@vercel/mcp-adapter";

const handler = async (req: Request) => {
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
                    ...tools.reduce(
                        (acc, tool) => {
                            acc[tool.name] = {
                                description: tool.description,
                            };
                            return acc;
                        },
                        {} as Record<string, { description: string }>,
                    ),
                },
            },
        },
        {
            basePath: "/api/ai/mcp",
            verboseLogs: true,
            maxDuration: 60,
            onEvent(event) {
                console.log("🔑 Event", event);
            },
        },
    )(req);
};

export const ServerRoute = createServerFileRoute("/api/ai/mcp/$transport").methods({
    POST: async ({ request }) => {
        return handler(request);
    },
    GET: async ({ request }) => {
        return handler(request);
    },
    DELETE: async ({ request }) => {
        return handler(request);
    },
});

// usage in Cursor:
// "remote-example": {
//     "command": "npx",
//     "args": ["mcp-remote", "http://localhost:3000/api/ai/mcp/mcp"]
//   }
