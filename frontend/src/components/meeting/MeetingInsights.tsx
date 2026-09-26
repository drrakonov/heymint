import { ArrowLeft, Clock, Search, Send, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../ui/button";
import api from "@/lib/axios";
import Loader from "../subComponents/Loader";

export default function MeetingInsights() {
    const navigate = useNavigate();
    const { id } = useParams(); // meetingCode
    const [chatInput, setChatInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [summaryData, setSummaryData] = useState<string[]>([]);
    const [meetingDetails, setMeetingDetails] = useState<any>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await api.get(`/api/meeting/summary/${id}`);
                if (res.data.success) {
                    // Split the AI response into bullet points by newlines for clean rendering
                    const points = res.data.summary
                        .split('\n')
                        .map((line: string) => line.replace(/^[-*•]\s*/, '').trim())
                        .filter((line: string) => line.length > 5);
                    setSummaryData(points.length > 0 ? points : [res.data.summary]);
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

    const mockChat = [
        { sender: "ai", text: "Hi! I have the context of this meeting. What would you like to know?" },
    ];

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
                <div className="lg:col-span-7 space-y-8">
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
                        
                        <div className="space-y-4 text-text-primary leading-relaxed text-sm">
                            {summaryData.length === 0 ? (
                                <p className="text-text-secondary italic">No summary generated yet for this meeting.</p>
                            ) : (
                                <ul className="space-y-4 list-none">
                                    {summaryData.map((point, idx) => (
                                        <li key={idx} className="flex gap-3">
                                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div>
                                            <p>{point}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Chat */}
                <div className="lg:col-span-5">
                    <div className="bg-cardbg border border-border rounded-xl shadow-sm h-[600px] flex flex-col overflow-hidden">
                        
                        <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
                            <h2 className="text-sm font-bold text-text-primary">
                                AI Assistant <span className="ml-2 text-[10px] text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Coming Soon</span>
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background/50">
                            {mockChat.map((msg, idx) => (
                                <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${msg.sender === 'user' ? 'bg-surface border border-border text-text-primary' : 'bg-primary text-black'}`}>
                                        {msg.sender === 'user' ? 'U' : <Sparkles size={14} />}
                                    </div>
                                    <div className={`p-3 rounded-lg max-w-[85%] text-sm leading-relaxed ${
                                        msg.sender === 'user' 
                                            ? 'bg-surface border border-border text-text-primary' 
                                            : 'bg-primary/10 border border-primary/20 text-primary'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-surface border-t border-border opacity-50 pointer-events-none">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="RAG Chatbot feature coming next..."
                                    className="w-full bg-background border border-border rounded-lg py-2.5 pl-4 pr-12 text-sm text-text-primary focus:outline-none"
                                    disabled
                                />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-text-secondary" disabled>
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
