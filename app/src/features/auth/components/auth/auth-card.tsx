"use client";

import { Button } from "@anole/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@anole/ui/components/card";
import { Separator } from "@anole/ui/components/separator";
import { useIsHydrated } from "@anole/ui/hooks/use-hydrated";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { useLastSignInMethod } from "@/features/auth/hooks/use-last-signin-method";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import type { AuthView } from "@/features/auth/lib/auth-view-paths";
import { socialProviders } from "@/features/auth/lib/social-providers";

import { AcceptInvitationCard } from "../organization/accept-invitation-card";
import { AuthCallback } from "./auth-callback";
import type { AuthFormClassNames } from "./auth-form";
import { AuthForm } from "./auth-form";
import { EmailOTPButton } from "./email-otp-button";
import LastSignInMessage from "./last-signin-message";
import { MagicLinkButton } from "./magic-link-button";
import { OneTap } from "./one-tap";
import { PasskeyButton } from "./passkey-button";
import { ProviderButton } from "./provider-button";
import { SignOut } from "./sign-out";

const LAST_SIGNIN_CLASSNAMES = {
    container: "justify-center",
    text: "text-center",
};
interface AuthFormSectionProperties {
    callbackURL?: string;
    classNames?: AuthCardClassNames;
    credentials?: boolean;
    emailOTP?: boolean;
    isSubmitting: boolean;
    magicLink?: boolean;
    otpSeparators: number;
    redirectTo?: string;
    setIsSubmitting: (isSubmitting: boolean) => void;
    view: AuthView;
}

const AuthFormSection: FC<AuthFormSectionProperties> = ({
    callbackURL,
    classNames,
    credentials,
    emailOTP,
    isSubmitting,
    magicLink,
    otpSeparators,
    redirectTo,
    setIsSubmitting,
    view,
}) => {
    if (!(credentials || magicLink || emailOTP)) {
        return null;
    }

    return (
        <div className="grid gap-4">
            <AuthForm
                callbackURL={callbackURL}
                classNames={classNames?.form}
                isSubmitting={isSubmitting}
                otpSeparators={otpSeparators}
                redirectTo={redirectTo}
                setIsSubmitting={setIsSubmitting}
                view={view}
            />

            {magicLink
                && ((credentials && ["EMAIL_OTP", "FORGOT_PASSWORD", "MAGIC_LINK", "SIGN_IN", "SIGN_UP"].includes(view))
                    || (emailOTP && view === "EMAIL_OTP")) && <MagicLinkButton classNames={classNames} isSubmitting={isSubmitting} view={view} />}

            {emailOTP
                && ((credentials && ["EMAIL_OTP", "FORGOT_PASSWORD", "MAGIC_LINK", "SIGN_IN", "SIGN_UP"].includes(view))
                    || (magicLink && ["MAGIC_LINK", "SIGN_IN"].includes(view))) && (
                        <EmailOTPButton classNames={classNames} isSubmitting={isSubmitting} view={view} />
            )}
        </div>
    );
};
interface SocialSectionProperties {
    callbackURL?: string;
    classNames?: AuthCardClassNames;
    genericOAuth?: { providers?: { provider: string }[] };
    isSubmitting: boolean;
    lastUsedProvider?: string;
    passkey?: boolean;
    redirectTo?: string;
    setIsSubmitting: (isSubmitting: boolean) => void;
    social?: { providers?: string[] };
    socialLayout: "horizontal" | "grid" | "vertical";
    view: AuthView;
}

