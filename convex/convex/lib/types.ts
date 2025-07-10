import type { Doc } from "../_generated/dataModel";

// Base User (from auth, extended in application's `user` table)
export type BaseUser = Doc<"user">;

// Application-specific User Profile Data
export type UserProfile = Doc<"user"> & {
    // Extend with any frontend-only fields here
};

export type Vouch = Doc<"vouches"> & {
    fromUser?: UserProfile;
    toUser?: UserProfile;
};

export type SocialLink = {
    type: "discord" | "twitter" | "roblox" | "youtube" | "twitch";
    url: string;
};

export type UserSettings = Doc<"userSettings">;

// Role definitions
export const ROLES = {
    USER: "user",
    ADMIN: "admin",
    BANNED: "banned",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];
