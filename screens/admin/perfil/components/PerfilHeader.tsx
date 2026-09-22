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
import { useArqueoStore } from "../../arqueo/store/arqueoStore";
import { AbrirArqueoModal } from "../../arqueo/components/AbrirArqueoModal";
import { DetalleArqueoModal } from "../../arqueo/components/DetalleArqueoModal";
import { usePerfilData } from "../hooks/usePerfilData";

/*
|--------------------------------------------------------------------------
| URL PÚBLICA DEL BACKEND
|--------------------------------------------------------------------------
*/

const RAW_API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  "https://catudrive.metasoft-bolivia.com"
)
  .trim()
  .replace(/\/+$/, "");

const PUBLIC_BACKEND_URL =
  RAW_API_URL.replace(/\/api$/i, "");

/*
|--------------------------------------------------------------------------
| RESOLVER FOTO
|--------------------------------------------------------------------------
|
| Si usePerfilData() ya entrega una URL absoluta,
| simplemente se utiliza.
|
| Solamente usamos la ruta relativa como respaldo.
|
*/

function resolvePhotoUrl(
  foto:
    | string
    | null
    | undefined,
): string | null {
  if (!foto) {
    return null;
  }

  const value =
    foto.trim();

  if (!value) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | DATA / BLOB
  |--------------------------------------------------------------------------
  */

  if (
    value.startsWith("data:image/") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  /*
  |--------------------------------------------------------------------------
  | URL ABSOLUTA
  |--------------------------------------------------------------------------
  */

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  /*
  |--------------------------------------------------------------------------
  | RUTA RELATIVA - FALLBACK
  |--------------------------------------------------------------------------
  */

  if (!PUBLIC_BACKEND_URL) {
    return value;
  }

  return (
    PUBLIC_BACKEND_URL +
    "/" +
    value.replace(/^\/+/, "")
  );
}

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

type Props = {
  onChangePasswordPress:
    () => void;

  onPrinterPress:
    () => void;
};

/*
|--------------------------------------------------------------------------
| INICIALES
|--------------------------------------------------------------------------
*/

const initials =
  (
    name?:
      string,
  ) =>
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]
            ?.toUpperCase(),
      )
      .join("") ||
    "U";

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

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

  /*
  |--------------------------------------------------------------------------
  | DATOS DEL PERFIL
  |--------------------------------------------------------------------------
  |
  | "foto" ya viene procesada por usePerfilData().
  |
  | Ese hook utiliza:
  |
  | fotoUrl
  | foto_url
  |
  | antes que la ruta interna "foto".
  |
  */

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
    useState(false);

  const [
    photoFailed,
    setPhotoFailed,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | ESTADO DE CAJA
  |--------------------------------------------------------------------------
  */

  const abierto =
    useArqueoStore(
      (s) =>
        s.abierto,
    );

  const syncing =
    useArqueoStore(
      (s) =>
        s.syncing,
    );

  const fetchAbierto =
    useArqueoStore(
      (s) =>
        s.fetchAbierto,
    );

  const syncAbierto =
    useArqueoStore(
      (s) =>
        s.syncAbierto,
    );

  const [
    abrirVisible,
    setAbrirVisible,
  ] =
    useState(false);

  const [
    detalleVisible,
    setDetalleVisible,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | CARGAR ARQUEO
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (user) {
        void fetchAbierto();
      }
    },
    [
      user,
      fetchAbierto,
    ],
  );

  const tieneArqueo =
    abierto !== null;

  /*
  |--------------------------------------------------------------------------
  | DOT ARQUEO
  |--------------------------------------------------------------------------
  */

  const handleDotPress =
    async () => {
      if (syncing) {
        return;
      }

      const actual =
        useArqueoStore
          .getState()
          .abierto;

      if (actual) {
        setDetalleVisible(true);

        return;
      }

      const fresco =
        await syncAbierto();

      if (fresco) {
        setDetalleVisible(true);
      } else {
        setAbrirVisible(true);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | FOTO
  |--------------------------------------------------------------------------
  |
  | IMPORTANTE:
  |
  | ANTES:
  |
  | user.foto tenía prioridad.
  |
  | Ej:
  |
  | fotos-usuarios/u1_xxx.webp
  |
  | Eso podía generar una URL incorrecta en producción.
  |
  | AHORA:
  |
  | "foto" de usePerfilData() tiene prioridad.
  |
  | Ej:
  |
  | https://catudrive.../api/public/fotos-usuarios/u1_xxx.webp
  |
  */

  const rawFoto =
    foto ??
    (
      user?.foto?.trim()
        ? user.foto
        : null
    );

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

  /*
  |--------------------------------------------------------------------------
  | RESETEAR ERROR SI CAMBIA LA FOTO
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      setPhotoFailed(false);
    },
    [
      photoUrl,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const handleLogout =
    async () => {
      if (loading) {
        return;
      }

      setLoading(true);

      try {
        await logout();

        closeDrawer();

        useModulesStore
          .getState()
          .clearModulos();

        router.replace("/");

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
        setLoading(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <Card
      padding={0}
      style={styles.card}
    >
      {/*
      |--------------------------------------------------------------------------
      | PORTADA
      |--------------------------------------------------------------------------
      */}

      <View
        style={[
          styles.cover,

          {
            backgroundColor:
              theme
                .colors
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
        {/*
        |--------------------------------------------------------------------------
        | AVATAR
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.avatarWrap
          }
        >
          <View
            style={[
              styles.avatarShell,

              {
                backgroundColor:
                  theme
                    .colors
                    .card,

                borderColor:
                  theme
                    .colors
                    .card,
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

                transition={150}

                onError={(
                  error,
                ) => {
                  console.warn(
                    "[PERFIL FOTO ERROR]",
                    {
                      photoUrl,
                      error,
                    },
                  );

                  setPhotoFailed(
                    true,
                  );
                }}
              />
            ) : (
              <View
                style={[
                  styles.placeholder,

                  {
                    backgroundColor:
                      theme
                        .colors
                        .primarySubtle,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.initials,

                    {
                      color:
                        theme
                          .colors
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

          {/*
          |--------------------------------------------------------------------------
          | ESTADO DE CAJA
          |--------------------------------------------------------------------------
          */}

          {!isDesktop ? (
            <Pressable
              onPress={() =>
                void handleDotPress()
              }

              disabled={
                syncing
              }

              accessibilityRole="button"

              accessibilityLabel={
                syncing
                  ? "Verificando arqueo..."
                  : tieneArqueo
                    ? "Ver mi arqueo abierto"
                    : "Abrir arqueo"
              }

              hitSlop={8}

              style={[
                styles.onlineDot,

                {
                  borderColor:
                    theme
                      .colors
                      .card,

                  backgroundColor:
                    tieneArqueo
                      ? "#22c55e"
                      : "#ef4444",

                  opacity:
                    syncing
                      ? 0.5
                      : 1,
                },
              ]}
            />
          ) : null}
        </View>

        {/*
        |--------------------------------------------------------------------------
        | INFORMACIÓN DEL USUARIO
        |--------------------------------------------------------------------------
        */}

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

          {/*
          |--------------------------------------------------------------------------
          | ROLES
          |--------------------------------------------------------------------------
          */}

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

          {/*
          |--------------------------------------------------------------------------
          | ARQUEO MÓVIL
          |--------------------------------------------------------------------------
          */}

          {!isDesktop ? (
            <ThemedText
              onPress={() =>
                void handleDotPress()
              }

              style={[
                styles.cajaEstado,

                {
                  color:
                    tieneArqueo
                      ? "#16a34a"
                      : "#dc2626",

                  textAlign:
                    "center",
                },
              ]}
            >
              {
                tieneArqueo
                  ? `Caja abierta #${abierto?.id} · ver detalle`
                  : "Sin arqueo · abrir caja"
              }
            </ThemedText>
          ) : null}
        </View>

        {/*
        |--------------------------------------------------------------------------
        | ACCIONES DESKTOP
        |--------------------------------------------------------------------------
        */}

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
          /*
          |--------------------------------------------------------------------------
          | ACCIONES MÓVIL / TABLET
          |--------------------------------------------------------------------------
          */

          <View
            style={[
              styles.actionsMobile,

              {
                borderTopColor:
                  theme
                    .colors
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
                      theme
                        .colors
                        .backgroundTertiary,

                    borderColor:
                      theme
                        .colors
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
                          theme
                            .colors
                            .primarySubtle,
                      },
                    ]}
                  >
                    <KeyRound
                      size={16}

                      color={
                        theme
                          .colors
                          .primary
                      }

                      strokeWidth={2}
                    />
                  </View>

                  <ThemedText
                    style={[
                      styles.optionLabel,

                      {
                        color:
                          theme
                            .colors
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
                      theme
                        .colors
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
                      size={16}

                      color={
                        theme
                          .colors
                          .textSecondary
                      }

                      strokeWidth={2}
                    />

                    <ThemedText
                      style={[
                        styles.logoutLabel,

                        {
                          color:
                            theme
                              .colors
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

      {/*
      |--------------------------------------------------------------------------
      | MODAL ABRIR ARQUEO
      |--------------------------------------------------------------------------
      */}

      <AbrirArqueoModal
        visible={
          abrirVisible
        }

        onClose={() =>
          setAbrirVisible(
            false,
          )
        }
      />

      {/*
      |--------------------------------------------------------------------------
      | MODAL DETALLE ARQUEO
      |--------------------------------------------------------------------------
      */}

      <DetalleArqueoModal
        visible={
          detalleVisible
        }

        arqueoId={
          abierto?.id ??
          null
        }

        onClose={() =>
          setDetalleVisible(
            false,
          )
        }
      />
    </Card>
  );
};

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

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

    avatarWrap: {
      position:
        "relative",
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

    onlineDot: {
      position:
        "absolute",

      bottom:
        -2,

      right:
        -2,

      width:
        20,

      height:
        20,

      borderRadius:
        10,

      borderWidth:
        3,
    },

    cajaEstado: {
      marginTop:
        7,

      fontSize:
        12,

      fontWeight:
        "700",
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