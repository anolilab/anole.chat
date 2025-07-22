import type { SystemTableNames } from "convex/server";
import { v } from "convex/values";

import type { Id, TableNames } from "../_generated/dataModel";

export const withoutSystemFields = <T extends { _creationTime: number; _id: Id<TableNames | SystemTableNames> }>(document_: T) => {
    // Exclude _id and _creationTime from the returned object
    const { _creationTime, _id, ...rest } = document_;

    return rest;
};

export const systemFields = (tableName: TableNames) => {
    return {
        _creationTime: v.number(),
        _id: v.id(tableName),
    };
};

export const softDeleteFields = {
    deleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
};
