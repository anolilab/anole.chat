import { Button } from "@anole/ui/components/button";
import { useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import type { FC } from "react";

const AccessDenied: FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
            <span className="rounded-full bg-red-100 p-4 text-red-500">
                <Lock className="h-10 w-10" />
            </span>
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground max-w-md">
                You do not have permission to view this chat or thread. If you believe this is a mistake, please contact the workspace administrator or try a
                different account.
            </p>
            <Button className="mt-2" onClick={() => navigate({ to: "/chat" })}>
                Back to Chat Home
            </Button>
        </div>
    );
};

export default AccessDenied;
