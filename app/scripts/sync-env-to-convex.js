#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const whitelist = {
    RESEND_API_KEY: "RESEND_API_KEY",
    RESEND_FROM_EMAIL: "RESEND_FROM_EMAIL",
    VITE_SITE_URL: "SITE_URL",
    ENCRYPTION_KEY: "ENCRYPTION_KEY",
    BETTER_AUTH_SECRET: "BETTER_AUTH_SECRET",
    ANTHROPIC_API_KEY: "ANTHROPIC_API_KEY",
    OPENAI_API_KEY: "OPENAI_API_KEY",
    OPENAI_API_KEY: "OPENAI_API_KEY",
    ANTHROPIC_API_KEY: "ANTHROPIC_API_KEY",
    GOOGLE_API_KEY: "GOOGLE_API_KEY",
    GROQ_API_KEY: "GROQ_API_KEY",
    FAL_API_KEY: "FAL_API_KEY"
};

const parseEnvFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ .env file not found at: ${filePath}`);
        process.exit(1);
    }

    const envContent = fs.readFileSync(filePath, "utf8");
    const envVars = {};

    envContent.split("\n").forEach((line) => {
        if (!line.trim() || line.trim().startsWith("#")) {
            return;
        }

        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, "");

            if (whitelist[key] && value) {
                const convexKey = whitelist[key];
                envVars[convexKey] = value;
            }
        }
    });

    return envVars;
};

const setConvexEnvVar = (key, value) => {
    try {
        execSync(`pnpm exec convex env --deployment-name "anonymous:anonymous-ai-chat" set ${key} "${value}"`, { stdio: "inherit" });
        return true;
    } catch (error) {
        console.error(`❌ Failed to set ${key}:`, error.message);
        return false;
    }
};

const syncEnvToConvex = async () => {
    console.log("🔄 Syncing .env file to Convex...\n");

    const envFilePath = path.join(process.cwd(), ".env");
    const localEnvVars = parseEnvFile(envFilePath);

    if (Object.keys(localEnvVars).length === 0) {
        console.log("ℹ️  No Convex-relevant environment variables found in .env file");
        return;
    }

    console.log("📋 Found the following variables to sync:");

    Object.keys(localEnvVars).forEach((key) => {
        const maskedValue = localEnvVars[key].length > 10 ? localEnvVars[key].substring(0, 10) + "..." : localEnvVars[key];
        console.log(`  - ${key}: ${maskedValue}`);
    });

    console.log("");

    let successCount = 0;

    for (const [key, value] of Object.entries(localEnvVars)) {
        console.log(`🔧 Setting ${key}...`);

        if (setConvexEnvVar(key, value)) {
            successCount++;
        }
    }

    console.log("\n📊 Sync Summary:");
    console.log(`  ✅ Successfully set: ${successCount} variables`);

    if (successCount > 0) {
        console.log("\n🎉 Environment sync completed successfully!");
        console.log('💡 Run "npx convex env list" to verify the changes');
    }
};

syncEnvToConvex().catch((error) => {
    console.error("❌ Sync failed:", error.message);
    process.exit(1);
});
