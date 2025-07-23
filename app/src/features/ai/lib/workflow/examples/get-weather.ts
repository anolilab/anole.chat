import { generateUUID } from "lib/utils";

import type { DBEdge, DBNode } from "@/types/workflow";

const INPUT_ID = generateUUID();
const OUTPUT_ID = generateUUID();
const NOTE_ID = generateUUID();
const HTTP_ID = generateUUID();
const LLM_ID = generateUUID();

export const getWeatherNodes: Partial<DBNode>[] = [
    {
        description: "Collect story requirements and preferences from user",
        id: INPUT_ID,
        kind: "input",
        name: "INPUT",
        nodeConfig: {
            kind: "input",
            outputSchema: {
                properties: {
                    region: { type: "string" },
                },
                required: ["region"],
                type: "object",
            },
        },
        uiConfig: {
            position: { x: 0, y: 0 },
            type: "default",
        },
    },
    {
        description: "Get weather data from the API",
        id: HTTP_ID,
        kind: "http",
        name: "WEATHER API",
        nodeConfig: {
            headers: [],
            kind: "http",
            method: "GET",
            outputSchema: {
                properties: {
                    response: {
                        properties: {
                            body: { type: "string" },
                            duration: { type: "number" },
                            headers: { type: "object" },
                            ok: { type: "boolean" },
                            size: { type: "number" },
                            status: { type: "number" },
                            statusText: { type: "string" },
                        },
                        type: "object",
                    },
                },
                type: "object",
            },
            query: [
                { key: "current", value: "temperature_2m" },
                { key: "hourly", value: "temperature_2m" },
                { key: "timezone", value: "auto" },
                { key: "daily", value: "sunrise,sunset" },
                {
                    key: "latitude",
                    value: { nodeId: LLM_ID, path: ["answer", "latitude"] },
                },
                {
                    key: "longitude",
                    value: { nodeId: LLM_ID, path: ["answer", "longitude"] },
                },
            ],
            timeout: 30_000,
            url: "https://api.open-meteo.com/v1/forecast",
        },
        uiConfig: {
            position: { x: 720, y: 0 },
            type: "default",
        },
    },
    {
        description: "Get latitude and longitude from the LLM",
        id: LLM_ID,
        kind: "llm",
        name: "LLM",
        nodeConfig: {
            kind: "llm",
            messages: [
                {
                    content: {
                        content: [
                            {
                                content: [
                                    {
                                        text: "What are the latitude and longitude of ",
                                        type: "text",
                                    },
                                    {
                                        attrs: {
                                            id: "e8d2314a-f81b-41e3-91ff-f235486a62f3",
                                            label: `{"nodeId":"${INPUT_ID}","path":["region"]}`,
                                        },
                                        type: "mention",
                                    },
                                ],
                                type: "paragraph",
                            },
                        ],
                        type: "doc",
                    },
                    role: "user",
                },
            ],
            model: { model: "4o", provider: "openai" },
            outputSchema: {
                properties: {
                    answer: {
                        properties: {
                            latitude: {
                                description: "Geographical latitude of the location",
                                type: "number",
                            },
                            longitude: {
                                description: "Geographical longitude of the location",
                                type: "number",
                            },
                        },
                        type: "object",
                    },
                },
                type: "object",
            },
        },
        uiConfig: {
            position: { x: 360, y: 0 },
            type: "default",
        },
    },
    {
        description: `# 🌦️ Regional Weather Lookup Workflow

This workflow retrieves weather information for a specified region by chaining together an LLM for geocoding and an HTTP request to a public weather API.

### ➡️ Execution Pipeline

1.  **Input Region**: A user provides a region name (e.g., "Seoul" or "Tokyo").
2.  **Find Coordinates (LLM)**: The LLM converts the text-based region name into geographical latitude and longitude coordinates.
3.  **Fetch Weather API (HTTP)**: The workflow uses these coordinates to call the Open-Meteo weather API and request the current forecast.
4.  **Return Weather Data (Output)**: The raw JSON response from the weather API is passed on as the final result of the workflow.

---

### 🔬 Node Output Examples

Here are examples of the output structure for the key nodes in this workflow.

#### 📍 **Find Coordinates (LLM) Output**
This node outputs the latitude and longitude in a structured object.

\`\`\`json
{
"answer": {
  "latitude": 37.5665,
  "longitude": 126.9780
}
}
\`\`\`

#### ☁️ **Fetch Weather API (HTTP) Output**
This node returns the full HTTP response. The actual weather data is located inside the \`body\` field as a JSON string.

\`\`\`json
{
"response": {
  "status": 200,
  "ok": true,
  "body": "{\"latitude\":37.56,\"longitude\":126.97,\"current\":{\"time\":\"2023-10-27T12:00\",\"temperature_2m\":15.4},\"daily\":{\"sunrise\":[\"2023-10-27T06:45\"],\"sunset\":[\"2023-10-27T17:40\"]}}",
  "duration": 150
}
}
\`\`\`
`,
        id: NOTE_ID,
        kind: "note",
        name: "NOTE",
        nodeConfig: {
            kind: "note",
            outputSchema: { properties: {}, type: "object" },
        },
        uiConfig: {
            position: {
                x: -569.879_029_258_422_9,
                y: -731.543_445_777_042_3,
            },
            type: "default",
        },
    },
    {
        description: "Output the weather data",
        id: OUTPUT_ID,
        kind: "output",
        name: "OUTPUT",
        nodeConfig: {
            kind: "output",
            outputData: [
                {
                    key: "result",
                    source: { nodeId: HTTP_ID, path: ["response", "body"] },
                },
            ],
            outputSchema: { properties: {}, type: "object" },
        },
        uiConfig: {
            position: { x: 1080, y: 0 },
            type: "default",
        },
    },
];

export const getWeatherEdges: Partial<DBEdge>[] = [
    {
        source: INPUT_ID,
        target: LLM_ID,
        uiConfig: {},
    },
    {
        source: LLM_ID,
        target: HTTP_ID,
        uiConfig: {},
    },
    {
        source: HTTP_ID,
        target: OUTPUT_ID,
        uiConfig: {},
    },
];
