import type { Doc as Document_ } from "../_generated/dataModel";

// Base User (from auth, extended in application's `user` table)
export type BaseUser = Document_<"user">;

// Application-specific User Profile Data
export type UserProfile = Document_<"user"> & {
    // Extend with any frontend-only fields here
};

export type Vouch = Document_<"vouches"> & {
    fromUser?: UserProfile;
    toUser?: UserProfile;
};

export type SocialLink = {
    type: "discord" | "twitter" | "roblox" | "youtube" | "twitch";
    url: string;
};

export type UserSettings = Document_<"userSettings">;

// Role definitions
export const ROLES = {
    ADMIN: "admin",
    BANNED: "banned",
    USER: "user",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];
