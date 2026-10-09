import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  api,
  backend,
  parseSummary,
  safeReturn,
  setToken,
  storedToken,
  refreshAccessToken,
} from "../src/lib/api";
const response = (
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
) => ({ config, data, status, statusText: String(status), headers: {} });
const reject = (
  config: InternalAxiosRequestConfig,
  status = 401,
  data = { message: "Invalid token" },
) =>
  Promise.reject(
    new AxiosError(
      "Request failed",
      "ERR_BAD_REQUEST",
      config,
      undefined,
      response(config, data, status),
    ),
  );
const adapter = api.defaults.adapter;
beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  });
  setToken("old-token");
});
afterEach(() => {
  api.defaults.adapter = adapter;
  vi.unstubAllGlobals();
});
describe("existing backend contract", () => {
  it("serializes refresh and retries concurrent protected requests once", async () => {
    let refreshes = 0;
    api.defaults.adapter = async (c) => {
      if (c.url === "/api/auth/refresh") {
        refreshes++;
        await new Promise((r) => setTimeout(r, 20));
        return response(c, { accessToken: "new-token" });
      }
      if (c.headers.Authorization === "Bearer old-token") return reject(c);
      return response(c, { id: "self" });
    };
    await Promise.all([backend.me(), backend.me(), backend.me()]);
    expect(refreshes).toBe(1);
    expect(storedToken()).toBe("new-token");
  });
  it("rejects every waiter on refresh failure without recursion", async () => {
    let refreshes = 0;
    api.defaults.adapter = async (c) => {
      if (c.url === "/api/auth/refresh") {
        refreshes++;
        await new Promise((r) => setTimeout(r, 10));
      }
      return reject(c);
    };
    const result = await Promise.allSettled([backend.me(), backend.me()]);
    expect(result.every((r) => r.status === "rejected")).toBe(true);
    expect(refreshes).toBe(1);
    expect(storedToken()).toBeNull();
  });
  it("authenticates password validation but never refreshes for a wrong room password", async () => {
    const paths: string[] = [];
    api.defaults.adapter = (c) => {
      paths.push(c.url!);
      expect(c.headers.Authorization).toBe("Bearer old-token");
      return reject(c, 401, { message: "Password is incorrect" });
    };
    await expect(backend.password("wrong", "room-code")).rejects.toThrow();
    expect(paths).toEqual(["/api/meeting/get-meeting-validation"]);
    expect(storedToken()).toBe("old-token");
  });
  it("does not refresh invalid login credentials", async () => {
    let calls = 0;
    api.defaults.adapter = (c) => {
      calls++;
      return reject(c);
    };
    await expect(backend.login("a@b.com", "badpass")).rejects.toThrow();
    expect(calls).toBe(1);
  });
  it("does not resurrect a session when an in-flight refresh finishes after logout", async () => {
    let resolve!: () => void;
    const ready = new Promise<void>((r) => {
      resolve = r;
    });
    api.defaults.adapter = async (c) => {
      await ready;
      return response(c, { accessToken: "late-token" });
    };
    const pending = refreshAccessToken();
    setToken(null);
    resolve();
    await expect(pending).rejects.toThrow("session changed");
    expect(storedToken()).toBeNull();
  });
  it("rejects logical access errors returned as HTTP 200", async () => {
    api.defaults.adapter = async (c) =>
      response(c, { success: false, message: "Meeting is not purchased" });
    await expect(backend.validateAccess("self", "code")).rejects.toThrow(
      "not purchased",
    );
  });
  it("uses database UUID for demo purchase and meeting code for insights", async () => {
    const seen: Array<[string, unknown]> = [];
    api.defaults.adapter = async (c) => {
      seen.push([c.url!, c.data]);
      return response(c, {
        success: true,
        summary: "{}",
        meeting: {
          title: "Meeting",
          password: "must-never-render",
          summary: { transcription: "Actual words" },
        },
      });
    };
    await backend.purchase("self-id", "database-id");
    const result = await backend.insights("call-code");
    expect(JSON.parse(seen[0][1] as string)).toEqual({
      userId: "self-id",
      meetingId: "database-id",
    });
    expect(seen[1][0]).toBe("/api/meeting/summary/call-code");
    expect(result.transcription).toBe("Actual words");
    expect(result).not.toHaveProperty("password");
  });
  it("uploads a real multipart audio field without forcing a boundary", async () => {
    api.defaults.adapter = async (c) => {
      expect(c.data).toBeInstanceOf(FormData);
      expect((c.data as FormData).get("audio")).toBeInstanceOf(Blob);
      return response(c, { success: true, message: '{"overview":"Saved"}' });
    };
    expect(
      (
        await backend.summarize(
          "call-code",
          new Blob(["audio"], { type: "audio/webm" }),
        )
      ).overview,
    ).toBe("Saved");
  });
  it("normalizes fenced summaries and safely retains legacy text", () => {
    expect(
      parseSummary('```json\n{"overview":"Hello","keyPoints":["One",42]}\n```'),
    ).toMatchObject({
      overview: "Hello",
      keyPoints: ["One"],
      actionItems: [],
      decisions: [],
    });
    expect(parseSummary("Legacy plain text").raw).toBe("Legacy plain text");
  });
  it("keeps safe meeting returns and rejects external/auth/control redirects", () => {
    expect(safeReturn("/meeting/abc?x=1")).toBe("/meeting/abc?x=1");
    for (const path of [
      "//evil.test",
      "https://evil.test",
      "/\\evil.test",
      "/auth/login",
      "/\n/evil.test",
    ])
      expect(safeReturn(path)).toBe("/dashboard");
  });
});
