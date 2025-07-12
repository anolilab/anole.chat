const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

if (!ENCRYPTION_KEY && typeof window === "undefined") {
    throw new Error("ENCRYPTION_KEY is required")
}

const ALGORITHM = "AES-GCM"

if (ENCRYPTION_KEY && ENCRYPTION_KEY.length < 8) {
    throw new Error("ENCRYPTION_KEY must be at least 8 characters long")
}

const baseKeyBuffer = Uint8Array.from(atob(ENCRYPTION_KEY ?? ""), (c) => c.charCodeAt(0))

// Repeat the key until we have 32 bytes
const keyBuffer = new Uint8Array(32)

for (let i = 0; i < 32; i++) {
    keyBuffer[i] = baseKeyBuffer[i % baseKeyBuffer.length]
}

let cryptoKey: CryptoKey | null = null

async function getCryptoKey(): Promise<CryptoKey> {
    if (!cryptoKey) {
        cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyBuffer,
            { name: ALGORITHM, length: 256 },
            false,
            ["encrypt", "decrypt"]
        )
    }
    return cryptoKey
}

export async function encryptKey(plaintext: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await getCryptoKey()
    const plaintextBytes = new TextEncoder().encode(plaintext)
    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        plaintextBytes
    )

    // Combine IV + encrypted data into a single base64 string
    const encryptedArray = new Uint8Array(encryptedBuffer)
    const combined = new Uint8Array(iv.length + encryptedArray.length)
    combined.set(iv, 0)
    combined.set(encryptedArray, iv.length)

    return btoa(String.fromCharCode(...combined))
}

export async function decryptKey(encryptedData: string): Promise<string> {
    // Decode the combined data
    const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0))

    // Extract IV (first 12 bytes) and encrypted data (rest)
    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)

    const key = await getCryptoKey()
    const decryptedBuffer = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, encrypted)

    return new TextDecoder().decode(decryptedBuffer)
}

export function maskKey(key: string): string {
    if (key.length <= 8) {
        return "*".repeat(key.length)
    }
    
    return key.slice(0, 4) + "*".repeat(key.length - 8) + key.slice(-4)
}