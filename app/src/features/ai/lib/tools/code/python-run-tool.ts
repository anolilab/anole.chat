import { tool as createTool } from "ai";
import type { JSONSchema7 } from "json-schema";
import { convertJsonSchemaToZod } from "zod-from-json-schema";

export const pythonExecutionSchema: JSONSchema7 = {
    properties: {
        code: {
            description: `Execute Python code directly in the user's browser using Pyodide. Code runs client-side without server dependency.\n\nUse print() for output. Module imports are supported. The last expression's value will be returned if possible.\n\nOutput collection:\n// Set up stdout capture\npyodide.setStdout({\n  batched: (output: string) => {\n    const type = output.startsWith("data:image/png;base64")\n      ? "image"\n      : "data";\n    logs.push({ type: "log", args: [{ type, value: output }] });\n  },\n});\n\npyodide.setStderr({\n  batched: (output: string) => {\n    logs.push({ type: "error", args: [{ type: "data", value: output }] });\n  },\n});`,
            type: "string",
        },
    },
    required: ["code"],
    type: "object",
};

export const pythonExecutionTool = createTool({
    description: "Execute Python code directly in the user's browser using Pyodide. Code runs client-side without server dependency.",
    parameters: convertJsonSchemaToZod(pythonExecutionSchema),
});
