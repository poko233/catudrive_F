import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/store/authStore";
import { useTheme } from "@/theme/useTheme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  KeyRound,
  LogOut,
  Printer as PrinterIcon,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { useMobileDrawer } from "../../../../contexts/MobileDrawerContext";
import { useResponsive } from "../../../../hooks/useResponsive";
import { useModulesStore } from "../../../../store/modulesStore";
import { usePerfilData } from "../hooks/usePerfilData";

const RAW_API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

const PUBLIC_BACKEND_URL = RAW_API_URL.replace(/\/api$/i, "");

function resolvePhotoUrl(
  foto:
    string |
    null |
    undefined,
): string | null {
  if (!foto) {
    return null;
  }

  const value =
    foto.trim();

  if (!value) {
    return null;
  }

  if (
    value.startsWith(
      "data:image/",
    ) ||
    value.startsWith(
      "blob:",
    )
  ) {
    return value;
  }

  if (
    value.startsWith(
      "http://",
    ) ||
    value.startsWith(
      "https://",
    )
  ) {
    return value;
  }

  if (!PUBLIC_BACKEND_URL) {
    return value;
  }

  return (
    PUBLIC_BACKEND_URL +
    "/" +
    value.replace(
      /^\/+/,
      "",
    )
  );
}

type Props = {
  onChangePasswordPress:
    () => void;

  onPrinterPress:
    () => void;
};

const initials =
  (
    name?:
      string,
  ) =>
    name
      ?.trim()
      .split(
        /\s+/,
      )
      .slice(
        0,
        2,
      )
      .map(
        (
          part,
        ) =>
          part[0]
            ?.toUpperCase(),
      )
      .join(
        "",
      ) ||
    "U";

