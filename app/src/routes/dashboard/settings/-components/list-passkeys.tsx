"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Fingerprint, Loader2, Trash } from "lucide-react";

import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";

export function ListPasskeys() {
    const { t } = useLingui();

    const { data } = authClient.useListPasskeys();
    const [isOpen, setIsOpen] = useState(false);
    const [passkeyName, setPasskeyName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDeletePasskey, setIsDeletePasskey] = useState<boolean>(false);

    const handleAddPasskey = async () => {
        if (!passkeyName) {
            toast.error("Passkey name is required");
            return;
        }
        setIsLoading(true);
        const res = await authClient.passkey.addPasskey({
            name: passkeyName,
        });
        setIsLoading(false);
        if (res?.error) {
            toast.error(res?.error.message);
        } else {
            toast.success("Passkey added successfully. You can now use it to login.");
        }
    };
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="text-xs md:text-sm">
                    <Fingerprint className="mr-2 h-4 w-4" />
                    <span>
                        {t`Passkeys`} {data?.length ? `[${data?.length}]` : ""}
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="w-11/12 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t`Passkeys`}</DialogTitle>
                    <DialogDescription>{t`Manage your passkeys for secure authentication`}</DialogDescription>
                </DialogHeader>
                {data?.length ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t`Name`}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((passkey) => (
                                <TableRow key={passkey.id} className="flex items-center justify-between">
                                    <TableCell>{passkey.name || t`New Passkey`}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            onClick={async () => {
                                                const res = await authClient.passkey.deletePasskey({
                                                    id: passkey.id,
                                                    fetchOptions: {
                                                        onRequest: () => {
                                                            setIsDeletePasskey(true);
                                                        },
                                                        onSuccess: () => {
                                                            toast("Passkey deleted successfully");
                                                            setIsDeletePasskey(false);
                                                        },
                                                        onError: (error) => {
                                                            toast.error(error.error.message);
                                                            setIsDeletePasskey(false);
                                                        },
                                                    },
                                                });
                                            }}
                                        >
                                            {isDeletePasskey ? (
                                                <Loader2 size={15} className="animate-spin" />
                                            ) : (
                                                <Trash size={15} className="cursor-pointer text-red-600" />
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-muted-foreground text-sm">{t`No passkeys found`}</p>
                )}
                {!data?.length && (
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="passkey-name" className="text-sm">
                                {t`New Passkey`}
                            </Label>
                            <Input id="passkey-name" value={passkeyName} onChange={(e) => setPasskeyName(e.target.value)} placeholder={t`New Passkey`} />
                        </div>
                        <Button type="submit" onClick={handleAddPasskey} className="w-full">
                            {isLoading ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <>
                                    <Fingerprint className="mr-2 h-4 w-4" />
                                    {t`Create Passkey`}
                                </>
                            )}
                        </Button>
                    </div>
                )}
                <DialogFooter>
                    <Button onClick={() => setIsOpen(false)}>{t`Close`}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
