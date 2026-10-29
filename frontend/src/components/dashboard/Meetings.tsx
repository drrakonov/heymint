import { Calendar, Clock, LockKeyhole, Search, Trash2, Users, Video, Sparkles, Plus, ArrowRight, Copy, X, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useUserStore } from "@/store/userStore";
import PageHeader from "../workspace/PageHeader";
import CopyClipboardBtn from "../subComponents/CopyClipboardBtn";

interface MeetingCardProps {
    meetingId: string
    title: string
    hostName: string
    description: string
    type: "Free" | "Protected"
    meetingTime?: string
    isInstant?: boolean
    participantCount?: number
    meetingCode: string
    createdById: string
    isComplete?: boolean;
    isExpired?: boolean;
    isDraft?: boolean;
    canAccessInsights: boolean;
    setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>;
}

export function MeetingCard({ title, hostName, description, type, meetingTime, isInstant = false, participantCount, meetingCode, createdById, isComplete = false, isExpired = false, isDraft = false, canAccessInsights, setMeetings }: MeetingCardProps) {
    const navigate = useNavigate();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useUserStore();
    const handleJoinMeeting = () => navigate(`/meeting/${meetingCode}`);

    const handleDeleteMeeting = async () => {
        if (!user || user.id !== createdById) return;
        if (isDeleting) return;
        setIsDeleting(true);
        try {
            const res = await api.post("/api/meeting/delete-meeting", { meetingCode, isComplete: false });
            if (res.data.success) { toast.success("Meeting deleted"); setMeetings(prev => prev.filter(m => m.meetingCode !== meetingCode)); }
        } catch { toast.error("Failed to delete meeting"); } finally { setIsDeleting(false); }
    }

    return (
        <Card className="workspace-panel w-full gap-0 p-0 transition duration-200 hover:border-primary/25">
            <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <h3 className="break-words text-lg font-semibold text-text-primary tracking-tight">{title}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-secondary font-medium">
                            <span className="flex items-center gap-1.5"><Users size={14} className="text-primary"/>{hostName}</span>
                            {isInstant && <span className="flex items-center gap-1.5 text-primary"><Video size={14}/>Instant</span>}
                        </div>
                        <p className="text-sm mt-3 text-text-secondary line-clamp-2">{description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="flex gap-2 items-center">
                            <Badge variant="outline" className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${type === "Protected" ? "bg-primary/10 text-primary border-primary/20" : "bg-surface text-text-secondary border-border"}`}>{type}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <CopyClipboardBtn meetingCode={meetingCode} />
                            {user?.id === createdById && !isComplete && (
                                <button aria-label={`Delete ${title}`} onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                
                {!isComplete && !isExpired && <button onClick={async()=>{try{await navigator.clipboard.writeText(meetingCode);toast.success("Meeting code copied");}catch{toast.error("Could not copy the code");}}} className="mt-5 flex w-full items-center gap-2 rounded-lg border border-dashed border-white/10 px-3 py-2 text-left text-text-secondary hover:border-primary/30" title="Copy meeting code"><span className="shrink-0 text-[10px] uppercase tracking-wider">Code</span><code className="min-w-0 flex-1 truncate text-[11px]">{meetingCode}</code><Copy size={12}/></button>}
                {confirmDelete && <div className="mt-4 rounded-xl border border-danger/25 bg-danger/5 p-4" role="alert"><p className="text-sm">Delete this meeting?</p><p className="mt-1 text-xs text-text-secondary">The invite will no longer be available.</p><div className="mt-3 flex gap-3"><button disabled={isDeleting} onClick={handleDeleteMeeting} className="text-xs font-medium text-danger">{isDeleting ? "Deleting…" : "Delete meeting"}</button><button onClick={()=>setConfirmDelete(false)} className="text-xs text-text-secondary">Keep meeting</button></div></div>}
                <div className="mt-5 flex flex-col justify-between gap-4 border-t border-white/8 pt-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4 text-xs font-medium text-text-secondary">
                        {!isInstant && <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> {meetingTime ? new Date(meetingTime).toLocaleString("en-US", {weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"}) : "-"}</span>}
                        {participantCount && <span className="flex items-center gap-1.5"><Clock size={14} /> {participantCount} expected</span>}
                    </div>
                    
                    <div>
                        {isExpired ? <span className="text-xs text-text-secondary">Expired · never started</span> : isComplete && canAccessInsights ? (
                            <Button onClick={() => navigate(`/meeting/${meetingCode}/insights`)} className="mint-button rounded-full px-4 py-2 text-sm font-semibold">
                                <Sparkles size={14} className="mr-2" /> View Insights
                            </Button>
                        ) : isComplete ? (
                            <span className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                                <LockKeyhole size={14} /> Participants only
                            </span>
                        ) : (
                            <Button onClick={handleJoinMeeting} className="glass-control rounded-full px-4 py-2 text-sm font-semibold text-text-primary">
                                {user?.id === createdById ? (isDraft ? "Open draft" : "Start Session") : "Join Now"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}

type Meeting = { meetingId: string, title: string, hostName: string, description: string, type: "Free" | "Protected", isProtected: boolean, meetingTime?: string, isInstant?: boolean, meetingCode: string, createdById: string, isComplete?: boolean, isExpired?: boolean, isDraft?: boolean, canAccessInsights: boolean }

const Meetings = () => {
    const [params] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [reload, setReload] = useState(0);
    const [searchQuery, setSearchQuery] = useState(params.get("search") || "");
    const [filterType, setFilterType] = useState<"all" | "free" | "protected" | "instant">("all");
    const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "drafts">(params.get("tab") === "past" ? "past" : "upcoming");
    const [meetings, setMeetings] = useState<Meeting[]>([]);

    const user = useUserStore(state => state.user);
    const filteredMeetings = useMemo(() => {
        return meetings.filter(m => {
            const isTabMatch = activeTab === "drafts" ? m.isDraft && m.createdById === user?.id : activeTab === "upcoming" ? !m.isComplete && !m.isExpired && !m.isDraft : m.isComplete || m.isExpired;
            const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.hostName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterType === "all" || (filterType === "free" && m.type === "Free") || (filterType === "protected" && m.type === "Protected") || (filterType === "instant" && m.isInstant);
            return isTabMatch && matchesSearch && matchesFilter;
        });
    }, [searchQuery, filterType, meetings, activeTab, user?.id]);

    useEffect(() => {
        let cancelled = false;
        const getMeetings = async () => {
            setLoading(true); setError(false);
            try {
                const res = await api.get("/api/meeting/get-meetings");
                if (!cancelled && res.data.success) {
                    setMeetings(res.data.meetings);
                }
            } catch (error) {
                console.error("Failed to load meetings", error);
                if (!cancelled) setError(true);
            } finally { if (!cancelled) setLoading(false); }
        }
        getMeetings();
        return () => { cancelled = true; };
    }, [reload]);

    return (
        <div className="page-shell">
            <div>
                <PageHeader eyebrow="Meeting library" title="Every conversation, together." description="Find a room, share an invite, or revisit a past meeting." action={<Link to="/dashboard/addmeeting" className="workspace-action mint-button"><Plus size={16}/> New meeting</Link>}/>
                <div className="mb-6 flex w-fit max-w-full gap-1 rounded-full border border-white/10 bg-white/[.045] p-1">
                    <button onClick={() => setActiveTab("upcoming")} className={`flex items-center whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${activeTab === "upcoming" ? "bg-primary text-[#052019]" : "text-text-secondary hover:text-text-primary"}`}>Upcoming <span className="ml-2 opacity-60">{meetings.filter(m=>!m.isComplete && !m.isExpired && !m.isDraft).length}</span></button>
                    <button onClick={() => setActiveTab("drafts")} className={`rounded-full px-3 py-2 text-xs font-semibold ${activeTab === "drafts" ? "bg-primary text-[#052019]" : "text-text-secondary"}`}>Drafts <span className="ml-2 opacity-60">{meetings.filter(m => m.isDraft && m.createdById === user?.id).length}</span></button>
                    <button onClick={() => setActiveTab("past")} className={`flex items-center whitespace-nowrap gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${activeTab === "past" ? "bg-primary text-[#052019]" : "text-text-secondary hover:text-text-primary"}`}><Sparkles size={14}/> Past meetings <span className="ml-1 opacity-60">{meetings.filter(m=>m.isComplete || m.isExpired).length}</span></button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary h-4 w-4" />
                        <Input aria-label="Search meetings or hosts" placeholder="Search meetings or hosts" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="glass-input pl-9" />
                    </div>
                    <Select value={filterType} onValueChange={(value: "all" | "free" | "protected" | "instant") => setFilterType(value)}>
                        <SelectTrigger aria-label="Filter meeting type" className="glass-input w-full sm:w-40"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-cardbg border-border text-text-primary">
                            <SelectItem value="all">All</SelectItem><SelectItem value="free">Free</SelectItem><SelectItem value="protected">Protected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="mb-4 flex items-center justify-between text-xs text-text-secondary"><span>{loading ? "Loading your rooms…" : `${filteredMeetings.length} ${filteredMeetings.length === 1 ? 'meeting' : 'meetings'}`}</span>{(searchQuery || filterType !== 'all') && <button onClick={()=>{setSearchQuery('');setFilterType('all');}} className="flex items-center gap-1 hover:text-primary"><X size={12}/> Clear filters</button>}</div>
                <div className="grid items-start gap-4 lg:grid-cols-2">
                    {loading ? [1,2].map(n=><div key={n} className="workspace-panel h-60 animate-pulse bg-white/5" aria-label="Loading meeting"/>) : error ? <div className="workspace-empty workspace-panel col-span-full" role="alert"><p>Couldn’t load the meeting library.</p><button className="workspace-action glass-control mt-5" onClick={()=>setReload(n=>n+1)}><RefreshCw size={14}/> Try again</button></div> : filteredMeetings.length > 0 ? (
                        filteredMeetings.map((meeting) => <MeetingCard key={meeting.meetingId} {...meeting} setMeetings={setMeetings} />)
                    ) : (
                        <div className="workspace-panel workspace-empty col-span-full min-h-72">
                            <span className="section-icon mb-5"><Video size={22}/></span>
                            <h2 className="text-lg font-semibold">{searchQuery || filterType !== 'all' ? 'No matching meetings' : activeTab === 'drafts' ? 'No unfinished rooms.' : activeTab === 'upcoming' ? 'Make room for a conversation.' : 'Your meeting memory starts here.'}</h2>
                            <p className="mt-2 text-sm leading-6 text-text-secondary">{searchQuery || filterType !== 'all' ? 'Try a different title, host, or meeting type.' : activeTab === 'drafts' ? 'Instant rooms you create but never join are kept here.' : activeTab === 'upcoming' ? 'Create a room or join one with an invite.' : 'Completed meetings appear here with access to their insights.'}</p>
                            {!(searchQuery || filterType !== 'all') && <Link to="/dashboard/addmeeting" className="workspace-action glass-control mt-6">Create a meeting <ArrowRight size={14}/></Link>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
export default Meetings;
