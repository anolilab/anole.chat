import { defineSchema } from "convex/server";
import { authTables } from "./auth/schema";
import { chatTables } from "./chat/schema";
import { userTables } from "./user/schema";
import { subscriptionTables } from "./subscription/schema";
import { emailTables } from "./email/schema";
import { aiTables } from "./ai/schema";
import { filesTables } from "./files/schema";

const schema = defineSchema({
    ...authTables,
    ...chatTables,
    ...userTables,
    ...subscriptionTables,
    ...emailTables,
    ...aiTables,
    ...filesTables,
});

export default schema;
