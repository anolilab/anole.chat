"use client";

import { Button } from "@anole/ui/components/button";
import { ExamplePlaceholder } from "@anole/ui/components/example-placeholder";
import { Input } from "@anole/ui/components/input";
import { Label } from "@anole/ui/components/label";
import { Skeleton } from "@anole/ui/components/skeleton";
import { Textarea } from "@anole/ui/components/textarea";
import { useLingui } from "@lingui/react/macro";
import { authClient } from "auth/client";
import { fetcher } from "lib/utils";
import { AlertCircle, ArrowLeft, Loader } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { useMcpList } from "@/hooks/queries/use-mcp-list";
import { useObjectState } from "@/hooks/use-object-state";
import type { MCPServerInfo } from "@/types/mcp";
import type { UserPreferences } from "@/types/user";

import { McpServerCustomizationContent } from "../mcp-customization-popup";

export const UserInstructionsContent = () => {
    const { t } = useLingui();

    const responseStyleExamples = useMemo(
        () => [
            t`Chat.ChatPreferences.responseStyleExample1`,
            t`Chat.ChatPreferences.responseStyleExample2`,
            t`Chat.ChatPreferences.responseStyleExample3`,
            t`Chat.ChatPreferences.responseStyleExample4`,
        ],
        [],
    );

    const professionExamples = useMemo(
        () => [
            t`Chat.ChatPreferences.professionExample1`,
            t`Chat.ChatPreferences.professionExample2`,
            t`Chat.ChatPreferences.professionExample3`,
            t`Chat.ChatPreferences.professionExample4`,
            t`Chat.ChatPreferences.professionExample5`,
        ],
        [],
    );

    const { data: session } = authClient.useSession();

    const [preferences, setPreferences] = useObjectState<UserPreferences>({
        displayName: "",
        profession: "",
        responseStyleExample: "",
    });

    const {
        data,
        isLoading,
        isValidating,
        mutate: fetchPreferences,
    } = useSWR<UserPreferences>("/api/user/preferences", fetcher, {
        dedupingInterval: 0,
        fallback: {},
        onSuccess: (data) => {
            setPreferences(data);
        },
    });

    const [isSaving, setIsSaving] = useState(false);

    const savePreferences = async () => {
        setIsSaving(true);
        let ok = false;

        try {
            await fetch("/api/user/preferences", {
                body: JSON.stringify(preferences),
                method: "PUT",
            });
            await fetchPreferences();
            ok = true;
        } catch {
            ok = false;
        } finally {
            setIsSaving(false);

            if (ok)
                toast.success(t`Chat.ChatPreferences.preferencesSaved`);
            else toast.error(t`Chat.ChatPreferences.failedToSavePreferences`);
        }
    };

    const isDiff = useMemo(() => {
        if ((data?.displayName || "") !== (preferences.displayName || ""))
            return true;

        if ((data?.profession || "") !== (preferences.profession || ""))
            return true;

        if ((data?.responseStyleExample || "") !== (preferences.responseStyleExample || ""))
            return true;

        return false;
    }, [preferences, data]);

    return (
        <div className="flex flex-col">
            <h3 className="text-xl font-semibold">{t`Chat.ChatPreferences.userInstructions`}</h3>
            <p className="text-muted-foreground py-2 pb-6 text-sm">{t`Chat.ChatPreferences.userInstructionsDescription`}</p>

            <div className="flex w-full flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <Label>{t`Chat.ChatPreferences.whatShouldWeCallYou`}</Label>
                    {isLoading
                        ? (
                            <Skeleton className="h-9" />
                        )
                        : (
                            <Input
                                onChange={(e) => {
                                    setPreferences({
                                        displayName: e.target.value,
                                    });
                                }}
                                placeholder={session?.user.name || ""}
                                value={preferences.displayName}
                            />
                        )}
                </div>

                <div className="text-foreground flex flex-1 flex-col gap-2">
                    <Label>{t`Chat.ChatPreferences.whatBestDescribesYourWork`}</Label>
                    <div className="relative w-full">
                        {isLoading
                            ? (
                                <Skeleton className="h-9" />
                            )
                            : (
                                <>
                                    <Input
                                        onChange={(e) => {
                                            setPreferences({
                                                profession: e.target.value,
                                            });
                                        }}
                                        value={preferences.profession}
                                    />
                                    {(preferences.profession?.length ?? 0) === 0 && (
                                        <div className="pointer-events-none absolute top-0 left-0 h-full w-full px-4 py-2">
                                            <ExamplePlaceholder placeholder={professionExamples} />
                                        </div>
                                    )}
                                </>
                            )}
                    </div>
                </div>
                <div className="text-foreground flex flex-col gap-2">
                    <Label>{t`Chat.ChatPreferences.whatPersonalPreferencesShouldBeTakenIntoAccountInResponses`}</Label>
                    <span className="text-muted-foreground text-xs" />
                    <div className="relative w-full">
                        {isLoading
                            ? (
                                <Skeleton className="h-60" />
                            )
                            : (
                                <>
                                    <Textarea
                                        className="h-60 resize-none"
                                        onChange={(e) => {
                                            setPreferences({
                                                responseStyleExample: e.target.value,
                                            });
                                        }}
                                        value={preferences.responseStyleExample}
                                    />
                                    {(preferences.responseStyleExample?.length ?? 0) === 0 && (
                                        <div className="pointer-events-none absolute top-0 left-0 h-full w-full px-4 py-2">
                                            <ExamplePlaceholder placeholder={responseStyleExamples} />
                                        </div>
                                    )}
                                </>
                            )}
                    </div>
                </div>
            </div>
            {isDiff && !isValidating && (
                <div className="fade-in animate-in flex items-center justify-end pt-4 duration-300">
                    <Button variant="ghost">{t`Common.cancel`}</Button>
                    <Button disabled={isSaving || isLoading} onClick={savePreferences}>
                        {t`Common.save`}
                        {isSaving && <Loader className="ml-2 size-4 animate-spin" />}
                    </Button>
                </div>
            )}
        </div>
    );
};

