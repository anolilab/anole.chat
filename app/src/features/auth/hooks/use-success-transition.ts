import { useCallback, useContext, useEffect, useState, useTransition } from "react";
import { useSearch } from "@tanstack/react-router";
import { AuthUIContext } from "../lib/auth-ui-provider";

export function useOnSuccessTransition({ redirectTo: redirectToProp }: { redirectTo?: string }) {
    const { redirectTo: contextRedirectTo } = useContext(AuthUIContext);
    const search = useSearch({ strict: false }) as any;

    const getRedirectTo = useCallback(() => redirectToProp || search?.redirectTo || contextRedirectTo, [redirectToProp, search?.redirectTo, contextRedirectTo]);

    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);

    const {
        navigate,
        hooks: { useSession },
        onSessionChange,
    } = useContext(AuthUIContext);

    const { refetch: refetchSession } = useSession();

    useEffect(() => {
        if (!success || isPending) return;

        startTransition(() => {
            navigate(getRedirectTo());
        });
    }, [success, isPending, navigate, getRedirectTo]);

    const onSuccess = useCallback(async () => {
        await refetchSession?.();
        setSuccess(true);

        if (onSessionChange) startTransition(onSessionChange);
    }, [refetchSession, onSessionChange]);

    return { onSuccess, isPending };
}
