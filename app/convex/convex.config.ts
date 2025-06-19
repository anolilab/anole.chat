import { defineApp } from "convex/server";
import migrations from "@convex-dev/migrations/convex.config";
import agent from "@anolilab/convex-ai-agent/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import betterAuth from "@convex-dev/better-auth/convex.config";
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();

app.use(agent);
app.use(migrations);
app.use(rateLimiter);
app.use(betterAuth);
app.use(resend);

export default app;
