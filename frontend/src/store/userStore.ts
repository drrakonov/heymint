import { create } from "zustand";

type User = {
    id: string,
    name: string,
    email: string,
    provider: string
} | null;

interface UserState {
    user: User,
    setUser: (user: User) => void,
    clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null }),
}));


