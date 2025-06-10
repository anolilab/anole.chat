/* eslint-disable @typescript-eslint/no-unused-vars */
import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import type { Id, TableNames } from "../_generated/dataModel";
import {
  type MutationCtx,
  type QueryCtx,
  mutation as baseMutation,
  query as baseQuery,
} from "../_generated/server";
import type { SystemTableNames } from 'convex/server';
import { ROLES } from '../types';

export function withoutSystemFields<T extends { _creationTime: number; _id: Id<TableNames | SystemTableNames>; }>(doc: T) {
  // Exclude _id and _creationTime from the returned object
  const { _id, _creationTime, ...rest } = doc;
  return rest;
}

export async function getUser(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  console.log("IDENTITY", identity);
  if (!identity) return null;

  const user = await ctx.db
    .query("user")
    .withIndex("by_id", (q) => q.eq("_id", identity.subject as Id<"user">))
    .unique();
  if (!user) return null;

  return user;
}

export const authedMutation = customMutation(baseMutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await getUser(ctx);
    console.log("USER", user);
    if (!user) throw new Error("Unauthorized");

    return { ctx: { ...ctx, user }, args };
  },
});

export const authedQuery = customQuery(baseQuery, {
  args: {},
  input: async (ctx, args) => {
    const user = await getUser(ctx);
    console.log("USER", user);
    if (!user) throw new Error("Unauthorized");

    return { ctx: { ...ctx, user }, args };
  },
});

export const requireAdmin = async (ctx: QueryCtx) => {
  const user = await getUser(ctx);
  if (!user) throw new Error("Unauthorized");

  if (!user.roles?.includes(ROLES.ADMIN)) throw new Error("Unauthorized");

  return user;
};

export const requireMiddleman = async (ctx: QueryCtx) => {
  const user = await getUser(ctx);
  if (!user) throw new Error("Unauthorized");

  if (!user.roles?.includes(ROLES.MIDDLEMAN)) throw new Error("Unauthorized");

  return user;
};