import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import { DEFAULT_MODEL, type AgentModel } from "@cvx/agents";
import { useSession } from "@/features/auth/hooks/auth-hooks";

interface AiModelContextType {
    selectedModel: AgentModel;
    setSelectedModel: (model: AgentModel) => void;
}

const AiModelContext = createContext<AiModelContextType | undefined>(undefined);

// TODO: use thread model first if provided, then user model
export const AiModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedModel, setSelectedModelState] = useState<AgentModel>(DEFAULT_MODEL);
    const updateSelectedModel = useMutation(api.user.updateSelectedModel);
    const sessionToken = useSession();

    const fetchedModel = useQuery(api.user.getSelectedModel, sessionToken?.data?.session?.token ? { sessionToken: sessionToken.data.session.token } : "skip");

    useEffect(() => {
        if (fetchedModel && typeof fetchedModel === "string") {
            setSelectedModelState(fetchedModel as AgentModel);
        }
    }, [fetchedModel]);

    const setSelectedModel = useCallback(
        (model: AgentModel) => {
            setSelectedModelState(model);
            if (sessionToken?.data?.session?.token) {
                updateSelectedModel({ model, sessionToken: sessionToken.data.session.token });
            }
        },
        [sessionToken, updateSelectedModel],
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
