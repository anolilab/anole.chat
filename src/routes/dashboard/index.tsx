import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/dashboard/")({
    component: RouteComponent,
});

function RouteComponent() {
    return <div className="flex w-full flex-col items-center justify-center"></div>;
}
