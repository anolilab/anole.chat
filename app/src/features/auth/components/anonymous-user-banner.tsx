"use client";

import { Alert, AlertDescription } from "@anole/ui/components/alert";
import { Button } from "@anole/ui/components/button";
import cn from "@anole/ui/utils/cn";
import { t } from "@lingui/core/macro";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { useIsAnonymous } from "../hooks/use-is-anonymous";
import { useAuth } from "../lib/auth-ui-provider";

export interface AnonymousUserBannerProperties {
    classNames?: {
        description?: string;
        root?: string;
    };
    dismissible?: boolean;
    onConvertClick?: () => void;
}

/**
 * &lt;Button
 * className={cn("h-auto p-0 text-orange-800 underline hover:text-orange-900", classNames?.button)}
 * onClick={handleConvertClick}
 * variant="link"
 * >
 * {t`Convert to a permanent account`}
 * &lt;/Button>
 * {t` to save your data and access it from any device.`}
 */
export const AnonymousUserBanner = ({ classNames, dismissible = true, onConvertClick }: AnonymousUserBannerProperties) => {
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
        <div className={cn("absolute top-0 right-0 left-0 mx-auto flex h-(--header-height) w-80 flex-row overflow-hidden", classNames?.root)}>
            <div
                className="relative -mr-2 h-(--header-height)"
                style={{
                    clipPath: "inset(0px 0px 0px 0px)",
                    width: `50px`,
                }}
            >
                <div
                    className="ease-snappy group pointer-events-none absolute top-0 w-full origin-top transition-all"
                    style={{
                        boxShadow: "10px -10px 8px 2px var(--color-site-header-background)",
                    }}
                >
                    <svg
                        className="absolute origin-top-left skew-x-[30deg] overflow-visible"
                        version="1.1"
                        viewBox="0 0 50 32"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        xmlSpace="preserve"
                    >
                        <path
                            className="fill-sidebar"
                            d="M0,0c5.9,0,10.7,4.8,10.7,10.7v10.7c0,5.9,4.8,10.7,10.7,10.7H128V0"
                            shapeRendering="optimizeQuality"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                </div>
            </div>
            <span className="bg-sidebar relative h-(--header-height) px-2 text-white">{t`You're using a guest account.`}</span>
            <div
                className="relative -ml-2 h-(--header-height)"
                style={{
                    clipPath: "inset(0px 0px 0px 0px)",
                    width: `50px`,
                }}
            >
                <div
                    className="ease-snappy group pointer-events-none absolute top-0 w-full origin-top transition-all"
                    style={{
                        boxShadow: "-10px -10px 8px 2px var(--color-site-header-background)",
                    }}
                >
                    <svg
                        className="absolute origin-top-right skew-x-[-30deg] overflow-visible"
                        version="1.1"
                        viewBox="0 0 50 32"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        xmlSpace="preserve"
                    >
                        <path
                            className="fill-sidebar"
                            d="M0,0c5.9,0,10.7,4.8,10.7,10.7v10.7c0,5.9,4.8,10.7,10.7,10.7H128V0"
                            shapeRendering="optimizeQuality"
                            transform="scale(-1, 1) translate(-50, 0)"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
};
