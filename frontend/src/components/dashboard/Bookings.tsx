import { Calendar, Filter, Search, SortAsc, Users, Video } from "lucide-react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { useUserStore } from "@/store/userStore";
import Loader from "../subComponents/Loader";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { EmptyState } from "../subComponents/EmptyStateMeeting";
import toast from "react-hot-toast";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useNavigate } from "react-router-dom";
import CopyClipboardBtn from "../subComponents/CopyClipboardBtn";




type Bookings = {
    meetingId: string,
    title: string
    hostName: string
    description: string
    price: number
    isProtected: boolean
    meetingTime: string
    isInstant: boolean
    meetingCode: string
    createdById: string
}

interface BookedCardProps {
    meetingId: string
    title: string
    hostName: string
    description: string
    price: number
    meetingTime: string
    isInstant: boolean
    meetingCode: string
    createdById: string
    setBookings: React.Dispatch<React.SetStateAction<Bookings[]>>;
}

const BookingCard = ({
    meetingId,
    title,
    hostName,
    description,
    price,
    meetingTime,
    isInstant,
    meetingCode,
    createdById,
    setBookings
}: BookedCardProps) => {

    const { user } = useUserStore();
    const client = useStreamVideoClient();
    const [isJoining, setIsJoining] = useState(false);
    const [startsAtValue, setStartsAtValue] = useState({
        dateTime: new Date(),
        description: "Scheduled-meeting",
        link: ''
    });

    const navigate = useNavigate();





    const handleJoinMeeting = async () => {
        try {
            if (!client || !user) {
                toast.error("Failed to join");
                return;
            }
            const call = client.call("default", meetingCode);
            if (!call) throw new Error("Failed to create call");


            if (user.id === createdById) {
                setIsJoining(true);
                const startsAt = startsAtValue.dateTime.toISOString() ||
                    new Date(Date.now()).toISOString();

                await call.getOrCreate({
                    data: {
                        starts_at: startsAt,
                        custom: {
                            description: "scheduled-meeting"
                        }
                    }
                })
                setIsJoining(false);
                navigate(`/meeting/${call.id}`);
                return;
            }

            try {
                await call.get();
                navigate(`/meeting/${call.id}`);
                
            } catch (err) {
                toast.error("Meeting not available yet. Wait for the host to start.")
            }


        } catch (err) {
            if (typeof err === "object" && err !== null && "code" in err && (err as any).code === 16) {
                toast.error("Meeting not available yet. Wait for the host to start.");
            } else {
                console.error("Failed to join the meeting", err);
                toast.error("Unable to join meeting");
            }
        }
    }


    const formatMeetingTime = (dateString: string | undefined) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleString("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    }



    return (
        <Card className="w-full bg-surface/40 backdrop-blur-md border border-white/5 shadow-sm hover:border-primary/50 transition-colors duration-200 p-0 rounded-xl overflow-hidden">
            <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-text-primary tracking-tight truncate">{title}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary font-medium">
                            <span className="flex items-center gap-1.5"><Users size={14} className="text-primary"/>{hostName}</span>
                        </div>
                        <p className="text-sm mt-3 text-text-secondary line-clamp-2">{description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-3 mt-1 md:mt-0">
                        <div className="flex items-center gap-3">
                            {price ? (
                                <Badge variant="outline" className="text-xs font-medium text-primary border-primary/30 bg-primary/5">
                                    ₹{price}
                                </Badge>
                            ) : null}
                            <CopyClipboardBtn meetingCode={meetingCode} />
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                        {isInstant ? (
                            <span className="flex items-center gap-1.5">
                                <Video className="h-4 w-4 text-primary" />
                                <span className="font-medium text-primary">Quick Join</span>
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                <Calendar size={16} className="text-text-secondary" />
                                <span className="font-medium text-text-secondary">{formatMeetingTime(meetingTime)}</span>
                            </span>
                        )}
                    </div>
                    <Button
                        className={`w-full sm:w-auto cursor-pointer rounded-lg transition-colors
                        ${isInstant ? "bg-primary hover:bg-primary/90 text-background font-medium"
                                : "bg-surface-1 hover:bg-surface-2 text-text-primary font-medium border border-border"}`}
                        size="sm"
                        variant={isInstant ? "default" : "outline"}
                        onClick={handleJoinMeeting}
                    >
                        {"Join"}
                    </Button>
                </div>
            </div>
        </Card>
    )
}

const Bookings = () => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filterType, setFilterType] = useState<"all" | "instant" | "scheduled">("all");
    const [sortBy, setSortBy] = useState<"title" | "time">("title");
    const [isLoading, setIsLoading] = useState(false);
    const [bookings, setBookings] = useState<Bookings[]>([]);
    const { user } = useUserStore();

    const filteredAndSortedMeetings = useMemo<Bookings[]>(() => {
        const filtered = bookings.filter((meeting) => {
            const matchesSearch =
                (meeting.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (meeting.hostName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (meeting.description || "").toLowerCase().includes(searchQuery.toLowerCase())
            const matchesFilter =
                filterType === "all" ||
                (filterType === "instant" && meeting.isInstant)
            return matchesSearch && matchesFilter
        })

        filtered.sort((a, b) => {
            switch (sortBy) {
                case "title":
                    return a.title.localeCompare(b.title)
                case "time":
                    if (a.isInstant && !b.isInstant) return -1
                    if (!a.isInstant && b.isInstant) return 1
                    return 0
                default:
                    return 0
            }
        })

        return filtered
    }, [searchQuery, filterType, sortBy, bookings]);

    const clearSearch = () => {
        setSearchQuery("")
        setFilterType("all")
    }

    useEffect(() => {
        const getAllBookedMeetings = async () => {
            try {
                setIsLoading(true);
                if(!user) throw new Error("user not found");
                const res = await api.get("/api/meeting/get-booked-meetings", {
                    params: {
                        userId: user?.id
                    }
                });

                if (res.data.success) {
                    setBookings(res.data.bookings);
                }
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to get booked meetings");
            }
        }

        getAllBookedMeetings();
    }, [])


    if (isLoading) return <Loader />



    return (
        <div className="min-h-screen bg-background pt-6 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-text-primary mb-2 tracking-tight">Bookings</h1>
                <p className="text-sm text-text-secondary mb-8">Join your booked meetings.</p>

                {/* search bar */}
                <div className="bg-surface border border-border rounded-xl p-4 mb-8 shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary h-4 w-4" />
                            <Input
                                placeholder="Search meetings by title, host, description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 bg-background border-border text-text-primary placeholder:text-text-secondary focus:border-primary/50 rounded-lg transition-colors"
                            />
                        </div>

                        <div className="flex gap-3 flex-col sm:flex-row">
                            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                                <SelectTrigger className="w-full sm:w-[160px] h-10 border-border bg-background text-text-primary rounded-lg focus:ring-1 focus:ring-primary/50">
                                    <Filter className="h-4 w-4 mr-2 text-text-secondary" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-surface border-border rounded-lg shadow-md">
                                    <SelectItem value="all" className="text-text-primary focus:bg-surface-1 cursor-pointer">
                                        All Types
                                    </SelectItem>
                                    <SelectItem value="scheduled" className="text-text-primary focus:bg-surface-1 cursor-pointer">
                                        Scheduled Only
                                    </SelectItem>
                                    <SelectItem value="instant" className="text-text-primary focus:bg-surface-1 cursor-pointer">
                                        Instant Join
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                                <SelectTrigger className="w-full sm:w-[160px] h-10 border-border bg-background text-text-primary rounded-lg focus:ring-1 focus:ring-primary/50">
                                    <SortAsc className="h-4 w-4 mr-2 text-text-secondary" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-surface border-border rounded-lg shadow-md">
                                    <SelectItem value="title" className="text-text-primary focus:bg-surface-1 cursor-pointer">
                                        Sort by Title
                                    </SelectItem>
                                    <SelectItem value="time" className="text-text-primary focus:bg-surface-1 cursor-pointer">
                                        Sort by Time
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Meeting Cards */}
                {filteredAndSortedMeetings.length > 0 ? (
                    <div className="space-y-6 pb-20">
                        {filteredAndSortedMeetings.map((meeting, index) => (
                            <BookingCard
                                key={index}
                                {...meeting}
                                setBookings={setBookings}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState hasSearch={searchQuery.length > 0 || filterType !== "all"} onClearSearch={clearSearch} />
                )}

            </div>
        </div>
    )
}

export default Bookings;