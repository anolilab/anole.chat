import { api } from "@anole/convex/api";
import { Alert, AlertDescription } from "@anole/ui/components/alert";
import { Button } from "@anole/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@anole/ui/components/card";
import { Input } from "@anole/ui/components/input";
import { Label } from "@anole/ui/components/label";
import { Separator } from "@anole/ui/components/separator";
import cn from "@anole/ui/utils/cn";
import { t } from "@lingui/core/macro";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Info, Keyboard, RotateCcw } from "lucide-react";
import type { FC, KeyboardEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import type { KeyboardShortcuts } from "@/features/layout/collections/ui-state-collection";
import { useKeyboardShortcuts } from "@/features/layout/hooks/use-ui-state";

interface ShortcutInputProperties {
    description: string;
    error?: string;
    label: string;
    onChange: (value: string) => void;
    placeholder?: string;
    shortcutKey: keyof KeyboardShortcuts;
    value: string;
}

// Reset individual shortcut to its default value
const defaultShortcuts = {
    escape: t`Escape`,
    firstItem: t`Home`,
    focusSearch: t`Ctrl+F`,
    help: t`Ctrl+/`,
    lastItem: t`End`,
    newChat: t`Ctrl+N`,
    nextItem: t`ArrowDown`,
    prevItem: t`ArrowUp`,
    search: t`Ctrl+K`,
    sidebarLeft: t`Ctrl+B`,
    sidebarRight: t`Ctrl+Shift+B`,
};

const ShortcutInput: FC<ShortcutInputProperties> = ({ description, error, label, onChange, placeholder = t`Press keys...`, shortcutKey, value }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [temporaryValue, setTemporaryValue] = useState(value);
    const keyboardShortcuts = useKeyboardShortcuts();

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!isRecording) {
                return;
            }

            event.preventDefault();

            // Skip modifier-only presses
            if (["Alt", "Control", "Meta", "Shift"].includes(event.key)) {
                return;
            }

            const modifiers = [];

            if (event.ctrlKey) {
                modifiers.push("Ctrl");
            }

            if (event.metaKey) {
                modifiers.push("Cmd");
            }

            if (event.shiftKey) {
                modifiers.push("Shift");
            }

            if (event.altKey) {
                modifiers.push("Alt");
            }

            // Handle special keys
            const keyMap: Record<string, string> = {
                " ": "Space",
                ArrowDown: "ArrowDown",
                ArrowLeft: "ArrowLeft",
                ArrowRight: "ArrowRight",
                ArrowUp: "ArrowUp",
                Enter: "Enter",
                Escape: "Escape",
            };

            const key = keyMap[event.key] || event.key;

            if (!modifiers.includes(key)) {
                modifiers.push(key);
            }

            const shortcut = modifiers.join("+");

            setTemporaryValue(shortcut);
        },
        [isRecording],
    );

    const handleFocus = useCallback(() => {
        setIsRecording(true);
        setTemporaryValue(value);
    }, [value]);

    const handleBlur = useCallback(() => {
        setIsRecording(false);

        if (temporaryValue !== value) {
            onChange(temporaryValue);
        }
    }, [temporaryValue, value, onChange]);

    const handleReset = useCallback(() => {
        const defaultValue = defaultShortcuts[shortcutKey as keyof typeof defaultShortcuts] || "";

        keyboardShortcuts.setShortcut(shortcutKey, defaultValue);
        onChange(defaultValue);
    }, [keyboardShortcuts, onChange, shortcutKey]);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium" htmlFor={shortcutKey}>
                    {label}
                </Label>
                <Button onClick={handleReset} size="sm" type="button" variant="ghost">
                    <RotateCcw className="mr-1 size-3" />
                    {t`Reset`}
                </Button>
            </div>

            <div className="relative">
                <Input
                    className={cn("font-mono text-sm", isRecording && "ring-2 ring-blue-500", error && "border-red-500 focus:ring-red-500")}
                    id={shortcutKey}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    placeholder={isRecording ? t`Press keys...` : placeholder}
                    readOnly
                    value={isRecording ? temporaryValue : value}
                />
                {isRecording && <div className="absolute -top-2 right-2 rounded bg-blue-500 px-1 py-0.5 text-xs text-white">{t`Recording`}</div>}
            </div>

            <p className="text-muted-foreground text-xs">{description}</p>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
};

interface KeyboardShortcutsSettingsProperties {
    className?: string;
}

