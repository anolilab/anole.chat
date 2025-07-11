import { createConfig } from "@anolilab/eslint-config";

/** @type {import("@anolilab/eslint-config").PromiseFlatConfigComposer} */
export default createConfig({
    // `.eslintignore` is no longer supported in Flat config, use `ignores` instead
    ignores: [
        "**/fixtures",
        // ...globs
    ],
});
