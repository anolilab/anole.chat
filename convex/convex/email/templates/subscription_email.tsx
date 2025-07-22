/* eslint-disable react-refresh/only-export-components */
import { Body, Container, Head, Hr, Html, Img, Link, Preview, Text } from "@react-email/components";
import { render } from "@react-email/render";

import { SITE_URL } from "../../env";
import { sendEmail } from "../functions";

type SubscriptionEmailOptions = {
    email: string;
    subscriptionId: string;
};

/**
 * Templates.
 */
export const SubscriptionSuccessEmail = ({ email }: SubscriptionEmailOptions) => (
    <Html>
        <Head />
        <Preview>Successfully Subscribed to PRO</Preview>
        <Body
            style={{
                backgroundColor: "#ffffff",
                fontFamily: "-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Oxygen-Sans,Ubuntu,Cantarell,\"Helvetica Neue\",sans-serif",
            }}
        >
            <Container style={{ margin: "0 auto", padding: "20px 0 48px" }}>
                <Img alt="" height="37" src={`${SITE_URL}/images/convex-logo-email.jpg`} width="40" />
                <Text style={{ fontSize: "16px", lineHeight: "26px" }}>
                    Hello
                    {email}
                    !
                </Text>
                <Text style={{ fontSize: "16px", lineHeight: "26px" }}>
                    Your subscription to PRO has been successfully processed.
                    <br />
                    We hope you enjoy the new features!
                </Text>
                <Text style={{ fontSize: "16px", lineHeight: "26px" }}>
                    The
                    {" "}
                    <Link href="http://localhost:3000">domain-name.com</Link>
                    {" "}
                    team.
                </Text>
                <Hr style={{ borderColor: "#cccccc", margin: "20px 0" }} />
                <Text style={{ color: "#8898aa", fontSize: "12px" }}>200 domain-name.com</Text>
            </Container>
        </Body>
    </Html>
);

export const SubscriptionErrorEmail = ({ email }: SubscriptionEmailOptions) => (
    <Html>
        <Head />
        <Preview>Subscription Issue - Customer Support</Preview>
        <Body
            style={{
                backgroundColor: "#ffffff",
                fontFamily: "-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Oxygen-Sans,Ubuntu,Cantarell,\"Helvetica Neue\",sans-serif",
            }}
        >
            <Container style={{ margin: "0 auto", padding: "20px 0 48px" }}>
                <Img alt="" height="37" src="https://react-email-demo-ijnnx5hul-resend.vercel.app/static/vercel-logo.png" width="40" />
                <Text style={{ fontSize: "16px", lineHeight: "26px" }}>
                    Hello
                    {email}
                    .
                </Text>
                <Text style={{ fontSize: "16px", lineHeight: "26px" }}>
                    We were unable to process your subscription to PRO tier.
                    <br />
                    But don't worry, we'll not charge you anything.
                </Text>
                <Text style={{ fontSize: "16px", lineHeight: "26px" }}>
                    The
                    {" "}
                    <Link href="http://localhost:3000">domain-name.com</Link>
                    {" "}
                    team.
                </Text>
                <Hr style={{ borderColor: "#cccccc", margin: "20px 0" }} />
                <Text style={{ color: "#8898aa", fontSize: "12px" }}>200 domain-name.com</Text>
            </Container>
        </Body>
    </Html>
);

/**
 * Renders.
 */
export function renderSubscriptionSuccessEmail(arguments_: SubscriptionEmailOptions) {
    return render(<SubscriptionSuccessEmail {...arguments_} />);
}

export function renderSubscriptionErrorEmail(arguments_: SubscriptionEmailOptions) {
    return render(<SubscriptionErrorEmail {...arguments_} />);
}

/**
 * Senders.
 */
export async function sendSubscriptionSuccessEmail({ ctx, email, subscriptionId }: SubscriptionEmailOptions & { ctx: any }) {
    const html = await renderSubscriptionSuccessEmail({
        email,
        subscriptionId,
    });

    await sendEmail({
        ctx,
        html,
        subject: "Successfully Subscribed to PRO",
        to: email,
    });
}

export async function sendSubscriptionErrorEmail({ ctx, email, subscriptionId }: SubscriptionEmailOptions & { ctx: any }) {
    const html = await renderSubscriptionErrorEmail({ email, subscriptionId });

    await sendEmail({
        ctx,
        html,
        subject: "Subscription Issue - Customer Support",
        to: email,
    });
}
