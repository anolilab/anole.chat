import { tool as createTool } from "ai";
import { z } from "zod";

export const createBarChartTool = createTool({
    description: "Create a bar chart with multiple data series",
    execute: async () => "Success",
    parameters: z
        .object({
            data: z
                .array(
                    z
                        .object({
                            series: z.array(
                                z
                                    .object({
                                        seriesName: z.string(),
                                        value: z.number(),
                                    })
                                    .strict(),
                            ),
                            xAxisLabel: z.string(),
                        })
                        .strict(),
                )
                .describe("Chart data with x-axis labels and series values"),
            description: z.string().optional(),
            title: z.string(),
            yAxisLabel: z.string().optional().describe("Label for Y-axis"),
        })
        .strict(),
});
