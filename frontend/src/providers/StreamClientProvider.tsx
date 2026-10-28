import { useEffect, useState, type ReactNode } from "react"
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk'
import { useUserStore } from "@/store/userStore";
import { useAuthStore } from "@/store/authStore";
import Loader from "@/components/subComponents/Loader";
const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const { user } = useUserStore();
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!user || !user.apiKey || !user.streamToken) {
      setVideoClient(null);
      return;
    }
    const client = StreamVideoClient.getOrCreateInstance({
      apiKey: user.apiKey,
      token: user.streamToken,
      user: {
        id: user.id,
        name: user.name || user.id,
      },
    });

    setVideoClient(client);

    return () => {
      client.disconnectUser();
    };
  }, [user]);


  if (accessToken && (!user || !videoClient)) {
    return <Loader />;
  }

  if (!user || !videoClient) {
    return <>{children}</>;
  }


  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
