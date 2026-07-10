import { defineSchema } from "convex/server";

import ai from "./ai/schema";
import artifactsTables from "./artifacts/schema";
import authTables from "./auth/schema";
import chatTables from "./chat/schema";
import emailTables from "./email/schema";
import { subscriptionTables } from "./subscription/schema";

const schema = defineSchema({
    ...ai,
    ...artifactsTables,
    ...authTables,
    ...chatTables,
    ...subscriptionTables,
    ...emailTables,
});

export default schema;
