import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings/ai/models")({
    component: RouteComponent,
});

const RouteComponent = () => <div>Hello "/dashboard/settings/ai/models"!</div>;
