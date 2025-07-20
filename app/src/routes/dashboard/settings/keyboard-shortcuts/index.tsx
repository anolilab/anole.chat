import { createFileRoute } from "@tanstack/react-router";
import { KeyboardShortcutsSettings } from "./keyboard-shortcuts";

export const Route = createFileRoute("/dashboard/settings/keyboard-shortcuts/")({
    component: KeyboardShortcutsSettings,
});