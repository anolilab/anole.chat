"use client";

import type { TextPart } from "ai";
import { generateUUID } from "lib/utils";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";

import { callMcpToolByServerNameAction } from "@/app/api/mcp/actions";
import { appStore } from "@/app/store";
import type { ToolInvocationUIPart } from "@/types/chat";

import type { UIMessageWithCompleted, VoiceChatSession } from "..";
import { DEFAULT_VOICE_TOOLS } from "..";
import { extractMCPToolId } from "../lib/mcp/mcp-tool-id";
import type { OpenAIRealtimeServerEvent, OpenAIRealtimeSession } from "./openai-realtime-event";

export const OPENAI_VOICE = {
    Alloy: "alloy",
    Ash: "ash",
    Ballad: "ballad",
    Coral: "coral",
    Echo: "echo",
    Sage: "sage",
    Shimmer: "shimmer",
    Verse: "verse",
};

interface UseOpenAIVoiceChatProperties {
    model?: string;
    voice?: string;
}

type Content
    = | {
        text: string;
        type: "text";
    }
    | {
        arguments: any;
        name: string;
        result?: any;
        state: "call" | "result";
        toolCallId: string;
        type: "tool-invocation";
    };

const createUIPart = (content: Content): TextPart | ToolInvocationUIPart => {
    if (content.type == "tool-invocation") {
        return {
            toolInvocation: {
                args: content.arguments,
                result: content.result,
                state: content.state,
                step: 0,
                toolCallId: content.toolCallId,
                toolName: content.name,
            },
            type: "tool-invocation",
        };
    }

    return {
        text: content.text,
        type: "text",
    };
};

const createUIMessage = (m: { completed?: boolean; content: Content; id?: string; role: "user" | "assistant" }): UIMessageWithCompleted => {
    const id = m.id ?? generateUUID();

    return {
        completed: m.completed ?? false,
        content: "",
        createdAt: new Date(),
        id,
        parts: [createUIPart(m.content)],
        role: m.role,
    };
};

