import { lingui } from "@lingui/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig, loadEnv } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
    const environment = loadEnv(mode, process.cwd());

    return {
        define: {
            global: "globalThis",
        },
        optimizeDeps: {
            exclude: ["scripts/*"],
        },
        plugins: [
            lingui(),
            viteTsConfigPaths({
                projects: ["./tsconfig.json"],
            }),
            tailwindcss(),
            tanstackStart({
                react: {
                    babel: {
                        plugins: [["babel-plugin-react-compiler", { target: "19" }], "@lingui/babel-plugin-lingui-macro"],
                    },
                },
                tsr: {
                    routeToken: "layout",
                },
            }),
        ],
        resolve: {
            alias: {
                // Fix for @convex-dev/resend missing .js extension
                "@convex-dev/resend/dist/esm/component/shared": "@convex-dev/resend/dist/esm/component/shared.js",
            },
        },
        server: {
            proxy: {
                "/convex-http": {
                    changeOrigin: true,
                    configure: (proxy, _options) => {
                        proxy.on("error", (error, _request, _res) => {
                            console.log("proxy error", error);
                        });
                        proxy.on("proxyReq", (_, request, _res) => {
                            console.log("Sending Request to the Target:", request.method, request.url);
                        });
                        proxy.on("proxyRes", (proxyRes, request, _res) => {
                            console.log("Received Response from the Target:", proxyRes.statusCode, request.url);
                        });
                    },
                    rewrite: (path) => path.replace(/^\/convex-http/, ""),
                    secure: false,
                    target: environment.VITE_CONVEX_SITE_URL,
                },
            },
            routeRules: {
                "/pr/posthog/**": { proxy: { to: "https://eu.i.posthog.com/**" } },
            },
        },
        ssr: {
            noExternal: ["@convex-dev/resend"],
        },
        test: {
            browser: {
                enabled: true,
                instances: [
                    { browser: "chrome" },
                ],
                provider: "webdriverio",
            },
            setupFiles: ["./vitest.setup.ts"],
        },
    };
});
