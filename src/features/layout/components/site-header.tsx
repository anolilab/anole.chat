import { ModeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { FC, PropsWithChildren } from "react";

export const SiteHeader: FC<PropsWithChildren<{ title?: string }>> = ({ title, children }) => {
    return (
        <header className="relativeflex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="relative z-20 flex w-full items-center gap-1 pl-4 lg:gap-2 lg:pl-6">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                {title && <h1 className="text-lg font-bold">{title}</h1>}
                {children}
                <div className="flex-grow" />
                <ModeToggle />
            </div>
            <div
                className="fixed top-0 right-0 z-10 h-14 w-28 max-sm:hidden"
                style={{
                    clipPath: "inset(0px 8px 0px 0px)",
                }}
            >
                <div
                    className="group ease-snappy pointer-events-none absolute top-1.5 z-10 -mb-8 h-32 w-full origin-top transition-all"
                    style={{
                        boxShadow: "10px -10px 8px 2px var(--color-accent-foreground)",
                    }}
                >
                    <svg
                        className="absolute -right-8 h-9 origin-top-left skew-x-[30deg] overflow-visible"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        viewBox="0 0 128 32"
                        xmlSpace="preserve"
                    >
                        <path
                            className="translate-y-[0.5px]"
                            fill="var(--color-accent-foreground)"
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
    );
};
