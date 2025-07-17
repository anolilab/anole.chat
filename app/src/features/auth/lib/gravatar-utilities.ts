import { sha256 } from "crypto-hash";

import type { GravatarOptions } from "../types/ui-configuration-types";

/**
 * Generates a Gravatar URL for a given email address asynchronously. Returns undefined if the email is invalid or an error occurs.
 * @param email The email address to generate the Gravatar for.
 * @param options Optional Gravatar options (size, default image, force default, jpg extension).
 * @returns A Promise resolving to the Gravatar URL string, or undefined if invalid.
 */
export const getGravatarUrl = async (
    email?: string | ArrayBuffer | ArrayBufferView<ArrayBufferLike>,
    options?: GravatarOptions,
): Promise<string | undefined> => {
    if (!email || typeof email !== "string") return undefined;

    try {
        // Normalize email: trim and lowercase
        const normalizedEmail = email.trim().toLowerCase();
        const hash = await sha256(normalizedEmail);

        const extension = options?.jpg ? ".jpg" : "";
        let url = `https://gravatar.com/avatar/${hash}${extension}`;

        const parameters = new URLSearchParams();

        if (typeof options?.size === "number") {
            // Constrain size between 1 and 2048 pixels
            const size = Math.min(Math.max(options.size, 1), 2048);

            parameters.append("s", size.toString());
        }

        if (options?.d) {
            parameters.append("d", options.d);
        }

        if (options?.forceDefault) {
            parameters.append("f", "y");
        }

        const queryString = parameters.toString();

        if (queryString) {
            url += `?${queryString}`;
        }

        return url;
    } catch (error) {
        console.error("Error generating Gravatar URL:", error);

        return undefined;
    }
};
