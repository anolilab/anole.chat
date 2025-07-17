import type {
    AuthFunctions,
    PublicAuthFunctions,
} from "@convex-dev/better-auth";
import { BetterAuth, convexAdapter } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import {
    anonymous,
    admin,
    emailOTP,
    magicLink,
    organization,
    twoFactor,
} from "better-auth/plugins";

import { api, components, internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import type { GenericCtx as GenericContext } from "./_generated/server";
import {
    sendEmailVerification,
    sendMagicLink,
    sendOTPVerification,
    sendResetPassword,
} from "./email/functions";
import { SITE_URL } from "./env";

const authFunctions: AuthFunctions = internal.auth;
const publicAuthFunctions: PublicAuthFunctions = api.auth;

export const betterAuthComponent = new BetterAuth(components.betterAuth, {
    authFunctions,
    publicAuthFunctions,
    verbose: false,
});

export const createAuth = (context: GenericContext) =>
    betterAuth({
        account: {
            accountLinking: {
                enabled: true,
            },
        },
        advanced: {
            cookiePrefix: "anole",
        },
        // All auth requests will be proxied through your TanStack Start server
        baseURL: SITE_URL,
        database: convexAdapter(context, betterAuthComponent),
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false,
            sendResetPassword: async ({ url, user }) => {
                await sendResetPassword({
                    ctx: context,
                    to: user.email,
                    url,
                });
            },
        },
        emailVerification: {
            sendVerificationEmail: async ({ url, user }) => {
                await sendEmailVerification({
                    ctx: context,
                    to: user.email,
                    url,
                });
            },
        },
        plugins: [
            anonymous(),
            organization(),
            admin(),
            magicLink({
                sendMagicLink: async ({ email, url }) => {
                    await sendMagicLink({
                        ctx: context,
                        to: email,
                        url,
                    });
                },
            }),
            emailOTP({
                async sendVerificationOTP({ email, otp }) {
                    await sendOTPVerification({
                        code: otp,
                        ctx: context,
                        to: email,
                    });
                },
            }),
            twoFactor(),
            convex(),
            /*
            crossDomain({
                siteUrl: SITE_URL,
            }),
            */
        ],
        /*
        socialProviders: {
            github: {
                clientId: process.env.GITHUB_CLIENT_ID as string,
                clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
            },
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID as string,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            },
        },
        */
        user: {
            deleteUser: {
                enabled: true,
            },
        },
    });

export const {
    createSession,
    createUser,
    deleteUser,
    isAuthenticated,
    updateUser,
} = betterAuthComponent.createAuthFunctions<DataModel>({
    onCreateUser: async (context, user) => {
        // Get default credits from environment or use 100 as fallback
        const defaultCredits = parseInt(process.env.DEFAULT_USER_CREDITS || "100", 10);
        
        const userId = await context.db.insert("extendedUsers", {
            credits: defaultCredits,
            email: user.email,
            role: "user",
        });

        // Log the initial credit allocation
        await context.runMutation(internal.auth.functions.logCreditTransaction, {
            amount: defaultCredits,
            description: "Initial credit allocation for new user",
            transactionType: "initial_allocation",
            userId,
        });

        return userId;
    },
    onDeleteUser: async (context, userId) => {
        await context.db.delete(userId as Id<"extendedUsers">);
    },
    onUpdateUser: async (context, user) => {
        // Keep the user's email synced
        const userId = user.userId as Id<"extendedUsers">;

        await context.db.patch(userId, {
            email: user.email,
        });
    },
});
