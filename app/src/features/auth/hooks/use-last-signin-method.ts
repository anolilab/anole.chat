"use client";

import { useIsHydrated } from "@anole/ui/hooks/use-hydrated";
import { useEffect, useState } from "react";

export type SignInMethod = "email" | "username" | "social" | "anonymous";

interface LastSignInData {
    method: SignInMethod;
    email?: string;
    timestamp: number;
}

const STORAGE_KEY = "last-signin-method";

export const useLastSignInMethod = () => {
    const isHydrated = useIsHydrated();
    const [lastSignIn, setLastSignIn] = useState<LastSignInData | null>(null);

    // Load from localStorage on hydration
    useEffect(() => {
        if (!isHydrated) return;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as LastSignInData;
                // Only use data that's less than 30 days old
                const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
                if (parsed.timestamp > thirtyDaysAgo) {
                    setLastSignIn(parsed);
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        } catch (error) {
            console.warn("Failed to load last sign-in method from localStorage:", error);
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [isHydrated]);

    const saveLastSignIn = (method: SignInMethod, email?: string) => {
        if (!isHydrated) return;

        try {
            const data: LastSignInData = {
                method,
                email,
                timestamp: Date.now(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            setLastSignIn(data);
        } catch (error) {
            console.warn("Failed to save last sign-in method to localStorage:", error);
        }
    };

    const clearLastSignIn = () => {
        if (!isHydrated) return;

        try {
            localStorage.removeItem(STORAGE_KEY);
            setLastSignIn(null);
        } catch (error) {
            console.warn("Failed to clear last sign-in method from localStorage:", error);
        }
    };

    const getLastSignInMessage = () => {
        if (!lastSignIn) return null;

        const daysSince = Math.floor((Date.now() - lastSignIn.timestamp) / (24 * 60 * 60 * 1000));

        if (daysSince === 0) {
            return "You signed in today";
        } else if (daysSince === 1) {
            return "You signed in yesterday";
        } else if (daysSince < 7) {
            return `You signed in ${daysSince} days ago`;
        } else if (daysSince < 30) {
            const weeks = Math.floor(daysSince / 7);
            return `You signed in ${weeks} week${weeks > 1 ? 's' : ''} ago`;
        }

        return null;
    };

    return {
        lastSignIn,
        saveLastSignIn,
        clearLastSignIn,
        getLastSignInMessage,
        isHydrated,
    };
};
