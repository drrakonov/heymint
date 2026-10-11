import { ClipboardList } from "lucide-react"
import toast from "react-hot-toast";

const CopyClipboardBtn = ({ meetingCode }: { meetingCode: string }) => {

    const handleCopyToClipBoard = async () => {
        try {
            await navigator.clipboard.writeText(meetingCode);
            toast.success("Code copied to clipboard!")
        } catch (err) {
            console.log("Failed to copy code in clipboard");
        }
    }

    return (
        <button className="text-text-secondary hover:text-text-secondary/60 cursor-pointer">
            <ClipboardList size={20} onClick={handleCopyToClipBoard} />
        </button>
    )
}

export default CopyClipboardBtn;