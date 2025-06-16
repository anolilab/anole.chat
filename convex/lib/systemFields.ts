import { v } from "convex/values";
import type { Id, TableNames } from "../_generated/dataModel";
import type { SystemTableNames } from "convex/server";

export const withoutSystemFields = <T extends { _creationTime: number; _id: Id<TableNames | SystemTableNames> }>(doc: T) => {
    // Exclude _id and _creationTime from the returned object
    const { _id, _creationTime, ...rest } = doc;

    return rest;
};

export const systemFields = (tableName: TableNames) => ({
    _id: v.id(tableName),
    _creationTime: v.number(),
});
