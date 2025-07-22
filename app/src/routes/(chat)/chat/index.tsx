import { createFileRoute, useRouteContext } from "@tanstack/react-router";

import Assistant from "@/features/chat/components/assistant";

const ChatPage = () => {
    const context = useRouteContext({ from: "/(chat)/chat/" });

    return <Assistant jwtToken={context.token as string} />;
};

export const Route = createFileRoute("/(chat)/chat/")({
    component: ChatPage,
});
