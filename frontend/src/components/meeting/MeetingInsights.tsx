import { ArrowLeft, CheckCircle2, CircleDot, Lightbulb, Send, Sparkles, Target } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../ui/button";
import api from "@/lib/axios";
import Loader from "../subComponents/Loader";

interface SummaryJSON {
    overview: string;
    keyPoints: string[];
    actionItems: string[];
    decisions: string[];
}

function parseSummary(raw: string): SummaryJSON | null {
    try {
        const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.overview && Array.isArray(parsed.keyPoints)) {
            return parsed as SummaryJSON;
        }
    } catch {}
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
    if (items.length === 0) return null;
    return (
        <div className={`rounded-lg p-5 ${accent ? 'bg-primary/5 border border-primary/10' : 'bg-surface/50 border border-border'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${accent ? 'text-primary' : 'text-text-secondary'}`}>
                {icon} {title}
            </h3>
            <ul className="space-y-3 list-none">
                {items.map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                        <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${accent ? 'bg-primary' : 'bg-text-secondary/50'}`} />
                        <p className="text-text-primary text-sm leading-relaxed">{item}</p>
                    </li>
                ))}
            </ul>
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
    const [meetingDetails, setMeetingDetails] = useState<any>(null);

    // Chat state
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [messages, setMessages] = useState<{ sender: "ai" | "user", text: string }[]>([
        { sender: "ai", text: "Hi! I have the context of this meeting. What would you like to know?" }
    ]);
    
    // Auto-scroll ref
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await api.get(`/api/meeting/summary/${id}`);
                if (res.data.success) {
                    setRawSummary(res.data.summary);
                    setSummary(parseSummary(res.data.summary));
                    setMeetingDetails(res.data.meeting);
                }
            } catch (err) {
                console.error("Failed to fetch summary:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSummary();
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
                                <span className="text-text-primary font-medium">{meetingDetails?.isPaid ? "Paid" : "Free"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-cardbg border border-border rounded-xl p-8 shadow-sm">
                        <h2 className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Sparkles size={14} className="text-primary" /> 
                            AI Summary
                        </h2>
                        
                        {!rawSummary ? (
                            <p className="text-text-secondary italic">No summary generated yet for this meeting.</p>
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
                            {messages.map((msg, idx) => (
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
                                    placeholder="Ask anything about the meeting..."
                                    className="w-full bg-background border border-border rounded-lg py-3 pl-4 pr-12 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                                    disabled={isChatLoading}
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={!chatInput.trim() || isChatLoading}
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
