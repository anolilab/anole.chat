import { createConfig } from "@anolilab/eslint-config";

/** @type {import("@anolilab/eslint-config").PromiseFlatConfigComposer} */
export default createConfig(
    {
        // `.eslintignore` is no longer supported in Flat config, use `ignores` instead
        ignores: [
            "./eslint.config.js",
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
        files: ["**/src/routes/**/*.tsx", "**/src/routes/api/**/*.ts"],
        rules: {
            "import/exports-last": "off",
            "import/prefer-default-export": "off",
            "@typescript-eslint/no-use-before-define": "off",
        },
    },
    {
        files: ["**/*.test.tsx"],
        rules: {
            // this need types
            "vitest/prefer-describe-function-title": "off",
        }
    }
);
