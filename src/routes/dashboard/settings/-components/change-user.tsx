"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useRouter } from "@tanstack/react-router";
import { Edit, Loader2, X } from "lucide-react";

import { useSession } from "@/hooks/auth-hooks";
import { convertImageToBase64 } from "@/lib/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function ChangeUser() {
    const { t } = useTranslation();
    const { data } = useSession();
    const [name, setName] = useState<string>();
    const router = useRouter();
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    const [open, setOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2" variant="secondary">
                    <Edit size={13} />
                    {t("EDIT_USER")}
                </Button>
            </DialogTrigger>
            <DialogContent className="w-11/12 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("EDIT_USER")}</DialogTitle>
                    <DialogDescription>{t("EDIT_USER_DESC")}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                    <Label htmlFor="name">{t("FULL_NAME")}</Label>
                    <Input
                        id="name"
                        type="name"
                        placeholder={data?.user.name}
                        required
                        onChange={(e) => {
                            setName(e.target.value);
                        }}
                    />
                    <div className="grid gap-2">
                        <Label htmlFor="image">{t("PROFILE_IMAGE")}</Label>
                        <div className="flex items-end gap-4">
                            {imagePreview && (
                                <div className="relative h-16 w-16 overflow-hidden rounded-sm">
                                    <img src={imagePreview} alt="Profile preview" className="h-full w-full object-cover" />
                                </div>
                            )}
                            <div className="flex w-full items-center gap-2">
                                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="text-muted-foreground w-full" />
                                {imagePreview && (
                                    <X
                                        className="cursor-pointer"
                                        onClick={() => {
                                            setImage(null);
                                            setImagePreview(null);
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        disabled={isLoading}
                        onClick={async () => {
                            setIsLoading(true);
                            await authClient.updateUser({
                                image: image ? await convertImageToBase64(image) : undefined,
                                name: name ? name : undefined,
                                fetchOptions: {
                                    onSuccess: () => {
                                        toast.success("User updated successfully");
                                    },
                                    onError: (error) => {
                                        toast.error(error.error.message);
                                    },
                                },
                            });
                            setName("");
                            router.invalidate();
                            setImage(null);
                            setImagePreview(null);
                            setIsLoading(false);
                            setOpen(false);
                        }}
                    >
                        {isLoading ? <Loader2 size={15} className="animate-spin" /> : t("UPDATE")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
