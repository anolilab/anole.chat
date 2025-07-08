import type { SocialProvider } from "better-auth/social-providers";
import { useCallback, useContext } from "react";
import { t } from "@lingui/core/macro";
import { useSearch } from "@tanstack/react-router";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import type { Provider } from "../../lib/social-providers";
import { cn } from "@/lib/utils";
import { getLocalizedError } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import type { AuthCardClassNames } from "./auth-card";

interface ProviderButtonProps {
    className?: string;
    classNames?: AuthCardClassNames;
    callbackURL?: string;
    isSubmitting: boolean;
    other?: boolean;
    provider: Provider;
    redirectTo?: string;
    socialLayout: "auto" | "horizontal" | "grid" | "vertical";
    setIsSubmitting: (isSubmitting: boolean) => void;
}

export function ProviderButton({
    className,
    classNames,
    callbackURL: callbackURLProp,
    isSubmitting,
    other,
    provider,
    redirectTo: redirectToProp,
    socialLayout,
    setIsSubmitting,
}: ProviderButtonProps) {
    const { authClient, basePath, baseURL, persistClient, redirectTo: contextRedirectTo, viewPaths, social, genericOAuth, toast } = useContext(AuthUIContext);

    const search = useSearch({ strict: false });

    const getRedirectTo = useCallback(() => redirectToProp || search.redirectTo || contextRedirectTo, [redirectToProp, search.redirectTo, contextRedirectTo]);

    const getCallbackURL = useCallback(
        () => `${baseURL}${callbackURLProp || (persistClient ? `${basePath}/${viewPaths.CALLBACK}?redirectTo=${getRedirectTo()}` : getRedirectTo())}`,
        [callbackURLProp, persistClient, basePath, viewPaths, baseURL, getRedirectTo],
    );

    const doSignInSocial = async () => {
        setIsSubmitting(true);

        try {
            if (other) {
                const oauth2Params = {
                    providerId: provider.provider,
                    callbackURL: getCallbackURL(),
                    fetchOptions: { throw: true },
                };

                if (genericOAuth?.signIn) {
                    await genericOAuth.signIn(oauth2Params);

                    setTimeout(() => {
                        setIsSubmitting(false);
                    }, 10000);
                } else {
                    await authClient.signIn.oauth2(oauth2Params);
                }
            } else {
                const socialParams = {
                    provider: provider.provider as SocialProvider,
                    callbackURL: getCallbackURL(),
                    fetchOptions: { throw: true },
                };

                if (social?.signIn) {
                    await social.signIn(socialParams);

                    setTimeout(() => {
                        setIsSubmitting(false);
                    }, 10000);
                } else {
                    await authClient.signIn.social(socialParams);
                }
            }
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error }),
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
            variant="outline"
            onClick={doSignInSocial}
        >
            {provider.icon && <provider.icon className={classNames?.form?.icon} />}

            {socialLayout === "grid" && provider.name}
            {socialLayout === "vertical" && `${t`Sign in with`} ${provider.name}`}
        </Button>
    );
}
