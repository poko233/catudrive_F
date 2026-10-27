// components/BanecoQrPaymentModal.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal as RNModal, Platform, StyleSheet, View } from "react-native";

import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  QrCode,
  ShieldAlert,
  X,
} from "lucide-react-native";

import { MotiView } from "moti";
import Toast from "react-native-toast-message";

import { AnimatedBlock } from "@/components/ui/AnimatedBlock";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { ThemedText } from "@/components/ThemedText";

import { haptics } from "@/animations/haptics";

import { useActiveSucursalToken } from "@/screens/admin/empresa/hooks/useActiveSucursalToken";

import {
  banecoService,
  isQrPaid,
} from "@/screens/admin/empresa/services/baneco/baneco.service";

import type { BanecoCurrency } from "@/screens/admin/empresa/services/baneco/baneco.types";

import { empresaService } from "@/screens/admin/empresa/services/empresaService";

import { useTheme } from "@/theme/useTheme";
import { useAuthStore } from "@/store/authStore";
import { useEmpresaStore } from "@/store/empresaStore";

const TIEMPO_ESPERA = 5000;

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

export type BanecoQrPaymentPhase =
  | "loading"
  | "waiting"
  | "verifying"
  | "paid"
  | "error"
  | "no-token";

export interface BanecoQrPaymentModalProps {
  visible: boolean;
  monto: number;
  moneda?: BanecoCurrency;
  descripcion?: string;
  onSuccess?: (qrId: string | null, transactionId: string | null) => void;
  onCancel?: () => void;
  onClose: () => void;
  pollIntervalMs?: number;
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

function formatMoney(amount: number, currency: BanecoCurrency): string {
  const symbol = currency === "BOB" ? "Bs" : "$";
  return `${symbol} ${amount.toFixed(2)}`;
}

function formatQrImage(base64: string | undefined): string | null {
  if (!base64) return null;
  if (base64.startsWith("data:image")) return base64;
  return `data:image/png;base64,${base64}`;
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function BanecoQrPaymentModal({
  visible,
  monto,
  moneda = "BOB",
  descripcion,
  onSuccess,
  onCancel,
  onClose,
  pollIntervalMs = TIEMPO_ESPERA,
}: BanecoQrPaymentModalProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const { sucursalId, token, sucursalNombre } = useActiveSucursalToken();

  const [phase, setPhase] = useState<BanecoQrPaymentPhase>("loading");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrId, setQrId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [countdown, setCountdown] = useState(Math.ceil(pollIntervalMs / 1000));
  const [isCancelling, setIsCancelling] = useState(false);

  // Refs para evitar re-renders y controlar peticiones
  const onSuccessRef = useRef(onSuccess);
  const hasAnnulledRef = useRef(false);
  const isMountedRef = useRef(true);
  const generateAbortRef = useRef<AbortController | null>(null);
  const verifyAbortRef = useRef<AbortController | null>(null);

  const stateRef = useRef<{
    qrId: string | null;
    phase: BanecoQrPaymentPhase;
    token: string | null;
  }>({ qrId: null, phase: "loading", token: null });

  // Mantenemos actualizado onSuccess para evitar reinicios del contador
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Actualizamos el estado interno para el cleanup
  useEffect(() => {
    stateRef.current = { qrId, phase, token };
  }, [qrId, phase, token]);

  // Control de desmontaje
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      generateAbortRef.current?.abort();
      verifyAbortRef.current?.abort();
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FUNCIÓN CENTRAL DE VERIFICACIÓN (CON CANCELACIÓN)
  |--------------------------------------------------------------------------
  */
  const triggerVerification = useCallback(
    async (isManual = false) => {
      if (!qrId || !token || !isMountedRef.current) return;

      // 1. Cancelar cualquier petición en vuelo antes de lanzar una nueva
      if (verifyAbortRef.current) {
        verifyAbortRef.current.abort();
      }
      const controller = new AbortController();
      verifyAbortRef.current = controller;

      if (isManual) setPhase("verifying");

      try {
        const result = await banecoService.verifyQr(
          token,
          qrId,
          controller.signal,
        );

        if (controller.signal.aborted || !isMountedRef.current) return;

        if (isQrPaid(result)) {
          setPhase("paid");
          haptics.success();
          onSuccessRef.current?.(qrId, transactionId ?? result.qr_id);
        } else {
          // Si el pago aún no se refleja
          if (isManual) {
            haptics.light();
            Toast.show({
              type: "info",
              text1: "Pago aún no registrado",
              text2: "El banco todavía no confirma el pago. Reintentando...",
            });
            setPhase("waiting");
            setCountdown(Math.ceil(pollIntervalMs / 1000)); // Reinicia contador
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError" || !isMountedRef.current) return;

        if (isManual) {
          haptics.error();
          Toast.show({
            type: "error",
            text1: "No se pudo verificar el pago",
            text2: errorMessage(error, "Revisa la conexión."),
          });
          setPhase("waiting");
          setCountdown(Math.ceil(pollIntervalMs / 1000));
        }
      }
    },
    [qrId, token, transactionId, pollIntervalMs],
  );

  /*
  |--------------------------------------------------------------------------
  | GENERAR QR AL ABRIR
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!visible) return;

    hasAnnulledRef.current = false;
    setPhase("loading");
    setQrImage(null);
    setQrId(null);
    setTransactionId(null);
    setErrorMsg(null);
    setCountdown(Math.ceil(pollIntervalMs / 1000));

    const run = async () => {
      generateAbortRef.current = new AbortController();
      try {
        if (!useEmpresaStore.getState().tokensLoaded) {
          await empresaService.getMiEmpresa();
        }

        const currentSucursalId = useAuthStore.getState().sucursalId;
        const activeToken =
          currentSucursalId !== null
            ? (useEmpresaStore.getState().apiTokensBySucursal[
                currentSucursalId
              ] ?? null)
            : null;

        if (!activeToken) {
          if (isMountedRef.current) setPhase("no-token");
          return;
        }

        const result = await banecoService.generateQr(
          {
            token: activeToken,
            monto,
            moneda,
            descripcion,
          },
          generateAbortRef.current.signal,
        );

        if (!isMountedRef.current) return;

        setQrId(result.qr_id);
        setTransactionId(result.transaction_id);
        setQrImage(formatQrImage(result.qr_image));
        setPhase("waiting");
      } catch (error: any) {
        if (error.name === "AbortError" || !isMountedRef.current) return;
        haptics.error();
        setPhase("error");
        setErrorMsg(errorMessage(error, "No se pudo generar el código QR."));
      }
    };

    void run();

    return () => {
      const current = stateRef.current;
      // Si el usuario cierra el modal, abortamos la generación y anulamos si se creó
      if (
        current.qrId &&
        current.token &&
        current.phase !== "paid" &&
        current.phase !== "no-token" &&
        !hasAnnulledRef.current
      ) {
        hasAnnulledRef.current = true;
        void banecoService.annulQr(current.token, current.qrId).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, monto, moneda, descripcion]);

  /*
  |--------------------------------------------------------------------------
  | CONTADOR REGRESIVO
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!visible || phase !== "waiting") return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Al llegar a 0, disparamos la verificación automática
          triggerVerification(false);
          return Math.ceil(pollIntervalMs / 1000); // Reinicio visual
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, phase, pollIntervalMs, triggerVerification]);

  /*
  |--------------------------------------------------------------------------
  | CANCELAR (ANTI DOBLE CLICK)
  |--------------------------------------------------------------------------
  */
  const handleCancel = useCallback(async () => {
    if (isCancelling) return;
    setIsCancelling(true);

    // Abortar cualquier verificación en curso
    verifyAbortRef.current?.abort();

    if (
      qrId &&
      token &&
      phase !== "paid" &&
      phase !== "no-token" &&
      !hasAnnulledRef.current
    ) {
      hasAnnulledRef.current = true;
      try {
        await banecoService.annulQr(token, qrId);
      } catch (error) {
        console.warn("[BanecoQrPaymentModal] annul failed", error);
      }
    }

    onCancel?.();
    onClose();
  }, [qrId, token, phase, onCancel, onClose, isCancelling]);

  const handleManualConfirm = useCallback(() => {
    haptics.success();
    setPhase("paid");
    onSuccessRef.current?.(null, null);
  }, []);

  const handleContinue = useCallback(() => onClose(), [onClose]);

  const amountLabel = formatMoney(monto, moneda);

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (phase === "paid") {
          onClose();
          return;
        }
        void handleCancel();
      }}
    >
      <View
        style={[
          styles.backdrop,
          { backgroundColor: c.overlay ?? "rgba(0,0,0,0.75)" },
        ]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={[c.background, c.backgroundSecondary]}
          style={StyleSheet.absoluteFill}
        />

        {/* HEADER */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View
              style={[styles.brandIcon, { backgroundColor: c.primarySubtle }]}
            >
              <QrCode size={20} color={c.primary} />
            </View>

            <View style={{ flexShrink: 1 }}>
              <ThemedText style={styles.brandTitle}>Pago con QR</ThemedText>
              <ThemedText
                numberOfLines={1}
                style={[styles.brandSubtitle, { color: c.textSecondary }]}
              >
                {sucursalNombre
                  ? `Sucursal: ${sucursalNombre}`
                  : "Confirma el pago desde tu banca móvil"}
              </ThemedText>
            </View>
          </View>

          {phase !== "paid" && (
            <IconButton
              icon={X}
              variant="secondary"
              disabled={isCancelling}
              accessibilityLabel="Cerrar"
              onPress={() => void handleCancel()}
            />
          )}
        </View>

        {/* CONTENIDO */}
        <View style={styles.centerContent}>
          <AnimatedBlock
            preset="scaleIn"
            duration={280}
            style={styles.cardWrap}
          >
            <Card style={styles.card}>
              <View style={styles.amountBlock}>
                <ThemedText
                  style={[styles.amountLabel, { color: c.textSecondary }]}
                >
                  Total a pagar
                </ThemedText>
                <ThemedText style={styles.amountValue}>
                  {amountLabel}
                </ThemedText>
              </View>

              {phase === "loading" && <LoadingPhase />}

              {phase === "no-token" && (
                <NoTokenPhase
                  sucursalNombre={sucursalNombre ?? "esta sucursal"}
                />
              )}

              {phase === "error" && (
                <ErrorPhase message={errorMsg ?? "Ocurrió un error."} />
              )}

              {phase === "paid" && <PaidPhase manual={qrId === null} />}

              {(phase === "waiting" || phase === "verifying") && (
                <QrPhase
                  qrImage={qrImage}
                  phase={phase}
                  countdown={countdown}
                />
              )}

              {/* ACCIONES */}

              {phase === "paid" && (
                <View style={styles.actionsRow}>
                  <Button title="Continuar" onPress={handleContinue} />
                </View>
              )}

              {phase === "no-token" && (
                <View style={styles.actionsRow}>
                  <View style={styles.actionButton}>
                    <Button
                      title="Cancelar"
                      variant="secondary"
                      disabled={isCancelling}
                      onPress={() => {
                        onCancel?.();
                        onClose();
                      }}
                    />
                  </View>
                  <View style={styles.actionButton}>
                    <Button
                      title="Confirmar pago manualmente"
                      onPress={handleManualConfirm}
                    />
                  </View>
                </View>
              )}

              {phase === "error" && (
                <View style={styles.actionsRow}>
                  <Button
                    title="Cerrar"
                    variant="secondary"
                    disabled={isCancelling}
                    onPress={() => void handleCancel()}
                  />
                </View>
              )}

              {(phase === "waiting" || phase === "verifying") && (
                <View style={styles.actionsRow}>
                  <View style={styles.actionButton}>
                    <Button
                      title="Cancelar"
                      variant="secondary"
                      loading={isCancelling}
                      disabled={phase === "verifying" || isCancelling}
                      onPress={() => void handleCancel()}
                    />
                  </View>
                  <View style={styles.actionButton}>
                    <Button
                      title="Confirmar pago"
                      loading={phase === "verifying"}
                      disabled={!qrImage || isCancelling}
                      onPress={() => triggerVerification(true)}
                    />
                  </View>
                </View>
              )}
            </Card>
          </AnimatedBlock>
        </View>
      </View>
    </RNModal>
  );
}

/*
|--------------------------------------------------------------------------
| SUB-COMPONENTES
|--------------------------------------------------------------------------
*/

function LoadingPhase() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.phaseBox}>
      <View
        style={[
          styles.qrShell,
          {
            backgroundColor: c.backgroundSecondary,
            borderColor: c.border,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          },
        ]}
      >
        <Loader2 size={44} color={c.primary} />
        <ThemedText style={[styles.phaseText, { color: c.textSecondary }]}>
          Generando QR…
        </ThemedText>
      </View>
    </View>
  );
}

