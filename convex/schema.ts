import { defineSchema } from "convex/server";
import { authTables } from "./auth/schema";
import { chatTables } from "./chat/schema";
import { emailTables } from "./email/schema";
import { subscriptionTables } from "./subscription/schema";
import { userTables } from "./user/schema";
import { aiTables } from "./ai/schema";

/**
 * The schema is normally optional, but Convex has built-in support for
 * schema validation and it's a good idea to define one.
 *
 * See https://docs.convex.dev/database/schemas.
 */
export default defineSchema({
    ...authTables,
    ...chatTables,
    ...emailTables,
    ...subscriptionTables,
    ...userTables,
    ...aiTables,
});