export const PerfilHeader = ({
  onChangePasswordPress,
  onPrinterPress,
}: Props) => {
  const {
    theme,
  } =
    useTheme();

  const {
    isDesktop,
    isMobile,
    isTablet,
  } =
    useResponsive();

  const {
    nombreCompleto,
    roles,
    foto,
  } =
    usePerfilData();

  const {
    user,
    logout,
  } =
    useAuth();

  const router =
    useRouter();

  const {
    closeDrawer,
  } =
    useMobileDrawer();

  const [
    loading,
    setLoading,
  ] =
    useState(
      false,
    );

  const [
    photoFailed,
    setPhotoFailed,
  ] =
    useState(
      false,
    );

  const rawFoto =
    user?.foto?.trim()
      ? user.foto
      : foto;

  const photoUrl =
    useMemo(
      () =>
        resolvePhotoUrl(
          rawFoto,
        ),
      [
        rawFoto,
      ],
    );

  useEffect(
    () => {
      setPhotoFailed(
        false,
      );
    },
    [
      photoUrl,
    ],
  );

  const handleLogout =
    async () => {
      if (
        loading
      ) {
        return;
      }

      setLoading(
        true,
      );

      try {
        await logout();

        closeDrawer();

        useModulesStore
          .getState()
          .clearModulos();

        router.replace(
          "/",
        );

        Toast.show({
          type:
            "success",

          text1:
            "Sesión cerrada",
        });
      } catch (
        error
      ) {
        console.error(
          error,
        );

        Toast.show({
          type:
            "error",

          text1:
            "No se pudo cerrar la sesión",
        });
      } finally {
        setLoading(
          false,
        );
      }
    };

  return (
    <Card
      padding={
        0
      }

      style={
        styles.card
      }
    >
      <View
        style={[
          styles.cover,

          {
            backgroundColor:
              theme.colors
                .primarySubtle,
          },
        ]}
      />

      <View
        style={[
          styles.content,

          {
            flexDirection:
              isDesktop
                ? "row"
                : "column",

            alignItems:
              isDesktop
                ? "flex-end"
                : "center",
          },
        ]}
      >
        <View
          style={[
            styles.avatarShell,

            {
              backgroundColor:
                theme.colors.card,

              borderColor:
                theme.colors.card,
            },
          ]}
        >
          {photoUrl &&
          !photoFailed ? (
            <Image
              source={{
                uri:
                  photoUrl,
              }}

              style={
                styles.avatar
              }

              contentFit="cover"

              cachePolicy="memory-disk"

              transition={
                150
              }

              onError={() =>
                setPhotoFailed(
                  true,
                )
              }
            />
          ) : (
            <View
              style={[
                styles.placeholder,

                {
                  backgroundColor:
                    theme.colors
                      .primarySubtle,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.initials,

                  {
                    color:
                      theme.colors
                        .primary,
                  },
                ]}
              >
                {
                  initials(
                    nombreCompleto,
                  )
                }
              </ThemedText>
            </View>
          )}
        </View>

        <View
          style={[
            styles.info,

            {
              alignItems:
                isDesktop
                  ? "flex-start"
                  : "center",
            },
          ]}
        >
          <ThemedText
            style={[
              styles.name,

              {
                textAlign:
                  isDesktop
                    ? "left"
                    : "center",
              },
            ]}
          >
            {
              nombreCompleto ||
              "Usuario"
            }
          </ThemedText>

          <View
            style={[
              styles.roles,

              {
                justifyContent:
                  isDesktop
                    ? "flex-start"
                    : "center",
              },
            ]}
          >
            {roles?.length ? (
              roles.map(
                (
                  rol,
                  index,
                ) => (
                  <Badge
                    key={`${rol}-${index}`}

                    label={
                      rol
                    }

                    variant={
                      index ===
                      0
                        ? "info"
                        : "muted"
                    }
                  />
                ),
              )
            ) : (
              <Badge
                label="Sin rol"

                variant="muted"
              />
            )}
          </View>
        </View>

        {isDesktop ? (
          <View
            style={
              styles.actions
            }
          >
            <IconButton
              icon={
                PrinterIcon
              }

              onPress={
                onPrinterPress
              }

              variant="secondary"

              size="md"

              accessibilityLabel="Elegir impresora"
            />

            <Button
              title="Cambiar contraseña"

              onPress={
                onChangePasswordPress
              }
            />
          </View>
        ) : (
          <View
            style={[
              styles.actionsMobile,

              {
                borderTopColor:
                  theme.colors
                    .border,
              },
            ]}
          >
            <View
              style={
                styles.profileActionsRow
              }
            >
              <IconButton
                icon={
                  PrinterIcon
                }

                onPress={
                  onPrinterPress
                }

                variant="secondary"

                size="lg"

                accessibilityLabel="Elegir impresora"
              />

              <Pressable
                onPress={
                  onChangePasswordPress
                }

                accessibilityRole="button"

                accessibilityLabel="Cambiar contraseña"

                style={[
                  styles.optionBtn,
                  styles.passwordAction,

                  {
                    backgroundColor:
                      theme.colors
                        .backgroundTertiary,

                    borderColor:
                      theme.colors
                        .primary,
                  },
                ]}
              >
                <View
                  style={
                    styles.btnFila
                  }
                >
                  <View
                    style={[
                      styles.optionIconBox,

                      {
                        backgroundColor:
                          theme.colors
                            .primarySubtle,
                      },
                    ]}
                  >
                    <KeyRound
                      size={
                        16
                      }

                      color={
                        theme.colors
                          .primary
                      }

                      strokeWidth={
                        2
                      }
                    />
                  </View>

                  <ThemedText
                    style={[
                      styles.optionLabel,

                      {
                        color:
                          theme.colors
                            .text,
                      },
                    ]}
                  >
                    Cambiar contraseña
                  </ThemedText>
                </View>
              </Pressable>
            </View>

            {(isMobile ||
              isTablet) && (
              <Pressable
                onPress={
                  handleLogout
                }

                disabled={
                  loading
                }

                accessibilityRole="button"

                accessibilityLabel="Cerrar sesión"

                style={[
                  styles.logoutBtn,

                  {
                    backgroundColor:
                      "transparent",

                    opacity:
                      loading
                        ? 0.6
                        : 1,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"

                    color={
                      theme.colors
                        .destructive
                    }
                  />
                ) : (
                  <View
                    style={
                      styles.btnFila
                    }
                  >
                    <LogOut
                      size={
                        16
                      }

                      color={
                        theme.colors
                          .textSecondary
                      }

                      strokeWidth={
                        2
                      }
                    />

                    <ThemedText
                      style={[
                        styles.logoutLabel,

                        {
                          color:
                            theme.colors
                              .textSecondary,
                        },
                      ]}
                    >
                      Cerrar sesión
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Card>
  );
};

const styles =
  StyleSheet.create({
    card: {
      overflow:
        "hidden",
    },

    cover: {
      height:
        96,
    },

    content: {
      gap:
        16,

      paddingHorizontal:
        20,

      paddingBottom:
        20,

      marginTop:
        -42,
    },

    avatarShell: {
      width:
        88,

      height:
        88,

      borderRadius:
        16,

      borderWidth:
        4,

      padding:
        0,

      overflow:
        "hidden",
    },

    avatar: {
      width:
        "100%",

      height:
        "100%",

      borderRadius:
        12,
    },

    placeholder: {
      flex:
        1,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    initials: {
      fontSize:
        26,

      fontWeight:
        "900",
    },

    info: {
      flex:
        1,

      minWidth:
        0,

      paddingBottom:
        4,
    },

    name: {
      fontSize:
        20,

      fontWeight:
        "700",

      letterSpacing:
        -0.2,
    },

    roles: {
      marginTop:
        7,

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        6,
    },

    actions: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        10,

      paddingBottom:
        4,
    },

    actionsMobile: {
      width:
        "100%",

      gap:
        10,

      borderTopWidth:
        StyleSheet.hairlineWidth,

      paddingTop:
        12,
    },

    profileActionsRow: {
      width:
        "100%",

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,
    },

    passwordAction: {
      flex:
        1,

      width:
        "auto",
    },

    optionBtn: {
      width:
        "100%",

      minHeight:
        48,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingVertical:
        12,

      paddingHorizontal:
        16,

      borderRadius:
        12,

      borderWidth:
        0.4,
    },

    optionIconBox: {
      width:
        28,

      height:
        28,

      borderRadius:
        8,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    btnFila: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        10,
    },

    optionLabel: {
      fontSize:
        14,

      fontWeight:
        "500",
    },

    logoutBtn: {
      width:
        "100%",

      minHeight:
        42,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingVertical:
        10,

      paddingHorizontal:
        16,

      borderRadius:
        12,
    },

    logoutLabel: {
      fontSize:
        13,

      fontWeight:
        "500",

      letterSpacing:
        0.2,
    },
  });
