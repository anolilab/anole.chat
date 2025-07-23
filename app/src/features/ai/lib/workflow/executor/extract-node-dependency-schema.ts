import type { JSONSchema7 } from "json-schema";

import type { ObjectJsonSchema7 } from "@/types/util";

import { defaultObjectJsonSchema, findJsonSchemaByPath } from "../shared.workflow";
import type { WorkflowNodeData } from "../workflow.interface";
import { NodeKind } from "../workflow.interface";

export function extractNodeDependencySchema({ nodes, targetId }: { nodes: WorkflowNodeData[]; targetId: string }): ObjectJsonSchema7 {
    const schema = structuredClone(defaultObjectJsonSchema);
    const target = nodes.find((node) => node.id === targetId);

    if (!target) {
        return schema;
    }

    if (target.kind === NodeKind.Input) {
        return target.outputSchema;
    }

    if (target.kind === NodeKind.Output) {
        const properties = target.outputData.reduce(
            (accumulator, current) => {
                if (!current.key)
                    return accumulator;

                accumulator[current.key] = {
                    type: "string", // default
                };
                const { source } = current;

                if (!source)
                    return accumulator;

                const sourceNode = nodes.find((node) => node.id === source.nodeId);

                if (!sourceNode)
                    return accumulator;

                const sourceSchema = findJsonSchemaByPath(sourceNode.outputSchema, source.path);

                accumulator[current.key] = sourceSchema || { type: "string" };

                return accumulator;
            },
            {} as Record<string, JSONSchema7>,
        );

        schema.properties = properties;

        return schema;
    }

    return schema;
}
