import { useCallback, useState } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { getLocalizedError } from "@/features/auth/lib/utils";

export interface UseAnonymousAuthOptions {
    onSuccess?: () => void | Promise<void>;
    onError?: (error: unknown) => void;
}

export function useAnonymousAuth(options?: UseAnonymousAuthOptions) {
    const { authClient, toast } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const signInAnonymously = useCallback(async () => {
        try {
            setIsLoading(true);
            
            await authClient.signIn.anonymous({
                throw: true,
            });

            await options?.onSuccess?.();
        } catch (error) {
            const errorMessage = getLocalizedError({ error });
            
            toast({
                message: errorMessage,
                variant: "error",
            });

            options?.onError?.(error);
        } finally {
            setIsLoading(false);
        }
    }, [authClient, options, toast]);

    return {
        signInAnonymously,
        isLoading,
    };
}