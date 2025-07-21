import { defineSchema } from "convex/server";

import ai from "./ai/schema";
import authTables from "./auth/schema";
import chatTables from "./chat/schema";
import emailTables from "./email/schema";
import { subscriptionTables } from "./subscription/schema";
import todosTables from "./todos/schema";

const schema = defineSchema({
    ...ai,
    ...authTables,
    ...chatTables,
    ...subscriptionTables,
    ...emailTables,
    ...todosTables,
});

export default schema;
