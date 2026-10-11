import { cn } from "@/lib/utils";
import { CallingState, CallParticipantsList, CallStatsButton, PaginatedGridLayout, SpeakerLayout, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { LayoutList, Users } from "lucide-react";
import EndCallButton from "./EndCallButton";
import Loader from "../subComponents/Loader";
import { CustomCallControls } from "./CustomCallControls";

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right'

const MeetingRoom = () => {
    const [layout, setLayout] = useState<CallLayoutType>('speaker-left')
    const [showParticipants, setShowParticipants] = useState(false)
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();

    if(callingState !== CallingState.JOINED) return <Loader />

    const CallLayout = () => {
        switch(layout) {
            case 'grid': return <PaginatedGridLayout />
            case 'speaker-right': return <SpeakerLayout participantsBarPosition="left" />
            default: return <SpeakerLayout participantsBarPosition="right" />
        }
    }

    return (
        <section className="relative h-screen w-full overflow-hidden text-white bg-background">
            <div className="relative flex size-full items-center justify-center">
                <div className="flex size-full max-w-[1200px] items-center p-4 pb-28">
                    <CallLayout />
                </div>
                <div className={cn('h-[calc(100vh-86px)] hidden ml-2', { 'show-block': showParticipants })}>
                    <CallParticipantsList onClose={() => setShowParticipants(false)} />
                </div>
            </div>
            
            {/* FLOATING GLASSMORPHIC CONTROL BAR */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 bg-surface/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] px-6 py-3 rounded-full">
                    <CustomCallControls />
                    
                    <div className="w-[1px] h-8 bg-white/10 mx-1" /> {/* Divider */}

                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/10 transition-colors focus:outline-none">
                            <LayoutList size={20} className="text-white" />
                        </DropdownMenuTrigger>

                        <DropdownMenuContent className="border border-white/10 bg-surface/90 backdrop-blur-md text-text-primary rounded-xl mb-4 shadow-xl">
                            {['Grid', 'Speaker-left', 'Speaker-right'].map((item, ind) => (
                                <div key={ind} className="cursor-pointer" onClick={() => setLayout(item.toLowerCase() as CallLayoutType)}>
                                    <DropdownMenuItem className="hover:text-white hover:bg-primary/20 cursor-pointer rounded-lg mx-1 my-1">
                                        {item}
                                    </DropdownMenuItem>
                                    {ind !== 2 && <DropdownMenuSeparator className="bg-white/5"/>}
                                </div>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <CallStatsButton />

                    <button 
                        onClick={() => setShowParticipants((prev) => !prev)}
                        className={`flex items-center justify-center h-10 w-10 rounded-full transition-colors focus:outline-none ${showParticipants ? 'bg-primary text-black hover:bg-primary/90' : 'hover:bg-white/10 text-white'}`}
                    >
                        <Users size={20} />
                    </button>
                    
                    
                    <div className="w-[1px] h-8 bg-white/10 mx-1" /> {/* Divider */}
                    <EndCallButton />
            </div>
        </section>
    )
}

export default MeetingRoom;
