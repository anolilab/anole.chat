import { api } from "@anole/convex/api";
import { Button } from "@anole/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@anole/ui/components/dropdown-menu";
import { Badge } from "@anole/ui/components/badge";
import { useLingui } from "@lingui/react/macro";
import { useQuery } from "convex/react";
import { ChevronDown, Tag } from "lucide-react";
import type { FC } from "react";

interface ThreadTagFilterProps {
    selectedTag?: string;
    onTagChange: (tag?: string) => void;
}

const ThreadTagFilter: FC<ThreadTagFilterProps> = ({ selectedTag, onTagChange }) => {
    const { t } = useLingui();
    const userTags = useQuery(api.chat.functions.getUserTags);

    if (!userTags) {
        return null;
    }

    // Add "chat" as default tag and "All" option
    const allTags = [
        { name: "All", usageCount: 0 },
        { name: "chat", usageCount: 0 },
        ...userTags.filter(tag => tag.name !== "chat")
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    className="border-white/20 text-xs text-white hover:bg-white/10 data-[active]:bg-white/20 flex items-center gap-1"
                    size="sm"
                    variant="outline"
                >
                    <Tag className="h-3 w-3" />
                    {selectedTag ? (
                        <Badge variant="secondary" className="text-xs">
                            {selectedTag}
                        </Badge>
                    ) : (
                        t`All Tags`
                    )}
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
                {allTags.map((tag) => (
                    <DropdownMenuItem
                        key={tag.name}
                        onClick={() => {
                            if (tag.name === "All") {
                                onTagChange(undefined);
                            } else {
                                onTagChange(tag.name);
                            }
                        }}
                        className="flex items-center justify-between"
                    >
                        <span>{tag.name}</span>
                        {tag.usageCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                                {tag.usageCount}
                            </Badge>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ThreadTagFilter;