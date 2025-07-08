import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";
// import { vite } from "@t3-oss/env-core/presets-zod"

export const env = createEnv({
    server: {
        SERVER_URL: z.string().url().optional(),
        RESEND_API_KEY: z.string(),
        RESEND_FROM_EMAIL: z.string(),
        ANTHROPIC_API_KEY: z.string(),
        POLAR_ACCESS_TOKEN: z.string(),
        POLAR_SUCCESS_URL: z.string(),
        POLAR_WEBHOOK_SECRET: z.string(),
        ENCRYPTION_KEY: z.string(),
    },

    /**
     * The prefix that client-side variables must have. This is enforced both at
     * a type-level and at runtime.
     */
    clientPrefix: "VITE_",
    client: {
        VITE_APP_TITLE: z.string().min(1).optional(),
        VITE_SITE_URL: z.string().url(),
        VITE_CONVEX_URL: z.string().url(),
        VITE_CONVEX_SITE_URL: z.string().url(),
    },

    /**
     * What object holds the environment variables at runtime. This is usually
     * `process.env` or `import.meta.env`.
     */
    runtimeEnv: {
        ...import.meta.env,
        ...process.env,
    },

    /**
     * By default, this library will feed the environment variables directly to
     * the Zod validator.
     *
     * This means that if you have an empty string for a value that is supposed
     * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
     * it as a type mismatch violation. Additionally, if you have an empty string
     * for a value that is supposed to be a string with a default value (e.g.
     * `DOMAIN=` in an ".env" file), the default value will never be applied.
     *
     * In order to solve these issues, we recommend that all new projects
     * explicitly specify this option as true.
     */
    emptyStringAsUndefined: true,

    // TODO: Recheck why this does not work
    //extends: [vite()],
});
