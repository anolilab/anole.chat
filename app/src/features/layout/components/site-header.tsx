import BlurGradientOverlay from "@/components/blur-gradient-overlay";
import { ModeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { FC, PropsWithChildren } from "react";

export const SiteHeader: FC<PropsWithChildren<{ title?: string }>> = ({ title, children }) => {
    return (
        <>
            <header className="h-(--header-height) group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) relative flex shrink-0 items-center gap-2 transition-[width,height] ease-linear dark:text-white">
                <div className="relative z-20 flex w-full items-center gap-1 pl-4 lg:gap-2 lg:pl-6">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                    {title && <h1 className="text-lg font-bold">{title}</h1>}
                    {children}
                    <div className="flex-grow" />
                    <ModeToggle className="text-white" />
                </div>
                <div
                    className="h-14.5 w-25.5 absolute -right-2.5 -top-2 z-10 max-sm:hidden"
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
                            xmlns="http://www.w3.org/2000/svg"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                            viewBox="0 0 128 32"
                            xmlSpace="preserve"
                        >
                            <line
                                stroke="var(--color-site-header-background)"
                                strokeWidth="2px"
                                shapeRendering="optimizeQuality"
                                vectorEffect="non-scaling-stroke"
                                strokeLinecap="round"
                                strokeMiterlimit="10"
                                x1="1"
                                y1="0"
                                x2="128"
                                y2="0"
                            ></line>
                            <path
                                stroke="var(--color-site-header-border)"
                                className="translate-y-[0.5px]"
                                fill="var(--color-site-header-background)"
                                shapeRendering="optimizeQuality"
                                strokeWidth="1px"
                                strokeLinecap="round"
                                strokeMiterlimit="10"
                                vectorEffect="non-scaling-stroke"
                                d="M0,0c5.9,0,10.7,4.8,10.7,10.7v10.7c0,5.9,4.8,10.7,10.7,10.7H128V0"
                            ></path>
                        </svg>
                    </div>
                </div>
            </header>
            <BlurGradientOverlay />
        </>
    );
};
