"use client"

import { Loader2 } from "lucide-react"
import { type ComponentProps, useContext } from "react"
import * as z from "zod"

import { useLang } from "../../../hooks/use-lang"
import { AuthUIContext } from "../../../lib/auth-ui-provider"
import { getLocalizedError } from "../../../lib/utils"
import { cn } from "@/lib/utils"
import type { AuthLocalization } from "../../../localization/auth-localization"
import type { Refetch } from "../../../types/hook-integration-types"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { useAppForm } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import type { SettingsCardClassNames } from "../shared/settings-card"

interface CreateAPIKeyDialogProps extends ComponentProps<typeof Dialog> {
    classNames?: SettingsCardClassNames
    localization?: AuthLocalization
    onSuccess: (key: string) => void
    refetch?: Refetch
}

export function CreateAPIKeyDialog({
    classNames,
    localization,
    onSuccess,
    refetch,
    onOpenChange,
    ...props
}: CreateAPIKeyDialogProps) {
    const {
        authClient,
        apiKey,
        localization: contextLocalization,
        toast
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }

    const { lang } = useLang()

    const formSchema = z.object({
        name: z
            .string()
            .min(1, `${localization.NAME} ${localization.IS_REQUIRED}`),
        expiresInDays: z.string().optional()
    })

    const form = useAppForm({
        defaultValues: {
            name: "",
            expiresInDays: "none"
        },
        validators: {
            onChange: ({ value }) => formSchema.safeParse(value)
        },
        onSubmit: async ({ value }) => {
            try {
                const expiresIn =
                    value.expiresInDays && value.expiresInDays !== "none"
                        ? Number.parseInt(value.expiresInDays) * 60 * 60 * 24
                        : undefined

                const result = await authClient.apiKey.create({
                    name: value.name,
                    expiresIn,
                    prefix: typeof apiKey === "object" ? apiKey.prefix : undefined,
                    metadata:
                        typeof apiKey === "object" ? apiKey.metadata : undefined,
                    fetchOptions: { throw: true }
                })

                await refetch?.()
                onSuccess(result.key)
                onOpenChange?.(false)
                form.reset()
            } catch (error) {
                toast({
                    variant: "error",
                    message: getLocalizedError({ error, localization })
                })
            }
        }
    })

    const rtf = new Intl.RelativeTimeFormat(lang ?? "en")

    return (
        <Dialog onOpenChange={onOpenChange} {...props}>
            <DialogContent
                onOpenAutoFocus={(e) => e.preventDefault()}
                className={classNames?.dialog?.content}
            >
                <DialogHeader className={classNames?.dialog?.header}>
                    <DialogTitle
                        className={cn("text-lg md:text-xl", classNames?.title)}
                    >
                        {localization.CREATE_API_KEY}
                    </DialogTitle>

                    <DialogDescription
                        className={cn(
                            "text-xs md:text-sm",
                            classNames?.description
                        )}
                    >
                        {localization.CREATE_API_KEY_DESCRIPTION}
                    </DialogDescription>
                </DialogHeader>

                <form.AppForm>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            form.handleSubmit()
                        }}
                        className="space-y-6"
                    >
                        <div className="flex gap-4">
                            <form.AppField
                                name="name"
                                children={(field) => (
                                    <field.FormItem className="flex-1">
                                        <field.FormLabel
                                            className={classNames?.label}
                                        >
                                            {localization.NAME}
                                        </field.FormLabel>

                                        <field.FormControl>
                                            <Input
                                                className={classNames?.input}
                                                placeholder={
                                                    localization.API_KEY_NAME_PLACEHOLDER
                                                }
                                                autoFocus
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                            />
                                        </field.FormControl>

                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            />

                            <form.AppField
                                name="expiresInDays"
                                children={(field) => (
                                    <field.FormItem>
                                        <field.FormLabel
                                            className={classNames?.label}
                                        >
                                            {localization.EXPIRES}
                                        </field.FormLabel>

                                        <Select
                                            onValueChange={field.handleChange}
                                            value={field.state.value}
                                        >
                                            <field.FormControl>
                                                <SelectTrigger
                                                    className={
                                                        classNames?.input
                                                    }
                                                >
                                                    <SelectValue
                                                        placeholder={
                                                            localization.NO_EXPIRATION
                                                        }
                                                    />
                                                </SelectTrigger>
                                            </field.FormControl>

                                            <SelectContent>
                                                <SelectItem value="none">
                                                    {localization.NO_EXPIRATION}
                                                </SelectItem>

                                                <SelectItem value="7">
                                                    {rtf.format(7, "day")}
                                                </SelectItem>

                                                <SelectItem value="30">
                                                    {rtf.format(30, "day")}
                                                </SelectItem>

                                                <SelectItem value="90">
                                                    {rtf.format(90, "day")}
                                                </SelectItem>

                                                <SelectItem value="180">
                                                    {rtf.format(180, "day")}
                                                </SelectItem>

                                                <SelectItem value="365">
                                                    {rtf.format(365, "day")}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className={classNames?.dialog?.footer}>
                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                                children={([canSubmit, isSubmitting]) => (
                                    <Button
                                        type="submit"
                                        disabled={!canSubmit}
                                        className={classNames?.button}
                                    >
                                        {isSubmitting && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {localization.CREATE_API_KEY}
                                    </Button>
                                )}
                            />
                        </DialogFooter>
                    </form>
                </form.AppForm>
            </DialogContent>
        </Dialog>
    )
}
