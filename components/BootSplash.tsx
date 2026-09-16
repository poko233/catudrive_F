// components/BootSplash.tsx
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/useTheme";
import logoTexto from "../assets/images/icon.png";

/*
|--------------------------------------------------------------------------
| URL DEL LOGO LARGO (MISMA QUE USA EL SIDEBAR)
|--------------------------------------------------------------------------
*/

const RAW_API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

const PUBLIC_BACKEND_URL = RAW_API_URL.replace(/\/api$/i, "");

const LOGO_LARGO_URL = PUBLIC_BACKEND_URL
  ? `${PUBLIC_BACKEND_URL}/empresa/empresa_1_logo_largo.webp`
  : null;

/*
|--------------------------------------------------------------------------
| PANTALLA DE ARRANQUE
|--------------------------------------------------------------------------
|
| Se muestra mientras AuthInitializer espera /api/me y /api/sidebar
| en lugar del anterior null (pantalla sin nada).
|
| El logo se revela de izquierda a derecha con una cortina del
| color de fondo + spinner de carga debajo.
|
*/

export const BootSplash: React.FC = () => {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();

  const [logoFailed, setLogoFailed] = useState(false);
  const [anchoLogo, setAnchoLogo] = useState(0);

  const revelado = useSharedValue(0);
  const pulso = useSharedValue(1);

  useEffect(() => {
    revelado.value = withTiming(1, {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });
    pulso.value = withRepeat(
      withTiming(0.5, {
        duration: 800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [revelado, pulso]);

  /*
  |--------------------------------------------------------------------------
  | CORTINA QUE REVELA EL LOGO DE IZQUIERDA A DERECHA
  |--------------------------------------------------------------------------
  */

  const estiloCortina = useAnimatedStyle(() => ({
    transform: [{ translateX: revelado.value * Math.max(anchoLogo, 1) }],
    opacity: 1 - revelado.value * 0.85,
  }));

  const estiloPulso = useAnimatedStyle(() => ({
    opacity: pulso.value,
  }));

  return (
    <View
      style={[
        styles.contenedor,
        {
          backgroundColor: c.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View
        style={styles.logoMarco}
        onLayout={(evento) =>
          setAnchoLogo(evento.nativeEvent.layout.width)
        }
      >
        <Image
          source={logoFailed || !LOGO_LARGO_URL ? logoTexto : { uri: LOGO_LARGO_URL }}
          style={styles.logo}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={300}
          onError={() => setLogoFailed(true)}
        />

        {anchoLogo > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.cortina,
              { backgroundColor: c.background },
              estiloCortina,
            ]}
          />
        ) : null}
      </View>

      <Animated.View style={[styles.carga, estiloPulso]}>
        <ActivityIndicator size="small" color={c.primary} />
        <Text style={[styles.cargaTexto, { color: c.textSecondary }]}>
          Cargando…
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  logoMarco: {
    position: "relative",
    width: 232,
    height: 72,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  cortina: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "100%",
  },
  carga: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cargaTexto: {
    fontSize: 13,
    fontWeight: "600",
  },
});
