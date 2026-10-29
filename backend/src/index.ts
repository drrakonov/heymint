require('dotenv').config()
import express, { Response, Request, NextFunction } from 'express'
import cookieParser from 'cookie-parser';
import authRoutes from "./routes/auth.routes"
import userRoutes from './routes/user.routes'
import meetingRoutes from './routes/meeting.routes'
import cors from 'cors'
import passport from './controllers/passport.controller';
import { handleStreamWebhook } from './controllers/streamWebhook.controller';


import { randomUUID } from "crypto";
import { meetingTrace, traceRuntime } from "./utils/meetingTrace";

const app = express()
const port = process.env.PORT;
// Set this to the verified number of reverse proxies in front of this server.
// Do not use `true`: that would trust arbitrary forwarded client IPs.
const proxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 10) {
  throw new Error("TRUST_PROXY_HOPS must be an integer between 0 and 10");
}
app.set("trust proxy", proxyHops);

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.post(
  "/api/webhooks/stream",
  (req, res, next) => {
    const requestId = randomUUID();
    res.locals.meetingTraceId = requestId;
    const startedAt = Date.now();
    meetingTrace("webhook.received", {
      requestId,
      signaturePresent: typeof req.headers["x-signature"] === "string",
      contentType: req.get("content-type"),
    });
    res.on("finish", () => meetingTrace("webhook.responded", {
      requestId, status: res.statusCode, durationMs: Date.now() - startedAt,
    }));
    next();
  },
  express.raw({ type: "application/json" }),
  handleStreamWebhook
);
app.use(express.json({
  limit: "20kb"
}));
app.use(cookieParser());
app.use(passport.initialize());


app.get('/', (req, res) => {
  res.send('Server is running...🚀')
})


app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/meeting", meetingRoutes);


app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🔥 Error:", err.stack || err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

app.listen(port, () => {
  traceRuntime("api");
  console.log(`App listening on port ${port}`)
})
