import {
    Body,
    Container,
    Head,
    Html,
    Img,
    Link,
    Preview,
    Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { Fragment } from "react";

export interface BaseEmailProperties {
    brandLogoUrl?: string;
    brandName?: string;
    brandTagline?: string;
    children: ReactNode;
    footerLinks?: { href: string; text: string }[];
    footerText?: string;
    previewText: string;
}

export const styles = {
    code: {
        backgroundColor: "#f4f4f4",
        border: "1px solid #eee",
        borderRadius: "5px",
        color: "#333",
        display: "inline-block",
        padding: "16px 4.5%",
        width: "90.5%",
    },
    container: {
        margin: "0 auto",
        paddingLeft: "12px",
        paddingRight: "12px",
    },
    footer: {
        color: "#898989",
        fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
        fontSize: "12px",
        lineHeight: "22px",
        marginBottom: "24px",
        marginTop: "12px",
    },
    h1: {
        color: "#333",
        fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
        fontSize: "24px",
        fontWeight: "bold",
        margin: "40px 0",
        padding: "0",
    },
    link: {
        color: "#2754C5",
        fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
        fontSize: "14px",
        textDecoration: "underline",
    },
    main: {
        backgroundColor: "#ffffff",
    },
    text: {
        color: "#333",
        fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
        fontSize: "14px",
        margin: "24px 0",
    },
};

export const BaseEmail = ({
    brandLogoUrl,
    brandName = "Better Auth",
    brandTagline = "Simple, secure authentication for your applications",
    children,
    footerLinks = [],
    footerText,
    previewText,
}: BaseEmailProperties) => (
    <Html>
        <Head />
        <Body style={styles.main}>
            <Preview>{previewText}</Preview>
            <Container style={styles.container}>
                {children}

                {brandLogoUrl && (
                    <Img
                        alt={`${brandName} Logo`}
                        height="32"
                        src={brandLogoUrl}
                        width="32"
                    />
                )}

                <Text style={styles.footer}>
                    {footerLinks.map((link, index) => (
                        <Fragment key={link.href}>
                            <Link
                                href={link.href}
                                style={{ ...styles.link, color: "#898989" }}
                                target="_blank"
                            >
                                {link.text}
                            </Link>
                            {index < footerLinks.length - 1 && " • "}
                        </Fragment>
                    ))}
                    {footerLinks.length > 0 && <br />}
                    {footerText || (
                        <>
                            {brandName}
                            ,
                            {brandTagline.toLowerCase()}
                        </>
                    )}
                </Text>
            </Container>
        </Body>
    </Html>
);
