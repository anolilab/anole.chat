"use client";

import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { Loader2 } from "lucide-react";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function ChangePassword() {
    const { t } = useTranslation();
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);
    const [signOutDevices, setSignOutDevices] = useState<boolean>(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="z-10 gap-2" variant="outline" size="sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M2.5 18.5v-1h19v1zm.535-5.973l-.762-.442l.965-1.693h-1.93v-.884h1.93l-.965-1.642l.762-.443L4 9.066l.966-1.643l.761.443l-.965 1.642h1.93v.884h-1.93l.965 1.693l-.762.442L4 10.835zm8 0l-.762-.442l.966-1.693H9.308v-.884h1.93l-.965-1.642l.762-.443L12 9.066l.966-1.643l.761.443l-.965 1.642h1.93v.884h-1.93l.965 1.693l-.762.442L12 10.835zm8 0l-.762-.442l.966-1.693h-1.931v-.884h1.93l-.965-1.642l.762-.443L20 9.066l.966-1.643l.761.443l-.965 1.642h1.93v.884h-1.93l.965 1.693l-.762.442L20 10.835z"
                        ></path>
                    </svg>
                    <span className="text-muted-foreground text-sm">{t("CHANGE_PASSWORD")}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="w-11/12 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("CHANGE_PASSWORD")}</DialogTitle>
                    <DialogDescription>{t("CHANGE_PASSWORD_DESC")}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                    <Label htmlFor="current-password">{t("CURRENT_PASSWORD")}</Label>
                    <PasswordInput
                        id="current-password"
                        value={currentPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder={t("PASSWORD")}
                    />
                    <Label htmlFor="new-password">{t("NEW_PASSWORD")}</Label>
                    <PasswordInput
                        value={newPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder={t("NEW_PASSWORD")}
                    />
                    <Label htmlFor="password">{t("CONFIRM_PASSWORD")}</Label>
                    <PasswordInput
                        value={confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder={t("CONFIRM_PASSWORD")}
                    />
                    <div className="flex items-center gap-2">
                        <Checkbox onCheckedChange={(checked) => (checked ? setSignOutDevices(true) : setSignOutDevices(false))} />
                        <p className="text-sm">{t("SIGN_OUT_DEVICES")}</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={async () => {
                            if (newPassword !== confirmPassword) {
                                toast.error("Passwords do not match");
                                return;
                            }
                            if (newPassword.length < 8) {
                                toast.error("Password must be at least 8 characters");
                                return;
                            }
                            setLoading(true);
                            const res = await authClient.changePassword({
                                newPassword: newPassword,
                                currentPassword: currentPassword,
                                revokeOtherSessions: signOutDevices,
                            });
                            setLoading(false);
                            if (res.error) {
                                toast.error(res.error.message || "Couldn't change your password! Make sure it's correct");
                            } else {
                                setOpen(false);
                                toast.success("Password changed successfully");
                                setCurrentPassword("");
                                setNewPassword("");
                                setConfirmPassword("");
                            }
                        }}
                    >
                        {loading ? <Loader2 size={15} className="animate-spin" /> : t("CHANGE_PASSWORD")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
