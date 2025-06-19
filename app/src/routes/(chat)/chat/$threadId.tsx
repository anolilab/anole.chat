import { redirect, createFileRoute, useRouteContext } from "@tanstack/react-router";
import { api } from "@cvx/_generated/api";
import { DEFAULT_MODEL } from "@cvx/ai/lib/agents";
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
        if (!context.userId) {
            throw redirect({ to: "/login" });
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
    },
    component: ChatPage,
});
