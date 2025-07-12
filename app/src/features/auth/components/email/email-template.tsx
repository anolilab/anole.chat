import { Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Tailwind, Text } from "@react-email/components";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface EmailTemplateClassNames {
    body?: string;
    button?: string;
    container?: string;
    content?: string;
    footer?: string;
    heading?: string;
    hr?: string;
    image?: string;
    link?: string;
}

export interface EmailTemplateProperties {
    action?: string;
    /** @default process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL */
    baseUrl?: string;
    classNames?: EmailTemplateClassNames;
    content: ReactNode;
    heading: ReactNode;
    /** @default `${baseUrl}/apple-touch-icon.png` */
    imageUrl?: string;
    preview?: string;
    /** @default process.env.SITE_NAME || process.env.NEXT_PUBLIC_SITE_NAME */
    siteName?: string;
    url?: string;
    /** @default "vercel" */
    variant?: "vercel";
}

export const EmailTemplate = ({
    action,
    baseUrl,
    classNames,
    content,
    heading,
    imageUrl,
    preview,
    siteName,
    url,
    variant = "vercel",
}: EmailTemplateProperties) => {
    baseUrl = baseUrl || process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    imageUrl = imageUrl || `${baseUrl}/apple-touch-icon.png`;
    siteName = siteName || process.env.SITE_NAME || process.env.NEXT_PUBLIC_SITE_NAME;
    preview = preview || (typeof heading === "string" ? heading : undefined);

    return (
        <Html>
            <Head>
                <meta name="x-apple-disable-message-reformatting" />
                <meta content="light dark" name="color-scheme" />
                <meta content="light dark" name="supported-color-schemes" />

                <style type="text/css">
                    {`
                        :root {
                            color-scheme: light dark;
                            supported-color-schemes: light dark;
                        }
                    `}
                </style>

                <style type="text/css">
                    {`      
                        html, body {
                            background-color: #ffffff;
                            color: #000000;
                        }

                        a {
                            color: #000000;
                        }

                        .border-color {
                            border-color: #eaeaea;
                        }

                        .action-button {
                            background-color: #000000 !important;
                            color: #ffffff !important;
                        }

                        @media (prefers-color-scheme: dark) {
                            html, body {
                                background-color: #000000 !important;
                                color: #ffffff !important;
                            }

                            a {
                                color: #ffffff;
                            }

                            .border-color {
                                border-color: #333333 !important;
                            }

                            .action-button {
                                background-color: rgb(38, 38, 38) !important;
                                color: #ffffff !important;
                            }
                        }
                    `}
                </style>
            </Head>

            {preview && <Preview>{preview}</Preview>}

            <Tailwind>
                <Body className={cn("mx-auto my-auto px-2 font-sans", classNames?.body)}>
                    <Container className="border-color mx-auto my-[40px] max-w-[465px] rounded border border-solid p-[20px]">
                        <Section className="mt-[32px]">
                            <Img alt={siteName} className={cn("mx-auto my-0 rounded-full", classNames?.image)} height="40" src={imageUrl} width="40" />
                        </Section>

                        <Heading className={cn("mx-0 my-[30px] p-0 text-center text-[24px] font-bold", classNames?.heading)}>{heading}</Heading>

                        <Text className={cn("text-[14px] leading-[24px]", classNames?.content)}>{content}</Text>

                        {action && url && (
                            <Section className="mb-[32px] mt-[32px] text-center">
                                <Button
                                    className={cn("action-button rounded px-5 py-3 text-center text-[12px] font-semibold no-underline", classNames?.button)}
                                    href={url}
                                >
                                    {action}
                                </Button>
                            </Section>
                        )}

                        <Hr className={cn("border-color mx-0 my-[26px] w-full border border-solid", classNames?.hr)} />

                        <Text className={cn("text-[12px] leading-[24px] text-[#666666]", classNames?.footer)}>
                            {siteName && (
                                <>
                                    {siteName}
                                    {" "}
                                </>
                            )}

                            {baseUrl && (
                                <Link className={cn("no-underline", classNames?.link)} href={baseUrl}>
                                    {baseUrl?.replace("https://", "").replace("http://", "")}
                                </Link>
                            )}
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};
