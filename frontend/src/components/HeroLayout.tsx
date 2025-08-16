import { Link, Outlet, useNavigate } from "react-router-dom"
import appLogo from "../assets/heyMintLogo.png"
import { GreenButton } from "./subComponents/Greenbutton";
import GithubLogo from '../assets/github.svg';
import XLogo from '../assets/x.svg'
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";




const HeroLayout = () => {
    const setAccessToken = useAuthStore((state) => state.setAccessToken)
    const navigate = useNavigate();

    useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get("access");
    //console.log("accessToken", accessToken);
    if (accessToken && !localStorage.getItem("accessToken")) {
      setAccessToken(accessToken);
      const cleanedUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanedUrl);
      navigate("/dashboard");
    }
  }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="py-4 px-4 bg-surface text-text-primary border-b border-gray-200/5">
                <div className="flex mx-4 items-center justify-between">
                    <div className="flex flex-col items-center">
                        <a href="/">
                            <img src={appLogo}
                                alt="app logo"
                                className="w-25"
                            />
                        </a>
                    </div>
                    <div className="hidden md:flex space-x-8">
                        <Link to={"/"} className="hover:text-text-secondary" >Feature</Link>
                        <Link to={"/"} className="hover:text-text-secondary" >How to use</Link>
                        <Link to={"/"} className="hover:text-text-secondary" >Testimonial</Link>

                    </div>
                    <div className="hidden sm:flex space-x-4">
                        <GreenButton
                            variant="ghost"
                            label="Log In"
                            to="/auth"
                            className="font-bold"
                        />
                        <GreenButton
                            variant="primary"
                            label="Get Started"
                            to="/auth"
                            className="font-bold"
                        />
                    </div>
                </div>
            </nav>
            <main className="flex-1 bg-surface">
                <Outlet />
            </main>
            <footer className="bg-surface/95 text-gray-300 border-t border-gray-700">
                <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Branding */}
                    <div>
                        <img src={appLogo}
                            alt="app logo"
                            className="w-25"
                        />
                        <p className="mt-2 text-sm">Your platform for smart, secure meetings & bookings.</p>
                        <p className="mt-2 text-sm">Reliable meetings. Transparent earnings. Zero hassle.</p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h3 className="text-sm text-text-primary font-semibold uppercase mb-3">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/about" className="hover:underline">About Us</Link></li>
                            <li><Link to="/meetings" className="hover:underline">Privacy Policy</Link></li>
                            <li><Link to="/bookings" className="hover:underline">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Social Links */}
                    <div>
                        <h3 className="text-sm text-text-primary font-semibold uppercase mb-3">Connect</h3>
                        <div className="flex space-x-4">
                            <a href="" target="_blank" rel="noopener noreferrer">
                                <img
                                    src={GithubLogo}
                                    alt="Github logo"
                                    className="w-8 h-8"
                                />
                            </a>
                            <a href="" target="_blank" rel="noopener noreferrer">
                                <img
                                    src={XLogo}
                                    alt="Github logo"
                                    className="w-8 h-8"
                                />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="text-center py-4 border-t border-gray-200 dark:border-gray-700 text-sm">
                    © {new Date().getFullYear()} HeyMint. All rights reserved.
                </div>
            </footer>
        </div>
    )
}

export default HeroLayout;
