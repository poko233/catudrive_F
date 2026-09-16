// screens/admin/perfil/PerfilScreen.tsx

import {
  useState,
} from "react";

import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  useRouter,
} from "expo-router";

import Toast from "react-native-toast-message";

import {
  PrinterSetupModal,
} from "@/components/PrinterConnection";

import {
  handleHttpUnauthorized,
} from "@/http/httpSession";

import {
  useModulesStore,
} from "@/store/modulesStore";

import {
  useResponsive,
} from "../../../hooks/useResponsive";

import {
  useTheme,
} from "../../../theme/useTheme";

import {
  ChangePasswordModal,
} from "./components/ChangePasswordModal";

import {
  InformacionPersonal,
} from "./components/InformacionPersonal";

import {
  PerfilHeader,
} from "./components/PerfilHeader";

import {
  QrProfileCard,
} from "./components/QrProfileCard";

import {
  ThemeSelectorCard,
} from "./components/ThemeSelectorCard";

export default function PerfilScreen() {
  const {
    theme,
  } =
    useTheme();

  const {
    isDesktop,
  } =
    useResponsive();

  const router =
    useRouter();

  const [
    passwordVisible,
    setPasswordVisible,
  ] =
    useState(
      false,
    );

  const [
    printerVisible,
    setPrinterVisible,
  ] =
    useState(
      false,
    );

  const handlePasswordChanged =
    async () => {
      setPasswordVisible(
        false,
      );

      try {
        await handleHttpUnauthorized();
      } catch (
        error
      ) {
        console.error(
          "Error limpiando sesión:",
          error,
        );
      }

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
          "Inicia sesión nuevamente",

        text2:
          "Utiliza tu nueva contraseña.",
      });
    };

  return (
    <ScrollView
      style={{
        flex:
          1,

        backgroundColor:
          theme.colors
            .background,
      }}

      contentContainerStyle={[
        styles.content,

        {
          paddingHorizontal:
            isDesktop
              ? 32
              : 14,
        },
      ]}

      showsVerticalScrollIndicator={
        false
      }
    >
      <View
        style={
          styles.container
        }
      >
        <PerfilHeader
          onChangePasswordPress={() =>
            setPasswordVisible(
              true,
            )
          }

          onPrinterPress={() =>
            setPrinterVisible(
              true,
            )
          }
        />

        <View
          style={[
            styles.grid,

            {
              flexDirection:
                isDesktop
                  ? "row"
                  : "column",
            },
          ]}
        >
          <View
            style={
              styles.info
            }
          >
            <InformacionPersonal />
          </View>

          <View
            style={[
              styles.qr,

              isDesktop &&
                styles.qrDesktop,
            ]}
          >
            <QrProfileCard />
          </View>
        </View>

        <ThemeSelectorCard />
      </View>

      <ChangePasswordModal
        visible={
          passwordVisible
        }

        onClose={() =>
          setPasswordVisible(
            false,
          )
        }

        onSuccess={
          handlePasswordChanged
        }
      />

      <PrinterSetupModal
        visible={
          printerVisible
        }

        required={
          false
        }

        requirement={
          null
        }

        onClose={() =>
          setPrinterVisible(
            false,
          )
        }
      />
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    content: {
      paddingTop:
        20,

      paddingBottom:
        36,
    },

    container: {
      width:
        "100%",

      maxWidth:
        1180,

      alignSelf:
        "center",

      gap:
        18,
    },

    grid: {
      gap:
        18,

      alignItems:
        "stretch",
    },

    info: {
      flex:
        2,

      minWidth:
        0,
    },

    qr: {
      minWidth:
        0,
    },

    qrDesktop: {
      flex:
        1,

      minWidth:
        280,
    },
  });
