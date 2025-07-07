import { AuthFunctions, BetterAuth, convexAdapter, PublicAuthFunctions } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { api, components, internal } from "./_generated/api";
import { sendMagicLink, sendOTPVerification } from "./email/functions";
import { sendEmailVerification, sendResetPassword } from "./email/functions";
import { magicLink, emailOTP, twoFactor, organization } from "better-auth/plugins";
import { betterAuth } from "better-auth";
import { GenericCtx, query } from "./_generated/server";
import { DataModel, Id } from "./_generated/dataModel";
import { SITE_URL } from "./env";

const authFunctions: AuthFunctions = internal.auth;
const publicAuthFunctions: PublicAuthFunctions = api.auth;

export const betterAuthComponent = new BetterAuth(components.betterAuth, {
    authFunctions,
    publicAuthFunctions,
    verbose: false,
});

export const createAuth = (ctx: GenericCtx) =>
    betterAuth({
        advanced: {
            cookiePrefix: "anole",
        },
        // All auth requests will be proxied through your TanStack Start server
        baseURL: SITE_URL,
        database: convexAdapter(ctx, betterAuthComponent),
        account: {
            accountLinking: {
                enabled: true,
            },
        },
        emailVerification: {
            sendVerificationEmail: async ({ user, url }) => {
                await sendEmailVerification({
                    ctx,
                    to: user.email,
                    url,
                });
            },
        },
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false,
            sendResetPassword: async ({ user, url }) => {
                await sendResetPassword({
                    ctx,
                    to: user.email,
                    url,
                });
            },
        },
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
        plugins: [
            //organization(),
            magicLink({
                sendMagicLink: async ({ email, url }) => {
                    await sendMagicLink({
                        ctx,
                        to: email,
                        url,
                    });
                },
            }),
            emailOTP({
                async sendVerificationOTP({ email, otp }) {
                    await sendOTPVerification({
                        ctx,
                        to: email,
                        code: otp,
                    });
                },
            }),
            twoFactor(),
            convex(),
            crossDomain({
                siteUrl: SITE_URL,
            }),
        ],
    });

export const { createUser, deleteUser, updateUser, createSession, isAuthenticated } = betterAuthComponent.createAuthFunctions<DataModel>({
    onCreateUser: async (ctx, user) => {
        // Example: copy the user's email to the application users table.
        // We'll use onUpdateUser to keep it synced.
        const userId = await ctx.db.insert("user", {
            email: user.email,
            role: "user",
        });

        // This function must return the user id.
        return userId;
    },
    onDeleteUser: async (ctx, userId) => {
        await ctx.db.delete(userId as Id<"user">);
    },
    onUpdateUser: async (ctx, user) => {
        // Keep the user's email synced
        const userId = user.userId as Id<"user">;
        await ctx.db.patch(userId, {
            email: user.email,
        });
    },
});

export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        // Get user data from Better Auth - email, name, image, etc.
        const userMetadata = await betterAuthComponent.getAuthUser(ctx);

        if (!userMetadata) {
            return null;
        }

        // Get user data from your application's database (skip this if you have no
        // fields in your users table schema)
        const user = await ctx.db.get(userMetadata.userId as Id<"user">);

        return {
            ...user,
            ...userMetadata,
        };
    },
});
