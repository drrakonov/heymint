import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken } = useAuth();

  if (!accessToken) return <Navigate to="/auth" />;

  return <>{children}</>;
};

export default ProtectedRoute;
