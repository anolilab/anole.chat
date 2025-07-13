import * as React from "react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./alert-dialog";

interface ConfirmDialogProperties {
    cancelLabel?: string;
    confirmLabel?: string;
    description?: string;
    loading?: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
    title: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProperties> = ({
    cancelLabel = "Cancel",
    confirmLabel = "Confirm",
    description,
    loading,
    onConfirm,
    onOpenChange,
    open,
    title,
}) => (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
                <AlertDialogAction
                    aria-busy={loading}
                    disabled={loading}
                    onClick={onConfirm}
                >
                    {confirmLabel}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
);
