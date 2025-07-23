import cn from "@anole/ui/utils/cn";
import { TriangleAlertIcon, VariableIcon, XIcon } from "lucide-react";

export const VariableMentionItem = ({
    className,
    nodeName,
    notFound,
    onRemove,
    path,
    type,
}: {
    className?: string;
    nodeName: string;
    notFound?: boolean;
    onRemove?: () => void;
    path: string[];
    type?: string;
}) => (
    <div
        className={cn(
            notFound ? "hover:ring-destructive" : "hover:ring-blue-500",
            "ring-border bg-background flex items-center gap-1 rounded-sm px-2 py-1 text-xs ring",
            className,
        )}
    >
        {notFound ? <TriangleAlertIcon className="text-destructive size-2.5" /> : <VariableIcon className="size-2.5 text-blue-500" />}
        {type ? <span className="text-muted-foreground text-xs">{type}</span> : null}
        <span>
            {nodeName}
            /
        </span>

        <span className={cn(notFound ? "text-destructive" : "text-blue-500", "min-w-0 flex-1 truncate")}>{path.join(".")}</span>
        {onRemove ? <XIcon className="text-muted-foreground size-2.5 cursor-pointer" onClick={onRemove} /> : null}
    </div>
);
