import { create } from 'zustand';

export const useProfileStore = create<{ profile: any; setProfile: (p: any) => void; clear: () => void }>(
  (set) => ({
    profile: null,
    setProfile: (p) => set({ profile: p }),
    clear: () => set({ profile: null }),
  })
);
