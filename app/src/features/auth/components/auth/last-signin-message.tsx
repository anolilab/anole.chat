"use client";

import { Badge } from "@anole/ui/components/badge";
import cn from "@anole/ui/utils/cn";
import { t } from "@lingui/core/macro";
import { Clock, Mail, User, Users } from "lucide-react";
import type { FC } from "react";

import { useLastSignInMethod, type SignInMethod } from "@/features/auth/hooks/use-last-signin-method";

interface LastSignInMessageProperties {
    className?: string;
    classNames?: {
        badge?: string;
        container?: string;
        icon?: string;
        text?: string;
    };
}

const getMethodIcon = (method: SignInMethod) => {
    switch (method) {
        case "email":
            return Mail;
        case "username":
            return User;
        case "social":
            return Users;
        case "anonymous":
            return User;
        default:
            return Clock;
    }
};

const getMethodLabel = (method: SignInMethod) => {
    switch (method) {
        case "email":
            return t`Email`;
        case "username":
            return t`Username`;
        case "social":
            return t`Social`;
        case "anonymous":
            return t`Guest`;
        default:
            return t`Unknown`;
    }
};

export const LastSignInMessage: FC<LastSignInMessageProperties> = ({ className, classNames }) => {
    const { lastSignIn, getLastSignInMessage, isHydrated } = useLastSignInMethod();

    if (!isHydrated || !lastSignIn) {
        return null;
    }

    const message = getLastSignInMessage();
    if (!message) {
        return null;
    }

    const MethodIcon = getMethodIcon(lastSignIn.method);

    return (
        <div className={cn("flex items-center gap-2", className, classNames?.container)}>
            <Badge
                className={cn("text-xs", classNames?.badge)}
                variant="secondary"
            >
                <MethodIcon className={cn("mr-1 h-3 w-3", classNames?.icon)} />
                {getMethodLabel(lastSignIn.method)}
            </Badge>
            <span className={cn("text-xs text-muted-foreground", classNames?.text)}>
                {message}
                {lastSignIn.email && (
                    <span className="ml-1 font-medium">
                        with {lastSignIn.email}
                    </span>
                )}
            </span>
        </div>
    );
};
