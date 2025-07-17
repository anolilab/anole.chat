"use client";

import { t } from "@lingui/core/macro";
import { AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAuth } from "../lib/auth-ui-provider";
import { useIsAnonymous } from "../hooks/use-is-anonymous";

export interface AnonymousUserBannerProperties {
    className?: string;
    classNames?: {
        base?: string;
        alert?: string;
        description?: string;
        button?: string;
        closeButton?: string;
    };
    onConvertClick?: () => void;
    dismissible?: boolean;
}

export const AnonymousUserBanner = ({
    className,
    classNames,
    onConvertClick,
    dismissible = true,
}: AnonymousUserBannerProperties) => {
    const { isAnonymous } = useIsAnonymous();
    const { basePath, viewPaths } = useAuth();
    const navigate = useNavigate();
    const [isDismissed, setIsDismissed] = useState(false);

    const handleConvertClick = () => {
        if (onConvertClick) {
            onConvertClick();
        } else {
            navigate({ to: `${basePath}/${viewPaths.CONVERT_ACCOUNT}` });
        }
    };

    if (!isAnonymous || isDismissed) {
        return null;
    }

    return (
        <Alert className={cn("border-orange-200 bg-orange-50 text-orange-800", className, classNames?.base)}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className={cn("flex items-center justify-between", classNames?.description)}>
                <span>
                    {t`You're using a guest account. `}
                    <Button
                        className={cn("h-auto p-0 text-orange-800 underline hover:text-orange-900", classNames?.button)}
                        onClick={handleConvertClick}
                        variant="link"
                    >
                        {t`Convert to a permanent account`}
                    </Button>
                    {t` to save your data and access it from any device.`}
                </span>
                {dismissible && (
                    <Button
                        className={cn("h-6 w-6 p-0", classNames?.closeButton)}
                        onClick={() => setIsDismissed(true)}
                        size="sm"
                        variant="ghost"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
};