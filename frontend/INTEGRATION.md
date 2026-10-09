# HeyMint frontend integration contract

This frontend targets the existing Express/Prisma backend and Stream Video integration. This document describes the API contracts, deployment constraints, and live-service checks required before a production release. A successful frontend build alone does not establish that database, email, OAuth, video, or AI services are configured or working.

## Local setup and deployment

Set the frontend environment variable in `frontend/.env.local`:

```dotenv
VITE_BACKEND_URL=http://localhost:3000
```

Use the backend origin, without a trailing `/api`; request paths already start with `/api`. Restart the Vite development server after changing environment variables. Run the frontend from `frontend/` with `npm install` followed by `npm run dev`. For a production bundle, run `npm run build`; the variable is resolved at build time. `VITE_*` values are public browser configuration: never put backend secrets in them.

The existing backend must be running separately on port 3000 with its existing database and services configured. Its listener uses `PORT`; 3000 is the local setup convention, not a hard-coded backend default. See [backend entry point](../backend/src/index.ts).

Existing backend configuration dependencies:

| Capability | Existing server-side configuration |
| --- | --- |
| HTTP and browser access | `PORT`, `CORS_ORIGIN`, `BACKEND_URL` |
| Database | `DATABASE_URL`, deployed Prisma migrations, PostgreSQL `vector` extension |
| Session tokens | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, optional `COOKIE_NAME`, `COOKIE_SECURE` |
| Email verification | `RESEND_API_KEY`, `EMAIL_FROM`; `OTP_EXPIRY_MINUTES` changes email wording, while actual OTP validity is hard-coded to three minutes |
| Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`; registered callback must match `${BACKEND_URL}/api/auth/google/callback` |
| Video | `STREAM_API_KEY`, `STREAM_SECRET_KEY`, compatible Stream call permissions |
| AI summaries and questions | `GROQ_API_KEY`, `GEMINI_API_KEY`; backend process also needs a writable `uploads` directory relative to its working directory |

### Browser origin and session constraints

- The backend permits the single configured `CORS_ORIGIN` and sets `credentials: true`. Configure it to the exact frontend origin, including scheme and development port. Local development, preview deployments, and production deployments use different origins. An arbitrary preview will not work against an origin-restricted backend automatically. See [index.ts:16](../backend/src/index.ts#L16).
- Requests must include cookies, and protected requests must send `Authorization: Bearer <accessToken>`. Access tokens expire after 15 minutes. Refresh tokens expire after seven days and are rotated through `POST /api/auth/refresh`. See [JWT helpers](../backend/src/utils/jwt.ts) and [authentication controller](../backend/src/controllers/auth.controller.ts).
- The refresh cookie is HTTP-only, host-scoped, and `SameSite=Lax`; `COOKIE_SECURE=true` additionally requires HTTPS. Deploy frontend and backend on the same site, such as `app.example.com` and `api.example.com`, with the same scheme, or use a correctly configured same-origin reverse proxy. A cross-site frontend/backend pairing cannot rely on this cookie being sent on fetch requests, even with credentials enabled. Keep `localhost` consistent during development; mixing it with `127.0.0.1` changes cookie/site behavior. These existing cookie settings are not changed by this frontend. See [auth.controller.ts:11](../backend/src/controllers/auth.controller.ts#L11).
- Google sign-in is a full-page redirect to `/api/auth/google`. Its callback redirects to `${CORS_ORIGIN}/?access=<JWT>`; the frontend must consume the access token at `/` and remove it from the address bar. There is no separate JSON Google-login endpoint. See [auth.routes.ts:29](../backend/src/routes/auth.routes.ts#L29).
- Microphone, camera, display capture, and clipboard features require a browser secure context (HTTPS, or the browser's localhost exception) and user permission. Deployment needs SPA fallback for frontend routes, without intercepting `/api` requests when using a reverse proxy.
- The JSON body limit is 20 KB. Multipart audio uses the existing Multer route and should let the browser set its multipart boundary. There is no backend upload progress/status endpoint. OTP, refresh, and demo payment routes share the existing rate limiter of 100 requests per 15-minute window. See [entry point](../backend/src/index.ts), [meeting routes](../backend/src/routes/meeting.routes.ts), and [rate limiter](../backend/src/middlewares/ratelimiter.middleware.ts).

## Endpoint and capability coverage

All paths below are relative to `VITE_BACKEND_URL`. “Bearer” means the existing route requires an access token. IDs in request bodies and query strings should always come from the signed-in user, never an arbitrary editable identity field. Responses are not wrapped consistently: `/user/me` is a bare object; other endpoints return different named fields. Check HTTP errors and `success: false`, including responses with HTTP 200.

### Authentication and account

Source: [auth routes](../backend/src/routes/auth.routes.ts), [auth controller](../backend/src/controllers/auth.controller.ts), [validation middleware](../backend/src/middlewares/auth.middleware.ts), [user routes](../backend/src/routes/user.routes.ts), [user controller](../backend/src/controllers/user.controller.ts).

| Method and endpoint | Request | Success response and frontend capability |
| --- | --- | --- |
| `POST /api/auth/send-otp` | JSON `{ email }` | `{ success, message }`; request or resend signup email code. Existing user returns 409. Actual code validity: three minutes. |
| `POST /api/auth/signup` | JSON `{ email, password, otp }` | HTTP 201 `{ accessToken, message }` plus refresh cookie; create account. Password minimum six characters; OTP string maximum six characters. Name initially defaults to `User`. |
| `POST /api/auth/login` | JSON `{ email, password }` | `{ accessToken, message }` plus refresh cookie; email/password sign-in. Password minimum six characters. Invalid credentials return 401. |
| `POST /api/auth/refresh` | Refresh cookie; no JSON payload required | `{ accessToken, message }` and rotated refresh cookie; restore or renew the session. Missing cookie returns 401; revoked/expired database token may return 403; invalid JWT may return 500. |
| `POST /api/auth/logout` | Bearer and refresh cookie | `{ message }`; revoke the current refresh token and clear the cookie. |
| `GET /api/auth/google` | Browser navigation | Starts Google OAuth with profile and email scopes. |
| `GET /api/auth/google/callback` | Google OAuth callback | Server-managed OAuth callback; redirects to the frontend root with `access` query parameter. |
| `GET /api/user/me` | Bearer | Bare `{ id, name, email, provider }`; `provider` is `local` or `google`. Populate account and navigation identity. |
| `POST /api/user/update-user` | JSON `{ id, newName }`; frontend should send Bearer | `{ success, message }`; change the current user's display name. UUID `id`; name length 3–20. This route currently lacks backend authentication middleware; see limitations below. |

Refresh handling must not mistake invalid login credentials or a wrong meeting password for an expired access token. In particular, meeting password validation returns HTTP 401 for a wrong password. Avoid refreshing on those application-level failures; serialize concurrent token refreshes and reject queued requests if refresh fails.

### Dashboard

Source: [user.controller.ts:24](../backend/src/controllers/user.controller.ts#L24).

| Method and endpoint | Request | Success response and frontend capability |
| --- | --- | --- |
| `GET /api/user/get-dashboard-stats` | Bearer | `{ success, message, dashboardStats: { completedMeetings, myTotalMeetings, totalEarning, totalMeetings, activeUsers } }`; dashboard metrics. `totalMeetings` and `activeUsers` are global counts, not the current user's counts or currently online users. `totalEarning` sums purchases of the current user's hosted meetings. |
| `GET /api/user/get-dashboard-allmeetings` | Bearer | `{ success, message, myMeetings: [{ id, title, type }] }`; current user's active, incomplete hosted meetings. `type` is lowercase `paid` or `free`; `id` is the database UUID, not the join code. |

### Meeting discovery, creation, and access

Source: [meeting routes](../backend/src/routes/meeting.routes.ts), [meeting controller](../backend/src/controllers/meeting.controller.ts), [meeting input schema](../backend/src/utils/Types.ts#L3).

| Method and endpoint | Request | Success response and frontend capability |
| --- | --- | --- |
| `POST /api/meeting/token` | Bearer; JSON `{ userId, name }` | `{ success, message, token, apiKey }`; obtain a Stream user token with one-hour validity and public API key. Use the signed-in user's ID and renew through this endpoint as needed. |
| `POST /api/meeting/setup-meeting` | Bearer; complete meeting input described below | HTTP 201 `{ success, message }`; persist instant/scheduled, free/paid, and optionally password-protected meeting metadata. Does not return the newly created database UUID or create a Stream call. |
| `GET /api/meeting/get-meetings?userId=<id>` | Bearer; current user ID | HTTP 201 `{ success, message, meetings, purchases }`; browse meetings, derive hosted meetings and history, and identify purchased meeting UUIDs. |
| `GET /api/meeting/get-booked-meetings?userId=<id>` | Bearer; current user ID | HTTP 201 `{ success, message, bookings }`; booked paid meetings. Booking rows omit `type` and `isComplete`; reconcile with the main meeting listing for completion state. |
| `POST /api/meeting/delete-meeting` | Bearer; JSON `{ meetingCode, userId, isComplete }` | `{ success, message }`; host cancels an incomplete free meeting with `isComplete: false`, or marks a meeting complete with `true`. Incomplete paid meetings cannot be deleted. Ending a Stream call is a separate SDK operation. |
| `GET /api/meeting/get-isProtected?meetingCode=<code>&userId=<id>` | Bearer | HTTP 201 `{ success, isProtected }`; determines whether a password is needed. Host receives `false`. A missing meeting can yield an omitted/undefined `isProtected`, so this endpoint alone does not prove a meeting exists. |
| `POST /api/meeting/get-meeting-validation` | Bearer; JSON `{ meetingPassword, meetingCode }` | Correct: `{ success: true, isMatched: true, message }`. Incorrect: HTTP 401 with `{ success: true, isMatched: false, message }`. Check `isMatched`. |
| `GET /api/meeting/validate-access?userId=<id>&meetingCode=<code>` | Bearer | HTTP 200 `{ success, message }`; checks meeting existence and whether a non-host purchased a paid meeting. A denial still uses HTTP 200. Does not enforce meeting completion/deletion or password validation. |

Meeting creation requires every field below, including placeholder values for disabled options:

```ts
{
  title: string;          // length 2–500
  description: string;    // maximum 100 characters, including empty string
  isScheduled: boolean;
  isPaid: boolean;
  isProtected: boolean;
  startingTime: string;   // valid date, preferably ISO; required even for instant calls
  price: number;          // number, not string; send 0 for free meetings
  createdBy: string;      // current user's UUID
  password: string;       // maximum 30 characters; send "" if not protected
  meetingCode: string;    // unique frontend-generated join code / Stream call ID
}
```

The server stores `description` as `desc`, chooses server time for an instant call, and stores zero price for a free call. Although one validation error message mentions 1,000 description characters, the actual schema limit is **100**. A successful setup does not return an ID; retain the generated meeting code and refresh the meeting list to obtain its database UUID.

Meeting list rows have this actual runtime shape:

```ts
{
  meetingId: string;      // database UUID, used for payments
  meetingCode: string;    // Stream call ID and normal AI route parameter
  title: string;
  description: string;
  type: "Paid" | "Free";
  hostName: string;
  price: number;
  meetingTime: string;    // backend String(Date), not guaranteed ISO
  isProtected: boolean;
  isInstant: boolean;
  createdById: string;
  isComplete: boolean;
}
```

`purchases` is an array of meeting database UUIDs. Both meeting listings include completed meetings, even after they are marked deleted. An incomplete cancelled meeting is excluded. There is no editable meeting API, free-meeting booking endpoint, server-side pagination, or participant-count field in this response. Do not infer that an instant meeting is currently live.

### Stream Video integration

The existing backend issues credentials; actual video calls are managed by `@stream-io/video-react-sdk`. Use the `default` call type and backend `meetingCode` as the Stream call ID. The host creates/starts the call with `getOrCreate`; scheduled backend records may exist before their Stream call exists. Attendees should not create a missing host call or bypass backend access/password checks.

The available integration supports a pre-join camera preview, microphone/camera toggles, device selection, joining, speaker/grid layouts, screen sharing, participant list, connection statistics, leaving, and host end-for-everyone. Stream credentials, service configuration, browser permissions, and network conditions must be tested with real participants. Host completion requires both Stream `endCall()` and the backend's `delete-meeting` completion request; a partial failure must be shown and recoverable.

AI notes are enabled by default on the host’s prejoin screen, with disclosure and a consent reminder, and can be switched off before joining. After a successful join, the frontend mixes local/remote microphone and screen-share audio published in the Stream call, excluding unpublished or muted microphones. Leaving, ending the call, or receiving a call-ended event finalizes one capture and automatically submits it to the existing summarize endpoint. Simultaneous end signals do not duplicate uploads. The call is released without waiting for AI processing. Failed processing retains the same audio for an explicit retry, optional recovery download, or discard. Successful processing releases the buffered audio. Only mixer output tracks are stopped by recorder cleanup; the Stream SDK owns its input tracks.

This is browser-side capture and a single HTTP processing request, not a server recording service or durable job queue. Keep the room page open until processing finishes. Refresh/close warnings and app-link guards reduce accidental loss but cannot guarantee recovery after a browser crash or navigation. Browser capture requires WebM support. Notes cover only the host’s captured interval and available tracks. When saved insights already exist, automatic notes default to off; the host must explicitly enable replacement before joining. If the existence check fails, retry it or disable notes to join. Manual recovery uploads are also labeled as replacements; the backend does not append recordings. There is no indexing-readiness API, so the UI does not claim transcript retrieval is ready when summary generation finishes.

### Demo booking and payment history

Source: [payment routes](../backend/src/routes/payment.routes.ts), [payment controller](../backend/src/controllers/payment.controller.ts), [payment history](../backend/src/controllers/meeting.controller.ts#L200).

| Method and endpoint | Request | Success response and frontend capability |
| --- | --- | --- |
| `POST /api/payment/demo-payment` | Bearer; JSON `{ userId, meetingId }`, both UUIDs | `{ success, message }`; create a meeting purchase and a successful payment record. This is explicitly a **demo payment** and does not charge a card, bank account, or UPI account. |
| `GET /api/payment/get-payments?userId=<id>` | Bearer; current user ID | HTTP 201 `{ success, message, payments: [{ id, meetingName, amount, status, date, paymentMethod }] }`; show payment history. `id` is a transaction UUID; `status` is `pending`, `success`, or `failed`; the backend hard-codes `paymentMethod: "UPI"`. |

The hard-coded UPI label is not proof of an external transaction. Prices and earnings represent the application's existing amounts; the frontend's INR presentation follows the existing product convention, since the backend stores no currency code. There are no checkout credentials, gateway webhooks, refunds, subscription plans, invoices, payout APIs, or billing-card storage. Do not present this integration as live payment processing.

The demo endpoint is not idempotent and has no existing-purchase guard. Disable duplicate clicks, use the purchase list to prevent repeat purchases in the UI, and do not automatically retry a failed/missing response. Server-side idempotency still requires separate backend work.

### AI summary, transcript, and questions

Source: [summary controller](../backend/src/controllers/summarizer.controller.ts), [chat controller](../backend/src/controllers/chat.controller.ts), [transcript indexing](../backend/src/utils/chunker.ts).

| Method and endpoint | Request | Success response and frontend capability |
| --- | --- | --- |
| `POST /api/meeting/summarize/:id` | Bearer; multipart `audio` file. `:id` can be meeting code or database UUID. | `{ success: true, message: <summary JSON string> }`; transcribe uploaded audio with Groq, generate a summary, persist summary/transcription, and begin background Gemini vector indexing. Repeating an upload overwrites the stored summary/transcription. |
| `GET /api/meeting/summary/:meetingCode` | Bearer; meeting **code**, not UUID | `{ success, summary: <JSON string>, meeting }`; retrieve summary and `meeting.summary.transcription`. Missing meeting or summary returns 404. |
| `POST /api/meeting/chat/:meetingCode` | Bearer; JSON `{ question }` | `{ success, answer }`; ask a question grounded in the stored summary and transcript excerpts. Each request is independent; there is no server-side chat history or streaming response. |

The prompted summary structure is `{ overview: string, keyPoints: string[], actionItems: string[], decisions: string[] }`. The frontend must tolerate older/non-JSON summary content and show a readable fallback rather than crash. Transcript text is nested in `meeting.summary.transcription`, not returned as a top-level field. Summary retrieval returns a raw meeting object, including internal fields and potentially its password; map only the intended safe fields into the view and do not log or render the raw object.

Vector indexing runs after summary persistence without being awaited, so an immediate AI question may rely on the summary before transcript excerpts are available. There is no AI indexing-status route, transcript editing route, persistent chat-history route, live transcription route, or meeting messaging API. Error and no-summary states must be real states rather than fabricated content.

## Existing backend limitations requiring separate remediation

These findings are from source inspection. They are not changes made by this frontend, and frontend checks cannot provide server-side security. The restrictions below prevent an unqualified production-readiness claim for the full platform.

1. **OTP verification is not awaited.** Signup calls the asynchronous `verifyOtp(email, otp)` without `await`, then tests the Promise's truthiness. Invalid or expired codes are therefore not reliably rejected by signup. Evidence: [auth.controller.ts:77](../backend/src/controllers/auth.controller.ts#L77) and [otp.ts:12](../backend/src/utils/otp.ts#L12). Keep the email-code UX, but do not claim that a successful signup proves email verification.
2. **Profile updates have no authentication middleware.** The route accepts a caller-supplied UUID and updates it. Evidence: [user.routes.ts:9](../backend/src/routes/user.routes.ts#L9) and [user.controller.ts:123](../backend/src/controllers/user.controller.ts#L123). The frontend only edits the current user's name, but this does not fix direct API access.
3. **Several authenticated routes trust caller-supplied identities.** Stream token issuance, meeting creation, purchase/payment queries, meeting access, deletion, and demo payment use body/query `userId` or `createdBy` rather than consistently binding those fields to `req.user.id`. Evidence: [meeting.controller.ts:15](../backend/src/controllers/meeting.controller.ts#L15), [meeting.controller.ts:46](../backend/src/controllers/meeting.controller.ts#L46), [meeting.controller.ts:117](../backend/src/controllers/meeting.controller.ts#L117), [meeting.controller.ts:236](../backend/src/controllers/meeting.controller.ts#L236), and [payment.controller.ts:6](../backend/src/controllers/payment.controller.ts#L6). Client ownership checks are UX guards only.
4. **AI endpoints do not enforce meeting membership/ownership.** They require a signed-in user but accept a meeting identifier without an authorization check for that specific meeting. Summary retrieval includes the raw meeting record. Evidence: [meeting.routes.ts:34](../backend/src/routes/meeting.routes.ts#L34), [summarizer.controller.ts:136](../backend/src/controllers/summarizer.controller.ts#L136), and [chat.controller.ts:22](../backend/src/controllers/chat.controller.ts#L22).
5. **Join validation is incomplete as a security boundary.** `validate-access` checks existence and a paid purchase but does not reject completed/deleted meetings or enforce a successful password check on subsequent Stream access. Passwords are stored and compared directly. Evidence: [meeting.controller.ts:296](../backend/src/controllers/meeting.controller.ts#L296), [meeting.controller.ts:326](../backend/src/controllers/meeting.controller.ts#L326), and [schema.prisma](../backend/prisma/schema.prisma). Stream permissions must also be reviewed before public deployment.
6. **Payments are demo records only.** The endpoint writes purchase and payment rows without a payment provider, transaction wrapping, or idempotency guard. Evidence: [payment.controller.ts](../backend/src/controllers/payment.controller.ts). This frontend cannot make those records into genuine charges.

No password reset, email/password change, account deletion, meeting edit, guest access, persistent notifications, team/workspace administration, or production billing capability should be invented around these APIs.

## Acceptance checklist for configured services

This is a release checklist, not a claim that the checks have already passed. Run with dedicated test accounts and clearly identified demo bookings; use the configured services rather than mocked API responses.

- [ ] Build the frontend and run its type/lint checks. Review desktop and narrow mobile layouts, keyboard navigation, focus visibility, loading/empty/error states, and reduced-motion behavior.
- [ ] Confirm the backend diff is empty against the branch's base (`git diff <base> -- backend`) and confirm no backend configuration or schema was changed for the UI replacement.
- [ ] Start the existing backend with the intended PostgreSQL database/migrations, uploads directory, Resend, Google OAuth, Stream, Groq, and Gemini configuration. Check the exact frontend origin and cookie behavior in browser developer tools.
- [ ] Request signup OTP, receive the email, sign up, and update the name. Separately reproduce and record the invalid/expired OTP limitation; it must be fixed in a separately authorized backend change before relying on verified email addresses.
- [ ] Sign in with email/password; wrong credentials show a useful inline error. Complete Google OAuth and verify the `access` token is removed from the URL. Verify sign-out clears the local session and subsequent protected actions require sign-in.
- [ ] Reload a signed-in session, expire the access token, and issue concurrent protected requests. Confirm refresh succeeds once, rotated cookies work, and refresh failure leads to a recoverable sign-in state without hung requests or a refresh loop.
- [ ] Confirm dashboard counts and global-vs-personal labels match actual records. Confirm meetings, hosted meetings, history, bookings, and payments show only server-returned data, with no fabricated participants, online status, revenue, or activity.
- [ ] Create instant and scheduled meetings, including a 100-character description, free/paid options, and password protection. Verify valid times, unique codes, copied links, persisted metadata, and Stream call identity. Confirm validation prevents malformed inputs before submission.
- [ ] Join as a second account. Exercise host access, unpaid paid-meeting denial, purchased access, wrong password, correct password, nonexistent code, and completed meetings. Confirm a wrong meeting password does not refresh or destroy the session.
- [ ] Create a clearly labeled demo booking once; verify the purchase appears and enables paid-meeting access. Confirm duplicate clicking is disabled and payment history is labeled honestly. Do not treat this as testing a real money transfer.
- [ ] With two browser sessions/devices, verify camera/mic toggles, device selection, pre-join preview, audio/video, grid/speaker layouts, screen sharing, participant panel, leave, and host end-for-everyone. Test denied permissions, unavailable devices, lost network, and token renewal during a longer call.
- [ ] Cancel an incomplete free meeting and confirm it disappears. Confirm paid cancellation is unavailable. End a hosted meeting and verify backend completion, all-participant call termination, history visibility, and recoverable handling of partial failures.
- [ ] Join with AI notes enabled and known spoken audio from multiple participants. Verify parallel capture, muted-track exclusion, automatic submission on host leave/end, single submission on concurrent end signals, retry without recapturing, and no capture when notes are disabled. Keep the page open, wait for summary generation, and reload insights. Verify overview, key points, actions, decisions, persisted transcript, and question answers against the actual content. Confirm missing summary, invalid/non-JSON summary, unavailable AI service, and upload errors are understandable and retryable without data fabrication.
- [ ] Review the existing backend authorization findings above with the backend owner before production release. UI-only restrictions do not close these server-side issues.

