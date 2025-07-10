import { type LucideIcon } from "lucide-react";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const colorModeClasses = {
    light: {
        group: "group-data-[collapsible=icon]:hidden",
        label: "text-gray-700 dark:text-gray-300",
        button: "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800",
        buttonActive: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white",
        icon: "text-gray-600 dark:text-gray-400",
        iconActive: "text-gray-900 dark:text-white",
    },
    dark: {
        group: "group-data-[collapsible=icon]:hidden",
        label: "text-white/90",
        button: "text-white/80 hover:text-white hover:bg-white/10 data-[state=open]:bg-white/10",
        buttonActive: "bg-white/20 text-white",
        icon: "text-white/70",
        iconActive: "text-white",
    },
};

export type NavItem = {
    name: string;
    url: string;
    icon: LucideIcon;
};

export type ColorMode = "light" | "dark";

export function NavItems({ items, label, colorMode = "light", classes: classNames }: { items: NavItem[]; label: string; colorMode?: ColorMode, classes?: { group?: string, label?: string, button?: string, buttonActive?: string, icon?: string, iconActive?: string } }) {
    const classes = colorModeClasses[colorMode];

    return (
        <SidebarGroup className={cn(classes.group, classNames?.group)}>
            <SidebarGroupLabel className={cn(classes.label, classNames?.label)}>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild className={cn(classes.button, classNames?.button)}>
                            <Link
                                to={item.url}
                                activeProps={{
                                    className: cn(classes.buttonActive, classNames?.buttonActive),
                                }}
                                activeOptions={{
                                    // Match exact path for main routes, and include sub-paths for settings
                                    exact: !item.url.includes("/settings"),
                                }}
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
}
