import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const generateEncryptionKey = () => {
    const key = crypto.randomBytes(32);

    return key.toString("base64");
};

const checkKeyInEnvironment = (keyName) => {
    const environmentPath = path.join(process.cwd(), ".env");

    if (!fs.existsSync(environmentPath))
        return false;

    const environmentContent = fs.readFileSync(environmentPath, "utf8");
    const regex = new RegExp(`^${keyName}=.+$`, "m");

    return regex.test(environmentContent);
};

const updateEnvironmentFile = (keyName, keyValue) => {
    const environmentPath = path.join(process.cwd(), ".env");
    let environmentContent = "";

    if (fs.existsSync(environmentPath)) {
        environmentContent = fs.readFileSync(environmentPath, "utf8");
    }

    const keyRegex = new RegExp(`^${keyName}=.*$`, "m");

    if (keyRegex.test(environmentContent)) {
        const emptyKeyRegex = new RegExp(`^${keyName}=$`, "m");

        if (emptyKeyRegex.test(environmentContent)) {
            environmentContent = environmentContent.replace(emptyKeyRegex, `${keyName}=${keyValue}`);
            console.log(`✅ Updated ${keyName} in .env file`);
        } else {
            console.log(`ℹ️  ${keyName} already has a value in .env file`);

            return false;
        }
    } else {
        if (environmentContent && !environmentContent.endsWith("")) {
            environmentContent += "";
        }

        environmentContent += `${keyName}=${keyValue}`;

        console.log(`✅ Added ${keyName} to .env file`);
    }

    fs.writeFileSync(environmentPath, environmentContent);

    return true;
};

(() => {
    console.log("🔐 Generating encryption key...");

    const encryptionKey = generateEncryptionKey();

    console.log("Generated ENCRYPTION_KEY:");
    console.log("========================");
    console.log(encryptionKey);
    console.log("========================");

    if (checkKeyInEnvironment("ENCRYPTION_KEY")) {
        console.log("ℹ️  ENCRYPTION_KEY already exists in .env file with a value");
        console.log("💡 If you want to regenerate, remove the existing value first");
    } else {
        const updated = updateEnvironmentFile("ENCRYPTION_KEY", encryptionKey);

        if (updated) {
            console.log("📁 .env file updated successfully!");
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
    console.log("- If compromised, generate a new key immediately");

    console.log("✅ Key generation complete!");
})();
