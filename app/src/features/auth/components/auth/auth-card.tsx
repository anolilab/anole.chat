"use client";

import { ArrowLeftIcon } from "lucide-react";
import { type ReactNode, useContext, useEffect, useState } from "react";

import { useIsHydrated } from "../../hooks/use-hydrated";
import { AuthUIContext } from "../../lib/auth-ui-provider";
import type { AuthView } from "../../lib/auth-view-paths";
import { socialProviders } from "../../lib/social-providers";
import { getAuthViewByPath } from "../../lib/utils";
import { cn } from "@/lib/utils";
import { AcceptInvitationCard } from "../organization/accept-invitation-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AuthCallback } from "./auth-callback";
import { AuthForm, type AuthFormClassNames } from "./auth-form";
import { EmailOTPButton } from "./email-otp-button";
import { MagicLinkButton } from "./magic-link-button";
import { OneTap } from "./one-tap";
import { PasskeyButton } from "./passkey-button";
import { ProviderButton } from "./provider-button";
import { SignOut } from "./sign-out";
import { t } from "@lingui/core/macro";

export interface AuthCardClassNames {
    base?: string;
    content?: string;
    description?: string;
    footer?: string;
    footerLink?: string;
    continueWith?: string;
    form?: AuthFormClassNames;
    header?: string;
    separator?: string;
    title?: string;
    card?: string;
    cardContent?: string;
    cardDescription?: string;
    cardFooter?: string;
    cardHeader?: string;
    cardTitle?: string;
}

export interface AuthCardProps {
    className?: string;
    classNames?: AuthCardClassNames;
    callbackURL?: string;
    cardHeader?: ReactNode;
    pathname?: string;
    redirectTo?: string;
    /**
     * @default "auto"
     */
    socialLayout?: "auto" | "horizontal" | "grid" | "vertical";
    /**
     * @remarks `AuthView`
     */
    view?: AuthView;
    /**
     * @default 0
     */
    otpSeparators?: 0 | 1 | 2;
}

