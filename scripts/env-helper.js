#!/usr/bin/env node

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

export class EnvHelper {
    constructor() {
        this.envPath = path.resolve(process.cwd(), ".env");
        this.envExamplePath = path.resolve(process.cwd(), ".env-example");
        this.config = this.loadEnvConfig();
    }

    loadEnvConfig() {
        let envContent = "";

        if (fs.existsSync(this.envPath)) {
            envContent = fs.readFileSync(this.envPath, "utf8");
        } else {
            console.log("📄 .env file not found, creating from .env-example...");

            if (fs.existsSync(this.envExamplePath)) {
                envContent = fs.readFileSync(this.envExamplePath, "utf8");
                fs.writeFileSync(this.envPath, envContent);
                console.log("✅ Created .env file from .env-example\n");
            } else {
                envContent = "";
                fs.writeFileSync(this.envPath, envContent);
                console.log("✅ Created empty .env file\n");
            }
        }

        const buffer = Buffer.from(envContent);
        return dotenv.parse(buffer);
    }

    hasKey(key) {
        return key in this.config && this.config[key] && this.config[key].trim() !== "";
    }

    getValue(key) {
        return this.config[key] || "";
    }

    setValue(key, value) {
        this.config[key] = value;
        this.saveEnvFile();
    }

    saveEnvFile() {
        const envContent = fs.readFileSync(this.envPath, "utf8");
        let updatedContent = envContent;

        for (const [key, value] of Object.entries(this.config)) {
            const keyRegex = new RegExp(`^${key}=.*$`, "m");
            const keyLine = `${key}=${value}`;

            if (keyRegex.test(updatedContent)) {
                updatedContent = updatedContent.replace(keyRegex, keyLine);
            } else {
                updatedContent += updatedContent.endsWith("\n") ? "" : "\n";
                updatedContent += `${keyLine}\n`;
            }
        }

        fs.writeFileSync(this.envPath, updatedContent);
    }

    async ensureKey(key, generateValueFn, description = "") {
        console.log(`🔍 Checking for ${key}...`);

        if (this.hasKey(key)) {
            console.log(`✅ ${key} already exists in .env`);
            console.log(`Current value: ${this.getValue(key)}\n`);
        } else {
            console.log(`❌ ${key} not found in .env, generating new value...`);

            const newValue = await generateValueFn();

            this.setValue(key, newValue);

            console.log(`✅ Added ${key} to .env`);

            if (description) {
                console.log(`Description: ${description}`);
            }

            console.log(`Generated value: ${newValue}\n`);
        }
    }

    displaySecurityWarning(keyType = "key") {
        console.log(`⚠️  Important Security Notes for ${keyType}:`);
        console.log("========================================");
        console.log(`- Keep this ${keyType} secret and secure`);
        console.log(`- Never commit this ${keyType} to version control`);
        console.log("- Store it securely in your environment variables");
        console.log("- Use different keys for different environments (dev/staging/prod)");
        console.log(`- If compromised, generate a new ${keyType} immediately\n`);
    }
}
