import { graphStore } from "ts-edge";

import type { ObjectJsonSchema7 } from "@/types/util";
import type { DBEdge, DBNode } from "@/types/workflow";

import objectFlow from "../../object-flow";
import { defaultObjectJsonSchema } from "../shared.workflow";
import type { OutputSchemaSourceKey } from "../workflow.interface";

export interface WorkflowRuntimeState {
    edges: DBEdge[];
    getInput: (nodeId: string) => any;
    getOutput: <T>(key: OutputSchemaSourceKey) => undefined | T;
    inputs: {
        [nodeId: string]: any;
    };
    nodes: DBNode[];
    outputs: {
        [nodeId: string]: any;
    };
    query: Record<string, unknown>;
    setInput: (nodeId: string, value: any) => void;
    setOutput: (key: OutputSchemaSourceKey, value: any) => void;
}

export const createGraphStore = (parameters: { edges: DBEdge[]; nodes: DBNode[] }) =>
    graphStore<WorkflowRuntimeState>((set, get) => {
        return {
            edges: parameters.edges,
            getInput(nodeId) {
                const { inputs } = get();

                return inputs[nodeId];
            },
            getOutput(key) {
                const { nodes, outputs } = get();
                const targetNode = nodes.find((n) => n.id === key.nodeId);
                const schema = (targetNode?.nodeConfig?.outputSchema as ObjectJsonSchema7) ?? defaultObjectJsonSchema;
                const defaultValue
                    = key.path.length > 0
                        ? key.path.reduce(
                            (accumulator, current, index) => {
                                const isLast = index === key.path.length - 1;

                                if (isLast)
                                    return accumulator?.[current]?.default;

                                return accumulator?.[current]?.properties?.[current];
                            },
                            (schema.properties ?? {}) as any,
                        )
                        : schema?.default;

                return objectFlow(outputs[key.nodeId]).getByPath(key.path) ?? defaultValue;
            },
            inputs: {},
            nodes: parameters.nodes,
            outputs: {},
            query: {},
            setInput(nodeId, value) {
                set((previous) => {
                    return { inputs: { ...previous.inputs, [nodeId]: value } };
                });
            },
            setOutput(key, value) {
                set((previous) => {
                    const next = objectFlow(previous.outputs).setByPath([key.nodeId, ...key.path], value);

                    return {
                        outputs: next,
                    };
                });
            },
        };
    });
