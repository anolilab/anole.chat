import type { Tool } from "ai";

import type { NodeKind } from "../lib/workflow/workflow.interface";
import type { ObjectJsonSchema7 } from "./util";

export type WorkflowIcon = {
    style?: Record<string, string>;
    type: "emoji";
    value: string;
};

export type DBWorkflow = {
    createdAt: Date;
    description?: string;
    icon?: WorkflowIcon;
    id: string;
    isPublished: boolean;
    name: string;
    updatedAt: Date;
    userId: string;
    readonly version: string;
    visibility: "public" | "private" | "readonly";
};

export type DBNode = {
    createdAt: Date;
    description?: string;
    id: string;
    kind: string;
    name: string;
    nodeConfig: Record<string, any>;
    uiConfig: {
        [key: string]: any;
        position?: {
            x: number;
            y: number;
        };
    };
    updatedAt: Date;
    workflowId: string;
};
export type DBEdge = {
    createdAt: Date;
    id: string;
    source: string;
    target: string;
    uiConfig: {
        [key: string]: any;
        sourceHandle?: string;
        targetHandle?: string;
    };
    workflowId: string;
};

export type WorkflowSummary = {
    description?: string;
    icon?: WorkflowIcon;
    id: string;
    isPublished: boolean;
    name: string;
    updatedAt: Date;
    userAvatar?: string;
    userName: string;
    visibility: "public" | "private" | "readonly";
};
export interface WorkflowRepository {
    checkAccess: (workflowId: string, userId: string, readOnly?: boolean) => Promise<boolean>;
    delete: (id: string) => Promise<void>;
    save: (
        workflow: PartialBy<DBWorkflow, "id" | "createdAt" | "updatedAt" | "visibility" | "isPublished" | "version">,
        noGenerateInputNode?: boolean,
    ) => Promise<DBWorkflow>;
    saveStructure: (data: {
        deleteEdges?: string[]; // edge id
        deleteNodes?: string[]; // node id
        edges?: DBEdge[];
        nodes?: DBNode[];
        workflowId: string;
    }) => Promise<void>;
    selectAll: (userId: string) => Promise<WorkflowSummary[]>;
    selectById: (id: string) => Promise<DBWorkflow | null>;
    selectByUserId: (userId: string) => Promise<DBWorkflow[]>;
    selectExecuteAbility: (userId: string) => Promise<WorkflowSummary[]>;
    selectStructureById: (
        id: string,
        option?: {
            ignoreNote?: boolean;
        },
    ) => Promise<
        | null
        | (DBWorkflow & {
            edges: DBEdge[];
            nodes: DBNode[];
        })
    >;

    selectToolByIds: (ids: string[]) => Promise<
        {
            description?: string;
            id: string;
            name: string;
            schema: ObjectJsonSchema7;
        }[]
    >;
}

export type VercelAIWorkflowTool = Tool & {
    __$ref__: "workflow";
    _originToolName: string;
    _toolName: string;
    _workflowId: string;
};

export type VercelAIWorkflowToolStreaming = {
    endedAt?: number;
    error?: { message: string; name: string };
    id: string;
    kind: NodeKind;
    name: string;
    result?: { input?: any; output?: any };
    startedAt: number;
    status: "running" | "success" | "fail";
};

export type VercelAIWorkflowToolStreamingResult = {
    __$ref__: "workflow";
    endedAt: number;
    error?: { message: string; name: string };
    history: VercelAIWorkflowToolStreaming[];
    result?: any;
    startedAt: number;
    status: "running" | "success" | "fail";
    toolCallId: string;
    workflowIcon?: WorkflowIcon;
    workflowName: string;
};

export function isVercelAIWorkflowTool(value?: any): value is VercelAIWorkflowToolStreamingResult {
    if (!value || typeof value !== "object")
        return false;

    return value.__$ref__ === "workflow" && value.toolCallId && value.workflowName;
}
