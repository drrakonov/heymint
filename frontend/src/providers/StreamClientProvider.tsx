import { useEffect, useState, type ReactNode } from "react";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import { useUserStore } from "@/store/userStore";
import Loader from "@/components/subComponents/Loader";
import ConnectionError from "@/components/subComponents/ConnectionError";
import api from "@/lib/axios";
import { withTimeout } from "@/lib/withTimeout";
import { useNavigate } from "react-router-dom";

export default function StreamVideoProvider({ children }: { children: ReactNode }) {
  const userId = useUserStore(state => state.user?.id);
  const apiKey = useUserStore(state => state.user?.apiKey);
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    if (!userId || !apiKey) return;
    let cancelled = false;
    const user = useUserStore.getState().user!;
    const client = new StreamVideoClient(apiKey, { maxConnectUserRetries: 1 });
    let initialToken = user.streamToken;
    setVideoClient(null);
    setError(false);
    const connection = client.connectUser({ id: userId, name: user.name || userId }, async () => {
      if (initialToken) { const token = initialToken; initialToken = ""; return token; }
      const { data } = await api.post("/api/meeting/token");
      return data.token;
    });
    void withTimeout(connection).then(() => {
      if (!cancelled) setVideoClient(client);
    }).catch(() => {
      if (!cancelled) setError(true);
      // A connection completing after the timeout must not remain connected.
      cancelled = true;
      void client.disconnectUser().catch(() => undefined);
    });
    void connection.then(() => {
      if (cancelled) void client.disconnectUser().catch(() => undefined);
    }).catch(() => undefined);
    return () => { cancelled = true; void client.disconnectUser().catch(() => undefined); };
  }, [userId, apiKey, attempt]);

  if (error) return <ConnectionError message="The meeting service couldn’t connect. Your meeting is still saved." onRetry={() => setAttempt(n => n + 1)} onExit={() => navigate("/dashboard/meetings")} />;
  if (!videoClient) return <Loader />;
  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
}
