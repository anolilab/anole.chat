"use client";

import { Button } from "@anole/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@anole/ui/components/card";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@anole/ui/components/dialog";
import { Label } from "@anole/ui/components/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@anole/ui/components/tabs";
import { Textarea } from "@anole/ui/components/textarea";
import { useLingui } from "@lingui/react/macro";
import type { JSONSchema7 } from "json-schema";
import { notify } from "lib/notify";
import { errorToString, validateSchema } from "lib/utils";
import { CodeIcon, FileTextIcon, PencilIcon, PlusIcon, TrashIcon, VariableIcon, WandSparklesIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { convertJsonSchemaToZod } from "zod-from-json-schema";

import { generateObjectAction } from "@/app/api/chat/actions";
import { safe } from "@/lib/safe-async";
import type { ObjectJsonSchema7 } from "@/types/util";

import { defaultObjectJsonSchema } from "../../lib/workflow/shared.workflow";
import { appStore } from "../../store";
import type { Feild } from "../edit-json-schema-field-popup";
import { EditJsonSchemaFieldPopup } from "../edit-json-schema-field-popup";
import { SelectModel } from "../select-model";

type SchemaEditMode = "simple" | "advanced";

interface OutputSchemaEditorProperties {
    children: React.ReactNode;
    onChange: (schema: ObjectJsonSchema7) => void;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
    schema?: ObjectJsonSchema7;
}

const isObjectJsonSchema7 = (schema: any): schema is ObjectJsonSchema7 => {
    if (!schema)
        return false;

    return schema.type === "object";
};

const placeholderJsonSchema = `{
  "type": "object",
  "properties": {
    "result": {
      "type": "string",
      "description": "The result of the operation"
    },
    "status": {
      "type": "number",
      "description": "HTTP status code"
    },
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {"type": "string"}
        },
        "count": {"type": "number"}
      }
    }
  },
  "required": ["result", "status"]
}`;

export const OutputSchemaEditor = ({ children, onChange, onOpenChange, open, schema }: OutputSchemaEditorProperties) => {
    const { t } = useLingui();
    const [mode, setMode] = useState<SchemaEditMode>("simple");
    const [localSchema, setLocalSchema] = useState<ObjectJsonSchema7>(structuredClone(defaultObjectJsonSchema));
    const [advancedJson, setAdvancedJson] = useState("");

    const fields = useMemo(() => {
        const properties = localSchema.properties || {};

        return Object.entries(properties).map(([key, value]) => {
            return {
                defaultValue: (value as any).default,
                description: (value as any).description,
                enum: (value as any).enum,
                key,
                required: localSchema.required?.includes(key) || false,
                type: getFieldType(value),
            };
        });
    }, [localSchema]);

    const handleSave = () => {
        const isDirectTab = mode === "advanced";

        if (isDirectTab) {
            const isValid = validate(advancedJson);

            if (!isValid)
                return;
        }

        onChange(isDirectTab ? JSON.parse(advancedJson) : localSchema);
        onOpenChange?.(false);
    };

    const validate = useCallback(
        (json: string): boolean =>
            safe(() => JSON.parse(json) as ObjectJsonSchema7)
                .map((s) => {
                    if (!isObjectJsonSchema7(s))
                        throw new Error("Root schema must be an object");

                    validateSchema("answer", s);
                    convertJsonSchemaToZod(s); // for checking if the schema is valid

                    return true;
                })
                .ifFail((e) => {
                    toast.error(errorToString(e));

                    return false;
                })
                .orElse(false),
        [],
    );

    const handleGenerateWithAI = useCallback(async () => {
        let model = appStore.getState().chatModel;
        const result = await notify.prompt({
            description: (
                <div className="flex items-center gap-2">
                    <p className="mr-auto whitespace-pre-wrap">
                        {/* t`Workflow.describeOutputDataRequest`, {
                            eg: "{\"name\": \"John\", \"age\": 30}",
                        } */}
                    </p>
                    <SelectModel
                        onSelect={(m) => {
                            model = m;
                        }}
                    />
                </div>
            ),
            title: t`Generate Schema with AI`,
        });

        if (!result)
            return;

        toast.promise(
            generateObjectAction({
                model,
                prompt: {
                    system: `You are an expert JSON Schema Draft 7 generator for workflow automation systems.

Your task is to generate a comprehensive JSON Schema based on the user's input. Handle two types of input:

1. **Example JSON Data**: If the user provides JSON data, analyze it and generate a schema that validates that structure.

2. **Natural Language Description**: If the user describes what they want (not JSON), follow these steps:
   - First, identify the main data class/entity from their description
   - Think about what properties this entity should have
   - Consider realistic data types and structure for that domain
   - Generate an appropriate JSON Schema for that concept

Key Guidelines:
- The root schema type is ALWAYS "object" (workflow nodes output object data by default)
- Include meaningful "description" fields for each property
- Mark essential fields as "required" based on context
- Use appropriate JSON Schema data types: string, number, boolean, array, object
- For arrays, create proper "items" schemas
- For nested objects, create proper "properties" definitions
- Focus on creating schemas that enable rich data flow between workflow nodes

Examples:

JSON Data Input: {"name": "John", "age": 25}
Output: {
  "type": "object",
  "properties": {
    "name": {"type": "string", "description": "Person's name"},
    "age": {"type": "number", "description": "Person's age"}
  },
  "required": ["name", "age"]
}

Natural Language Input: "User profile data"
Output: {
  "type": "object",
  "properties": {
    "id": {"type": "string", "description": "Unique user identifier"},
    "name": {"type": "string", "description": "User's full name"},
    "email": {"type": "string", "description": "User's email address"},
    "createdAt": {"type": "string", "description": "Account creation timestamp"}
  },
  "required": ["id", "name", "email"]
}

Return ONLY the JSON Schema object - no explanations or markdown formatting.`,
                    user: result,
                },
                schema: {
                    additionalProperties: true,
                    description: "JSON Schema7",
                    properties: {},
                    type: "object",
                },
            }).then((res) => {
                setAdvancedJson(JSON.stringify(res, null, 2));
            }),
            {
                error: t`Failed to generate schema`,
                loading: t`Generating JSON Schema with AI...`,
                success: t`JSON Schema generated successfully!`,
            },
        );
    }, [t]);

    const updateField = useCallback(
        (index: number, field: Feild) => {
            const newProperties = { ...localSchema.properties };
            const oldKey = fields[index]?.key;

            if (oldKey && oldKey !== field.key) {
                delete newProperties[oldKey];
            }

            newProperties[field.key] = {
                type: field.type,
                ...field.description && { description: field.description },
                ...field.enum && { enum: field.enum },
                ...field.defaultValue !== undefined && {
                    default: field.defaultValue,
                },
            };

            const newRequired = localSchema.required?.filter((key) => key !== oldKey) || [];

            if (field.required && !newRequired.includes(field.key)) {
                newRequired.push(field.key);
            }

            setLocalSchema({
                ...localSchema,
                properties: newProperties,
                required: newRequired.length > 0 ? newRequired : undefined,
            });
        },
        [fields, localSchema],
    );

    const removeField = useCallback(
        (key: string) => {
            const newProperties = { ...localSchema.properties };

            delete newProperties[key];

            const newRequired = localSchema.required?.filter((k) => k !== key);

            setLocalSchema({
                ...localSchema,
                properties: newProperties,
                required: newRequired?.length ? newRequired : undefined,
            });
        },
        [localSchema],
    );

    useEffect(() => {
        if (open) {
            const is = isObjectJsonSchema7(schema);

            setLocalSchema(is ? schema : structuredClone(defaultObjectJsonSchema));
            setMode("simple");
            setAdvancedJson(is ? JSON.stringify(schema, null, 2) : "");
        }
    }, [open, schema]);

    return (
        <Dialog onOpenChange={onOpenChange} open={open}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>{t`Output Schema Editor`}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <Tabs className="flex h-full flex-col" onValueChange={(v) => setMode(v as SchemaEditMode)} value={mode}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger className="flex items-center gap-2" value="simple">
                                <FileTextIcon className="h-4 w-4" />
                                Simple
                            </TabsTrigger>
                            <TabsTrigger className="flex items-center gap-2" value="advanced">
                                <CodeIcon className="h-4 w-4" />
                                JSON Schema
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-4 min-h-80 flex-1 overflow-hidden">
                            <TabsContent className="h-full overflow-y-auto" value="simple">
                                <Card className="border-none bg-transparent">
                                    <CardHeader className="sr-only">
                                        <CardTitle>Schema Fields</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 px-0!">
                                        {fields.map((field, index) => (
                                            <div className="flex items-center rounded-lg border px-4 py-2" key={field.key || index}>
                                                <VariableIcon className="size-4 text-blue-500" />
                                                <div className="flex flex-1 items-center gap-2 text-sm">
                                                    <div className="text-muted-foreground w-12">{field.type}</div>
                                                    <div>
                                                        <span className="truncate font-medium">{field.key || "unnamed"}</span>
                                                        {field.required && <span className="text-destructive ml-1">*</span>}
                                                    </div>
                                                </div>
                                                {["boolean", "number", "string"].includes(field.type) && (
                                                    <EditJsonSchemaFieldPopup field={field} onChange={(updatedField) => updateField(index, updatedField)}>
                                                        <Button size="icon" variant="ghost">
                                                            <PencilIcon />
                                                        </Button>
                                                    </EditJsonSchemaFieldPopup>
                                                )}

                                                <Button className="hover:text-destructive" onClick={() => removeField(field.key)} size="icon" variant="ghost">
                                                    <TrashIcon />
                                                </Button>
                                            </div>
                                        ))}

                                        <EditJsonSchemaFieldPopup
                                            onChange={(field) => {
                                                const newProperties = { ...localSchema.properties };

                                                newProperties[field.key] = {
                                                    type: field.type,
                                                    ...field.description && {
                                                        description: field.description,
                                                    },
                                                    ...field.enum && { enum: field.enum },
                                                    ...field.defaultValue !== undefined && {
                                                        default: field.defaultValue,
                                                    },
                                                };

                                                const newRequired = localSchema.required || [];

                                                if (field.required && !newRequired.includes(field.key)) {
                                                    newRequired.push(field.key);
                                                }

                                                setLocalSchema({
                                                    ...localSchema,
                                                    properties: newProperties,
                                                    required: newRequired.length > 0 ? newRequired : undefined,
                                                });
                                            }}
                                        >
                                            <Button className="w-full border-dashed" variant="outline">
                                                <PlusIcon className="mr-2" />
                                                {t`Add Field`}
                                            </Button>
                                        </EditJsonSchemaFieldPopup>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent className="h-full overflow-y-auto" value="advanced">
                                <Card className="border-none bg-transparent">
                                    <CardHeader>
                                        <CardTitle>JSON Schema Editor</CardTitle>
                                        <CardDescription className="text-muted-foreground text-sm">{t`Direct JSON Schema editing with AI assistance. Supports complex nested structures and arrays.`}</CardDescription>
                                    </CardHeader>

                                    <CardContent className="px-0">
                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <Label htmlFor="advanced-json">JSON Schema (Draft 7)</Label>
                                                <Button onClick={handleGenerateWithAI} size="sm" variant="outline">
                                                    <WandSparklesIcon className="mr-2 size-3.5" />
                                                    {t`Generate With AI`}
                                                </Button>
                                            </div>
                                            <Textarea
                                                className="max-h-[400px] min-h-[300px] resize-none overflow-y-auto font-mono text-sm"
                                                id="advanced-json"
                                                onChange={(e) => setAdvancedJson(e.target.value)}
                                                placeholder={placeholderJsonSchema}
                                                value={advancedJson}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">{t`Cancel`}</Button>
                    </DialogClose>
                    <Button onClick={handleSave}>{t`Save Schema`}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Helper functions
function getFieldType(schema: JSONSchema7): "string" | "number" | "boolean" {
    if (schema.type === "string" && schema.enum)
        return "string"; // enum is treated as string

    return (schema.type as "string" | "number" | "boolean") || "string";
}
