import { useSession } from "@/hooks/auth-hooks";

import { useLocation, useRouter } from "@tanstack/react-router";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const isAuthRoute = (path: string) => {
    return ["/login", "/register"].includes(path);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: session, isPending } = useSession();
    const location = useLocation();
    const router = useRouter();

    useEffect(() => {
        if (!session?.user && !isPending) {
            if (!isAuthRoute(location.pathname)) {
                router.navigate({ to: "/login" });
            }
        }
    }, [session, router, isPending]);

    if (isPending && !session) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    if (!session?.user && !isPending) {
        return null;
    }

    return children;
};
