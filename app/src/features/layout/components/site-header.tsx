import { Separator } from "@anole/ui/components/separator";
import { SidebarTrigger } from "@anole/ui/components/sidebar";
import { ModeToggle } from "@anole/ui/components/theme-toggle";
import type { FC, PropsWithChildren, ReactNode } from "react";

import BlurGradientOverlay from "@/components/blur-gradient-overlay";
import { AnonymousUserBanner } from "@/features/auth/components/anonymous-user-banner";

const SiteHeader: FC<PropsWithChildren<{ menu?: ReactNode; title?: string }>> = ({ children, menu, title }) => (
    <>
        <header className="relative flex shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) dark:text-white">
            <div className="relative z-20 ml-3 flex w-full items-center gap-1 truncate pt-1 lg:gap-2">
                <SidebarTrigger className="-ml-1" name="left" />
                <Separator className="mx-2 data-[orientation=vertical]:h-4" orientation="vertical" />
                {title && <h1 className="text-lg font-bold">{title}</h1>}
                {children}
                <div className="flex-grow" />
                <AnonymousUserBanner />
                <div className="flex-grow" />
                <div className="absolute top-0 right-0 flex h-(--header-height) flex-row bg-white max-sm:hidden">
                    <div
                        className="relative -mr-3 h-(--header-height)"
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
                    <div className="bg-sidebar -mt-1 flex h-(--header-height) flex-row items-center gap-1 px-2">
                        <ModeToggle className="text-white" />
                        {menu}
                    </div>
                </div>
            </div>
        </header>
        <BlurGradientOverlay />
    </>
);

export default SiteHeader;
