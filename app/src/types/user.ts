import { z } from "zod/v4";

export type UserPreferences = {
    displayName?: string;
    profession?: string; // User's job or profession
    responseStyleExample?: string; // Example of preferred response style
};

export type User = {
    email: string;
    id: string;
    image: string | null;
    name: string;
    preferences?: UserPreferences;
};

export type UserRepository = {
    existsByEmail: (email: string) => Promise<boolean>;
    findById: (userId: string) => Promise<User | null>;
    getPreferences: (userId: string) => Promise<UserPreferences | null>;
    updatePreferences: (userId: string, preferences: UserPreferences) => Promise<User>;
    updateUser: (id: string, user: Pick<User, "name" | "image">) => Promise<User>;
};

export const UserZodSchema = z
    .object({
        email: z.string().email(),
        name: z.string().min(1),
        password: z.string().min(8),
    })
    .strict();

export const UserPreferencesZodSchema = z
    .object({
        displayName: z.string().optional(),
        profession: z.string().optional(),
        responseStyleExample: z.string().optional(),
    })
    .strict();
