import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGravatar } from "./use-gravatar";
import * as gravatarUtils from "../lib/gravatar-utils";
import type { GravatarOptions } from "../types/ui-configuration-types";

// Mock getGravatarUrl
vi.mock("../lib/gravatar-utils", () => ({
    getGravatarUrl: vi.fn(),
}));

const mockGetGravatarUrl = vi.mocked(gravatarUtils.getGravatarUrl);

describe("useGravatar", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns null if email is empty", async () => {
        const { result } = renderHook(() => useGravatar(""));
        expect(result.current).toBeNull();
    });

    it("returns null if email is null", async () => {
        const { result } = renderHook(() => useGravatar(null));
        expect(result.current).toBeNull();
    });

    it("returns null if email is undefined", async () => {
        const { result } = renderHook(() => useGravatar(undefined));
        expect(result.current).toBeNull();
    });

    it("returns gravatar URL after async fetch", async () => {
        mockGetGravatarUrl.mockResolvedValueOnce("https://gravatar.com/avatar/mockhash");
        const { result } = renderHook(() => useGravatar("test@example.com"));
        await expect.poll(() => result.current).toBe("https://gravatar.com/avatar/mockhash");
        expect(mockGetGravatarUrl).toHaveBeenCalledWith("test@example.com", undefined);
    });

    it("updates when email changes", async () => {
        mockGetGravatarUrl.mockResolvedValueOnce("https://gravatar.com/avatar/first");
        const { result, rerender } = renderHook(({ email }) => useGravatar(email), {
            initialProps: { email: "first@example.com" },
        });
        await expect.poll(() => result.current).toBe("https://gravatar.com/avatar/first");

        mockGetGravatarUrl.mockResolvedValueOnce("https://gravatar.com/avatar/second");
        rerender({ email: "second@example.com" });
        await expect.poll(() => result.current).toBe("https://gravatar.com/avatar/second");
    });

    it("updates when options change", async () => {
        mockGetGravatarUrl.mockResolvedValueOnce("https://gravatar.com/avatar/opt1");
        const { result, rerender } = renderHook(({ options }) => useGravatar("test@example.com", options), {
            initialProps: { options: { size: 80 } as GravatarOptions },
        });
        await expect.poll(() => result.current).toBe("https://gravatar.com/avatar/opt1");

        mockGetGravatarUrl.mockResolvedValueOnce("https://gravatar.com/avatar/opt2");
        rerender({ options: { size: 200 } as GravatarOptions });
        await expect.poll(() => result.current).toBe("https://gravatar.com/avatar/opt2");
    });

    it("returns null if getGravatarUrl throws", async () => {
        mockGetGravatarUrl.mockRejectedValueOnce(new Error("fail"));
        const { result } = renderHook(() => useGravatar("test@example.com"));
        await expect.poll(() => result.current).toBeNull();
    });
});
