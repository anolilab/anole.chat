"use client";

import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AuthFormClassNames } from "@/features/auth/components/auth/auth-form";
import { cn } from "@/lib/utils";

export interface FormErrorProperties {
    classNames?: AuthFormClassNames;
    error?: string;
    title?: string;
}

export const FormError = ({ classNames, error, title }: FormErrorProperties) => {
    if (!error)
        return null;

    return (
        <Alert className={cn(classNames?.error)} variant="destructive">
            <AlertCircle className="self-center" />
            <AlertTitle>{title || "Error"}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
};
