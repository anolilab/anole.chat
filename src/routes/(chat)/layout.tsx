import { AuthProvider } from "@/components/auth/auth-provider";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AiModelProvider } from "@/routes/(chat)/-provider/ai-model-provider";

export const Route = createFileRoute("/(chat)")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <AuthProvider>
            <AiModelProvider>
                <Outlet />
            </AiModelProvider>
        </AuthProvider>
    );
}
