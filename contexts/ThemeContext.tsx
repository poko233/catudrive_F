// contexts/ThemeContext.tsx

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { StyleSheet, useWindowDimensions } from "react-native";

import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useThemeStore } from "../store/themeStore";
import { themes } from "../theme/themes";
import { AppTheme, ThemeName } from "../theme/types";

export interface ThemeTransitionOrigin {
  x: number;
  y: number;
}

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (name: ThemeName, origin?: ThemeTransitionOrigin) => void;
  toggleTheme: (origin?: ThemeTransitionOrigin) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: themes.light,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const themeName = useThemeStore((state) => state.themeName);

  const setThemeName = useThemeStore((state) => state.setThemeName);

  const { width, height } = useWindowDimensions();

  /*
  |--------------------------------------------------------------------------
  | WIPE CIRCULAR ESTILO LIGHTSWIND (SIN LIBRERÍA)
  |--------------------------------------------------------------------------
  |
  | Al cambiar de tema un círculo del color de fondo nuevo
  | se expande desde el origen hasta cubrir la pantalla;
  | recién ahí se conmuta el tema (repintado debajo del
  | círculo) y el círculo se desvanece revelando la UI nueva.
  |
  */

  const [wipe, setWipe] = useState<{
    color: string;
    x: number;
    y: number;
  } | null>(null);

  const radio = useSharedValue(0);
  const desvanecer = useSharedValue(1);
  const enTransicion = useRef(false);

  const radioMaximo = Math.hypot(width, height);

  const limpiarWipe = useCallback(() => {
    enTransicion.current = false;
    setWipe(null);
  }, []);

  const aplicarTema = useCallback(
    (name: ThemeName) => {
      setThemeName(name);
      desvanecer.value = withTiming(0, { duration: 1500 }, (terminado) => {
        if (terminado) runOnJS(limpiarWipe)();
      });
    },
    [desvanecer, limpiarWipe, setThemeName],
  );

  const setThemeConWipe = useCallback(
    (name: ThemeName, origin?: ThemeTransitionOrigin) => {
      if (enTransicion.current) return;
      if (name === themeName) return;

      const destino = themes[name];
      if (!destino) return;

      enTransicion.current = true;
      setWipe({
        color: destino.colors.background,
        x: origin?.x ?? width / 2,
        y: origin?.y ?? height / 2,
      });

      radio.value = 0;
      desvanecer.value = 1;
      radio.value = withTiming(
        radioMaximo,
        { duration: 1500, easing: Easing.out(Easing.cubic) },
        (terminado) => {
          if (terminado) runOnJS(aplicarTema)(name);
        },
      );
    },
    [themeName, width, height, radioMaximo, radio, desvanecer, aplicarTema],
  );

  const toggleTheme = useCallback(
    (origin?: ThemeTransitionOrigin) => {
      // Replica el ciclo del store manteniendo el wipe visual.
      const claves = Object.keys(themes);
      const actual = claves.indexOf(themeName);
      const siguiente = claves[(actual + 1) % claves.length] ?? claves[0];
      setThemeConWipe(siguiente, origin);
    },
    [themeName, setThemeConWipe],
  );

  const setTheme = useCallback(
    (name: ThemeName, origin?: ThemeTransitionOrigin) => {
      setThemeConWipe(name, origin);
    },
    [setThemeConWipe],
  );

  const estiloCirculo = useAnimatedStyle(() => {
    const r = radio.value;
    return {
      position: "absolute",
      left: (wipe?.x ?? 0) - r,
      top: (wipe?.y ?? 0) - r,
      width: r * 2,
      height: r * 2,
      borderRadius: r,
      backgroundColor: wipe?.color ?? "transparent",
    };
  });

  const theme = useMemo(() => themes[themeName], [themeName]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <Animated.View
        key={themeName}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
        }}
      >
        {children}
      </Animated.View>

      {wipe ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.wipeContenedor, { opacity: desvanecer }]}
        >
          <Animated.View style={estiloCirculo} />
        </Animated.View>
      ) : null}
    </ThemeContext.Provider>
  );
};

const styles = StyleSheet.create({
  wipeContenedor: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 50,
  },
});

export function useTheme() {
  return useContext(ThemeContext);
}
