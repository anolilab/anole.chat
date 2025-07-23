import { createFileRoute, useRouteContext } from "@tanstack/react-router";

import RouteErrorBoundary from "@/components/error-boundaries/route-error-boundary";
import Assistant from "@/features/chat/components/assistant";

const ChatPage = () => {
    const route = "/(chat)/chat/";
    const context = useRouteContext({ from: route });

    return (
        <RouteErrorBoundary routeName={route}>
            <Assistant jwtToken={context.token as string} />
        </RouteErrorBoundary>
    );
};

export const Route = createFileRoute("/(chat)/chat/")({
    component: ChatPage,
});
