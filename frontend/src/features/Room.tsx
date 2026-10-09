import { lazy, Suspense, useRef } from "react";
import type { Meeting } from "@/lib/api";
import { useMeetings } from "./queries";
import { AccessGate } from "./AccessGate";
import { ErrorState, Pending } from "@/components/heymint/common";
const VideoRoom = lazy(() => import("./RoomVideo"));
export default function Room({ code }: { code: string }) {
  const meetings = useMeetings();
  const enteredMeeting = useRef<Meeting | null>(null);
  return (
    <AccessGate code={code} key={code}>
      {meetings.isPending ? (
        <div className="session-loading">
          <Pending>Loading meeting details</Pending>
        </div>
      ) : meetings.error && !enteredMeeting.current ? (
        <div className="permission-gate">
          <ErrorState
            error={meetings.error}
            retry={() => void meetings.refetch()}
          />
        </div>
      ) : (
        (() => {
          const meeting =
            enteredMeeting.current ||
            meetings.data?.meetings.find((m) => m.meetingCode === code);
          if (!meeting)
            return (
              <div className="permission-gate">
                <ErrorState
                  error={new Error("This meeting is no longer available.")}
                  retry={() => void meetings.refetch()}
                />
              </div>
            );
          if (meeting.isComplete)
            return (
              <div className="permission-gate">
                <ErrorState
                  error={
                    new Error(
                      "This meeting has been completed. Open its insights from your meetings list.",
                    )
                  }
                />
              </div>
            );
          enteredMeeting.current = meeting;
          return (
            <Suspense
              fallback={
                <div className="session-loading">
                  <Pending>Loading video controls</Pending>
                </div>
              }
            >
              <VideoRoom code={code} meeting={meeting} />
            </Suspense>
          );
        })()
      )}
    </AccessGate>
  );
}
