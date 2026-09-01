import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { themes } from "../theme/themes";

interface ThemeState {
  themeName: string;
  setThemeName: (name: string) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeName: "light", // Siempre un valor válido
      setThemeName: (name) => set({ themeName: name }),
      toggleTheme: () => {
        const current = get().themeName;
        const themeKeys = Object.keys(themes);
        const currentIndex = themeKeys.indexOf(current);
        const nextIndex = (currentIndex + 1) % themeKeys.length;
        set({ themeName: themeKeys[nextIndex] });
      },
    }),
    {
      name: "app-theme",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state && !(state.themeName in themes)) {
          state.themeName = "light";
        }
      },
    }
  )
);