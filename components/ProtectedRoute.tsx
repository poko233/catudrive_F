// components/ProtectedRoute.tsx
/*
import { Redirect, usePathname } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth, useAuthStore } from "@/store/authStore";
import { useTheme } from "../theme/useTheme";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, allowedRoutes, isAdmin } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  // Los administradores tienen acceso libre a todo el panel
  if (isAdmin) {
    return <>{children}</>;
  }

  const route = pathname.split("?")[0] || "/";
  const roles = useAuthStore.getState().roles;
  console.log("[ProtectedRoute]", {
    route,
    isAdmin,
    roles,
    allowedRoutes: [...allowedRoutes],
    blocked: allowedRoutes.size > 0 && !allowedRoutes.has(route) && route !== "/" && route !== "/403",
  });
  if (
    allowedRoutes.size > 0 &&
    !allowedRoutes.has(route) &&
    route !== "/" &&
    route !== "/403" &&
    route !== "/perfil"
  ) {
    return <Redirect href="/403" />;
  }

  return <>{children}</>;
}
*/

// components/ProtectedRoute.tsx
import {
  Redirect,
  usePathname,
} from "expo-router";

import React from "react";

import {
  ActivityIndicator,
  View,
} from "react-native";

import {
  useAuth,
  useAuthStore,
} from "@/store/authStore";

import {
  useTheme,
} from "../theme/useTheme";

interface ProtectedRouteProps {
  children:
    React.ReactNode;
}

export function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const {
    user,
    loading,
    allowedRoutes,
    isAdmin,
  } =
    useAuth();

  const {
    theme,
  } =
    useTheme();

  const pathname =
    usePathname();

  if (
    loading
  ) {
    return (
      <View
        style={{
          flex:
            1,

          justifyContent:
            "center",

          alignItems:
            "center",

          backgroundColor:
            theme
              .colors
              .background,
        }}
      >
        <ActivityIndicator
          size="large"

          color={
            theme
              .colors
              .primary
          }
        />
      </View>
    );
  }

  if (
    !user
  ) {
    return (
      <Redirect
        href="/login"
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN
  |--------------------------------------------------------------------------
  */

  if (
    isAdmin
  ) {
    return (
      <>
        {
          children
        }
      </>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RUTA ACTUAL
  |--------------------------------------------------------------------------
  */

  const route =
    pathname.split(
      "?",
    )[0] ||
    "/";

  /*
  |--------------------------------------------------------------------------
  | RUTAS INTERNAS
  |--------------------------------------------------------------------------
  |
  | Estas pantallas no necesitan convertirse en formularios independientes.
  | Heredan el permiso del formulario principal.
  |
  */

  const internalRoutes:
    Record<
      string,
      string
    > = {
      "/encomiendas-reportes":
        "/encomiendas",
    };

  const parentRoute =
    internalRoutes[
      route
    ];

  /*
  |--------------------------------------------------------------------------
  | ACCESO
  |--------------------------------------------------------------------------
  */

  const hasRouteAccess =
    allowedRoutes.has(
      route,
    ) ||
    (
      !!parentRoute &&
      allowedRoutes.has(
        parentRoute,
      )
    );

  const roles =
    useAuthStore
      .getState()
      .roles;

  console.log(
    "[ProtectedRoute]",
    {
      route,

      isAdmin,

      roles,

      parentRoute,

      hasRouteAccess,

      allowedRoutes:
        [
          ...allowedRoutes,
        ],

      blocked:
        allowedRoutes.size >
          0 &&
        !hasRouteAccess &&
        route !== "/" &&
        route !== "/403" &&
        route !==
          "/perfil",
    },
  );

  /*
  |--------------------------------------------------------------------------
  | BLOQUEAR
  |--------------------------------------------------------------------------
  */

  if (
    allowedRoutes.size >
      0 &&
    !hasRouteAccess &&
    route !== "/" &&
    route !== "/403" &&
    route !==
      "/perfil"
  ) {
    return (
      <Redirect
        href="/403"
      />
    );
  }

  return (
    <>
      {
        children
      }
    </>
  );
}