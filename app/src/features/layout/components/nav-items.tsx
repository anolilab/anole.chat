import { type LucideIcon } from "lucide-react";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";

const colorModeClasses = {
    light: {
        group: "group-data-[collapsible=icon]:hidden",
        label: "text-gray-700 dark:text-gray-300",
        button: "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800",
        icon: "text-gray-600 dark:text-gray-400",
    },
    dark: {
        group: "group-data-[collapsible=icon]:hidden",
        label: "text-white/90",
        button: "text-white/80 hover:text-white hover:bg-white/10 data-[state=open]:bg-white/10 data-[active=true]:bg-white/10",
        icon: "text-white/70",
    },
};

export type NavItem = {
    name: string;
    url: string;
    icon: LucideIcon;
};

export type ColorMode = "light" | "dark";

export function NavItems({ items, label, colorMode = "light" }: { items: NavItem[]; label: string; colorMode?: ColorMode }) {
    const classes = colorModeClasses[colorMode];

    return (
        <SidebarGroup className={classes.group}>
            <SidebarGroupLabel className={classes.label}>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild className={classes.button}>
                            <Link to={item.url}>
                                <item.icon className={classes.icon} />
                                <span>{item.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
