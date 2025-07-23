"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@anole/ui/components/dialog";
import { useLingui } from "@lingui/react/macro";
import { getShortcutKeyList, isShortcutEvent, Shortcuts } from "lib/keyboard-shortcuts";
import { useEffect } from "react";
import { useShallow } from "zustand/shallow";

import { appStore } from "../store";

export const KeyboardShortcutsPopup = ({}) => {
    const [openShortcutsPopup, appStoreMutate] = appStore(useShallow((state) => [state.openShortcutsPopup, state.mutate]));
    const { t } = useLingui();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isShortcutEvent(e, Shortcuts.openShortcutsPopup)) {
                e.preventDefault();
                e.stopPropagation();
                appStoreMutate((previous) => {
                    return {
                        openShortcutsPopup: !previous.openShortcutsPopup,
                    };
                });
            }
        };

        globalThis.addEventListener("keydown", handleKeyDown);

        return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <Dialog onOpenChange={() => appStoreMutate({ openShortcutsPopup: !openShortcutsPopup })} open={openShortcutsPopup}>
            <DialogContent className="md:max-w-3xl">
                <DialogTitle>{t`title`}</DialogTitle>
                <DialogDescription />
                <div className="grid grid-cols-2 gap-5">
                    {Object.entries(Shortcuts).map(([key, shortcut]) => (
                        <div className="flex w-full items-center gap-2 px-2 text-sm" key={key}>
                            <p>{shortcut.description}</p>
                            <div className="flex-1" />
                            {getShortcutKeyList(shortcut).map((key) => (
                                <div className="bg-muted flex min-h-8 min-w-8 items-center justify-center rounded-md border p-1.5 text-xs" key={key}>
                                    <span>{key}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};
