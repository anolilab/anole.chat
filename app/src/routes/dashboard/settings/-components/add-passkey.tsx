"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Fingerprint, Loader2, Plus } from "lucide-react";

import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
import { toast } from "sonner";
import { authClient } from "@/features/auth/lib/client";

export function AddPasskey() {
    const { t } = useLingui();
    const [isOpen, setIsOpen] = useState(false);
    const [passkeyName, setPasskeyName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAddPasskey = async () => {
        if (!passkeyName) {
            toast.error("Passkey name is required");
            return;
        }
        setIsLoading(true);
        const res = await authClient.passkey.addPasskey({
            name: passkeyName,
        });
        if (res?.error) {
            toast.error(res?.error.message);
        } else {
            setIsOpen(false);
            toast.success("Passkey added successfully. You can now use it to login.");
        }
        setIsLoading(false);
    };
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-xs md:text-sm">
                    <Plus size={15} />
                    {t`Add New Passkey`}
                </Button>
            </DialogTrigger>
            <DialogContent className="w-11/12 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t`Add New Passkey`}</DialogTitle>
                    <DialogDescription>{t`Create a new passkey to securely access your account without a password.`}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                    <Label htmlFor="passkey-name">{t`Passkey Name`}</Label>
                    <Input id="passkey-name" value={passkeyName} onChange={(e) => setPasskeyName(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button disabled={isLoading} type="submit" onClick={handleAddPasskey} className="w-full">
                        {isLoading ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <>
                                <Fingerprint className="mr-2 h-4 w-4" />
                                {t`Create Passkey`}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
