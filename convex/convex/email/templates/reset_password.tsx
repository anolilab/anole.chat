import { Heading, Link, Text } from "@react-email/components";

import { BaseEmail, styles } from "./components/base_email";

interface ResetPasswordEmailProperties {
    brandLogoUrl?: string;
    brandName?: string;
    brandTagline?: string;
    url: string;
}

export default function ResetPasswordEmail({
    brandLogoUrl,
    brandName,
    brandTagline,
    url,
}: ResetPasswordEmailProperties) {
    return (
        <BaseEmail
            brandLogoUrl={brandLogoUrl}
            brandName={brandName}
            brandTagline={brandTagline}
            previewText="Reset your password"
        >
            <Heading style={styles.h1}>Reset Your Password</Heading>
            <Link
                href={url}
                style={{
                    ...styles.link,
                    display: "block",
                    marginBottom: "16px",
                }}
                target="_blank"
            >
                Click here to reset your password
            </Link>
            <Text
                style={{
                    ...styles.text,
                    color: "#ababab",
                    marginBottom: "16px",
                    marginTop: "14px",
                }}
            >
                If you didn&apos;t request a password reset, you can safely
                ignore this email.
            </Text>
        </BaseEmail>
    );
}
