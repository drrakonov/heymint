import { StreamClient } from "@stream-io/node-sdk";

export const streamClient = new StreamClient(
    process.env.STREAM_API_KEY!,
    process.env.STREAM_SECRET_KEY!,
    { timeout: 15000 }
);
