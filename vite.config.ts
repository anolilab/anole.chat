import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig, loadEnv } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

import { wrapVinxiConfigWithSentry } from "@sentry/tanstackstart-react";

const config = defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());

    return {
        server: {
            proxy: {
                "/convex": {
                    target: env.VITE_CONVEX_SITE_URL,
                    changeOrigin: true,
                    secure: false,
                    rewrite: path => path.replace(/^\/convex/, ''),
                    configure: (proxy, _options) => {
                        proxy.on("error", (err, _req, _res) => {
                            console.log("proxy error", err);
                        });
                        proxy.on("proxyReq", (_, req, _res) => {
                            console.log("Sending Request to the Target:", req.method, req.url);
                        });
                        proxy.on("proxyRes", (proxyRes, req, _res) => {
                            console.log("Received Response from the Target:", proxyRes.statusCode, req.url);
                        });
                    },
                },
            },
        },
        plugins: [
            // this is the plugin that enables path aliases
            viteTsConfigPaths({
                projects: ["./tsconfig.json"],
            }),
            tailwindcss(),
            tanstackStart({
                tsr: {
                    routeToken: "layout",
                    enableCodeSplitting: true,
                },
            }),
        ],
    };
});

export default wrapVinxiConfigWithSentry(config, {
    org: process.env.VITE_SENTRY_ORG,
    project: process.env.VITE_SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    // Only print logs for uploading source maps in CI
    // Set to `true` to suppress logs
    silent: !process.env.CI,
});
