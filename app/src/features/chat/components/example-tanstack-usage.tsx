"use client";

import type { FC } from "react";
import { useState } from "react";

import { 
    createThread, 
    updateThreadMetadata,
    type ThreadMetadata 
} from "../collections/threads-collection";
import { 
    createMessage, 
    convertToMessageDocument,
    type MessageDocument 
} from "../collections/messages-collection";
import { 
    useThreads, 
    useMessagesSorted, 
    useThreadStats,
    useRecentThreads 
} from "../collections/query-collection";
import type { ThreadMessageLike } from "@assistant-ui/react";

export const ExampleTanStackUsage: FC = () => {
    const [newThreadTitle, setNewThreadTitle] = useState("");
    const [newMessageText, setNewMessageText] = useState("");
    const [selectedThreadId, setSelectedThreadId] = useState("default");

    // Query hooks
    const threads = useThreads();
    const messages = useMessagesSorted(selectedThreadId);
    const stats = useThreadStats();
    const recentThreads = useRecentThreads(5);

    const handleCreateThread = () => {
        if (!newThreadTitle.trim()) return;

        const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const metadata: Partial<ThreadMetadata> = {
            title: newThreadTitle,
            status: "active",
            createdAt: new Date(),
            lastActivity: new Date(),
        };

        createThread(threadId, metadata);
        setNewThreadTitle("");
        setSelectedThreadId(threadId);
    };

    const handleAddMessage = () => {
        if (!newMessageText.trim() || selectedThreadId === "default") return;

        const message: ThreadMessageLike = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            role: "user",
            content: [{ text: newMessageText, type: "text" }],
        };

        const messageDoc = convertToMessageDocument(message, selectedThreadId);
        createMessage(messageDoc);

        // Update thread's last activity
        updateThreadMetadata(selectedThreadId, { lastActivity: new Date() });

        setNewMessageText("");
    };

    const handleUpdateThreadTitle = (threadId: string, newTitle: string) => {
        updateThreadMetadata(threadId, { title: newTitle });
    };

    if (!threads || !messages) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">TanStack DB Collections Example</h1>

            {/* Statistics */}
            {stats && (
                <div className="bg-gray-100 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">Statistics</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>Total Threads: {stats.totalThreads}</div>
                        <div>Active Threads: {stats.activeThreads}</div>
                        <div>Total Messages: {stats.totalMessages}</div>
                        <div>Most Active Thread: {stats.mostActiveThread.threadId}</div>
                    </div>
                </div>
            )}

            {/* Create New Thread */}
            <div className="bg-blue-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Create New Thread</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newThreadTitle}
                        onChange={(e) => setNewThreadTitle(e.target.value)}
                        placeholder="Thread title"
                        className="flex-1 px-3 py-2 border rounded"
                    />
                    <button
                        onClick={handleCreateThread}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Create
                    </button>
                </div>
            </div>

            {/* Threads List */}
            <div className="bg-green-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">All Threads ({threads.length})</h2>
                <div className="space-y-2">
                    {threads.map((thread) => (
                        <div
                            key={thread.id}
                            className={`p-3 border rounded cursor-pointer ${
                                selectedThreadId === thread.id ? "bg-blue-100 border-blue-300" : "bg-white"
                            }`}
                            onClick={() => setSelectedThreadId(thread.id)}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-medium">{thread.metadata.title}</div>
                                    <div className="text-sm text-gray-600">
                                        {thread.metadata.status} • {thread.metadata.lastActivity.toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {thread.metadata.parentThreadId ? "Branch" : "Root"}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Threads */}
            {recentThreads && recentThreads.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">Recent Threads</h2>
                    <div className="space-y-1">
                        {recentThreads.map((thread) => (
                            <div key={thread.id} className="text-sm">
                                {thread.metadata.title} - {thread.metadata.lastActivity.toLocaleTimeString()}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages for Selected Thread */}
            {selectedThreadId !== "default" && (
                <div className="bg-purple-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">
                        Messages for "{threads.find(t => t.id === selectedThreadId)?.metadata.title}" ({messages.length})
                    </h2>
                    
                    {/* Add Message */}
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newMessageText}
                            onChange={(e) => setNewMessageText(e.target.value)}
                            placeholder="Message text"
                            className="flex-1 px-3 py-2 border rounded"
                            onKeyPress={(e) => e.key === "Enter" && handleAddMessage()}
                        />
                        <button
                            onClick={handleAddMessage}
                            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                        >
                            Send
                        </button>
                    </div>

                    {/* Messages List */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`p-3 rounded ${
                                    message.role === "user" ? "bg-blue-100 ml-8" : "bg-gray-100 mr-8"
                                }`}
                            >
                                <div className="text-sm font-medium text-gray-600 mb-1">
                                    {message.role}
                                </div>
                                <div>
                                    {message.content.map((content, index) => (
                                        <div key={index}>{content.text}</div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Thread Management */}
            {selectedThreadId !== "default" && (
                <div className="bg-red-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">Thread Management</h2>
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="New title"
                                className="flex-1 px-3 py-2 border rounded"
                                onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                        const target = e.target as HTMLInputElement;
                                        handleUpdateThreadTitle(selectedThreadId, target.value);
                                        target.value = "";
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    const newTitle = prompt("Enter new title:");
                                    if (newTitle) {
                                        handleUpdateThreadTitle(selectedThreadId, newTitle);
                                    }
                                }}
                                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            >
                                Update Title
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};