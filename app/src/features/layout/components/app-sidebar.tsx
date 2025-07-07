"use client";

import { NavUser } from "@/features/layout/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";

export const AppSidebar = ({
    header,
    content,
    footer,
    ...props
}: React.ComponentProps<typeof Sidebar> & { header?: React.ReactNode; content: React.ReactNode; footer?: React.ReactNode }) => {
    return (
        <Sidebar collapsible="offcanvas" variant="inset" {...props}>
            <SidebarHeader>{header}</SidebarHeader>
            <SidebarContent>{content}</SidebarContent>
            <SidebarFooter>
                {footer}
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
};
