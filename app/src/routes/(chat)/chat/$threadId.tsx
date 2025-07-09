import { redirect, createFileRoute, useRouteContext } from "@tanstack/react-router";
import { api } from "@convex/_generated/api";
import { DEFAULT_MODEL } from "@convex/ai/lib/agents";
import { Assistant } from "@/features/chat/components/assistant";

const ChatPage = () => {
    const context = useRouteContext({ from: "/(chat)/chat/$threadId" });
    const { threadId } = Route.useParams();

    return <Assistant threadId={threadId} jwtToken={context.token as string} />;
};

export const Route = createFileRoute("/(chat)/chat/$threadId")({
    validateSearch: (search: Record<string, unknown>) => {
        return {
            initialMessage: search.initialMessage as string | undefined,
        };
    },
    beforeLoad: async ({ context, params }) => {
        if (!context?.user?.id) {
            throw redirect({ to: "/auth/sign-in" });
        }

        if (params.threadId === "new") {
            const newThreadId = await context.convexClient.mutation(api.chat.functions.createThread, {
                model: DEFAULT_MODEL,
            });

            throw redirect({
                to: "/chat/$threadId",
                params: { threadId: newThreadId },
                search: { initialMessage: undefined },
                replace: true,
            });
        }

        const threadExists = await context.convexClient.query(api.chat.functions.validateThreadExists, {
            threadId: params.threadId,
        });

        if (!threadExists) {
            throw redirect({
                to: "/chat",
                search: { redirectReason: "thread-not-found" },
                replace: true,
            });
        }

        // Save the last chat ID for this user
        try {
            await context.convexClient.mutation(api.auth.functions.updateUserSettings, {
                lastChatId: params.threadId,
            });
        } catch (error) {
            // Continue loading even if saving last chat ID fails
            console.warn("Failed to save last chat ID:", error);
        }
    },
    component: ChatPage,
});
