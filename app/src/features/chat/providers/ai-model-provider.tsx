import type { AgentModel } from "@anole/convex/ai/lib/agents";
import { DEFAULT_MODEL } from "@anole/convex/ai/lib/agents";
import { api } from "@anole/convex/api";
import { useMutation, useQuery as useConvexQuery } from "convex/react";
import type { FC, ReactNode } from "react";
import { createContext, use, useCallback, useEffect, useState } from "react";

interface AiModelContextType {
    selectedModel: AgentModel;
    setSelectedModel: (model: AgentModel) => void;
}

const AiModelContext = createContext<AiModelContextType | undefined>(undefined);

// TODO: use thread model first if provided, then user model
export const AiModelProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedModel, setSelectedModelState] = useState<AgentModel>(DEFAULT_MODEL);

    const updateUserSettings = useMutation(api.auth.functions.updateUserSettings);
    const userSettings = useConvexQuery(api.auth.functions.getUserSettings);

    useEffect(() => {
        if (userSettings && typeof userSettings.selectedModel === "string" && userSettings.selectedModel !== "") {
            setSelectedModelState(userSettings.selectedModel as AgentModel);
        }
    }, [userSettings]);

    const setSelectedModel = useCallback(
        (model: AgentModel) => {
            setSelectedModelState(model);

            updateUserSettings({ selectedModel: model });
        },
        [updateUserSettings],
    );

    return <AiModelContext value={{ selectedModel, setSelectedModel }}>{children}</AiModelContext>;
};

export const useAiModelContext = () => {
    const context = use(AiModelContext);

    if (!context) {
        throw new Error("useAiModelContext must be used within a AiModelProvider");
    }

    return context;
};
