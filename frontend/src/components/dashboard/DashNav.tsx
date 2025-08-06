import appLogo from "@/assets/heyMintLogo.png"
import { LogIn, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { GreenButton } from "../subComponents/Greenbutton";
import ProfileLogo from "../subComponents/ProfileLogo";


const DashNav = () => {
    const navigate = useNavigate();

    const handleAddMeetingOpen = () => {
        navigate("addmeeting");
    };

    const handleJoinMeetingOpen = () => {
        navigate("joinmeeting")
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-16 py-2 px-4 flex justify-between items-center bg-surface text-text-primary border-b border-gray-200/5">
            <div className="flex flex-col items-center">
                <a href="/">
                    <img src={appLogo}
                        alt="app logo"
                        className="w-25"
                    />
                </a>
            </div>
            <div className="flex gap-3">
                <div className="flex gap-3">
                    <GreenButton
                    onClick={() => handleAddMeetingOpen()}
                        variant="primary"
                        label={<span className="flex text-sm items-center justify-center gap-0.5">
                            <Plus className="text-black" size={20} />
                            <span
                                className="hidden sm:block text-black font-bold/30 tracking-tighter">
                                Create Meeting
                            </span>
                        </span>}
                    />
                    <GreenButton
                        onClick={() => {handleJoinMeetingOpen()}}
                        variant="ghost"
                        label={<span className="flex text-sm items-center justify-center gap-1">
                            <LogIn size={20} />
                            <span
                                className="hidden sm:block">
                                Join Meeting
                            </span>
                        </span>} />
                </div>
                <ProfileLogo />
            </div>
        </nav>
    )
}
export default DashNav