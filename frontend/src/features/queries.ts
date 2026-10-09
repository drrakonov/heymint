import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { backend } from "@/lib/api";
export function useMeetings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["meetings", user?.id],
    queryFn: () => {
      if (!user) throw new Error("Please sign in.");
      return backend.meetings(user.id);
    },
    enabled: !!user,
    retry: 1,
  });
}
export function useBookings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: () => {
      if (!user) throw new Error("Please sign in.");
      return backend.bookings(user.id);
    },
    enabled: !!user,
    retry: 1,
  });
}
