"use client";

import { AutoHeight } from "@anole/ui/components/auto-height";
import { Button } from "@anole/ui/components/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerPortal, DrawerTitle } from "@anole/ui/components/drawer";
import MCPIcon from "@anole/ui/icons/mcp";
import { useLingui } from "@lingui/react/macro";
import { isShortcutEvent, Shortcuts } from "lib/keyboard-shortcuts";
import { UserIcon, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";

import { appStore } from "../../store";
import { MCPInstructionsContent, UserInstructionsContent } from "./chat-preferences-content";

export const ChatPreferencesPopup = () => {
    const [openChatPreferences, appStoreMutate] = appStore(useShallow((state) => [state.openChatPreferences, state.mutate]));

    const { t } = useLingui();

    const tabs = useMemo(
        () => [
            {
                icon: <UserIcon className="h-4 w-4" />,
                label: t`Chat.ChatPreferences.userInstructions`,
            },
            {
                icon: <MCPIcon className="fill-muted-foreground h-4 w-4" />,
                label: t`Chat.ChatPreferences.mcpInstructions`,
            },
        ],
        [],
    );

    const [tab, setTab] = useState(0);

    const handleClose = () => {
        appStoreMutate({ openChatPreferences: false });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isChatPreferencesEvent = isShortcutEvent(e, Shortcuts.openChatPreferences);

            if (isChatPreferencesEvent) {
                e.preventDefault();
                e.stopPropagation();
                appStoreMutate((previous) => {
                    return {
                        openChatPreferences: !previous.openChatPreferences,
                    };
                });
            }

            // ESC key to close
            if (e.key === "Escape" && openChatPreferences) {
                e.preventDefault();
                handleClose();
            }
        };

        globalThis.addEventListener("keydown", handleKeyDown);

        return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }, [openChatPreferences]);

    useEffect(() => {
        if (!openChatPreferences)
            setTab(0);
    }, [openChatPreferences]);

    return (
        <Drawer direction="top" handleOnly onOpenChange={(open) => appStoreMutate({ openChatPreferences: open })} open={openChatPreferences}>
            <DrawerPortal>
                <DrawerContent
                    className="bg-card flex h-full max-h-[100vh]! w-full flex-col overflow-hidden rounded-none border-none p-4 md:p-6"
                    style={{
                        userSelect: "text",
                    }}
                >
                    <div className="flex items-center justify-end">
                        <Button onClick={handleClose} size="icon" variant="ghost">
                            <X />
                        </Button>
                    </div>
                    <DrawerTitle className="sr-only">Chat Preferences</DrawerTitle>
                    <DrawerDescription className="sr-only" />

                    <div className="flex justify-center">
                        <div className="mt-4 w-full lg:mt-14 lg:w-5xl">
                            {/* Mobile: Tabs as horizontal scroll */}
                            <div className="md:hidden">
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {tabs.map((tabItem, index) => (
                                        <button
                                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                                                tab === index ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"
                                            }`}
                                            key={index}
                                            onClick={() => setTab(index)}
                                        >
                                            {tabItem.icon}
                                            <span>{tabItem.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-1 overflow-hidden">
                                {/* Desktop: Sidebar */}
                                <div className="hidden w-64 md:block">
                                    <nav className="flex flex-col gap-2 px-4">
                                        {tabs.map((tabItem, index) => (
                                            <button
                                                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200 ${
                                                    tab === index
                                                        ? "bg-primary text-primary-foreground shadow-md"
                                                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                                }`}
                                                key={index}
                                                onClick={() => setTab(index)}
                                            >
                                                {tabItem.icon}
                                                <span className="font-medium">{tabItem.label}</span>
                                            </button>
                                        ))}
                                    </nav>
                                </div>

                                {/* Content */}
                                <AutoHeight className="max-h-[80vh] flex-1 overflow-y-auto rounded-lg border">
                                    <div className="p-4 md:p-8">
                                        {openChatPreferences && <>{tab === 0 ? <UserInstructionsContent /> : tab === 1 ? <MCPInstructionsContent /> : null}</>}
                                    </div>
                                </AutoHeight>
                            </div>
                        </div>
                    </div>
                </DrawerContent>
            </DrawerPortal>
        </Drawer>
    );
};
