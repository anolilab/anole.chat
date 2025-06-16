"use client";

import CopyButton from "@/components/copy-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon, Loader2, MailPlus, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { AuthClient } from "@/lib/auth/client";
import { useLingui } from "@lingui/react/macro";
import { authClient } from "@/features/auth/lib/client";

type ActiveOrganization = Awaited<ReturnType<typeof authClient.organization.getFullOrganization>>;

export function OrganizationCard(props: { session: AuthClient["$Infer"]["Session"] | null; activeOrganization: ActiveOrganization | null }) {
    const { t } = useLingui();
    const { data: organizations } = authClient.useListOrganizations();

    const optimisticOrg = props.activeOrganization;

    const [isRevoking, setIsRevoking] = useState<string[]>([]);
    const inviteVariants = {
        hidden: { opacity: 0, height: 0 },
        visible: { opacity: 1, height: "auto" },
        exit: { opacity: 0, height: 0 },
    };

    const { data } = authClient.useSession();
    const session = data || props.session;

    const currentMember = optimisticOrg?.members?.find((member: any) => member.userId === session?.user.id);

    return (
        <div className="flex w-full flex-1 p-4">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>{t`Organization`}</CardTitle>
                    <div className="flex justify-between">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex cursor-pointer items-center gap-1">
                                    <p className="text-sm">
                                        <span className="font-bold"></span> {optimisticOrg?.name || t`Personal`}
                                    </p>

                                    <ChevronDownIcon />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                    className="py-1"
                                    onClick={async () => {
                                        authClient.organization.setActive({
                                            organizationId: null,
                                        });

                                        console.log("clicked");
                                        window.location.reload();
                                    }}
                                >
                                    <p className="sm text-sm">{t`Personal`}</p>
                                </DropdownMenuItem>
                                {organizations?.map((org) => (
                                    <DropdownMenuItem
                                        className="py-1"
                                        key={org.id}
                                        onClick={async () => {
                                            console.log("clicked");
                                            if (org.id === optimisticOrg?.id) {
                                                console.log("same org");
                                                return;
                                            }

                                            const { data } = await authClient.organization.setActive({
                                                organizationId: org.id,
                                            });

                                            console.log(data);

                                            if (data) {
                                                console.log("invalidating");
                                                window.location.reload();
                                            }
                                        }}
                                    >
                                        <p className="sm text-sm">{org.name}</p>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div>
                            <CreateOrganizationDialog />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Avatar className="rounded-none">
                            <AvatarImage className="h-full w-full rounded-none object-cover" src={optimisticOrg?.logo || ""} />
                            <AvatarFallback className="rounded-none">{optimisticOrg?.name?.charAt(0) || "P"}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p>{optimisticOrg?.name || t`Personal`}</p>
                            <p className="text-muted-foreground text-xs">
                                {optimisticOrg?.members.length || 1} {t`Members`}
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-8 md:flex-row">
                        <div className="flex flex-grow flex-col gap-2">
                            <p className="border-b-foreground/10 border-b-2 font-medium">{t`Members`}</p>
                            <div className="flex flex-col gap-2">
                                {optimisticOrg?.members.map((member: any) => (
                                    <div key={member.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-9 w-9 sm:flex">
                                                <AvatarImage src={member.user.image || ""} className="object-cover" />
                                                <AvatarFallback>{member.user.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm">{member.user.name}</p>
                                                <p className="text-muted-foreground text-xs">
                                                    {member.role === "owner" ? t`Owner` : member.role === "member" ? t`Member` : t`Admin`}
                                                </p>
                                            </div>
                                        </div>
                                        {member.role !== "owner" && (currentMember?.role === "owner" || currentMember?.role === "admin") && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => {
                                                    authClient.organization.removeMember({
                                                        memberIdOrEmail: member.id,
                                                    });
                                                }}
                                            >
                                                {currentMember?.id === member.id ? t`Leave` : t`Remove`}
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {!optimisticOrg?.id && (
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Avatar>
                                                <AvatarImage src={session?.user.image || ""} />
                                                <AvatarFallback>{session?.user.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm">{session?.user.name}</p>
                                                <p className="text-muted-foreground text-xs">{t`Owner`}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-grow flex-col gap-2">
                            <p className="border-b-foreground/10 border-b-2 font-medium">{t`Invites`}</p>
                            <div className="flex flex-col gap-2">
                                <AnimatePresence>
                                    {optimisticOrg?.invitations
                                        .filter((invitation: any) => invitation.status === "pending")
                                        .map((invitation: any) => (
                                            <motion.div
                                                key={invitation.id}
                                                className="flex items-center justify-between"
                                                variants={inviteVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                                layout
                                            >
                                                <div>
                                                    <p className="text-sm">{invitation.email}</p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {invitation.role === "owner" ? t`Owner` : invitation.role === "member" ? t`Member` : t`Admin`}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        disabled={isRevoking.includes(invitation.id)}
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => {
                                                            authClient.organization.cancelInvitation(
                                                                {
                                                                    invitationId: invitation.id,
                                                                },
                                                                {
                                                                    onRequest: () => {
                                                                        setIsRevoking([...isRevoking, invitation.id]);
                                                                    },
                                                                    onSuccess: () => {
                                                                        toast.message("Invitation revoked successfully");
                                                                        setIsRevoking(isRevoking.filter((id) => id !== invitation.id));
                                                                    },
                                                                    onError: (ctx) => {
                                                                        toast.error(ctx.error.message);
                                                                        setIsRevoking(isRevoking.filter((id) => id !== invitation.id));
                                                                    },
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        {isRevoking.includes(invitation.id) ? <Loader2 className="animate-spin" size={16} /> : t`Revoke`}
                                                    </Button>
                                                    <div>
                                                        <CopyButton textToCopy={`${window.location.origin}/accept-invitation/${invitation.id}`} />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                </AnimatePresence>
                                {optimisticOrg?.invitations.length === 0 && (
                                    <motion.p className="text-muted-foreground text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        {t`No active invitations`}
                                    </motion.p>
                                )}
                                {!optimisticOrg?.id && (
                                    <Label className="text-muted-foreground text-xs">{t`Cannot invite members to personal workspace`}</Label>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex w-full justify-end">
                        <div>
                            <div>{optimisticOrg?.id && <InviteMemberDialog />}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function CreateOrganizationDialog() {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [isSlugEdited, setIsSlugEdited] = useState(false);
    const [logo, setLogo] = useState<string | null>(null);

    useEffect(() => {
        if (!isSlugEdited) {
            const generatedSlug = name.trim().toLowerCase().replace(/\s+/g, "-");
            setSlug(generatedSlug);
        }
    }, [name, isSlugEdited]);

    useEffect(() => {
        if (open) {
            setName("");
            setSlug("");
            setIsSlugEdited(false);
            setLogo(null);
        }
    }, [open]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="w-full gap-2" variant="default">
                    <PlusIcon />
                    <p>{t`New Organization`}</p>
                </Button>
            </DialogTrigger>
            <DialogContent className="w-11/12 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t`New Organization`}</DialogTitle>
                    <DialogDescription>{t`Create a new organization to collaborate with your team`}</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label>{t`Organization Name`}</Label>
                        <Input placeholder={t`Name`} value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label>{t`Organization Slug`}</Label>
                        <Input
                            value={slug}
                            onChange={(e) => {
                                setSlug(e.target.value);
                                setIsSlugEdited(true);
                            }}
                            placeholder="Slug"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label>{t`Logo`}</Label>
                        <Input type="file" accept="image/*" onChange={handleLogoChange} />
                        {logo && (
                            <div className="mt-2">
                                <img src={logo} alt="Logo preview" className="h-16 w-16 object-cover" width={16} height={16} />
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        disabled={loading}
                        onClick={async () => {
                            setLoading(true);
                            await authClient.organization.create(
                                {
                                    name: name,
                                    slug: slug,
                                    logo: logo || undefined,
                                },
                                {
                                    onResponse: () => {
                                        setLoading(false);
                                    },
                                    onSuccess: () => {
                                        toast.success("Organization created successfully");
                                        setOpen(false);
                                    },
                                    onError: (error) => {
                                        toast.error(error.error.message);
                                        setLoading(false);
                                    },
                                },
                            );
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : t`Create`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function InviteMemberDialog() {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("member");
    const [loading, setLoading] = useState(false);
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" className="w-full gap-2" variant="secondary">
                    <MailPlus size={16} />
                    <p>{t`Invite Member`}</p>
                </Button>
            </DialogTrigger>
            <DialogContent className="w-11/12 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t`Invite Member`}</DialogTitle>
                    <DialogDescription>{t`Invite a new member to join your organization`}</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                    <Label>{t`Email`}</Label>
                    <Input placeholder={t`Email`} value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Label>{t`Role`}</Label>
                    <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                            <SelectValue placeholder={`${t`Select User`}`} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="admin">{t`Admin`}</SelectItem>
                            <SelectItem value="member">{t`Member`}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <DialogClose>
                        <Button
                            disabled={loading}
                            onClick={async () => {
                                const invite = authClient.organization.inviteMember({
                                    email: email,
                                    role: role as "member",
                                    fetchOptions: {
                                        throw: true,
                                        onSuccess: () => {
                                            // TODO: Update optimistic org
                                        },
                                    },
                                });
                                toast.promise(invite, {
                                    loading: "Inviting member...",
                                    success: "Member invited successfully",
                                    error: (error) => error.error.message,
                                });
                            }}
                        >
                            {t`Invite`}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
