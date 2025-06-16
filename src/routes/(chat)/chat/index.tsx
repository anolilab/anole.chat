import { Assistant } from "@/features/chat/components/assistant";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(chat)/chat/")({
    component: Assistant,
});
