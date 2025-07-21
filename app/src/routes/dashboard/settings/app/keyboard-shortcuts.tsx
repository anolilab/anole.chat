import { createFileRoute } from "@tanstack/react-router";

import KeyboardShortcutsSettings from "@/features/keyboard/components/keyboard-shortcuts-settings";

export const Route = createFileRoute("/dashboard/settings/app/keyboard-shortcuts")({
    component: KeyboardShortcutsSettings,
});