export const MCPInstructionsContent = () => {
    const { t } = useLingui();
    const [search, setSearch] = useState("");
    const [mcpServer, setMcpServer] = useState<(MCPServerInfo & { id: string }) | null>(null);

    const { data: mcpList, isLoading } = useMcpList({
        dedupingInterval: 0,
    });

    if (mcpServer) {
        return (
            <McpServerCustomizationContent
                mcpServerInfo={mcpServer}
                title={(
                    <div className="flex flex-col">
                        <button
                            className="text-muted-foreground hover:text-foreground mb-8 flex items-center gap-2 text-sm transition-colors"
                            onClick={() => setMcpServer(null)}
                        >
                            <ArrowLeft className="size-3" />
                            {t`Common.back`}
                        </button>
                        {mcpServer.name}
                    </div>
                )}
            />
        );
    }

    return (
        <div className="flex flex-col">
            <h3 className="text-xl font-semibold">{t`Chat.ChatPreferences.mcpInstructions`}</h3>
            <p className="text-muted-foreground py-2 pb-6 text-sm">{t`Chat.ChatPreferences.mcpInstructionsDescription`}</p>

            <div className="flex w-full flex-col gap-6">
                <div className="text-foreground flex flex-1 flex-col gap-2">
                    <Input
                        onChange={(e) => {
                            setSearch(e.target.value);
                        }}
                        placeholder={t`Common.search`}
                        value={search}
                    />
                </div>
                <div className="text-foreground flex flex-1 flex-col gap-2">
                    {isLoading
                        ? Array.from({ length: 10 }).map((_, index) => <Skeleton className="h-14" key={index} />)
                        : mcpList.length === 0
                            ? (
                                <div className="text-foreground flex flex-1 flex-col gap-2">
                                    <p className="text-muted-foreground py-8 text-center">{t`MCP.configureYourMcpServerConnectionSettings`}</p>
                                </div>
                            )
                            : (
                                <div className="flex gap-2">
                                    {mcpList.map((mcp) => (
                                        <Button key={mcp.id} onClick={() => setMcpServer({ ...mcp, id: mcp.id })} size="lg" variant="outline">
                                            <p>{mcp.name}</p>
                                            {mcp.error
                                                ? (
                                                    <AlertCircle className="text-destructive size-3.5" />
                                                )
                                                : mcp.status === "loading"
                                                    ? (
                                                        <Loader className="size-3.5 animate-spin" />
                                                    )
                                                    : null}
                                        </Button>
                                    ))}
                                </div>
                            )}
                </div>
            </div>
        </div>
    );
};
