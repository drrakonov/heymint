import { ClipboardList } from "lucide-react"
import toast from "react-hot-toast";
import { getMeetingJoinLink } from "@/lib/meetingLinks";

const CopyClipboardBtn = ({ meetingCode }: { meetingCode: string }) => {

    const handleCopyToClipBoard = async () => {
        try {
            await navigator.clipboard.writeText(getMeetingJoinLink(meetingCode));
            toast.success("Joining link copied")
        } catch {
            console.log("Failed to copy code in clipboard");
        }
    }

    return (
        <button onClick={handleCopyToClipBoard} className="glass-control flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-text-secondary hover:text-primary" aria-label="Copy joining link" title="Copy joining link">
            <ClipboardList size={15} />
        </button>
    )
}

export default CopyClipboardBtn;
