import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ArtifactContent } from "../../types/artifacts";

const LANGUAGE_OPTIONS = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "csharp", label: "C#" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "php", label: "PHP" },
    { value: "ruby", label: "Ruby" },
    { value: "swift", label: "Swift" },
    { value: "kotlin", label: "Kotlin" },
    { value: "scala", label: "Scala" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "sql", label: "SQL" },
    { value: "bash", label: "Bash" },
    { value: "json", label: "JSON" },
    { value: "yaml", label: "YAML" },
    { value: "markdown", label: "Markdown" },
];

export function CodeEditor({
    content,
    isCurrentVersion,
    currentVersionIndex,
    status,
    onSaveContent,
    isReadonly,
}: ArtifactContent) {
    const [localContent, setLocalContent] = useState(content);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("javascript");

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

    if (status === "streaming") {
        return (
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Code Document</h3>
                    <Badge variant="secondary">Streaming...</Badge>
                </div>
                <Card>
                    <CardContent className="p-4">
                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                            <pre className="whitespace-pre-wrap">
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
                <h3 className="text-lg font-semibold">Code Document</h3>
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

            <Card>
                <CardContent className="p-4">
                    {isEditing ? (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">Language:</span>
                                <Select
                                    value={selectedLanguage}
                                    onValueChange={setSelectedLanguage}
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LANGUAGE_OPTIONS.map((lang) => (
                                            <SelectItem key={lang.value} value={lang.value}>
                                                {lang.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Textarea
                                value={localContent}
                                onChange={(e) => setLocalContent(e.target.value)}
                                placeholder={`Enter your ${selectedLanguage} code here...`}
                                className="min-h-[400px] resize-none font-mono text-sm"
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
                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant="secondary" className="text-xs">
                                    {LANGUAGE_OPTIONS.find(lang => lang.value === selectedLanguage)?.label || selectedLanguage}
                                </Badge>
                            </div>
                            <pre className="whitespace-pre-wrap">{localContent}</pre>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}