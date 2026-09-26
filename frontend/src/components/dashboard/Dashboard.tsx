import { CalendarCheckIcon, CheckCircle2, IndianRupee, MoveRightIcon, Users } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "@/store/userStore"
import { AnimatePresence } from "framer-motion"
import { motion } from 'motion/react'
import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Loader from "../subComponents/Loader"
import api from "@/lib/axios"

interface dashboardStatsProps {
    totalEarning: number; totalMeetings: number; myTotalMeetings: number; completedMeetings: number; activeUsers: number;
}
type Meetings = { id: string; title: string; type: "paid" | "free" }
interface MyMeetingsProps { meetings: Meetings[]; }

const DashboardGraph = () => {
    const data = [
        { month: "Jan", earnings: 0 }, { month: "Feb", earnings: 0 }, { month: "Mar", earnings: 0 },
        { month: "Apr", earnings: 0 }, { month: "May", earnings: 0 },
    ];

    return (
        <div className="bg-cardbg p-6 md:p-8 rounded-xl border border-border w-full shadow-sm">
            <h2 className="text-lg font-bold text-text-primary mb-6">Revenue Overview</h2>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="month" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} dx={-10} tickFormatter={(value) => `₹${value}`} />
                        <Tooltip contentStyle={{ backgroundColor: "var(--color-surface)", borderRadius: "8px", border: "1px solid var(--color-border)", color: "#fff", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} cursor={{ stroke: 'var(--color-border)' }} />
                        <Line type="monotone" dataKey="earnings" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-surface)", stroke: "var(--color-primary)", strokeWidth: 2 }} activeDot={{ r: 6, fill: "var(--color-primary)", stroke: "var(--color-primary)" }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

const UserCard = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    return (
        <div className="w-full h-40 md:h-52 bg-cardbg rounded-xl border border-border shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-4 right-4 z-10">
                <button onClick={() => navigate("/dashboard/profile")} className="text-text-secondary hover:text-primary transition-colors p-1 bg-surface rounded-full border border-border">
                    <MoveRightIcon size={16} />
                </button>
            </div>
            <div className="flex flex-col justify-center items-center h-full p-4 relative z-10">
                <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-full border-2 border-primary/20 p-1 bg-surface mb-3">
                    <img src="https://cdn.jsdelivr.net/gh/alohe/avatars@master/png/memo_32.png" alt="avatar" className="rounded-full w-full h-full object-cover" />
                </div>
                <div className="text-text-primary font-bold text-lg lg:text-xl flex items-center gap-1">
                    Welcome back,
                    <AnimatePresence>
                        {user?.name && (
                            <motion.span key={user.name} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-primary">{user.name}</motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

const MyMeetings = ({ meetings }: MyMeetingsProps) => {
    const [activeTab, setActiveTab] = useState<"all" | "free" | "paid">("all")
    const filteredMeetings = activeTab === "all" ? meetings : meetings.filter((m) => m.type === activeTab);

    return (
        <div className="h-64 md:h-[calc(100%-14rem)] w-full bg-cardbg rounded-xl border border-border p-5 flex flex-col shadow-sm mt-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Quick Agenda</h3>
            <div className="flex gap-4 mb-4 border-b border-border">
                {["all", "free", "paid"].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab as "all" | "free" | "paid")} className={`pb-2 text-xs font-bold capitalize transition-colors relative ${activeTab === tab ? "text-primary" : "text-text-secondary hover:text-text-primary"}`}>
                        {tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {filteredMeetings.length > 0 ? (
                    <ul className="space-y-3">
                        {filteredMeetings.map((meeting) => (
                            <li key={meeting.id} className="p-3 rounded-lg bg-surface border border-border text-text-primary flex justify-between items-center group hover:border-primary/30 transition-colors">
                                <span className="text-sm font-medium truncate pr-2">{meeting.title}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${meeting.type === "free" ? "bg-surface-1 border border-border text-text-secondary" : "bg-primary/10 border border-primary/20 text-primary"}`}>
                                    {meeting.type}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex items-center justify-center h-full text-xs text-text-secondary italic">No {activeTab} meetings found.</div>
                )}
            </div>
        </div>
    )
}

const DashboardStats = ({ totalEarning, myTotalMeetings, completedMeetings, activeUsers }: dashboardStatsProps) => {
    const stats = [
        { label: "Total Earning", value: `₹${totalEarning}`, icon: IndianRupee, subDetails: "+12% this month" },
        { label: "My Meetings", value: myTotalMeetings, icon: CalendarCheckIcon, subDetails: "Paid & Scheduled" },
        { label: "Completed", value: completedMeetings, icon: CheckCircle2, subDetails: "91% completion rate" },
        { label: "Active Users", value: activeUsers, icon: Users, subDetails: "+15% this month" }
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {stats.map((stat) => (
                <Card key={stat.label} className="bg-cardbg border border-border shadow-sm hover:border-primary/30 transition-colors group">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">{stat.label}</p>
                            <div className="p-2 rounded-lg bg-surface border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                                <stat.icon className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                            <p className="text-[10px] text-text-secondary mt-1 font-medium">{stat.subDetails}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

const Dashboard = () => {
    const { user } = useUserStore();
    const [isLoading, setIsLoading] = useState(false);
    const [myTotalMeetings, setMyTotalMeetings] = useState(0);
    const [totalMeetings, setTotalMeetings] = useState(0);
    const [activeUsers, setActiveUsers] = useState(0);
    const [completedMeetings, setCompletedMeetings] = useState(0);
    const [totalEarning, setTotalEarning] = useState(0);
    const [MyAllMeetings, setMyAllMeetings] = useState<Meetings[]>([]);

    useEffect(() => {
        if(!user) return;
        const getDashboardStats = async () => {
            try {
                setIsLoading(true);
                const res = await api.get("/api/user/get-dashboard-stats");
                const allMeetingsRes = await api.get("/api/user/get-dashboard-allmeetings");
                if (res.data.success && allMeetingsRes.data.success) {
                    const stats = res.data.dashboardStats;
                    setActiveUsers(stats.activeUsers);
                    setCompletedMeetings(stats.completedMeetings);
                    setMyTotalMeetings(stats.myTotalMeetings);
                    setTotalEarning(stats.totalEarning);
                    setTotalMeetings(stats.totalMeetings);
                    setMyAllMeetings(allMeetingsRes.data.myMeetings);
                }
            } catch (err) { } finally { setIsLoading(false); }
        }
        getDashboardStats();
    }, [user])

    if (isLoading) return <Loader />
    return (
        <div className="w-full h-full p-6 md:p-10 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
                <p className="text-sm text-text-secondary mt-1">Here is a summary of your monetization and meeting metrics.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 flex flex-col h-full">
                    <DashboardGraph />
                    <DashboardStats totalEarning={totalEarning} totalMeetings={totalMeetings} activeUsers={activeUsers} completedMeetings={completedMeetings} myTotalMeetings={myTotalMeetings} />
                </div>
                <div className="md:col-span-1 flex flex-col h-full">
                    <UserCard />
                    <MyMeetings meetings={MyAllMeetings} />
                </div>
            </div>
        </div>
    )
}
export default Dashboard;
