import { enterMeeting } from "@/lib/joinMeeting";
import { DeviceSettings, useCall, VideoPreview } from "@stream-io/video-react-sdk";
import BrandLogo from "../BrandLogo";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useUserStore } from "@/store/userStore";
import { useNavigate, useParams } from "react-router-dom";
import PasswordInput from "../subComponents/PasswordInput";
import { Switch } from "../ui/switch";
import { Copy, MicOff, VideoOff, ArrowLeft, LockKeyhole, Video } from "lucide-react";
import { getMeetingJoinLink } from "@/lib/meetingLinks";

const MeetingSetup = ({ setIsSetUpComplete, isMeetingProtected }: {
    isMeetingProtected: boolean;
    setIsSetUpComplete: (value: boolean) => void
}) => {
    const [isMicToggleOn, setIsMicToggleOn] = useState(true);
    const [isCamToggleOn, setIsCamToggleOn] = useState(true);
    const [password, setPassword] = useState("");
    const [isJoining, setIsJoining] = useState(false);

    const call = useCall();
    const { user } = useUserStore();
    const { id } = useParams();
    const navigate = useNavigate();

    const copyInviteLink = async () => {
        if (!id) return;
        try {
            await navigator.clipboard.writeText(getMeetingJoinLink(id));
            toast.success("Joining link copied");
        } catch { toast.error("Could not copy the invitation link"); }
    };


    if (!call) {
        throw new Error("useCall must be in streamCall componenet");
    }

    const joinCallAndStartRecording = async () => {
        if (!user) return;
        // Await the chosen device state before publishing the new participant track.
        await Promise.all([
            isMicToggleOn ? call.microphone.disable() : call.microphone.enable(),
            isCamToggleOn ? call.camera.disable() : call.camera.enable(),
        ]);
        await enterMeeting(call, user.id);
        setIsSetUpComplete(true);
    };

    const handleJoinMeeting = async () => {
        if (isJoining) return;
        if (!user) {
            toast.error("User not found");
            return;
        }
        setIsJoining(true);
        try {
            
            if (isMeetingProtected) {
                if (password.length < 2) {
                    toast.error("Enter valid password");
                    return;
                }
                const res = await api.post("/api/meeting/get-meeting-validation", {
                    meetingPassword: password,
                    meetingCode: id,
                })

                if (res.data.success) {
                    if (res.data.isMatched) {
                        await joinCallAndStartRecording();
                        return;
                    } else {
                        toast.error("Enter valid password");
                        return;
                    }

                } else {
                    toast.error("Failed to join");
                    navigate("/dashboard");
                    return;
                }

            } else {
                await joinCallAndStartRecording();
            }

        } catch (err) {
            toast.error("Failed to join")
            console.error("Failed to join the meeting", err);
        } finally {
            setIsJoining(false);
        }

    }



    useEffect(() => {
        if (isCamToggleOn) {
            void call.camera.disable().catch(() => toast.error("Could not disable the camera"));
        } else {
            void call.camera.enable().catch(() => { setIsCamToggleOn(true); toast.error("Camera unavailable. Check browser permissions and device settings."); });
        }

    }, [isCamToggleOn, call?.camera])

    useEffect(() => {
        if (isMicToggleOn) {
            void call.microphone.disable().catch(() => toast.error("Could not mute the microphone"));
        } else {
            void call.microphone.enable().catch(() => { setIsMicToggleOn(true); toast.error("Microphone unavailable. Check browser permissions and device settings."); });
        }
    }, [isMicToggleOn, call?.microphone])


    return (
        <div className="auth-layout mint-app-bg flex min-h-dvh flex-col items-center justify-center p-4 text-text-primary sm:p-8">
            <BrandLogo className="mb-6 w-28"/>
            <div className="mb-6 flex w-full max-w-5xl items-center justify-between gap-4">
                <button onClick={()=>navigate('/dashboard/meetings')} className="flex items-center gap-2 text-xs text-text-secondary hover:text-white"><ArrowLeft size={15}/> Back to meetings</button>
                <button onClick={copyInviteLink} className="glass-control flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs text-primary"><Copy size={14}/> Copy invite</button>
            </div>
            <div className="workspace-panel grid w-full max-w-5xl items-center gap-6 p-5 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
                <div className="min-w-0">
                    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                        {isCamToggleOn ? <div className="text-center"><span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-3xl font-medium text-primary">{user?.name?.charAt(0).toUpperCase() || 'H'}</span><p className="mt-4 text-sm">{user?.name}</p><p className="mt-1 text-xs text-text-secondary">Camera is off</p></div> : <VideoPreview className="absolute inset-0 !h-full !w-full object-cover"/>}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <label className="glass-control flex items-center gap-2 rounded-xl px-3 py-3 text-xs"><MicOff size={14}/><span>Mic off</span><Switch disabled={isJoining} checked={isMicToggleOn} onCheckedChange={setIsMicToggleOn}/></label>
                        <label className="glass-control flex items-center gap-2 rounded-xl px-3 py-3 text-xs"><VideoOff size={14}/><span>Camera off</span><Switch disabled={isJoining} checked={isCamToggleOn} onCheckedChange={setIsCamToggleOn}/></label>
                        <div className="glass-control flex min-h-11 items-center rounded-xl"><DeviceSettings/></div>
                    </div>
                </div>
                <div className="min-w-0 py-3">
                    <span className="eyebrow">Your waiting room</span>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight">Ready when you are.</h1>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">Choose your devices, take a moment, and join the conversation.</p>
                    <div className="mt-6 rounded-xl border border-white/8 bg-white/[.025] px-4 py-3"><p className="text-[10px] uppercase tracking-wider text-text-secondary">Meeting code</p><p className="mt-2 break-all font-mono text-xs text-white/75">{id}</p></div>
                    {<>
                        {isMeetingProtected && <div className="mt-5"><label htmlFor="password" className="mb-2 flex items-center gap-2 text-xs text-text-secondary"><LockKeyhole size={13}/> This room requires a password</label><PasswordInput value={password} onChange={e=>setPassword(e.target.value)}/></div>}
                        <Button onClick={handleJoinMeeting} disabled={isJoining} className="mint-button mt-6 h-12 w-full rounded-xl font-semibold disabled:opacity-50"><Video size={16}/>{isJoining ? 'Joining…' : 'Join meeting'}</Button>
                    </>}
                    <p className="mt-4 text-center text-[11px] leading-5 text-text-secondary">You can change your devices during the call.</p>
                </div>
            </div>
        </div>
    );
};

export default MeetingSetup;
