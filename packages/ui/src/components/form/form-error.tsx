"use client";

import type { FC } from "react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "../alert";
import type { AuthFormClassNames } from "@/features/auth/components/auth/auth-form";
import cn from "../../utils/cn";

export interface FormErrorProperties {
    classNames?: AuthFormClassNames;
    error?: string;
    title?: string;
}

export const FormError: FC<FormErrorProperties> = ({
    classNames,
    error,
    title,
}) => {
    if (!error) return null;

    return (
        <Alert className={cn(classNames?.error)} variant="destructive">
            <AlertCircle className="self-center" />
            <AlertTitle>{title || "Error"}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
};
