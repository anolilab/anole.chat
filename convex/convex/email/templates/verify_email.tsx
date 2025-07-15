import { Heading, Link, Text } from "@react-email/components";

import { BaseEmail, styles } from "./components/base_email";

interface VerifyEmailProperties {
    brandLogoUrl?: string;
    brandName?: string;
    brandTagline?: string;
    url: string;
}

export default function VerifyEmail({
    brandLogoUrl,
    brandName,
    brandTagline,
    url,
}: VerifyEmailProperties) {
    return (
        <BaseEmail
            brandLogoUrl={brandLogoUrl}
            brandName={brandName}
            brandTagline={brandTagline}
            previewText="Verify your email address"
        >
            <Heading style={styles.h1}>Verify your email</Heading>
            <Link
                href={url}
                style={{
                    ...styles.link,
                    display: "block",
                    marginBottom: "16px",
                }}
                target="_blank"
            >
                Click here to verify your email address
            </Link>
            <Text
                style={{
                    ...styles.text,
                    color: "#ababab",
                    marginBottom: "16px",
                    marginTop: "14px",
                }}
            >
                If you didn&apos;t create an account, you can safely ignore this
                email.
            </Text>
        </BaseEmail>
    );
}
