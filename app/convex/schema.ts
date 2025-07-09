import { defineSchema } from "convex/server";
import { authTables } from "./auth/schema";
import { chatTables } from "./chat/schema";
import { subscriptionTables } from "./subscription/schema";
import { emailTables } from "./email/schema";
import { ai } from "./ai/schema";

const schema = defineSchema({
    ...ai,
    ...authTables,
    ...chatTables,
    ...subscriptionTables,
    ...emailTables,
});

export default schema;
