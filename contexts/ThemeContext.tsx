// contexts/ThemeContext.tsx

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

import Animated, {
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

import { useThemeStore } from "../store/themeStore";
import { themes } from "../theme/themes";
import {
  AppTheme,
  ThemeName,
} from "../theme/types";

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (name: ThemeName) => void;
  toggleTheme: () => void;
}

export const ThemeContext =
  createContext<ThemeContextType>({
    theme: themes.light,
    setTheme: () => {},
    toggleTheme: () => {},
  });

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const themeName = useThemeStore(
    (state) => state.themeName,
  );

  const setThemeName = useThemeStore(
    (state) => state.setThemeName,
  );

  const toggleTheme = useThemeStore(
    (state) => state.toggleTheme,
  );

  const theme = useMemo(
    () => themes[themeName],
    [themeName],
  );

  const setTheme = useCallback(
    (name: ThemeName) => {
      setThemeName(name);
    },
    [setThemeName],
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [
      theme,
      setTheme,
      toggleTheme,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      <Animated.View
        key={themeName}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={{
          flex: 1,
          backgroundColor:
            theme.colors.background,
        }}
      >
        {children}
      </Animated.View>
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  return useContext(ThemeContext);
}