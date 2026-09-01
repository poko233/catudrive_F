import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../../theme/useTheme";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: c.backgroundTertiary,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonRolCard() {
  return (
    <View style={skStyles.card}>
      <View style={skStyles.row}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={skStyles.lines}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={11} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={52} height={20} borderRadius={10} />
      </View>
      <View style={{ marginTop: 12, gap: 8 }}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={skStyles.tableRow}>
            <Skeleton width="35%" height={12} />
            {[1, 2, 3, 4].map((j) => (
              <Skeleton key={j} width={28} height={28} borderRadius={8} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const skStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lines: { flex: 1, gap: 6 },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
