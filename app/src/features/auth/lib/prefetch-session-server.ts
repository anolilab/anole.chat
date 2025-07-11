import type { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

import type { BetterAuth } from "../types/auth-core-types";

type GetSessionParameters = Parameters<BetterAuth["api"]["getSession"]>[0];

const getSession = cache(async <TAuth extends BetterAuth>(auth: TAuth, parameters: GetSessionParameters) => {
    type SessionData = TAuth["$Infer"]["Session"] | null;

    return (await auth.api.getSession(parameters)) as SessionData;
});

export async function prefetchSession<TAuth extends BetterAuth>(auth: TAuth, queryClient: QueryClient, parameters: GetSessionParameters, queryKey = ["session"]) {
    type SessionData = TAuth["$Infer"]["Session"] | null;
    type User = TAuth["$Infer"]["Session"]["user"];
    type Session = TAuth["$Infer"]["Session"]["session"];

    const queryFunction = async () => (await getSession(auth, parameters)) as SessionData;

    await queryClient.prefetchQuery({ queryFn: queryFunction, queryKey });

    const data = await queryFunction();

    return {
        data,
        session: data?.session as Session | undefined,
        user: data?.user as User | undefined,
    };
}
