import { useAuth } from "@/context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import Loader from "../subComponents/Loader";
import ConnectionError from "../subComponents/ConnectionError";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, user, isLoading, error, retry, logout } = useAuth();
  const location = useLocation();
  if (!accessToken) return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  if (isLoading || (!user && !error)) return <Loader />;
  if (error) return <ConnectionError message={error} onRetry={retry} onExit={() => void logout()} />;
  return <>{children}</>;
};
export default ProtectedRoute;
