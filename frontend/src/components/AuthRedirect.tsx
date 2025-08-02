// components/AuthRedirect.tsx
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { accessToken } = useAuth();

  if (accessToken) return <Navigate to="/dashboard" />;

  return <>{children}</>;
};

export default AuthRedirect;
