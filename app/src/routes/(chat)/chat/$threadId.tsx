import { DEFAULT_MODEL } from "@anole/convex/ai/lib/agents";
import { api } from "@anole/convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, redirect, useRouteContext, ClientOnly } from "@tanstack/react-router";

import Assistant from "@/features/chat/components/assistant";

const ChatPage = () => {
    const context = useRouteContext({ from: "/(chat)/chat/$threadId" });
    const { threadId } = Route.useParams();

    return (
        <ClientOnly>
            <Assistant jwtToken={context.token as string} threadId={threadId} />
        </ClientOnly>
    );
};

export const Route = createFileRoute("/(chat)/chat/$threadId")({
    beforeLoad: async ({ context, params }) => {
        // Allow anonymous users to access chat
        if (context?.user?.id) {
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

            const threadExists = await context.queryClient.fetchQuery(
                convexQuery(api.chat.functions.validateThreadExists, {
                    threadId: params.threadId,
                }),
            );

            if (!threadExists) {
                throw redirect({
                    to: "/chat",
                    search: { redirectReason: "thread-not-found" },
                    replace: true,
                });
            }

            // Save the last chat ID for this user
            try {
                await context.queryClient.setQueryData([api.auth.functions.updateUserSettings], {
                    lastChatId: params.threadId,
                });
            } catch (error) {
                // Continue loading even if saving last chat ID fails
                console.warn("Failed to save last chat ID:", error);
            }
        }
    },
    component: ChatPage,
    ssr: false,
    validateSearch: (search: Record<string, unknown>) => {
        return {
            initialMessage: search.initialMessage as string | undefined,
        };
    },
});
