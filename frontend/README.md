# HeyMint frontend

HeyMint’s React and Vite frontend for video meetings, scheduling, and meeting insights. It connects to the Express API and Stream Video SDK.

## Run locally

Requires Node.js 22.12+ (or another version supported by Vite 7).

```sh
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Set `VITE_BACKEND_URL` to the existing backend origin (for example `http://localhost:3000`, without `/api`). Run the backend separately with its existing database, email, OAuth, Stream, and AI configuration. Its configured `CORS_ORIGIN` must match the frontend origin. Keep frontend/backend on the same site for the existing `SameSite=Lax` refresh cookie. See [INTEGRATION.md](./INTEGRATION.md) for exact contracts, deployment constraints, and backend limitations.

```sh
npm run build       # TypeScript checking and production bundle
npm run lint
npm test            # API contracts and recording lifecycle checks
npx playwright install chromium
npm run test:e2e    # Browser flows with isolated API fixtures
```

To use an existing Chromium-based browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path. The test runner starts a local Vite server when one is not already running. API fixtures and synthetic audio exist only in `tests/`; application screens always use real service requests. Browser tests do not prove email delivery, OAuth provider configuration, multi-participant Stream media, or real AI results. Those live checks are listed in the integration guide.

## Included workflows

- Email/password login, registration OTP/resend, Google redirect login, shared-link return navigation, rotating cookie refresh, and logout.
- Personal and platform dashboard metrics; hosted/discover/completed meetings with search, filters, and sorting; bookings and payment history.
- Instant and scheduled meetings, passwords, paid/free settings, shareable room links, cancellation of owned free meetings, and clearly labeled **demo checkout**. The backend does not process real money.
- Access-checked prejoin with device controls, video, microphone, screen sharing, speaker/grid layouts, reactions, participant controls, call statistics, leaving, and host end-for-everyone with recoverable completion errors.
- Automatic AI notes when enabled on the host’s prejoin screen, with recording disclosure and a consent reminder. Shared participant audio is captured in parallel; muted microphones are excluded. Leaving or ending the call finalizes capture and submits it automatically. Processing does not delay leaving the call. Failed submission retains the audio for retry, optional recovery download, or discard. Keep the call page open until processing finishes; capture requires a WebM-capable browser and HTTPS/localhost.
- Structured AI summaries with legacy-text fallback, saved transcripts, and meeting-context Q&A with retry. Manual audio upload is a recovery option; replacing existing insights is explicitly labeled.
- Profile name updates, responsive mobile navigation, loading/error/empty states, reduced-motion support, and keyboard-accessible controls.

## Source map

- `src/features/`: pages and workflows.
- `src/components/heymint/`: shared design system and workspace shell.
- `src/lib/api.ts`: typed existing-backend contracts and session refresh.
- `src/lib/video.ts`, `src/lib/meeting-recorder.ts`: Stream integration and owned recording resources.
- `src/lib/router.tsx`: typed navigation helpers for React Router.
- `src/index.css`: responsive dark/mint visual system.
- `tests/`: deterministic contract, browser, and recording checks.
