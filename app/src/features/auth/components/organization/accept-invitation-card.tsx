"use client";

import { t } from "@lingui/core/macro";
import { useSearch } from "@tanstack/react-router";
import { CheckIcon, Loader2, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import { useAuthenticate } from "../../hooks/use-authenticate";
import { getLocalizedError } from "../../lib/utils";
import type { SettingsCardClassNames } from "../settings/shared/settings-card";
import { OrganizationView } from "./organization-view";

const AcceptInvitationSkeleton = ({ className, classNames }: AcceptInvitationCardProperties) => (
    <Card className={cn("w-full max-w-sm", className, classNames?.base)}>
        <CardHeader className={cn("justify-items-center", classNames?.header)}>
            <Skeleton className={cn("my-1 h-5 w-full max-w-32 md:h-5.5 md:w-40", classNames?.skeleton)} />

            <Skeleton className={cn("my-0.5 h-3 w-full max-w-56 md:h-3.5 md:w-64", classNames?.skeleton)} />
        </CardHeader>

        <CardContent className={cn("flex flex-col gap-6 truncate", classNames?.content)}>
            <Card className={cn("flex-row items-center p-4")}>
                <OrganizationView isPending />

                <Skeleton className="mt-0.5 ml-auto h-4 w-full max-w-14 shrink-2" />
            </Card>

            <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-9 w-full" />

                <Skeleton className="h-9 w-full" />
            </div>
        </CardContent>
    </Card>
);

const AcceptInvitationContent = ({ className, classNames, invitationId }: AcceptInvitationCardProperties & { invitationId: string }) => {
    const {
        authClient,
        hooks: { useInvitation },
        organization,
        redirectTo,
        replace,
        toast,
    } = useAuth();

    const [isRejecting, setIsRejecting] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const isProcessing = isRejecting || isAccepting;

    const { data: invitation, isPending } = useInvitation({
        query: {
            id: invitationId,
        },
    });

    useEffect(() => {
        if (isPending || !invitationId)
            return;

        if (!invitation) {
            toast({
                message: t`Invitation not found`,
                variant: "error",
            });

            replace(redirectTo);

            return;
        }

        if (invitation.status !== "pending" || new Date(invitation.expiresAt) < new Date()) {
            toast({
                message: new Date(invitation.expiresAt) < new Date() ? t`Invitation expired` : t`Invitation not found`,
                variant: "error",
            });

            replace(redirectTo);
        }
    }, [invitation, isPending, invitationId, toast, replace, redirectTo]);

    const acceptInvitation = async () => {
        if (!invitationId)
            return;

        setIsAccepting(true);

        try {
            await authClient.organization.acceptInvitation({
                fetchOptions: { throw: true },
                invitationId,
            });

            toast({
                message: t`Invitation accepted`,
                variant: "success",
            });

            replace(redirectTo);
        } catch (error) {
            toast({
                message: getLocalizedError({ error }),
                variant: "error",
            });
            setIsAccepting(false);
        }
    };

    const rejectInvitation = async () => {
        if (!invitationId)
            return;

        setIsRejecting(true);

        try {
            await authClient.organization.rejectInvitation({
                fetchOptions: { throw: true },
                invitationId,
            });

            toast({
                message: t`Invitation rejected`,
                variant: "success",
            });

            replace(redirectTo);
        } catch (error) {
            toast({
                message: getLocalizedError({ error }),
                variant: "error",
            });

            setIsRejecting(false);
        }
    };

    const builtInRoles = [
        { label: t`Owner`, role: "owner" },
        { label: t`Admin`, role: "admin" },
        { label: t`Member`, role: "member" },
    ];

    const roles = [...builtInRoles, ...organization?.customRoles || []];
    const roleLabel = roles.find((r) => r.role === invitation?.role)?.label || invitation?.role;

    if (isPending)
        return <AcceptInvitationSkeleton className={className} classNames={classNames} />;

    return (
        <Card className={cn("w-full max-w-sm", className, classNames?.base)}>
            <CardHeader className={cn("justify-items-center text-center", classNames?.header)}>
                <CardTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Accept Invitation`}</CardTitle>

                <CardDescription className={cn("text-xs md:text-sm", classNames?.description)}>
                    {t`You've been invited to join an organization`}
                </CardDescription>
            </CardHeader>

            <CardContent className={cn("flex flex-col gap-6 truncate", classNames?.content)}>
                <Card className={cn("flex-row items-center p-4")}>
                    <OrganizationView
                        organization={
                            invitation
                                ? {
                                    createdAt: new Date(),
                                    id: invitation.organizationId,
                                    logo: invitation.organizationLogo,
                                    name: invitation.organizationName,
                                    slug: invitation.organizationSlug,
                                }
                                : null
                        }
                    />

                    <p className="text-muted-foreground ml-auto text-sm">{roleLabel}</p>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                    <Button className={cn(classNames?.button, classNames?.outlineButton)} disabled={isProcessing} onClick={rejectInvitation} variant="outline">
                        {isRejecting ? <Loader2 className="animate-spin" /> : <XIcon />}

                        {t`Reject`}
                    </Button>

                    <Button className={cn(classNames?.button, classNames?.primaryButton)} disabled={isProcessing} onClick={acceptInvitation}>
                        {isAccepting ? <Loader2 className="animate-spin" /> : <CheckIcon />}

                        {t`Accept`}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export interface AcceptInvitationCardProperties {
    className?: string;
    classNames?: SettingsCardClassNames;
}

export const AcceptInvitationCard = ({ className, classNames }: AcceptInvitationCardProperties) => {
    const {
        hooks: { useSession },
        redirectTo,
        replace,
        toast,
    } = useAuth();

    const { data: sessionData } = useSession();
    const [invitationId, setInvitationId] = useState<string | null>(null);
    const search = useSearch({ strict: false }) as any;

    useEffect(() => {
        const invitationIdParameter = search?.invitationId;

        if (!invitationIdParameter) {
            toast({
                message: t`Invitation not found`,
                variant: "error",
            });

            replace(redirectTo);

            return;
        }

        // eslint-disable-next-line react-you-might-not-need-an-effect/no-derived-state, react-hooks-extra/no-direct-set-state-in-use-effect
        setInvitationId(invitationIdParameter);
    }, [search?.invitationId, toast, replace, redirectTo]);

    // If session is not loaded yet, use authenticate hook to check
    useAuthenticate();

    if (!sessionData || !invitationId) {
        return <AcceptInvitationSkeleton className={className} classNames={classNames} />;
    }

    return <AcceptInvitationContent className={className} classNames={classNames} invitationId={invitationId} />;
};
