"use client";

import type { FC } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useAiModelContext } from "../-provider/ai-model-provider";

const models = [
    {
        icon: openai,
        name: "GPT 4o-mini",
        value: "gpt-4o-mini",
    },
    {
        icon: deepseek,
        name: "Deepseek R1",
        value: "deepseek-r1",
    },
    {
        icon: anthropic,
        name: "Claude 3.5 Sonnet",
        value: "claude-3.5-sonnet",
    },
    {
        icon: google,
        name: "Gemini 2.0 Flash",
        value: "gemini-2.0-flash",
    },
    {
        icon: meta,
        name: "Llama 3 8b",
        value: "llama-3-8b",
    },
    {
        icon: fireworks,
        name: "Firefunction V2",
        value: "firefunction-v2",
    },
    {
        icon: mistral,
        name: "Mistral 7b",
        value: "mistral-7b",
    },
];

export const ModelPicker: FC = () => {
    const { selectedModel, setSelectedModel } = useAiModelContext();

    return (
        <Select onValueChange={setSelectedModel} value={selectedModel}>
            <SelectTrigger className="max-w-[300px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="">
                {models.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                        <span className="flex items-center gap-2">
                            <Image alt={model.name} className="inline size-4" src={model.icon} />
                            <span>{model.name}</span>
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};
