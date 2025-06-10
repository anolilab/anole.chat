import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { symmetricDecrypt } from "better-auth/crypto";
import { SignJWT, importJWK } from "jose";
import { ALGORITHM, AUDIENCE, ISSUER, betterAuth } from "./server";
import { env } from "@/lib/env";

interface JWKModel {
    id: string;
    publicKey: string;
    privateKey: string;
    createdAt: string;
}

async function getJwkDetails() {
    const adapter = (await betterAuth.$context).adapter;
    const [jwkRecord] = await adapter.findMany<JWKModel>({
        model: "jwks",
        sortBy: {
            field: "createdAt",
            direction: "desc",
        },
        limit: 1,
    });

    if (!jwkRecord) {
        console.error("No JWK found in the database for OIDC signing.");
        throw new Error("OIDC signing key not configured.");
    }

    // The 'privateKey' field from the DB stores the *encrypted* JWK. Decrypt it.
    const decryptedJwkString = JSON.parse(
        await symmetricDecrypt({
            key: env.VITE_BETTER_AUTH_SECRET,
            data: JSON.parse(jwkRecord.privateKey),
        }),
    );

    // Load decrypted JWK into jose
    const privateKey = await importJWK(decryptedJwkString, ALGORITHM);

    return {
        privateKey,
        keyId: jwkRecord.id,
    };
}

export const getConvexToken = createServerFn({
    method: "GET",
    response: "data",
}).handler(async () => {
    const session = await betterAuth.api.getSession({
        headers: getWebRequest()?.headers ?? new Headers(),
    });
    if (!session) return { error: "Unauthorized" };

    const { privateKey, keyId } = await getJwkDetails();

    return new SignJWT({
        sub: session.user.id,
    })
        .setProtectedHeader({ alg: ALGORITHM, kid: keyId })
        .setIssuedAt()
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime("1h")
        .sign(privateKey)
        .then((token) => ({ data: token }))
        .catch((error) => {
            console.error("Failed to sign token", error);
            return { error: "Failed to sign token" };
        });
});