function NoTokenPhase({ sucursalNombre }: { sucursalNombre: string }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.phaseBox}>
      <View
        style={[
          styles.qrShell,
          {
            backgroundColor: c.backgroundSecondary,
            borderColor: c.warning,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: 20,
          },
        ]}
      >
        <ShieldAlert size={56} color={c.warning} />
        <ThemedText style={styles.noTokenTitle}>
          Sin token de pasarela
        </ThemedText>
        <ThemedText
          style={[
            styles.phaseText,
            { color: c.textSecondary, textAlign: "center" },
          ]}
        >
          La sucursal «{sucursalNombre}» no tiene token de pasarela configurado.
          Si ya recibiste el pago por otro medio, puedes confirmar la venta
          manualmente.
        </ThemedText>
      </View>
    </View>
  );
}

function ErrorPhase({ message }: { message: string }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.phaseBox}>
      <View
        style={[
          styles.qrShell,
          {
            backgroundColor: c.backgroundSecondary,
            borderColor: c.border,
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: 20,
          },
        ]}
      >
        <AlertTriangle size={40} color={c.destructive} />
        <ThemedText
          style={[styles.phaseText, { color: c.text, textAlign: "center" }]}
        >
          {message}
        </ThemedText>
      </View>
    </View>
  );
}

