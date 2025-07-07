import type { ComponentType, ReactNode } from "react"

// API Key Data Structure (from api-key.ts)
export type ApiKey = {
    id: string
    name: string
    start: string
    expiresAt?: Date
    createdAt: Date
    updatedAt: Date
}

// User Profile Data Structure (from profile.ts)
export type Profile = {
    id?: string | number
    email?: string | null
    name?: string | null
    displayUsername?: string | null
    username?: string | null
    displayName?: string | null
    firstName?: string | null
    fullName?: string | null
    isAnonymous?: boolean | null
    emailVerified?: boolean | null
    image?: string | null
    avatar?: string | null
    avatarUrl?: string | null
}

// Account Listing Data Structure (from list-account.ts)
export type ListAccount = {
    id: string
    provider: string
    createdAt: Date
    updatedAt: Date
    accountId: string
    scopes: string[]
}

// Fetch Error Data Structure (from fetch-error.ts)
export type FetchError = {
    code?: string | undefined
    message?: string | undefined
    status?: number
    statusText?: string
}

// Link Component Type (from link.ts)
export type Link = ComponentType<{
    href: string
    className?: string
    children: ReactNode
}> 