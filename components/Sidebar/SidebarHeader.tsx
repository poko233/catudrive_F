import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/store/authStore";
import { useArqueoStore } from "@/screens/admin/arqueo/store/arqueoStore";
import { AbrirArqueoModal } from "@/screens/admin/arqueo/components/AbrirArqueoModal";
import { DetalleArqueoModal } from "@/screens/admin/arqueo/components/DetalleArqueoModal";
import { useTheme } from "../../theme/useTheme";

/*
|--------------------------------------------------------------------------
| URL PÚBLICA DEL BACKEND
|--------------------------------------------------------------------------
|
| EXPO_PUBLIC_API_URL puede ser:
|
| http://192.168.100.115:8000
|
| o:
|
| https://catudrive.metasoft-bolivia.com
|
| o incluso:
|
| https://catudrive.metasoft-bolivia.com/api
|
*/

const RAW_API_URL =
  (
    process.env.EXPO_PUBLIC_API_URL ??
    "https://catudrive.metasoft-bolivia.com"
  )
    .trim()
    .replace(
      /\/+$/,
      "",
    );

const PUBLIC_BACKEND_URL =
  RAW_API_URL.replace(
    /\/api$/i,
    "",
  );

/*
|--------------------------------------------------------------------------
| RESOLVER FOTO
|--------------------------------------------------------------------------
|
| Prioridad:
|
| 1. URL absoluta que ya entrega Laravel.
| 2. Data URI / Blob.
| 3. Ruta relativa.
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
    value.startsWith(
      "data:image/",
    ) ||
    value.startsWith(
      "blob:",
    )
  ) {
    return value;
  }

  /*
  |--------------------------------------------------------------------------
  | URL ABSOLUTA
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | RUTA RELATIVA
  |--------------------------------------------------------------------------
  |
  | Ejemplo:
  |
  | fotos-usuarios/u1_xxx.webp
  |
  */

  if (
    !PUBLIC_BACKEND_URL
  ) {
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

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export const SidebarHeader: React.FC<{
  collapsed?: boolean;

  onNavigate?: () => void;
}> = ({
  collapsed =
    false,

  onNavigate,
}) => {
  const {
    user,
  } =
    useAuth();

  const {
    theme,
  } =
    useTheme();

  const router =
    useRouter();

  const [
    photoFailed,
    setPhotoFailed,
  ] =
    useState(
      false,
    );

  const [
    abrirVisible,
    setAbrirVisible,
  ] =
    useState(
      false,
    );

  const [
    detalleVisible,
    setDetalleVisible,
  ] =
    useState(
      false,
    );

  const abierto =
    useArqueoStore(
      (
        s,
      ) =>
        s.abierto,
    );

  const syncing =
    useArqueoStore(
      (
        s,
      ) =>
        s.syncing,
    );

  const fetchAbierto =
    useArqueoStore(
      (
        s,
      ) =>
        s.fetchAbierto,
    );

  const syncAbierto =
    useArqueoStore(
      (
        s,
      ) =>
        s.syncAbierto,
    );

  /*
  |--------------------------------------------------------------------------
  | CARGAR ARQUEO
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        user
      ) {
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
  | DOT DINÁMICO
  |--------------------------------------------------------------------------
  |
  | Si ya hay abierto en cache:
  |
  | abre detalle.
  |
  | Si no:
  |
  | sincroniza con backend.
  |
  */

  const handleDotPress =
    async () => {
      if (
        syncing
      ) {
        return;
      }

      const actual =
        useArqueoStore
          .getState()
          .abierto;

      if (
        actual
      ) {
        setDetalleVisible(
          true,
        );

        return;
      }

      const fresco =
        await syncAbierto();

      if (
        fresco
      ) {
        setDetalleVisible(
          true,
        );
      } else {
        setAbrirVisible(
          true,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | FOTO DEL USUARIO
  |--------------------------------------------------------------------------
  |
  | El backend actual devuelve:
  |
  | foto
  | fotoUrl
  | foto_url
  |
  | En producción utilizamos primero fotoUrl / foto_url,
  | porque Laravel ya genera la URL pública correcta.
  |
  */

  const foto =
    (
      user as typeof user & {
        fotoUrl?:
          | string
          | null;

        foto_url?:
          | string
          | null;
      }
    )
      ?.fotoUrl ??
    (
      user as typeof user & {
        fotoUrl?:
          | string
          | null;

        foto_url?:
          | string
          | null;
      }
    )
      ?.foto_url ??
    user?.foto ??
    null;

  const photoUrl =
    useMemo(
      () =>
        resolvePhotoUrl(
          foto,
        ),

      [
        foto,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | RESETEAR ERROR CUANDO CAMBIA LA FOTO
  |--------------------------------------------------------------------------
  */

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

  if (
    !user
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | DATOS DEL USUARIO
  |--------------------------------------------------------------------------
  */

  const {
    nombres,
    primer_apellido,
    segundo_apellido,
  } =
    user;

  const apellido =
    `${primer_apellido || ""} ${segundo_apellido || ""}`
      .trim();

  const nombreCompleto =
    `${nombres || ""} ${apellido}`
      .trim() ||
    "Usuario";

  /*
  |--------------------------------------------------------------------------
  | INICIALES
  |--------------------------------------------------------------------------
  */

  const initials =
    () => {
      const nombreInicial =
        nombres?.charAt(
          0,
        ) ||
        "";

      const apellidoInicial =
        primer_apellido?.charAt(
          0,
        ) ||
        "";

      return (
        nombreInicial +
        apellidoInicial
      )
        .toUpperCase() ||
        "U";
    };

  /*
  |--------------------------------------------------------------------------
  | TAMAÑO
  |--------------------------------------------------------------------------
  */

  const avatarSize =
    collapsed
      ? 36
      : 40;

  const avatarRadius =
    avatarSize /
    2;

  /*
  |--------------------------------------------------------------------------
  | AVATAR
  |--------------------------------------------------------------------------
  */

  const renderAvatar =
    () => (
      <View
        style={
          styles.avatarOuter
        }
      >
        <View
          style={[
            styles.avatar,

            {
              width:
                avatarSize,

              height:
                avatarSize,

              borderRadius:
                avatarRadius,

              borderColor:
                theme
                  .colors
                  .primary,

              backgroundColor:
                theme
                  .colors
                  .backgroundSecondary,
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
                styles.image
              }
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={
                150
              }
              onError={(
                error,
              ) => {
                console.warn(
                  "[SIDEBAR USER PHOTO ERROR]",
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
              style={
                styles.initialsContainer
              }
            >
              <Text
                style={[
                  styles.initials,

                  {
                    color:
                      theme
                        .colors
                        .text,
                  },
                ]}
              >
                {
                  initials()
                }
              </Text>
            </View>
          )}
        </View>

        {/*
        |--------------------------------------------------------------------------
        | ONLINE = ARQUEO ABIERTO
        |--------------------------------------------------------------------------
        |
        | Verde = tiene arqueo abierto
        | Rojo  = sin arqueo
        |
        */}

        <Pressable
          onPress={() =>
            void handleDotPress()
          }
          accessibilityRole="button"
          accessibilityLabel={
            syncing
              ? "Verificando arqueo..."
              : tieneArqueo
                ? "Ver mi arqueo abierto"
                : "Abrir arqueo"
          }
          hitSlop={
            8
          }
          disabled={
            syncing
          }
          style={[
            styles.onlineDot,

            {
              borderColor:
                theme
                  .colors
                  .backgroundSecondary,

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
      </View>
    );

  /*
  |--------------------------------------------------------------------------
  | COLAPSADO
  |--------------------------------------------------------------------------
  */

  if (
    collapsed
  ) {
    return (
      <>
        <Pressable
          onPress={() => {
            onNavigate?.();

            router.push(
              "/perfil",
            );
          }}
          style={
            styles.collapsedContainer
          }
        >
          {
            renderAvatar()
          }
        </Pressable>

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
      </>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NORMAL
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <Pressable
        onPress={() => {
          onNavigate?.();

          router.push(
            "/perfil",
          );
        }}
        style={[
          styles.container,

          {
            borderBottomColor:
              theme
                .colors
                .border,
          },
        ]}
      >
        {
          renderAvatar()
        }

        <View
          style={
            styles.textContainer
          }
        >
          <Text
            style={[
              styles.name,

              {
                color:
                  theme
                    .colors
                    .text,
              },
            ]}
            numberOfLines={
              1
            }
          >
            {
              nombreCompleto
            }
          </Text>

          <Text
            style={{
              fontSize:
                11,

              color:
                tieneArqueo
                  ? "#16a34a"
                  : "#dc2626",

              fontWeight:
                "700",
            }}
          >
            {
              tieneArqueo
                ? `Caja abierta #${abierto?.id}`
                : "Sin arqueo"
            }
          </Text>
        </View>
      </Pressable>

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
    </>
  );
};

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    container: {
      flexShrink:
        0,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,

      paddingHorizontal:
        12,

      paddingVertical:
        10,

      borderBottomWidth:
        1,
    },

    textContainer: {
      flex:
        1,

      minWidth:
        0,
    },

    name: {
      fontSize:
        13,

      fontWeight:
        "700",
    },

    collapsedContainer: {
      flexShrink:
        0,

      alignItems:
        "center",

      paddingVertical:
        10,
    },

    avatarOuter: {
      position:
        "relative",
    },

    avatar: {
      borderWidth:
        1.5,

      overflow:
        "hidden",
    },

    image: {
      width:
        "100%",

      height:
        "100%",
    },

    initialsContainer: {
      flex:
        1,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    initials: {
      fontSize:
        14,

      fontWeight:
        "800",
    },

    onlineDot: {
      position:
        "absolute",

      bottom:
        -2,

      right:
        -2,

      width:
        14,

      height:
        14,

      borderRadius:
        7,

      backgroundColor:
        "#22c55e",

      borderWidth:
        2.5,
    },
  });