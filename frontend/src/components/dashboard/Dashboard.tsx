import { CalendarCheckIcon, CheckCircle2, IndianRupee, MoveRightIcon, Users } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "@/store/userStore"
import { AnimatePresence } from "framer-motion"
import { motion } from 'motion/react'
import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface dashboardStatsProps {
    totalEarning: number
    totalMeetings: number
    myTotalMeetings: number
    completedMeetings: number
    activeUsers: number
}

const DashboardGraph = () => {
    const data = [
        { month: "Jan", earnings: 400 },
        { month: "Feb", earnings: 800 },
        { month: "Mar", earnings: 600 },
        { month: "Apr", earnings: 1200 },
        { month: "May", earnings: 900 },
    ]

    return (
        <div className="bg-cardbg p-6 md:p-10 rounded-2xl border-2 border-surface-2 w-full shadow-lg">
            {/* Title */}
            <h2 className="text-xl font-semibold text-text-primary mb-6">
                My Earnings
            </h2>

            {/* Graph */}
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        {/* Grid */}
                        <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />

                        {/* Axes */}
                        <XAxis dataKey="month" stroke="#888" fontSize={12} />
                        <YAxis stroke="#888" fontSize={12} />

                        {/* Tooltip */}
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1e1e1e",
                                borderRadius: "12px",
                                border: "none",
                                color: "#fff",
                            }}
                        />

                        {/* Smooth Line */}
                        <Line
                            type="monotone"
                            dataKey="earnings"
                            stroke="#6366f1" // Indigo-500
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#6366f1" }}
                            activeDot={{ r: 7, fill: "#a5b4fc" }}
                        />
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
        <div className="w-full h-40 md:h-60 bg-cardbg rounded-2xl border-2 border-surface-2" >
            <div className="flex justify-end">
                <button
                    onClick={() => navigate("/dashboard/profile")}
                    className="text-text-secondary/80 hover:text-text-secondary/50 cursor-pointer rounded-2xl pr-2 pt-1">
                    {<MoveRightIcon size={15} />}
                </button>
            </div>
            <div className=" flex flex-col justify-center items-center p-2">
                <div className="h-15 w-15 lg:h-20 lg:w-20 rounded-full border-3 border-[#101010] border-t-slate-400 border-b-accent p-1 bg-[#101010]/20">
                    <img
                        src="https://cdn.jsdelivr.net/gh/alohe/avatars@master/png/memo_32.png"
                        alt="avatar"
                        className="rounded-full"
                    />
                </div>
                <div className="text-text-primary tracking-tighter pt-3 text-lg lg:text-xl">
                    Hello!{" "}
                    <AnimatePresence>
                        {user?.name && (
                            <motion.span
                                key={user.name}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="font-semibold inline-block"
                            >
                                {user.name}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
                <p className="text-text-secondary tracking-tighter text-xs text-center">
                    Welcome to HeyMint — let’s get started 🚀
                </p>
            </div>
        </div>
    )
}

const MyMeetings = () => {
    const [activeTab, setActiveTab] = useState<"all" | "free" | "paid">("all")

    // Example meetings (replace with your data from backend)
    const meetings = [
        { id: 1, title: "Design Workshop", type: "free" },
        { id: 2, title: "Startup Pitch", type: "paid" },
        { id: 3, title: "Community Hangout", type: "free" },
    ]

    // Filter meetings by tab
    const filteredMeetings =
        activeTab === "all"
            ? meetings
            : meetings.filter((m) => m.type === activeTab)

    return (
        <div className="h-64 md:h-full w-full bg-cardbg rounded-2xl border-2 border-surface-2 p-4 flex flex-col">
            {/* Tabs */}
            <div className="flex gap-4 mb-4">
                {["all", "free", "paid"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as "all" | "free" | "paid")}
                        className={`px-4 py-1 rounded-lg capitalize transition ${activeTab === tab
                            ? "bg-primary text-white"
                            : "bg-surface-2 text-text-primary hover:bg-surface-3"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Meeting List */}
            <div className="flex-1 overflow-y-auto">
                {filteredMeetings.length > 0 ? (
                    <ul className="space-y-2">
                        {filteredMeetings.map((meeting) => (
                            <li
                                key={meeting.id}
                                className="p-3 rounded-xl bg-surface-2 text-text-primary flex justify-between"
                            >
                                <span>{meeting.title}</span>
                                <span
                                    className={`text-sm px-2 py-1 rounded ${meeting.type === "free"
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-blue-500/20 text-blue-400"
                                        }`}
                                >
                                    {meeting.type}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex items-center justify-center h-full text-text-secondary">
                        No {activeTab} meetings yet.
                    </div>
                )}
            </div>
        </div>
    )
}

const DashboardStats = ({
    totalEarning,
    myTotalMeetings,
    completedMeetings,
    activeUsers
}: dashboardStatsProps) => {
    const stats = [
        {
            label: "Total Earning",
            value: totalEarning,
            icon: IndianRupee,
            bgColor: "bg-primary/10",
            color: "text-primary",
            subDetails: "+12% from last month"
        },
        {
            label: "My Meetings",
            value: myTotalMeetings,
            bgColor: "bg-primary/10",
            color: "text-accent",
            icon: CalendarCheckIcon,
            subDetails: "Paid and Scheduled"
        },
        {
            label: "Completed Meetings",
            value: completedMeetings,
            bgColor: "bg-primary/10",
            color: "text-accent",
            icon: CheckCircle2,
            subDetails: "91% completion rate"
        },
        {
            label: "Active Users",
            value: activeUsers,
            bgColor: "bg-primary/10",
            color: "text-accent",
            icon: Users,
            subDetails: "+15% from last month"
        }
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.map((stat) => (
                <Card key={stat.label} className="bg-cardbg border border-surface-2">
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-sm text-text-secondary">{stat.label}</p>
                                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                                <p className="text-primary font-extralight text-xs">{stat.subDetails}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

const Dashboard = () => {
    return (
        <div className="w-full h-full p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left Section (Graph + Stats) */}
            <div className="md:col-span-2 flex flex-col justify-between gap-3">
                <DashboardGraph />
                <DashboardStats
                    myTotalMeetings={20}
                    totalMeetings={30}
                    activeUsers={400}
                    completedMeetings={100}
                    totalEarning={3000}
                />
            </div>

            {/* Right Section (User + Meetings) */}
            <div className="md:col-span-1 flex flex-col gap-3">
                <UserCard />
                <MyMeetings />
            </div>
        </div>
    )
}

export default Dashboard
