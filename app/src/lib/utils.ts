import { api } from "@anole/convex/api";
import { convexQuery } from "@convex-dev/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { customAlphabet } from "nanoid";
import { v7 } from "uuid";

export const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789");

export const uuid = () => v7();

// Utility function to check if value is null or undefined
export const isNull = (value: unknown): value is null | undefined => value === null || value === undefined;

// Utility function to convert any value to any type
export const toAny = <T>(value: T): any => value;

// Utility function to convert error to string
export const errorToString = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
};

// Utility function to safely parse JSON
export const safeJSONParse = (json: string): { success: true; value: unknown } | { error: unknown; success: false } => {
    try {
        const parsed = JSON.parse(json);

        return { success: true, value: parsed };
    } catch (error) {
        return { error, success: false };
    }
};

// Utility function to create a locker for async operations
export class Locker {
    private locked = false;

    private queue: (() => void)[] = [];

    async acquire(): Promise<void> {
        if (this.locked) {
            return new Promise((resolve) => {
                this.queue.push(resolve);
            });
        }

        this.locked = true;
    }

    release(): void {
        this.locked = false;
        const next = this.queue.shift();

        if (next) {
            this.locked = true;
            next();
        }
    }
}

// Utility function to add timeout to promises
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => Promise.race([
    promise,
    new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
]);

// Utility function to fetch data
export const fetcher = async (url: string) => {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};

export const convertImageToBase64 = async (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.readAsDataURL(file);
        reader.addEventListener("load", () => {
            resolve(reader.result as string);
        });
        reader.onerror = reject;
    });

/**
 * Format bytes to human readable format
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0)
        return "0 Bytes";

    const k = 1024;
    const dm = Math.max(decimals, 0);
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const index = Math.floor(Math.log(bytes) / Math.log(k));

    return `${Number.parseFloat((bytes / k ** index).toFixed(dm))} ${sizes[index]}`;
};

/**
 * Format date to human readable format
 */
export const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
    }

    if (diffInHours < 24) {
        const hours = Math.floor(diffInHours);

        return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    if (diffInHours < 168) {
        // 7 days
        const days = Math.floor(diffInHours / 24);

        return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    return date.toLocaleDateString();
};

/**
 * Determines the appropriate redirect URL after successful authentication.
 * Checks for the user's last chat ID and validates if it still exists.
 * Falls back to /chat if no last chat is found or if it doesn't exist.
 */
export const getAuthRedirectUrl = async (convex: QueryClient): Promise<string> => {
    try {
        const settings = await convex.fetchQuery(convexQuery(api.auth.functions.getUserSettings, {}));

        if (settings?.lastChatId) {
            const threadExists = await convex.fetchQuery(
                convexQuery(api.chat.functions.validateThreadExists, {
                    threadId: settings?.lastChatId,
                }),
            );

            if (threadExists) {
                return `/chat/${settings?.lastChatId}`;
            }
        }
    } catch (error) {
        console.warn("Failed to get last chat ID:", error);
    }

    // Default to chat home if no last chat or if it doesn't exist
    return "/chat";
};