function PaidPhase({ manual }: { manual: boolean }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.phaseBox}>
      <View
        style={[
          styles.qrShell,
          {
            backgroundColor: c.backgroundSecondary,
            borderColor: c.success,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: 20,
          },
        ]}
      >
        <CheckCircle2 size={72} color={c.success} />
        <ThemedText style={styles.paidTitle}>
          {manual ? "Pago confirmado manualmente" : "¡Pago confirmado!"}
        </ThemedText>
        <ThemedText
          style={[
            styles.phaseText,
            { color: c.textSecondary, textAlign: "center" },
          ]}
        >
          {manual
            ? "Venta confirmada sin pasarela. El operador asumió la responsabilidad del cobro."
            : "El banco confirmó la transacción."}
        </ThemedText>
      </View>
    </View>
  );
}

function QrPhase({
  qrImage,
  phase,
  countdown,
}: {
  qrImage: string | null;
  phase: "waiting" | "verifying";
  countdown: number;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.phaseBox}>
      <View
        style={[
          styles.qrShell,
          { backgroundColor: "#FFFFFF", borderColor: c.border },
        ]}
      >
        {qrImage ? (
          <Image
            source={{ uri: qrImage }}
            style={styles.qrImage}
            contentFit="contain"
            transition={200}
            cachePolicy="memory"
          />
        ) : null}
      </View>

      <MotiView
        from={{ opacity: 0.35 }}
        animate={{ opacity: [0.35, 1, 0.35] }}
        transition={{ type: "timing", duration: 1400, loop: true }}
        style={styles.pollingIndicator}
      >
        <View style={[styles.dot, { backgroundColor: c.primary }]} />
        <ThemedText style={[styles.pollingText, { color: c.textSecondary }]}>
          {phase === "verifying"
            ? "Verificando con el banco…"
            : `Reintentando en ${countdown} segundos…`}
        </ThemedText>
      </MotiView>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "web" ? 20 : 52,
    paddingBottom: 12,
    gap: 12,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: { fontSize: 16, fontWeight: "900" },
  brandSubtitle: { fontSize: 11, marginTop: 2 },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  cardWrap: { width: "100%", maxWidth: 460 },
  card: { width: "100%", gap: 18, padding: 20 },
  amountBlock: { alignItems: "center", gap: 4 },
  amountLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  amountValue: { fontSize: 30, lineHeight: 36, fontWeight: "900" },
  phaseBox: { width: "100%", alignItems: "center", gap: 14 },
  qrShell: {
    width: 280,
    height: 280,
    maxWidth: "100%",
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    padding: 10,
  },
  qrImage: { width: "100%", height: "100%" },
  phaseText: { fontSize: 12, textAlign: "center", lineHeight: 17 },
  paidTitle: { fontSize: 18, fontWeight: "900", textAlign: "center" },
  noTokenTitle: { fontSize: 16, fontWeight: "900", textAlign: "center" },
  pollingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pollingText: { fontSize: 12, fontWeight: "600" },
  actionsRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: { flex: 1, minWidth: 140 },
});
