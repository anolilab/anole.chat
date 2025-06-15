import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { FC, PropsWithChildren } from "react";

export const SiteHeader: FC<PropsWithChildren<{ title?: string }>> = ({ title, children }) => {
    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                {title && <h1 className="text-lg font-bold">{title}</h1>}
                {children}
            </div>
        </header>
    );
};
