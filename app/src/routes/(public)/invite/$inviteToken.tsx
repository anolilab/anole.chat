import { api } from "@anole/convex/api";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const InvitePage = () => {
    const { inviteToken } = Route.useParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState<string>("");

    const acceptInvite = useMutation(api.chat.sharing.acceptThreadInvite);

    const handleAcceptInvite = async () => {
        try {
            const result = await acceptInvite({ inviteToken });

            setStatus("success");
            // Redirect to the thread after a short delay
            setTimeout(() => {
                globalThis.location.href = `/chat/${result.threadId}`;
            }, 2000);
        } catch (error) {
            setStatus("error");
            setErrorMessage(error instanceof Error ? error.message : "Failed to accept invite");
        }
    };

    return (
        <div className="bg-background flex min-h-screen items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {status === "loading" && "Thread Invite"}
                        {status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
                        {status === "success" && "Invite Accepted!"}
                        {status === "error" && "Invite Error"}
                    </CardTitle>
                    <CardDescription>
                        {status === "loading" && "You've been invited to join a thread. Click the button below to accept."}
                        {status === "success" && "You've successfully joined the thread. Redirecting..."}
                        {status === "error" && errorMessage}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {status === "loading" && (
                        <Button className="w-full" onClick={handleAcceptInvite}>
                            Accept Invite
                        </Button>
                    )}
                    {status === "success" && <div className="text-muted-foreground text-center text-sm">Redirecting to the thread...</div>}
                    {status === "error" && (
                        <Button className="w-full" onClick={() => (globalThis.location.href = "/chat")} variant="outline">
                            Go to Chat
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export const Route = createFileRoute("/(public)/invite/$inviteToken")({
    beforeLoad: async ({ context, params }) => {
        // Check if user is authenticated
        if (!context?.user?.id) {
            throw redirect({ to: "/auth/sign-in" });
        }
    },
    component: InvitePage,
});
