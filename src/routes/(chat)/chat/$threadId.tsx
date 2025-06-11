import { Assistant } from "@/routes/(chat)/-components/assistant";
import { redirect } from "@tanstack/react-router";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { getServerSession } from "@/lib/auth/client";

export const Route = createFileRoute({
    beforeLoad: async ({ context, params }) => {

        if (params.threadId === "new") {
            const session = await getServerSession();

            if (!session) {
                throw redirect({
                    to: "/login",
                    replace: true,
                });
            }

            const newThreadId = await context.convex.mutation(api.chat.createThread, {
                model: "gpt-4o-mini",
                sessionToken: session.session.token,
            });

            throw redirect({
                to: "/chat/$threadId",
                params: { threadId: newThreadId },
                replace: true,
            });
        }
    },
    component: ChatPage,
});

function ChatPage() {
    const { threadId } = Route.useParams();

    return <Assistant threadId={threadId as Id<"threads">} />;
}