const SocialSection: FC<SocialSectionProperties> = ({
    callbackURL,
    classNames,
    genericOAuth,
    isSubmitting,
    lastUsedProvider,
    passkey,
    redirectTo,
    setIsSubmitting,
    social,
    socialLayout,
    view,
}) => {
    if (view === "RESET_PASSWORD" || !(social?.providers?.length || genericOAuth?.providers?.length || (view === "SIGN_IN" && passkey))) {
        return null;
    }

    // Order social providers based on last used provider
    const orderedSocialProviders = social?.providers ? [...social.providers] : [];

    if (lastUsedProvider && orderedSocialProviders.includes(lastUsedProvider)) {
        // Move the last used provider to the front
        const lastUsedIndex = orderedSocialProviders.indexOf(lastUsedProvider);

        orderedSocialProviders.splice(lastUsedIndex, 1);
        orderedSocialProviders.unshift(lastUsedProvider);
    }

    // Order generic OAuth providers based on last used provider
    const orderedGenericProviders = genericOAuth?.providers ? [...genericOAuth.providers] : [];

    if (lastUsedProvider && orderedGenericProviders.some((p) => p.provider === lastUsedProvider)) {
        // Move the last used provider to the front
        const lastUsedIndex = orderedGenericProviders.findIndex((p) => p.provider === lastUsedProvider);
        const lastUsedProvider_object = orderedGenericProviders[lastUsedIndex];

        orderedGenericProviders.splice(lastUsedIndex, 1);
        orderedGenericProviders.unshift(lastUsedProvider_object);
    }

    return (
        <div className="grid gap-4">
            {(orderedSocialProviders.length || orderedGenericProviders.length) && (
                <div
                    className={cn(
                        "flex w-full items-center justify-between gap-4",
                        socialLayout === "horizontal" && "flex-wrap",
                        socialLayout === "vertical" && "flex-col",
                        socialLayout === "grid" && "grid grid-cols-2",
                    )}
                >
                    {orderedSocialProviders.map((provider) => {
                        const providerConfig = socialProviders.find((p) => p.provider === provider);

                        if (!providerConfig) {
                            return undefined;
                        }

                        return (
                            <ProviderButton
                                callbackURL={callbackURL}
                                classNames={classNames}
                                isSubmitting={isSubmitting}
                                key={provider}
                                provider={providerConfig}
                                redirectTo={redirectTo}
                                setIsSubmitting={setIsSubmitting}
                                socialLayout={socialLayout}
                            />
                        );
                    })}

                    {orderedGenericProviders.map((provider) => (
                        <ProviderButton
                            callbackURL={callbackURL}
                            classNames={classNames}
                            isSubmitting={isSubmitting}
                            key={provider.provider}
                            other
                            provider={provider}
                            redirectTo={redirectTo}
                            setIsSubmitting={setIsSubmitting}
                            socialLayout={socialLayout}
                        />
                    ))}
                </div>
            )}

            {passkey && ["EMAIL_OTP", "FORGOT_PASSWORD", "MAGIC_LINK", "RECOVER_ACCOUNT", "SIGN_IN", "TWO_FACTOR"].includes(view) && (
                <PasskeyButton isSubmitting={isSubmitting} redirectTo={redirectTo} setIsSubmitting={setIsSubmitting} />
            )}
        </div>
    );
};

// Internal component for the separator
interface SeparatorSectionProperties {
    classNames?: AuthCardClassNames;
}

const SeparatorSection: FC<SeparatorSectionProperties> = ({ classNames }) => {
    const { t } = useLingui();

    return (
        <div className={cn("flex items-center gap-2", classNames?.continueWith)}>
            <Separator className={cn("!w-auto grow", classNames?.separator)} />
            <span className="text-muted-foreground flex-shrink-0 text-sm">{t`or continue with`}</span>
            <Separator className={cn("!w-auto grow", classNames?.separator)} />
        </div>
    );
};

export interface AuthCardClassNames {
    base?: string;
    card?: string;
    cardContent?: string;
    cardDescription?: string;
    cardFooter?: string;
    cardHeader?: string;
    cardTitle?: string;
    content?: string;
    continueWith?: string;
    description?: string;
    footer?: string;
    footerLink?: string;
    form?: AuthFormClassNames;
    header?: string;
    separator?: string;
    title?: string;
}

export interface AuthCardProperties {
    callbackURL?: string;
    cardHeader?: ReactNode;
    className?: string;
    classNames?: AuthCardClassNames;

    /**
     * @default 0
     */
    otpSeparators?: 0 | 1 | 2;
    redirectTo?: string;

    /**
     * @default "auto"
     */
    socialLayout?: "auto" | "horizontal" | "grid" | "vertical";
    view?: AuthView;
}

