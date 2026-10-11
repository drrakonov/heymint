import { create } from "zustand";

type AvatarStore = {
  activeAvatarIndex: number;
  setActiveAvatar: (index: number) => void;
};

export const useAvatarStore = create<AvatarStore>((set) => ({
  activeAvatarIndex: 0, // default avatar index
  setActiveAvatar: (index) => set({ activeAvatarIndex: index }),
}));
