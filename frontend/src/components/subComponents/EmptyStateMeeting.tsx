import { Calendar, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

interface EmptyStateProps {
  hasSearch: boolean
  onClearSearch?: () => void
}

export function EmptyState({ hasSearch, onClearSearch }: EmptyStateProps) {
  const navigate = useNavigate();
  const handleAddMeetingbutton = () => {
    navigate("/dashboard/addmeeting");
  }

  // Responsive card container
  const containerClass =
    "text-center py-8 sm:py-12 flex flex-col items-center px-4";

  // Responsive circle + icon
  const circleClass =
    "mx-auto h-20 w-20 sm:h-24 sm:w-24 bg-surface-1 rounded-full flex items-center justify-center mb-4";
  const iconClass = "h-10 w-10 sm:h-12 sm:w-12";

  // Responsive heading & text
  const headingClass = "text-base sm:text-lg font-semibold text-text-primary mb-2";
  const paraClass =
    "text-text-secondary mb-4 sm:mb-6 max-w-xs sm:max-w-sm mx-auto text-sm sm:text-base";
  // Responsive button
  const buttonClass =
    "w-full max-w-xs sm:w-auto sm:max-w-none";

  if (hasSearch) {
    return (
      <div className={containerClass}>
        <div className={circleClass}>
          <Calendar className={iconClass + " text-text-secondary"} />
        </div>
        <h3 className={headingClass}>No meetings found</h3>
        <p className={paraClass}>
          We couldn't find any meetings matching your search. Try adjusting your search terms.
        </p>
        <Button
          variant="outline"
          onClick={onClearSearch}
          className={
            buttonClass +
            " border-custom text-text-secondary hover:bg-surface-1 hover:text-text-primary bg-transparent"
          }
        >
          Clear Search
        </Button>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className={circleClass}>
        <Calendar className={iconClass + " text-primary"} />
      </div>
      <h3 className={headingClass}>No upcoming meetings</h3>
      <p className={paraClass}>
        You don't have any meetings scheduled. Create a new meeting or join an instant session.
      </p>
      <Button
        className={
          "bg-primary hover:bg-accent-hover text-text-primary font-semibold " +
          buttonClass
        }
        onClick={handleAddMeetingbutton}
      >
        <Plus className="h-4 w-4 mr-1" />
        Schedule Meeting
      </Button>
    </div>
  );
}
