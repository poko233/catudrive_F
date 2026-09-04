import { useAuth } from "@/store/authStore";

import {
  Image,
} from "expo-image";

import {
  useRouter,
} from "expo-router";

import {
  LogOut,
} from "lucide-react-native";

import React, {
  useState,
} from "react";

import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Toast from "react-native-toast-message";

import logoImg from "../../assets/images/logo_texto.png";

import {
  useMobileDrawer,
} from "../../contexts/MobileDrawerContext";

import {
  useModulesStore,
} from "../../store/modulesStore";

import {
  useTheme,
} from "../../theme/useTheme";

/*
|--------------------------------------------------------------------------
| BACKEND PÚBLICO
|--------------------------------------------------------------------------
*/

const RAW_API_URL =
  (
    process.env.EXPO_PUBLIC_API_URL ??
    ""
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

const LOGO_LARGO_URL =
  `${PUBLIC_BACKEND_URL}/empresa/empresa_1_logo_largo.webp`;

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export const SidebarFooter: React.FC<{
  collapsed?: boolean;
}> = ({
  collapsed =
    false,
}) => {
  const {
    user,
    logout,
  } =
    useAuth();

  const {
    theme,
  } =
    useTheme();

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
    hovered,
    setHovered,
  ] =
    useState(
      false,
    );

  const [
    logoFailed,
    setLogoFailed,
  ] =
    useState(
      false,
    );

  if (!user) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const handleLogout =
    async () => {
      setLoading(
        true,
      );

      try {
        await logout();

        /*
        |--------------------------------------------------------------------------
        | LIMPIAR STORE
        |--------------------------------------------------------------------------
        */

        useModulesStore
          .getState()
          .clearModulos();

        closeDrawer();

        Toast.show({
          type:
            "success",

          text1:
            "Sesión cerrada",

          text2:
            "Has salido correctamente.",

          visibilityTime:
            3000,
        });

        router.replace(
          "/",
        );
      } catch {
        Toast.show({
          type:
            "error",

          text1:
            "No se pudo cerrar la sesión",

          text2:
            "Intenta nuevamente.",
        });
      } finally {
        setLoading(
          false,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | HOVER
  |--------------------------------------------------------------------------
  */

  const hoverHandlers =
    Platform.OS ===
    "web"
      ? {
          onMouseEnter:
            () =>
              setHovered(
                true,
              ),

          onMouseLeave:
            () =>
              setHovered(
                false,
              ),
        }
      : {};

  /*
  |--------------------------------------------------------------------------
  | COLLAPSED
  |--------------------------------------------------------------------------
  */

  if (collapsed) {
    return (
      <View
        style={[
          styles.collapsedFooter,

          {
            borderTopColor:
              theme
                .colors
                .border,

            backgroundColor:
              theme
                .colors
                .card,
          },
        ]}
      >
        <Pressable
          onPress={
            handleLogout
          }

          disabled={
            loading
          }

          {...(
            hoverHandlers as any
          )}

          style={({
            pressed,
          }) => [
            styles.collapsedLogout,

            {
              borderColor:
                hovered ||
                pressed
                  ? theme
                      .colors
                      .destructive
                  : theme
                      .colors
                      .border,

              backgroundColor:
                hovered ||
                pressed
                  ? theme
                      .colors
                      .destructive +
                    "12"
                  : "transparent",

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
            <LogOut
              size={
                16
              }

              color={
                theme
                  .colors
                  .destructive
              }
            />
          )}
        </Pressable>
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NORMAL
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={[
        styles.footer,

        {
          borderTopColor:
            theme
              .colors
              .border,

          backgroundColor:
            theme
              .colors
              .card,
        },
      ]}
    >
      {/*
      |--------------------------------------------------------------------------
      | LOGO
      |--------------------------------------------------------------------------
      */}

      <View
        style={
          styles.logoContainer
        }
      >
        <Image
          source={
            logoFailed
              ? logoImg
              : {
                  uri:
                    LOGO_LARGO_URL,
                }
          }

          style={
            styles.logo
          }

          contentFit="contain"

          contentPosition="left center"

          cachePolicy="memory-disk"

          onError={() =>
            setLogoFailed(
              true,
            )
          }

          transition={
            200
          }
        />
      </View>

      {/*
      |--------------------------------------------------------------------------
      | SALIR
      |--------------------------------------------------------------------------
      */}

      <Pressable
        onPress={
          handleLogout
        }

        disabled={
          loading
        }

        {...(
          hoverHandlers as any
        )}

        style={({
          pressed,
        }) => [
          styles.logoutButton,

          {
            borderColor:
              hovered ||
              pressed
                ? theme
                    .colors
                    .destructive
                : theme
                    .colors
                    .border,

            backgroundColor:
              hovered ||
              pressed
                ? theme
                    .colors
                    .destructive +
                  "12"
                : "transparent",

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
          <>
            <LogOut
              size={
                11
              }

              color={
                theme
                  .colors
                  .destructive
              }
            />

            <Text
              style={[
                styles.logoutText,

                {
                  color:
                    theme
                      .colors
                      .destructive,
                },
              ]}
            >
              Salir
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
};

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    footer: {
      flexShrink:
        0,

      minHeight:
        44,

      borderTopWidth:
        1,

      paddingHorizontal:
        8,

      paddingVertical:
        6,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        8,

      zIndex:
        20,
    },

    logoContainer: {
      flex:
        1,

      minWidth:
        0,

      height:
        30,

      justifyContent:
        "center",
    },

    logo: {
      width:
        "100%",

      height:
        28,
    },

    logoutButton: {
      flexShrink:
        0,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        5,

      paddingHorizontal:
        6,

      paddingVertical:
        4,

      borderRadius:
        8,

      borderWidth:
        1,
    },

    logoutText: {
      fontSize:
        9,

      fontWeight:
        "600",
    },

    collapsedFooter: {
      flexShrink:
        0,

      borderTopWidth:
        1,

      paddingVertical:
        8,

      alignItems:
        "center",

      zIndex:
        20,
    },

    collapsedLogout: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      padding:
        6,

      borderRadius:
        8,

      borderWidth:
        1,
    },
  });