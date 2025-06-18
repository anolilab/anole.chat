import "../lib/polyfills";
// TODO: fix build pipe in convex
import { Resend /*vEmailId, vEmailEvent*/ } from "@convex-dev/resend";
import { components, internal } from "../_generated/api";
import { render } from "@react-email/components";
import VerifyEmail from "./templates/verify_email";
import VerifyOTP from "./templates/verify_otp";
import MagicLinkEmail from "./templates/magic_link";
import ResetPasswordEmail from "./templates/reset_password";
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { requireUserId } from "../auth/lib/helper";

export const resend: Resend = new Resend(components.resend, {
    onEmailEvent: internal.email.functions.handleEmailEvent,
});

export const sendEmail = async ({ ctx, to, subject, html }: { ctx: any; to: string; subject: string; html: string }) => {
    await resend.sendEmail(ctx, "onboarding@boboddy.business", to, subject, html);
};

export const insertExpectation = internalMutation({
    args: {
        email: v.string(),
        expectation: v.union(v.literal("delivered"), v.literal("bounced"), v.literal("complained")),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.insert("emails", {
            email: args.email,
            expectation: args.expectation,
        });
        return null;
    },
});

export const handleEmailEvent = internalMutation({
    args: {
        id: v.string(),
        event: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const email = await ctx.db
            .query("emails")
            .withIndex("by_email", (q) => q.eq("email", args.id))
            .unique();

        if (!email) {
            console.log("No test email found for id", args.id);
            return null;
        }

        if (args.event.type === "email.delivered") {
            if (email.expectation === "bounced") {
                throw new Error("Email was delivered but expected to be bounced");
            }
            if (email.expectation === "complained") {
                console.log("Complained email was delivered, expecting complaint coming...");
                return null;
            }
            // All good. Delivered email was delivered.
            await ctx.db.delete(email._id);
        }

        if (args.event.type === "email.bounced") {
            if (email.expectation !== "bounced") {
                throw new Error(`Email was bounced but expected to be ${email.expectation}`);
            }
            // All good. Bounced email was bounced.
            await ctx.db.delete(email._id);
        }

        if (args.event.type === "email.complained") {
            if (email.expectation !== "complained") {
                throw new Error(`Email was complained but expected to be ${email.expectation}`);
            }
            // All good. Complained email was complained.
            await ctx.db.delete(email._id);
        }

        return null;
    },
});

// Helper functions called by Better Auth - these don't need authentication
// as they are called internally by the auth system during auth flows
export const sendEmailVerification = async ({ ctx, to, url }: { ctx: any; to: string; url: string }) => {
    await sendEmail({
        ctx,
        to,
        subject: "Verify your email address",
        html: await render(<VerifyEmail url={url} />),
    });
};

export const sendOTPVerification = async ({ ctx, to, code }: { ctx: any; to: string; code: string }) => {
    await sendEmail({
        ctx,
        to,
        subject: "Verify your email address",
        html: await render(<VerifyOTP code={code} />),
    });
};

export const sendMagicLink = async ({ ctx, to, url }: { ctx: any; to: string; url: string }) => {
    await sendEmail({
        ctx,
        to,
        subject: "Sign in to your account",
        html: await render(<MagicLinkEmail url={url} />),
    });
};

export const sendResetPassword = async ({ ctx, to, url }: { ctx: any; to: string; url: string }) => {
    await sendEmail({
        ctx,
        to,
        subject: "Reset your password",
        html: await render(<ResetPasswordEmail url={url} />),
    });
};
