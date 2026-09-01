// components/ui/ProgressBar.tsx

import { useTheme } from "@/theme/useTheme";

import {
  useEffect,
  useRef,
} from "react";

import {
  Animated,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { ThemedText } from "../ThemedText";

type ProgressBarVariant =
  | "primary"
  | "success"
  | "warning"
  | "destructive";

type Props = {
  /**
   * Valor entre 0 y 100.
   */
  value: number;

  /**
   * Texto opcional mostrado arriba.
   */
  label?: string;

  /**
   * Mostrar porcentaje.
   *
   * Default: true
   */
  showValue?: boolean;

  /**
   * Alto de la barra.
   *
   * Default: 10
   */
  height?: number;

  /**
   * Variante visual.
   */
  variant?: ProgressBarVariant;

  /**
   * Animar cambios de porcentaje.
   *
   * Default: true
   */
  animated?: boolean;

  /**
   * Duración de animación.
   *
   * Default: 350 ms
   */
  duration?: number;

  /**
   * Estilo adicional del contenedor.
   */
  style?: ViewStyle;
};

function clamp(
  value: number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      value,
    ),
  );
}

export function ProgressBar({
  value,
  label,
  showValue = true,
  height = 10,
  variant = "primary",
  animated = true,
  duration = 350,
  style,
}: Props) {
  const { theme } =
    useTheme();

  const c =
    theme.colors;

  const progress =
    clamp(
      value,
    );

  const animatedValue =
    useRef(
      new Animated.Value(
        progress,
      ),
    ).current;

  useEffect(() => {
    if (!animated) {
      animatedValue.setValue(
        progress,
      );

      return;
    }

    Animated.timing(
      animatedValue,
      {
        toValue:
          progress,

        duration,

        useNativeDriver:
          false,
      },
    ).start();
  }, [
    animated,
    animatedValue,
    duration,
    progress,
  ]);

  const width =
    animatedValue.interpolate(
      {
        inputRange: [
          0,
          100,
        ],

        outputRange: [
          "0%",
          "100%",
        ],

        extrapolate:
          "clamp",
      },
    );

  const progressColor =
    variant === "success"
      ? c.success
      : variant ===
          "warning"
        ? c.warning
        : variant ===
            "destructive"
          ? c.destructive
          : c.primary;

  return (
    <View
      style={[
        styles.container,
        style,
      ]}
    >
      {(label ||
        showValue) && (
        <View
          style={
            styles.header
          }
        >
          {label ? (
            <ThemedText
              style={
                styles.label
              }
            >
              {label}
            </ThemedText>
          ) : (
            <View />
          )}

          {showValue && (
            <ThemedText
              style={[
                styles.value,

                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              {Math.round(
                progress,
              )}
              %
            </ThemedText>
          )}
        </View>
      )}

      <View
        style={[
          styles.track,

          {
            height,

            borderRadius:
              height / 2,

            backgroundColor:
              c.backgroundSecondary,

            borderColor:
              c.border,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progress,

            {
              width,

              height:
                "100%",

              borderRadius:
                height / 2,

              backgroundColor:
                progressColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      width:
        "100%",

      gap:
        7,
    },

    header: {
      width:
        "100%",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        10,
    },

    label: {
      flex:
        1,

      fontSize:
        12,

      fontWeight:
        "700",
    },

    value: {
      fontSize:
        11,

      fontWeight:
        "700",
    },

    track: {
      width:
        "100%",

      overflow:
        "hidden",

      borderWidth:
        StyleSheet.hairlineWidth,
    },

    progress: {
      minWidth:
        0,
    },
  });

export default ProgressBar;