import { defineSchema } from "convex/server";

import ai from "./ai/schema";
import authTables from "./auth/schema";
import chatTables from "./chat/schema";
import emailTables from "./email/schema";
import { subscriptionTables } from "./subscription/schema";
import { polarTables } from "./polar/schema";

const schema = defineSchema({
    ...ai,
    ...authTables,
    ...chatTables,
    ...subscriptionTables,
    ...emailTables,
    ...polarTables,
});

export default schema;
