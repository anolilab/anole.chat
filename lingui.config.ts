import { defineConfig } from "@lingui/cli";

export default defineConfig({
    catalogs: [
        {
            include: ["src"],
            path: "<rootDir>/src/locales/{locale}/messages",
        },
    ],
    locales: ["de", "en"],
    sourceLocale: "en",
});
