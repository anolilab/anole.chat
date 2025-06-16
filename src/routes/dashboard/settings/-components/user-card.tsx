"use client";

import CopyButton from "@/components/copy-button";
import { PasswordInput } from "@/components/password-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useNavigate } from "@tanstack/react-router";
import { Laptop, Loader2, LogOut, PhoneIcon, QrCode, ShieldCheck, ShieldOff } from "lucide-react";

import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { UAParser } from "ua-parser-js";
import { AddPasskey } from "./add-passkey";
import { ChangePassword } from "./change-password";
import { ChangeUser } from "./change-user";
import { LanguageSwitch } from "./language-switch";
import { ListPasskeys } from "./list-passkeys";
import { authClient } from "@/features/auth/lib/client";
import { useLogout } from "@/features/auth/hooks/auth-hooks";

export default function UserCard(props: { activeSessions: AuthClient["$Infer"]["Session"]["session"][] }) {
    const { t } = useLingui();
    const logout = useLogout();
    const navigate = useNavigate();
    const { data: session } = authClient.useSession();
    const [isTerminating, setIsTerminating] = useState<string>();
    const [isPendingTwoFa, setIsPendingTwoFa] = useState<boolean>(false);
    const [twoFaPassword, setTwoFaPassword] = useState<string>("");
    const [twoFactorDialog, setTwoFactorDialog] = useState<boolean>(false);
    const [twoFactorVerifyURI, setTwoFactorVerifyURI] = useState<string>("");
    const [emailVerificationPending, setEmailVerificationPending] = useState<boolean>(false);

    return (
        <div className="flex w-full flex-1 p-4">
            <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t`User`}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-8">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="hidden h-9 w-9 sm:flex">
                                <AvatarImage src={session?.user.image || "#"} alt="Avatar" className="object-cover" />
                                <AvatarFallback>{session?.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1">
                                <p className="text-sm leading-none font-medium">{session?.user.name}</p>
                                <p className="text-sm">{session?.user.email}</p>
                            </div>
                        </div>
                        <ChangeUser />
                    </div>

                    {session?.user.emailVerified ? null : (
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col gap-2">
                                <AlertTitle>{t`Verify Email`}</AlertTitle>
                                <AlertDescription className="text-muted-foreground">{t`Please verify your email address to access all features`}</AlertDescription>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="mt-2"
                                    onClick={async () => {
                                        await authClient.sendVerificationEmail(
                                            {
                                                email: session?.user.email || "",
                                            },
                                            {
                                                onRequest(context) {
                                                    setEmailVerificationPending(true);
                                                },
                                                onError(context) {
                                                    toast.error(context.error.message);
                                                    setEmailVerificationPending(false);
                                                },
                                                onSuccess() {
                                                    toast.success("Verification email sent successfully");
                                                    setEmailVerificationPending(false);
                                                },
                                            },
                                        );
                                    }}
                                >
                                    {emailVerificationPending ? <Loader2 size={15} className="animate-spin" /> : t`Resend Verification`}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex w-max flex-col gap-1 border-l-2 px-2">
                        <p className="text-xs font-medium">{t`Active Sessions`}</p>
                        {props?.activeSessions
                            ?.filter((item) => item.userAgent)
                            .map((item) => {
                                return (
                                    <div key={item.id}>
                                        <div className="flex items-center gap-2 text-sm font-medium text-black dark:text-white">
                                            {new UAParser(item.userAgent || "").getDevice().type === "mobile" ? <PhoneIcon /> : <Laptop size={16} />}
                                            {new UAParser(item.userAgent || "").getOS().name}, {new UAParser(item.userAgent || "").getBrowser().name}
                                            <Button
                                                variant="outline"
                                                className="min-w-[100px] cursor-pointer"
                                                onClick={async () => {
                                                    setIsTerminating(item.id);
                                                    const res = await authClient.revokeSession({
                                                        token: item.token,
                                                    });

                                                    if (res.error) {
                                                        toast.error(res.error.message);
                                                    } else {
                                                        toast.success("Session terminated successfully");
                                                    }
                                                    if (item.id === session?.session?.id) {
                                                        await authClient.signOut({
                                                            fetchOptions: {
                                                                onSuccess() {
                                                                    setIsTerminating(undefined);
                                                                    // apply delay
                                                                    setTimeout(() => {
                                                                        navigate({ to: "/" });
                                                                    }, 1000);
                                                                },
                                                            },
                                                        });
                                                    }
                                                    setIsTerminating(undefined);
                                                }}
                                            >
                                                {isTerminating === item.id ? (
                                                    <Loader2 size={15} className="animate-spin" />
                                                ) : item.id === session?.session?.id ? (
                                                    t`Sign Out`
                                                ) : (
                                                    t`Terminate`
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-y py-4">
                        <div className="flex flex-col gap-2">
                            <p className="text-sm">{t`Passkeys`}</p>
                            <div className="flex flex-wrap gap-2">
                                <AddPasskey />
                                <ListPasskeys />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="text-sm">{t`Two Factor`}</p>
                            <div className="flex gap-2">
                                {!!session?.user.twoFactorEnabled && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="gap-2">
                                                <QrCode size={16} />
                                                <span className="text-xs md:text-sm">{t`Scan QR Code`}</span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="w-11/12 sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>{t`Scan QR Code`}</DialogTitle>
                                                <DialogDescription>{t`Scan this QR code with your authenticator app`}</DialogDescription>
                                            </DialogHeader>

                                            {twoFactorVerifyURI ? (
                                                <>
                                                    <div className="flex items-center justify-center">
                                                        <QRCode value={twoFactorVerifyURI} />
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <p className="text-muted-foreground text-sm">{t`Copy URI`}</p>
                                                        <CopyButton textToCopy={twoFactorVerifyURI} />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col gap-2">
                                                    <PasswordInput
                                                        value={twoFaPassword}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTwoFaPassword(e.target.value)}
                                                        placeholder={t`Enter Password`}
                                                    />
                                                    <Button
                                                        onClick={async () => {
                                                            if (twoFaPassword.length < 8) {
                                                                toast.error("Password must be at least 8 characters");
                                                                return;
                                                            }
                                                            await authClient.twoFactor.getTotpUri(
                                                                {
                                                                    password: twoFaPassword,
                                                                },
                                                                {
                                                                    onSuccess(context) {
                                                                        setTwoFactorVerifyURI(context.data.totpURI);
                                                                    },
                                                                },
                                                            );
                                                            setTwoFaPassword("");
                                                        }}
                                                    >
                                                        {t`Show QR Code`}
                                                    </Button>
                                                </div>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                )}
                                <Dialog open={twoFactorDialog} onOpenChange={setTwoFactorDialog}>
                                    <DialogTrigger asChild>
                                        <Button variant={session?.user.twoFactorEnabled ? "destructive" : "outline"} className="gap-2">
                                            {session?.user.twoFactorEnabled ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                                            <span className="text-xs md:text-sm">{session?.user.twoFactorEnabled ? t`Disable 2FA` : t`Enable 2FA`}</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-11/12 sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>{session?.user.twoFactorEnabled ? t`Disable 2FA` : t`Enable 2FA`}</DialogTitle>
                                            <DialogDescription>
                                                {session?.user.twoFactorEnabled
                                                    ? t`Disable two-factor authentication for your account`
                                                    : t`Enable two-factor authentication for enhanced security`}
                                            </DialogDescription>
                                        </DialogHeader>

                                        {twoFactorVerifyURI ? (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-center">
                                                    <QRCode value={twoFactorVerifyURI} />
                                                </div>
                                                <Label htmlFor="password">{t`Scan this QR code with your authenticator app`}</Label>
                                                <Input value={twoFaPassword} onChange={(e) => setTwoFaPassword(e.target.value)} placeholder={t`Enter OTP`} />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="password">{t`Password`}</Label>
                                                <PasswordInput
                                                    id="password"
                                                    placeholder={t`Password`}
                                                    value={twoFaPassword}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTwoFaPassword(e.target.value)}
                                                />
                                            </div>
                                        )}
                                        <DialogFooter>
                                            <Button
                                                disabled={isPendingTwoFa}
                                                onClick={async () => {
                                                    if (twoFaPassword.length < 8 && !twoFactorVerifyURI) {
                                                        toast.error("Password must be at least 8 characters");
                                                        return;
                                                    }
                                                    setIsPendingTwoFa(true);
                                                    if (session?.user.twoFactorEnabled) {
                                                        const res = await authClient.twoFactor.disable({
                                                            //@ts-ignore
                                                            password: twoFaPassword,
                                                            fetchOptions: {
                                                                onError(context) {
                                                                    toast.error(context.error.message);
                                                                },
                                                                onSuccess() {
                                                                    toast("2FA disabled successfully");
                                                                    setTwoFactorDialog(false);
                                                                },
                                                            },
                                                        });
                                                    } else {
                                                        if (twoFactorVerifyURI) {
                                                            await authClient.twoFactor.verifyTotp({
                                                                code: twoFaPassword,
                                                                fetchOptions: {
                                                                    onError(context) {
                                                                        setIsPendingTwoFa(false);
                                                                        setTwoFaPassword("");
                                                                        toast.error(context.error.message);
                                                                    },
                                                                    onSuccess() {
                                                                        toast("2FA enabled successfully");
                                                                        setTwoFactorVerifyURI("");
                                                                        setIsPendingTwoFa(false);
                                                                        setTwoFaPassword("");
                                                                        setTwoFactorDialog(false);
                                                                    },
                                                                },
                                                            });
                                                            return;
                                                        }
                                                        const res = await authClient.twoFactor.enable({
                                                            password: twoFaPassword,
                                                            fetchOptions: {
                                                                onError(context) {
                                                                    toast.error(context.error.message);
                                                                },
                                                                onSuccess(ctx) {
                                                                    setTwoFactorVerifyURI(ctx.data.totpURI);
                                                                },
                                                            },
                                                        });
                                                    }
                                                    setIsPendingTwoFa(false);
                                                    setTwoFaPassword("");
                                                }}
                                            >
                                                {isPendingTwoFa ? (
                                                    <Loader2 size={15} className="animate-spin" />
                                                ) : session?.user.twoFactorEnabled ? (
                                                    t`Disable 2FA`
                                                ) : (
                                                    t`Enable 2FA`
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="items-center justify-between gap-2">
                    <ChangePassword />
                    <Button
                        className="z-10 gap-2"
                        variant="secondary"
                        onClick={async () => {
                            // setIsSignOut(true);
                            // await authClient.signOut({
                            //   fetchOptions: {
                            //     onSuccess() {
                            //       navigate({ to: "/" });
                            //     },
                            //   },
                            // });
                            // setIsSignOut(false);
                            logout.mutate();
                        }}
                        disabled={logout.isPending}
                    >
                        <span className="text-sm">
                            {logout.isPending ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <LogOut size={16} />
                                    {t`Sign Out`}
                                </div>
                            )}
                        </span>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
