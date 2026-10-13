// screens/admin/perfil/components/mobile/PerfilMobileScreen.tsx

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  Moon,
  Printer as PrinterIcon,
  QrCode,
  User,
} from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

import {
  PrinterSetupModal,
  usePrinterConnection,
} from "@/components/PrinterConnection";
import { Badge } from "@/components/ui/Badge";
import { ThemedText } from "@/components/ThemedText";
import { handleHttpUnauthorized } from "@/http/httpSession";
import { useAuth } from "@/store/authStore";
import { useModulesStore } from "@/store/modulesStore";
import { useTheme } from "@/theme/useTheme";
import type { ThemeName } from "@/theme/types";

import { AbrirArqueoModal } from "../../../arqueo/components/AbrirArqueoModal";
import { DetalleArqueoModal } from "../../../arqueo/components/DetalleArqueoModal";
import { useArqueoStore } from "../../../arqueo/store/arqueoStore";

import { ChangePasswordModal } from "../ChangePasswordModal";

import { usePerfilData } from "../../hooks/usePerfilData";

import { PerfilMobileHero } from "./PerfilMobileHero";
import { PerfilMobileMenuRow } from "./PerfilMobileMenuRow";
import { PerfilMobileStatsBanner } from "./PerfilMobileStatsBanner";

export type PerfilMobileSection = "info" | "qr" | "theme" | null;

type Props = {
  onOpenSection: (section: PerfilMobileSection) => void;
};

const themeLabel = (name: ThemeName): string =>
  name === "light"
    ? "Claro"
    : name === "dark"
      ? "Oscuro"
      : name === "premium"
        ? "Premium"
        : String(name);

