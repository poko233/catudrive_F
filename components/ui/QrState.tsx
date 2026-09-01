// components/ui/QrState.tsx

import React from "react";

import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { Image } from "expo-image";

import {
  QrCode,
  ShieldCheck,
} from "lucide-react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";

import { Button } from "./Button";
import { Card } from "./Card";
import { Divider } from "./Divider";
import { EmptyState } from "./EmptyState";

export interface QrStateProps {
  qrUri?: string | null;

  title?: string;
  subtitle?: string;

  emptyTitle?: string;
  emptySubtitle?: string;

  securityText?: string;
  showSecurityMessage?: boolean;

  actionLabel?: string;
  onAction?: () => void;

  actionLoading?: boolean;
  actionDisabled?: boolean;

  style?: StyleProp<ViewStyle>;
}

export function QrState({
  qrUri,

  title = "Credencial digital",

  subtitle =
    "Identificación digital asociada a tu cuenta.",

  emptyTitle =
    "Sin credencial digital",

  emptySubtitle =
    "Todavía no existe un código QR registrado.",

  securityText =
    "Usa esta credencial únicamente para los accesos autorizados.",

  showSecurityMessage = true,

  actionLabel =
    "Descargar credencial",

  onAction,

  actionLoading = false,

  actionDisabled = false,

  style,
}: QrStateProps) {
  const { theme } =
    useTheme();

  const c =
    theme.colors;

  return (
    <View style={style}>
      <Card style={styles.card}>
        {/* HEADER */}

        <View style={styles.header}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor:
                  c.primarySubtle,
              },
            ]}
          >
            <QrCode
              size={21}
              color={c.primary}
            />
          </View>

          <View style={styles.headerCopy}>
            <ThemedText style={styles.title}>
              {title}
            </ThemedText>

            <ThemedText
              style={[
                styles.subtitle,
                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              {subtitle}
            </ThemedText>
          </View>
        </View>

        <Divider spacing={9} />

        {/* CON QR */}

        {qrUri ? (
          <>
            <View
              style={[
                styles.qrShell,
                {
                  borderColor:
                    c.border,
                },
              ]}
            >
              <Image
                source={{
                  uri: qrUri,
                }}
                style={styles.qrImage}
                contentFit="contain"
                transition={250}
              />
            </View>

            {showSecurityMessage ? (
              <View
                style={[
                  styles.securityBox,
                  {
                    backgroundColor:
                      c.backgroundSecondary,

                    borderColor:
                      c.border,
                  },
                ]}
              >
                <ShieldCheck
                  size={15}
                  color={c.success}
                />

                <ThemedText
                  style={[
                    styles.securityText,
                    {
                      color:
                        c.textSecondary,
                    },
                  ]}
                >
                  {securityText}
                </ThemedText>
              </View>
            ) : null}

            {onAction ? (
              <Button
                title={actionLabel}
                variant="secondary"
                loading={
                  actionLoading
                }
                disabled={
                  actionDisabled ||
                  actionLoading
                }
                onPress={onAction}
              />
            ) : null}
          </>
        ) : (
          /* SIN QR */

          <EmptyState
            icon="qr-code-outline"
            title={emptyTitle}
            subtitle={emptySubtitle}
          />
        )}
      </Card>
    </View>
  );
}

export default QrState;

const styles =
  StyleSheet.create({
    card: {
      width: "100%",
      alignItems: "stretch",
      gap: 2,
    },

    header: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    iconBox: {
      width: 42,
      height: 42,
      borderRadius: 13,

      alignItems: "center",
      justifyContent: "center",

      flexShrink: 0,
    },

    headerCopy: {
      flex: 1,
      minWidth: 0,
    },

    title: {
      fontSize: 18,
      fontWeight: "900",
    },

    subtitle: {
      marginTop: 3,

      fontSize: 11,
      lineHeight: 16,
    },

    qrShell: {
      width: "100%",
      maxWidth: 260,

      aspectRatio: 1,

      alignSelf: "center",

      padding: 12,

      borderRadius: 18,
      borderWidth: 1,

      backgroundColor:
        "#FFFFFF",
    },

    qrImage: {
      width: "100%",
      height: "100%",
    },

    securityBox: {
      width: "100%",

      flexDirection: "row",
      alignItems: "center",

      gap: 8,

      padding: 10,

      borderRadius: 11,
      borderWidth: 1,
    },

    securityText: {
      flex: 1,
      minWidth: 0,

      fontSize: 10,
      lineHeight: 15,
    },
  });