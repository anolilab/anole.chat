import { tool as createTool } from "ai";
import type { JSONSchema7 } from "json-schema";
import { isString } from "lib/utils";
import { safe } from "ts-safe";
import { convertJsonSchemaToZod } from "zod-from-json-schema";

export interface TavilyResponse {
    answer?: string;
    follow_up_questions?: string[];
    images?: {
        description?: string;
        url: string;
    }[];
    // Response structure from Tavily API
    query: string;
    results: {
        content: string;
        favicon?: string;
        published_date?: string;
        raw_content?: string;
        score: number;
        title: string;
        url: string;
    }[];
}

export const tavilySearchSchema: JSONSchema7 = {
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
        query: {
            description: "Search query",
            type: "string",
        },
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
};

export const tavilyWebContentSchema: JSONSchema7 = {
    properties: {
        extract_depth: {
            default: "basic",
            description: "Depth of extraction - 'basic' or 'advanced', if usrls are linkedin use 'advanced' or if explicitly told to use advanced",
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
};

const API_KEY = process.env.TAVILY_API_KEY;

const baseURLs = {
    extract: "https://api.tavily.com/extract",
    search: "https://api.tavily.com/search",
} as const;

const fetchTavily = async (url: string, body: any): Promise<TavilyResponse> => {
    if (!API_KEY) {
        throw new Error("Tavily API key is not configured");
    }

    const response = await fetch(url, {
        body: JSON.stringify({
            ...body,
            api_key: API_KEY,
        }),
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
        },
        method: "POST",
    });

    if (response.status === 401) {
        throw new Error("Invalid TavilyAPI key");
    }

    if (response.status === 429) {
        throw new Error("Tavily API usage limit exceeded");
    }

    if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }

    const result: TavilyResponse = await response.json();

    return {
        ...result,
        images: result.images?.map((image) => {
            return {
                description: image.description,
                url: isString(image) ? image : image.url,
            };
        }),
    };
};

export const tavilySearchToolForWorkflow = createTool({
    description:
        "A web search tool for quick research and information gathering. Provides basic search results with titles, summaries, and URLs from across the web. Perfect for finding relevant sources and getting an overview of topics.",
    execute: async (parameters) =>
        fetchTavily(baseURLs.search, {
            ...parameters,
            exclude_domains: Array.isArray(parameters.exclude_domains) ? parameters.exclude_domains : [],
            include_domains: Array.isArray(parameters.include_domains) ? parameters.include_domains : [],
            include_favicon: false,
            topic: parameters.country ? "general" : parameters.topic,
        }),
    parameters: convertJsonSchemaToZod(tavilySearchSchema),
});

export const tavilyWebContentToolForWorkflow = createTool({
    description:
        "A detailed web content extraction tool that analyzes and summarizes specific web pages from provided URLs. Extracts full content, processes it intelligently, and provides comprehensive summaries. Perfect for in-depth analysis of specific articles, documents, or web pages.",
    execute: async (parameters) =>
        fetchTavily(baseURLs.extract, {
            ...parameters,
            include_favicon: false,
            include_image_descriptions: true,
            include_images: true,
            include_raw_content: false,
        }),
    parameters: convertJsonSchemaToZod(tavilyWebContentSchema),
});

export const tavilySearchTool = createTool({
    description:
        "A web search tool for quick research and information gathering. Provides basic search results with titles, summaries, and URLs from across the web. Perfect for finding relevant sources and getting an overview of topics.",
    execute: (parameters) =>
        safe(() =>
            fetchTavily(baseURLs.search, {
                ...parameters,
                exclude_domains: Array.isArray(parameters.exclude_domains) ? parameters.exclude_domains : [],
                include_domains: Array.isArray(parameters.include_domains) ? parameters.include_domains : [],
                include_favicon: true,
                include_image_descriptions: true,
                include_images: true,
                topic: parameters.country ? "general" : parameters.topic,
            }),
        )
            .map((result) => {
                return {
                    ...result,
                    guide: `Use the search results to answer the user's question. Summarize the content and ask if they have any additional questions about the topic.`,
                };
            })
            .ifFail((e) => {
                return {
                    error: e.message,
                    isError: true,
                    solution:
                        "A web search error occurred. First, explain to the user what caused this specific error and how they can resolve it. Then provide helpful information based on your existing knowledge to answer their question.",
                };
            })
            .unwrap(),
    parameters: convertJsonSchemaToZod(tavilySearchSchema),
});

export const tavilyWebContentTool = createTool({
    description:
        "A detailed web content extraction tool that analyzes and summarizes specific web pages from provided URLs. Extracts full content, processes it intelligently, and provides comprehensive summaries. Perfect for in-depth analysis of specific articles, documents, or web pages.",
    execute: async (parameters) =>
        safe(() =>
            fetchTavily(baseURLs.extract, {
                ...parameters,
                include_favicon: true,
            }),
        )
            .ifFail((e) => {
                return {
                    error: e.message,
                    isError: true,
                    solution:
                        "A web content extraction error occurred. First, explain to the user what caused this specific error and how they can resolve it. Then provide helpful information based on your existing knowledge to answer their question.",
                };
            })
            .unwrap(),
    parameters: convertJsonSchemaToZod(tavilyWebContentSchema),
});
