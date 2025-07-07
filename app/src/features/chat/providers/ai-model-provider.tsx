import { type FC, type ReactNode, createContext, useContext, useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { DEFAULT_MODEL, type AgentModel } from "@convex/ai/lib/agents";

interface AiModelContextType {
    selectedModel: AgentModel;
    setSelectedModel: (model: AgentModel) => void;
}

const AiModelContext = createContext<AiModelContextType | undefined>(undefined);

// TODO: use thread model first if provided, then user model
export const AiModelProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedModel, setSelectedModelState] = useState<AgentModel>(DEFAULT_MODEL);
    const updateSelectedModel = useMutation(api.user.functions.updateSelectedModel);

    const fetchedModel = useQuery(api.user.functions.getSelectedModel);

    useEffect(() => {
        if (fetchedModel && typeof fetchedModel === "string") {
            setSelectedModelState(fetchedModel as AgentModel);
        }
    }, [fetchedModel]);

    const setSelectedModel = useCallback(
        (model: AgentModel) => {
            setSelectedModelState(model);

            updateSelectedModel({ model });
        },
        [updateSelectedModel],
    );

    return <AiModelContext.Provider value={{ selectedModel, setSelectedModel }}>{children}</AiModelContext.Provider>;
};

export const useAiModelContext = () => {
    const ctx = useContext(AiModelContext);

    if (!ctx) {
        throw new Error("useAiModelContext must be used within a AiModelProvider");
    }

    return ctx;
};