export function AuthCard({
    className,
    classNames,
    callbackURL,
    cardHeader,
    pathname,
    redirectTo,
    socialLayout = "auto",
    view,
    otpSeparators = 0,
}: AuthCardProps) {
    const isHydrated = useIsHydrated();

    const { basePath, credentials, magicLink, emailOTP, oneTap, passkey, signUp, social, genericOAuth, viewPaths, Link } = useContext(AuthUIContext);

    if (socialLayout === "auto") {
        socialLayout = !credentials ? "vertical" : social?.providers && social.providers.length > 2 ? "horizontal" : "vertical";
    }

    const path = pathname?.split("/").pop();
    view = view || getAuthViewByPath(viewPaths, path) || "SIGN_IN";

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const handlePageHide = () => {
            setIsSubmitting(false);
        };

        window.addEventListener("pagehide", handlePageHide);

        return () => {
            setIsSubmitting(false);
            window.removeEventListener("pagehide", handlePageHide);
        };
    }, []);

    if (view === "CALLBACK") return <AuthCallback redirectTo={redirectTo} />;
    if (view === "SIGN_OUT") return <SignOut />;

    if (view === "ACCEPT_INVITATION") return <AcceptInvitationCard className={className} classNames={classNames} />;

    const getCardContent = () => {
        switch (view || path) {
            case "SIGN_IN":
                return {
                    title: t`Sign In`,
                    description: t`Enter your email below to login to your account`,
                };
            case "SIGN_UP":
                return {
                    title: t`Sign Up`,
                    description: t`Enter your information to create an account`,
                };
            case "FORGOT_PASSWORD":
                return {
                    title: t`Forgot Password`,
                    description: t`Enter your email to reset your password`,
                };
            case "RESET_PASSWORD":
                return {
                    title: t`Reset Password`,
                    description: t`Enter your new password below`,
                };
            case "TWO_FACTOR":
                return {
                    title: t`Two-Factor Authentication`,
                    description: t`Please enter your one-time password to continue`,
                };
            case "RECOVER_ACCOUNT":
                return {
                    title: t`Recover Account`,
                    description: t`Please enter a backup code to access your account`,
                };
            case "MAGIC_LINK":
                return {
                    title: t`Magic Link`,
                    description: t`Enter your email to receive a magic link`,
                };
            case "EMAIL_OTP":
                return {
                    title: t`Email Code`,
                    description: t`Enter your email to receive a code`,
                };
            default:
                return {
                    title: t`Authentication`,
                    description: t`Please authenticate to continue`,
                };
        }
    };

    const { title, description } = getCardContent();

    return (
        <Card className={cn("w-full max-w-sm", className, classNames?.base)}>
            <CardHeader className={classNames?.header}>
                {cardHeader ? (
                    cardHeader
                ) : (
                    <>
                        <CardTitle className={cn("text-lg md:text-xl", classNames?.title)}>{title}</CardTitle>

                        {description && <CardDescription className={cn("text-xs md:text-sm", classNames?.description)}>{description}</CardDescription>}
                    </>
                )}
            </CardHeader>

            <CardContent className={cn("grid gap-6", classNames?.content)}>
                {oneTap && ["SIGN_IN", "SIGN_UP", "MAGIC_LINK", "EMAIL_OTP"].includes(view) && <OneTap redirectTo={redirectTo} />}

                {(credentials || magicLink || emailOTP) && (
                    <div className="grid gap-4">
                        <AuthForm
                            classNames={classNames?.form}
                            callbackURL={callbackURL}
                            isSubmitting={isSubmitting}
                            otpSeparators={otpSeparators}
                            pathname={pathname}
                            redirectTo={redirectTo}
                            setIsSubmitting={setIsSubmitting}
                        />

                        {magicLink &&
                            ((credentials && ["FORGOT_PASSWORD", "SIGN_UP", "SIGN_IN", "MAGIC_LINK", "EMAIL_OTP"].includes(view)) ||
                                (emailOTP && view === "EMAIL_OTP")) && <MagicLinkButton classNames={classNames} view={view} isSubmitting={isSubmitting} />}

                        {emailOTP &&
                            ((credentials && ["FORGOT_PASSWORD", "SIGN_UP", "SIGN_IN", "MAGIC_LINK", "EMAIL_OTP"].includes(view)) ||
                                (magicLink && ["SIGN_IN", "MAGIC_LINK"].includes(view))) && (
                                <EmailOTPButton classNames={classNames} view={view} isSubmitting={isSubmitting} />
                            )}
                    </div>
                )}

                {view !== "RESET_PASSWORD" && (social?.providers?.length || genericOAuth?.providers?.length || (view === "SIGN_IN" && passkey)) && (
                    <>
                        {(credentials || magicLink || emailOTP) && (
                            <div className={cn("flex items-center gap-2", classNames?.continueWith)}>
                                <Separator className={cn("!w-auto grow", classNames?.separator)} />

                                <span className="text-muted-foreground flex-shrink-0 text-sm">{t`or continue with`}</span>

                                <Separator className={cn("!w-auto grow", classNames?.separator)} />
                            </div>
                        )}

                        <div className="grid gap-4">
                            {(social?.providers?.length || genericOAuth?.providers?.length) && (
                                <div
                                    className={cn(
                                        "flex w-full items-center justify-between gap-4",
                                        socialLayout === "horizontal" && "flex-wrap",
                                        socialLayout === "vertical" && "flex-col",
                                        socialLayout === "grid" && "grid grid-cols-2",
                                    )}
                                >
                                    {social?.providers?.map((provider) => {
                                        const socialProvider = socialProviders.find((socialProvider) => socialProvider.provider === provider);
                                        if (!socialProvider) return null;

                                        return (
                                            <ProviderButton
                                                key={provider}
                                                classNames={classNames}
                                                callbackURL={callbackURL}
                                                isSubmitting={isSubmitting}
                                                provider={socialProvider}
                                                redirectTo={redirectTo}
                                                setIsSubmitting={setIsSubmitting}
                                                socialLayout={socialLayout}
                                            />
                                        );
                                    })}

                                    {genericOAuth?.providers?.map((provider) => (
                                        <ProviderButton
                                            key={provider.provider}
                                            classNames={classNames}
                                            callbackURL={callbackURL}
                                            isSubmitting={isSubmitting}
                                            provider={provider}
                                            redirectTo={redirectTo}
                                            setIsSubmitting={setIsSubmitting}
                                            socialLayout={socialLayout}
                                            other
                                        />
                                    ))}
                                </div>
                            )}

                            {passkey && ["SIGN_IN", "MAGIC_LINK", "EMAIL_OTP", "RECOVER_ACCOUNT", "TWO_FACTOR", "FORGOT_PASSWORD"].includes(view) && (
                                <PasskeyButton isSubmitting={isSubmitting} redirectTo={redirectTo} setIsSubmitting={setIsSubmitting} />
                            )}
                        </div>
                    </>
                )}
            </CardContent>

            {credentials && signUp && (
                <CardFooter className={cn("text-muted-foreground justify-center gap-1.5 text-sm", classNames?.footer)}>
                    {view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP" ? (
                        t`Don't have an account?`
                    ) : view === "SIGN_UP" ? (
                        t`Already have an account?`
                    ) : (
                        <ArrowLeftIcon className="size-3" />
                    )}

                    {view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP" || view === "SIGN_UP" ? (
                        <Link
                            className={cn("text-foreground underline", classNames?.footerLink)}
                            href={`${basePath}/${viewPaths[view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP" ? "SIGN_UP" : "SIGN_IN"]}${isHydrated ? window.location.search : ""}`}
                        >
                            <Button variant="link" size="sm" className={cn("text-foreground px-0 underline", classNames?.footerLink)}>
                                {view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP" ? t`Sign up` : t`Sign in`}
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            variant="link"
                            size="sm"
                            className={cn("text-foreground px-0 underline", classNames?.footerLink)}
                            onClick={() => window.history.back()}
                        >
                            {t`Go back`}
                        </Button>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
