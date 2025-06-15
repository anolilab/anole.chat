import { AuthProvider } from "@/features/auth/components/auth-provider";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AiModelProvider } from "@/features/chat/providers/ai-model-provider";

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
