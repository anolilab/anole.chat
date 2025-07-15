import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { PanelLeftIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import useIsMobile from "../../hooks/use-mobile";
import { Button } from "./button";
import { Input } from "./input";
import KeybindingTooltip from "./keybinding-tooltip";
import { Separator } from "./separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./sheet";
import { Skeleton } from "./skeleton";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./tooltip";

/**
 * &lt;SidebarProvider
 * defaultOpen={['left']}
 * sidebarNames={['left', 'right']}
 * keyboardShortcuts={{ left: 'b', right: 'l' }}
 * >
 * &lt;SidebarLeft name="left" />
 * &lt;SidebarInset className="h-screen flex-1 min-w-0 ">
 * &lt;header className="flex h-10 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-10 bg-sidebar">
            <div className="flex flex-row justify-between items-center gap-2 px-2 pt-4">
                <SidebarTrigger name="left" className="hover:bg-gray-200" />
                <SidebarTrigger
                  name="right"
                  className="hover:bg-gray-200"
                  icon={<PanelRightIcon />}
                />
            </div>
          </header>
          {children}
        </SidebarInset>
        <SidebarRight name="right" />
      </SidebarProvider>
 */

const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const DEFAULT_KEYBOARD_SHORTCUT = "b";

type SidebarState = {
    isMobileOpen: boolean;
    isOpen: boolean;
};

type SidebarContextProperties<T extends string> = {
    isMobile: boolean;
    setSidebarState: (name: T, state: Partial<SidebarState> | ((previous: SidebarState) => Partial<SidebarState>)) => void;
    sidebars: Record<T, SidebarState>;
    toggleSidebar: (name: T) => void;
};

const SidebarContext = React.createContext<SidebarContextProperties<any> | null>(null);

const useSidebar = <T extends string>(name: T) => {
    const context = React.use(SidebarContext);

    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider.");
    }

    const sidebarState = context.sidebars[name] ?? { isMobileOpen: false, isOpen: false };

    return {
        ...sidebarState,
        isMobile: context.isMobile,
        setState: (state: Partial<SidebarState>) => context.setSidebarState(name, state),
        toggle: () => context.toggleSidebar(name),
    };
};

const SidebarProvider = <T extends string>({
    children,
    className,
    defaultOpen = "all",
    keyboardShortcuts,
    onOpenChange: setOpenProperty,
    open: openProperty,
    sidebarNames,
    style,
    ...properties
}: React.ComponentProps<"div"> & {
    defaultOpen?: "all" | T[];
    keyboardShortcuts?: Partial<Record<T, string>>;
    onOpenChange?: (open: T[]) => void;
    open?: T[];
    sidebarNames: ReadonlyArray<T>;
}) => {
    const isMobile = useIsMobile();

    // Initialize sidebar states
    const initialSidebars = React.useMemo(() => {
        const states: Record<T, SidebarState> = {} as Record<T, SidebarState>;
        const defaultOpenState = defaultOpen === "all" ? sidebarNames : defaultOpen;

        sidebarNames.forEach((name) => {
            states[name] = {
                isMobileOpen: false,
                isOpen: defaultOpenState.includes(name),
            };
        });

        return states;
    }, [defaultOpen, sidebarNames]);

    const [sidebars, setSidebars] = React.useState<Record<T, SidebarState>>(initialSidebars);

    // Update sidebars when openProp changes
    React.useEffect(() => {
        if (openProperty) {
            setSidebars((previous) => {
                const next = { ...previous };

                sidebarNames.forEach((name) => {
                    next[name] = {
                        ...next[name],
                        isOpen: openProperty.includes(name),
                    };
                });

                return next;
            });
        }
    }, [openProperty, sidebarNames]);

    const setSidebarState = React.useCallback(
        (name: T, state: Partial<SidebarState> | ((previous: SidebarState) => Partial<SidebarState>)) => {
            setSidebars((previous) => {
                const next = { ...previous };
                const currentState = next[name] ?? { isMobileOpen: false, isOpen: false };
                const newState = typeof state === "function" ? state(currentState) : state;

                next[name] = { ...currentState, ...newState };

                // Update cookie
                const openState = Object.entries(next)
                    .filter(([_, state]) => (state as SidebarState).isOpen)
                    .map(([name]) => name as T);

                document.cookie = `${openState.map((sidebarName) => `${sidebarName}:state=${next[sidebarName].isOpen}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`).join("; ")}`;

                // Call onOpenChange if provided
                if (setOpenProperty) {
                    setOpenProperty(openState);
                }

                return next;
            });
        },
        [setOpenProperty],
    );

    const toggleSidebar = React.useCallback(
        (name: T) => {
            setSidebarState(name, (previous: SidebarState) => {
                return {
                    ...previous,
                    isMobileOpen: isMobile ? !previous.isMobileOpen : previous.isMobileOpen,
                    isOpen: isMobile ? previous.isMobileOpen : !previous.isOpen,
                };
            });
        },
        [isMobile, setSidebarState],
    );

    // Add keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!(event.metaKey || event.ctrlKey))
                return;

            // Check each sidebar's shortcut
            Object.entries(keyboardShortcuts ?? {}).forEach(([name, shortcut]) => {
                if (event.key === shortcut) {
                    event.preventDefault();
                    toggleSidebar(name as T);
                }
            });

            // If no specific shortcuts are provided, use the default shortcut for all sidebars
            if (!keyboardShortcuts && event.key === DEFAULT_KEYBOARD_SHORTCUT) {
                event.preventDefault();
                sidebarNames.forEach((name) => toggleSidebar(name));
            }
        };

        globalThis.addEventListener("keydown", handleKeyDown);

        return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar, keyboardShortcuts, sidebarNames]);

    const contextValue = React.useMemo<SidebarContextProperties<T>>(() => {
        return {
            isMobile,
            setSidebarState,
            sidebars,
            toggleSidebar,
        };
    }, [sidebars, setSidebarState, toggleSidebar, isMobile]);

    return (
        <SidebarContext value={contextValue}>
            <TooltipProvider delayDuration={0}>
                <div
                    className={cn("group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full", className)}
                    data-slot="sidebar-wrapper"
                    style={
                        {
                            "--sidebar-width": SIDEBAR_WIDTH,
                            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                            ...style,
                        } as React.CSSProperties
                    }
                    {...properties}
                >
                    {children}
                </div>
            </TooltipProvider>
        </SidebarContext>
    );
};

