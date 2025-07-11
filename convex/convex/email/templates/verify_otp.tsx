import { Heading, Text } from "@react-email/components";

import { BaseEmail, styles } from "./components/base_email";

interface VerifyOTPProperties {
    brandLogoUrl?: string;
    brandName?: string;
    brandTagline?: string;
    code: string;
}

export default function VerifyOTP({ brandLogoUrl, brandName, brandTagline, code }: VerifyOTPProperties) {
    return (
        <BaseEmail brandLogoUrl={brandLogoUrl} brandName={brandName} brandTagline={brandTagline} previewText="Your verification code">
            <Heading style={styles.h1}>Verify your email</Heading>
            <Text style={styles.text}>Enter this verification code to verify your email address:</Text>
            <code style={styles.code}>{code}</code>
            <Text
                style={{
                    ...styles.text,
                    color: "#ababab",
                    marginBottom: "16px",
                    marginTop: "14px",
                }}
            >
                If you didn&apos;t create an account, you can safely ignore this email.
            </Text>
        </BaseEmail>
    );
}
