import { t } from "@lingui/core/macro";
import { useSearch } from "@tanstack/react-router";
import type { SocialProvider } from "better-auth/social-providers";
import { use, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import type { Provider } from "../../lib/social-providers";
import { getLocalizedError } from "../../lib/utils";
import type { AuthCardClassNames } from "./auth-card";

interface ProviderButtonProperties {
    callbackURL?: string;
    className?: string;
    classNames?: AuthCardClassNames;
    isSubmitting: boolean;
    other?: boolean;
    provider: Provider;
    redirectTo?: string;
    setIsSubmitting: (isSubmitting: boolean) => void;
    socialLayout: "auto" | "horizontal" | "grid" | "vertical";
}

export const ProviderButton = ({
    callbackURL: callbackURLProperty,
    className,
    classNames,
    isSubmitting,
    other,
    provider,
    redirectTo: redirectToProperty,
    setIsSubmitting,
    socialLayout,
}: ProviderButtonProperties) => {
    const { authClient, basePath, baseURL, genericOAuth, persistClient, redirectTo: contextRedirectTo, social, toast, viewPaths } = useAuth();

    const search = useSearch({ strict: false });

    const getRedirectTo = useCallback(() => redirectToProperty || search.redirectTo || contextRedirectTo, [redirectToProperty, search.redirectTo, contextRedirectTo]);

    const getCallbackURL = useCallback(
        () => `${baseURL}${callbackURLProperty || (persistClient ? `${basePath}/${viewPaths.CALLBACK}?redirectTo=${getRedirectTo()}` : getRedirectTo())}`,
        [callbackURLProperty, persistClient, basePath, viewPaths, baseURL, getRedirectTo],
    );

    const doSignInSocial = async () => {
        setIsSubmitting(true);

        try {
            if (other) {
                const oauth2Parameters = {
                    callbackURL: getCallbackURL(),
                    fetchOptions: { throw: true },
                    providerId: provider.provider,
                };

                if (genericOAuth?.signIn) {
                    await genericOAuth.signIn(oauth2Parameters);

                    setTimeout(() => {
                        setIsSubmitting(false);
                    }, 10_000);
                } else {
                    await authClient.signIn.oauth2(oauth2Parameters);
                }
            } else {
                const socialParameters = {
                    callbackURL: getCallbackURL(),
                    fetchOptions: { throw: true },
                    provider: provider.provider as SocialProvider,
                };

                if (social?.signIn) {
                    await social.signIn(socialParameters);

                    setTimeout(() => {
                        setIsSubmitting(false);
                    }, 10_000);
                } else {
                    await authClient.signIn.social(socialParameters);
                }
            }
        } catch (error) {
            toast({
                message: getLocalizedError({ error }),
                variant: "error",
            });

            setIsSubmitting(false);
        }
    };

    return (
        <Button
            className={cn(
                socialLayout === "vertical" ? "w-full" : "grow",
                className,
                classNames?.form?.button,
                classNames?.form?.outlineButton,
                classNames?.form?.providerButton,
            )}
            disabled={isSubmitting}
            onClick={doSignInSocial}
            variant="outline"
        >
            {provider.icon && <provider.icon className={classNames?.form?.icon} />}

            {socialLayout === "grid" && provider.name}
            {socialLayout === "vertical" && `${t`Sign in with`} ${provider.name}`}
        </Button>
    );
};
