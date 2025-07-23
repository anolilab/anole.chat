import type { Tool } from "ai";

import { AppDefaultToolkit, DefaultToolName } from ".";
import { jsExecutionTool } from "./code/js-run-tool";
import { pythonExecutionTool } from "./code/python-run-tool";
import { httpFetchTool } from "./http/fetch";
import { createBarChartTool } from "./visualization/create-bar-chart";
import { createLineChartTool } from "./visualization/create-line-chart";
import { createPieChartTool } from "./visualization/create-pie-chart";
import { tavilySearchTool, tavilyWebContentTool } from "./web/web-search";

export const APP_DEFAULT_TOOL_KIT: Record<AppDefaultToolkit, Record<string, Tool>> = {
    [AppDefaultToolkit.Code]: {
        [DefaultToolName.JavascriptExecution]: jsExecutionTool,
        [DefaultToolName.PythonExecution]: pythonExecutionTool,
    },
    [AppDefaultToolkit.Http]: {
        [DefaultToolName.Http]: httpFetchTool,
    },
    [AppDefaultToolkit.Visualization]: {
        [DefaultToolName.CreateBarChart]: createBarChartTool,
        [DefaultToolName.CreateLineChart]: createLineChartTool,
        [DefaultToolName.CreatePieChart]: createPieChartTool,
    },
    [AppDefaultToolkit.WebSearch]: {
        [DefaultToolName.WebContent]: tavilyWebContentTool,
        [DefaultToolName.WebSearch]: tavilySearchTool,
    },
};
