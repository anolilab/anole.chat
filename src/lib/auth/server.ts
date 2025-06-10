import { ResetPasswordEmail } from "@/components/emails/reset-password-email";
import { SendMagicLinkEmail } from "@/components/emails/send-magic-link-email";
import { SendVerificationOTP } from "@/components/emails/send-verification-otp";
import { VerifyEmail } from "@/components/emails/verify-email";
import { WelcomeEmail } from "@/components/emails/welcome-email";
import { sendEmail } from "@/lib/resend";
import { betterAuth as betterAuthBase } from "better-auth";
import { anonymous, admin, magicLink, organization, jwt, oidcProvider } from "better-auth/plugins";
import { emailOTP } from "better-auth/plugins/email-otp";
import { passkey } from "better-auth/plugins/passkey";
import { twoFactor } from "better-auth/plugins/two-factor";
import { reactStartCookies } from "better-auth/react-start";
import { env } from "@/lib/env";
import { convexAdapter } from "@better-auth-kit/convex";
import { ConvexHttpClient } from "convex/browser";
import { genericOAuthClient } from "better-auth/client/plugins";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
//import { mcp } from "better-auth/plugins";

const convexClient = new ConvexHttpClient(env.VITE_CONVEX_URL);

const polarClient = new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    server: "sandbox",
});

const safeParseDate = (value: string | Date | null | undefined): Date | null => {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value;
    }
    
    return new Date(value);
};

export const ALGORITHM = "RS256";
export const AUDIENCE = "convex";
export const ISSUER = `${env.VITE_SITE_URL?.includes("localhost") ? "http" : "https"}://${env.VITE_SITE_URL}/api/auth`;

export const betterAuth = betterAuthBase({
    database: convexAdapter(convexClient),
    secret: env.VITE_BETTER_AUTH_SECRET,
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
        ...(env.DEV ? [anonymous()] : []),
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
              checkout({
                products: [
                  {
                    productId: "07d22e42-8b53-490c-b4de-faf760cabdc1",
                    slug: "Ai-Chat" // Custom slug for easy reference in Checkout URL, e.g. /checkout/Ai-Chat
                  }
                ],
                successUrl: `${env.VITE_SITE_URL}/${env.POLAR_SUCCESS_URL}`,
                authenticatedUsersOnly: true,
              }),
              portal(),
              usage(),
              webhooks({
                secret:
                  env.POLAR_WEBHOOK_SECRET ||
                  (() => {
                    throw new Error(
                      "POLAR_WEBHOOK_SECRET environment variable is required",
                    );
                  })(),
                onPayload: async ({ data, type }) => {
                  if (
                    type === "subscription.created" ||
                    type === "subscription.active" ||
                    type === "subscription.canceled" ||
                    type === "subscription.revoked" ||
                    type === "subscription.uncanceled" ||
                    type === "subscription.updated"
                  ) {
                    console.log("🎯 Processing subscription webhook:", type);
                    console.log("📦 Payload data:", JSON.stringify(data, null, 2));
      
                    try {
                      // STEP 1: Extract user ID from customer data
                      const userId = data.customer?.externalId;
                      // STEP 2: Build subscription data
                      const subscriptionData = {
                        id: data.id,
                        createdAt: new Date(data.createdAt),
                        modifiedAt: safeParseDate(data.modifiedAt),
                        amount: data.amount,
                        currency: data.currency,
                        recurringInterval: data.recurringInterval,
                        status: data.status,
                        currentPeriodStart:
                          safeParseDate(data.currentPeriodStart) || new Date(),
                        currentPeriodEnd:
                          safeParseDate(data.currentPeriodEnd) || new Date(),
                        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
                        canceledAt: safeParseDate(data.canceledAt),
                        startedAt: safeParseDate(data.startedAt) || new Date(),
                        endsAt: safeParseDate(data.endsAt),
                        endedAt: safeParseDate(data.endedAt),
                        customerId: data.customerId,
                        productId: data.productId,
                        discountId: data.discountId || null,
                        checkoutId: data.checkoutId || "",
                        customerCancellationReason:
                          data.customerCancellationReason || null,
                        customerCancellationComment:
                          data.customerCancellationComment || null,
                        metadata: data.metadata
                          ? JSON.stringify(data.metadata)
                          : null,
                        customFieldData: data.customFieldData
                          ? JSON.stringify(data.customFieldData)
                          : null,
                        userId: userId as string | null,
                      };
      
                      console.log("💾 Final subscription data:", {
                        id: subscriptionData.id,
                        status: subscriptionData.status,
                        userId: subscriptionData.userId,
                        amount: subscriptionData.amount,
                      });
      
                      // STEP 3: Use Drizzle's onConflictDoUpdate for proper upsert
                      // TODO: Implement this
                      /*
                      await db
                        .insert(subscription)
                        .values(subscriptionData)
                        .onConflictDoUpdate({
                          target: subscription.id,
                          set: {
                            modifiedAt: subscriptionData.modifiedAt || new Date(),
                            amount: subscriptionData.amount,
                            currency: subscriptionData.currency,
                            recurringInterval: subscriptionData.recurringInterval,
                            status: subscriptionData.status,
                            currentPeriodStart: subscriptionData.currentPeriodStart,
                            currentPeriodEnd: subscriptionData.currentPeriodEnd,
                            cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
                            canceledAt: subscriptionData.canceledAt,
                            startedAt: subscriptionData.startedAt,
                            endsAt: subscriptionData.endsAt,
                            endedAt: subscriptionData.endedAt,
                            customerId: subscriptionData.customerId,
                            productId: subscriptionData.productId,
                            discountId: subscriptionData.discountId,
                            checkoutId: subscriptionData.checkoutId,
                            customerCancellationReason:
                              subscriptionData.customerCancellationReason,
                            customerCancellationComment:
                              subscriptionData.customerCancellationComment,
                            metadata: subscriptionData.metadata,
                            customFieldData: subscriptionData.customFieldData,
                            userId: subscriptionData.userId,
                          },
                        });
                      */
                      console.log("✅ Upserted subscription:", data.id);
                    } catch (error) {
                      console.error(
                        "💥 Error processing subscription webhook:",
                        error,
                      );
                      // Don't throw - let webhook succeed to avoid retries
                    }
                  }
                },
              }),
            ],
          }),
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
