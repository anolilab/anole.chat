"use client";

import { useEffect } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

import type { AuthView } from "../../lib/auth-view-paths";
import { AuthCallback } from "./auth-callback";
import { EmailOTPForm } from "./forms/email-otp-form";
import { ForgotPasswordForm } from "./forms/forgot-password-form";
import { MagicLinkForm } from "./forms/magic-link-form";
import { RecoverAccountForm } from "./forms/recover-account-form";
import { ResetPasswordForm } from "./forms/reset-password-form";
import { SignInForm } from "./forms/sign-in-form";
import { SignUpForm } from "./forms/sign-up-form";
import { TwoFactorForm } from "./forms/two-factor-form";
import { SignOut } from "./sign-out";

export type AuthFormClassNames = {
    base?: string;
    button?: string;
    checkbox?: string;
    description?: string;
    error?: string;
    forgotPasswordLink?: string;
    icon?: string;
    input?: string;
    label?: string;
    otpInput?: string;
    otpInputContainer?: string;
    outlineButton?: string;
    primaryButton?: string;
    providerButton?: string;
    qrCode?: string;
    secondaryButton?: string;
};

export interface AuthFormProperties {
    callbackURL?: string;
    className?: string;
    classNames?: AuthFormClassNames;
    isSubmitting?: boolean;
    otpSeparators?: 0 | 1 | 2;
    redirectTo?: string;
    setIsSubmitting?: (isSubmitting: boolean) => void;
    view?: AuthView;
}

export const AuthForm = ({ callbackURL, className, classNames, isSubmitting, otpSeparators = 0, redirectTo, setIsSubmitting, view }: AuthFormProperties) => {
    const { basePath, credentials, emailOTP, magicLink, replace, signUp, twoFactor: twoFactorEnabled, viewPaths } = useAuth();

    const signUpEnabled = !!signUp;

    // Redirect to appropriate view based on enabled features
    useEffect(() => {
        let isInvalidView = false;

        if (view === "MAGIC_LINK" && (!magicLink || (!credentials && !emailOTP))) {
            isInvalidView = true;
        }

        if (view === "EMAIL_OTP" && (!emailOTP || (!credentials && !magicLink))) {
            isInvalidView = true;
        }

        if (view === "SIGN_UP" && !signUpEnabled) {
            isInvalidView = true;
        }

        if (!credentials && ["FORGOT_PASSWORD", "RECOVER_ACCOUNT", "RESET_PASSWORD", "SIGN_UP", "TWO_FACTOR"].includes(view)) {
            isInvalidView = true;
        }

        if (["RECOVER_ACCOUNT", "TWO_FACTOR"].includes(view) && !twoFactorEnabled) {
            isInvalidView = true;
        }

        if (isInvalidView) {
            replace(`${basePath}/${viewPaths.SIGN_IN}${globalThis.location.search}`);
        }
    }, [basePath, view, viewPaths, credentials, replace, emailOTP, signUpEnabled, magicLink, twoFactorEnabled]);

    if (view === "SIGN_OUT")
        return <SignOut />;

    if (view === "CALLBACK")
        return <AuthCallback redirectTo={redirectTo} />;

    if (view === "SIGN_IN") {
        return credentials
            ? (
                <SignInForm className={className} classNames={classNames} isSubmitting={isSubmitting} redirectTo={redirectTo} setIsSubmitting={setIsSubmitting} />
            )
            : magicLink
                ? (
                    <MagicLinkForm
                        callbackURL={callbackURL}
                        className={className}
                        classNames={classNames}
                        isSubmitting={isSubmitting}
                        redirectTo={redirectTo}
                        setIsSubmitting={setIsSubmitting}
                    />
                )
                : emailOTP
                    ? (
                        <EmailOTPForm
                            callbackURL={callbackURL}
                            className={className}
                            classNames={classNames}
                            isSubmitting={isSubmitting}
                            redirectTo={redirectTo}
                            setIsSubmitting={setIsSubmitting}
                        />
                    )
                    : null;
    }

    if (view === "TWO_FACTOR") {
        return (
            <TwoFactorForm
                className={className}
                classNames={classNames}
                isSubmitting={isSubmitting}
                otpSeparators={otpSeparators}
                redirectTo={redirectTo}
                setIsSubmitting={setIsSubmitting}
            />
        );
    }

    if (view === "RECOVER_ACCOUNT") {
        return (
            <RecoverAccountForm
                className={className}
                classNames={classNames}
                isSubmitting={isSubmitting}
                redirectTo={redirectTo}
                setIsSubmitting={setIsSubmitting}
            />
        );
    }

    if (view === "MAGIC_LINK") {
        return (
            <MagicLinkForm
                callbackURL={callbackURL}
                className={className}
                classNames={classNames}
                isSubmitting={isSubmitting}
                redirectTo={redirectTo}
                setIsSubmitting={setIsSubmitting}
            />
        );
    }

    if (view === "EMAIL_OTP") {
        return (
            <EmailOTPForm
                callbackURL={callbackURL}
                className={className}
                classNames={classNames}
                isSubmitting={isSubmitting}
                redirectTo={redirectTo}
                setIsSubmitting={setIsSubmitting}
            />
        );
    }

    if (view === "FORGOT_PASSWORD") {
        return <ForgotPasswordForm className={className} classNames={classNames} isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} />;
    }

    if (view === "RESET_PASSWORD") {
        return <ResetPasswordForm className={className} classNames={classNames} />;
    }

    if (view === "SIGN_UP") {
        return (
            signUpEnabled && (
                <SignUpForm
                    callbackURL={callbackURL}
                    className={className}
                    classNames={classNames}
                    isSubmitting={isSubmitting}
                    redirectTo={redirectTo}
                    setIsSubmitting={setIsSubmitting}
                />
            )
        );
    }
};
