import { sha256 } from "crypto-hash"
import type { GravatarOptions } from "../types/ui-configuration-types"

/**
 * Generate a Gravatar URL for an email address (asynchronous, works in all environments)
 * @param email - Email address
 * @param options - Gravatar options
 * @returns Promise resolving to Gravatar URL or null if email is invalid
 */
export async function getGravatarUrl(
    email?: string | null,
    options?: GravatarOptions
): Promise<string | null> {
    if (!email) return null

    try {
        // Normalize email: trim and lowercase
        const normalizedEmail = email.trim().toLowerCase()
        const hash = await sha256(normalizedEmail)

        const extension = options?.jpg ? '.jpg' : ''
        let url = `https://gravatar.com/avatar/${hash}${extension}`

        const params = new URLSearchParams()

        if (options?.size) {
            // Constrain size between 1 and 2048 pixels
            const size = Math.min(Math.max(options.size, 1), 2048)
            params.append('s', size.toString())
        }

        if (options?.d) {
            params.append('d', options.d)
        }

        if (options?.forceDefault) {
            params.append('f', 'y')
        }

        const queryString = params.toString()
        if (queryString) {
            url += `?${queryString}`
        }

        return url
    } catch (error) {
        console.error('Error generating Gravatar URL:', error)
        return null
    }
}

/**
 * Generate a Gravatar URL for an email address (asynchronous, works in all environments)
 * @param email - Email address
 * @param options - Gravatar options
 * @returns Promise resolving to Gravatar URL or null if email is invalid
 */
export async function getGravatarUrlAsync(
    email?: string | null,
    options?: GravatarOptions
): Promise<string | null> {
    if (!email) return null

    try {
        // Normalize email: trim and lowercase
        const normalizedEmail = email.trim().toLowerCase()
        const hash = await sha256(normalizedEmail)

        const extension = options?.jpg ? '.jpg' : ''
        let url = `https://gravatar.com/avatar/${hash}${extension}`

        const params = new URLSearchParams()

        if (options?.size) {
            // Constrain size between 1 and 2048 pixels
            const size = Math.min(Math.max(options.size, 1), 2048)
            params.append('s', size.toString())
        }

        if (options?.d) {
            params.append('d', options.d)
        }

        if (options?.forceDefault) {
            params.append('f', 'y')
        }

        const queryString = params.toString()
        if (queryString) {
            url += `?${queryString}`
        }

        return url
    } catch (error) {
        console.error('Error generating Gravatar URL:', error)
        return null
    }
}
