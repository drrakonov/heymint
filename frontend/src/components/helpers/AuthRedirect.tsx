// components/AuthRedirect.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const AuthRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAccessToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const access = params.get("access");
    if (access) {
      setAccessToken(access);
      localStorage.setItem("accessToken", access);
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/auth/login", { replace: true });
    }
  }, [location, setAccessToken, navigate]);

  return null;
};

export default AuthRedirect;
