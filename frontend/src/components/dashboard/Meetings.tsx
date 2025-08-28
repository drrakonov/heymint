import { Calendar, Clock, Filter, Search, SortAsc, Users, Video } from "lucide-react";
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


interface MeetingCardProps {
    title: string
    hostName: string
    description: string
    type: "Free" | "Paid"
    price?: number
    meetingTime?: string
    isInstant?: boolean
    participantCount?: number
}



export function MeetingCard({
    title,
    hostName,
    description,
    type,
    price,
    meetingTime,
    isInstant = false,
    participantCount,
}: MeetingCardProps) {
    return (
        <Card className="w-full max-w-5xl bg-cardbg border-surface-2 shadow-md hover:shadow-lg transition-shadow duration-200
         sm:p-6 p-3 rounded-xl">
            <CardHeader className="pb-3">
                {/* On small screens: column, on md+: row */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg leading-tight text-[#F4F4F5] truncate">
                            {title}
                        </h3>
                        <p className="text-sm mt-1 flex items-center gap-1 text-[#A1A1AA]">
                            <Users className="h-3 w-3 text-[#A1A1AA]" />
                            {hostName}
                        </p>
                        {/* Always show description under host on small, only show two lines */}
                        <p className="text-sm mt-2 text-[#8C8D98] line-clamp-2">{description}</p>
                    </div>

                    {/* On md+: badge/price on the right; on mobile, put below title/host */}
                    <div className="flex flex-row md:flex-col gap-1 items-center mt-2 md:mt-0">
                        <Badge
                            variant={type === "Free" ? "secondary" : "default"}
                            className={
                                type === "Paid"
                                    ? "bg-accent-hover text-black border-none"
                                    : "bg-[#33353B] border border-[#474B52] text-[#F4F4F5]"
                            }
                        >
                            {type}
                        </Badge>
                        {type === "Paid" && price && (
                            <Badge variant="outline" className="text-xs font-medium text-[#F4F4F5] border-[#6EE7B7] bg-transparent ml-2 md:ml-0">
                                ₹{price}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <hr className="my-4 border-t border-surface-2" />
            <CardContent className="py-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-[#6EE7B7]">
                    {isInstant ? (
                        <>
                            <span className="flex items-center gap-1">
                                <Video className="h-4 w-4 text-accent" />
                                <span className="font-medium text-accent">Quick Join</span>
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-[#A1A1AA]" />
                                <span className="text-[#A1A1AA]">{meetingTime}</span>
                            </span>
                        </>
                    )}
                </div>
                {participantCount && (
                    <div className="flex items-center gap-2 text-xs text-[#8C8D98] mt-2">
                        <Clock className="h-3 w-3" />
                        <span>{participantCount} participants expected</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-3">
                <Button
                    className={`ml-auto w-full sm:w-auto mt-2 sm:mt-0
                    ${isInstant ? "bg-accent-hover hover:bg-accent/60 text-black font-bold"
                            : "bg-accent-hover hover:bg-accent/60 text-black font-bold border border-[#393B40]"}`}
                    size="sm"
                    variant={isInstant ? "default" : "outline"}
                >
                    {isInstant ? "Join Meeting" : "Buy Now"}
                </Button>
            </CardFooter>
        </Card>
    )
}

// 1. Define a Meeting type
type Meeting = {
    title: string
    hostName: string
    description: string
    type: "Free" | "Paid"
    price?: number
    isProtected: boolean
    meetingTime?: string
    isInstant?: boolean
}

// 2. Use the Meeting type for the meetings array
let meetings: Meeting[] = []


const Meetings = () => {
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [filterType, setFilterType] = useState<"all" | "free" | "paid" | "instant">("all")
    const [sortBy, setSortBy] = useState<"title" | "time" | "participants">("title")
    const [isLoading, setIsLoading] = useState(false);

    const filteredAndSortedMeetings = useMemo<Meeting[]>(() => {
        const filtered = meetings.filter((meeting) => {
            const matchesSearch =
                meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                meeting.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                meeting.description.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesFilter =
                filterType === "all" ||
                (filterType === "free" && meeting.type === "Free") ||
                (filterType === "paid" && meeting.type === "Paid") ||
                (filterType === "instant" && meeting.isInstant)

            return matchesSearch && matchesFilter
        })

        // Sort meetings
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
    }, [searchQuery, filterType, sortBy, meetings])

    const stats = useMemo(() => ({
        totalMeetings: meetings.length,
        instantMeetings: meetings.filter((m) => m.isInstant).length,
        freeMeetings: meetings.filter((m) => m.type === "Free").length,
        paidMeetings: meetings.filter((m) => m.type === "Paid").length,
    }), [meetings])
    const clearSearch = () => {
        setSearchQuery("")
        setFilterType("all")
    }

    useEffect(() => {
        const getAllMeetings = async () => {
            try {
                setIsLoading(true);
                const res = await api.get("/api/meeting/get-meetings");

                if (res.data.success) {
                   meetings = res.data.meetings;
                }
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to get the meetings", err);
            }
        }

        getAllMeetings();
    }, [])

    if(isLoading) return <Loader />

    return (
        <div className="pt-6 min-h-screen pl-5 pr-5 md:pl-10 md:pr-10">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl text-text-primary font-bold text-foreground mb-2">Upcoming Meetings</h1>
                <p className="text-muted-foreground text-text-secondary mb-8">Join your scheduled meetings or start an instant session</p>
                <MeetingStats {...stats} />

                <div className="bg-cardbg rounded-xl border-surface-2 border-2 p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary h-5 w-5" />
                            <Input
                                placeholder="Search meetings by title, host, description, or category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 text-base bg-surface border-accent text-text-primary placeholder:text-text-secondary focus:border-accent"
                            />
                        </div>

                        <div className="flex gap-3 flex-col sm:flex-row justify-center">
                            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                                <SelectTrigger className="w-40 min-h-10 border-accent bg-surface text-text-primary">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-surface border-custom">
                                    <SelectItem value="all" className="text-text-primary hover:bg-surface-1">
                                        All Types
                                    </SelectItem>
                                    <SelectItem value="free" className="text-text-primary hover:bg-surface-1">
                                        Free Only
                                    </SelectItem>
                                    <SelectItem value="paid" className="text-text-primary hover:bg-surface-1">
                                        Paid Only
                                    </SelectItem>
                                    <SelectItem value="instant" className="text-text-primary hover:bg-surface-1">
                                        Instant Join
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                                <SelectTrigger className="w-40 min-h-10 border-accent bg-surface text-text-primary">
                                    <SortAsc className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-surface border-custom">
                                    <SelectItem value="title" className="text-text-primary hover:bg-surface-1">
                                        Sort by Title
                                    </SelectItem>
                                    <SelectItem value="time" className="text-text-primary hover:bg-surface-1">
                                        Sort by Time
                                    </SelectItem>
                                    <SelectItem value="participants" className="text-text-primary hover:bg-surface-1">
                                        Sort by Participants
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
                            <MeetingCard key={index} {...meeting} />
                        ))}
                    </div>
                ) : (
                    <EmptyState hasSearch={searchQuery.length > 0 || filterType !== "all"} onClearSearch={clearSearch} />
                )}


            </div>
        </div>
    )
}

export default Meetings;
