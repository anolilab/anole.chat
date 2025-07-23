import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X } from "lucide-react";
import type { ArtifactContent, Suggestion } from "../../types/artifacts";

export function TextEditor({
    content,
    suggestions,
    isCurrentVersion,
    currentVersionIndex,
    status,
    onSaveContent,
    isReadonly,
}: ArtifactContent<{ suggestions: Suggestion[] }>) {
    const [localContent, setLocalContent] = useState(content);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setLocalContent(content);
    }, [content]);

    const handleSave = () => {
        onSaveContent(localContent, false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setLocalContent(content);
        setIsEditing(false);
    };

    const handleSuggestionAccept = (suggestion: Suggestion) => {
        // TODO: Implement suggestion acceptance logic
        console.log("Accept suggestion:", suggestion);
    };

    const handleSuggestionReject = (suggestion: Suggestion) => {
        // TODO: Implement suggestion rejection logic
        console.log("Reject suggestion:", suggestion);
    };

    if (status === "streaming") {
        return (
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Text Document</h3>
                    <Badge variant="secondary">Streaming...</Badge>
                </div>
                <Card>
                    <CardContent className="p-4">
                        <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap font-mono text-sm">
                                {localContent}
                                {status === "streaming" && (
                                    <span className="animate-pulse">▋</span>
                                )}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Text Document</h3>
                <div className="flex items-center space-x-2">
                    {!isCurrentVersion && (
                        <Badge variant="outline">
                            Version {currentVersionIndex + 1}
                        </Badge>
                    )}
                    {!isReadonly && (
                        <Button
                            variant={isEditing ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? "View" : "Edit"}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <Card>
                        <CardContent className="p-4">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <Textarea
                                        value={localContent}
                                        onChange={(e) => setLocalContent(e.target.value)}
                                        placeholder="Enter your text here..."
                                        className="min-h-[400px] resize-none"
                                    />
                                    <div className="flex justify-end space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancel}
                                        >
                                            Cancel
                                        </Button>
                                        <Button size="sm" onClick={handleSave}>
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="prose prose-sm max-w-none">
                                    <pre className="whitespace-pre-wrap font-mono text-sm">
                                        {localContent}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {suggestions && suggestions.length > 0 && (
                    <div className="lg:col-span-1">
                        <Card>
                            <CardContent className="p-4">
                                <h4 className="font-semibold mb-3">Suggestions</h4>
                                <ScrollArea className="h-[400px]">
                                    <div className="space-y-3">
                                        {suggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                className="p-3 border rounded-lg space-y-2"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <Badge
                                                        variant={
                                                            suggestion.type === "improvement"
                                                                ? "default"
                                                                : suggestion.type === "correction"
                                                                ? "destructive"
                                                                : "secondary"
                                                        }
                                                        className="text-xs"
                                                    >
                                                        {suggestion.type}
                                                    </Badge>
                                                    <div className="flex space-x-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                handleSuggestionAccept(suggestion)
                                                            }
                                                        >
                                                            <Check size={14} />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                handleSuggestionReject(suggestion)
                                                            }
                                                        >
                                                            <X size={14} />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {suggestion.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}