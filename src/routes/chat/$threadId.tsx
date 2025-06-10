import { Assistant } from "@/components/chat/assistant";
import { redirect } from "@tanstack/react-router";
import { api } from "../../../convex/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";

export const Route = createFileRoute({
    beforeLoad: async ({ context, params }) => {
        if (params.threadId === "new") {
            const newThreadId = await context.convex.mutation(api.chat.createThread, {
                model: "gpt-4o-mini",
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
