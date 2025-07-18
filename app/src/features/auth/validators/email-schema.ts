import { z } from "zod/v4";

const emailSchema = z
    .string()
    .min(5)
    .max(254)
    .refine(
        (value) => {
            // Basic email structure check
            const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;

            if (!emailRegex.test(value))
                return false;

            const [local, domain] = value.split("@");

            if (!local || !domain)
                return false;

            // Block aliasing via "+"
            if (local.includes("+"))
                return false;

            // Block double dots in local or domain
            if (local.includes("..") || domain.includes(".."))
                return false;

            // Local part must not start or end with "."
            if (local.startsWith(".") || local.endsWith("."))
                return false;

            // Domain must have at least one dot (e.g., gmail.com)
            if (!domain.includes("."))
                return false;

            // Domain TLD must be at least 2 chars
            const domainParts = domain.split(".");
            const tld = domainParts[domainParts.length - 1];

            if (tld.length < 2)
                return false;

            return true;
        },
        {
            message: "Invalid email format or aliasing not allowed",
        },
    );

export default emailSchema;
