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

import { DEFAULT_KEYBOARD_SHORTCUTS, useKeyboardShortcuts } from "@/features/keyboard/components/keyboard-shortcuts-manager";

interface ShortcutInputProperties {
    description: string;
    error?: string;
    label: string;
    onChange: (value: string) => void;
    placeholder?: string;
    shortcutKey: keyof typeof DEFAULT_KEYBOARD_SHORTCUTS;
    value: string;
}

const ShortcutInput: FC<ShortcutInputProperties> = ({ description, error, label, onChange, placeholder = "Press keys...", shortcutKey, value }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [temporaryValue, setTemporaryValue] = useState(value);

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
        onChange(DEFAULT_KEYBOARD_SHORTCUTS[shortcutKey] || "");
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div>
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-muted-foreground text-xs">{description}</p>
                </div>
                <Button className="h-6 px-2" onClick={handleReset} size="sm" type="button" variant="ghost">
                    <RotateCcw className="h-3 w-3" />
                </Button>
            </div>
            <Input
                className={cn("font-mono text-sm", error && "border-destructive focus-visible:ring-destructive")}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                readOnly
                value={isRecording ? temporaryValue : value}
            />
            {isRecording && (
                <Badge className="text-xs" variant="secondary">
                    Recording... Press keys
                </Badge>
            )}
            {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
    );
};

const KeyboardShortcutsSettings: FC = () => {
    const { shortcuts, updateShortcuts } = useKeyboardShortcuts();
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [localShortcuts, setLocalShortcuts] = useState(shortcuts);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Check for duplicate shortcuts
    const validateShortcuts = (shortcuts: typeof localShortcuts) => {
        const errors: Record<string, string> = {};
        const shortcutValues = Object.values(shortcuts).filter(Boolean);
        const duplicates = shortcutValues.filter((value, index) => shortcutValues.indexOf(value) !== index);

        if (duplicates.length > 0) {
            const duplicateValue = duplicates[0];

            Object.entries(shortcuts).forEach(([key, value]) => {
                if (value === duplicateValue) {
                    errors[key] = `This shortcut is already used by another action`;
                }
            });
        }

        return errors;
    };

    const handleShortcutChange = (key: keyof typeof shortcuts, value: string) => {
        const newShortcuts = { ...localShortcuts, [key]: value };

        setLocalShortcuts(newShortcuts);
        setHasChanges(true);
        setError(null); // Clear error when user makes changes

        // Validate for duplicates
        const errors = validateShortcuts(newShortcuts);

        setValidationErrors(errors);
    };

    const handleSave = async () => {
        // Check for validation errors before saving
        const errors = validateShortcuts(localShortcuts);

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setError("Please fix the duplicate shortcuts before saving.");

            return;
        }

        setIsSaving(true);
        setError(null); // Clear any previous errors
        setValidationErrors({}); // Clear validation errors

        try {
            await updateShortcuts(localShortcuts);
            setHasChanges(false);
        } catch (error) {
            console.error("Failed to save keyboard shortcuts:", error);
            setError("Failed to save keyboard shortcuts. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetAll = async () => {
        setLocalShortcuts(DEFAULT_KEYBOARD_SHORTCUTS);
        setHasChanges(true);
        setError(null); // Clear error when resetting
        setValidationErrors({}); // Clear validation errors when resetting
    };

    const shortcutConfigs = [
        {
            description: "Open or close the left sidebar panel",
            key: "sidebarLeft" as const,
            label: "Toggle Left Sidebar",
        },
        {
            description: "Open or close the right sidebar panel",
            key: "sidebarRight" as const,
            label: "Toggle Right Sidebar",
        },
        {
            description: "Start a new conversation",
            key: "newChat" as const,
            label: "New Chat",
        },
        {
            description: "Open the search interface",
            key: "search" as const,
            label: "Search",
        },
        {
            description: "Display keyboard shortcuts help",
            key: "help" as const,
            label: "Show Help",
        },
        {
            description: "Close dialogs or cancel actions",
            key: "escape" as const,
            label: "Escape",
        },
    ];

    return (
        <div className="space-y-6">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Click on any input field and press the keys you want to use for that action. You can use combinations like Ctrl+K, Cmd+Shift+N, etc.
                </AlertDescription>
            </Alert>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        Customize Shortcuts
                    </CardTitle>
                    <CardDescription>Set your preferred keyboard shortcuts for common actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {shortcutConfigs.map((config) => (
                            <ShortcutInput
                                description={config.description}
                                error={validationErrors[config.key]}
                                key={config.key}
                                label={config.label}
                                onChange={(value) => handleShortcutChange(config.key, value)}
                                shortcutKey={config.key}
                                value={localShortcuts[config.key] || ""}
                            />
                        ))}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <Button disabled={isSaving} onClick={handleResetAll} variant="outline">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset to Defaults
                        </Button>

                        <Button disabled={!hasChanges || isSaving || Object.keys(validationErrors).length > 0} onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Default Shortcuts</CardTitle>
                    <CardDescription>These are the default keyboard shortcuts for reference</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {Object.entries(DEFAULT_KEYBOARD_SHORTCUTS).map(([key, value]) => (
                            <div className="flex items-center justify-between" key={key}>
                                <span className="text-sm font-medium">{shortcutConfigs.find((c) => c.key === key)?.label || key}</span>
                                <Badge className="font-mono" variant="outline">
                                    {value}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default KeyboardShortcutsSettings;