const KeyboardShortcutsSettings: FC<KeyboardShortcutsSettingsProperties> = ({ className }) => {
    const keyboardShortcuts = useKeyboardShortcuts();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [hasChanges, setHasChanges] = useState(false);

    const userSettings = useQuery(api.auth.functions.getUserSettings);
    const updateUserSettings = useMutation(api.auth.functions.updateUserSettings);

    // Hydrate local UI state from Convex on load
    useEffect(() => {
        if (userSettings?.keyboardShortcuts) {
            // Only hydrate if Convex has values
            Object.entries(userSettings.keyboardShortcuts).forEach(([key, value]) => {
                if (typeof value === "string") {
                    keyboardShortcuts.setShortcut(key as keyof KeyboardShortcuts, value);
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userSettings]);

    // Create a working copy of shortcuts that filters out function properties
    const shortcutEntries = Object.entries(keyboardShortcuts).filter(
        ([key, value]) => typeof value === "string" && !key.startsWith("set") && !key.startsWith("reset"),
    ) as [keyof KeyboardShortcuts, string][];

    const validateShortcut = (key: string, value: string): string | undefined => {
        if (!value.trim()) {
            return t`Shortcut cannot be empty`;
        }

        // Check for conflicts with existing shortcuts
        const existingShortcuts = Object.fromEntries(shortcutEntries);
        const conflictingKey = Object.entries(existingShortcuts).find(([k, v]) => k !== key && v === value);

        if (conflictingKey) {
            return t`Conflicts with ${conflictingKey[0]} shortcut`;
        }

        return undefined;
    };

    const handleShortcutChange = (key: keyof KeyboardShortcuts, value: string) => {
        const error = validateShortcut(key, value);

        setErrors((previous) => {
            return {
                ...previous,
                [key]: error || "",
            };
        });

        if (!error) {
            keyboardShortcuts.setShortcut(key, value);
            setHasChanges(true);
            // Update Convex user settings
            updateUserSettings({ keyboardShortcuts: { ...userSettings?.keyboardShortcuts, [key]: value } });
        }
    };

    const handleResetAll = useCallback(() => {
        keyboardShortcuts.resetKeyboardShortcuts();
        setErrors({});
        setHasChanges(false);
        // Reset Convex user settings to defaults
        updateUserSettings({ keyboardShortcuts: defaultShortcuts });
    }, [keyboardShortcuts, updateUserSettings]);

    const shortcutGroups = [
        {
            shortcuts: [
                { description: t`Navigate to first item in lists`, key: "firstItem" as const, label: t`First Item` },
                { description: t`Navigate to last item in lists`, key: "lastItem" as const, label: t`Last Item` },
                { description: t`Navigate to next item`, key: "nextItem" as const, label: t`Next Item` },
                { description: t`Navigate to previous item`, key: "prevItem" as const, label: t`Previous Item` },
            ],
            title: t`Navigation`,
        },
        {
            shortcuts: [
                { description: t`Toggle left sidebar`, key: "sidebarLeft" as const, label: t`Left Sidebar` },
                { description: t`Toggle right sidebar`, key: "sidebarRight" as const, label: t`Right Sidebar` },
            ],
            title: t`Sidebar`,
        },
        {
            shortcuts: [
                { description: t`Open global search`, key: "search" as const, label: t`Search` },
                { description: t`Focus search input`, key: "focusSearch" as const, label: t`Focus Search` },
                { description: t`Start new chat`, key: "newChat" as const, label: t`New Chat` },
                { description: t`Show help`, key: "help" as const, label: t`Help` },
                { description: t`Cancel action or close dialog`, key: "escape" as const, label: t`Escape` },
            ],
            title: t`Actions`,
        },
    ];

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Keyboard className="size-5" />
                        <CardTitle>{t`Keyboard Shortcuts`}</CardTitle>
                    </div>
                    <Button onClick={handleResetAll} size="sm" variant="outline">
                        <RotateCcw className="mr-1 size-4" />
                        {t`Reset All`}
                    </Button>
                </div>
                <CardDescription>
                    {t`Customize keyboard shortcuts for quick navigation and actions. Click on any input field and press the desired key combination.`}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {hasChanges && (
                    <Alert>
                        <Info className="size-4" />
                        <AlertDescription>{t`Changes are saved automatically. Refresh the page to see all shortcuts take effect.`}</AlertDescription>
                    </Alert>
                )}

                {shortcutGroups.map((group, index) => (
                    <div key={group.title}>
                        <h3 className="text-foreground mb-3 text-sm font-semibold">{group.title}</h3>
                        <div className="space-y-4">
                            {group.shortcuts.map((shortcut) => {
                                const currentValue = keyboardShortcuts[shortcut.key];
                                const stringValue = typeof currentValue === "string" ? currentValue : "";

                                return (
                                    <ShortcutInput
                                        description={shortcut.description}
                                        error={errors[shortcut.key]}
                                        key={shortcut.key}
                                        label={shortcut.label}
                                        onChange={(value) => handleShortcutChange(shortcut.key, value)}
                                        shortcutKey={shortcut.key}
                                        value={stringValue}
                                    />
                                );
                            })}
                        </div>
                        {index < shortcutGroups.length - 1 && <Separator className="mt-6" />}
                    </div>
                ))}

                <div className="bg-muted rounded-md p-4">
                    <h4 className="mb-2 text-sm font-medium">{t`Tips:`}</h4>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                        <li>
                            •
                            {t`Use Ctrl/Cmd + key for system-wide shortcuts`}
                        </li>
                        <li>
                            •
                            {t`Combine modifiers: Ctrl+Shift+Key`}
                        </li>
                        <li>
                            •
                            {t`Some shortcuts may conflict with browser shortcuts`}
                        </li>
                        <li>
                            •
                            {t`Press Escape to cancel recording a shortcut`}
                        </li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};

export default KeyboardShortcutsSettings;
