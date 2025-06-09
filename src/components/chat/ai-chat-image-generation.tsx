import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type UseChatHelpers, useChat } from "@ai-sdk/react";

import { ArrowUpIcon, StopCircleIcon } from "lucide-react";
import { memo, useEffect, useRef } from "react";

// Suggestion card component
function ChatWelcome({ onSelectSuggestion }: { onSelectSuggestion: (suggestion: string) => void }) {
    const suggestions = [
        {
            title: "App Features",
            description: "Learn how to use the AI features",
            prompt: "How do I use the AI features in this app?",
        },
        {
            title: "Generate Images",
            description: "Create AI-generated artwork",
            prompt: "Can you generate an image of a mountain landscape?",
        },
        {
            title: "Creative Writing",
            description: "Get help with writing tasks",
            prompt: "Write me a short poem about technology",
        },
        {
            title: "AI Trends",
            description: "Explore current AI developments",
            prompt: "What are the latest AI trends in 2024?",
        },
    ];

    return (
        <div className="mt-12 flex flex-col items-center justify-center space-y-6">
            <h3 className="text-xl font-medium">How can I help you today?</h3>
            <div className="grid w-full max-w-lg grid-cols-2 gap-3">
                {suggestions.map((suggestion) => (
                    <button
                        key={suggestion.title}
                        type="button"
                        onClick={() => onSelectSuggestion(suggestion.prompt)}
                        className="cursor-pointer rounded-lg border p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <p className="font-medium">{suggestion.title}</p>
                        <p className="text-sm text-gray-500">{suggestion.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}

export function Chat() {
    const { messages, input, handleInputChange, handleSubmit, status, setMessages, stop } = useChat({
        api: "/api/ai/chat/image/generation",
    });

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleSelectSuggestion = (suggestion: string) => {
        handleInputChange({
            target: { value: suggestion },
        } as React.ChangeEvent<HTMLTextAreaElement>);
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    };

    // Scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Scroll when status changes
    useEffect(() => {
        if (status === "submitted") {
            scrollToBottom();
        }
    }, [status]);

    return (
        <div className="relative flex w-full flex-col items-center justify-center gap-4">
            <div className="mx-auto mb-20 w-full max-w-2xl space-y-4 overflow-y-auto">
                {messages.length > 0 ? (
                    messages.map((m) => (
                        <div key={m.id} className="whitespace-pre-wrap">
                            <div key={m.id}>
                                <div className="font-bold">{m.role}</div>
                                {m.parts
                                    ? m.parts.map((ti) =>
                                          ti.type === "tool-invocation" ? (
                                              ti.toolInvocation.toolName === "generateImage" && ti.toolInvocation.state === "result" ? (
                                                  <img
                                                      key={ti.toolInvocation.toolCallId}
                                                      src={`data:image/png;base64,${ti.toolInvocation.result.image}`}
                                                      alt={ti.toolInvocation.result.prompt}
                                                      height={400}
                                                      width={400}
                                                      onLoad={scrollToBottom}
                                                  />
                                              ) : (
                                                  <div key={ti.toolInvocation.toolCallId} className="animate-pulse">
                                                      Generating image...
                                                  </div>
                                              )
                                          ) : null,
                                      )
                                    : null}
                                <p>{m.content}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <ChatWelcome onSelectSuggestion={handleSelectSuggestion} />
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="relative flex w-full max-w-xl flex-col items-center justify-center">
                <div className="bg-background fixed bottom-0 z-10 mb-8 w-full max-w-lg">
                    <div className="relative flex flex-row items-center justify-between">
                        <Textarea
                            data-testid="multimodal-input"
                            ref={textareaRef}
                            placeholder="Send a message..."
                            value={input}
                            onChange={handleInputChange}
                            className="w-full rounded border border-gray-300 p-2 pr-10 shadow-xl"
                            rows={1}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    if (input.trim()) {
                                        handleSubmit(e);
                                    }
                                }
                            }}
                        />
                        <div className="absolute right-2">
                            {status === "submitted" ? (
                                <StopButton stop={stop} setMessages={setMessages} />
                            ) : (
                                <SendButton input={input} submitForm={handleSubmit} uploadQueue={[]} />
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

function PureStopButton({ stop, setMessages }: { stop: () => void; setMessages: UseChatHelpers["setMessages"] }) {
    return (
        <Button
            data-testid="stop-button"
            className="h-fit rounded-full border p-1.5 dark:border-zinc-600"
            onClick={(event) => {
                event.preventDefault();
                stop();
                setMessages((messages) => messages);
            }}
        >
            <StopCircleIcon size={14} />
        </Button>
    );
}

const StopButton = memo(PureStopButton);

function PureSendButton({ submitForm, input, uploadQueue }: { submitForm: () => void; input: string; uploadQueue: Array<string> }) {
    return (
        <Button
            data-testid="send-button"
            className="h-fit rounded-full border p-1.5 dark:border-zinc-600"
            onClick={(event) => {
                event.preventDefault();
                submitForm();
            }}
            disabled={input.length === 0 || uploadQueue.length > 0}
        >
            <ArrowUpIcon size={14} />
        </Button>
    );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
    if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length) return false;
    if (prevProps.input !== nextProps.input) return false;
    return true;
});
