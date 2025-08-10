import { ArrowLeft, Edit, LogOut, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useAvatarStore } from "@/store/avatarStore";
import { avatarList } from "@/lib/constants";
import { useUserStore } from "@/store/userStore";

const Profile = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { activeAvatarIndex } = useAvatarStore();
      const avatarSrc = avatarList[activeAvatarIndex];

    const handleLogout = async () => {
        await logout();
    }

    const handleUpdateProfile = async () => {
        navigate("/dashboard/profile-update");
    }
    return (
        <div className="min-h-full pt-10 px-2 sm:p-4 md:px-10">
            <div className="flex items-center justify-between p-4">
                <div className="flex gap-6 items-center px-3">
                    <button className="h-8 w-8 p-2 bg-cardbg rounded flex justify-center items-center cursor-pointer hover:bg-cardbg/50"
                    onClick={() => history.back()}>
                        <ArrowLeft className="h-4 w-4 text-text-primary" />
                    </button>
                    <div>
                        <h1 className="text-text-primary text-2xl sm:text-3xl font-bold tracking-tighter">My Profile</h1>
                        <p className="text-text-secondary text-sm sm:text-lg tracking-tighter">HeyMint – Simple. Secure. Smarter meetings.</p>
                    </div>
                </div>
                <Button size={"sm"} onClick={handleLogout}>
                    <LogOut />
                    <span className="hidden md:block">Logout</span>
                </Button>
            </div>
            <hr className="my-4 border-t border-surface-2" />
            <div className="bg-accent/30 backdrop-blur-md rounded-xl shadow-lg p-8 py-6 flex flex-col sm:flex-row justify-between gap-y-2">
                <div className="flex gap-4 items-center justify-center">
                    <Zap className="fill-accent text-accent" />
                    <p className="text-text-primary font-bold text-lg sm:text-xl">Unlock More With PRO</p>
                </div>
                <Button>
                    <Zap className="text-surface fill-surface" />
                    <span className="font-bold">Upgrade to PRO</span>
                </Button>
            </div>
            <div className="bg-cardbg rounded-xl mt-5 p-5 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 border-surface-2 border-2">
                <div className="flex gap-3 items-center w-full">
                    <Avatar className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] bg-surface-2">
                        <AvatarImage src={avatarSrc} />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 truncate max-w-full">
                        <div className="text-text-primary text-lg sm:text-2xl md:text-3xl font-medium truncate">
                            {user?.name || "Unknown"}
                        </div>
                        <span className="text-text-primary text-lg font-light truncate">
                            {user?.email || "Unknown@gmail.com"}
                        </span>
                    </div>
                </div>
                <Button className="font-bold w-full sm:w-auto"
                    onClick={handleUpdateProfile}
                >
                    <Edit className="mr-2" />
                    <span>Edit Profile</span>
                </Button>
            </div>
        </div>
    )
}

export default Profile;