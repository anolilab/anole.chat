"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetTitle, SheetContent } from "@/components/ui/sheet";
import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CogIcon, PenIcon } from "lucide-react";

type SettingsPanelContext = {
    openMobile: boolean;
    setOpenMobile: (open: boolean) => void;
    isMobile: boolean;
    togglePanel: () => void;
};

const SettingsPanelContext = React.createContext<SettingsPanelContext | null>(null);

function useSettingsPanel() {
    const context = React.useContext(SettingsPanelContext);
    if (!context) {
        throw new Error("useSettingsPanel must be used within a SettingsPanelProvider.");
    }
    return context;
}

export const SettingsPanelProvider = ({ children }: { children: React.ReactNode }) => {
    const isMobile = useIsMobile(1400);
    const [openMobile, setOpenMobile] = React.useState(false);

    // Helper to toggle the sidebar.
    const togglePanel = React.useCallback(() => {
        return isMobile && setOpenMobile((open) => !open);
    }, [isMobile, setOpenMobile]);

    const contextValue = React.useMemo<SettingsPanelContext>(
        () => ({
            isMobile,
            openMobile,
            setOpenMobile,
            togglePanel,
        }),
        [isMobile, openMobile, setOpenMobile, togglePanel],
    );

    return <SettingsPanelContext.Provider value={contextValue}>{children}</SettingsPanelContext.Provider>;
};
SettingsPanelProvider.displayName = "SettingsPanelProvider";

const SettingsPanelContent = () => {
    const id = React.useId();

    return (
        <>
            {/* Sidebar header */}
            <div className="py-5">
                <div className="flex items-center gap-2">
                    <PenIcon className="text-muted-foreground/70" size={20} aria-hidden="true" />
                    <h2 className="text-sm font-medium">My preferences</h2>
                </div>
            </div>

            {/* Sidebar content */}
            <div className="-mt-px">
                {/* Content group */}
                <div className="relative py-5 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-black/[0.06] before:via-black/10 before:to-black/[0.06]">
                    <h3 className="text-muted-foreground/80 mb-4 text-xs font-medium uppercase">Chat presets</h3>
                    <div className="space-y-3">
                        {/* Model */}
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor={`${id}-model`} className="font-normal">
                                Model
                            </Label>
                            <Select defaultValue="1">
                                <SelectTrigger id={`${id}-model`} className="bg-background h-7 w-auto max-w-full gap-1 border-none px-2 py-1 [&_svg]:-me-1">
                                    <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent
                                    className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2"
                                    align="end"
                                >
                                    <SelectItem value="1">Chat 4.0</SelectItem>
                                    <SelectItem value="2">Chat 3.5</SelectItem>
                                    <SelectItem value="3">Chat 3.0</SelectItem>
                                    <SelectItem value="4">Chat 2.5</SelectItem>
                                    <SelectItem value="5">Chat 2.0</SelectItem>
                                    <SelectItem value="6">Chat 1.5</SelectItem>
                                    <SelectItem value="7">Chat 1.0</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Response format */}
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor={`${id}-response-format`} className="font-normal">
                                Response format
                            </Label>
                            <Select defaultValue="1">
                                <SelectTrigger
                                    id={`${id}-response-format`}
                                    className="bg-background h-7 w-auto max-w-full gap-1 border-none px-2 py-1 [&_svg]:-me-1"
                                >
                                    <SelectValue placeholder="Select response format" />
                                </SelectTrigger>
                                <SelectContent
                                    className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2"
                                    align="end"
                                >
                                    <SelectItem value="1">text</SelectItem>
                                    <SelectItem value="2">json_object</SelectItem>
                                    <SelectItem value="3">json_schema</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Writing style */}
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor={`${id}-writing-style`} className="font-normal">
                                Writing style
                            </Label>
                            <Select defaultValue="1">
                                <SelectTrigger
                                    id={`${id}-writing-style`}
                                    className="bg-background h-7 w-auto max-w-full gap-1 border-none px-2 py-1 [&_svg]:-me-1"
                                >
                                    <SelectValue placeholder="Select writing style" />
                                </SelectTrigger>
                                <SelectContent
                                    className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2"
                                    align="end"
                                >
                                    <SelectItem value="1">Concise</SelectItem>
                                    <SelectItem value="2">Formal</SelectItem>
                                    <SelectItem value="3">Technical</SelectItem>
                                    <SelectItem value="4">Creative</SelectItem>
                                    <SelectItem value="5">Scientific</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Mode */}
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor={`${id}-mode`} className="font-normal">
                                Mode
                            </Label>
                            <Select defaultValue="1">
                                <SelectTrigger id={`${id}-mode`} className="bg-background h-7 w-auto max-w-full gap-1 border-none px-2 py-1 [&_svg]:-me-1">
                                    <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent
                                    className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2"
                                    align="end"
                                >
                                    <SelectItem value="1">Chatbot</SelectItem>
                                    <SelectItem value="2">Code</SelectItem>
                                    <SelectItem value="3">Translate</SelectItem>
                                    <SelectItem value="4">Summarize</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
SettingsPanelContent.displayName = "SettingsPanelContent";

export const SettingsPanel = () => {
    const { isMobile, openMobile, setOpenMobile } = useSettingsPanel();

    if (isMobile) {
        return (
            <Sheet open={openMobile} onOpenChange={setOpenMobile}>
                <SheetContent className="w-72 bg-[hsl(240_5%_92.16%)] px-4 py-0 md:px-6 [&>button]:hidden">
                    <SheetTitle className="hidden">Settings</SheetTitle>
                    <div className="flex h-full w-full flex-col">
                        <SettingsPanelContent />
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <ScrollArea>
            <div className="w-[300px] h-screen px-4 md:px-6 bg-accent">
                <SettingsPanelContent />
            </div>
        </ScrollArea>
    );
};
SettingsPanel.displayName = "SettingsPanel";

export const SettingsPanelTrigger = ({ onClick }: { onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void }) => {
    const { isMobile, togglePanel } = useSettingsPanel();

    if (!isMobile) {
        return null;
    }

    return (
        <Button
            variant="ghost"
            className="px-2"
            onClick={(event) => {
                onClick?.(event);
                togglePanel();
            }}
        >
            <CogIcon className="text-muted-foreground sm:text-muted-foreground/70 size-5" size={20} aria-hidden="true" />
            <span className="max-sm:sr-only">Settings</span>
        </Button>
    );
};

SettingsPanelTrigger.displayName = "SettingsPanelTrigger";
