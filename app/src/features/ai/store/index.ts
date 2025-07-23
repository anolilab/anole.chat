import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ChatMention, ChatModel, ChatThread, Project } from "@/types/chat";
import type { AllowedMCPServer, MCPServerInfo } from "@/types/mcp";
import type { WorkflowSummary } from "@/types/workflow";

import { OPENAI_VOICE } from "../lib/speech/open-ai/use-voice-chat.openai";
import type { AppDefaultToolkit } from "../lib/tools";

export interface AppState {
    allowedAppDefaultToolkit?: AppDefaultToolkit[];
    allowedMcpServers?: Record<string, AllowedMCPServer>;
    chatModel?: ChatModel;
    currentProjectId: Project["id"] | null;
    currentThreadId: ChatThread["id"] | null;
    generatingTitleThreadIds: string[];
    mcpCustomizationPopup?: MCPServerInfo & { id: string };
    mcpList: (MCPServerInfo & { id: string })[];
    openChatPreferences: boolean;
    openShortcutsPopup: boolean;
    projectList: Omit<Project, "instructions">[];
    temporaryChat: {
        chatModel?: ChatModel;
        instructions: string;
        isOpen: boolean;
    };
    threadList: ChatThread[];
    threadMentions: {
        [threadId: string]: ChatMention[];
    };
    toolChoice: "auto" | "none" | "manual";
    toolPresets: {
        allowedAppDefaultToolkit?: AppDefaultToolkit[];
        allowedMcpServers?: Record<string, AllowedMCPServer>;
        name: string;
    }[];
    voiceChat: {
        isOpen: boolean;
        options: {
            provider: string;
            providerOptions?: Record<string, any>;
        };
        projectId?: string;
        threadId?: string;
    };
    workflowToolList: WorkflowSummary[];
}

export interface AppDispatch {
    mutate: (state: Mutate<AppState>) => void;
}

const initialState: AppState = {
    allowedAppDefaultToolkit: [],
    allowedMcpServers: undefined,
    currentProjectId: null,
    currentThreadId: null,
    generatingTitleThreadIds: [],
    mcpCustomizationPopup: undefined,
    mcpList: [],
    openChatPreferences: false,
    openShortcutsPopup: false,
    projectList: [],
    temporaryChat: {
        instructions: "",
        isOpen: false,
    },
    threadList: [],
    threadMentions: {},
    toolChoice: "auto",
    toolPresets: [],
    voiceChat: {
        isOpen: false,
        options: {
            provider: "openai",
            providerOptions: {
                model: OPENAI_VOICE["Alloy"],
            },
        },
    },
    workflowToolList: [],
};

export const appStore = create<AppDispatch & AppState>()(
    persist(
        (set) => {
            return {
                ...initialState,
                mutate: set,
            };
        },
        {
            name: "mc-app-store-v2.0.0",
            partialize: (state) => {
                return {
                    allowedAppDefaultToolkit: state.allowedAppDefaultToolkit || initialState.allowedAppDefaultToolkit,
                    allowedMcpServers: state.allowedMcpServers || initialState.allowedMcpServers,
                    chatModel: state.chatModel || initialState.chatModel,
                    temporaryChat: {
                        ...initialState.temporaryChat,
                        ...state.temporaryChat,
                        isOpen: false,
                    },
                    toolChoice: state.toolChoice || initialState.toolChoice,
                    toolPresets: state.toolPresets || initialState.toolPresets,
                    voiceChat: {
                        ...initialState.voiceChat,
                        ...state.voiceChat,
                        isOpen: false,
                        projectId: undefined,
                        threadId: undefined,
                    },
                };
            },
        },
    ),
);
