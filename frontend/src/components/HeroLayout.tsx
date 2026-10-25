import { Link, Outlet, useNavigate, useLocation } from "react-router-dom"
import appLogo from "../assets/logo/heyMintLogo.png"
import { GreenButton } from "./subComponents/Greenbutton";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";




const HeroLayout = () => {
    const setAccessToken = useAuthStore((state) => state.setAccessToken)
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const accessToken = params.get("access");
        //console.log("accessToken", accessToken);
        if (accessToken) {
            setAccessToken(accessToken);
            localStorage.setItem("accessToken", accessToken);
            // Remove ?access=... from URL
            const cleanedUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, cleanedUrl);
            navigate("/dashboard");
        }
    }, [location, setAccessToken, navigate]);

    return (
        <div className="min-h-screen flex flex-col bg-surface-bl">
            <nav className="sticky top-0 z-50 border-b border-white/[0.07] bg-surface-bl/80 px-4 py-3 text-text-primary backdrop-blur-xl sm:px-8">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center">
                        <Link to="/" aria-label="HeyMint home">
                            <img src={appLogo}
                                alt="HeyMint"
                                className="w-24 sm:w-28"
                            />
                        </Link>
                    </div>
                    <div className="hidden items-center gap-8 text-sm text-text-secondary md:flex">
                        <a href="#feature" className="transition-colors hover:text-text-primary">Features</a>
                        <a href="#howToUse" className="transition-colors hover:text-text-primary">How it works</a>
                    </div>
                    <div className="flex items-center">
                        <GreenButton
                            variant="ghost"
                            label="Log In"
                            to="/auth/login"
                            className="font-semibold"
                        />
                    </div>
                </div>
            </nav>
            <main className="flex-1 bg-surface-bl">
                <Outlet />
            </main>
            <footer className="border-t border-white/[0.07] bg-surface-bl text-text-secondary">
                <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-sm">
                        <img src={appLogo}
                            alt="HeyMint"
                            className="w-24"
                        />
                        <p className="mt-3 text-sm leading-relaxed">Smart meetings, protected access, and clear insights.</p>
                    </div>
                    <div className="flex gap-6 text-sm">
                        <a href="#feature" className="transition-colors hover:text-text-primary">Features</a>
                        <a href="#howToUse" className="transition-colors hover:text-text-primary">How it works</a>
                    </div>
                </div>

                <div className="hidden overflow-hidden border-t border-white/[0.05] sm:block">
                    <div className="flex select-none items-end justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 190" width="100%" height="190" role="img" aria-labelledby="title">
                            <title id="title">Heymint wordmark</title>

                            <text x="50%" y="103%"
                                textAnchor="middle"
                                dominantBaseline="bottom"
                                fontFamily="Inter, system-ui, sans-serif"
                                fontWeight="900"
                                fontSize="185"
                                letterSpacing="18"
                                fill="currentColor"
                                opacity="0.08">
                                HEYMINT
                            </text>
                        </svg>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default HeroLayout;
