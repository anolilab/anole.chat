import "../lib/polyfills";

// TODO: fix build pipe in convex
import { Resend /* vEmailId, vEmailEvent */ } from "@convex-dev/resend";
import { render } from "@react-email/components";
import { v } from "convex/values";

import { components, internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { requireUserId } from "../auth/lib/helper";
import MagicLinkEmail from "./templates/magic_link";
import ResetPasswordEmail from "./templates/reset_password";
import VerifyEmail from "./templates/verify_email";
import VerifyOTP from "./templates/verify_otp";

export const resend: Resend = new Resend(components.resend, {
    onEmailEvent: internal.email.functions.handleEmailEvent,
});

export const sendEmail = async ({ ctx, html, subject, to }: { ctx: any; html: string; subject: string; to: string }) => {
    await resend.sendEmail(ctx, "onboarding@boboddy.business", to, subject, html);
};

export const insertExpectation = internalMutation({
    args: {
        email: v.string(),
        expectation: v.union(v.literal("delivered"), v.literal("bounced"), v.literal("complained")),
    },
    handler: async (context, arguments_) => {
        await context.db.insert("emails", {
            email: arguments_.email,
            expectation: arguments_.expectation,
        });

        return null;
    },
    returns: v.null(),
});

export const handleEmailEvent = internalMutation({
    args: {
        event: v.string(),
        id: v.string(),
    },
    handler: async (context, arguments_) => {
        const email = await context.db
            .query("emails")
            .withIndex("by_email", (q) => q.eq("email", arguments_.id))
            .unique();

        if (!email) {
            console.log("No test email found for id", arguments_.id);

            return null;
        }

        if (arguments_.event.type === "email.delivered") {
            if (email.expectation === "bounced") {
                throw new Error("Email was delivered but expected to be bounced");
            }

            if (email.expectation === "complained") {
                console.log("Complained email was delivered, expecting complaint coming...");

                return null;
            }

            // All good. Delivered email was delivered.
            await context.db.delete(email._id);
        }

        if (arguments_.event.type === "email.bounced") {
            if (email.expectation !== "bounced") {
                throw new Error(`Email was bounced but expected to be ${email.expectation}`);
            }

            // All good. Bounced email was bounced.
            await context.db.delete(email._id);
        }

        if (arguments_.event.type === "email.complained") {
            if (email.expectation !== "complained") {
                throw new Error(`Email was complained but expected to be ${email.expectation}`);
            }

            // All good. Complained email was complained.
            await context.db.delete(email._id);
        }

        return null;
    },
    returns: v.null(),
});

// Helper functions called by Better Auth - these don't need authentication
// as they are called internally by the auth system during auth flows
export const sendEmailVerification = async ({ ctx, to, url }: { ctx: any; to: string; url: string }) => {
    await sendEmail({
        ctx,
        html: await render(<VerifyEmail url={url} />),
        subject: "Verify your email address",
        to,
    });
};

export const sendOTPVerification = async ({ code, ctx, to }: { code: string; ctx: any; to: string }) => {
    await sendEmail({
        ctx,
        html: await render(<VerifyOTP code={code} />),
        subject: "Verify your email address",
        to,
    });
};

export const sendMagicLink = async ({ ctx, to, url }: { ctx: any; to: string; url: string }) => {
    await sendEmail({
        ctx,
        html: await render(<MagicLinkEmail url={url} />),
        subject: "Sign in to your account",
        to,
    });
};

export const sendResetPassword = async ({ ctx, to, url }: { ctx: any; to: string; url: string }) => {
    await sendEmail({
        ctx,
        html: await render(<ResetPasswordEmail url={url} />),
        subject: "Reset your password",
        to,
    });
};
