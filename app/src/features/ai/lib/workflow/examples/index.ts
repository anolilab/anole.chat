import { generateUUID } from "lib/utils";

import type { DBEdge, DBNode, DBWorkflow } from "@/types/workflow";

import { babyResearchEdges, babyResearchNodes } from "./baby-research";
import { getWeatherEdges, getWeatherNodes } from "./get-weather";

export const GetWeather = (): {
    edges: Partial<DBEdge>[];
    nodes: Partial<DBNode>[];
    workflow: Partial<DBWorkflow>;
} => {
    return {
        edges: getWeatherEdges.map((edge) => {
            return {
                ...edge,
                id: generateUUID(),
            };
        }),
        nodes: getWeatherNodes,
        workflow: {
            description: "Get weather data from the API",
            icon: {
                style: {
                    backgroundColor: "oklch(20.5% 0 0)",
                },
                type: "emoji",
                value: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26c8-fe0f.png",
            },
            isPublished: true,
            name: "Get Weather",
            visibility: "private",
        },
    };
};

export const BabyResearch = (): {
    edges: Partial<DBEdge>[];
    nodes: Partial<DBNode>[];
    workflow: Partial<DBWorkflow>;
} => {
    return {
        edges: babyResearchEdges.map((edge) => {
            return {
                ...edge,
                id: generateUUID(),
            };
        }),
        nodes: babyResearchNodes,
        workflow: {
            description:
                "Comprehensive web research workflow that performs multi-layered search and content analysis to generate detailed research reports based on user instructions and research objectives.",
            icon: {
                style: {
                    backgroundColor: "oklch(78.5% 0.115 274.713)",
                },
                type: "emoji",
                value: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-1f3fb-200d-1f52c.png",
            },
            isPublished: true,
            name: "baby-research",
            visibility: "private",
        },
    };
};
