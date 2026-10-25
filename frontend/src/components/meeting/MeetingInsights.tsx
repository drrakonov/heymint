import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Lightbulb, LockKeyhole, Send, Sparkles, Target } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../ui/button";
import api from "@/lib/axios";
import Loader from "../subComponents/Loader";
import axios from "axios";

interface SummaryJSON {
    overview: string;
    keyPoints: string[];
    actionItems: string[];
    decisions: string[];
}

interface MeetingDetails {
    title?: string;
    startingTime?: string;
    isProtected?: boolean;
}

function parseSummary(raw: string): SummaryJSON | null {
    try {
        const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.overview && Array.isArray(parsed.keyPoints)) {
            return parsed as SummaryJSON;
        }
    } catch {
        return null;
    }
    return null;
}

function FallbackSummary({ raw }: { raw: string }) {
    const lines = raw.split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(l => l.length > 5);
    return (
        <ul className="space-y-3 list-none">
            {lines.map((line, i) => (
                <li key={i} className="flex gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <p className="text-text-primary text-sm leading-relaxed">{line}</p>
                </li>
            ))}
        </ul>
    );
}

function SectionCard({ icon, title, items, emptyText, accent = false }: { icon: React.ReactNode, title: string, items: string[], emptyText: string, accent?: boolean }) {
    return (
        <div className={`rounded-lg p-5 ${accent ? 'bg-primary/5 border border-primary/10' : 'bg-surface/50 border border-border'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${accent ? 'text-primary' : 'text-text-secondary'}`}>
                {icon} {title}
            </h3>
            {items.length > 0 ? (
                <ul className="space-y-3 list-none">
                    {items.map((item, i) => (
                        <li key={i} className="flex gap-3 items-start">
                            <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${accent ? 'bg-primary' : 'bg-text-secondary/50'}`} />
                            <p className="text-text-primary text-sm leading-relaxed">{item}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-text-secondary">{emptyText}</p>
            )}
        </div>
    );
}

export default function MeetingInsights() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [chatInput, setChatInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [rawSummary, setRawSummary] = useState<string>("");
    const [summary, setSummary] = useState<SummaryJSON | null>(null);
    const [meetingDetails, setMeetingDetails] = useState<MeetingDetails | null>(null);
    const [insightStatus, setInsightStatus] = useState<"processing" | "ready" | "failed" | "forbidden" | "not-found">("processing");

    // Chat state
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [messages, setMessages] = useState<{ sender: "ai" | "user", text: string }[]>([
        { sender: "ai", text: "Hi! I have the context of this meeting. What would you like to know?" }
    ]);
    
    // Auto-scroll ref
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        let retryTimer: ReturnType<typeof setTimeout> | undefined;

        const fetchSummary = async (isFirstRequest = false) => {
            try {
                const res = await api.get(`/api/meeting/summary/${id}`);
                if (cancelled) return;

                if (res.data.success) {
                    setRawSummary(res.data.summary);
                    setSummary(parseSummary(res.data.summary));
                    setMeetingDetails(res.data.meeting);
                    setInsightStatus("ready");
                    return;
                }

                setMeetingDetails(res.data.meeting);
                setInsightStatus("processing");
                retryTimer = setTimeout(() => fetchSummary(), 5000);
            } catch (err: unknown) {
                if (cancelled) return;
                console.error("Failed to fetch summary:", err);

                if (axios.isAxiosError(err) && err.response?.status === 403) {
                    setInsightStatus("forbidden");
                } else if (axios.isAxiosError(err) && err.response?.status === 404) {
                    setInsightStatus("not-found");
                } else if (axios.isAxiosError(err) && err.response?.data?.status === "failed") {
                    setMeetingDetails(err.response.data.meeting as MeetingDetails);
                    setInsightStatus("failed");
                } else {
                    retryTimer = setTimeout(() => fetchSummary(), 5000);
                }
            } finally {
                if (isFirstRequest && !cancelled) setIsLoading(false);
            }
        };

        fetchSummary(true);
        return () => {
            cancelled = true;
            if (retryTimer) clearTimeout(retryTimer);
        };
    }, [id]);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isChatLoading]);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return;
        
        const userText = chatInput.trim();
        setChatInput("");
        setMessages(prev => [...prev, { sender: "user", text: userText }]);
        setIsChatLoading(true);

        try {
            const res = await api.post(`/api/meeting/chat/${id}`, { question: userText });
            if (res.data.success) {
                setMessages(prev => [...prev, { sender: "ai", text: res.data.answer }]);
            } else {
                setMessages(prev => [...prev, { sender: "ai", text: "Sorry, I encountered an error." }]);
            }
        } catch (err) {
            console.error("Chat error:", err);
            setMessages(prev => [...prev, { sender: "ai", text: "Sorry, I couldn't reach the server right now." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    if (isLoading) return <Loader />

    if (insightStatus === "forbidden" || insightStatus === "not-found") {
        const isForbidden = insightStatus === "forbidden";
        return (
            <div className="min-h-screen bg-background p-4 text-text-primary flex items-center justify-center">
                <div className="w-full max-w-md rounded-xl border border-border bg-cardbg p-8 text-center shadow-sm">
                    <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {isForbidden ? <LockKeyhole size={22} /> : <AlertCircle size={22} />}
                    </div>
                    <h1 className="text-xl font-bold">{isForbidden ? "Participant access required" : "Meeting not found"}</h1>
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                        {isForbidden
                            ? "Only the host and past participants can access insights for this protected meeting."
                            : "This meeting may have been removed or the link is incorrect."}
                    </p>
                    <Button onClick={() => navigate('/dashboard/meetings')} className="mt-6 bg-primary text-black hover:bg-primary/90">
                        Back to meetings
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text-primary p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate('/dashboard/meetings')}
                        className="text-text-secondary hover:text-text-primary hover:bg-surface rounded-md p-2 h-auto"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">Meeting Insights</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT PANEL */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Details */}
                    <div className="bg-cardbg border border-border rounded-xl p-8 shadow-sm">
                        <h2 className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-3">Details</h2>
                        <h3 className="text-xl font-bold mb-5">{meetingDetails?.title || "Meeting"}</h3>
                        
                        <div className="flex gap-8 text-sm text-text-secondary">
                            <div>
                                <span className="block mb-1 opacity-70">Date</span>
                                <span className="text-text-primary font-medium">
                                    {meetingDetails?.startingTime ? new Date(meetingDetails.startingTime).toLocaleDateString() : "Unknown"}
                                </span>
                            </div>
                            <div>
                                <span className="block mb-1 opacity-70">Type</span>
                                <span className="text-text-primary font-medium">{meetingDetails?.isProtected ? "Protected" : "Free"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-cardbg border border-border rounded-xl p-8 shadow-sm">
                        <h2 className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Sparkles size={14} className="text-primary" /> 
                            AI Summary
                        </h2>
                        
                        {insightStatus === "processing" ? (
                            <div className="flex items-start gap-3 rounded-lg border border-primary/15 bg-primary/5 p-5">
                                <Clock3 size={18} className="mt-0.5 shrink-0 text-primary animate-pulse" />
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">Generating meeting insights</p>
                                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">The recording is being processed and transcribed by speaker. This page updates automatically.</p>
                                </div>
                            </div>
                        ) : insightStatus === "failed" ? (
                            <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-5">
                                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">Insights could not be generated</p>
                                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">The recording could not be processed after several attempts. Please contact support.</p>
                                </div>
                            </div>
                        ) : !rawSummary ? (
                            <p className="text-text-secondary italic">No spoken content was found for this meeting.</p>
                        ) : summary ? (
                            <div className="space-y-6">
                                {/* Overview */}
                                <div className="text-text-primary text-sm leading-relaxed border-l-2 border-primary pl-4">
                                    {summary.overview}
                                </div>

                                {/* Key Points */}
                                <SectionCard
                                    icon={<Lightbulb size={12} />}
                                    title="Key Points"
                                    items={summary.keyPoints}
                                    emptyText="No key points identified."
                                />

                                {/* Action Items */}
                                <SectionCard
                                    icon={<Target size={12} />}
                                    title="Action Items"
                                    items={summary.actionItems}
                                    emptyText="No action items."
                                    accent
                                />

                                {/* Decisions */}
                                <SectionCard
                                    icon={<CheckCircle2 size={12} />}
                                    title="Decisions Made"
                                    items={summary.decisions}
                                    emptyText="No decisions recorded."
                                />
                            </div>
                        ) : (
                            <FallbackSummary raw={rawSummary} />
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: Chat */}
                <div className="lg:col-span-5">
                    <div className="bg-cardbg border border-border rounded-xl shadow-sm h-[600px] flex flex-col overflow-hidden sticky top-8">
                        
                        <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
                            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                <Sparkles size={16} className="text-primary" /> Ask AI
                            </h2>
                        </div>

                        <div 
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto p-6 space-y-6 bg-background/50 scroll-smooth"
                        >
                            {insightStatus !== "ready" ? (
                                <div className="flex h-full items-center justify-center text-center">
                                    <div className="max-w-xs">
                                        <Sparkles size={22} className="mx-auto mb-3 text-primary/70" />
                                        <p className="text-sm text-text-secondary">
                                            {insightStatus === "failed" ? "Meeting chat is unavailable because processing failed." : "Meeting chat will be ready when the transcript has finished processing."}
                                        </p>
                                    </div>
                                </div>
                            ) : messages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${msg.sender === 'user' ? 'bg-surface border border-border text-text-primary' : 'bg-primary text-black'}`}>
                                        {msg.sender === 'user' ? 'U' : <Sparkles size={14} />}
                                    </div>
                                    <div className={`p-3 rounded-lg max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap ${
                                        msg.sender === 'user' 
                                            ? 'bg-surface border border-border text-text-primary' 
                                            : 'bg-primary/10 border border-primary/20 text-primary'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            
                            {isChatLoading && (
                                <div className="flex gap-3 flex-row">
                                    <div className="h-8 w-8 rounded-md flex items-center justify-center shrink-0 text-xs font-bold bg-primary text-black">
                                        <Sparkles size={14} />
                                    </div>
                                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-surface border-t border-border">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSendMessage();
                                    }}
                                    placeholder={insightStatus === "ready" ? "Ask anything about the meeting..." : "Waiting for meeting insights..."}
                                    className="w-full bg-background border border-border rounded-lg py-3 pl-4 pr-12 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                                    disabled={isChatLoading || insightStatus !== "ready"}
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={!chatInput.trim() || isChatLoading || insightStatus !== "ready"}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-black rounded-md disabled:opacity-50 disabled:bg-surface disabled:text-text-secondary transition-colors"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
