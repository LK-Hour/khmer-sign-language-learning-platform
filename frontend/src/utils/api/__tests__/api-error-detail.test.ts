/**
 * apiFetch error propagation tests.
 *
 * Verifies that a failed response's body (FastAPI `{ "detail": ... }`) is
 * surfaced on the thrown {@link ApiError} instead of being discarded.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { ApiError, apiFetch } from "@/utils/api/client";

vi.mock("@/store/auth.store", () => ({
  useAuthStore: {
    getState: () => ({
      user: null,
      token: null,
      isTokenExpired: () => false,
      setRefreshing: () => {},
      setAccessToken: () => {},
      clear: () => {},
    }),
  },
}));

describe("apiFetch error detail propagation", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function mockResponse(body: string, status: number, contentType = "application/json") {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(body, {
          status,
          headers: { "Content-Type": contentType },
        }),
    ) as typeof fetch;
  }

  it("surfaces a string detail as the ApiError message", async () => {
    mockResponse(JSON.stringify({ detail: "Name already exists" }), 409);

    const err = await apiFetch("/api/units", { skipAuth: true }).catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(409);
    expect((err as ApiError).message).toBe("Name already exists");
    expect((err as ApiError).detail).toBe("Name already exists");
  });

  it("joins FastAPI validation error arrays into a message", async () => {
    mockResponse(
      JSON.stringify({
        detail: [
          { loc: ["body", "name"], msg: "field required" },
          { loc: ["body", "order"], msg: "must be positive" },
        ],
      }),
      422,
    );

    const err = await apiFetch("/api/units", { skipAuth: true }).catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe("field required; must be positive");
  });

  it("falls back to a generic message when the body is empty", async () => {
    mockResponse("", 500);

    const err = await apiFetch("/api/units", { skipAuth: true }).catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe("API 500: /api/units");
  });

  it("surfaces a non-JSON error body verbatim", async () => {
    mockResponse("Bad Gateway", 502, "text/plain");

    const err = await apiFetch("/api/units", { skipAuth: true }).catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe("Bad Gateway");
  });
});
