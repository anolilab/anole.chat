import { useMutation, useQuery } from "convex/react";
import { Clock, Copy, Globe, Mail, Share2, Trash2, Users } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { api } from "@anole/convex/api";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface ThreadShareDialogProperties {
    children: React.ReactNode;
    threadId: string;
}

const ThreadShareDialog = ({ children, threadId }: ThreadShareDialogProperties) => {
    const [open, setOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [invitePermission, setInvitePermission] = useState<"read" | "write" | "admin">("read");
    const [expirationType, setExpirationType] = useState<"1_day" | "7_days" | "custom">("7_days");
    const [customHours, setCustomHours] = useState<number>(24);

    // Queries
    const threadAccess = useQuery(api.chat.sharing.getThreadAccess, { threadId });
    const threadInvites = useQuery(api.chat.sharing.getThreadInvites, { threadId });

    // Mutations
    const createInvite = useMutation(api.chat.sharing.createThreadInvite);
    const revokeInvite = useMutation(api.chat.sharing.revokeThreadInvite);
    const removeAccess = useMutation(api.chat.sharing.removeThreadAccess);
    const toggleVisibility = useMutation(api.chat.sharing.toggleThreadVisibility);

    const handleCreateInvite = async () => {
        if (!inviteEmail.trim()) {
            toast.error("Please enter an email address");

            return;
        }

        try {
            const result = await createInvite({
                customHours: expirationType === "custom" ? customHours : undefined,
                expirationType,
                invitedEmail: inviteEmail.trim(),
                permission: invitePermission,
                threadId,
            });

            const inviteLink = `${globalThis.location.origin}/invite/${result.inviteToken}`;

            // Copy to clipboard
            await navigator.clipboard.writeText(inviteLink);
            toast.success("Invite link copied to clipboard!");

            setInviteEmail("");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create invite");
        }
    };

    const handleRevokeInvite = async (inviteId: string) => {
        try {
            await revokeInvite({ inviteId: inviteId as any });
            toast.success("Invite revoked");
        } catch {
            toast.error("Failed to revoke invite");
        }
    };

    const handleRemoveAccess = async (userId: string) => {
        try {
            await removeAccess({ targetUserId: userId as any, threadId });
            toast.success("User access removed");
        } catch {
            toast.error("Failed to remove user access");
        }
    };

    const handleToggleVisibility = async (isPublic: boolean) => {
        try {
            await toggleVisibility({ isPublic, threadId });
            toast.success(`Thread made ${isPublic ? "public" : "private"}`);
        } catch {
            toast.error("Failed to update thread visibility");
        }
    };

    const copyPublicLink = async () => {
        if (threadAccess?.publicAccessToken) {
            const publicLink = `${globalThis.location.origin}/thread/${threadAccess.publicAccessToken}`;

            await navigator.clipboard.writeText(publicLink);
            toast.success("Public link copied to clipboard!");
        }
    };

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
        return <div>Loading...</div>;
    }

    return (
        <Dialog onOpenChange={setOpen} open={open}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Share Thread
                    </DialogTitle>
                </DialogHeader>

                <Tabs className="w-full" defaultValue="access">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="access">Access</TabsTrigger>
                        <TabsTrigger value="invites">Invites</TabsTrigger>
                        <TabsTrigger value="public">Public</TabsTrigger>
                    </TabsList>

                    <TabsContent className="space-y-4" value="access">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    People with Access
                                </CardTitle>
                                <CardDescription>Manage who has access to this thread</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {threadAccess.users.length === 0
                                    ? (
                                        <p className="text-muted-foreground text-sm">No additional users have access to this thread.</p>
                                    )
                                    : threadAccess.users.map((user) => (
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
                                                                if (confirm(`Are you sure you want to remove ${user.name || user.email} from this thread?`)) {
                                                                    handleRemoveAccess(user.userId);
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
                                    ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent className="space-y-4" value="invites">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Create Invite
                                </CardTitle>
                                <CardDescription>Invite someone to access this thread</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="Enter email address"
                                        type="email"
                                        value={inviteEmail}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="permission">Permission Level</Label>
                                    <Select onValueChange={(value: any) => setInvitePermission(value)} value={invitePermission}>
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
                                    <Select onValueChange={(value: any) => setExpirationType(value)} value={expirationType}>
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
                                        <Input
                                            id="customHours"
                                            min="1"
                                            onChange={(e) => setCustomHours(Number.parseInt(e.target.value) || 1)}
                                            type="number"
                                            value={customHours}
                                        />
                                    </div>
                                )}

                                <Button className="w-full" onClick={handleCreateInvite}>
                                    Create Invite
                                </Button>
                            </CardContent>
                        </Card>

                        {threadInvites && threadInvites.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pending Invites</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {threadInvites.map((invite) => (
                                        <div className="flex items-center justify-between rounded-lg border p-3" key={invite._id}>
                                            <div className="flex items-center gap-3">
                                                <Mail className="text-muted-foreground h-4 w-4" />
                                                <div>
                                                    <p className="text-sm font-medium">{invite.invitedEmail}</p>
                                                    <p className="text-muted-foreground flex items-center gap-1 text-xs">
                                                        <Clock className="h-3 w-3" />
                                                        Expires:
                                                        {" "}
                                                        {formatExpirationTime(invite.expiresAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getPermissionColor(invite.permission)}>{invite.permission}</Badge>
                                                <Button
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleRevokeInvite(invite._id)}
                                                    size="sm"
                                                    variant="ghost"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent className="space-y-4" value="public">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    Public Access
                                </CardTitle>
                                <CardDescription>Make this thread publicly accessible via a link</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default ThreadShareDialog;
