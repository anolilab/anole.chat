import { env } from "@/lib/env.server";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { Resend } from "resend";

export async function sendEmail({ subject, template, to }: { subject: string; template: ReactElement; to: string }) {
    const resend = new Resend(env.RESEND_API_KEY);

    try {
        const html = await render(template);

        const { data } = await resend.emails.send({
            from: "noreply@example.com", // TODO: Configure in env
            html,
            subject,
            to,
        });

        return data;
    } catch (error) {
        console.error("error", error);
        throw error;
    }
}
