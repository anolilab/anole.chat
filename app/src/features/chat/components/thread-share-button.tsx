import { api } from "@anole/convex/api";
import { Avatar, AvatarFallback, AvatarImage } from "@anole/ui/components/avatar";
import { Badge } from "@anole/ui/components/badge";
import { Button } from "@anole/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@anole/ui/components/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@anole/ui/components/dropdown-menu";
import { Input } from "@anole/ui/components/input";
import { Label } from "@anole/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@anole/ui/components/select";
import { Switch } from "@anole/ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@anole/ui/components/tabs";
import cn from "@anole/ui/utils/cn";
import { t } from "@lingui/core/macro";
import { useMutation, useQuery } from "convex/react";
import { Share2 } from "lucide-react";
import React, { useCallback, useState } from "react";
import { toast } from "sonner";

// Local fallback for Id type if import fails
type Id<TableName extends string> = string & { __tableName?: TableName };

interface ThreadShareButtonProperties {
    classes?: {
        button?: string;
        icon?: string;
    };
    threadId: string;
}

type Permission = "read" | "write" | "admin";
type ExpirationType = "1_day" | "7_days" | "custom";

const ThreadShareButton: React.FC<ThreadShareButtonProperties> = ({ classes, threadId }) => {
    const [inviteEmail, setInviteEmail] = useState("");
    const [invitePermission, setInvitePermission] = useState<Permission>("read");
    const [expirationType, setExpirationType] = useState<ExpirationType>("7_days");
    const [customHours, setCustomHours] = useState<number>(24);
    const [tab, setTab] = useState("access");

    const threadAccess = useQuery(api.chat.sharing.getThreadAccess, { threadId });
    const threadInvites = useQuery(api.chat.sharing.getThreadInvites, { threadId });

    const createInviteMutation = useMutation(api.chat.sharing.createThreadInvite);
    const revokeInviteMutation = useMutation(api.chat.sharing.revokeThreadInvite);
    const removeAccessMutation = useMutation(api.chat.sharing.removeThreadAccess);
    const toggleVisibilityMutation = useMutation(api.chat.sharing.toggleThreadVisibility);

    const handleTabChange = useCallback((value: string) => setTab(value), []);
    const handleInviteEmailChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(event.target.value), []);
    const handleInvitePermissionChange = useCallback((value: string) => setInvitePermission(value as Permission), []);
    const handleExpirationTypeChange = useCallback((value: string) => setExpirationType(value as ExpirationType), []);
    const handleCustomHoursChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => setCustomHours(Number.parseInt(event.target.value, 10) || 1),
        [],
    );

    const handleCreateInvite = useCallback(async () => {
        if (!inviteEmail.trim()) {
            toast.error("Please enter an email address");

            return;
        }

        try {
            const result = await createInviteMutation({
                customHours: expirationType === "custom" ? customHours : undefined,
                expirationType,
                invitedEmail: inviteEmail.trim(),
                permission: invitePermission,
                threadId,
            });
            const inviteLink = `${globalThis.location.origin}/invite/${result.inviteToken}`;

            // @ts-expect-error: navigator.clipboard is experimental in some TS configs
            await globalThis.navigator.clipboard.writeText(inviteLink);
            toast.success("Invite link copied to clipboard!");
            setInviteEmail("");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create invite");
        }
        // eslint-disable-next-line
    }, [inviteEmail, expirationType, customHours, invitePermission, threadId]);

    const handleRevokeInvite = useCallback(async (inviteId: Id<"threadInvites">) => {
        try {
            await revokeInviteMutation({ inviteId });
            toast.success("Invite revoked");
        } catch {
            toast.error("Failed to revoke invite");
        }
        // eslint-disable-next-line
    }, []);

    const handleRemoveAccess = useCallback(
        async (userId: Id<"users">) => {
            try {
                await removeAccessMutation({ targetUserId: userId, threadId });
                toast.success("User access removed");
            } catch {
                toast.error("Failed to remove user access");
            }
        },
        [threadId],
    );

    const handleToggleVisibility = useCallback(
        (isPublic: boolean) => {
            (async () => {
                try {
                    await toggleVisibilityMutation({ isPublic, threadId });
                    toast.success(`Thread made ${isPublic ? "public" : "private"}`);
                } catch {
                    toast.error("Failed to update thread visibility");
                }
            })();
        },
        [threadId],
    );

    const copyPublicLink = useCallback(async () => {
        if (threadAccess?.publicAccessToken) {
            const publicLink = `${globalThis.location.origin}/thread/${threadAccess.publicAccessToken}`;

            // @ts-expect-error: navigator.clipboard is experimental in some TS configs
            await globalThis.navigator.clipboard.writeText(publicLink);
            toast.success("Public link copied to clipboard!");
        }
        // eslint-disable-next-line
    }, [threadAccess]);

    const formatExpirationTime = (timestamp: number) => {
        const date = new Date(timestamp);

        return date.toLocaleString();
    };

    const getPermissionColor = (permission: string) => {
        switch (permission) {
            case "admin": {
                return "destructive";
            }
            case "read": {
                return "secondary";
            }
            case "write": {
                return "default";
            }
            default: {
                return "secondary";
            }
        }
    };

    if (!threadAccess) {
        return (
            <Button
                className={cn(
                    classes?.button,
                    "cursor-not-allowed",
                    "group", // for hover
                )}
                disabled
                size="icon"
                variant="ghost"
            >
                <span
                    className={cn(
                        classes?.icon,
                        "animate-blink", // custom blinking animation
                        "transition-opacity duration-200",
                        "group-hover:opacity-50", // fade on hover to indicate loading
                    )}
                >
                    <Share2 />
                </span>
                <span className="sr-only">{t`Share Thread`}</span>
                <style jsx>
                    {`
                        @keyframes blink {
                            0% {
                                opacity: 1;
                            }
                            50% {
                                opacity: 0.3;
                            }
                            100% {
                                opacity: 1;
                            }
                        }
                        .animate-blink {
                            animation: blink 1s infinite;
                        }
                    `}
                </style>
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className={classes?.button} size="icon" variant="ghost">
                    <Share2 className={classes?.icon} />
                    <span className="sr-only">{t`Share Thread`}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[420px] p-0">
                <Tabs className="w-full" onValueChange={handleTabChange} value={tab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="access">Access</TabsTrigger>
                        <TabsTrigger value="invites">Invites</TabsTrigger>
                        <TabsTrigger value="public">Public</TabsTrigger>
                    </TabsList>
                    <TabsContent className="px-4 py-2" value="access">
                        {threadAccess.users.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No additional users have access to this thread.</p>
                        ) : (
                            threadAccess.users.map((user) => (
                                <div className="flex items-center justify-between rounded-lg border p-3" key={user.userId}>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src="" />
                                            <AvatarFallback>{user.name?.[0] || user.email[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{user.name || user.email}</p>
                                            <p className="text-muted-foreground text-xs">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getPermissionColor(user.permission)}>{user.permission}</Badge>
                                        {threadAccess.isOwner && (
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    onClick={() => {
                                                        if (
                                                            globalThis.confirm(`Are you sure you want to remove ${user.name || user.email} from this thread?`)
                                                        ) {
                                                            handleRemoveAccess(user.userId as Id<"users">);
                                                        }
                                                    }}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>
                    <TabsContent className="flex flex-col gap-2 px-4 py-2" value="invites">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" onChange={handleInviteEmailChange} placeholder="Enter email address" type="email" value={inviteEmail} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="permission">Permission Level</Label>
                            <Select onValueChange={handleInvitePermissionChange} value={invitePermission}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="read">Read Only</SelectItem>
                                    <SelectItem value="write">Read & Write</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expiration">Expiration</Label>
                            <Select onValueChange={handleExpirationTypeChange} value={expirationType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1_day">1 Day</SelectItem>
                                    <SelectItem value="7_days">7 Days</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {expirationType === "custom" && (
                            <div className="space-y-2">
                                <Label htmlFor="customHours">Hours</Label>
                                <Input id="customHours" min="1" onChange={handleCustomHoursChange} type="number" value={customHours} />
                            </div>
                        )}
                        <Button className="w-full" onClick={handleCreateInvite}>
                            Create Invite
                        </Button>
                        {threadInvites && threadInvites.length > 0 && (
                            <>
                                <hr className="my-2" />
                                <h2>Pending Invites</h2>
                                {threadInvites.map((invite) => (
                                    <div className="flex items-center justify-between rounded-lg border p-3" key={invite._id}>
                                        <div className="flex items-center gap-3">
                                            <Share2 className="text-muted-foreground h-4 w-4" />
                                            <div>
                                                <p className="text-sm font-medium">{invite.invitedEmail}</p>
                                                <p className="text-muted-foreground flex items-center gap-1 text-xs">
                                                    Expires: {formatExpirationTime(invite.expiresAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={getPermissionColor(invite.permission)}>{invite.permission}</Badge>
                                            <Button
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleRevokeInvite(invite._id as Id<"threadInvites">)}
                                                size="sm"
                                                variant="ghost"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </TabsContent>
                    <TabsContent className="px-4 py-2" value="public">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Public Access</p>
                                <p className="text-muted-foreground text-sm">Anyone with the link can view this thread</p>
                            </div>
                            <Switch checked={threadAccess.isPublic} disabled={!threadAccess.isOwner} onCheckedChange={handleToggleVisibility} />
                        </div>
                        {threadAccess.isPublic && threadAccess.publicAccessToken && (
                            <div className="space-y-2">
                                <Label>Public Link</Label>
                                <div className="flex gap-2">
                                    <Input readOnly value={`${globalThis.location.origin}/thread/${threadAccess.publicAccessToken}`} />
                                    <Button onClick={copyPublicLink} variant="outline">
                                        Copy
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ThreadShareButton;
