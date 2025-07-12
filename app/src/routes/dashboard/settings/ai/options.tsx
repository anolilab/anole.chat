import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings/ai/options")({
    component: RouteComponent,
});

const RouteComponent = () => <div>Hello "/dashboard/settings/ai/ai-options"!</div>;
