import type { DBEdge, DBNode } from "@/types/workflow";

import { NodeKind } from "../workflow.interface";

export function addEdgeBranchLabel(nodes: DBNode[], edges: DBEdge[]) {
    const outs = (id: string) => edges.filter((e) => e.source === id);
    const start = nodes.find((n) => n.kind === NodeKind.Input)!;
    const q: { bid: string; id: string }[] = [{ bid: "B0", id: start.id }];

    while (q.length > 0) {
        const { bid, id } = q.shift()!;
        const node = nodes.find((n) => n.id === id)!;
        const nexts = outs(id);

        if (node.kind === NodeKind.Condition) {
            const byHandle = new Map<string, DBEdge[]>();

            nexts.forEach((e) => {
                const h = e.uiConfig.sourceHandle ?? "right";

                (byHandle.get(h) ?? byHandle.set(h, []).get(h))!.push(e);
            });
            byHandle.forEach((group) => {
                if (group.length === 1) {
                    const [e] = group;

                    if (!e.uiConfig.label) {
                        e.uiConfig.label = bid;
                        q.push({ bid, id: e.target });
                    }
                } else {
                    group.forEach((e, index) => {
                        const newBid = `${bid}.${index}`;

                        if (!e.uiConfig.label) {
                            e.uiConfig.label = newBid;
                            q.push({ bid: newBid, id: e.target });
                        }
                    });
                }
            });
        } else {
            nexts.forEach((e, index) => {
                const newBid = nexts.length > 1 ? `${bid}.${index}` : bid;

                if (!e.uiConfig.label) {
                    e.uiConfig.label = newBid;
                    q.push({ bid: newBid, id: e.target });
                }
            });
        }
    }
}
