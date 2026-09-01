import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import { LinearGradient } from "expo-linear-gradient";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  LoaderCircle,
  X,
} from "lucide-react-native";

import React from "react";

import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

export type CustomToastType =
  | "success"
  | "error"
  | "info"
  | "warning"
  | "loading";

interface CustomToastProps {
  text1?: string;
  text2?: string;
  hide?: () => void;
  isVisible?: boolean;
  type?: CustomToastType;
}

/*
|--------------------------------------------------------------------------
| COLOR CON TRANSPARENCIA
|--------------------------------------------------------------------------
*/

function withAlpha(
  color: string,
  alphaHex: string,
) {
  if (!color) {
    return color;
  }

  if (
    color.startsWith("#")
  ) {
    const hex =
      color.replace(
        "#",
        "",
      );

    if (
      hex.length === 6
    ) {
      return `#${hex}${alphaHex}`;
    }

    if (
      hex.length === 8
    ) {
      return `#${hex.slice(
        0,
        6,
      )}${alphaHex}`;
    }
  }

  return color;
}

/*
|--------------------------------------------------------------------------
| TOAST
|--------------------------------------------------------------------------
*/

export function CustomToast({
  text1,
  text2,
  hide,
  type = "info",
}: CustomToastProps) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  /*
  |--------------------------------------------------------------------------
  | ESTADOS
  |--------------------------------------------------------------------------
  */

  const statusMap = {
    success: {
      color:
        c.success,

      icon:
        CheckCircle2,
    },

    error: {
      color:
        c.destructive,

      icon:
        AlertCircle,
    },

    warning: {
      color:
        c.warning,

      icon:
        AlertTriangle,
    },

    info: {
      color:
        c.info,

      icon:
        Info,
    },

    loading: {
      color:
        c.primary,

      icon:
        LoaderCircle,
    },
  } as const;

  const status =
    statusMap[type];

  const Icon =
    status.icon;

  const accent =
    status.color;

  /*
  |--------------------------------------------------------------------------
  | COLORES
  |--------------------------------------------------------------------------
  */

  const glowStrong =
    withAlpha(
      accent,
      "50",
    );

  const glowSoft =
    withAlpha(
      accent,
      "16",
    );

  const glowVerySoft =
    withAlpha(
      accent,
      "08",
    );

  const iconBg =
    withAlpha(
      accent,
      "12",
    );

  const iconBorder =
    withAlpha(
      accent,
      "45",
    );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.wrapper,

        Platform.OS ===
        "web"
          ? ({
              boxShadow:
                "0 10px 28px rgba(0,0,0,0.34), 0 2px 8px rgba(0,0,0,0.18)",
            } as any)
          : styles.nativeShadow,
      ]}
    >
      {/* GLOW EXTERIOR */}

      <LinearGradient
        pointerEvents="none"
        colors={[
          glowSoft,
          "transparent",
        ]}
        start={{
          x: 0,
          y: 0.5,
        }}
        end={{
          x: 1,
          y: 0.5,
        }}
        style={
          styles.outerGlow
        }
      />

      {/* TARJETA */}

      <LinearGradient
        colors={[
          withAlpha(
            c.card,
            "F5",
          ),

          withAlpha(
            c.backgroundSecondary,
            "EE",
          ),
        ]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 1,
        }}
        style={[
          styles.container,

          {
            borderColor:
              withAlpha(
                c.border,
                "AA",
              ),

            backgroundColor:
              c.card,
          },
        ]}
      >
        {/* HALO */}

        <LinearGradient
          pointerEvents="none"
          colors={[
            glowStrong,
            "transparent",
          ]}
          start={{
            x: 0,
            y: 0.5,
          }}
          end={{
            x: 1,
            y: 0.5,
          }}
          style={
            styles.leftGlow
          }
        />

        {/* BRILLO SUPERIOR */}

        <LinearGradient
          pointerEvents="none"
          colors={[
            withAlpha(
              "#FFFFFF",
              "12",
            ),

            "transparent",
          ]}
          start={{
            x: 0.1,
            y: 0,
          }}
          end={{
            x: 0.9,
            y: 1,
          }}
          style={
            styles.topHighlight
          }
        />

        {/* LÍNEA LATERAL */}

        <LinearGradient
          pointerEvents="none"
          colors={[
            accent,

            withAlpha(
              accent,
              "AA",
            ),
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 0,
            y: 1,
          }}
          style={
            styles.leftAccent
          }
        />

        {/* ICONO */}

        <View
          style={
            styles.iconArea
          }
        >
          <LinearGradient
            pointerEvents="none"
            colors={[
              glowSoft,
              glowVerySoft,
              "transparent",
            ]}
            start={{
              x: 0.2,
              y: 0.2,
            }}
            end={{
              x: 1,
              y: 1,
            }}
            style={
              styles.iconGlow
            }
          />

          <View
            style={[
              styles.iconContainer,

              {
                backgroundColor:
                  iconBg,

                borderColor:
                  iconBorder,
              },
            ]}
          >
            {type ===
            "loading" ? (
              <ActivityIndicator
                size="small"
                color={
                  accent
                }
              />
            ) : (
              <Icon
                size={21}
                strokeWidth={2}
                color={
                  accent
                }
              />
            )}
          </View>
        </View>

        {/* TEXTO */}

        <View
          style={
            styles.textContainer
          }
        >
          {text1 ? (
            <ThemedText
              numberOfLines={1}
              style={[
                styles.title,

                {
                  color:
                    c.text,
                },
              ]}
            >
              {text1}
            </ThemedText>
          ) : null}

          {text2 ? (
            <ThemedText
              numberOfLines={3}
              style={[
                styles.description,

                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              {text2}
            </ThemedText>
          ) : null}
        </View>

        {/* CERRAR */}

        {hide ? (
          <Pressable
            onPress={hide}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Cerrar notificación"
            style={({
              pressed,
            }) => [
              styles.closeButton,

              {
                opacity:
                  pressed
                    ? 0.55
                    : 1,
              },
            ]}
          >
            <X
              size={18}
              strokeWidth={2.2}
              color={
                c.textMuted
              }
            />
          </Pressable>
        ) : null}
      </LinearGradient>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| ESTILOS
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    /*
    |--------------------------------------------------------------------------
    | WRAPPER
    |--------------------------------------------------------------------------
    */

    wrapper: {
      width:
        "90%",

      maxWidth:
        500,

      alignSelf:
        "center",

      marginVertical:
        6,

      borderRadius:
        16,
    },

    /*
    |--------------------------------------------------------------------------
    | GLOW
    |--------------------------------------------------------------------------
    */

    outerGlow: {
      position:
        "absolute",

      top:
        -7,

      bottom:
        -7,

      left:
        -7,

      right:
        -7,

      borderRadius:
        22,

      opacity:
        0.8,
    },

    /*
    |--------------------------------------------------------------------------
    | CONTAINER
    |--------------------------------------------------------------------------
    */

    container: {
      minHeight:
        78,

      borderWidth:
        1,

      borderRadius:
        16,

      overflow:
        "hidden",

      position:
        "relative",

      flexDirection:
        "row",

      alignItems:
        "center",

      paddingLeft:
        18,

      paddingRight:
        10,

      paddingVertical:
        12,
    },

    /*
    |--------------------------------------------------------------------------
    | EFECTOS
    |--------------------------------------------------------------------------
    */

    leftGlow: {
      position:
        "absolute",

      left:
        0,

      top:
        0,

      bottom:
        0,

      width:
        "48%",

      opacity:
        0.9,
    },

    topHighlight: {
      position:
        "absolute",

      top:
        0,

      left:
        0,

      right:
        0,

      height:
        1,

      opacity:
        0.6,
    },

    leftAccent: {
      position:
        "absolute",

      left:
        13,

      top:
        13,

      bottom:
        13,

      width:
        3,

      borderRadius:
        999,
    },

    /*
    |--------------------------------------------------------------------------
    | ICONO
    |--------------------------------------------------------------------------
    */

    iconArea: {
      width:
        52,

      height:
        52,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginLeft:
        13,

      marginRight:
        10,

      position:
        "relative",

      flexShrink:
        0,
    },

    iconGlow: {
      position:
        "absolute",

      width:
        52,

      height:
        52,

      borderRadius:
        16,
    },

    iconContainer: {
      width:
        42,

      height:
        42,

      borderRadius:
        12,

      borderWidth:
        1,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | TEXTO
    |--------------------------------------------------------------------------
    */

    textContainer: {
      flex:
        1,

      minWidth:
        0,

      paddingRight:
        6,
    },

    title: {
      fontSize:
        15,

      fontWeight:
        "800",

      marginBottom:
        2,
    },

    description: {
      fontSize:
        12.5,

      lineHeight:
        17,

      fontWeight:
        "400",
    },

    /*
    |--------------------------------------------------------------------------
    | CERRAR
    |--------------------------------------------------------------------------
    */

    closeButton: {
      width:
        30,

      height:
        30,

      borderRadius:
        9,

      alignItems:
        "center",

      justifyContent:
        "center",

      flexShrink:
        0,
    },

    /*
    |--------------------------------------------------------------------------
    | SOMBRA
    |--------------------------------------------------------------------------
    */

    nativeShadow: {
      elevation:
        9,

      shadowColor:
        "#000",

      shadowOffset: {
        width:
          0,

        height:
          6,
      },

      shadowOpacity:
        0.26,

      shadowRadius:
        14,
    },
  });

export default CustomToast;