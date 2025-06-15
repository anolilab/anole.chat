import { defineApp } from "convex/server";
import migrations from "@convex-dev/migrations/convex.config";
import persistentTextStreaming from "@convex-dev/persistent-text-streaming/convex.config";
import agent from "@convex-dev/agent/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

const app = defineApp();

app.use(agent);
app.use(persistentTextStreaming);
app.use(migrations);
app.use(rateLimiter);

export default app;
