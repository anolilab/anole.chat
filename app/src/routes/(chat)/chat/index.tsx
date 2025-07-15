import { createFileRoute, redirect, useRouteContext } from "@tanstack/react-router";

import Assistant from "@/features/chat/components/assistant";

const ChatPage = () => {
    const context = useRouteContext({ from: "/(chat)/chat/" });

    return <Assistant jwtToken={context.token as string} />;
};

export const Route = createFileRoute("/(chat)/chat/")({
    beforeLoad: ({ context }) => {
        if (!context?.user?.id) {
            throw redirect({ to: "/auth/sign-in" });
        }
    },
    component: ChatPage,
});
