import { AudioWaveform, Command, File, GalleryVerticalEnd, Home, MessageCircle, Settings2 } from "lucide-react";
import * as React from "react";

import { NavItems } from "@/components/sidebar/nav-items";

import { NavUser } from "@/components/sidebar/nav-user";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";

// This is sample data.
const data = {
    organizations: [
        {
            name: "Acme Inc",
            logo: GalleryVerticalEnd,
            plan: "Enterprise",
        },
    ],
    items: [
        {
            name: "Overview",
            url: "/dashboard",
            icon: Home,
        },

        {
            name: "Settings",
            url: "/dashboard/settings",
            icon: Settings2,
        },
        {
            name: "Chat",
            url: "/chat",
            icon: MessageCircle,
        },
    ],
};

export const AppSidebar = ({
    header,
    content,
    footer,
    ...props
}: React.ComponentProps<typeof Sidebar> & { header?: React.ReactNode; content: React.ReactNode | React.ReactElement; footer?: React.ReactElement }) => {
    return (
        <Sidebar collapsible="offcanvas" {...props}>
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
