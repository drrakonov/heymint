import { Outlet } from "react-router-dom";
import AuthIllustration from "../assets/authBg.svg";
import appLogo from "../assets/heyMintLogo.png"

export default function AuthLayout() {
    return (
        <div className="h-screen grid grid-cols-1 md:grid-cols-5 bg-background text-white overflow-hidden">

            {/* Left Side - Form */}
            <div className="flex justify-center items-center md:col-span-2 p-8">
                <div className="w-full max-w-md flex flex-col items-center">
                    <img src={appLogo}
                        alt="app logo"
                        className="w-40"
                    />
                    <Outlet />
                </div>
            </div>

            {/* Right Side - Full Background Image with Text Overlap */}
            <div className="hidden md:relative md:flex md:col-span-3 bg-gray-900">

                {/* Background Image */}
                <img
                    src={AuthIllustration}
                    alt="HeyMint Auth"
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                />

                {/* Overlay Content */}
                <div className="relative z-10 flex flex-col justify-center items-center text-center w-full px-10">
                    <h1 className="text-4xl font-bold mb-4">Welcome to HeyMint</h1>
                    <p className="text-lg text-white/80 max-w-lg">
                        Unlock your potential with seamless live meetings.
                    </p>
                </div>
            </div>

        </div>
    );
}
