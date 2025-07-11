import { useSearch } from "@tanstack/react-router";
import { useCallback, useContext, useEffect, useState, useTransition } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

export function useOnSuccessTransition({ redirectTo: redirectToProperty }: { redirectTo?: string }) {
    const { redirectTo: contextRedirectTo } = useAuth();
    const search = useSearch({ strict: false }) as any;

    const getRedirectTo = useCallback(() => redirectToProperty || search?.redirectTo || contextRedirectTo, [redirectToProperty, search?.redirectTo, contextRedirectTo]);

    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);

    const {
        hooks: { useSession },
        navigate,
        onSessionChange,
    } = useAuth();

    const { refetch: refetchSession } = useSession();

    useEffect(() => {
        if (!success || isPending)
            return;

        startTransition(() => {
            navigate(getRedirectTo());
        });
    }, [success, isPending, navigate, getRedirectTo]);

    const onSuccess = useCallback(async () => {
        await refetchSession?.();
        setSuccess(true);

        if (onSessionChange)
            startTransition(onSessionChange);
    }, [refetchSession, onSessionChange]);

    return { isPending, onSuccess };
}
