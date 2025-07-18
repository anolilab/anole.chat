import { api } from "@anole/convex/api";
import { Button } from "@anole/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@anole/ui/components/dropdown-menu";
import { Input } from "@anole/ui/components/input";
import { Badge } from "@anole/ui/components/badge";
import { useLingui } from "@lingui/react/macro";
import { useQuery, useMutation } from "convex/react";
import { ChevronDown, Tag, Plus } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";

interface ThreadTagEditorProps {
    threadId: string;
    currentTags?: string[];
    onTagsUpdated?: (newTags: string[]) => void;
}

const ThreadTagEditor: FC<ThreadTagEditorProps> = ({ threadId, currentTags = ["chat"], onTagsUpdated }) => {
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
    const allTags = [
        { name: "chat", usageCount: 0 },
        ...userTags.filter(tag => tag.name !== "chat")
    ];

    const handleTagToggle = async (tagName: string) => {
        try {
            if (currentTags.includes(tagName)) {
                await removeThreadTag({ threadId, tag: tagName });
                const newTags = currentTags.filter(t => t !== tagName);
                onTagsUpdated?.(newTags);
                showSuccess(t`Removed tag "${tagName}"`);
            } else {
                await addThreadTag({ threadId, tag: tagName });
                const newTags = [...currentTags, tagName];
                onTagsUpdated?.(newTags);
                showSuccess(t`Added tag "${tagName}"`);
            }
        } catch (error) {
            showError(t`Failed to update thread tags: ${error}`);
        }
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        
        try {
            await createTag({ name: newTagName.trim() });
            await addThreadTag({ threadId, tag: newTagName.trim() });
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
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 py-1 text-xs hover:bg-white/10"
                >
                    <Tag className="h-3 w-3 mr-1" />
                    <div className="flex flex-wrap gap-1">
                        {currentTags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                    <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
                {allTags.map((tag) => (
                    <DropdownMenuItem
                        key={tag.name}
                        onClick={() => handleTagToggle(tag.name)}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={currentTags.includes(tag.name)}
                                onChange={() => {}} // Handled by onClick
                                className="h-3 w-3"
                            />
                            <span>{tag.name}</span>
                        </div>
                        {tag.usageCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                                {tag.usageCount}
                            </Badge>
                        )}
                    </DropdownMenuItem>
                ))}
                
                <DropdownMenuItem
                    onClick={() => setIsCreatingTag(true)}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-3 w-3" />
                    <span>{t`Create new tag`}</span>
                </DropdownMenuItem>
                
                {isCreatingTag && (
                    <div className="p-2 border-t">
                        <Input
                            autoFocus
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder={t`Enter tag name`}
                            className="text-xs mb-2"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleCreateTag();
                                } else if (e.key === "Escape") {
                                    setIsCreatingTag(false);
                                    setNewTagName("");
                                }
                            }}
                        />
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                onClick={handleCreateTag}
                                disabled={!newTagName.trim()}
                                className="text-xs"
                            >
                                {t`Create`}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setIsCreatingTag(false);
                                    setNewTagName("");
                                }}
                                className="text-xs"
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
