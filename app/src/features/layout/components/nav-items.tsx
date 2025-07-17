import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@anole/ui/components/sidebar";
import cn from "@anole/ui/utils/cn";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

const colorModeClasses = {
    dark: {
        button: "text-white/80 hover:text-white hover:bg-white/10 data-[state=open]:bg-white/10",
        buttonActive: "bg-white/20 text-white",
        group: "group-data-[collapsible=icon]:hidden",
        icon: "text-white/70",
        iconActive: "text-white",
        label: "text-white/90",
    },
    light: {
        button: "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800",
        buttonActive: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white",
        group: "group-data-[collapsible=icon]:hidden",
        icon: "text-gray-600 dark:text-gray-400",
        iconActive: "text-gray-900 dark:text-white",
        label: "text-gray-700 dark:text-gray-300",
    },
};

export type NavItem = {
    icon: LucideIcon;
    name: string;
    url: string;
};

export type ColorMode = "light" | "dark";

export const NavItems = ({
    classes: classNames,
    colorMode = "light",
    items,
    label,
}: {
    classes?: { button?: string; buttonActive?: string; group?: string; icon?: string; iconActive?: string; label?: string };
    colorMode?: ColorMode;
    items: NavItem[];
    label: string;
}) => {
    const classes = colorModeClasses[colorMode];

    return (
        <SidebarGroup className={cn(classes.group, classNames?.group)}>
            <SidebarGroupLabel className={cn(classes.label, classNames?.label)}>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild className={cn(classes.button, classNames?.button)}>
                            <Link
                                activeOptions={{
                                    // Match exact path for main routes, and include sub-paths for settings
                                    exact: !item.url.includes("/settings"),
                                }}
                                activeProps={{
                                    className: cn(classes.buttonActive, classNames?.buttonActive),
                                }}
                                to={item.url}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon className={cn(isActive ? classes.iconActive : classes.icon, classNames?.icon)} />
                                        <span>{item.name}</span>
                                    </>
                                )}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
};