export function PerfilMobileScreen({ onOpenSection }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const router = useRouter();
  const { logout } = useAuth();

  const data = usePerfilData();

  const printer = usePrinterConnection();

  const printerName =
    printer.activePrinter?.name ??
    printer.defaultPrinter?.name ??
    "Sin impresora";

  const printerConnected = printer.activePrinter?.status === "connected";

  const abierto = useArqueoStore((s) => s.abierto);
  const syncing = useArqueoStore((s) => s.syncing);
  const fetchAbierto = useArqueoStore((s) => s.fetchAbierto);
  const syncAbierto = useArqueoStore((s) => s.syncAbierto);

  const tieneArqueo = abierto !== null;

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [printerVisible, setPrinterVisible] = useState(false);

  const [arqueoOpenVisible, setArqueoOpenVisible] = useState(false);
  const [arqueoDetailVisible, setArqueoDetailVisible] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    void fetchAbierto();
  }, [fetchAbierto]);

  const handleArqueoPress = useCallback(async () => {
    if (syncing) return;

    const actual = useArqueoStore.getState().abierto;
    if (actual) {
      setArqueoDetailVisible(true);
      return;
    }

    const fresco = await syncAbierto();
    if (fresco) setArqueoDetailVisible(true);
    else setArqueoOpenVisible(true);
  }, [syncing, syncAbierto]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await logout();
      useModulesStore.getState().clearModulos();
      router.replace("/");
      Toast.show({ type: "success", text1: "Sesión cerrada" });
    } catch (error) {
      console.error(error);
      Toast.show({ type: "error", text1: "No se pudo cerrar la sesión" });
    } finally {
      setLoggingOut(false);
    }
  }, [loggingOut, logout, router]);

  const handlePasswordChanged = useCallback(async () => {
    setPasswordVisible(false);

    try {
      await handleHttpUnauthorized();
    } catch (error) {
      console.error("Error limpiando sesión:", error);
    }

    useModulesStore.getState().clearModulos();
    router.replace("/");

    Toast.show({
      type: "success",
      text1: "Inicia sesión nuevamente",
      text2: "Utiliza tu nueva contraseña.",
    });
  }, [router]);

  const bannerDetail =
    [
      data.ciExpedido ? `CI ${data.ciExpedido}` : null,
      data.celular && data.celular !== "No registrado"
        ? `Tel ${data.celular}`
        : data.telefono && data.telefono !== "No registrado"
          ? `Tel ${data.telefono}`
          : null,
    ]
      .filter(Boolean)
      .join(" • ") || "Sin datos";

  const idTag = data.usuario ? data.usuario.toUpperCase() : "—";

  return (
    <View style={styles.container}>
      <PerfilMobileHero
        nombreCompleto={data.nombreCompleto}
        roles={data.roles}
        foto={data.foto}
        tieneArqueo={tieneArqueo}
        arqueoId={abierto?.id ?? null}
        syncingArqueo={syncing}
        loggingOut={loggingOut}
        onArqueoPress={() => void handleArqueoPress()}
        onPasswordPress={() => setPasswordVisible(true)}
        onLogoutPress={() => void handleLogout()}
      />

      <PerfilMobileStatsBanner detail={bannerDetail} />

      <View style={styles.menuSection}>
        <ThemedText style={[styles.sectionLabel, { color: c.textSecondary }]}>
          Menú de Configuración
        </ThemedText>

        <View style={styles.menuList}>
          <PerfilMobileMenuRow
            icon={User}
            title="Información Personal"
            subtitle="Carnet CI, celular, correo y domicilio"
            onPress={() => onOpenSection("info")}
            delay={0}
          />

          <PerfilMobileMenuRow
            icon={QrCode}
            title="Credencial Digital QR"
            subtitle="Carnet de accesos autorizados y descarga"
            titleSuffix={
              data.codigoQr ? (
                <View style={[styles.dot, { backgroundColor: c.success }]} />
              ) : undefined
            }
            trailing={
              data.codigoQr ? (
                <Badge
                  label="Listo"
                  variant="success"
                  appearance="soft"
                  size="sm"
                />
              ) : undefined
            }
            onPress={() => onOpenSection("qr")}
            delay={60}
          />

          <PerfilMobileMenuRow
            icon={Moon}
            title="Apariencia y Tema"
            subtitle="Modo Oscuro, Claro o Celeste Catu"
            trailing={
              <View
                style={[
                  styles.themeChip,
                  {
                    backgroundColor: `${c.primary}18`,
                    borderColor: `${c.primary}55`,
                  },
                ]}
              >
                <View style={[styles.dot, { backgroundColor: c.primary }]} />
                <ThemedText
                  style={[styles.themeChipText, { color: c.primary }]}
                  numberOfLines={1}
                >
                  {themeLabel(theme.name as ThemeName)}
                </ThemedText>
              </View>
            }
            onPress={() => onOpenSection("theme")}
            delay={120}
          />

          <PerfilMobileMenuRow
            icon={PrinterIcon}
            title="Impresora Fiscal y POS"
            subtitle={
              printerConnected
                ? "Conectada • Impresión directa"
                : "Sin conexión • Toca para configurar"
            }
            trailing={
              <View
                style={[
                  styles.monoChip,
                  {
                    backgroundColor: c.backgroundTertiary,
                    borderColor: printerConnected ? `${c.success}66` : c.border,
                    maxWidth: 120,
                  },
                ]}
              >
                <ThemedText
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.monoChipText,
                    { color: printerConnected ? c.success : c.textSecondary },
                  ]}
                >
                  {printerName}
                </ThemedText>
              </View>
            }
            onPress={() => setPrinterVisible(true)}
            delay={180}
          />
        </View>
      </View>

      <PrinterSetupModal
        visible={printerVisible}
        required={false}
        requirement={null}
        onClose={() => setPrinterVisible(false)}
      />

      <ChangePasswordModal
        visible={passwordVisible}
        onClose={() => setPasswordVisible(false)}
        onSuccess={handlePasswordChanged}
      />

      <AbrirArqueoModal
        visible={arqueoOpenVisible}
        onClose={() => setArqueoOpenVisible(false)}
      />

      <DetalleArqueoModal
        visible={arqueoDetailVisible}
        arqueoId={abierto?.id ?? null}
        onClose={() => setArqueoDetailVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  menuSection: { gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 2,
  },
  menuList: { gap: 8 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  themeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  themeChipText: {
    fontSize: 10,
    fontWeight: "700",
  },
  monoChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  monoChipText: {
    fontSize: 10,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 4,
  },
  footerText: { fontSize: 10 },
});

export default PerfilMobileScreen;
