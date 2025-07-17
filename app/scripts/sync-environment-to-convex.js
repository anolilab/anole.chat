/* eslint-disable perfectionist/sort-objects */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const whitelist = {
    ENCRYPTION_KEY: "ENCRYPTION_KEY",
    BETTER_AUTH_SECRET: "BETTER_AUTH_SECRET",

    ANTHROPIC_API_KEY: "ANTHROPIC_API_KEY",
    FAL_API_KEY: "FAL_API_KEY",
    GOOGLE_GENERATIVE_AI_API_KEY: "GOOGLE_GENERATIVE_AI_API_KEY",
    GROQ_API_KEY: "GROQ_API_KEY",
    OPENAI_API_KEY: "OPENAI_API_KEY",

    R2_ACCESS_KEY_ID: "R2_ACCESS_KEY_ID",
    R2_BUCKET: "R2_BUCKET",
    R2_ENDPOINT: "R2_ENDPOINT",
    R2_SECRET_ACCESS_KEY: "R2_SECRET_ACCESS_KEY",

    RESEND_API_KEY: "RESEND_API_KEY",
    RESEND_FROM_EMAIL: "RESEND_FROM_EMAIL",

    POLAR_ORGANIZATION_ID: "POLAR_ORGANIZATION_ID",
    POLAR_ACCESS_TOKEN: "POLAR_ACCESS_TOKEN",
    POLAR_SUCCESS_URL: "POLAR_SUCCESS_URL",
    POLAR_CANCEL_URL: "POLAR_CANCEL_URL",
    POLAR_WEBHOOK_SECRET: "POLAR_WEBHOOK_SECRET",

    VITE_SITE_URL: "SITE_URL",
};

const parseEnvironmentFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ .env file not found at: ${filePath}`);
        process.exit(1);
    }

    const environmentContent = fs.readFileSync(filePath, "utf8");
    const environmentVariables = {};

    environmentContent.split("\n").forEach((line) => {
        if (!line.trim() || line.trim().startsWith("#")) {
            return;
        }

        const match = line.match(/^([^=]+)=(.*)$/);

        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replaceAll(/^["']|["']$/g, "");

            if (whitelist[key] && value) {
                const convexKey = whitelist[key];

                environmentVariables[convexKey] = value;
            }
        }
    });

    return environmentVariables;
};

const setConvexEnvironmentVariable = (key, value) => {
    try {
        execSync(`pnpm exec convex env --deployment-name "anonymous:anonymous-ai-chat" set ${key} "${value}"`, { stdio: "inherit" });

        return true;
    } catch (error) {
        console.error(`❌ Failed to set ${key}:`, error.message);

        return false;
    }
};

const syncEnvironmentToConvex = async () => {
    console.log("🔄 Syncing .env file to Convex...\n");

    const environmentFilePath = path.join(process.cwd(), ".env");
    const localEnvironmentVariables = parseEnvironmentFile(environmentFilePath);

    if (Object.keys(localEnvironmentVariables).length === 0) {
        console.log("ℹ️  No Convex-relevant environment variables found in .env file");

        return;
    }

    console.log("📋 Found the following variables to sync:");

    Object.keys(localEnvironmentVariables).forEach((key) => {
        const maskedValue = localEnvironmentVariables[key].length > 10 ? `${localEnvironmentVariables[key].slice(0, 10)}...` : localEnvironmentVariables[key];

        console.log(`  - ${key}: ${maskedValue}`);
    });

    console.log("");

    let successCount = 0;

    for (const [key, value] of Object.entries(localEnvironmentVariables)) {
        console.log(`🔧 Setting ${key}...`);

        if (setConvexEnvironmentVariable(key, value)) {
            successCount++;
        }
    }

    console.log("\n📊 Sync Summary:");
    console.log(`  ✅ Successfully set: ${successCount} variables`);

    if (successCount > 0) {
        console.log("\n🎉 Environment sync completed successfully!");
        console.log("💡 Run \"npx convex env list\" to verify the changes");
    }
};

syncEnvironmentToConvex().catch((error) => {
    console.error("❌ Sync failed:", error.message);
    process.exit(1);
});
