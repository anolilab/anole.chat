import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query"
import type { BetterFetchOption } from "better-auth/react"
import { useContext } from "react"
import type { AuthQueryOptions, NonThrowableResult, ThrowableResult } from "../.."
import { AuthQueryContext } from "../../lib/auth-query-provider"
import { useOnMutateError } from "./use-mutate-error"

type AuthMutationFn<TParams> = (params: TParams) => Promise<ThrowableResult | NonThrowableResult>

export function useAuthMutation<
    // biome-ignore lint/suspicious/noExplicitAny:
    TAuthFn extends AuthMutationFn<any>
>({
    queryKey,
    mutationFn,
    optimisticData,
    options
}: {
    queryKey: QueryKey
    mutationFn: TAuthFn
    optimisticData?(
        params: Omit<Parameters<TAuthFn>[0], "fetchOptions">,
        previousData: unknown
    ): unknown
    options?: Partial<AuthQueryOptions>
}) {
    type TParams = Parameters<TAuthFn>[0]
    const queryClient = useQueryClient()
    const context = useContext(AuthQueryContext)
    const { optimistic } = { ...context, ...options }
    const { onMutateError } = useOnMutateError()

    const mutation = useMutation({
        mutationFn: ({ fetchOptions = { throw: true }, ...params }: TParams) =>
            mutationFn({ fetchOptions, ...params }),
        onMutate: async (params: TParams) => {
            if (!optimistic || !optimisticData) return
            await queryClient.cancelQueries({ queryKey })

            const previousData = queryClient.getQueryData(queryKey)
            if (!previousData) return

            queryClient.setQueryData(queryKey, () => optimisticData(params, previousData))
            return { previousData }
        },
        onError: (error, _, context) => onMutateError(error, queryKey, context),
        onSettled: () => queryClient.invalidateQueries({ queryKey })
    })

    const { mutate, isPending, error } = mutation

    async function mutateAsync(
        params: Omit<TParams, "fetchOptions"> & { fetchOptions?: { throw?: true } | undefined }
    ): Promise<ThrowableResult>

    async function mutateAsync(
        params: Omit<TParams, "fetchOptions"> & { fetchOptions?: BetterFetchOption }
    ): Promise<NonThrowableResult>

    async function mutateAsync(params: TParams): Promise<ThrowableResult | NonThrowableResult> {
        return await mutation.mutateAsync(params)
    }

    return {
        ...mutation,
        mutate,
        mutateAsync,
        isPending,
        error
    }
}
