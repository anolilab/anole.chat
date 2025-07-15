"use client";

import type { FC } from "react";

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";

const SettingsPanel: FC = () => (
    <Sidebar className="[&>div]:rounded-l-xl [&>div]:bg-white py-1" collapsible="offcanvas" name="right" side="right" variant="inset">
        <SidebarHeader>
                Settings
            </SidebarHeader>
            <SidebarContent className="p-2">
                test
            </SidebarContent>
        <SidebarRail name="right" />
    </Sidebar>
);

export default SettingsPanel;
