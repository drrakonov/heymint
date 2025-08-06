import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { useAvatarStore } from "@/store/avatarStore";
import { avatarList } from "@/lib/constants"

const Profileupdate = () => {
    const { activeAvatarIndex, setActiveAvatar } = useAvatarStore();

    return (
        <div className="min-h-screen flex flex-col items-center pt-10 md:pt-35 gap-6 p-10">
            {/* Back button */}
            <button
                className="h-10 w-10 md:h-15 md:w-15 p-2 bg-cardbg rounded-4xl flex justify-center items-center cursor-pointer hover:bg-cardbg/50"
                onClick={() => history.back()}
            >
                <ArrowLeft className="h-4 w-4 text-text-primary" />
            </button>

            {/* Heading */}
            <div className="flex flex-col items-center justify-center gap-2">
                <strong className="text-text-primary text-2xl md:text-4xl tracking-tight text-center">
                    Update Your Profile
                </strong>
                <p className="text-text-primary text-lg text-center md:text-xl font-extralight tracking-tight">
                    Your username is your unique identifier.
                </p>
            </div>

            {/* Avatar selection */}
            <div className="flex gap-4 flex-wrap justify-center">
                {avatarList.map((avatar, index) => (
                    <div
                        key={index}
                        className={`relative cursor-pointer rounded-full p-1 transition-all duration-200 ${activeAvatarIndex === index ? "ring-2 ring-accent" : ""
                            }`}
                        onClick={() => setActiveAvatar(index)}
                    >
                        <Avatar className="w-[50px] h-[50px] md:w-[60px] md:h-[60px]">
                            <AvatarImage src={avatar} />
                            <AvatarFallback>AV</AvatarFallback>
                        </Avatar>

                        {activeAvatarIndex === index && (
                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-accent text-black text-xs px-2 py-0.5 rounded-full">
                                Active
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Username input */}
            <div className="w-full max-w-md space-y-2">
                <span className="text-text-primary text-lg block text-center">Username</span>
                <input
                    type="text"
                    className="w-full px-3 py-2 bg-cardbg focus:border-2 focus:border-accent-hover rounded-lg border-border border-2 focus:outline-none placeholder-text-secondary"
                    placeholder="your-username"
                />
                <Button className="font-medium w-full">Update Profile</Button>
            </div>
        </div>
    );
};

export default Profileupdate;
