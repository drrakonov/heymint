import { Calendar, Clock, Filter, Search, SortAsc, Trash2, Users, Video, Sparkles, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { MeetingStats } from "../subComponents/MeetingStats";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { EmptyState } from "../subComponents/EmptyStateMeeting";
import api from "@/lib/axios";
import Loader from "../subComponents/Loader";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/store/userStore";
import CopyClipboardBtn from "../subComponents/CopyClipboardBtn";

interface MeetingCardProps {
    meetingId: string
    title: string
    hostName: string
    description: string
    type: "Free" | "Paid"
    price?: number
    meetingTime?: string
    isInstant?: boolean
    participantCount?: number
    meetingCode: string
    createdById: string
    isComplete?: boolean;
    setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>;
    bookedMeetings: string[];
}

export function MeetingCard({ meetingId, title, hostName, description, type, price, meetingTime, isInstant = false, participantCount, meetingCode, createdById, isComplete = false, setMeetings, bookedMeetings }: MeetingCardProps) {
    const navigate = useNavigate();
    const client = useStreamVideoClient();
    const { user } = useUserStore();
    const isBooked = type == "Paid" ? (bookedMeetings.includes(meetingId) || createdById === user?.id) : true;

    const handleJoinMeeting = async () => {
        try {
            if (!client || !user) return toast.error("Failed to join");
            if (!isBooked) return toast.error("Purchase to join");
            const call = client.call("default", meetingCode);
            if (!call) throw new Error("Failed to create call");

            if (user.id === createdById) {
                await call.getOrCreate({ data: { starts_at: new Date().toISOString(), custom: { description: "scheduled" } } });
                navigate(`/meeting/${call.id}`);
                return;
            }
            try { await call.get(); navigate(`/meeting/${call.id}`); } 
            catch (err) { toast.error("Meeting not available yet.") }
        } catch (err) { toast.error("Unable to join meeting"); }
    }

    const handleDeleteMeeting = async () => {
        if (!user || user.id !== createdById) return;
        try {
            const res = await api.post("/api/meeting/delete-meeting", { userId: user.id, meetingCode, isComplete: false });
            if (res.data.success) { toast.success("Meeting deleted"); setMeetings(prev => prev.filter(m => m.meetingCode !== meetingCode)); }
        } catch (err) { toast.error("Failed to delete!") }
    }

    return (
        <Card className="w-full bg-surface/40 backdrop-blur-md border border-white/5 shadow-sm hover:border-primary/50 transition-colors duration-200 p-0 rounded-xl overflow-hidden">
            <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-text-primary tracking-tight">{title}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary font-medium">
                            <span className="flex items-center gap-1.5"><Users size={14} className="text-primary"/>{hostName}</span>
                            {isInstant && <span className="flex items-center gap-1.5 text-primary"><Video size={14}/>Instant</span>}
                        </div>
                        <p className="text-sm mt-3 text-text-secondary line-clamp-2">{description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="flex gap-2 items-center">
                            <Badge variant="outline" className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${type === "Paid" ? "bg-primary/10 text-primary border-primary/20" : "bg-surface text-text-secondary border-border"}`}>{type}</Badge>
                            {type === "Paid" && price && <span className="text-primary text-sm font-bold">₹{price}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <CopyClipboardBtn meetingCode={meetingCode} />
                            {user?.id === createdById && (
                                <button onClick={handleDeleteMeeting} className="p-1.5 rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-4 text-xs font-medium text-text-secondary">
                        {!isInstant && <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> {meetingTime ? new Date(meetingTime).toLocaleString("en-US", {weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"}) : "-"}</span>}
                        {participantCount && <span className="flex items-center gap-1.5"><Clock size={14} /> {participantCount} expected</span>}
                    </div>
                    
                    <div>
                        {isComplete ? (
                            <Button onClick={() => navigate(`/meeting/${meetingCode}/insights`)} className="bg-primary hover:bg-primary/90 text-black text-sm font-bold px-4 py-2 rounded-lg">
                                <Sparkles size={14} className="mr-2" /> View Insights
                            </Button>
                        ) : (
                            <Button onClick={handleJoinMeeting} className="bg-surface hover:bg-surface-1 border border-border text-text-primary text-sm font-bold px-4 py-2 rounded-lg">
                                {user?.id === createdById ? "Start Session" : "Join Now"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}

type Meeting = { meetingId: string, title: string, hostName: string, description: string, type: "Free" | "Paid", price?: number, isProtected: boolean, meetingTime?: string, isInstant?: boolean, meetingCode: string, createdById: string, isComplete?: boolean }

const Meetings = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<"all" | "free" | "paid" | "instant">("all");
    const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [bookedMeetings, setBookedMeetings] = useState<string[]>([]);
    const { user } = useUserStore();

    const filteredMeetings = useMemo(() => {
        return meetings.filter(m => {
            const isTabMatch = activeTab === "upcoming" ? !m.isComplete : m.isComplete;
            const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.hostName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterType === "all" || (filterType === "free" && m.type === "Free") || (filterType === "paid" && m.type === "Paid") || (filterType === "instant" && m.isInstant);
            return isTabMatch && matchesSearch && matchesFilter;
        });
    }, [searchQuery, filterType, meetings, activeTab]);

    useEffect(() => {
        const getMeetings = async () => {
            try {
                const res = await api.get("/api/meeting/get-meetings", { params: { userId: user?.id } });
                if (res.data.success) {
                    const real = res.data.meetings;
                    setMeetings(real);
                    setBookedMeetings(res.data.purchases);
                }
            } catch (err) {}
        }
        getMeetings();
    }, [user]);

    return (
        <div className="pt-8 min-h-screen px-4 md:px-10 bg-background pb-20">
            <div className="max-w-5xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-3xl text-text-primary font-bold">Meetings</h1>
                    <p className="text-sm text-text-secondary mt-1">Manage your schedule and view past insights.</p>
                </div>

                <div className="flex gap-6 mb-8 border-b border-border">
                    <button onClick={() => setActiveTab("upcoming")} className={`pb-3 text-sm font-bold ${activeTab === "upcoming" ? "text-primary border-b-2 border-primary" : "text-text-secondary hover:text-text-primary"}`}>Upcoming</button>
                    <button onClick={() => setActiveTab("past")} className={`pb-3 text-sm font-bold flex items-center gap-1.5 ${activeTab === "past" ? "text-primary border-b-2 border-primary" : "text-text-secondary hover:text-text-primary"}`}><Sparkles size={14}/> Insights</button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary h-4 w-4" />
                        <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-surface border-border text-text-primary focus:border-primary rounded-lg" />
                    </div>
                    <Select value={filterType} onValueChange={(val: any) => setFilterType(val)}>
                        <SelectTrigger className="w-full sm:w-40 bg-surface border-border text-text-primary rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-cardbg border-border text-text-primary">
                            <SelectItem value="all">All</SelectItem><SelectItem value="free">Free</SelectItem><SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-4">
                    {filteredMeetings.length > 0 ? (
                        filteredMeetings.map((m, i) => <MeetingCard key={i} {...m} setMeetings={setMeetings} bookedMeetings={bookedMeetings} />)
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
                            <Video size={48} className="mb-4 opacity-30" />
                            <p className="text-lg font-medium">No {activeTab === 'upcoming' ? 'upcoming' : 'past'} meetings</p>
                            <p className="text-sm mt-1 opacity-70">{activeTab === 'upcoming' ? 'Create a meeting to get started.' : 'Completed meetings will appear here.'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
export default Meetings;