const Sidebar = <T extends string>({
    children,
    className,
    collapsible = "offcanvas",
    name,
    side = "left",
    variant = "sidebar",
    ...properties
}: React.ComponentProps<"div"> & {
    collapsible?: "offcanvas" | "icon" | "none";
    name: T;
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
}) => {
    const { isMobile, isMobileOpen, isOpen, setState } = useSidebar(name);

    if (collapsible === "none") {
        return (
            <div className={cn("bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col", className)} data-slot="sidebar" {...properties}>
                {children}
            </div>
        );
    }

    if (isMobile) {
        return (
            <Sheet onOpenChange={(open) => setState({ isMobileOpen: open })} open={isMobileOpen} {...properties}>
                <SheetContent
                    className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
                    data-mobile="true"
                    data-sidebar="sidebar"
                    data-slot="sidebar"
                    side={side}
                    style={
                        {
                            "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
                        } as React.CSSProperties
                    }
                >
                    <SheetHeader className="sr-only">
                        <SheetTitle>Sidebar</SheetTitle>
                        <SheetDescription>Displays the mobile sidebar.</SheetDescription>
                    </SheetHeader>
                    <div className="flex h-full w-full flex-col">{children}</div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <div
            className="group peer text-sidebar-foreground hidden md:block"
            data-collapsible={isOpen ? "" : collapsible}
            data-side={side}
            data-slot="sidebar"
            data-state={isOpen ? "expanded" : "collapsed"}
            data-variant={variant}
        >
            {/* This is what handles the sidebar gap on desktop */}
            <div
                className={cn(
                    "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
                    "group-data-[collapsible=offcanvas]:w-0",
                    "group-data-[side=right]:rotate-180",
                    variant === "floating" || variant === "inset"
                        ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
                        : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
                )}
                data-slot="sidebar-gap"
            />
            <div
                className={cn(
                    "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
                    side === "left"
                        ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
                        : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
                    // Adjust the padding for floating and inset variants.
                    variant === "floating" || variant === "inset"
                        ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
                        : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=right]:border-l",
                    // group-data-[side=left]:border-r
                    className,
                )}
                data-slot="sidebar-container"
                {...properties}
            >
                <div
                    className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
                    data-sidebar="sidebar"
                    data-slot="sidebar-inner"
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

const SidebarTrigger = <T extends string>({
    className,
    icon,
    name,
    onClick,
    ...properties
}: React.ComponentProps<typeof Button> & {
    icon?: React.ReactNode;
    name: T;
}) => {
    const { toggle } = useSidebar(name);

    return (
        <Button
            className={cn("size-6", className)}
            data-sidebar="trigger"
            data-slot="sidebar-trigger"
            onClick={(event) => {
                onClick?.(event);
                toggle();
            }}
            size="icon"
            variant="ghost"
            {...properties}
        >
            {icon ?? <PanelLeftIcon />}
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
    );
};

const SidebarRail = <T extends string>({
    className,
    name,
    side = "left",
    ...properties
}: React.ComponentProps<"button"> & {
    name: T;
}) => {
    const { toggle, isOpen } = useSidebar(name);

    return (
        <Tooltip>
      <TooltipTrigger asChild>
        <button
          data-sidebar="rail"
          data-slot="sidebar-rail"
          aria-label="Toggle Sidebar"
          tabIndex={-1}
          onClick={toggle}
          title="Toggle Sidebar"
          className={cn(
            "transition-[left,right,translate] fixed top-1/2 in-data-[side=left]:left-(--sidebar-width) in-data-[side=right]:right-(--sidebar-width) h-20 w-8 -translate-y-1/2 cursor-pointer duration-300 ease-in-out in-data-[side=left]:group-data-[collapsible=offcanvas]:left-0 in-data-[side=left]:group-data-[collapsible=icon]:left-(--sidebar-width-icon) in-data-[side=right]:group-data-[collapsible=offcanvas]:right-0 in-data-[side=right]:group-data-[collapsible=icon]:right-(--sidebar-width-icon) max-md:hidden",
            {
                "in-data-[side=left]:translate-x-1 in-data-[side=right]:-translate-x-1": !isOpen,
                "in-data-[side=left]:-translate-x-2 hover:in-data-[side=left]:translate-x-1 in-data-[side=right]:translate-x-1 hover:in-data-[side=right]:-translate-x-2": isOpen
            },
            className
          )}
          {...properties}
        >
          <div
            className="in-data-[side=right]:ml-auto before:bg-muted-foreground after:bg-muted-foreground pointer-events-none h-6 w-4 in-data-[side=left]:translate-x-2 in-data-[side=right]:-translate-x-2 opacity-50 transition-all ease-in-out group-data-[state=collapsed]:translate-x-0 before:absolute before:top-[calc(50%-7px)] in-data-[side=left]:before:left-[calc(50%-1px)] in-data-[side=right]:before:left-[calc(50%+1)] before:h-[9px] before:w-0.5 before:rounded-full before:transition-all after:absolute after:bottom-[calc(50%-7px)] in-data-[side=left]:after:left-[calc(50%-1px)] in-data-[side=right]:after:left-[calc(50%+1)] after:h-[9px] after:w-0.5 after:rounded-full after:transition-all in-[[data-slot=sidebar-rail]:hover]:opacity-100 in-data-[side=left]:in-[[data-slot=sidebar-rail]:hover]:translate-x-1 group-data-[state=collapsed]:in-data-[side=left]:in-[[data-slot=sidebar-rail]:hover]:translate-x-3 group-data-[state=collapsed]:group-data-[collapsible=icon]:in-data-[side=left]:in-[[data-slot=sidebar-rail]:hover]:translate-x-1 in-data-[side=left]:in-[[data-slot=sidebar-rail]:hover]:before:rotate-45 group-data-[state=collapsed]:in-data-[side=left]:in-[[data-slot=sidebar-rail]:hover]:before:-rotate-45 in-data-[side=left]:in-[[data-slot=sidebar-rail]:hover]:after:-rotate-45 group-data-[state=collapsed]:in-data-[side=left]:in-[[data-slot=sidebar-rail]:hover]:after:rotate-45 in-data-[side=right]:in-[[data-slot=sidebar-rail]:hover]:-translate-x-1 group-data-[state=collapsed]:in-data-[side=right]:in-[[data-slot=sidebar-rail]:hover]:-translate-x-3 group-data-[state=collapsed]:group-data-[collapsible=icon]:in-data-[side=right]:in-[[data-slot=sidebar-rail]:hover]:-translate-x-1 in-data-[side=right]:in-[[data-slot=sidebar-rail]:hover]:before:-rotate-45 group-data-[state=collapsed]:in-data-[side=right]:in-[[data-slot=sidebar-rail]:hover]:before:rotate-45 in-data-[side=right]:in-[[data-slot=sidebar-rail]:hover]:after:rotate-45 group-data-[state=collapsed]:in-data-[side=right]:in-[[data-slot=sidebar-rail]:hover]:after:-rotate-45"
            aria-hidden="true"
          ></div>
        </button>
      </TooltipTrigger>
      <TooltipContent side={side === "right" ? "left" : "right"} className="[&_span]:hidden">
        {!isOpen ? "Expand" : "Collapse"}
      </TooltipContent>
    </Tooltip>
    );
};

const SidebarInset = ({ className, ...properties }: React.ComponentProps<"main">) => (
    <main
        className={cn(
            "bg-sidebar relative flex w-full flex-1 flex-col",
            "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
            className,
        )}
        data-slot="sidebar-inset"
        {...properties}
    />
);

const SidebarInput = ({ className, ...properties }: React.ComponentProps<typeof Input>) => (
    <Input className={cn("bg-background h-8 w-full shadow-none", className)} data-sidebar="input" data-slot="sidebar-input" {...properties} />
);

const SidebarHeader = ({ className, ...properties }: React.ComponentProps<"div">) => (
    <div className={cn("flex flex-col gap-2 p-2", className)} data-sidebar="header" data-slot="sidebar-header" {...properties} />
);

const SidebarFooter = ({ className, ...properties }: React.ComponentProps<"div">) => (
    <div className={cn("flex flex-col items-center gap-2 p-2", className)} data-sidebar="footer" data-slot="sidebar-footer" {...properties} />
);

const SidebarSeparator = ({ className, ...properties }: React.ComponentProps<typeof Separator>) => (
    <Separator className={cn("bg-sidebar-border mx-2 w-auto", className)} data-sidebar="separator" data-slot="sidebar-separator" {...properties} />
);

const SidebarContent = ({ className, ...properties }: React.ComponentProps<"div">) => (
    <div
        className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden", className)}
        data-sidebar="content"
        data-slot="sidebar-content"
        {...properties}
    />
);

const SidebarGroup = ({ className, ...properties }: React.ComponentProps<"div">) => (
    <div className={cn("relative flex w-full min-w-0 flex-col items-center", className)} data-sidebar="group" data-slot="sidebar-group" {...properties} />
);

const SidebarGroupLabel = ({ asChild = false, className, ...properties }: React.ComponentProps<"div"> & { asChild?: boolean }) => {
    const Comp = asChild ? Slot : "div";

    return (
        <Comp
            className={cn(
                "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
                "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
                className,
            )}
            data-sidebar="group-label"
            data-slot="sidebar-group-label"
            {...properties}
        />
    );
};

const SidebarGroupAction = ({ asChild = false, className, ...properties }: React.ComponentProps<"button"> & { asChild?: boolean }) => {
    const Comp = asChild ? Slot : "button";

    return (
        <Comp
            className={cn(
                "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
                // Increases the hit area of the button on mobile.
                "after:absolute after:-inset-2 md:after:hidden",
                "group-data-[collapsible=icon]:hidden",
                className,
            )}
            data-sidebar="group-action"
            data-slot="sidebar-group-action"
            {...properties}
        />
    );
};

const SidebarGroupContent = ({ className, ...properties }: React.ComponentProps<"div">) => (
    <div className={cn("w-full text-sm", className)} data-sidebar="group-content" data-slot="sidebar-group-content" {...properties} />
);

const SidebarMenu = ({ className, ...properties }: React.ComponentProps<"ul">) => (
    <ul className={cn("flex w-full min-w-0 flex-col gap-1", className)} data-sidebar="menu" data-slot="sidebar-menu" {...properties} />
);

const SidebarMenuItem = ({ className, ...properties }: React.ComponentProps<"li">) => (
    <li className={cn("group/menu-item relative", className)} data-sidebar="menu-item" data-slot="sidebar-menu-item" {...properties} />
);

const sidebarMenuButtonVariants = cva(
    "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-gray-200 data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
    {
        defaultVariants: {
            size: "default",
            variant: "default",
        },
        variants: {
            size: {
                default: "h-8 text-sm",
                lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
                sm: "h-7 text-xs",
            },
            variant: {
                default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                outline:
                    "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
            },
        },
    },
);

const SidebarMenuButton = <T extends string>({
    asChild = false,
    className,
    isActive = false,
    name,
    size = "default",
    tooltip,
    variant = "default",
    ...properties
}: React.ComponentProps<"button">
    & VariantProps<typeof sidebarMenuButtonVariants> & {
        asChild?: boolean;
        isActive?: boolean;
        name: T;
        tooltip?: string | React.ComponentProps<typeof TooltipContent>;
    }): React.ReactElement => {
    const Comp = asChild ? Slot : "button";
    const { isMobile, isOpen } = useSidebar(name);

    const button = (
        <Comp
            className={cn(sidebarMenuButtonVariants({ size, variant }), className)}
            data-active={isActive}
            data-sidebar="menu-button"
            data-size={size}
            data-slot="sidebar-menu-button"
            {...properties}
        />
    );

    if (!tooltip) {
        return button;
    }

    if (typeof tooltip === "string") {
        tooltip = {
            children: tooltip,
        };
    }

    return (
        <KeybindingTooltip align="center" className="mx-1 ml-1 rounded p-1 hover:bg-gray-200" hidden={!isOpen || isMobile} side="right" text={tooltip}>
            {button}
        </KeybindingTooltip>
    );
};

const SidebarMenuAction = ({
    asChild = false,
    className,
    showOnHover = false,
    ...properties
}: React.ComponentProps<"button"> & {
    asChild?: boolean;
    showOnHover?: boolean;
}) => {
    const Comp = asChild ? Slot : "button";

    return (
        <Comp
            className={cn(
                "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
                // Increases the hit area of the button on mobile.
                "after:absolute after:-inset-2 md:after:hidden",
                "peer-data-[size=sm]/menu-button:top-1",
                "peer-data-[size=default]/menu-button:top-1.5",
                "peer-data-[size=lg]/menu-button:top-2.5",
                "group-data-[collapsible=icon]:hidden",
                showOnHover
                && "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
                className,
            )}
            data-sidebar="menu-action"
            data-slot="sidebar-menu-action"
            {...properties}
        />
    );
};

const SidebarMenuBadge = ({ className, ...properties }: React.ComponentProps<"div">) => (
    <div
        className={cn(
            "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",
            "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
            "peer-data-[size=sm]/menu-button:top-1",
            "peer-data-[size=default]/menu-button:top-1.5",
            "peer-data-[size=lg]/menu-button:top-2.5",
            "group-data-[collapsible=icon]:hidden",
            className,
        )}
        data-sidebar="menu-badge"
        data-slot="sidebar-menu-badge"
        {...properties}
    />
);

const SidebarMenuSkeleton = ({
    className,
    showIcon = false,
    ...properties
}: React.ComponentProps<"div"> & {
    showIcon?: boolean;
}) => {
    // Random width between 50 to 90%.
    const width = React.useMemo(() => `${Math.floor(Math.random() * 40) + 50}%`, []);

    return (
        <div
            className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
            data-sidebar="menu-skeleton"
            data-slot="sidebar-menu-skeleton"
            {...properties}
        >
            {showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
            <Skeleton
                className="h-4 max-w-(--skeleton-width) flex-1"
                data-sidebar="menu-skeleton-text"
                style={
                    {
                        "--skeleton-width": width,
                    } as React.CSSProperties
                }
            />
        </div>
    );
};

const SidebarMenuSub = ({ className, ...properties }: React.ComponentProps<"ul">) => (
    <ul
        className={cn(
            "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
            "group-data-[collapsible=icon]:hidden",
            className,
        )}
        data-sidebar="menu-sub"
        data-slot="sidebar-menu-sub"
        {...properties}
    />
);

const SidebarMenuSubItem = ({ className, ...properties }: React.ComponentProps<"li">) => (
    <li className={cn("group/menu-sub-item relative", className)} data-sidebar="menu-sub-item" data-slot="sidebar-menu-sub-item" {...properties} />
);

const SidebarMenuSubButton = ({
    asChild = false,
    className,
    isActive = false,
    size = "md",
    ...properties
}: React.ComponentProps<"a"> & {
    asChild?: boolean;
    isActive?: boolean;
    size?: "sm" | "md";
}) => {
    const Comp = asChild ? Slot : "a";

    return (
        <Comp
            className={cn(
                "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
                "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
                size === "sm" && "text-xs",
                size === "md" && "text-sm",
                "group-data-[collapsible=icon]:hidden",
                className,
            )}
            data-active={isActive}
            data-sidebar="menu-sub-button"
            data-size={size}
            data-slot="sidebar-menu-sub-button"
            {...properties}
        />
    );
};

export {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInput,
    SidebarInset,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSkeleton,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
    useSidebar,
};
