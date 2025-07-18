"use client";

import cn from "@anole/ui/utils/cn";
import { t } from "@lingui/core/macro";
import type { FC } from "react";

import useIsAnonymous from "@/features/auth/hooks/use-is-anonymous";

const AnonymousUserBanner: FC<{
    classNames?: {
        root?: string;
    };
}> = ({ classNames }) => {
    const { isAnonymous } = useIsAnonymous();

    if (!isAnonymous) {
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
            <span className="bg-sidebar pointer-events-none relative h-(--header-height) px-2 text-white">{t`You're using a guest account.`}</span>
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

export default AnonymousUserBanner;
