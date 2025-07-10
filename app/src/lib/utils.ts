import { type ClassValue, clsx } from "clsx";
import { customAlphabet } from "nanoid";
import { twMerge } from "tailwind-merge";
import { v7 } from "uuid";
import type { QueryClient } from "@tanstack/react-query";
import { api } from "@anole/convex/api";
import { convexQuery } from "@convex-dev/react-query";

export function cn(...inputs: Array<ClassValue>) {
    return twMerge(clsx(inputs));
}

export const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789");

export const uuid = () => v7();

export const convertImageToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
    });
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
