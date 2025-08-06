"use client";

import { Alert, AlertDescription, AlertTitle } from "@anole/ui/components/alert";
import { handleErrorWithToast } from "@anole/ui/components/shared-toast";
import { useLingui } from "@lingui/react/macro";
import { debounce } from "@tanstack/react-pacer";
import { useNavigate } from "@tanstack/react-router";
import { safeJSONParse } from "lib/utils";
import { Loader } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { z } from "zod/v4";

import { existMcpClientByServerNameAction } from "@/app/api/mcp/actions";
import type { MCPServerConfig } from "@/types/mcp";
import { MCPRemoteConfigZodSchema, MCPStdioConfigZodSchema } from "@/types/mcp";

import { isMaybeMCPServerConfig, isMaybeRemoteConfig } from "../../lib/mcp/is-mcp-config";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import JsonView from "./ui/json-view";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface MCPEditorProperties {
    id?: string;
    initialConfig?: MCPServerConfig;
    name?: string;
}

const STDIO_ARGS_ENV_PLACEHOLDER = `/** STDIO Example */
{
  "command": "node",
  "args": ["index.js"],
  "env": {
    "OPENAI_API_KEY": "sk-...",
  }
}

/** SSE,Streamable HTTP Example */
{
  "url": "https://api.example.com",
  "headers": {
    "Authorization": "Bearer sk-..."
  }
}`;

export default function MCPEditor({ id, initialConfig, name: initialName }: MCPEditorProperties) {
    const { t } = useLingui();
    const shouldInsert = useMemo(() => id === null || id === undefined, [id]);

    const [isLoading, setIsLoading] = useState(false);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [nameError, setNameError] = useState<string | null>(null);

    const errorDebounce = useMemo(
        () => (function_: () => void, delay: number) => {
            const debouncedFunction = debounce(function_, { wait: delay });

            debouncedFunction();
        },
        [],
    );

    // State for form fields
    const [name, setName] = useState<string>(initialName ?? "");
    const navigate = useNavigate();
    const [config, setConfig] = useState<MCPServerConfig>(initialConfig as MCPServerConfig);
    const [jsonString, setJsonString] = useState<string>(initialConfig ? JSON.stringify(initialConfig, null, 2) : "");

    // Name validation schema
    const nameSchema = z.string().regex(/^[a-z0-9\-]+$/i, {
        message: t`Name must contain only alphanumeric characters (A-Z, a-z, 0-9) and hyphens (-)`,
    });

    const validateName = (nameValue: string): boolean => {
        const result = nameSchema.safeParse(nameValue);

        if (!result.success) {
            setNameError(t`Name must contain only alphanumeric characters (A-Z, a-z, 0-9) and hyphens (-)`);

            return false;
        }

        setNameError(null);

        return true;
    };

    const saveDisabled = useMemo(
        () => name.trim() === "" || isLoading || !!jsonError || !!nameError || !isMaybeMCPServerConfig(config),
        [isLoading, jsonError, nameError, config, name],
    );

    // Validate
    const validateConfig = (jsonConfig: unknown): boolean => {
        const result = isMaybeRemoteConfig(jsonConfig) ? MCPRemoteConfigZodSchema.safeParse(jsonConfig) : MCPStdioConfigZodSchema.safeParse(jsonConfig);

        if (!result.success) {
            handleErrorWithToast(result.error, "mcp-editor-error");
        }

        return result.success;
    };

    // Handle save button click
    const handleSave = async () => {
        // Perform validation
        if (!validateConfig(config))
            return;

        if (!name) {
            return handleErrorWithToast(new Error(t`Name is required`), "mcp-editor-error");
        }

        if (!validateName(name)) {
            return handleErrorWithToast(new Error(t`Name must contain only alphanumeric characters (A-Z, a-z, 0-9) and hyphens (-)`), "mcp-editor-error");
        }

        setIsLoading(true);

        try {
            if (shouldInsert) {
                const exist = await existMcpClientByServerNameAction(name);

                if (exist)
                    throw new Error(t`Name already exists`);
            }

            const res = await fetch("/api/mcp", {
                body: JSON.stringify({ config, id, name }),
                method: "POST",
            });

            if (!res.ok) {
                const error = await res.json();

                throw error;
            }

            toast.success(t`Configuration saved successfully`);
            mutate("/api/mcp/list");
            navigate({ to: "/mcp" });
        } catch (error) {
            handleErrorWithToast(error, "mcp-editor-error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfigChange = (data: string) => {
        setJsonString(data);
        const result = safeJSONParse(data);

        errorDebounce.clear();

        if (result.success) {
            setConfig(result.value as MCPServerConfig);
            setJsonError(null);
        } else if (data.trim() !== "") {
            errorDebounce(() => {
                setJsonError((result.error as Error)?.message ?? JSON.stringify(result.error, null, 2));
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col space-y-6">
            {/* Name field */}
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>

                <Input
                    className={nameError ? "border-destructive" : ""}
                    disabled={!shouldInsert}
                    id="name"
                    onChange={(e) => {
                        setName(e.target.value);

                        if (e.target.value)
                            validateName(e.target.value);
                    }}
                    placeholder={t`Enter MCP server name`}
                    value={name}
                />
                {nameError && <p className="text-destructive text-xs">{nameError}</p>}
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="config">Config</Label>
                </div>

                {/* Split view for config editor */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Left side: Textarea for editing */}
                    <div className="space-y-2">
                        <Textarea
                            className="h-[40vh] resize-none overflow-y-auto font-mono"
                            id="config-editor"
                            onChange={(e) => handleConfigChange(e.target.value)}
                            placeholder={STDIO_ARGS_ENV_PLACEHOLDER}
                            value={jsonString}
                        />
                    </div>

                    {/* Right side: JSON view */}
                    <div className="hidden space-y-2 sm:block">
                        <div className="border-input bg-secondary relative h-[40vh] overflow-auto rounded-md border p-4">
                            <Label className="text-muted-foreground mb-2 text-xs" htmlFor="config-view">
                                preview
                            </Label>
                            <JsonView data={config} initialExpandDepth={3} />
                            {jsonError && jsonString && (
                                <div className="animate-in fade-in-0 absolute right-0 bottom-0 w-full px-2 pb-2 duration-300">
                                    <Alert className="border-destructive" variant="destructive">
                                        <AlertTitle className="text-xs font-semibold">Parsing Error</AlertTitle>
                                        <AlertDescription className="text-xs">{jsonError}</AlertDescription>
                                    </Alert>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Save button */}
            <Button className="w-full" disabled={saveDisabled} onClick={handleSave}>
                {isLoading ? <Loader className="size-4 animate-spin" /> : <span className="font-bold">{t`Save Configuration`}</span>}
            </Button>
        </div>
    );
}
