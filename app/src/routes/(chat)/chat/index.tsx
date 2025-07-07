import { Assistant } from "@/features/chat/components/assistant";
import { createFileRoute, redirect, useRouteContext } from "@tanstack/react-router";

const ChatPage = () => {
    const context = useRouteContext({ from: "/(chat)/chat/" });

    return <Assistant jwtToken={context.token as string} />;
};

export const Route = createFileRoute("/(chat)/chat/")({
    beforeLoad: ({ context }) => {
        if (!context.userId) {
            throw redirect({ to: "/auth/sign-in" });
        }
    },
    component: ChatPage,
});
