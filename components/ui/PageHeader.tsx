// components/ui/PageHeader.tsx

import React from "react";
import {
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";

import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card } from "./Card";

export type PageHeaderBadgeVariant =
  | "success"
  | "warning"
  | "muted"
  | "info"
  | "destructive";

export type PageHeaderButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "ghost";

export type PageHeaderAction = {
  title: string;
  onPress: () => void;
  variant?: PageHeaderButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export type PageHeaderProps = {
  title: string;
  description?: string;

  badge?: string;
  badgeVariant?: PageHeaderBadgeVariant;

  action?: PageHeaderAction;
  secondaryAction?: PageHeaderAction;

  rightContent?: React.ReactNode;

  breakpoint?: number;

  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function PageHeader({
  title,
  description,
  badge,
  badgeVariant = "info",
  action,
  secondaryAction,
  rightContent,
  breakpoint = 720,
  style,
  contentStyle,
}: PageHeaderProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const { width } = useWindowDimensions();
  const compact = width < breakpoint;

  const hasRightContent =
    !!rightContent || !!secondaryAction || !!action;

  return (
    <View style={style}>
      <Card>
        <View
          style={[
            styles.content,
            compact && styles.contentCompact,
            contentStyle,
          ]}
        >
          <View
            style={[
              styles.copy,
              compact && styles.copyCompact,
            ]}
          >
            {badge ? (
              <View style={styles.badge}>
                <Badge
                  label={badge}
                  variant={badgeVariant}
                />
              </View>
            ) : null}

            <ThemedText
              style={[
                styles.title,
                compact && styles.titleCompact,
              ]}
            >
              {title}
            </ThemedText>

            {description ? (
              <ThemedText
                style={[
                  styles.description,
                  { color: c.textSecondary },
                  compact && styles.descriptionCompact,
                ]}
              >
                {description}
              </ThemedText>
            ) : null}
          </View>

          {hasRightContent ? (
            <View
              style={[
                styles.actions,
                compact && styles.actionsCompact,
              ]}
            >
              {rightContent}

              {secondaryAction ? (
                <Button
                  title={secondaryAction.title}
                  variant={secondaryAction.variant ?? "secondary"}
                  loading={secondaryAction.loading}
                  disabled={secondaryAction.disabled}
                  accessibilityLabel={
                    secondaryAction.accessibilityLabel ??
                    secondaryAction.title
                  }
                  onPress={secondaryAction.onPress}
                />
              ) : null}

              {action ? (
                <Button
                  title={action.title}
                  variant={action.variant ?? "primary"}
                  loading={action.loading}
                  disabled={action.disabled}
                  accessibilityLabel={
                    action.accessibilityLabel ??
                    action.title
                  }
                  onPress={action.onPress}
                />
              ) : null}
            </View>
          ) : null}
        </View>
      </Card>
    </View>
  );
}

export default PageHeader;

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  contentCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  copy: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
    gap: 6,
  },

  copyCompact: {
    width: "100%",
  },

  badge: {
    alignSelf: "flex-start",
  },

  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
  },

  titleCompact: {
    fontSize: 22,
    lineHeight: 28,
  },

  description: {
    maxWidth: 760,
    fontSize: 13,
    lineHeight: 19,
  },

  descriptionCompact: {
    maxWidth: "100%",
  },

  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    flexShrink: 0,
  },

  actionsCompact: {
    width: "100%",
    justifyContent: "flex-start",
  },
});
