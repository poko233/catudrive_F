// components/MobileBrandHeader.tsx

import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import iconImg from "../assets/images/icon.png";
import { useTheme } from "../theme/useTheme";
import { useAuth } from "@/store/authStore";
import { useArqueoStore } from "@/screens/admin/arqueo/store/arqueoStore";
import { empresaService } from "@/screens/admin/empresa/services/empresaService";

/*
|--------------------------------------------------------------------------
| HEADER MÓVIL DE MARCA (estilo mockup Fleet Logic)
|--------------------------------------------------------------------------
|
| Izquierda libre. Centro: marca + nombre de empresa (del
| backend si hay, genérico si no). Derecha: cápsula con
| estado de caja + emblema circular con degradado dorado
| del theme + onda inferior. Solo móvil (AppLayout).
|
*/

export const MobileBrandHeader: React.FC = () => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { user } = useAuth();
  const router = useRouter();

  const esClaro = !theme.dark;

  const abierto = useArqueoStore((s) => s.abierto);
  const syncing = useArqueoStore((s) => s.syncing);
  const fetchAbierto = useArqueoStore((s) => s.fetchAbierto);

  const [empresaNombre, setEmpresaNombre] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      void fetchAbierto();
    }
  }, [user, fetchAbierto]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const empresa = await empresaService.getMiEmpresa();
        if (alive) setEmpresaNombre(empresa.empresa || null);
      } catch {
        if (alive) setEmpresaNombre(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const tieneArqueo = abierto !== null;
  const dotColor = tieneArqueo ? "#22c55e" : "#ef4444";

  const primerNombre =
    user?.nombres?.trim().split(/\s+/)[0] || user?.usuario || "Usuario";

  /*
  |--------------------------------------------------------------------------
  | DORADO ADAPTATIVO (contraste en tema claro)
  |--------------------------------------------------------------------------
  |
  | Oscuro: amarillo brillante. Claro: mostaza oscuro para
  | que el texto sea legible sobre fondo blanco.
  |
  */

  const gold = esClaro ? "#B45309" : "#FDE047";
  const goldSoft = esClaro
    ? "rgba(180, 83, 9, 0.35)"
    : "rgba(253, 224, 71, 0.4)";

  return (
    <Pressable
      onPress={() => router.replace("/perfil" as any)}
      accessibilityRole="button"
      accessibilityLabel="Ir a mi perfil"
      style={[styles.root, { backgroundColor: c.background }]}
    >
      <LinearGradient
        colors={[c.card, c.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Svg style={styles.wave} viewBox="0 0 500 80" preserveAspectRatio="none">
        <Path
          d="M0,32 C120,68 220,12 360,54 C440,78 480,25 500,32 L500,80 L0,80 Z"
          fill={c.background}
          opacity={0.4}
        />
      </Svg>

      <View style={styles.bar} pointerEvents="none">
        {/* Izquierda libre a propósito */}
        <View style={styles.center}>
          <Text style={[styles.brand, { color: gold }]} numberOfLines={1}>
            CATUDRIVE
          </Text>

          <Text style={[styles.modulo, { color: c.text }]} numberOfLines={1}>
            {empresaNombre ?? "Terminal"}
          </Text>
        </View>

        <View style={styles.right}>
          {/* LUZ DIFUMINADA (solo tema oscuro: en claro mancha) */}
          {!esClaro ? (
            <Svg style={styles.auraGlow} pointerEvents="none">
              <Defs>
                <RadialGradient
                  id="goldGlow"
                  cx="50%"
                  cy="50%"
                  rx="50%"
                  ry="50%"
                >
                  <Stop offset="0%" stopColor={gold} stopOpacity={0.25} />
                  <Stop offset="50%" stopColor={gold} stopOpacity={0.08} />
                  <Stop offset="100%" stopColor={gold} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="url(#goldGlow)"
              />
            </Svg>
          ) : null}

          {/* CÁPSULA PRINCIPAL */}
          <View
            style={[
              styles.capsule,
              { backgroundColor: c.card, borderColor: gold },
            ]}
          >
            <View style={styles.status}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: dotColor,
                    opacity: syncing ? 0.5 : 1,
                  },
                ]}
              />

              <Text
                style={[styles.statusText, { color: gold }]}
                numberOfLines={1}
              >
                {primerNombre}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: goldSoft }]} />

            <View style={[styles.emblemRing, { borderColor: gold }]}>
              <Image
                source={iconImg}
                style={styles.emblemImg}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    position: "relative",
    overflow: "hidden",
  },

  wave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    width: "100%",
  },

  bar: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
    minHeight: 68,
  },

  center: {
    flex: 1,
    alignItems: "center",
    gap: 1,
    paddingLeft: 12,
    paddingRight: 148,
  },

  brand: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    textTransform: "uppercase",
  },

  modulo: {
    fontSize: 14,
    fontWeight: "700",
  },

  right: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  auraGlow: {
    position: "absolute",
    top: -15,
    bottom: -15,
    left: -25,
    right: -25,
  },

  capsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    zIndex: 1,
  },

  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  divider: {
    width: 1,
    height: 18,
    opacity: 0.5,
  },

  emblemRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(128,128,128,0.1)",
  },

  emblemImg: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
});

export default MobileBrandHeader;
