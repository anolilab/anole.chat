import { Alert, AlertDescription } from "@anole/ui/components/alert";
import { Badge } from "@anole/ui/components/badge";
import { Button } from "@anole/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@anole/ui/components/card";
import { Input } from "@anole/ui/components/input";
import { Label } from "@anole/ui/components/label";
import { Separator } from "@anole/ui/components/separator";
import cn from "@anole/ui/utils/cn";
import { AlertCircle, Info, Keyboard, RotateCcw, Save } from "lucide-react";
import type { FC, KeyboardEvent } from "react";
import { useState } from "react";

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

const ShortcutInput: FC<ShortcutInputProperties> = ({ description, error, label, onChange, placeholder = "Press keys...", shortcutKey, value }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [temporaryValue, setTemporaryValue] = useState(value);
    const keyboardShortcuts = useKeyboardShortcuts();

    const handleKeyDown = (event: KeyboardEvent) => {
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
    };

    const handleFocus = () => {
        setIsRecording(true);
        setTemporaryValue(value);
    };

    const handleBlur = () => {
        setIsRecording(false);

        if (temporaryValue !== value) {
            onChange(temporaryValue);
        }
    };

    const handleReset = () => {
        // Reset individual shortcut to its default value
        const defaultShortcuts = {
            escape: "Escape",
            firstItem: "Home",
            focusSearch: "Ctrl+F",
            help: "Ctrl+/",
            lastItem: "End",
            newChat: "Ctrl+N",
            nextItem: "ArrowDown",
            prevItem: "ArrowUp",
            search: "Ctrl+K",
            sidebarLeft: "Ctrl+B",
            sidebarRight: "Ctrl+Shift+B",
        };

        const defaultValue = defaultShortcuts[shortcutKey as keyof typeof defaultShortcuts] || "";

        keyboardShortcuts.setShortcut(shortcutKey, defaultValue);
        onChange(defaultValue);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium" htmlFor={shortcutKey}>
                    {label}
                </Label>
                <Button onClick={handleReset} size="sm" type="button" variant="ghost">
                    <RotateCcw className="mr-1 size-3" />
                    Reset
                </Button>
            </div>

            <div className="relative">
                <Input
                    className={cn("font-mono text-sm", isRecording && "ring-2 ring-blue-500", error && "border-red-500 focus:ring-red-500")}
                    id={shortcutKey}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    placeholder={isRecording ? "Press keys..." : placeholder}
                    readOnly
                    value={isRecording ? temporaryValue : value}
                />
                {isRecording && <div className="absolute -top-2 right-2 rounded bg-blue-500 px-1 py-0.5 text-xs text-white">Recording</div>}
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

    // Create a working copy of shortcuts that filters out function properties
    const shortcutEntries = Object.entries(keyboardShortcuts).filter(
        ([key, value]) => typeof value === "string" && !key.startsWith("set") && !key.startsWith("reset"),
    ) as [keyof KeyboardShortcuts, string][];

    const validateShortcut = (key: string, value: string): string | undefined => {
        if (!value.trim()) {
            return "Shortcut cannot be empty";
        }

        // Check for conflicts with existing shortcuts
        const existingShortcuts = Object.fromEntries(shortcutEntries);
        const conflictingKey = Object.entries(existingShortcuts).find(([k, v]) => k !== key && v === value);

        if (conflictingKey) {
            return `Conflicts with ${conflictingKey[0]} shortcut`;
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
        }
    };

    const handleResetAll = () => {
        keyboardShortcuts.resetKeyboardShortcuts();
        setErrors({});
        setHasChanges(false);
    };

    const shortcutGroups = [
        {
            shortcuts: [
                { description: "Navigate to first item in lists", key: "firstItem" as const, label: "First Item" },
                { description: "Navigate to last item in lists", key: "lastItem" as const, label: "Last Item" },
                { description: "Navigate to next item", key: "nextItem" as const, label: "Next Item" },
                { description: "Navigate to previous item", key: "prevItem" as const, label: "Previous Item" },
            ],
            title: "Navigation",
        },
        {
            shortcuts: [
                { description: "Toggle left sidebar", key: "sidebarLeft" as const, label: "Left Sidebar" },
                { description: "Toggle right sidebar", key: "sidebarRight" as const, label: "Right Sidebar" },
            ],
            title: "Sidebar",
        },
        {
            shortcuts: [
                { description: "Open global search", key: "search" as const, label: "Search" },
                { description: "Focus search input", key: "focusSearch" as const, label: "Focus Search" },
                { description: "Start new chat", key: "newChat" as const, label: "New Chat" },
                { description: "Show help", key: "help" as const, label: "Help" },
                { description: "Cancel action or close dialog", key: "escape" as const, label: "Escape" },
            ],
            title: "Actions",
        },
    ];

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Keyboard className="size-5" />
                        <CardTitle>Keyboard Shortcuts</CardTitle>
                    </div>
                    <Button onClick={handleResetAll} size="sm" variant="outline">
                        <RotateCcw className="mr-1 size-4" />
                        Reset All
                    </Button>
                </div>
                <CardDescription>
                    Customize keyboard shortcuts for quick navigation and actions. Click on any input field and press the desired key combination.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {hasChanges && (
                    <Alert>
                        <Info className="size-4" />
                        <AlertDescription>Changes are saved automatically. Refresh the page to see all shortcuts take effect.</AlertDescription>
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
                    <h4 className="mb-2 text-sm font-medium">Tips:</h4>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                        <li>• Use Ctrl/Cmd + key for system-wide shortcuts</li>
                        <li>• Combine modifiers: Ctrl+Shift+Key</li>
                        <li>• Some shortcuts may conflict with browser shortcuts</li>
                        <li>• Press Escape to cancel recording a shortcut</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};

export default KeyboardShortcutsSettings;
