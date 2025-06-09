import { ResetPasswordEmail } from "@/components/emails/reset-password-email";
import { SendMagicLinkEmail } from "@/components/emails/send-magic-link-email";
import { SendVerificationOTP } from "@/components/emails/send-verification-otp";
import { VerifyEmail } from "@/components/emails/verify-email";
import { WelcomeEmail } from "@/components/emails/welcome-email";
import { sendEmail } from "@/lib/resend";
import { betterAuth as betterAuthBase } from "better-auth";
import { anonymous, admin, magicLink, openAPI, organization, jwt, oidcProvider } from "better-auth/plugins";
import { emailOTP } from "better-auth/plugins/email-otp";
import { passkey } from "better-auth/plugins/passkey";
import { twoFactor } from "better-auth/plugins/two-factor";
import { reactStartCookies } from "better-auth/react-start";
import { env } from "../env.server";
import { convexAdapter } from "@better-auth-kit/convex";
import { ConvexHttpClient } from "convex/browser";
import { genericOAuthClient } from "better-auth/client/plugins";
//import { mcp } from "better-auth/plugins";

const convexClient = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);

export const ALGORITHM = "RS256";
export const AUDIENCE = "convex";
export const ISSUER = `${import.meta.env.VITE_SITE_URL?.includes("localhost") ? "http" : "https"}://${import.meta.env.VITE_SITE_URL}/api/auth`;

export const betterAuth = betterAuthBase({
    database: convexAdapter(convexClient),
    secret: env.BETTER_AUTH_SECRET,
    basePath: "/api/auth",
    baseURL: env.SERVER_URL,
    onAPIError: {
        throw: true,
        onError: (error) => {
            console.error("auth onAPIError", error);
        },
        errorURL: "/login",
    },
    rateLimit: {
        enabled: true,
        max: 100,
        window: 10,
    },
    user: {
        deleteUser: {
            enabled: true,
        },
    },
    logger: {
        enabled: true,
        level: "info",
    },
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    await sendEmail({
                        subject: "Welcome to MyApp",
                        template: WelcomeEmail({
                            username: user.name || user.email,
                        }),
                        to: user.email,
                    });
                },
            },
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        async sendResetPassword({ url, user }) {
            await sendEmail({
                subject: "Reset your password",
                template: ResetPasswordEmail({
                    resetLink: url,
                    username: user.email,
                }),
                to: user.email,
            });
        },
    },
    emailVerification: {
        sendVerificationEmail: async ({ url, user }) => {
            await sendEmail({
                subject: "Verify your email",
                template: VerifyEmail({
                    url: url,
                    username: user.email,
                }),
                to: user.email,
            });
        },
    },

    plugins: [
        ...(import.meta.env.DEV ? [anonymous()] : []),
        jwt({
            jwks: {
                keyPairConfig: {
                    alg: ALGORITHM,
                },
            },
        }),
        oidcProvider({
            loginPage: "/login",
            metadata: {
                issuer: ISSUER,
            },
        }),
        genericOAuthClient(),
        openAPI(),
        twoFactor(),
        passkey(),
        admin(),
        organization(),
        //mcp({
        //  loginPage: "/login",
        //}),
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                await sendEmail({
                    subject: "Verify your email",
                    template: SendVerificationOTP({
                        username: email,
                        otp: otp,
                    }),
                    to: email,
                });
            },
        }),
        magicLink({
            sendMagicLink: async ({ email, token, url }, request) => {
                await sendEmail({
                    subject: "Magic Link",
                    template: SendMagicLinkEmail({
                        username: email,
                        url: url,
                        token: token,
                    }),
                    to: email,
                });
            },
        }),
        reactStartCookies(), // make sure this is the last plugin in the array
    ],
});
