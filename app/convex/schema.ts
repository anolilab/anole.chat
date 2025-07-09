import { defineSchema } from "convex/server";
import { authTables } from "./auth/schema";
import { chatTables } from "./chat/schema";
import { subscriptionTables } from "./subscription/schema";
import { emailTables } from "./email/schema";

const schema = defineSchema({
    ...authTables,
    ...chatTables,
    ...subscriptionTables,
    ...emailTables,
});

export default schema;
