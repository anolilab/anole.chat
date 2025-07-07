import { type Query, type QueryKey, useQueryClient } from "@tanstack/react-query"
import { useContext } from "react"
import { AuthQueryContext } from "../../lib/auth-query-provider"

export const useOnMutateError = () => {
    const queryClient = useQueryClient()
    const { optimistic } = useContext(AuthQueryContext)

    const onMutateError = (
        error: Error,
        queryKey: QueryKey,
        context?: { previousData?: unknown }
    ) => {
        if (error) {
            console.error(error)
            queryClient
                .getQueryCache()
                .config.onError?.(error, { queryKey } as unknown as Query<unknown, unknown>)
        }

        if (!optimistic || !context?.previousData) return
        queryClient.setQueryData(queryKey, context.previousData)
    }

    return { onMutateError }
}
