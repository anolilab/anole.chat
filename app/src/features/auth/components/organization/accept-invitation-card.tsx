"use client";

import { CheckIcon, Loader2, XIcon } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { t } from "@lingui/core/macro";
import { useSearch } from "@tanstack/react-router";

import { useAuthenticate } from "../../hooks/use-authenticate";
import { AuthUIContext } from "../../lib/auth-ui-provider";
import { cn } from "@/lib/utils";
import { getLocalizedError } from "../../lib/utils";
import type { SettingsCardClassNames } from "../settings/shared/settings-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrganizationView } from "./organization-view";

export interface AcceptInvitationCardProps {
    className?: string;
    classNames?: SettingsCardClassNames;
}

export function AcceptInvitationCard({ className, classNames }: AcceptInvitationCardProps) {
    const {
        hooks: { useSession },
        toast,
        redirectTo,
        replace,
    } = useContext(AuthUIContext);

    const { data: sessionData } = useSession();
    const [invitationId, setInvitationId] = useState<string | null>(null);
    const search = useSearch({ strict: false }) as any;

    useEffect(() => {
        const invitationIdParam = search?.invitationId;

        if (!invitationIdParam) {
            toast({
                variant: "error",
                message: t`Invitation not found`,
            });

            replace(redirectTo);
            return;
        }

        setInvitationId(invitationIdParam);
    }, [search?.invitationId, toast, replace, redirectTo]);

    // If session is not loaded yet, use authenticate hook to check
    useAuthenticate();

    if (!sessionData || !invitationId) {
        return <AcceptInvitationSkeleton className={className} classNames={classNames} />;
    }

    return <AcceptInvitationContent className={className} classNames={classNames} invitationId={invitationId} />;
}

function AcceptInvitationContent({ className, classNames, invitationId }: AcceptInvitationCardProps & { invitationId: string }) {
    const {
        authClient,
        toast,
        redirectTo,
        replace,
        organization,
        hooks: { useInvitation },
    } = useContext(AuthUIContext);

    const [isRejecting, setIsRejecting] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const isProcessing = isRejecting || isAccepting;

    const { data: invitation, isPending } = useInvitation({
        query: {
            id: invitationId,
        },
    });

    useEffect(() => {
        if (isPending || !invitationId) return;

        if (!invitation) {
            toast({
                variant: "error",
                message: t`Invitation not found`,
            });

            replace(redirectTo);
            return;
        }

        if (invitation.status !== "pending" || new Date(invitation.expiresAt) < new Date()) {
            toast({
                variant: "error",
                message: new Date(invitation.expiresAt) < new Date() ? t`Invitation expired` : t`Invitation not found`,
            });

            replace(redirectTo);
        }
    }, [invitation, isPending, invitationId, toast, replace, redirectTo]);

    const acceptInvitation = async () => {
        if (!invitationId) return;

        setIsAccepting(true);

        try {
            await authClient.organization.acceptInvitation({
                invitationId: invitationId,
                fetchOptions: { throw: true },
            });

            toast({
                variant: "success",
                message: t`Invitation accepted`,
            });

            replace(redirectTo);
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error }),
            });
            setIsAccepting(false);
        }
    };

    const rejectInvitation = async () => {
        if (!invitationId) return;

        setIsRejecting(true);

        try {
            await authClient.organization.rejectInvitation({
                invitationId: invitationId,
                fetchOptions: { throw: true },
            });

            toast({
                variant: "success",
                message: t`Invitation rejected`,
            });

            replace(redirectTo);
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error }),
            });

            setIsRejecting(false);
        }
    };

    const builtInRoles = [
        { role: "owner", label: t`Owner` },
        { role: "admin", label: t`Admin` },
        { role: "member", label: t`Member` },
    ];

    const roles = [...builtInRoles, ...(organization?.customRoles || [])];
    const roleLabel = roles.find((r) => r.role === invitation?.role)?.label || invitation?.role;

    if (isPending) return <AcceptInvitationSkeleton className={className} classNames={classNames} />;

    return (
        <Card className={cn("w-full max-w-sm", className, classNames?.base)}>
            <CardHeader className={cn("justify-items-center text-center", classNames?.header)}>
                <CardTitle className={cn("text-lg md:text-xl", classNames?.title)}>{t`Accept Invitation`}</CardTitle>

                <CardDescription
                    className={cn("text-xs md:text-sm", classNames?.description)}
                >{t`You've been invited to join an organization`}</CardDescription>
            </CardHeader>

            <CardContent className={cn("flex flex-col gap-6 truncate", classNames?.content)}>
                <Card className={cn("flex-row items-center p-4")}>
                    <OrganizationView
                        organization={
                            invitation
                                ? {
                                      id: invitation.organizationId,
                                      name: invitation.organizationName,
                                      slug: invitation.organizationSlug,
                                      logo: invitation.organizationLogo,
                                      createdAt: new Date(),
                                  }
                                : null
                        }
                    />

                    <p className="text-muted-foreground ml-auto text-sm">{roleLabel}</p>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className={cn(classNames?.button, classNames?.outlineButton)} onClick={rejectInvitation} disabled={isProcessing}>
                        {isRejecting ? <Loader2 className="animate-spin" /> : <XIcon />}

                        {t`Reject`}
                    </Button>

                    <Button className={cn(classNames?.button, classNames?.primaryButton)} onClick={acceptInvitation} disabled={isProcessing}>
                        {isAccepting ? <Loader2 className="animate-spin" /> : <CheckIcon />}

                        {t`Accept`}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

const AcceptInvitationSkeleton = ({ className, classNames }: AcceptInvitationCardProps) => {
    return (
        <Card className={cn("w-full max-w-sm", className, classNames?.base)}>
            <CardHeader className={cn("justify-items-center", classNames?.header)}>
                <Skeleton className={cn("md:h-5.5 my-1 h-5 w-full max-w-32 md:w-40", classNames?.skeleton)} />

                <Skeleton className={cn("my-0.5 h-3 w-full max-w-56 md:h-3.5 md:w-64", classNames?.skeleton)} />
            </CardHeader>

            <CardContent className={cn("flex flex-col gap-6 truncate", classNames?.content)}>
                <Card className={cn("flex-row items-center p-4")}>
                    <OrganizationView isPending />

                    <Skeleton className="shrink-2 ml-auto mt-0.5 h-4 w-full max-w-14" />
                </Card>

                <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-9 w-full" />

                    <Skeleton className="h-9 w-full" />
                </div>
            </CardContent>
        </Card>
    );
};
