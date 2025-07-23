import { generateUUID } from "lib/utils";

import type { DBEdge, DBNode } from "@/types/workflow";

const INPUT = generateUUID();
const INITIAL_SEARCH = generateUUID();
const URL_CONDITION = generateUUID();
const CONTENT_EXTRACTION = generateUUID();
const SUMMARY = generateUUID();
const SEARCH_CONDITION = generateUUID();
const ADDITIONAL_SEARCH = generateUUID();
const OUTPUT = generateUUID();
const ORGANIZATION = generateUUID();
const REPORT_GUIDE = generateUUID();
const ANALYSIS = generateUUID();

export const babyResearchNodes: Partial<DBNode>[] = [
    {
        description: "Perform initial web search based on user query and parameters",

        id: INITIAL_SEARCH,
        kind: "tool",
        name: "INITIAL_SEARCH",
        nodeConfig: {
            kind: "tool",
            message: {
                content: [
                    {
                        content: [
                            {
                                text: "Based on the following research instruction, perform a comprehensive web search:",
                                type: "text",
                            },
                            { type: "hardBreak" },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                content: [
                                    {
                                        content: [
                                            { text: "- **Research Instruction**: ", type: "text" },
                                            {
                                                attrs: {
                                                    id: "20075100-6d14-42ea-ac7a-a2732d54cacf",
                                                    label: `{"nodeId":"${INPUT}","path":["research_instruction"]}`,
                                                },
                                                type: "mention",
                                            },
                                            { type: "hardBreak" },
                                            { type: "hardBreak" },
                                            { text: "---", type: "text" },
                                            { type: "hardBreak" },
                                        ],
                                        type: "paragraph",
                                    },
                                ],
                                type: "listItem",
                            },
                            {
                                content: [
                                    {
                                        content: [
                                            { text: "- **Topic Area**: ", type: "text" },
                                            {
                                                attrs: {
                                                    id: "e279fc2c-43c3-441d-bb5d-2d084a74bd63",
                                                    label: `{"nodeId":"${INPUT}","path":["topic"]}`,
                                                },
                                                type: "mention",
                                            },
                                            { type: "hardBreak" },
                                        ],
                                        type: "paragraph",
                                    },
                                ],
                                type: "listItem",
                            },
                            {
                                content: [
                                    {
                                        content: [{ text: "- Search Strategy:", type: "text" }],
                                        type: "paragraph",
                                    },
                                ],
                                type: "listItem",
                            },
                        ],
                        type: "bulletList",
                    },
                    {
                        content: [
                            {
                                text: "  1. Extract key concepts and themes from the research instruction",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                text: "  2. Identify multiple search angles and perspectives",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                text: "  3. Use diverse keywords and search terms",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                text: "  4. Focus on finding authoritative and comprehensive sources",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                text: "  5. Include recent developments and established knowledge",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                text: "  6. Cast a wide net to ensure comprehensive coverage",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                text: "  Important: Don't limit yourself to obvious keywords. Consider:",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                text: "  - Technical terminology and industry jargon",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [{ text: "  - Alternative names and concepts", type: "text" }],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                text: "  - Related fields and cross-industry applications",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [{ text: "  - Recent trends and developments", type: "text" }],
                        type: "paragraph",
                    },
                    {
                        content: [{ text: "  - Expert opinions and case studies", type: "text" }],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                text: "  Return maximum 15 diverse, high-quality results.",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                ],
                type: "doc",
            },
            model: { model: "4o", provider: "openai" },
            outputSchema: {
                properties: { tool_result: { type: "object" } },
                type: "object",
            },
            tool: {
                description:
                    "A web search tool for quick research and information gathering. Provides basic search results with titles, summaries, and URLs from across the web. Perfect for finding relevant sources and getting an overview of topics.",
                id: "webSearch",
                parameterSchema: {
                    properties: {
                        country: {
                            default: "",
                            description:
                                "Boost search results from a specific country. This will prioritize content from the selected country in the search results. Available only if topic is general.",
                            enum: [
                                "afghanistan",
                                "albania",
                                "algeria",
                                "andorra",
                                "angola",
                                "argentina",
                                "armenia",
                                "australia",
                                "austria",
                                "azerbaijan",
                                "bahamas",
                                "bahrain",
                                "bangladesh",
                                "barbados",
                                "belarus",
                                "belgium",
                                "belize",
                                "benin",
                                "bhutan",
                                "bolivia",
                                "bosnia and herzegovina",
                                "botswana",
                                "brazil",
                                "brunei",
                                "bulgaria",
                                "burkina faso",
                                "burundi",
                                "cambodia",
                                "cameroon",
                                "canada",
                                "cape verde",
                                "central african republic",
                                "chad",
                                "chile",
                                "china",
                                "colombia",
                                "comoros",
                                "congo",
                                "costa rica",
                                "croatia",
                                "cuba",
                                "cyprus",
                                "czech republic",
                                "denmark",
                                "djibouti",
                                "dominican republic",
                                "ecuador",
                                "egypt",
                                "el salvador",
                                "equatorial guinea",
                                "eritrea",
                                "estonia",
                                "ethiopia",
                                "fiji",
                                "finland",
                                "france",
                                "gabon",
                                "gambia",
                                "georgia",
                                "germany",
                                "ghana",
                                "greece",
                                "guatemala",
                                "guinea",
                                "haiti",
                                "honduras",
                                "hungary",
                                "iceland",
                                "india",
                                "indonesia",
                                "iran",
                                "iraq",
                                "ireland",
                                "israel",
                                "italy",
                                "jamaica",
                                "japan",
                                "jordan",
                                "kazakhstan",
                                "kenya",
                                "kuwait",
                                "kyrgyzstan",
                                "latvia",
                                "lebanon",
                                "lesotho",
                                "liberia",
                                "libya",
                                "liechtenstein",
                                "lithuania",
                                "luxembourg",
                                "madagascar",
                                "malawi",
                                "malaysia",
                                "maldives",
                                "mali",
                                "malta",
                                "mauritania",
                                "mauritius",
                                "mexico",
                                "moldova",
                                "monaco",
                                "mongolia",
                                "montenegro",
                                "morocco",
                                "mozambique",
                                "myanmar",
                                "namibia",
                                "nepal",
                                "netherlands",
                                "new zealand",
                                "nicaragua",
                                "niger",
                                "nigeria",
                                "north korea",
                                "north macedonia",
                                "norway",
                                "oman",
                                "pakistan",
                                "panama",
                                "papua new guinea",
                                "paraguay",
                                "peru",
                                "philippines",
                                "poland",
                                "portugal",
                                "qatar",
                                "romania",
                                "russia",
                                "rwanda",
                                "saudi arabia",
                                "senegal",
                                "serbia",
                                "singapore",
                                "slovakia",
                                "slovenia",
                                "somalia",
                                "south africa",
                                "south korea",
                                "south sudan",
                                "spain",
                                "sri lanka",
                                "sudan",
                                "sweden",
                                "switzerland",
                                "syria",
                                "taiwan",
                                "tajikistan",
                                "tanzania",
                                "thailand",
                                "togo",
                                "trinidad and tobago",
                                "tunisia",
                                "turkey",
                                "turkmenistan",
                                "uganda",
                                "ukraine",
                                "united arab emirates",
                                "united kingdom",
                                "united states",
                                "uruguay",
                                "uzbekistan",
                                "venezuela",
                                "vietnam",
                                "yemen",
                                "zambia",
                                "zimbabwe",
                            ],
                            type: "string",
                        },
                        days: {
                            default: 3,
                            description:
                                "The number of days back from the current date to include in the search results. This specifies the time frame of data to be retrieved. Please note that this feature is only available when using the 'news' search topic",
                            type: "number",
                        },
                        exclude_domains: {
                            default: [],
                            description: "List of domains to specifically exclude, if the user asks to exclude a domain set this to the domain of the site",
                            items: { type: "string" },
                            type: "array",
                        },
                        include_domains: {
                            default: [],
                            description:
                                "A list of domains to specifically include in the search results, if the user asks to search on specific sites set this to the domain of the site",
                            items: { type: "string" },
                            type: "array",
                        },
                        include_favicon: {
                            default: true,
                            description: "Whether to include the favicon URL for each result",
                            type: "boolean",
                        },
                        include_image_descriptions: {
                            default: true,
                            description: "Include a list of query-related images and their descriptions in the response",
                            type: "boolean",
                        },
                        include_images: {
                            default: true,
                            description: "Include a list of query-related images in the response",
                            type: "boolean",
                        },
                        include_raw_content: {
                            default: false,
                            description: "Include the cleaned and parsed HTML content of each search result",
                            type: "boolean",
                        },
                        max_results: {
                            default: 10,
                            description: "The maximum number of search results to return",
                            maximum: 20,
                            minimum: 5,
                            type: "number",
                        },
                        query: { description: "Search query", type: "string" },
                        search_depth: {
                            default: "basic",
                            description: "The depth of the search. It can be 'basic' or 'advanced'",
                            enum: ["basic", "advanced"],
                            type: "string",
                        },
                        time_range: {
                            description:
                                "The time range back from the current date to include in the search results. This feature is available for both 'general' and 'news' search topics",
                            enum: ["day", "week", "month", "year", "d", "w", "m", "y"],
                            type: "string",
                        },
                        topic: {
                            default: "general",
                            description: "The category of the search. This will determine which of our agents will be used for the search",
                            enum: ["general", "news"],
                            type: "string",
                        },
                    },
                    required: ["query"],
                    type: "object",
                },
                type: "app-tool",
            },
        },
        uiConfig: { position: { x: 360, y: 0 }, type: "default" },
    },
    {
        description: "",

        id: URL_CONDITION,
        kind: "condition",
        name: "URL_CONDITION",
        nodeConfig: {
            branches: {
                else: {
                    conditions: [],
                    id: "else",
                    logicalOperator: "AND",
                    type: "else",
                },
                if: {
                    conditions: [
                        {
                            operator: "is_not_empty",
                            source: {
                                nodeId: ANALYSIS,
                                nodeName: "ANALYSIS",
                                path: ["answer", "important_url"],
                                type: "object",
                            },
                        },
                    ],
                    id: "if",
                    logicalOperator: "AND",
                    type: "if",
                },
            },
            kind: "condition",
            outputSchema: { properties: {}, type: "object" },
        },
        uiConfig: {
            position: { x: 1092.720_830_684_793, y: -109.568_399_839_272_73 },
            type: "default",
        },
    },
    {
        description: "Extract detailed content from important URL",

        id: CONTENT_EXTRACTION,
        kind: "tool",
        name: "CONTENT_EXTRACTION",
        nodeConfig: {
            kind: "tool",
            message: {
                content: [
                    {
                        content: [
                            { text: "url : ", type: "text" },
                            {
                                attrs: {
                                    id: "9bd55c87-9eac-4af2-968f-c83b93577639",
                                    label: `{"nodeId":"${ANALYSIS}","path":["answer","important_url"]}`,
                                },
                                type: "mention",
                            },
                        ],
                        type: "paragraph",
                    },
                ],
                type: "doc",
            },
            model: { model: "4o", provider: "openai" },
            outputSchema: {
                properties: { tool_result: { type: "object" } },
                type: "object",
            },
            tool: {
                description:
                    "A detailed web content extraction tool that analyzes and summarizes specific web pages from provided URLs. Extracts full content, processes it intelligently, and provides comprehensive summaries. Perfect for in-depth analysis of specific articles, documents, or web pages.",
                id: "webContent",
                parameterSchema: {
                    properties: {
                        extract_depth: {
                            default: "basic",
                            description:
                                "Depth of extraction - 'basic' or 'advanced', if usrls are linkedin use 'advanced' or if explicitly told to use advanced",
                            enum: ["basic", "advanced"],
                            type: "string",
                        },
                        format: {
                            default: "markdown",
                            description:
                                "The format of the extracted web page content. markdown returns content in markdown format. text returns plain text and may increase latency.",
                            enum: ["markdown", "text"],
                            type: "string",
                        },
                        include_favicon: {
                            default: false,
                            description: "Whether to include the favicon URL for each result",
                            type: "boolean",
                        },
                        include_images: {
                            default: false,
                            description: "Include a list of images extracted from the urls in the response",
                            type: "boolean",
                        },
                        urls: {
                            description: "List of URLs to extract content from",
                            items: { type: "string" },
                            type: "array",
                        },
                    },
                    required: ["urls"],
                    type: "object",
                },
                type: "app-tool",
            },
        },
        uiConfig: {
            position: { x: 1426.344_044_454_295, y: -203.771_207_805_337_27 },
            type: "default",
        },
    },
    {
        description: "Synthesize all information into comprehensive research report",

        id: SUMMARY,
        kind: "llm",
        name: "SUMMARY",
        nodeConfig: {
            kind: "llm",
            messages: [
                {
                    content: {
                        content: [
                            {
                                content: [
                                    {
                                        text: "Create a comprehensive research report based on all collected information.",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "  Research Instruction: ", type: "text" },
                                    {
                                        attrs: {
                                            id: "32c8abfa-f993-4c29-906a-d1c26f36711e",
                                            label: `{"nodeId":"${INPUT}","path":["research_instruction"]}`,
                                            mentionSuggestionChar: "@",
                                        },
                                        type: "mention",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { type: "hardBreak" },
                                    { text: "  Topic Area: ", type: "text" },
                                    {
                                        attrs: {
                                            id: "c20376fa-66ec-45ce-bbef-a4f8d793e110",
                                            label: `{"nodeId":"${INPUT}","path":["topic"]}`,
                                            mentionSuggestionChar: "@",
                                        },
                                        type: "mention",
                                    },
                                    { type: "hardBreak" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "  Output Language: ", type: "text" },
                                    {
                                        attrs: {
                                            id: "87a8619d-b077-48de-8351-1cb5bdf6cc59",
                                            label: `{"nodeId":"${INPUT}","path":["language"]}`,
                                            mentionSuggestionChar: "@",
                                        },
                                        type: "mention",
                                    },
                                    { type: "hardBreak" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "  Information Sources:", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "  - Initial Search: ", type: "text" },
                                    {
                                        attrs: {
                                            id: "53de2392-4c38-4d56-a8bf-d1b64892a348",
                                            label: `{"nodeId":"${INITIAL_SEARCH}","path":["tool_result"]}`,
                                            mentionSuggestionChar: "@",
                                        },
                                        type: "mention",
                                    },
                                    { type: "hardBreak" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "  - Analysis: ", type: "text" },
                                    {
                                        attrs: {
                                            id: "7447143a-9154-49e8-b3bb-bff946398903",
                                            label: `{"nodeId":"${ANALYSIS}","path":["answer"]}`,
                                            mentionSuggestionChar: "@",
                                        },
                                        type: "mention",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { type: "hardBreak" },
                                    { type: "hardBreak" },
                                    { text: "  - Detailed Content: ", type: "text" },
                                    {
                                        attrs: {
                                            id: "2769be0e-9631-4562-9ccc-2026d7aca616",
                                            label: `{"nodeId":"${CONTENT_EXTRACTION}","path":["tool_result"]}`,
                                            mentionSuggestionChar: "@",
                                        },
                                        type: "mention",
                                    },
                                    { type: "hardBreak" },
                                    { type: "hardBreak" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "  - Additional Search: ", type: "text" },
                                    {
                                        attrs: {
                                            id: "9ebfa7ad-341d-4db5-a88b-1d772fa97edd",
                                            label: `{"nodeId":"${ADDITIONAL_SEARCH}","path":["tool_result"]}`,
                                            mentionSuggestionChar: "@",
                                        },
                                        type: "mention",
                                    },
                                    { type: "hardBreak" },
                                    { type: "hardBreak" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "Generate a structured report that directly addresses the research instruction:",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "  1. ", type: "text" },
                                    { marks: [{ type: "bold" }], text: "title", type: "text" },
                                    { text: " (string):", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Clear, descriptive title that reflects the research focus",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Should align with the research instruction objectives",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "  2. ", type: "text" },
                                    { marks: [{ type: "bold" }], text: "summary", type: "text" },
                                    { text: " (string):", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Executive summary in 4-6 sentences",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Directly answer the key questions in the research instruction",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Highlight major findings and implications",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "  3. ", type: "text" },
                                    { marks: [{ type: "bold" }], text: "content", type: "text" },
                                    { text: " (string - markdown format):", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Comprehensive analysis organized logically",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Structure based on the research instruction requirements",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Include: key findings, evidence, analysis, implications, recommendations",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Use proper markdown formatting with headers, lists, emphasis",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            { content: [{ text: "     ", type: "text" }], type: "paragraph" },
                            {
                                content: [
                                    { text: "     ", type: "text" },
                                    {
                                        marks: [{ type: "bold" }],
                                        text: "Important Content Guidelines:",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "     - ", type: "text" },
                                    { marks: [{ type: "bold" }], text: "Images", type: "text" },
                                    {
                                        text: ": If images are available in the search results, include relevant ones using markdown image syntax: `![Image description](image_url)`",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "     - ", type: "text" },
                                    { marks: [{ type: "bold" }], text: "Sources", type: "text" },
                                    {
                                        text: ": Always cite sources when referencing specific information using format: `[Source Title](URL)` or `According to [Source Title](URL), ...`",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "     - ", type: "text" },
                                    {
                                        marks: [{ type: "bold" }],
                                        text: "Data and Statistics",
                                        type: "text",
                                    },
                                    {
                                        text: ": When presenting data, always include the source",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "     - ", type: "text" },
                                    { marks: [{ type: "bold" }], text: "Quotes", type: "text" },
                                    {
                                        text: ": Use blockquotes for important quotes with attribution",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "     - ", type: "text" },
                                    { marks: [{ type: "bold" }], text: "Evidence", type: "text" },
                                    {
                                        text: ": Support claims with specific evidence from the sources",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            { content: [{ text: "     ", type: "text" }], type: "paragraph" },
                            {
                                content: [
                                    { text: "     ", type: "text" },
                                    {
                                        marks: [{ type: "bold" }],
                                        text: "Structure Example:",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "     ```markdown", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "     ## Introduction", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "     Brief overview with context", type: "text" }],
                                type: "paragraph",
                            },
                            { content: [{ text: "     ", type: "text" }], type: "paragraph" },
                            {
                                content: [{ text: "     ## Key Findings", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Finding 1 with source citation",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Finding 2 with source citation",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            { content: [{ text: "     ", type: "text" }], type: "paragraph" },
                            {
                                content: [{ text: "     ## Visual Evidence", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     ![Chart showing trend](image_url)",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "     ", type: "text" },
                                    {
                                        marks: [{ type: "italic" }],
                                        text: "Source: [Report Title](URL)",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            { content: [{ text: "     ", type: "text" }], type: "paragraph" },
                            {
                                content: [{ text: "     ## Detailed Analysis", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     In-depth analysis with multiple source citations",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            { content: [{ text: "     ", type: "text" }], type: "paragraph" },
                            {
                                content: [{ text: "     ## Implications", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     What this means for the research question",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "     ```", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "  4. ", type: "text" },
                                    { marks: [{ type: "bold" }], text: "diagram", type: "text" },
                                    { text: " (string - Mermaid code):", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Create visualization if it helps explain findings",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Examples: process flows, relationships, timelines, comparisons",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Only include if it adds significant value",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "  5. ", type: "text" },
                                    {
                                        marks: [{ type: "bold" }],
                                        text: "key_insights",
                                        type: "text",
                                    },
                                    { text: " (array of strings):", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - 3-5 most important insights from the research",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Should directly relate to the research instruction objectives",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "  6. ", type: "text" },
                                    {
                                        marks: [{ type: "bold" }],
                                        text: "confidence_level",
                                        type: "text",
                                    },
                                    { text: " (number 1-10):", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Rate confidence in findings based on source quality and coverage",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "  7. ", type: "text" },
                                    {
                                        marks: [{ type: "bold" }],
                                        text: "sources_used",
                                        type: "text",
                                    },
                                    { text: " (array of objects):", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - List all sources referenced in the content",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Format: {\"title\": \"Source Title\", \"url\": \"URL\", \"type\": \"article/report/study\"}",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "  Write in [INITIAL_SEARCH.output_language]. Ensure the report:",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "  - Fully addresses the research instruction",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "  - Includes relevant images where they add value",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "  - Properly cites all sources", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "  - Provides actionable insights", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "  - Maintains professional formatting",
                                        type: "text",
                                    },
                                    { type: "hardBreak" },
                                    { type: "hardBreak" },
                                    { text: "8. ", type: "text" },
                                    { marks: [{ type: "bold" }], text: "images", type: "text" },
                                    { text: " (array of objects):", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "   - ", type: "text" },
                                    {
                                        marks: [{ type: "bold" }],
                                        text: "Extract at least 3 relevant images",
                                        type: "text",
                                    },
                                    { text: " from the search results", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "   - Format: {\"url\": \"image_url\", \"description\": \"descriptive caption\", \"context\": \"how this image relates to the research\"}",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "   - Select images that support key findings or illustrate important concepts",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "   - Include diverse image types: charts, diagrams, photos, infographics",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "   - Prioritize images that enhance understanding of the research topic",
                                        type: "text",
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
            model: { model: "claude-4-sonnet", provider: "anthropic" },
            outputSchema: {
                properties: {
                    answer: {
                        properties: {
                            confidence_level: {
                                description: "Confidence score 1-10 based on source quality and coverage",
                                type: "number",
                            },
                            content: {
                                description: "Comprehensive analysis in markdown format with source citations",
                                type: "string",
                            },
                            diagram: {
                                description: "Mermaid diagram code if beneficial (empty string if not needed)",
                                type: "string",
                            },
                            images: {
                                description: "List of relevant images extracted from search results",
                                items: {
                                    properties: {
                                        context: { type: "string" },
                                        description: { type: "string" },
                                        url: { type: "string" },
                                    },
                                    type: "object",
                                },
                                type: "array",
                            },
                            key_insights: {
                                description: "3-5 most important insights from the research",
                                items: { type: "string" },
                                type: "array",
                            },
                            sources_used: {
                                description: "List of all sources referenced in the content",
                                items: {
                                    properties: {
                                        title: { type: "string" },
                                        type: { type: "string" },
                                        url: { type: "string" },
                                    },
                                    type: "object",
                                },
                                type: "array",
                            },
                            summary: {
                                description: "Executive summary in 4-6 sentences",
                                type: "string",
                            },
                            title: {
                                description: "Clear, descriptive title for the research report",
                                type: "string",
                            },
                        },
                        type: "object",
                    },
                    totalTokens: { type: "number" },
                },
                type: "object",
            },
        },
        uiConfig: {
            position: { x: 1912.404_443_969_165_6, y: 29.674_947_458_404_66 },
            type: "default",
        },
    },
    {
        description: "",

        id: SEARCH_CONDITION,
        kind: "condition",
        name: "SEARCH_CONDITION",
        nodeConfig: {
            branches: {
                else: {
                    conditions: [],
                    id: "else",
                    logicalOperator: "AND",
                    type: "else",
                },
                if: {
                    conditions: [
                        {
                            operator: "is_empty",
                            source: {
                                nodeId: ANALYSIS,
                                nodeName: "ANALYSIS",
                                path: ["answer", "additional_search_instruction"],
                                type: "object",
                            },
                        },
                    ],
                    id: "if",
                    logicalOperator: "AND",
                    type: "if",
                },
            },
            kind: "condition",
            outputSchema: { properties: {}, type: "object" },
        },
        uiConfig: {
            position: { x: 1096.317_579_843_779_9, y: 108.805_306_149_898_87 },
            type: "default",
        },
    },
    {
        description: "Perform supplementary search based on specific instruction",

        id: ADDITIONAL_SEARCH,
        kind: "tool",
        name: "ADDITIONAL_SEARCH",
        nodeConfig: {
            kind: "tool",
            message: {
                content: [
                    {
                        content: [
                            {
                                text: "Perform targeted search based on this specific instruction: ",
                                type: "text",
                            },
                            {
                                attrs: {
                                    id: "dc2caf22-632d-4388-bf9c-7c8626a24c65",
                                    label: `{"nodeId":"${ANALYSIS}","path":["answer","additional_search_instruction"]}`,
                                },
                                type: "mention",
                            },
                            { type: "hardBreak" },
                            { type: "hardBreak" },
                            { type: "hardBreak" },
                            { text: "Research Context: ", type: "text" },
                            {
                                attrs: {
                                    id: "6ab2e17b-1e04-4065-97d4-627de934b88d",
                                    label: `{"nodeId":"${INPUT}","path":["research_instruction"]}`,
                                },
                                type: "mention",
                            },
                            { type: "hardBreak" },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [
                            { text: "  Topic Area: ", type: "text" },
                            {
                                attrs: {
                                    id: "c8de8dcf-0218-4b31-8552-b1f5d0ab8ad3",
                                    label: `{"nodeId":"${INPUT}","path":["topic"]}`,
                                },
                                type: "mention",
                            },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [{ text: "  Search Strategy:", type: "text" }],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                text: "  1. Follow the specific search instruction precisely",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                text: "  2. Focus on filling the identified information gaps",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                text: "  3. Look for recent developments and expert perspectives",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                text: "  4. Include diverse viewpoints and comprehensive coverage",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                text: "  5. Prioritize sources that add new insights to the research",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                    {
                        content: [
                            {
                                text: "  Target 8-10 high-quality results that provide unique value.",
                                type: "text",
                            },
                        ],
                        type: "paragraph",
                    },
                ],
                type: "doc",
            },
            model: { model: "4o", provider: "openai" },
            outputSchema: {
                properties: { tool_result: { type: "object" } },
                type: "object",
            },
            tool: {
                description:
                    "A web search tool for quick research and information gathering. Provides basic search results with titles, summaries, and URLs from across the web. Perfect for finding relevant sources and getting an overview of topics.",
                id: "webSearch",
                parameterSchema: {
                    properties: {
                        country: {
                            default: "",
                            description:
                                "Boost search results from a specific country. This will prioritize content from the selected country in the search results. Available only if topic is general.",
                            enum: [
                                "afghanistan",
                                "albania",
                                "algeria",
                                "andorra",
                                "angola",
                                "argentina",
                                "armenia",
                                "australia",
                                "austria",
                                "azerbaijan",
                                "bahamas",
                                "bahrain",
                                "bangladesh",
                                "barbados",
                                "belarus",
                                "belgium",
                                "belize",
                                "benin",
                                "bhutan",
                                "bolivia",
                                "bosnia and herzegovina",
                                "botswana",
                                "brazil",
                                "brunei",
                                "bulgaria",
                                "burkina faso",
                                "burundi",
                                "cambodia",
                                "cameroon",
                                "canada",
                                "cape verde",
                                "central african republic",
                                "chad",
                                "chile",
                                "china",
                                "colombia",
                                "comoros",
                                "congo",
                                "costa rica",
                                "croatia",
                                "cuba",
                                "cyprus",
                                "czech republic",
                                "denmark",
                                "djibouti",
                                "dominican republic",
                                "ecuador",
                                "egypt",
                                "el salvador",
                                "equatorial guinea",
                                "eritrea",
                                "estonia",
                                "ethiopia",
                                "fiji",
                                "finland",
                                "france",
                                "gabon",
                                "gambia",
                                "georgia",
                                "germany",
                                "ghana",
                                "greece",
                                "guatemala",
                                "guinea",
                                "haiti",
                                "honduras",
                                "hungary",
                                "iceland",
                                "india",
                                "indonesia",
                                "iran",
                                "iraq",
                                "ireland",
                                "israel",
                                "italy",
                                "jamaica",
                                "japan",
                                "jordan",
                                "kazakhstan",
                                "kenya",
                                "kuwait",
                                "kyrgyzstan",
                                "latvia",
                                "lebanon",
                                "lesotho",
                                "liberia",
                                "libya",
                                "liechtenstein",
                                "lithuania",
                                "luxembourg",
                                "madagascar",
                                "malawi",
                                "malaysia",
                                "maldives",
                                "mali",
                                "malta",
                                "mauritania",
                                "mauritius",
                                "mexico",
                                "moldova",
                                "monaco",
                                "mongolia",
                                "montenegro",
                                "morocco",
                                "mozambique",
                                "myanmar",
                                "namibia",
                                "nepal",
                                "netherlands",
                                "new zealand",
                                "nicaragua",
                                "niger",
                                "nigeria",
                                "north korea",
                                "north macedonia",
                                "norway",
                                "oman",
                                "pakistan",
                                "panama",
                                "papua new guinea",
                                "paraguay",
                                "peru",
                                "philippines",
                                "poland",
                                "portugal",
                                "qatar",
                                "romania",
                                "russia",
                                "rwanda",
                                "saudi arabia",
                                "senegal",
                                "serbia",
                                "singapore",
                                "slovakia",
                                "slovenia",
                                "somalia",
                                "south africa",
                                "south korea",
                                "south sudan",
                                "spain",
                                "sri lanka",
                                "sudan",
                                "sweden",
                                "switzerland",
                                "syria",
                                "taiwan",
                                "tajikistan",
                                "tanzania",
                                "thailand",
                                "togo",
                                "trinidad and tobago",
                                "tunisia",
                                "turkey",
                                "turkmenistan",
                                "uganda",
                                "ukraine",
                                "united arab emirates",
                                "united kingdom",
                                "united states",
                                "uruguay",
                                "uzbekistan",
                                "venezuela",
                                "vietnam",
                                "yemen",
                                "zambia",
                                "zimbabwe",
                            ],
                            type: "string",
                        },
                        days: {
                            default: 3,
                            description:
                                "The number of days back from the current date to include in the search results. This specifies the time frame of data to be retrieved. Please note that this feature is only available when using the 'news' search topic",
                            type: "number",
                        },
                        exclude_domains: {
                            default: [],
                            description: "List of domains to specifically exclude, if the user asks to exclude a domain set this to the domain of the site",
                            items: { type: "string" },
                            type: "array",
                        },
                        include_domains: {
                            default: [],
                            description:
                                "A list of domains to specifically include in the search results, if the user asks to search on specific sites set this to the domain of the site",
                            items: { type: "string" },
                            type: "array",
                        },
                        include_favicon: {
                            default: true,
                            description: "Whether to include the favicon URL for each result",
                            type: "boolean",
                        },
                        include_image_descriptions: {
                            default: true,
                            description: "Include a list of query-related images and their descriptions in the response",
                            type: "boolean",
                        },
                        include_images: {
                            default: true,
                            description: "Include a list of query-related images in the response",
                            type: "boolean",
                        },
                        include_raw_content: {
                            default: false,
                            description: "Include the cleaned and parsed HTML content of each search result",
                            type: "boolean",
                        },
                        max_results: {
                            default: 10,
                            description: "The maximum number of search results to return",
                            maximum: 20,
                            minimum: 5,
                            type: "number",
                        },
                        query: { description: "Search query", type: "string" },
                        search_depth: {
                            default: "basic",
                            description: "The depth of the search. It can be 'basic' or 'advanced'",
                            enum: ["basic", "advanced"],
                            type: "string",
                        },
                        time_range: {
                            description:
                                "The time range back from the current date to include in the search results. This feature is available for both 'general' and 'news' search topics",
                            enum: ["day", "week", "month", "year", "d", "w", "m", "y"],
                            type: "string",
                        },
                        topic: {
                            default: "general",
                            description: "The category of the search. This will determine which of our agents will be used for the search",
                            enum: ["general", "news"],
                            type: "string",
                        },
                    },
                    required: ["query"],
                    type: "object",
                },
                type: "app-tool",
            },
        },
        uiConfig: {
            position: { x: 1439.361_074_409_888_3, y: 257.645_742_736_280_9 },
            type: "default",
        },
    },
    {
        description: "",

        id: OUTPUT,
        kind: "output",
        name: "OUTPUT",
        nodeConfig: {
            kind: "output",
            outputData: [
                {
                    key: "research_findings",
                    source: {
                        nodeId: SUMMARY,
                        path: ["answer"],
                    },
                },
                {
                    key: "organized_data",
                    source: {
                        nodeId: ORGANIZATION,
                        path: ["answer"],
                    },
                },
                {
                    key: "message_response_guide",
                    source: {
                        nodeId: REPORT_GUIDE,
                        path: ["template"],
                    },
                },
                {
                    key: "images",
                    source: {
                        nodeId: SUMMARY,
                        path: ["answer", "images"],
                    },
                },
            ],
            outputSchema: { properties: {}, type: "object" },
        },
        uiConfig: {
            position: { x: 2632.404_443_969_165_6, y: 29.674_947_458_404_66 },
            type: "default",
        },
    },
    {
        description: "Organize and summarize all collected information for report generation",

        id: ORGANIZATION,
        kind: "llm",
        name: "ORGANIZATION",
        nodeConfig: {
            kind: "llm",
            messages: [
                {
                    content: {
                        content: [
                            {
                                content: [
                                    {
                                        text: "You are a research information organizer. Your task is to systematically organize and summarize all collected research information into a comprehensive, well-structured format that will be used for report generation.",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "Your response should include:", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "## RESEARCH OVERVIEW", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "[Summarize the research instruction and approach]",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "## KEY SOURCES IDENTIFIED", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "[List all important sources with titles and URLs]",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "- [Source Title 1](URL1) - Brief description",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "- [Source Title 2](URL2) - Brief description",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "- [Source Title 3](URL3) - Brief description",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "## AVAILABLE IMAGES", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "[List all images found with descriptions and URLs]",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "- ![Description 1](image_url1) - Context/relevance",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "- ![Description 2](image_url2) - Context/relevance",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "- ![Description 3](image_url3) - Context/relevance",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "## MAIN FINDINGS", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "[Organized key findings with source attributions]",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "- Finding 1 (Source: [Title](URL))", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "- Finding 2 (Source: [Title](URL))", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "- Finding 3 (Source: [Title](URL))", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "## DETAILED CONTENT SUMMARY", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "[Comprehensive summary of all extracted content]",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "## STATISTICAL DATA", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "[Any numbers, statistics, or quantitative data found]",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "## EXPERT OPINIONS/QUOTES", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "[Important quotes or expert perspectives]",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [{ text: "## RESEARCH GAPS", type: "text" }],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "[Areas where information might be incomplete]",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "Make this comprehensive and well-organized for easy reference in report generation.",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                        ],
                        type: "doc",
                    },
                    role: "system",
                },
                {
                    content: {
                        content: [
                            {
                                content: [
                                    { text: "Research Instruction: ", type: "text" },
                                    {
                                        attrs: {
                                            id: "4a3380c5-0b39-43a8-906e-f0a38ca41539",
                                            label: `{"nodeId":"${INPUT}","path":["research_instruction"]}`,
                                        },
                                        type: "mention",
                                    },
                                    { type: "hardBreak" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "Topic Area: ", type: "text" },
                                    {
                                        attrs: {
                                            id: "1de3a234-9029-4914-8086-ba9789e2a017",
                                            label: `{"nodeId":"${INPUT}","path":["topic"]}`,
                                        },
                                        type: "mention",
                                    },
                                    { type: "hardBreak" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "Initial Search Results: ", type: "text" },
                                    {
                                        attrs: {
                                            id: "2ea9f224-5806-408a-a538-c61313a6f0af",
                                            label: `{"nodeId":"${INITIAL_SEARCH}","path":["tool_result"]}`,
                                        },
                                        type: "mention",
                                    },
                                    { type: "hardBreak" },
                                    { type: "hardBreak" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "Analysis Summary: ", type: "text" },
                                    {
                                        attrs: {
                                            id: "a0c436b7-6300-4d1f-a0e6-1316c1c8cdc7",
                                            label: `{"nodeId":"${ANALYSIS}","path":["answer"]}`,
                                        },
                                        type: "mention",
                                    },
                                    { type: "hardBreak" },
                                    { type: "hardBreak" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "Detailed Content: ", type: "text" },
                                    {
                                        attrs: {
                                            id: "10bf3fbf-2421-4d94-bc64-30e96ef28168",
                                            label: `{"nodeId":"${CONTENT_EXTRACTION}","path":["tool_result"]}`,
                                        },
                                        type: "mention",
                                    },
                                    { type: "hardBreak" },
                                    { type: "hardBreak" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "Additional Search:  ", type: "text" },
                                    {
                                        attrs: {
                                            id: "2e50dd84-1d6a-4680-92ae-b3d78045b713",
                                            label: `{"nodeId":"${ADDITIONAL_SEARCH}","path":["tool_result"]}`,
                                        },
                                        type: "mention",
                                    },
                                    { type: "hardBreak" },
                                    { type: "hardBreak" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "Please organize all this information according to the format specified in the system prompt.",
                                        type: "text",
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
                    answer: { type: "string" },
                    totalTokens: { type: "number" },
                },
                type: "object",
            },
        },
        uiConfig: {
            position: { x: 2272.404_443_969_165_6, y: 91.447_581_511_026_24 },
            type: "default",
        },
    },
    {
        description: "",

        id: REPORT_GUIDE,
        kind: "template",
        name: "REPORT_GUIDE",
        nodeConfig: {
            kind: "template",
            outputSchema: {
                properties: { template: { type: "string" } },
                type: "object",
            },
            template: {
                tiptap: {
                    content: [
                        {
                            content: [
                                {
                                    text: "Create a comprehensive research report using the research findings. Guidelines:",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        { content: [{ type: "hardBreak" }], type: "paragraph" },
                        {
                            content: [
                                {
                                    text: "- Present the complete content directly without code blocks or formatting wrapper",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                {
                                    text: "- Do not add introductory remarks like \"Here's the report\" or \"Report completed\"",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                {
                                    text: "- Use the title, summary, and complete content from findings",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        { content: [{ type: "hardBreak" }], type: "paragraph" },
                        {
                            content: [
                                {
                                    marks: [{ type: "bold" }],
                                    text: "MANDATORY REQUIREMENTS:",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                { text: "- ", type: "text" },
                                {
                                    marks: [{ type: "bold" }],
                                    text: "MUST include at least 3 relevant images",
                                    type: "text",
                                },
                                {
                                    text: " using ![Description](image_url) format throughout the content",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                { text: "- ", type: "text" },
                                {
                                    marks: [{ type: "bold" }],
                                    text: "MUST include the mermaid diagram",
                                    type: "text",
                                },
                                {
                                    text: " from research_findings using \\`\\`\\`mermaid format within the content flow",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                { text: "- ", type: "text" },
                                {
                                    marks: [{ type: "bold" }],
                                    text: "MUST cite every source with URLs",
                                    type: "text",
                                },
                                { text: " - format: [Source Title](URL)", type: "text" },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                { text: "- ", type: "text" },
                                {
                                    marks: [{ type: "bold" }],
                                    text: "MUST include source URLs",
                                    type: "text",
                                },
                                {
                                    text: " for all data, statistics, and factual information",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        { content: [{ type: "hardBreak" }], type: "paragraph" },
                        {
                            content: [
                                {
                                    marks: [{ type: "bold" }],
                                    text: "IMAGE USAGE:",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                {
                                    text: "- Extract images from organized_data or research_findings content",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                {
                                    text: "- Place images strategically to support key points",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                {
                                    text: "- Use format: ![Descriptive caption](image_url)",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                {
                                    text: "- Include image source attribution when possible",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        { content: [{ type: "hardBreak" }], type: "paragraph" },
                        {
                            content: [
                                {
                                    marks: [{ type: "bold" }],
                                    text: "MERMAID DIAGRAM:",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                {
                                    text: "- Use the diagram from research_findings.diagram",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                {
                                    text: "- Format: \\`\\`\\`mermaid [diagram_code] \\`\\`\\`",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                {
                                    text: "- Place within relevant content section, not as separate section",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                {
                                    text: "- Ensure diagram enhances understanding of the topic",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        { content: [{ type: "hardBreak" }], type: "paragraph" },
                        {
                            content: [
                                {
                                    marks: [{ type: "bold" }],
                                    text: "CONTENT STRUCTURE:",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [{ text: "# [research_findings.title]", type: "text" }],
                            type: "paragraph",
                        },
                        { content: [{ type: "hardBreak" }], type: "paragraph" },
                        {
                            content: [
                                {
                                    text: "[Include executive summary, key insights, detailed analysis with images and diagrams integrated naturally]",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        { content: [{ type: "hardBreak" }], type: "paragraph" },
                        {
                            content: [
                                {
                                    marks: [{ type: "bold" }],
                                    text: "Confidence Level:",
                                    type: "text",
                                },
                                {
                                    text: " [research_findings.confidence_level]/10",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        { content: [{ type: "hardBreak" }], type: "paragraph" },
                        {
                            content: [
                                {
                                    text: "- Include confidence level and key insights naturally within the content",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                {
                                    text: "- Ensure all sources are properly cited throughout",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                        {
                            content: [
                                {
                                    text: "- Present as a professional research report ready for the user",
                                    type: "text",
                                },
                            ],
                            type: "paragraph",
                        },
                    ],
                    type: "doc",
                },
                type: "tiptap",
            },
        },
        uiConfig: {
            position: { x: 2270.033_917_728_336, y: -27.217_682_321_506_935 },
            type: "default",
        },
    },
    {
        description: "Analyze search results and determine research strategy",

        id: ANALYSIS,
        kind: "llm",
        name: "ANALYSIS",
        nodeConfig: {
            kind: "llm",
            messages: [
                {
                    content: {
                        content: [
                            {
                                content: [
                                    {
                                        text: "Analyze the search results in the context of the research instruction and determine the next steps.",
                                        type: "text",
                                    },
                                    { type: "hardBreak" },
                                    { text: "---", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "Research Instruction: ", type: "text" },
                                    {
                                        attrs: {
                                            id: "23b93374-40fe-4397-8375-3ee3eacee22a",
                                            label: `{"nodeId":"${INPUT}","path":["research_instruction"]}`,
                                        },
                                        type: "mention",
                                    },
                                    { type: "hardBreak" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "---", type: "text" },
                                    { type: "hardBreak" },
                                    { text: "Topic Area: ", type: "text" },
                                    {
                                        attrs: {
                                            id: "fa4b502f-3b13-4717-b4ae-675961527f20",
                                            label: `{"nodeId":"${INPUT}","path":["topic"]}`,
                                        },
                                        type: "mention",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { type: "hardBreak" },
                                    { text: "---", type: "text" },
                                    { type: "hardBreak" },
                                    { text: "Search Results: ", type: "text" },
                                    {
                                        attrs: {
                                            id: "88493890-21ba-476a-a7c0-b6dd70a1d480",
                                            label: `{"nodeId":"${INITIAL_SEARCH}","path":["tool_result"]}`,
                                        },
                                        type: "mention",
                                    },
                                    { type: "hardBreak" },
                                    { type: "hardBreak" },
                                    { text: "---", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "1. ", type: "text" },
                                    {
                                        marks: [{ type: "bold" }],
                                        text: "important_url",
                                        type: "text",
                                    },
                                    { text: " (string):", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "   - ", type: "text" },
                                    {
                                        marks: [{ type: "bold" }],
                                        text: "YOU MUST SELECT AT LEAST ONE URL",
                                        type: "text",
                                    },
                                    {
                                        text: " unless search results are completely irrelevant",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "   - Choose the URL with the most comprehensive, authoritative information",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "   - Prioritize: research papers, detailed reports, expert analyses, case studies, official websites",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "   - Even if quality is moderate, select the BEST available option for detailed extraction",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "   - Only return empty string \"\" if absolutely no URLs provide any additional value",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "   - ", type: "text" },
                                    {
                                        marks: [{ type: "bold" }],
                                        text: "Default behavior: ALWAYS select the most valuable URL from available results",
                                        type: "text",
                                    },
                                    { type: "hardBreak" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "  2. ", type: "text" },
                                    {
                                        marks: [{ type: "bold" }],
                                        text: "additional_search_instruction",
                                        type: "text",
                                    },
                                    { text: " (string):", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Specific instruction for additional search to fill information gaps",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Should be a clear directive like \"Find recent statistics on AI adoption in hospitals\" or \"Search for regulatory challenges in healthcare AI implementation\"",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Based on what's missing from initial search relative to research instruction",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Return empty string \"\" if initial search provides sufficient coverage",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "  3. ", type: "text" },
                                    {
                                        marks: [{ type: "bold" }],
                                        text: "analysis_summary",
                                        type: "text",
                                    },
                                    { text: " (string):", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Assessment of how well current results address the research instruction",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Identification of information gaps and missing perspectives",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Quality and credibility evaluation of found sources",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Strategy for completing the research objective",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    { text: "  4. ", type: "text" },
                                    {
                                        marks: [{ type: "bold" }],
                                        text: "research_completeness",
                                        type: "text",
                                    },
                                    { text: " (number 1-10):", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Rate how well the initial search addresses the research instruction",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "     - Consider coverage, depth, and relevance to stated objectives",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "  Be strategic and selective. Focus on what's truly needed to address the research instruction.",
                                        type: "text",
                                    },
                                    { type: "hardBreak" },
                                    { type: "hardBreak" },
                                    { text: "5. ", type: "text" },
                                    {
                                        marks: [{ type: "bold" }],
                                        text: "reference_sources",
                                        type: "text",
                                    },
                                    { text: " (array of objects):", type: "text" },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "   - Extract 5-8 key reference sources from the search results",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "   - For each source provide: {\"url\": \"full_url\", \"summary\": \"brief description of content and relevance to research\"}",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "   - Include diverse source types: official reports, news articles, academic papers, expert analyses",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "   - Focus on sources that directly support the research instruction",
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                            {
                                content: [
                                    {
                                        text: "   - Prioritize credible, authoritative sources",
                                        type: "text",
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
                            additional_search_instruction: {
                                description: "Specific instruction for additional search to fill information gaps (empty string if none needed)",
                                type: "string",
                            },
                            analysis_summary: {
                                description: "Assessment of current research state and strategy",
                                type: "string",
                            },
                            important_url: {
                                description: "Single most important URL for detailed content extraction",
                                type: "string",
                            },
                            reference_sources: {
                                description: "List of key reference sources from search results",
                                items: {
                                    properties: {
                                        summary: {
                                            description: "Brief summary of the source content and relevance",
                                            type: "string",
                                        },
                                        url: { description: "Source URL", type: "string" },
                                    },
                                    type: "object",
                                },
                                type: "array",
                            },
                            research_completeness: {
                                description: "Score 1-10 rating how well initial search addresses research instruction",
                                type: "number",
                            },
                        },
                        type: "object",
                    },
                    totalTokens: { type: "number" },
                },
                type: "object",
            },
        },
        uiConfig: { position: { x: 720, y: 0 }, type: "default" },
    },
    {
        description: "",
        id: INPUT,
        kind: "input",
        name: "INPUT",
        nodeConfig: {
            kind: "input",
            outputSchema: {
                properties: {
                    language: {
                        description: "Preferred language for sources. eg. en (English), ko (Korean)",
                        type: "string",
                    },
                    research_instruction: {
                        default:
                            "Comprehensive research instruction including what to research, why, and how to approach it. Example: 'Research the current state of AI in healthcare, focusing on diagnostic applications, regulatory challenges, and market adoption rates. I need this for a business proposal targeting hospital administrators.'",
                        type: "string",
                    },
                    topic: {
                        description: "Subject area or domain (e.g., 'technology', 'healthcare', 'finance', 'education')",
                        type: "string",
                    },
                },
                required: ["research_instruction"],
                type: "object",
            },
        },
        uiConfig: { position: { x: 0, y: 0 }, type: "default" },
    },
];

export const babyResearchEdges: Partial<DBEdge>[] = [
    {
        source: CONTENT_EXTRACTION,
        target: SUMMARY,
        uiConfig: { sourceHandle: "right", targetHandle: "left" },
    },
    {
        source: ORGANIZATION,
        target: OUTPUT,
        uiConfig: { sourceHandle: "right", targetHandle: "left" },
    },
    {
        source: SUMMARY,
        target: REPORT_GUIDE,
        uiConfig: {},
    },
    {
        source: ANALYSIS,
        target: URL_CONDITION,
        uiConfig: {},
    },
    {
        source: INITIAL_SEARCH,
        target: ANALYSIS,
        uiConfig: {},
    },
    {
        source: SEARCH_CONDITION,
        target: SUMMARY,
        uiConfig: { sourceHandle: "if", targetHandle: "left" },
    },
    {
        source: URL_CONDITION,
        target: CONTENT_EXTRACTION,
        uiConfig: { sourceHandle: "if" },
    },
    {
        source: SEARCH_CONDITION,
        target: ADDITIONAL_SEARCH,
        uiConfig: { sourceHandle: "else", targetHandle: "left" },
    },
    {
        source: REPORT_GUIDE,
        target: OUTPUT,
        uiConfig: {},
    },
    {
        source: INPUT,
        target: INITIAL_SEARCH,
        uiConfig: {},
    },
    {
        source: ADDITIONAL_SEARCH,
        target: SUMMARY,
        uiConfig: {},
    },
    {
        source: URL_CONDITION,
        target: SUMMARY,
        uiConfig: { sourceHandle: "else", targetHandle: "left" },
    },
    {
        source: ANALYSIS,
        target: SEARCH_CONDITION,
        uiConfig: {},
    },
    {
        source: SUMMARY,
        target: ORGANIZATION,
        uiConfig: {},
    },
];
