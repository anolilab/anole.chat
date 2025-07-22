import { createFileRoute, useRouteContext, ClientOnly } from "@tanstack/react-router";

import Assistant from "@/features/chat/components/assistant";

const ChatPage = () => {
    const context = useRouteContext({ from: "/(chat)/chat/" });

    return (
        <ClientOnly>
            <Assistant jwtToken={context.token as string} />
        </ClientOnly>
    );
};

export const Route = createFileRoute("/(chat)/chat/")({
    component: ChatPage,
    ssr: false,
});
