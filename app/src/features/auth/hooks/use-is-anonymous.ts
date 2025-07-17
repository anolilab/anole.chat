import { useAuth } from "@/features/auth/lib/auth-ui-provider";

export function useIsAnonymous() {
    const { hooks } = useAuth();
    const { data: sessionData } = hooks.useSession();

    const user = sessionData?.user;
    const isAnonymous = user?.isAnonymous ?? false;

    return {
        isAnonymous,
        user,
        sessionData,
    };
}