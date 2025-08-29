import { useEffect, useState, type ReactNode } from "react"
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk'
import { useUserStore } from "@/store/userStore";
const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const { user } = useUserStore();

  useEffect(() => {
    if (!user || !user.apiKey || !user.streamToken) {
      setVideoClient(null);
      return;
    }
    const client = new StreamVideoClient({
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


  if (!user || !videoClient) {
    return <>{children}</>;
  }


  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;