import type { User, SetupMeeting } from "./api";
import { backend } from "./api";
export async function createVideoClient(user: User) {
  const { StreamVideoClient } = await import("@stream-io/video-react-sdk");
  const initial = await backend.videoToken(user.id, user.name || user.email);
  if (!initial.apiKey || !initial.token)
    throw new Error(
      "Video service configuration is unavailable. Please contact your workspace administrator.",
    );
  let firstToken: string | null = initial.token;
  return new StreamVideoClient({
    apiKey: initial.apiKey,
    user: { id: user.id, name: user.name || user.email },
    tokenProvider: async () => {
      if (firstToken) {
        const token = firstToken;
        firstToken = null;
        return token;
      }
      return (await backend.videoToken(user.id, user.name || user.email)).token;
    },
  });
}
export async function initializeMeetingCall(user: User, meeting: SetupMeeting) {
  const client = await createVideoClient(user);
  try {
    await client.call("default", meeting.meetingCode).getOrCreate({
      data: {
        starts_at: meeting.startingTime,
        custom: { title: meeting.title, description: meeting.description },
        members: [{ user_id: user.id }],
      },
    });
  } finally {
    await client.disconnectUser();
  }
}
