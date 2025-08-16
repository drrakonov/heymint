import { useEffect, useState, type ReactNode } from "react"
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk'
import { useUserStore } from "@/store/userStore";
import Loader from "@/components/subComponents/Loader";

const StreamVideoProvider = ({ children }: {
    children: ReactNode
}) => {
    const [videoClient, setVideoClient] = useState<StreamVideoClient>();
    const { user } = useUserStore();

    useEffect(() => {
        if (!user) return;
        if (!user.apiKey) throw new Error('Stream API KEY is missing');

        const client = new StreamVideoClient({
            apiKey: user.apiKey,
            token: user.streamToken,
            user: {
                id: user.id,
                name: user.name || user.id,
            },
        });

        setVideoClient(client);

    }, [user])

    if(!videoClient) return <Loader />

    return (
        <StreamVideo client={videoClient}>
            {children}
        </StreamVideo>
    )
}

export default StreamVideoProvider;