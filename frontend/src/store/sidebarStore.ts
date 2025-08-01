// src/store/sidebarStore.ts
import { create } from "zustand";

type SidebarState = {
  expanded: boolean;
  setExpanded: (value: boolean) => void;
  toggleExpanded: () => void;
};

export const useSidebarStore = create<SidebarState>((set) => ({
  expanded: true,
  setExpanded: (value) => set({ expanded: value }),
  toggleExpanded: () => set((state) => ({ expanded: !state.expanded })),
}));
