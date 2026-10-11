import { Calendar, Clock, Tag, Video } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface MeetingStatsProps {
  totalMeetings: number
  freeMeetings: number
  paidMeetings: number
  instantMeetings: number
}

export function MeetingStats({ totalMeetings, instantMeetings, freeMeetings, paidMeetings }: MeetingStatsProps) {
  const stats = [
    {
      label: "Total Meetings",
      value: totalMeetings,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Instant Available",
      value: instantMeetings,
      icon: Video,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Free Sessions",
      value: freeMeetings,
      icon: Tag,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Paid Sessions",
      value: paidMeetings,
      icon: Clock,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-surface-2 border-2 bg-cardbg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-secondary">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
