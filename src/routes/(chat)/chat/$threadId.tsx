import { Assistant } from "@/routes/(chat)/-components/assistant";
import { redirect, createFileRoute } from "@tanstack/react-router";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { getServerSession } from "@/lib/auth/client";

const ChatPage = () => {
    const { threadId } = Route.useParams();

    return <Assistant threadId={threadId as Id<"threads">} />;
};

export const Route = createFileRoute("/(chat)/chat/$threadId")({
    beforeLoad: async ({ context, params }) => {
        if (params.threadId === "new") {
            const session = await getServerSession();

            const newThreadId = await context.convex.mutation(api.chat.createThread, {
                model: "gemini-1.5-flash",
                sessionToken: session?.session?.token,
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
