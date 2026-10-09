import { test, expect, type Page, type Route } from "@playwright/test";
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Alex Morgan",
  email: "alex@example.test",
  provider: "local",
};
const own = {
  meetingId: "22222222-2222-4222-8222-222222222222",
  title: "Design conversation",
  description: "Review the next release",
  type: "Free",
  hostName: user.name,
  price: 0,
  meetingTime: "2027-01-01T10:00:00.000Z",
  isProtected: false,
  isInstant: false,
  meetingCode: "room-own",
  createdById: user.id,
  isComplete: false,
};
const paid = {
  ...own,
  meetingId: "33333333-3333-4333-8333-333333333333",
  meetingCode: "room-paid",
  title: "Strategy session",
  type: "Paid",
  price: 500,
  hostName: "Sam Lee",
  createdById: "44444444-4444-4444-8444-444444444444",
};
const finished = {
  ...own,
  meetingId: "55555555-5555-4555-8555-555555555555",
  meetingCode: "room-done",
  title: "Planning retrospective",
  isComplete: true,
};
const headers = {
  "access-control-allow-origin": "http://127.0.0.1:5173",
  "access-control-allow-credentials": "true",
  "access-control-allow-headers": "authorization,content-type",
  "access-control-allow-methods": "GET,POST,OPTIONS",
};
async function json(route: Route, data: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers,
    body: JSON.stringify(data),
  });
}
type Handler = (route: Route, path: string) => Promise<boolean>;
async function fixture(page: Page, handler?: Handler, authenticated = true) {
  if (authenticated)
    await page.addInitScript(() =>
      localStorage.setItem("accessToken", "browser-test-token"),
    );
  await page.route("**/api/**", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    const path = new URL(route.request().url()).pathname;
    if (handler && (await handler(route, path))) return;
    const data: Record<string, unknown> = {
      "/api/user/me": user,
      "/api/user/get-dashboard-stats": {
        success: true,
        dashboardStats: {
          myTotalMeetings: 1,
          completedMeetings: 1,
          totalEarning: 0,
          totalMeetings: 3,
          activeUsers: 2,
        },
      },
      "/api/user/get-dashboard-allmeetings": {
        success: true,
        myMeetings: [{ id: own.meetingId, title: own.title, type: "free" }],
      },
      "/api/meeting/get-meetings": {
        success: true,
        meetings: [own, paid, finished],
        purchases: [],
      },
      "/api/meeting/get-booked-meetings": { success: true, bookings: [] },
      "/api/payment/get-payments": { success: true, payments: [] },
      "/api/meeting/validate-access": { success: true },
      "/api/meeting/get-isProtected": { success: true, isProtected: false },
      "/api/auth/logout": { message: "Logged out" },
    };
    if (path === "/api/auth/refresh") {
      await json(route, { message: "No session" }, 401);
      return;
    }
    await json(
      route,
      data[path] || { success: false, message: "Unconfigured test request" },
      data[path] ? 200 : 404,
    );
  });
}
test("landing and mobile sign in have no horizontal overflow", async ({
  page,
}) => {
  await fixture(page, undefined, false);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Good conversations/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/auth/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/auth-mobile.png",
    fullPage: true,
  });
});
test("protected deep link preserves return and login uses real contract", async ({
  page,
}) => {
  let loginBody: unknown;
  await fixture(
    page,
    async (r, p) => {
      if (p === "/api/auth/login") {
        loginBody = r.request().postDataJSON();
        await json(r, { accessToken: "signed-in" });
        return true;
      }
      return false;
    },
    false,
  );
  await page.goto("/meeting/shared-room");
  await expect(page).toHaveURL(/auth\/login\?returnTo=/);
  expect(new URL(page.url()).searchParams.get("returnTo")).toBe(
    "/meeting/shared-room",
  );
  await page.getByLabel("Email address").fill("alex@example.test");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/meeting\/shared-room/);
  expect(loginBody).toEqual({
    email: "alex@example.test",
    password: "password123",
  });
});
test("OAuth root token is consumed and removed", async ({ page }) => {
  await fixture(page);
  await page.goto("/?access=oauth-token");
  await expect(page).toHaveURL(/dashboard$/);
  expect(await page.evaluate(() => localStorage.getItem("accessToken"))).toBe(
    "oauth-token",
  );
});
test("dashboard renders backend counts and mobile navigation", async ({
  page,
}) => {
  await fixture(page);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Hey, Alex." })).toBeVisible();
  await expect(
    page.getByText("Design conversation", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "My bookings", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "My bookings" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/bookings-mobile.png",
    fullPage: true,
  });
});
test("wrong meeting password carries auth and never refreshes or loads video", async ({
  page,
}) => {
  let refresh = 0;
  let passwordAuth = "";
  await fixture(page, async (r, p) => {
    if (p === "/api/auth/refresh") refresh++;
    if (p === "/api/meeting/get-isProtected") {
      await json(r, { success: true, isProtected: true });
      return true;
    }
    if (p === "/api/meeting/get-meeting-validation") {
      passwordAuth = r.request().headers().authorization;
      await json(
        r,
        { success: true, isMatched: false, message: "Password is incorrect" },
        401,
      );
      return true;
    }
    return false;
  });
  await page.goto("/meeting/room-own");
  await page.getByLabel("Meeting password").fill("incorrect");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Password is incorrect");
  expect(refresh).toBe(0);
  expect(passwordAuth).toBe("Bearer browser-test-token");
});
test("unbought paid deep link cannot initialize video", async ({ page }) => {
  let tokens = 0;
  await fixture(page, async (r, p) => {
    if (p === "/api/meeting/token") tokens++;
    if (p === "/api/meeting/validate-access") {
      await json(r, { success: false, message: "Meeting is not purchased" });
      return true;
    }
    return false;
  });
  await page.goto("/meeting/room-paid");
  await expect(page.getByRole("alert")).toContainText("not purchased");
  expect(tokens).toBe(0);
});
test("demo checkout sends database UUID and shows clear disclosure", async ({
  page,
}) => {
  let body: unknown;
  await fixture(page, async (r, p) => {
    if (p === "/api/payment/demo-payment") {
      body = r.request().postDataJSON();
      await json(r, { success: true });
      return true;
    }
    return false;
  });
  await page.goto("/dashboard/meetings");
  await page.getByRole("tab", { name: "Discover", exact: true }).click();
  await page
    .getByRole("button", { name: "Demo checkout", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "No money will be charged",
  );
  await page.getByRole("button", { name: "Confirm demo booking" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(body).toEqual({ userId: user.id, meetingId: paid.meetingId });
});
test("summary transcription and failed question retry use existing APIs", async ({
  page,
}) => {
  let chat = 0;
  await fixture(page, async (r, p) => {
    if (p.includes("/summary/")) {
      await json(r, {
        success: true,
        summary:
          '{"overview":"A clear next step","keyPoints":["Ship together"]}',
        meeting: {
          title: finished.title,
          startingTime: finished.meetingTime,
          password: "never-show-this",
          summary: { transcription: "Transcript from actual response" },
        },
      });
      return true;
    }
    if (p.includes("/chat/")) {
      chat++;
      await json(
        r,
        chat === 1
          ? { message: "Try later" }
          : { success: true, answer: "Release next week" },
        chat === 1 ? 500 : 200,
      );
      return true;
    }
    return false;
  });
  await page.goto("/meeting/room-done/insights");
  await expect(
    page.getByText("A clear next step", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Transcript from actual response")).toBeVisible();
  await expect(page.getByText("never-show-this")).not.toBeVisible();
  await page.getByLabel("Question about this meeting").fill("What is next?");
  await page.getByRole("button", { name: "Ask HeyMint", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Try later");
  await page.getByRole("button", { name: "Retry question" }).click();
  await expect(
    page.getByText("Release next week", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/insights-desktop.png",
    fullPage: true,
  });
});
test("404 insights renders empty state and real upload with retry", async ({
  page,
}) => {
  let uploads = 0;
  await fixture(page, async (r, p) => {
    if (p.includes("/summary/")) {
      await json(r, { message: "Summary not found" }, 404);
      return true;
    }
    if (p.includes("/summarize/")) {
      uploads++;
      expect(r.request().headers()["content-type"]).toContain(
        "multipart/form-data; boundary=",
      );
      expect(r.request().postData()).toContain('name="audio"');
      await json(
        r,
        uploads === 1
          ? { message: "Processing failed" }
          : { success: true, message: '{"overview":"Uploaded summary"}' },
        uploads === 1 ? 500 : 200,
      );
      return true;
    }
    return false;
  });
  await page.goto("/meeting/room-done/insights");
  await expect(
    page.getByRole("heading", { name: "Good ideas are worth keeping." }),
  ).toBeVisible();
  await page
    .getByText("Recover insights using an audio file", { exact: true })
    .click();
  await page.getByLabel("Meeting audio", { exact: true }).setInputFiles({
    name: "meeting.webm",
    mimeType: "audio/webm",
    buffer: Buffer.from("test recording"),
  });
  await page.getByLabel("I have consent from everyone").check();
  await page.getByRole("button", { name: "Upload audio", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Processing failed");
  await page.getByRole("button", { name: "Retry upload" }).click();
  await expect(
    page.getByText("Uploaded summary", { exact: true }),
  ).toBeVisible();
});
test("creation uses exact payload and retries video setup without duplicate DB creation", async ({
  page,
}) => {
  let setup = 0;
  let payload: Record<string, unknown> = {};
  await fixture(page, async (r, p) => {
    if (p === "/api/meeting/setup-meeting") {
      setup++;
      payload = r.request().postDataJSON();
      await json(r, { success: true });
      return true;
    }
    return false;
  });
  await page.route("**/src/lib/video.ts*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: 'let attempts=0; export async function initializeMeetingCall(){if(++attempts===1)throw new Error("Video unavailable");} export async function createVideoClient(){throw new Error("Not used in this test");}',
    }),
  );
  await page.goto("/dashboard/addmeeting?scheduled=true");
  await page.getByLabel("Meeting title").fill("New team session");
  await page.getByLabel(/^Description/).fill("A focused conversation");
  await page
    .getByLabel("Date and time")
    .fill(new Date(Date.now() + 86_400_000).toISOString().slice(0, 16));
  await page
    .getByRole("button", { name: "Create meeting", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Video unavailable");
  await page.getByRole("button", { name: "Retry creation" }).click();
  await expect(
    page.getByRole("heading", { name: "You’ve made room." }),
  ).toBeVisible();
  expect(setup).toBe(1);
  expect(payload).toMatchObject({
    title: "New team session",
    description: "A focused conversation",
    isScheduled: true,
    isPaid: false,
    isProtected: false,
    price: 0,
    createdBy: user.id,
    password: "",
  });
  expect(Number.isNaN(Date.parse(String(payload.startingTime)))).toBe(false);
  expect(payload.meetingCode).toMatch(/^[\da-f-]{36}$/);
});

test("registration sends email OTP then the six-digit signup contract", async ({
  page,
}) => {
  let email: unknown;
  let signup: unknown;
  await fixture(
    page,
    async (r, p) => {
      if (p === "/api/auth/send-otp") {
        email = r.request().postDataJSON();
        await json(r, { success: true, message: "OTP sent" });
        return true;
      }
      if (p === "/api/auth/signup") {
        signup = r.request().postDataJSON();
        await json(r, { accessToken: "registered" });
        return true;
      }
      return false;
    },
    false,
  );
  await page.goto("/auth/signup");
  await page.getByLabel("Email address").fill("new@example.test");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Send code", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Check your inbox");
  await page.getByLabel("Verification code").fill("123456");
  await page
    .getByRole("button", { name: "Create your account", exact: true })
    .click();
  await expect(page).toHaveURL(/dashboard$/);
  expect(email).toEqual({ email: "new@example.test" });
  expect(signup).toEqual({
    email: "new@example.test",
    password: "password123",
    otp: "123456",
  });
});
test("profile update only submits the current account and payment rows come from backend", async ({
  page,
}) => {
  let body: unknown;
  let changed = false;
  await fixture(page, async (r, p) => {
    if (p === "/api/user/update-user") {
      body = r.request().postDataJSON();
      changed = true;
      await json(r, { success: true });
      return true;
    }
    if (p === "/api/user/me" && changed) {
      await json(r, { ...user, name: "Alex Updated" });
      return true;
    }
    if (p === "/api/payment/get-payments") {
      await json(r, {
        success: true,
        payments: [
          {
            id: "transaction-actual-id",
            meetingName: "Paid conversation",
            amount: 500,
            status: "success",
            date: "2026-10-01T10:00:00Z",
            paymentMethod: "UPI",
          },
        ],
      });
      return true;
    }
    return false;
  });
  await page.goto("/dashboard/profile");
  await page.getByLabel(/^Display name/).fill("Alex Updated");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "Alex Updated", exact: true }),
  ).toBeVisible();
  expect(body).toEqual({ id: user.id, newName: "Alex Updated" });
  await page.goto("/dashboard/payments");
  await expect(page.getByRole("table")).toContainText("transaction-actual-id");
  await expect(page.getByRole("table")).toContainText("UPI · Demo");
});
test("completed bookings are reconciled and never expose an active join action", async ({
  page,
}) => {
  await fixture(page, async (r, p) => {
    if (p === "/api/meeting/get-booked-meetings") {
      const booking = {
        meetingId: finished.meetingId,
        title: finished.title,
        description: finished.description,
        hostName: finished.hostName,
        price: 0,
        isProtected: false,
        meetingTime: finished.meetingTime,
        meetingCode: finished.meetingCode,
        isInstant: false,
        createdById: finished.createdById,
      };
      await json(r, { success: true, bookings: [booking] });
      return true;
    }
    return false;
  });
  await page.goto("/dashboard/bookings");
  await expect(page.getByRole("link", { name: "View insights" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Join meeting", exact: true }),
  ).not.toBeVisible();
});
test("network errors are visible and retry restores server records", async ({
  page,
}) => {
  let fail = true;
  await fixture(page, async (r, p) => {
    if (p === "/api/meeting/get-meetings" && fail) {
      await json(
        r,
        { success: false, message: "Temporarily unavailable" },
        503,
      );
      return true;
    }
    return false;
  });
  await page.goto("/dashboard/meetings");
  await expect(page.getByRole("alert")).toContainText(
    "Temporarily unavailable",
  );
  fail = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("heading", { name: own.title })).toBeVisible();
});

// These adapters exercise the real room/notes UI without a live Stream account.
async function notesVideoFixture(page: Page) {
  await page.route("**/src/lib/video.ts*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `export async function createVideoClient() { return { call: () => window.__notesCall, disconnectUser: async () => {} }; }`,
    }),
  );
  await page.route(
    "**/node_modules/.vite/deps/@stream-io_video-react-sdk.js*",
    (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: `
      import React from '/node_modules/.vite/deps/react.js';
      const { useSyncExternalStore } = React;
      const listeners = new Set(); const events = new Map(); let state = 'idle';
      const publish = () => listeners.forEach(fn => fn());
      const device = { disable: async () => {}, toggle: async () => {}, select: async () => {} };
      const call = window.__notesCall = {
        state: {}, camera: device, microphone: device, screenShare: device,
        getOrCreate: async () => {}, get: async () => {},
        join: async () => { state = 'joined'; publish(); },
        leave: async () => { state = 'left'; publish(); },
        endCall: async () => { (events.get('call.ended') || []).forEach(fn => fn()); },
        on: (name, fn) => { const list = events.get(name) || []; list.push(fn); events.set(name, list); return () => events.set(name, list.filter(x => x !== fn)); }
      };
      export const CallingState = { JOINED: 'joined', LEFT: 'left', RECONNECTING: 'reconnecting' };
      export const useCall = () => call;
      const status = { isMute: true, hasBrowserPermission: true, devices: [], camera: device, microphone: device, speaker: device, screenShare: device };
      export const useCallStateHooks = () => ({
        useCameraState: () => status, useMicrophoneState: () => status, useSpeakerState: () => status,
        useScreenShareState: () => status, useParticipants: () => [],
        useCallCallingState: () => useSyncExternalStore(fn => { listeners.add(fn); return () => listeners.delete(fn); }, () => state)
      });
      export const StreamVideo = ({children}) => children;
      export const StreamCall = StreamVideo;
      export const VideoPreview = () => null;
      export const SpeakerLayout = VideoPreview, PaginatedGridLayout = VideoPreview, ReactionsButton = VideoPreview, CallStatsButton = VideoPreview, CallParticipantsList = VideoPreview;
    `,
      }),
  );
  await page.route("**/src/lib/meeting-recorder.ts*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `export class MeetingRecorder {
      error = null;
      async start() { window.__notesStarts = (window.__notesStarts || 0) + 1; }
      async stop() { window.__notesStops = (window.__notesStops || 0) + 1; return new Blob(['all participants'], {type: 'audio/webm'}); }
      dispose() {}
    }`,
    }),
  );
}

test("AI notes capture on join, auto-submit on end, and retry the same audio", async ({
  page,
}) => {
  let uploads = 0;
  let completions = 0;
  await fixture(page, async (r, path) => {
    if (path === "/api/meeting/delete-meeting") {
      completions++;
      await json(r, { success: true });
      return true;
    }
    if (path === "/api/meeting/summarize/room-own") {
      uploads++;
      expect(r.request().postData()).toContain('name="audio"');
      expect(r.request().postData()).toContain("all participants");
      await json(
        r,
        uploads === 1
          ? { message: "AI service unavailable" }
          : { success: true, message: '{"overview":"Saved meeting notes"}' },
        uploads === 1 ? 503 : 200,
      );
      return true;
    }
    return false;
  });
  await notesVideoFixture(page);
  await page.goto("/meeting/room-own");
  await expect(
    page.getByRole("checkbox", { name: /AI meeting notes/ }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Join meeting", exact: true }).click();
  await expect(
    page.getByText("Capturing meeting audio for AI notes", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upload for insights" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "End for everyone" }).click();
  await page.getByRole("button", { name: "End meeting", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry creating insights" }),
  ).toBeVisible();
  expect(completions).toBe(1);
  expect(uploads).toBe(1);
  await expect(
    page.getByRole("link", { name: "Download recovery audio" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry creating insights" }).click();
  await expect(
    page.getByText(/Your summary and transcript are saved/),
  ).toBeVisible();
  expect(uploads).toBe(2);
  expect(await page.evaluate(() => Reflect.get(window, "__notesStarts"))).toBe(
    1,
  );
  expect(await page.evaluate(() => Reflect.get(window, "__notesStops"))).toBe(
    1,
  );
  await expect(
    page.getByRole("link", { name: "Download recovery audio" }),
  ).toHaveCount(0);
});

test("host leave releases the call while automatic insights are still processing", async ({
  page,
}) => {
  let respond!: () => void;
  const responseGate = new Promise<void>((resolve) => {
    respond = resolve;
  });
  await fixture(page, async (r, path) => {
    if (path === "/api/meeting/summarize/room-own") {
      await responseGate;
      await json(r, { success: true, message: '{"overview":"Saved notes"}' });
      return true;
    }
    return false;
  });
  await notesVideoFixture(page);
  await page.goto("/meeting/room-own");
  await page.getByRole("button", { name: "Join meeting", exact: true }).click();
  await expect(
    page.getByText("Capturing meeting audio for AI notes", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "You’ve left the conversation." }),
  ).toBeVisible();
  await expect(
    page.getByText("Creating your meeting insights", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to meetings" }).click();
  await expect(page).toHaveURL(/meeting\/room-own$/);
  respond();
  await expect(
    page.getByText(/Your summary and transcript are saved/),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to meetings" }).click();
  await expect(page).toHaveURL(/dashboard\/meetings$/);
});

test("AI notes can be disabled before joining without capturing or uploading", async ({
  page,
}) => {
  let uploads = 0;
  await fixture(page, async (_r, path) => {
    if (path.includes("/summarize/")) uploads++;
    return false;
  });
  await notesVideoFixture(page);
  await page.goto("/meeting/room-own");
  await page.getByRole("checkbox", { name: /AI meeting notes/ }).uncheck();
  await page.getByRole("button", { name: "Join meeting", exact: true }).click();
  await expect(page.getByText(/AI notes are off for this visit/)).toBeVisible();
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "You’ve left the conversation." }),
  ).toBeVisible();
  expect(uploads).toBe(0);
  expect(
    await page.evaluate(() => Reflect.get(window, "__notesStarts")),
  ).toBeUndefined();
});

test("rejoining preserves saved insights unless replacement is explicitly enabled", async ({
  page,
}) => {
  let uploads = 0;
  await fixture(page, async (r, path) => {
    if (path === "/api/meeting/summary/room-own") {
      await json(r, {
        success: true,
        summary: '{"overview":"Existing notes"}',
        meeting: { title: own.title },
      });
      return true;
    }
    if (path.includes("/summarize/")) uploads++;
    return false;
  });
  await notesVideoFixture(page);
  await page.goto("/meeting/room-own");
  await expect(
    page.getByText(/This meeting already has saved insights/),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /AI meeting notes/ }),
  ).not.toBeChecked();
  await page.getByRole("button", { name: "Join meeting", exact: true }).click();
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "You’ve left the conversation." }),
  ).toBeVisible();
  expect(uploads).toBe(0);
  expect(
    await page.evaluate(() => Reflect.get(window, "__notesStarts")),
  ).toBeUndefined();
});
