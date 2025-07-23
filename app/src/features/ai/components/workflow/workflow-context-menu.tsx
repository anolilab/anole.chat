"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@anole/ui/components/dropdown-menu";
import { useLingui } from "@lingui/react/macro";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { safe } from "ts-safe";

import type { DBWorkflow } from "@/types/workflow";

import { EditWorkflowPopup } from "./edit-workflow-popup";

interface WorkflowContextMenuProperties {
    children: React.ReactNode;
    workflow: Pick<DBWorkflow, "id" | "name" | "description" | "icon" | "isPublished" | "visibility">;
}

export const WorkflowContextMenu = (properties: WorkflowContextMenuProperties) => {
    const [editOpen, setEditOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const { t } = useLingui();
    const handleDeleteWorkflow = async () => {
        toast.promise(
            safe(() =>
                fetch(`/api/workflow/${properties.workflow.id}`, {
                    method: "DELETE",
                }),
            )
                .ifOk(() => {
                    mutate("/api/workflow");
                    setOpen(false);
                })
                .unwrap(),
            {
                loading: t`Common.deleting`,
                success: t`Common.success`,
            },
        );
    };

    return (
        <>
            <DropdownMenu onOpenChange={setOpen} open={open}>
                <DropdownMenuTrigger asChild>{properties.children}</DropdownMenuTrigger>
                <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => setEditOpen(true)}>
                        <PencilIcon className="size-3.5" />
                        {t`Common.edit`}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="cursor-pointer text-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWorkflow();
                        }}
                        variant="destructive"
                    >
                        <Trash2Icon className="size-3.5" />
                        {t`Common.delete`}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <EditWorkflowPopup defaultValue={properties.workflow} onOpenChange={setEditOpen} open={editOpen} submitAfterRoute={false} />
        </>
    );
};