export function useOpenAIVoiceChat(properties?: UseOpenAIVoiceChatProperties): VoiceChatSession {
    const { model = "gpt-4o-realtime-preview", voice = OPENAI_VOICE.Ash } = properties || {};

    const [currentThreadId, currentProjectId, allowedAppDefaultToolkit, allowedMcpServers, toolChoice] = appStore(
        useShallow((state) => [state.voiceChat.threadId, state.voiceChat.projectId, state.allowedAppDefaultToolkit, state.allowedMcpServers, state.toolChoice]),
    );

    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [messages, setMessages] = useState<UIMessageWithCompleted[]>([]);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const dataChannel = useRef<RTCDataChannel | null>(null);
    const audioElement = useRef<HTMLAudioElement | null>(null);
    const audioStream = useRef<MediaStream | null>(null);

    const { setTheme } = useTheme();
    const tracks = useRef<RTCRtpSender[]>([]);

    const startListening = useCallback(async () => {
        try {
            if (!audioStream.current) {
                audioStream.current = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
            }

            if (tracks.current.length > 0) {
                const micTrack = audioStream.current.getAudioTracks()[0];

                tracks.current.forEach((sender) => {
                    sender.replaceTrack(micTrack);
                });
            }

            setIsListening(true);
        } catch (error_) {
            setError(error_ instanceof Error ? error_ : new Error(String(error_)));
        }
    }, []);

    const stopListening = useCallback(async () => {
        try {
            if (audioStream.current) {
                audioStream.current.getTracks().forEach((track) => track.stop());
                audioStream.current = null;
            }

            if (tracks.current.length > 0) {
                const placeholderTrack = createEmptyAudioTrack();

                tracks.current.forEach((sender) => {
                    sender.replaceTrack(placeholderTrack);
                });
            }

            setIsListening(false);
        } catch (error_) {
            setError(error_ instanceof Error ? error_ : new Error(String(error_)));
        }
    }, []);

    const createSession = useCallback(async (): Promise<OpenAIRealtimeSession> => {
        const response = await fetch(`/api/chat/openai-realtime?model=${model}&voice=${voice}`, {
            body: JSON.stringify({
                allowedAppDefaultToolkit,
                allowedMcpServers,
                model,
                projectId: currentProjectId,
                threadId: currentThreadId,
                toolChoice,
                voice,
            }),
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
        });

        if (response.status !== 200) {
            throw new Error(await response.text());
        }

        return response.json();
    }, [model, voice, allowedAppDefaultToolkit, allowedMcpServers, currentThreadId, toolChoice]);

    const updateUIMessage = useCallback(
        (id: string, action: Partial<UIMessageWithCompleted> | ((message: UIMessageWithCompleted) => Partial<UIMessageWithCompleted>)) => {
            setMessages((previous) => {
                if (previous.length > 0) {
                    const lastMessage = previous.find((m) => m.id == id);

                    if (!lastMessage)
                        return previous;

                    const nextMessage = typeof action === "function" ? action(lastMessage) : action;

                    if (lastMessage == nextMessage)
                        return previous;

                    return previous.map((m) => (m.id == id ? { ...m, ...nextMessage } : m));
                }

                return previous;
            });
        },
        [],
    );

    const clientFunctionCall = useCallback(
        async ({ args, callId, id, toolName }: { args: string; callId: string; id: string; toolName: string }) => {
            let toolResult: any = "success";

            stopListening();
            const toolArguments = JSON.parse(args);

            if (DEFAULT_VOICE_TOOLS.some((t) => t.name === toolName)) {
                switch (toolName) {
                    case "changeBrowserTheme": {
                        setTheme(toolArguments?.theme);
                        break;
                    }
                }
            } else {
                const toolId = extractMCPToolId(toolName);

                toolResult = await callMcpToolByServerNameAction(toolId.serverName, toolId.toolName, toolArguments);
            }

            startListening();
            const resultText = JSON.stringify(toolResult).trim();

            const event = {
                item: {
                    call_id: callId,
                    output: resultText.slice(0, 15_000),
                    type: "function_call_output",
                },
                previous_item_id: id,
                type: "conversation.item.create",
            };

            updateUIMessage(id, (previous) => {
                const previousPart = previous.parts.find((p) => p.type == "tool-invocation");

                if (!previousPart)
                    return previous;

                const nextPart: ToolInvocationUIPart = {
                    ...previousPart,
                    toolInvocation: {
                        ...previousPart.toolInvocation,
                        result: toolResult,
                        state: "result",
                    },
                };

                return {
                    parts: [nextPart],
                };
            });
            dataChannel.current?.send(JSON.stringify(event));

            dataChannel.current?.send(JSON.stringify({ type: "response.create" }));
            dataChannel.current?.send(JSON.stringify({ type: "response.create" }));
        },
        [updateUIMessage],
    );

    const handleServerEvent = useCallback(
        (event: OpenAIRealtimeServerEvent) => {
            switch (event.type) {
                case "conversation.item.input_audio_transcription.completed": {
                    updateUIMessage(event.item_id, {
                        completed: true,
                        parts: [
                            {
                                text: event.transcript || "...speaking",
                                type: "text",
                            },
                        ],
                    });
                    break;
                }
                case "input_audio_buffer.committed": {
                    updateUIMessage(event.item_id, {
                        completed: true,
                        parts: [
                            {
                                text: "",
                                type: "text",
                            },
                        ],
                    });
                    break;
                }
                case "input_audio_buffer.speech_started": {
                    const message = createUIMessage({
                        content: {
                            text: "",
                            type: "text",
                        },
                        id: event.item_id,
                        role: "user",
                    });

                    setIsUserSpeaking(true);
                    setMessages((previous) => [...previous, message]);
                    break;
                }
                case "input_audio_buffer.speech_stopped": {
                    setIsUserSpeaking(false);
                    break;
                }
                case "output_audio_buffer.stopped": {
                    setIsAssistantSpeaking(false);
                    break;
                }
                case "response.audio_transcript.delta": {
                    setIsAssistantSpeaking(true);
                    setMessages((previous) => {
                        const message = previous.findLast((m) => m.id == event.item_id)!;

                        if (message) {
                            return previous.map((m) =>
                                (m.id == event.item_id
                                    ? {
                                        ...m,
                                        parts: [
                                            {
                                                text: (message.parts[0] as TextPart).text! + event.delta,
                                                type: "text",
                                            },
                                        ],
                                    }
                                    : m),
                            );
                        }

                        return [
                            ...previous,
                            createUIMessage({
                                completed: true,
                                content: {
                                    text: event.delta,
                                    type: "text",
                                },
                                id: event.item_id,
                                role: "assistant",
                            }),
                        ];
                    });
                    break;
                }
                case "response.audio_transcript.done": {
                    updateUIMessage(event.item_id, (previous) => {
                        const textPart = previous.parts.find((p) => p.type == "text");

                        if (!textPart)
                            return previous;

                        textPart.text = event.transcript || "";

                        return {
                            ...previous,
                            completed: true,
                        };
                    });
                    break;
                }
                case "response.function_call_arguments.done": {
                    const message = createUIMessage({
                        completed: true,
                        content: {
                            arguments: JSON.parse(event.arguments),
                            name: event.name,
                            state: "call",
                            toolCallId: event.call_id,
                            type: "tool-invocation",
                        },
                        id: event.item_id,
                        role: "assistant",
                    });

                    setMessages((previous) => [...previous, message]);
                    clientFunctionCall({
                        args: event.arguments,
                        callId: event.call_id,
                        id: event.item_id,
                        toolName: event.name,
                    });
                    break;
                }
            }
        },
        [clientFunctionCall, updateUIMessage],
    );

    const start = useCallback(async () => {
        if (isActive || isLoading)
            return;

        setIsLoading(true);
        setError(null);
        setMessages([]);

        try {
            const session = await createSession();
            const sessionToken = session.client_secret.value;
            const pc = new RTCPeerConnection();

            if (!audioElement.current) {
                audioElement.current = document.createElement("audio");
            }

            audioElement.current.autoplay = true;
            pc.ontrack = (e) => {
                if (audioElement.current) {
                    audioElement.current.srcObject = e.streams[0];
                }
            };

            if (!audioStream.current) {
                audioStream.current = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
            }

            tracks.current = [];
            audioStream.current.getTracks().forEach((track) => {
                const sender = pc.addTrack(track, audioStream.current!);

                if (sender)
                    tracks.current.push(sender);
            });

            const dc = pc.createDataChannel("oai-events");

            dataChannel.current = dc;
            dc.addEventListener("message", async (e) => {
                try {
                    const event = JSON.parse(e.data) as OpenAIRealtimeServerEvent;

                    handleServerEvent(event);
                } catch (error_) {
                    console.error({
                        data: e.data,
                        error: error_,
                    });
                }
            });
            dc.addEventListener("open", () => {
                setIsActive(true);
                setIsListening(true);
                setIsLoading(false);
            });
            dc.addEventListener("close", () => {
                setIsActive(false);
                setIsListening(false);
                setIsLoading(false);
            });
            dc.addEventListener("error", (errorEvent) => {
                console.error(errorEvent);
                setError(errorEvent.error);
                setIsActive(false);
                setIsListening(false);
            });
            const offer = await pc.createOffer();

            await pc.setLocalDescription(offer);
            const sdpResponse = await fetch(`https://api.openai.com/v1/realtime`, {
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${sessionToken}`,
                    "Content-Type": "application/sdp",
                },
                method: "POST",
            });
            const answer: RTCSessionDescriptionInit = {
                sdp: await sdpResponse.text(),
                type: "answer",
            };

            await pc.setRemoteDescription(answer);
            peerConnection.current = pc;
        } catch (error_) {
            setError(error_ instanceof Error ? error_ : new Error(String(error_)));
            setIsActive(false);
            setIsListening(false);
            setIsLoading(false);
        }
    }, [isActive, isLoading, createSession, handleServerEvent, voice]);

    const stop = useCallback(async () => {
        try {
            if (dataChannel.current) {
                dataChannel.current.close();
                dataChannel.current = null;
            }

            if (peerConnection.current) {
                peerConnection.current.close();
                peerConnection.current = null;
            }

            tracks.current = [];
            stopListening();
            setIsActive(false);
            setIsListening(false);
            setIsLoading(false);
        } catch (error_) {
            setError(error_ instanceof Error ? error_ : new Error(String(error_)));
        }
    }, [stopListening]);

    useEffect(
        () => () => {
            stop();
        },
        [stop],
    );

    function createEmptyAudioTrack(): MediaStreamTrack {
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();

        return destination.stream.getAudioTracks()[0];
    }

    return {
        error,
        isActive,
        isAssistantSpeaking,
        isListening,
        isLoading,
        isUserSpeaking,
        messages,
        start,
        startListening,
        stop,
        stopListening,
    };
}
