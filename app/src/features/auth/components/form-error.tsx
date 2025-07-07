"use client"

import { AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AuthFormClassNames } from "./auth/auth-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export interface FormErrorProps {
    title?: string
    classNames?: AuthFormClassNames
    error?: string
}

export function FormError({ title, classNames, error }: FormErrorProps) {
    if (!error) return null

    return (
        <Alert variant="destructive" className={cn(classNames?.error)}>
            <AlertCircle className="self-center" />
            <AlertTitle>{title || "Error"}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    )
}
