import { useAvatarStore } from "@/store/avatarStore";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useNavigate } from "react-router-dom";
import { avatarList } from "@/lib/constants"


const ProfileLogo = () => {
  const navigate = useNavigate();
  const { activeAvatarIndex } = useAvatarStore();
  const avatarSrc = avatarList[activeAvatarIndex];

  return (
    <button
      className="focus:outline-none rounded-full transition-shadow hover:shadow-md p-1"
      onClick={() => navigate("/dashboard/profile")}
      aria-label="View Profile"
      type="button"
    >
      <Avatar className="bg-cardbg">
        <AvatarImage src={avatarSrc} />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    </button>
  );
};

export default ProfileLogo;
