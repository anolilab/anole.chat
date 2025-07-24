import { tool as createTool } from "ai";
import type { JSONSchema7 } from "json-schema";
import { convertJsonSchemaToZod } from "zod-from-json-schema";

export const httpFetchSchema: JSONSchema7 = {
    properties: {
        body: {
            description: "The request body (for POST, PUT, PATCH requests). Should be a JSON string if sending JSON data.",
            type: "string",
        },
        headers: {
            additionalProperties: true,
            description: "Headers to include in the request",
            properties: {},
            type: "object",
        },
        method: {
            default: "GET",
            description: "The HTTP method to use",
            enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
            type: "string",
        },
        timeout: {
            default: 10_000,
            description: "Request timeout in milliseconds",
            type: "number",
        },
        url: {
            description: "The URL to make the HTTP request to",
            type: "string",
        },
    },
    required: ["url"],
    type: "object",
};

export const httpFetchTool = createTool({
    description: "Make HTTP requests to any URL. Can be used to fetch data from APIs, send data to servers, or interact with web services.",
    execute: async ({ body, headers, method = "GET", timeout = 10_000, url }) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                body: body && method !== "GET" && method !== "HEAD" ? body : undefined,
                headers: headers ? { ...headers } : undefined,
                method,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const responseHeaders: Record<string, string> = {};

            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            let responseBody: any;
            const contentType = response.headers.get("content-type");

            if (contentType?.includes("application/json")) {
                responseBody = await response.json();
            } else if (contentType?.includes("text/")) {
                responseBody = await response.text();
            } else {
                responseBody = await response.text();
            }

            return {
                body: responseBody,
                headers: responseHeaders,
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                url: response.url,
            };
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    },
    parameters: convertJsonSchemaToZod(httpFetchSchema),
});
