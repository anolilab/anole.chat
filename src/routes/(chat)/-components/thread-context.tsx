"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ThreadMessageLike } from "@assistant-ui/react";

interface ThreadContextType {
    currentThreadId: string;
    setCurrentThreadId: (id: string) => void;
    threads: Map<string, ThreadMessageLike[]>;
    setThreads: React.Dispatch<React.SetStateAction<Map<string, ThreadMessageLike[]>>>;
    threadMetadata: Map<string, { title: string; status: "active" | "archived" }>;
    setThreadMetadata: React.Dispatch<React.SetStateAction<Map<string, { title: string; status: "active" | "archived" }>>>;
}

const ThreadContext = createContext<ThreadContextType | null>(null);

export const useThreadContext = () => {
    const context = useContext(ThreadContext);
    if (!context) {
        throw new Error("useThreadContext must be used within ThreadProvider");
    }
    return context;
};

export const ThreadProvider = ({ children }: { children: ReactNode }) => {
    const [threads, setThreads] = useState<Map<string, ThreadMessageLike[]>>(new Map([["default", []]]));
    const [currentThreadId, setCurrentThreadId] = useState("default");
    const [threadMetadata, setThreadMetadata] = useState<Map<string, { title: string; status: "active" | "archived" }>>(new Map([]));

    return (
        <ThreadContext.Provider
            value={{
                currentThreadId,
                setCurrentThreadId,
                threads,
                setThreads,
                threadMetadata,
                setThreadMetadata,
            }}
        >
            {children}
        </ThreadContext.Provider>
    );
};
