import { Button } from "@anole/ui/components/button";
import { Checkbox } from "@anole/ui/components/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@anole/ui/components/dialog";
import { Input } from "@anole/ui/components/input";
import { Label } from "@anole/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@anole/ui/components/select";
import { Switch } from "@anole/ui/components/switch";
import { useLingui } from "@lingui/react/macro";
import type { JSONSchema7 } from "json-schema";
import { cleanVariableName } from "lib/utils";
import { CheckIcon, CopyCheckIcon, HashIcon, PlusIcon, TrashIcon, TypeIcon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type FieldType = "string" | "number" | "boolean";
export type Feild = {
    defaultValue?: string | number | boolean;
    description?: string;
    enum?: string[];
    key: string;
    required?: boolean;
    type: FieldType;
};

type Properties = {
    children: React.ReactNode;
    defaultOpen?: boolean;
    editAbleKey?: boolean;
    field?: Feild;
    onChange?: (field: Feild) => void;
};

const _defaultField: Feild = {
    key: "",
    type: "string",
};

export const EditJsonSchemaFieldPopup = ({ children, defaultOpen = false, editAbleKey = true, field: defaultField, onChange }: Properties) => {
    const { t } = useLingui();
    const [open, setOpen] = useState<boolean>(defaultOpen ?? false);
    const [field, setField] = useState<Feild>(defaultField ?? _defaultField);

    const handleSave = useCallback(() => {
        if (!field.key || !field.type)
            return toast.warning("Please enter a key and type");

        if (field.enum) {
            if (!field.enum?.length)
                return toast.warning("Please enter at least one option");

            if (field.enum.some((item) => !item))
                return toast.warning("Please enter a valid option");
        }

        onChange?.(field);
        setOpen(false);
    }, [field, onChange]);

    useEffect(() => {
        setField(defaultField ?? _defaultField);
    }, [defaultField]);

    useEffect(() => {
        setField(defaultField ?? _defaultField);
    }, [open]);

    return (
        <Dialog onOpenChange={setOpen} open={open}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="flex flex-col" hideClose>
                <DialogHeader>
                    <DialogTitle>{t`Field Editor`}</DialogTitle>
                    <DialogDescription />
                </DialogHeader>
                <div className="max-h-[80vh] overflow-y-auto">
                    <EditJsonSchemaFieldContent editAbleKey={editAbleKey} field={field} onChange={setField} />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">{t`Cancel`}</Button>
                    </DialogClose>
                    <Button onClick={handleSave}>{t`Save`}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const getFieldKey = (schema: JSONSchema7) => {
    if (schema.type === "string" && schema.enum)
        return "enum";

    return schema.type!;
};

export const EditJsonSchemaFieldContent = ({
    editAbleKey = true,
    field,
    onChange,
}: {
    editAbleKey?: boolean;
    field: Feild;
    onChange: Dispatch<SetStateAction<Feild>>;
}) => {
    const { t } = useLingui();
    const fieldTypes = useMemo(
        () => [
            {
                icon: TypeIcon,
                key: "string",
                label: "String",
                type: "string" as FieldType,
            },
            {
                icon: HashIcon,
                key: "number",
                label: "Number",
                type: "number" as FieldType,
            },
            {
                icon: CheckIcon,
                key: "boolean",
                label: "Boolean",
                type: "boolean" as FieldType,
            },
            {
                icon: CopyCheckIcon as any,
                key: "enum",
                label: "Enum",
                type: "string" as FieldType,
            },
        ],
        [],
    );

    const handleAddEnumValue = useCallback(() => {
        const currentEnum = field.enum ?? [];

        onChange((previous) => {
            return {
                ...previous,
                enum: [...currentEnum, ""],
            };
        });
    }, [field.enum, onChange]);

    const handleRemoveEnumValue = useCallback(
        (index: number) => {
            const currentEnum = field.enum ?? [];

            onChange((previous) => {
                return {
                    ...previous,
                    enum: currentEnum.filter((_, index_) => index_ !== index),
                };
            });
        },
        [field.enum, onChange],
    );

    const handleUpdateEnumValue = useCallback(
        (index: number, value: string) => {
            const currentEnum = field.enum ?? [];
            const newEnum = [...currentEnum];

            newEnum[index] = value;
            onChange((previous) => {
                return {
                    ...previous,
                    enum: newEnum,
                };
            });
        },
        [field.enum, onChange],
    );

    const currentFieldKey = useMemo(() => {
        if (field.type === "string" && field.enum) {
            return "enum";
        }

        return field.type;
    }, [field]);

    return (
        <div className="flex flex-col gap-6">
            {/* Field Type */}
            <div className="flex flex-col gap-2">
                <Label>Field Type</Label>
                <div className="my-2 grid grid-cols-2 gap-3">
                    {fieldTypes.map((fieldType) => (
                        <div
                            className={`hover:bg-accent/50 flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                                currentFieldKey === fieldType.key ? "border-primary bg-primary/5" : "border-border"
                            }`}
                            key={fieldType.key}
                            onClick={() =>
                                onChange((previous) => {
                                    return {
                                        ...previous,
                                        enum: fieldType.type === "string" && fieldType.key === "enum" ? [] : undefined,
                                        type: fieldType.type,
                                    };
                                })}
                        >
                            <fieldType.icon className="size-6" />
                            <span className="font-medium">{fieldType.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="field-key">{t`Variable Name`}</Label>
                <Input
                    className="bg-secondary border-none"
                    disabled={!editAbleKey}
                    id="field-key"
                    maxLength={30}
                    onChange={(e) =>
                        onChange((previous) => {
                            return {
                                ...previous,
                                key: cleanVariableName(e.target.value),
                            };
                        })}
                    placeholder={t`Enter variable name...`}
                    value={field.key ?? ""}
                />
            </div>

            {/* Enum Values (only show if type is enum) */}
            {field.enum && (
                <div className="flex flex-col gap-2">
                    <Label>{t`Options`}</Label>
                    <div className="flex flex-col gap-2">
                        {(field.enum ?? []).map((value, index) => (
                            <div className="bg-secondary/50 group flex items-center gap-2 rounded-md border p-1" key={index}>
                                <Input
                                    className="flex-1 border-none bg-transparent shadow-none"
                                    onChange={(e) => handleUpdateEnumValue(index, e.target.value)}
                                    value={value}
                                />
                                <Button
                                    className="hover:bg-destructive/10! text-muted-foreground hover:text-destructive"
                                    onClick={() => handleRemoveEnumValue(index)}
                                    size="icon"
                                    type="button"
                                    variant="ghost"
                                >
                                    <TrashIcon />
                                </Button>
                            </div>
                        ))}
                        <Button className="rounded-md border border-dashed" onClick={handleAddEnumValue} size="lg" type="button" variant="ghost">
                            <PlusIcon className="size-4" />
                            <span>{t`Add Option`}</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Field Description */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                            <Label htmlFor="field-description">{t`Description`}</Label>
        <span className="text-muted-foreground text-xs">{t`Optional`}</span>
                </div>
                <Input
                    className="bg-secondary border-none"
                    id="field-description"
                    onChange={(e) =>
                        onChange((previous) => {
                            return { ...previous, description: e.target.value };
                        })}
                    placeholder={t`Enter field description...`}
                    value={field.description ?? ""}
                />
            </div>

            {/* Default Value */}
            <div className="flex flex-col gap-2">
                <div className="mb-2 flex items-center gap-2">
                            <Label htmlFor="field-default">{t`Default Value`}</Label>
        <span className="text-muted-foreground text-xs">{t`Optional`}</span>
                </div>
                {field.type === "boolean" ? (
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={field.defaultValue === true}
                            id="field-default-boolean"
                            onCheckedChange={(checked) =>
                                onChange((previous) => {
                                    return {
                                        ...previous,
                                        defaultValue: checked === true,
                                    };
                                })}
                        />
                        <Label htmlFor="field-default-boolean">Default to true</Label>
                    </div>
                ) : field.enum ? (
                    <Select
                        defaultValue={field.defaultValue?.toString()}
                        onValueChange={(value) =>
                            onChange((previous) => {
                                return { ...previous, defaultValue: value };
                            })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={t`Select option...`} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.enum?.filter((item) => item).length
                                ? field.enum.filter(Boolean).map((option, index) => (
                                    <SelectItem key={index} textValue={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))
                                : (
                                    <div className="text-muted-foreground p-2 text-xs">{t`Empty`}</div>
                                )}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        className="bg-secondary border-none"
                        id="field-default"
                        onChange={(e) => {
                            const value = field.type === "number" ? e.target.value ? Number(e.target.value) : undefined : e.target.value || undefined;

                            onChange((previous) => {
                                return { ...previous, defaultValue: value };
                            });
                        }}
                        /*
                                placeholder={t`Enter default {type} value...`, {
                                    type: field.type,
                                }}
                                */
                        type={field.type === "number" ? "number" : "text"}
                        value={field.defaultValue?.toString() ?? ""}
                    />
                )}
            </div>

            {/* Required Checkbox */}
            <div className="flex items-center space-x-2">
                <Checkbox
                    checked={field.required ?? false}
                    id="field-required"
                    onCheckedChange={(checked) =>
                        onChange((previous) => {
                            return {
                                ...previous,
                                required: checked === true,
                            };
                        })}
                />
                <Label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="field-required">
                    {t`Required`}
                </Label>
            </div>
        </div>
    );
};
