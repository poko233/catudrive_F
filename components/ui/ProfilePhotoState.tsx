// components/ui/ProfilePhotoState.tsx

import React from "react";

import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { Image } from "expo-image";

import {
  Camera,
  UserRound,
} from "lucide-react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";

import { Button } from "./Button";
import { Card } from "./Card";
import { Divider } from "./Divider";
import { EmptyState } from "./EmptyState";

export interface ProfilePhotoStateProps {
  photoUrl?: string | null;

  title?: string;
  subtitle?: string;

  emptyTitle?: string;
  emptySubtitle?: string;

  actionLabel?: string;
  emptyActionLabel?: string;

  onAction?: () => void;

  actionLoading?: boolean;
  actionDisabled?: boolean;

  imageSize?: number;

  style?: StyleProp<ViewStyle>;
}

export function ProfilePhotoState({
  photoUrl,

  title = "Foto de perfil",

  subtitle =
    "Fotografía asociada al usuario.",

  emptyTitle =
    "Sin foto de perfil",

  emptySubtitle =
    "Todavía no existe una fotografía registrada.",

  actionLabel =
    "Cambiar fotografía",

  emptyActionLabel =
    "Agregar fotografía",

  onAction,

  actionLoading = false,

  actionDisabled = false,

  imageSize = 220,

  style,
}: ProfilePhotoStateProps) {
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
            <UserRound
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

        {/* CON FOTO */}

        {photoUrl ? (
          <>
            <View
              style={[
                styles.photoShell,
                {
                  width: imageSize,
                  height: imageSize,

                  borderColor:
                    c.border,

                  backgroundColor:
                    c.backgroundSecondary,
                },
              ]}
            >
              <Image
                source={{
                  uri: photoUrl,
                }}
                style={styles.photo}
                contentFit="cover"
                transition={250}
              />
            </View>

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
          /* SIN FOTO */

          <View style={styles.empty}>
            <EmptyState
              icon="person-circle-outline"
              title={emptyTitle}
              subtitle={emptySubtitle}
            />

            {onAction ? (
              <Button
                title={emptyActionLabel}
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
          </View>
        )}
      </Card>
    </View>
  );
}

export default ProfilePhotoState;

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

    photoShell: {
      alignSelf: "center",

      overflow: "hidden",

      borderWidth: 1,

      borderRadius: 28,
    },

    photo: {
      width: "100%",
      height: "100%",
    },

    empty: {
      width: "100%",
      gap: 12,
    },
  });