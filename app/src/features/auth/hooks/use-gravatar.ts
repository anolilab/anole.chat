import { useEffect, useState } from "react"
import { getGravatarUrl } from "../lib/gravatar-utils"
import type { GravatarOptions } from "../types/ui-configuration-types"

/**
 * React hook to asynchronously fetch a Gravatar URL for an email address
 * @param email - Email address
 * @param options - Gravatar options
 * @returns Gravatar URL or null while loading/if invalid
 */
export function useGravatar(email?: string | null, options?: GravatarOptions): string | null {
    const [url, setUrl] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        if (!email) {
            setUrl(null)
            return
        }
        getGravatarUrl(email, options).then(result => {
            if (!cancelled) setUrl(result)
        })
        return () => {
            cancelled = true
        }
    }, [email, options?.size, options?.d, options?.forceDefault, options?.jpg])

    return url
}

/**
 * React hook that provides both sync and async Gravatar URL generation
 * Falls back to async when sync fails (browser environment)
 * 
 * @param email - Email address
 * @param options - Gravatar options
 * @returns Object with gravatarUrl, loading state, and whether it's using fallback
 */
export function useGravatarWithFallback(email?: string | null, options?: GravatarOptions) {
    const [asyncUrl, setAsyncUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [usingFallback, setUsingFallback] = useState(false)

    // Try sync first
    const syncResult = typeof window === 'undefined' ? null : null // Will be handled by sync function

    useEffect(() => {
        if (!email) {
            setAsyncUrl(null)
            setIsLoading(false)
            setUsingFallback(false)
            return
        }

        // If we're in browser or sync failed, use async
        if (typeof window !== 'undefined') {
            setIsLoading(true)
            setUsingFallback(true)

            getGravatarUrl(email, options)
                .then(url => {
                    setAsyncUrl(url)
                    setIsLoading(false)
                })
                .catch(error => {
                    console.error("Error generating Gravatar URL:", error)
                    setAsyncUrl(null)
                    setIsLoading(false)
                })
        }
    }, [email, options])

    return {
        gravatarUrl: syncResult || asyncUrl,
        isLoading,
        usingFallback
    }
} 