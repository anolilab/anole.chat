import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import type { AuthClient } from "@/lib/auth/client";

type Session = TAuthClient["$Infer"]["Session"]["session"];
type User = TAuthClient["$Infer"]["Session"]["user"];

const useIsAnonymous: () => {
    isAnonymous: boolean;
    sessionData: Session;
    user: User;
} = () => {
    const { hooks } = useAuth();
    const { data: sessionData } = hooks.useSession();

    const user = sessionData?.user;
    const isAnonymous = user?.isAnonymous ?? false;

    return {
        isAnonymous,
        sessionData,
        user,
    };
};

export default useIsAnonymous;
