import { api } from "@anole/convex/api";
import { Badge } from "@anole/ui/components/badge";
import { Button } from "@anole/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@anole/ui/components/dropdown-menu";
import { Input } from "@anole/ui/components/input";
import { useLingui } from "@lingui/react/macro";
import { useMutation, useQuery } from "convex/react";
import { ChevronDown, Plus, Tag } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";

import { showError, showSuccess } from "@/lib/toast";

interface ThreadTagEditorProperties {
    currentTags?: string[];
    onTagsUpdated?: (newTags: string[]) => void;
    threadId: string;
}

const ThreadTagEditor: FC<ThreadTagEditorProperties> = ({ currentTags = ["chat"], onTagsUpdated, threadId }) => {
    const { t } = useLingui();
    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const userTags = useQuery(api.chat.functions.getUserTags);
    const updateThreadTags = useMutation(api.chat.functions.updateThreadTags);
    const addThreadTag = useMutation(api.chat.functions.addThreadTag);
    const removeThreadTag = useMutation(api.chat.functions.removeThreadTag);
    const createTag = useMutation(api.chat.functions.createTag);

    if (!userTags) {
        return null;
    }

    // Add "chat" as default tag
    const allTags = [{ name: "chat", usageCount: 0 }, ...userTags.filter((tag) => tag.name !== "chat")];

    const handleTagToggle = async (tagName: string) => {
        try {
            if (currentTags.includes(tagName)) {
                await removeThreadTag({ tag: tagName, threadId });
                const newTags = currentTags.filter((t) => t !== tagName);

                onTagsUpdated?.(newTags);
                showSuccess(t`Removed tag "${tagName}"`);
            } else {
                await addThreadTag({ tag: tagName, threadId });
                const newTags = [...currentTags, tagName];

                onTagsUpdated?.(newTags);
                showSuccess(t`Added tag "${tagName}"`);
            }
        } catch (error) {
            showError(t`Failed to update thread tags: ${error}`);
        }
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim())
            return;

        try {
            await createTag({ name: newTagName.trim() });
            await addThreadTag({ tag: newTagName.trim(), threadId });
            const newTags = [...currentTags, newTagName.trim()];

            onTagsUpdated?.(newTags);
            setNewTagName("");
            setIsCreatingTag(false);
            showSuccess(t`Created and applied tag "${newTagName.trim()}"`);
        } catch (error) {
            showError(t`Failed to create tag: ${error}`);
        }
    };

    return (
        <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
            <DropdownMenuTrigger asChild>
                <Button className="h-6 px-2 py-1 text-xs hover:bg-white/10" size="sm" variant="ghost">
                    <Tag className="mr-1 h-3 w-3" />
                    <div className="flex flex-wrap gap-1">
                        {currentTags.map((tag) => (
                            <Badge className="text-xs" key={tag} variant="secondary">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                    <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
                {allTags.map((tag) => (
                    <DropdownMenuItem className="flex items-center justify-between" key={tag.name} onClick={() => handleTagToggle(tag.name)}>
                        <div className="flex items-center gap-2">
                            <input
                                checked={currentTags.includes(tag.name)}
                                className="h-3 w-3"
                                onChange={() => {}} // Handled by onClick
                                type="checkbox"
                            />
                            <span>{tag.name}</span>
                        </div>
                        {tag.usageCount > 0 && (
                            <Badge className="text-xs" variant="outline">
                                {tag.usageCount}
                            </Badge>
                        )}
                    </DropdownMenuItem>
                ))}

                <DropdownMenuItem className="flex items-center gap-2" onClick={() => setIsCreatingTag(true)}>
                    <Plus className="h-3 w-3" />
                    <span>{t`Create new tag`}</span>
                </DropdownMenuItem>

                {isCreatingTag && (
                    <div className="border-t p-2">
                        <Input
                            autoFocus
                            className="mb-2 text-xs"
                            onChange={(e) => setNewTagName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleCreateTag();
                                } else if (e.key === "Escape") {
                                    setIsCreatingTag(false);
                                    setNewTagName("");
                                }
                            }}
                            placeholder={t`Enter tag name`}
                            value={newTagName}
                        />
                        <div className="flex gap-1">
                            <Button className="text-xs" disabled={!newTagName.trim()} onClick={handleCreateTag} size="sm">
                                {t`Create`}
                            </Button>
                            <Button
                                className="text-xs"
                                onClick={() => {
                                    setIsCreatingTag(false);
                                    setNewTagName("");
                                }}
                                size="sm"
                                variant="outline"
                            >
                                {t`Cancel`}
                            </Button>
                        </div>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ThreadTagEditor;
