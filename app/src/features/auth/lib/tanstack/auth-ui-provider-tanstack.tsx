import { useCallback, useMemo } from "react";

import type { AuthUIProviderProps as AuthUIProviderProperties } from "../auth-ui-provider";
import { AuthUIProvider } from "../auth-ui-provider";
import { useTanstackOptions } from "./use-tanstack-options";

export const AuthUIProviderTanstack = ({
    authClient,
    children,
    hooks: hooksProperty,
    mutators: mutatorsProperty,
    onSessionChange: onSessionChangeProperty,
    ...properties
}: AuthUIProviderProperties) => {
    const { hooks: contextHooks, mutators: contextMutators, onSessionChange, optimistic } = useTanstackOptions({ authClient });

    const hooks = useMemo(() => {
        return { ...contextHooks, ...hooksProperty };
    }, [contextHooks, hooksProperty]);
    const mutators = useMemo(() => {
        return { ...contextMutators, ...mutatorsProperty };
    }, [contextMutators, mutatorsProperty]);

    const onSessionChangeCallback = useCallback(async () => {
        await onSessionChange();
        await onSessionChangeProperty?.();
    }, [onSessionChangeProperty, onSessionChange]);

    return (
        <AuthUIProvider
            authClient={authClient}
            hooks={hooks}
            mutators={mutators}
            onSessionChange={onSessionChangeCallback}
            optimistic={optimistic}
            {...properties}
        >
            {children}
        </AuthUIProvider>
    );
};
