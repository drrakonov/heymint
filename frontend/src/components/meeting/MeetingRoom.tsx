import { cn } from "@/lib/utils";
import { CallControls, CallingState, CallParticipantsList, CallStatsButton, PaginatedGridLayout, SpeakerLayout, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { LayoutList, Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import EndCallButton from "./EndCallButton";
import Loader from "../subComponents/Loader";
import { CustomCallControls } from "./CustomCallControls";



type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right'


const MeetingRoom = () => {
    const [layout, setLayout] = useState<CallLayoutType>('speaker-left')
    const [showParticipants, setShowParticipants] = useState(false)
    const [searchParams] = useSearchParams();
    const isPersonalRoom  = !!searchParams.get("personal");
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();
    const navigate = useNavigate();

    if(callingState !== CallingState.JOINED) return <Loader />

    const CallLayout = () => {
        switch(layout) {
            case 'grid':
                return <PaginatedGridLayout/ >
            case 'speaker-right':
                return <SpeakerLayout participantsBarPosition="left" />
            default:
                return <SpeakerLayout participantsBarPosition="right" />
        }
    }

    const handleOnLeave = () => {
        navigate("/dashboard");
    }
    

    return (
        <section className="relative h-screen w-full overflow-hidden pt-4 text-white bg-background">
            <div className="relative flex size-full items-center justify-center">
                <div className="flex size-full max-w-[1000px] items-center">
                    <CallLayout />
                </div>
                <div className={cn('h-[calc(100vh-86px)] hidden ml-2', 
                    { 'show-block': showParticipants })}>
                        <CallParticipantsList onClose={() => setShowParticipants(false)} />
                </div>
            </div>
            <div className="fixed bottom-0 flex w-full items-center justify-center gap-5 flex-wrap">
                    <CustomCallControls onLeave={handleOnLeave} />
                    {/* <CallControls /> */}
                    <DropdownMenu>
                        <div className="flex items-center">
                            <DropdownMenuTrigger className="cursor-pointer rounded-2xl p-2 hover:bg-slate-700/70">
                                <LayoutList size={20} className="text-text-primary" />
                            </DropdownMenuTrigger>
                        </div>

                        <DropdownMenuContent className="border-1 border-background bg-slate-700 text-text-primary">
                            {['Grid', 'Speaker-left', 'Speaker-right'].map((item, ind) => (
                                <div key={ind}
                                    className="cursor-pointer"
                                    onClick={() => {
                                        setLayout(item.toLowerCase() as CallLayoutType)
                                    }}
                                >
                                    <DropdownMenuItem className="hover:text-black hover:bg-accent">
                                        {item}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="border-1 border-background/20 px-1"/>
                                </div>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <CallStatsButton />
                    <button onClick={() => setShowParticipants((prev) => !prev)}>
                            <div className="cursor-pointer rounded-2xl hover:bg-slate-700/70 p-2">
                                <Users size={20} className="text-text-primary" />
                            </div>
                    </button>
                    {!isPersonalRoom && <EndCallButton />}
            </div>
        </section>
    )
}

export default MeetingRoom;