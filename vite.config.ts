import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig, loadEnv } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { lingui } from "@lingui/vite-plugin";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());

    return {
        server: {
            routeRules: {
                "/pr/posthog/**": { proxy: { to: "https://eu.i.posthog.com/**" } },
            },
            proxy: {
                "/convex-http": {
                    target: env.VITE_CONVEX_SITE_URL,
                    changeOrigin: true,
                    secure: false,
                    rewrite: (path) => path.replace(/^\/convex-http/, ""),
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
            lingui(),
            viteTsConfigPaths({
                projects: ["./tsconfig.json"],
            }),
            tailwindcss(),
            tanstackStart({
                tsr: {
                    routeToken: "layout",
                    enableCodeSplitting: true,
                },
                react: {
                    babel: {
                        plugins: [["babel-plugin-react-compiler", { target: "19" }], "@lingui/babel-plugin-lingui-macro"],
                    },
                },
            }),
        ],
        define: {
            global: "globalThis",
        },
    };
});
