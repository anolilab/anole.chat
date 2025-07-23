import type { UIMessage } from "ai";

export type UIMessageWithCompleted = UIMessage & { completed: boolean };

export interface VoiceChatSession {
    error: Error | null;
    isActive: boolean;
    isAssistantSpeaking: boolean;
    isListening: boolean;
    isLoading: boolean;
    isUserSpeaking: boolean;
    messages: UIMessageWithCompleted[];
    start: () => Promise<void>;
    startListening: () => Promise<void>;
    stop: () => Promise<void>;
    stopListening: () => Promise<void>;
}

export type VoiceChatHook = (properties?: { [key: string]: any }) => VoiceChatSession;

export const DEFAULT_VOICE_TOOLS = [
    {
        description: "Change the browser theme",
        name: "changeBrowserTheme",
        parameters: {
            properties: {
                theme: {
                    enum: ["light", "dark"],
                    type: "string",
                },
            },
            required: ["theme"],
            type: "object",
        },
        type: "function",
    },
];
