"use client";

import type { FC } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAiModelContext } from "../-provider/ai-model-provider";

const models = [
    {
        name: "GPT 4o-mini",
        value: "gpt-4o-mini",
        icon: openai,
    },
    {
        name: "Deepseek R1",
        value: "deepseek-r1",
        icon: deepseek,
    },
    {
        name: "Claude 3.5 Sonnet",
        value: "claude-3.5-sonnet",
        icon: anthropic,
    },
    {
        name: "Gemini 2.0 Flash",
        value: "gemini-2.0-flash",
        icon: google,
    },
    {
        name: "Llama 3 8b",
        value: "llama-3-8b",
        icon: meta,
    },
    {
        name: "Firefunction V2",
        value: "firefunction-v2",
        icon: fireworks,
    },
    {
        name: "Mistral 7b",
        value: "mistral-7b",
        icon: mistral,
    },
];

export const ModelPicker: FC = () => {
    const { selectedModel, setSelectedModel } = useAiModelContext();
    return (
        <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="max-w-[300px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="">
                {models.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                        <span className="flex items-center gap-2">
                            <Image src={model.icon} alt={model.name} className="inline size-4" />
                            <span>{model.name}</span>
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};
