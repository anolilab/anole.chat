import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sha256 } from "@/lib/crypto";

import type { GravatarOptions } from "../types/ui-configuration-types";
import { getGravatarUrl } from "./gravatar-utils";

// Mock the crypto module
vi.mock("@/lib/crypto", () => {
    return {
        sha256: vi.fn(),
    };
});

const mockSha256 = vi.mocked(sha256);

describe("gravatar utilities", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementations
        mockSha256.mockImplementation(async (data: string) => {
            // Return real hashes for testing
            const hashes: Record<string, string> = {
                "åse@example.com": "765ca68cd83ca61fe3cf74933307bb81e0bb873435a131d95877bb84d1355980",
                "josé@example.com": "b0a53cf19e34d05b57bced7365c6b00ddbe38d62957e863de2a66a56c3b42cea",
                "test@example.com": "973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b",
                "test@münchen.de": "9d34553b3590d8a02d95b3a1616a0928e38cf491871dc86f8fede1177a7acffb",
                "user+🚀@example.com": "15c81e85d593a05b2adffa997257533db6c7f00ceb3af9249b318a03bc70785c",
            };

            return hashes[data] || `mock-hash-${data.length.toString().padStart(60, "0")}`;
        });
    });

    describe("getGravatarUrl (async)", () => {
        it("should return null for empty email", async () => {
            const result = await getGravatarUrl("");

            expect(result).toBeNull();
        });

        it("should return null for null email", async () => {
            const result = await getGravatarUrl(null);

            expect(result).toBeNull();
        });

        it("should return null for undefined email", async () => {
            const result = await getGravatarUrl(undefined);

            expect(result).toBeNull();
        });

        it("should generate basic gravatar URL", async () => {
            const email = "test@example.com";
            const result = await getGravatarUrl(email);

            expect(mockSha256).toHaveBeenCalledWith("test@example.com");
            expect(result).toBe("https://gravatar.com/avatar/973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b");
        });

        it("should normalize email (trim and lowercase)", async () => {
            const email = "  TEST@EXAMPLE.COM  ";

            await getGravatarUrl(email);

            expect(mockSha256).toHaveBeenCalledWith("test@example.com");
        });

        it("should handle UTF-8 characters correctly", async () => {
            const testCases = [
                { input: "José@example.com", normalized: "josé@example.com" },
                { input: "test@MÜNCHEN.de", normalized: "test@münchen.de" },
                { input: "user+🚀@example.com", normalized: "user+🚀@example.com" },
                { input: "Åse@Example.COM", normalized: "åse@example.com" },
            ];

            for (const testCase of testCases) {
                await getGravatarUrl(testCase.input);

                expect(mockSha256).toHaveBeenCalledWith(testCase.normalized);
            }
        });

        it("should handle basic options correctly", async () => {
            const options: GravatarOptions = {
                d: "mp",
                forceDefault: true,
                jpg: true,
                size: 80,
            };

            const result = await getGravatarUrl("test@example.com", options);

            expect(result).toBe("https://gravatar.com/avatar/973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b.jpg?s=80&d=mp&f=y");
        });

        it("should handle size constraints", async () => {
            const testCases = [
                { expected: "1", size: -5 }, // Below minimum
                { expected: "1", size: 0 }, // At minimum boundary
                { expected: "1", size: 1 }, // Valid minimum
                { expected: "512", size: 512 }, // Valid size
                { expected: "2048", size: 2048 }, // Valid maximum
                { expected: "2048", size: 3000 }, // Above maximum
            ];

            for (const testCase of testCases) {
                const result = await getGravatarUrl("test@example.com", { size: testCase.size });

                expect(result).toContain(`s=${testCase.expected}`);
            }
        });

        it("should handle individual options", async () => {
            // Test size only
            let result = await getGravatarUrl("test@example.com", { size: 200 });

            expect(result).toContain("s=200");
            expect(result).not.toContain("d=");
            expect(result).not.toContain("f=");
            expect(result).not.toContain(".jpg");

            // Test default image only
            result = await getGravatarUrl("test@example.com", { d: "identicon" });

            expect(result).toContain("d=identicon");
            expect(result).not.toContain("s=");
            expect(result).not.toContain("f=");

            // Test force default only
            result = await getGravatarUrl("test@example.com", { forceDefault: true });

            expect(result).toContain("f=y");
            expect(result).not.toContain("s=");
            expect(result).not.toContain("d=");

            // Test jpg extension only
            result = await getGravatarUrl("test@example.com", { jpg: true });

            expect(result).toContain(".jpg");
            expect(result).not.toContain("?");
        });

        it("should handle errors gracefully", async () => {
            mockSha256.mockRejectedValue(new Error("Crypto error"));

            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            const result = await getGravatarUrl("test@example.com");

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith("Error generating Gravatar URL:", expect.any(Error));

            consoleSpy.mockRestore();
        });
    });
});
