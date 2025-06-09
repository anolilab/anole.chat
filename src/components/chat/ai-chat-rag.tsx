import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type UseChatHelpers, useChat } from "@ai-sdk/react";

import { ArrowUpIcon, StopCircleIcon } from "lucide-react";
import { memo, useEffect, useRef } from "react";

// Types
interface Attachment {
    contentType?: string;
    url: string;
    name?: string;
}

interface ToolInvocationType {
    toolName: string;
    toolCallId: string;
    state: string;
    result?: Array<{
        name: string;
    }>;
}

interface MessagePart {
    type: string;
    toolInvocation: ToolInvocationType;
}

interface MessageType {
    id: string;
    role: string;
    content: string;
    parts?: MessagePart[];
    experimental_attachments?: Attachment[];
}

// Message Components
const MessageHeader = ({ role }: { role: string }) => <div className="font-bold">{role}</div>;

const ToolInvocation = ({ toolInvocation }: { toolInvocation: ToolInvocationType }) => {
    if (toolInvocation.toolName === "addResource" && toolInvocation.state === "call") {
        return <p key={toolInvocation.toolCallId}>Calling addResource tool</p>;
    }

    if (toolInvocation.toolName === "getInformation" && toolInvocation.state === "call") {
        return (
            <div key={toolInvocation.toolCallId} className="animate-pulse">
                Calling getInformation tool
            </div>
        );
    }

    if (toolInvocation.toolName === "generateImage") {
        return (
            <div key={toolInvocation.toolCallId} className="animate-pulse">
                Calling generateImage tool
            </div>
        );
    }

    if (toolInvocation.toolName === "getInformation" && toolInvocation.state === "result") {
        const result = toolInvocation.result?.[0]?.name.replaceAll("\n", "");
        return (
            <div key={toolInvocation.toolCallId}>
                {toolInvocation.toolName} tool result: {result}
            </div>
        );
    }

    return null;
};

const ImageAttachment = ({ url, name, id }: { url: string; name?: string; id: string }) => (
    <img src={url} width={500} height={500} alt={name ?? "image attachment"} />
);

const PdfAttachment = ({ url, name, id }: { url: string; name?: string; id: string }) => (
    <iframe src={url} width="500" height="600" title={name ?? "pdf attachment"} />
);

const MessageAttachments = ({ attachments = [], messageId }: { attachments?: Attachment[]; messageId: string }) => {
    if (!attachments.length) return null;

    const filteredAttachments = attachments.filter(
        (attachment) => attachment?.contentType?.startsWith("image/") || attachment?.contentType?.startsWith("application/pdf"),
    );

    if (!filteredAttachments.length) return null;

    return (
        <div>
            {filteredAttachments.map((attachment, index) => {
                const uniqueId = `${messageId}-${index}`;

                if (attachment.contentType?.startsWith("image/")) {
                    return <ImageAttachment key={uniqueId} url={attachment.url} name={attachment.name} id={uniqueId} />;
                }

                if (attachment.contentType?.startsWith("application/pdf")) {
                    return <PdfAttachment key={uniqueId} url={attachment.url} name={attachment.name} id={uniqueId} />;
                }

                return null;
            })}
        </div>
    );
};

const MessageContent = ({ content }: { content: string }) => <p>{content}</p>;

const MessageToolInvocations = ({ parts }: { parts?: MessagePart[] }) => {
    if (!parts) return null;

    return (
        <>
            {parts.map((part, index) =>
                part.type === "tool-invocation" && part.toolInvocation.state === "call" ? (
                    <ToolInvocation key={`${part.toolInvocation.toolCallId}-${index}`} toolInvocation={part.toolInvocation} />
                ) : part.type === "tool-invocation" && part.toolInvocation.state === "result" ? (
                    <ToolInvocation key={`${part.toolInvocation.toolCallId}-${index}`} toolInvocation={part.toolInvocation} />
                ) : null,
            )}
        </>
    );
};

const Message = ({ message }: { message: MessageType }) => {
    console.log("message", message);
    return (
        <div className="whitespace-pre-wrap">
            <div>
                <MessageHeader role={message.role} />
                <MessageToolInvocations parts={message.parts} />
                <MessageContent content={message.content} />
            </div>
            <MessageAttachments attachments={message.experimental_attachments} messageId={message.id} />
        </div>
    );
};

const MessageList = ({ messages, messagesEndRef }: { messages: MessageType[]; messagesEndRef: React.RefObject<HTMLDivElement | null> }) => {
    return (
        <div className="mx-auto mb-20 w-full max-w-2xl space-y-4 overflow-y-auto">
            {messages.map((message) => (
                <Message key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export function Chat({ api }: { api?: string }) {
    const { messages, input, handleInputChange, handleSubmit, status, setMessages, stop } = useChat({
        api: api || "/api/ai/chat/rag",
    });

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
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
            <MessageList messages={messages as MessageType[]} messagesEndRef={messagesEndRef} />

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
