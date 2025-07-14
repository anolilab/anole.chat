import type { FC, PropsWithChildren } from "react";

import BlurGradientOverlay from "@/components/blur-gradient-overlay";
import { ModeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const SiteHeader: FC<PropsWithChildren<{ title?: string }>> = ({ children, title }) => (
    <>
        <header className="relative flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) dark:text-white">
            <div className="relative z-20 flex w-full items-center gap-1 truncate pl-4 lg:gap-2 lg:pl-6">
                <SidebarTrigger className="-ml-1" />
                <Separator className="mx-2 data-[orientation=vertical]:h-4" orientation="vertical" />
                {title && <h1 className="text-lg font-bold">{title}</h1>}
                {children}
                <div className="flex-grow" />
                <ModeToggle className="text-white" />
            </div>
            <div
                className="absolute -top-2 -right-2.5 z-10 h-14.5 w-25.5 max-sm:hidden"
                style={{
                    clipPath: "inset(0px 8px 0px 0px)",
                }}
            >
                <div
                    className="ease-snappy group pointer-events-none absolute top-2 z-10 w-full origin-top transition-all"
                    style={{
                        boxShadow: "10px -10px 8px 2px var(--color-site-header-background)",
                    }}
                >
                    <svg
                        className="absolute -right-10 origin-top-left skew-x-[30deg] overflow-visible"
                        version="1.1"
                        viewBox="0 0 128 32"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        xmlSpace="preserve"
                    >
                        <line
                            shapeRendering="optimizeQuality"
                            stroke="var(--color-site-header-background)"
                            strokeLinecap="round"
                            strokeMiterlimit="10"
                            strokeWidth="2px"
                            vectorEffect="non-scaling-stroke"
                            x1="1"
                            x2="128"
                            y1="0"
                            y2="0"
                        />
                        <path
                            className="translate-y-[0.5px]"
                            d="M0,0c5.9,0,10.7,4.8,10.7,10.7v10.7c0,5.9,4.8,10.7,10.7,10.7H128V0"
                            fill="var(--color-site-header-background)"
                            shapeRendering="optimizeQuality"
                            stroke="var(--color-site-header-border)"
                            strokeLinecap="round"
                            strokeMiterlimit="10"
                            strokeWidth="1px"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                </div>
            </div>
        </header>
        <BlurGradientOverlay />
    </>
);
