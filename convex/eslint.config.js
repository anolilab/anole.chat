import { createConfig } from "@anolilab/eslint-config";

/** @type {import("@anolilab/eslint-config").PromiseFlatConfigComposer} */
export default createConfig(
    {
        // `.eslintignore` is no longer supported in Flat config, use `ignores` instead
        ignores: [
            "./eslint.config.js",
            "./STRUCTURE.md",
            "./convex/_generated/**",
            "./.eslint.cache.json",
            // ...globs
        ],
        typescript: {
            isTypeAware: false,
            tsconfigPath: "./tsconfig.json",
            ignoresTypeAware: ["*.json", "*.md"],
        },
    },
    {
        files: ["**/*"],
        rules: {
            "unicorn/no-null": "off",
        },
    },
);
