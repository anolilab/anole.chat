import { defineApp } from "convex/server";
import migrations from "@convex-dev/migrations/convex.config";
import agent from "@convex-dev/agent/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import r2 from "@convex-dev/r2/convex.config";

const app = defineApp();

app.use(agent);
app.use(migrations);
app.use(rateLimiter);
app.use(r2);

export default app;
