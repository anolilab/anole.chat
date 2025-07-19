import React, { useState } from "react";
import { useTranslation } from "@anole/ui/hooks/use-translation";
import { Button } from "@anole/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@anole/ui/components/card";
import { Input } from "@anole/ui/components/input";
import { Label } from "@anole/ui/components/label";
import { Separator } from "@anole/ui/components/separator";
import { Badge } from "@anole/ui/components/badge";
import { Alert, AlertDescription } from "@anole/ui/components/alert";
import { Info, Keyboard, RotateCcw, Save } from "lucide-react";
import { useKeyboardShortcuts, DEFAULT_KEYBOARD_SHORTCUTS } from "../../../../components/keyboard-shortcuts-manager";

interface ShortcutInputProps {
    label: string;
    description: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const ShortcutInput: React.FC<ShortcutInputProps> = ({
    label,
    description,
    value,
    onChange,
    placeholder = "Press keys...",
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (!isRecording) return;

        event.preventDefault();
        
        const modifiers = [];
        if (event.ctrlKey) modifiers.push("Ctrl");
        if (event.metaKey) modifiers.push("Cmd");
        if (event.shiftKey) modifiers.push("Shift");
        if (event.altKey) modifiers.push("Alt");
        
        const key = event.key === " " ? "Space" : event.key;
        if (!modifiers.includes(key)) {
            modifiers.push(key);
        }
        
        const shortcut = modifiers.join("+");
        setTempValue(shortcut);
    };

    const handleFocus = () => {
        setIsRecording(true);
        setTempValue(value);
    };

    const handleBlur = () => {
        setIsRecording(false);
        if (tempValue !== value) {
            onChange(tempValue);
        }
    };

    const handleReset = () => {
        onChange(DEFAULT_KEYBOARD_SHORTCUTS[label as keyof typeof DEFAULT_KEYBOARD_SHORTCUTS] || "");
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div>
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-6 px-2"
                >
                    <RotateCcw className="h-3 w-3" />
                </Button>
            </div>
            <Input
                value={isRecording ? tempValue : value}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                className="font-mono text-sm"
                readOnly
            />
            {isRecording && (
                <Badge variant="secondary" className="text-xs">
                    Recording... Press keys
                </Badge>
            )}
        </div>
    );
};

export const KeyboardShortcutsSettings: React.FC = () => {
    const { t } = useTranslation();
    const { shortcuts, updateShortcuts } = useKeyboardShortcuts();
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [localShortcuts, setLocalShortcuts] = useState(shortcuts);

    const handleShortcutChange = (key: keyof typeof shortcuts, value: string) => {
        setLocalShortcuts(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateShortcuts(localShortcuts);
            setHasChanges(false);
        } catch (error) {
            console.error("Failed to save keyboard shortcuts:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetAll = async () => {
        setLocalShortcuts(DEFAULT_KEYBOARD_SHORTCUTS);
        setHasChanges(true);
    };

    const shortcutConfigs = [
        {
            key: "sidebarLeft" as const,
            label: "Toggle Left Sidebar",
            description: "Open or close the left sidebar panel",
        },
        {
            key: "sidebarRight" as const,
            label: "Toggle Right Sidebar", 
            description: "Open or close the right sidebar panel",
        },
        {
            key: "newChat" as const,
            label: "New Chat",
            description: "Start a new conversation",
        },
        {
            key: "search" as const,
            label: "Search",
            description: "Open the search interface",
        },
        {
            key: "help" as const,
            label: "Show Help",
            description: "Display keyboard shortcuts help",
        },
        {
            key: "escape" as const,
            label: "Escape",
            description: "Close dialogs or cancel actions",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Keyboard Shortcuts</h2>
                <p className="text-muted-foreground">
                    Customize your keyboard shortcuts for a personalized experience.
                </p>
            </div>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Click on any input field and press the keys you want to use for that action. 
                    You can use combinations like Ctrl+K, Cmd+Shift+N, etc.
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        Customize Shortcuts
                    </CardTitle>
                    <CardDescription>
                        Set your preferred keyboard shortcuts for common actions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {shortcutConfigs.map((config) => (
                            <ShortcutInput
                                key={config.key}
                                label={config.label}
                                description={config.description}
                                value={localShortcuts[config.key] || ""}
                                onChange={(value) => handleShortcutChange(config.key, value)}
                            />
                        ))}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={handleResetAll}
                            disabled={isSaving}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset to Defaults
                        </Button>

                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Default Shortcuts</CardTitle>
                    <CardDescription>
                        These are the default keyboard shortcuts for reference
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {Object.entries(DEFAULT_KEYBOARD_SHORTCUTS).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    {shortcutConfigs.find(c => c.key === key)?.label || key}
                                </span>
                                <Badge variant="outline" className="font-mono">
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