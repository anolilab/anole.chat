import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Copy, Users, Share2, Globe, Mail, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ThreadShareDialogProps {
    threadId: string;
    children: React.ReactNode;
}

export function ThreadShareDialog({ threadId, children }: ThreadShareDialogProps) {
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
                threadId,
                invitedEmail: inviteEmail.trim(),
                permission: invitePermission,
                expirationType,
                customHours: expirationType === "custom" ? customHours : undefined,
            });

            const inviteLink = `${window.location.origin}/invite/${result.inviteToken}`;

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
        } catch (error) {
            toast.error("Failed to revoke invite");
        }
    };

    const handleRemoveAccess = async (userId: string) => {
        try {
            await removeAccess({ threadId, targetUserId: userId as any });
            toast.success("User access removed");
        } catch (error) {
            toast.error("Failed to remove user access");
        }
    };

    const handleToggleVisibility = async (isPublic: boolean) => {
        try {
            await toggleVisibility({ threadId, isPublic });
            toast.success(`Thread made ${isPublic ? "public" : "private"}`);
        } catch (error) {
            toast.error("Failed to update thread visibility");
        }
    };

    const copyPublicLink = async () => {
        if (threadAccess?.publicAccessToken) {
            const publicLink = `${window.location.origin}/thread/${threadAccess.publicAccessToken}`;
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
            case "admin": return "destructive";
            case "write": return "default";
            case "read": return "secondary";
            default: return "secondary";
        }
    };

    if (!threadAccess) {
        return <div>Loading...</div>;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Share Thread
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="access" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="access">Access</TabsTrigger>
                        <TabsTrigger value="invites">Invites</TabsTrigger>
                        <TabsTrigger value="public">Public</TabsTrigger>
                    </TabsList>

                    <TabsContent value="access" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    People with Access
                                </CardTitle>
                                <CardDescription>
                                    Manage who has access to this thread
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {threadAccess.users.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">
                                        No additional users have access to this thread.
                                    </p>
                                ) : (
                                    threadAccess.users.map((user) => (
                                        <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src="" />
                                                    <AvatarFallback>
                                                        {user.name?.[0] || user.email[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {user.name || user.email}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getPermissionColor(user.permission)}>
                                                    {user.permission}
                                                </Badge>
                                                {threadAccess.isOwner && (
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                if (confirm(`Are you sure you want to remove ${user.name || user.email} from this thread?`)) {
                                                                    handleRemoveAccess(user.userId);
                                                                }
                                                            }}
                                                            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="invites" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Create Invite
                                </CardTitle>
                                <CardDescription>
                                    Invite someone to access this thread
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter email address"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="permission">Permission Level</Label>
                                    <Select value={invitePermission} onValueChange={(value: any) => setInvitePermission(value)}>
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
                                    <Select value={expirationType} onValueChange={(value: any) => setExpirationType(value)}>
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
                                            type="number"
                                            min="1"
                                            value={customHours}
                                            onChange={(e) => setCustomHours(parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                )}

                                <Button onClick={handleCreateInvite} className="w-full">
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
                                        <div key={invite._id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium text-sm">{invite.invitedEmail}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Expires: {formatExpirationTime(invite.expiresAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getPermissionColor(invite.permission)}>
                                                    {invite.permission}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRevokeInvite(invite._id)}
                                                    className="text-destructive hover:text-destructive"
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

                    <TabsContent value="public" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    Public Access
                                </CardTitle>
                                <CardDescription>
                                    Make this thread publicly accessible via a link
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Public Access</p>
                                        <p className="text-sm text-muted-foreground">
                                            Anyone with the link can view this thread
                                        </p>
                                    </div>
                                    <Switch
                                        checked={threadAccess.isPublic}
                                        onCheckedChange={handleToggleVisibility}
                                        disabled={!threadAccess.isOwner}
                                    />
                                </div>

                                {threadAccess.isPublic && threadAccess.publicAccessToken && (
                                    <div className="space-y-2">
                                        <Label>Public Link</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={`${window.location.origin}/thread/${threadAccess.publicAccessToken}`}
                                                readOnly
                                            />
                                            <Button variant="outline" onClick={copyPublicLink}>
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
}