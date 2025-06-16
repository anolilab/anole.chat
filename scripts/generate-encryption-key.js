#!/usr/bin/env node

import crypto from "crypto";
import { EnvHelper } from "./env-helper.js";

const generateEncryptionKey = () => {
    const key = crypto.randomBytes(32);
    return key.toString("base64");
};

(async () => {
    console.log("🔐 Managing encryption key...\n");

    const envHelper = new EnvHelper();

    await envHelper.ensureKey("ENCRYPTION_KEY", generateEncryptionKey, "AES-256-GCM encryption key for secure data encryption");

    envHelper.displaySecurityWarning("encryption key");

    console.log("✅ Encryption key management complete!");
})();
