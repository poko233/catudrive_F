// components/ui/Shimmer.tsx
import React from "react";
import { View, StyleSheet, type DimensionValue } from "react-native";
import { Skeleton } from "moti/skeleton";
import { useTheme } from "../../theme/useTheme";

interface ShimmerProps {
  /** Ancho del placeholder (acepta números o strings como "100%") */
  width?: DimensionValue;
  /** Alto del placeholder */
  height?: DimensionValue;
  /** Radio de borde */
  radius?: number | "round";
  /** Si es true, muestra el shimmer; si false, muestra los children */
  loading: boolean;
  children: React.ReactNode;
}

/**
 * Componente de carga con efecto shimmer (esqueleto).
 * Utiliza Skeleton de Moti, que respeta el tema del sistema.
 *
 * @example
 * <Shimmer loading={isLoading} width={200} height={20}>
 *   <Text>Nombre: Juan Pérez</Text>
 * </Shimmer>
 *
 * @example Para múltiples elementos usar Skeleton.Group externamente.
 */
export const Shimmer: React.FC<ShimmerProps> = ({
  width = "100%" as DimensionValue,
  height = 20 as DimensionValue,
  radius = 8,
  loading,
  children,
}) => {
  const { theme } = useTheme();

  if (!loading) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.wrapper, { width, height }]}>
      <Skeleton
        colorMode={theme.dark ? "dark" : "light"}
        width={width}
        height={height}
        radius={radius}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: "center",
  },
});

export default Shimmer;
