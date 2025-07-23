import { tool as createTool } from "ai";
import { z } from "zod";

export const createPieChartTool = createTool({
    description: "Create a pie chart",
    execute: async () => "Success",
    parameters: z
        .object({
            data: z.array(z.object({ label: z.string(), value: z.number() }).strict()),
            description: z.string().optional(),
            title: z.string(),
            unit: z.string().optional(),
        })
        .strict(),
});
