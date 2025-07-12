#!/usr/bin/env node

import crypto from "crypto";
import fs from "fs";
import path from "path";

const generateEncryptionKey = () => {
    const key = crypto.randomBytes(32);
    return key.toString("base64");
};

const checkKeyInEnv = (keyName) => {
    const envPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return false;
    const envContent = fs.readFileSync(envPath, "utf8");
    const regex = new RegExp(`^${keyName}=.+$`, "m");
    return regex.test(envContent);
};

const updateEnvFile = (keyName, keyValue) => {
    const envPath = path.join(process.cwd(), ".env");
    let envContent = "";
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf8");
    }
    
    const keyRegex = new RegExp(`^${keyName}=.*$`, "m");
    if (keyRegex.test(envContent)) {
        const emptyKeyRegex = new RegExp(`^${keyName}=$`, "m");
        if (emptyKeyRegex.test(envContent)) {
            envContent = envContent.replace(emptyKeyRegex, `${keyName}=${keyValue}`);
            console.log(`✅ Updated ${keyName} in .env file`);
        } else {
            console.log(`ℹ️  ${keyName} already has a value in .env file`);
            return false;
        }
    } else {
        if (envContent && !envContent.endsWith("
")) {
            envContent += "
";
        }
        envContent += `${keyName}=${keyValue}
`;
        console.log(`✅ Added ${keyName} to .env file`);
    }
    
    fs.writeFileSync(envPath, envContent);
    return true;
};

(() => {
    console.log("🔐 Generating encryption key...
");

    const encryptionKey = generateEncryptionKey();

    console.log("Generated ENCRYPTION_KEY:");
    console.log("========================");
    console.log(encryptionKey);
    console.log("========================
");

    if (checkKeyInEnv("ENCRYPTION_KEY")) {
        console.log("ℹ️  ENCRYPTION_KEY already exists in .env file with a value");
        console.log("💡 If you want to regenerate, remove the existing value first
");
    } else {
        const updated = updateEnvFile("ENCRYPTION_KEY", encryptionKey);
        if (updated) {
            console.log("📁 .env file updated successfully!
");
        }
    }

    console.log("�� Environment variable format:");
    console.log(`ENCRYPTION_KEY=${encryptionKey}
`);

    console.log("⚠️  Important Security Notes:");
    console.log("- Keep this key secret and secure");
    console.log("- Never commit this key to version control");
    console.log("- Store it securely in your environment variables");
    console.log("- Use different keys for different environments (dev/staging/prod)");
    console.log("- If compromised, generate a new key immediately
");

    console.log("✅ Key generation complete!");
})();
