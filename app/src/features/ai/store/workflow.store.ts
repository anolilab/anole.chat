"use client";

import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

import type { DBWorkflow } from "@/types/workflow";

export interface WorkflowState {
    hasEditAccess?: boolean;
    processIds: string[];
    workflow?: DBWorkflow;
}

export interface WorkflowDispatch {
    addProcess: () => () => void;
    init: (workflow?: DBWorkflow, hasEditAccess?: boolean) => void;
}

const initialState: WorkflowState = {
    processIds: [],
};

export const useWorkflowStore = create<WorkflowDispatch & WorkflowState>((set) => {
    return {
        ...initialState,
        addProcess: () => {
            const processId = uuidv4();

            set((state) => {
                return {
                    processIds: [...state.processIds, processId],
                };
            });

            return () => {
                set((state) => {
                    return {
                        processIds: state.processIds.filter((id) => id !== processId),
                    };
                });
            };
        },
        init: (workflow, hasEditAccess) => set({ ...initialState, hasEditAccess, workflow }),
    };
});