export const AuthCard: FC<AuthCardProperties> = ({
    callbackURL,
    cardHeader,
    className,
    classNames,
    otpSeparators = 0,
    redirectTo,
    socialLayout = "auto",
    view = "SIGN_IN",
}) => {
    const { t } = useLingui();
    const isHydrated = useIsHydrated();
    const { lastSignIn } = useLastSignInMethod();

    const { basePath, credentials, emailOTP, genericOAuth, magicLink, oneTap, passkey, signUp, social, viewPaths } = useAuth();

    // Determine social layout
    const finalSocialLayout
        = socialLayout === "auto" ? credentials ? social?.providers && social.providers.length > 2 ? "horizontal" : "vertical" : "vertical" : socialLayout;

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Determine if social sign-in should be prioritized based on last sign-in method
    const shouldPrioritizeSocial
        = lastSignIn?.method === "social" && (social?.providers?.length || genericOAuth?.providers?.length || (view === "SIGN_IN" && passkey));

    // Memoized callback for history back
    const handleHistoryBack = useCallback(() => {
        globalThis.history.back();
    }, []);

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

    if (view === "CALLBACK") {
        return <AuthCallback redirectTo={redirectTo} />;
    }

    if (view === "SIGN_OUT") {
        return <SignOut />;
    }

    if (view === "ACCEPT_INVITATION") {
        return <AcceptInvitationCard className={className} classNames={classNames} />;
    }

    const getCardContent = () => {
        switch (view) {
            case "EMAIL_OTP": {
                return {
                    description: t`Enter your email to receive a code`,
                    title: t`Email Code`,
                };
            }
            case "FORGOT_PASSWORD": {
                return {
                    description: t`Enter your email to reset your password`,
                    title: t`Forgot Password`,
                };
            }
            case "MAGIC_LINK": {
                return {
                    description: t`Enter your email to receive a magic link`,
                    title: t`Magic Link`,
                };
            }
            case "RECOVER_ACCOUNT": {
                return {
                    description: t`Please enter a backup code to access your account`,
                    title: t`Recover Account`,
                };
            }
            case "RESET_PASSWORD": {
                return {
                    description: t`Enter your new password below`,
                    title: t`Reset Password`,
                };
            }
            case "SIGN_IN": {
                return {
                    description: t`Enter your email below to login to your account`,
                    title: t`Sign In`,
                };
            }
            case "SIGN_UP": {
                return {
                    description: t`Enter your information to create an account`,
                    title: t`Sign Up`,
                };
            }
            case "TWO_FACTOR": {
                return {
                    description: t`Please enter your one-time password to continue`,
                    title: t`Two-Factor Authentication`,
                };
            }
            default: {
                return {
                    description: t`Please authenticate to continue`,
                    title: t`Authentication`,
                };
            }
        }
    };

    const { description, title } = getCardContent();

    const authFormProperties = {
        callbackURL,
        classNames,
        credentials: !!credentials,
        emailOTP: !!emailOTP,
        isSubmitting,
        magicLink: !!magicLink,
        otpSeparators,
        redirectTo,
        setIsSubmitting,
        view,
    };

    const socialProperties = {
        callbackURL,
        classNames,
        genericOAuth,
        isSubmitting,
        lastUsedProvider: lastSignIn?.method === "social" ? lastSignIn.socialProvider : undefined,
        passkey: !!passkey,
        redirectTo,
        setIsSubmitting,
        social,
        socialLayout: finalSocialLayout,
        view,
    };

    // Determine if we should show separator
    const shouldShowSeparator
        = (credentials || magicLink || emailOTP) && (social?.providers?.length || genericOAuth?.providers?.length || (view === "SIGN_IN" && passkey));

    // Helper function to get footer text
    const getFooterText = () => {
        if (view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP") {
            return t`Don't have an account?`;
        }

        if (view === "SIGN_UP") {
            return t`Already have an account?`;
        }

        return <ArrowLeftIcon className="size-3" />;
    };

    return (
        <Card className={cn("w-full max-w-sm", className, classNames?.base)}>
            <CardHeader className={classNames?.header}>
                {cardHeader || (
                    <>
                        <CardTitle className={cn("text-lg md:text-xl", classNames?.title)}>{title}</CardTitle>
                        {description && <CardDescription className={cn("text-xs md:text-sm", classNames?.description)}>{description}</CardDescription>}
                    </>
                )}
            </CardHeader>

            <CardContent className={cn("grid gap-6", classNames?.content)}>
                <LastSignInMessage className="mb-2" classNames={LAST_SIGNIN_CLASSNAMES} />

                {oneTap && ["EMAIL_OTP", "MAGIC_LINK", "SIGN_IN", "SIGN_UP"].includes(view) && <OneTap redirectTo={redirectTo} />}

                {shouldPrioritizeSocial
                    ? (
                        <>
                            <SocialSection {...socialProperties} />
                            {shouldShowSeparator && <SeparatorSection classNames={classNames} />}
                            <AuthFormSection {...authFormProperties} />
                        </>
                    )
                    : (
                        <>
                            <AuthFormSection {...authFormProperties} />
                            {shouldShowSeparator && <SeparatorSection classNames={classNames} />}
                            <SocialSection {...socialProperties} />
                        </>
                    )}
            </CardContent>

            {credentials && signUp && (
                <CardFooter className={cn("text-muted-foreground justify-center gap-1.5 text-sm", classNames?.footer)}>
                    {getFooterText()}

                    {view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP" || view === "SIGN_UP"
                        ? (
                            <Link
                                className={cn("text-foreground underline", classNames?.footerLink)}
                                to={`${basePath}/${viewPaths[view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP" ? "SIGN_UP" : "SIGN_IN"]}${isHydrated ? globalThis.location.search : ""}`}
                            >
                                <Button className={cn("text-foreground px-0 underline", classNames?.footerLink)} size="sm" variant="link">
                                    {view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP" ? t`Sign up` : t`Sign in`}
                                </Button>
                            </Link>
                        )
                        : (
                            <Button className={cn("text-foreground px-0 underline", classNames?.footerLink)} onClick={handleHistoryBack} size="sm" variant="link">
                                {t`Go back`}
                            </Button>
                        )}
                </CardFooter>
            )}
        </Card>
    );
};
