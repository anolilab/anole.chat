import { Assistant } from "@/components/chat/assistant";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";

const ChatPage = () => {
    const { threadId } = Route.useParams();
    const navigate = useNavigate();
    const createThread = useMutation(api.chat.start);

    useEffect(() => {
        if (threadId === "new") {
            const createAndNavigate = async () => {
                try {
                    const newThreadId = await createThread({
                        model: "gpt-4o-mini",
                    });

                    await navigate({
                        params: { threadId: newThreadId },
                        replace: true,
                    } as any);

                } catch (error) {
                    console.error("Failed to create new thread", error);
                    // Handle error, maybe navigate to an error page or show a toast
                    await navigate({ to: "/", replace: true });
                }
            };

            void createAndNavigate();
        }
    }, [threadId, createThread, navigate]);

    if (threadId === "new") {
        return <div>Creating new chat...</div>;
    }

    return <Assistant />;
};

export const Route = createFileRoute({
    component: ChatPage,
});
