import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import { MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import React from "react";
import {
  FlatList,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

export interface TableColumn {
  key: string;
  label: string;

  /**
   * Estilo que controla el ancho/flex de la columna.
   * Ejemplo:
   * { flex: 1 }
   * { width: 100 }
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Ancho del skeleton.
   * Ejemplo: "80%" o 100
   */
  skeletonWidth?: number | `${number}%`;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn[];

  loading?: boolean;

  /**
   * Renderiza cada fila.
   */
  renderRow: (item: T, index: number) => React.ReactElement;

  /**
   * Obtiene la key única de cada registro.
   */
  keyExtractor: (item: T, index: number) => string;

  /**
   * Mensaje cuando no existen registros.
   */
  emptyMessage?: string;

  /**
   * Cantidad de filas skeleton.
   */
  skeletonRows?: number;

  /**
   * Activar/desactivar animación de filas.
   */
  animated?: boolean;

  /**
   * Delay entre animaciones.
   */
  staggerDelay?: (index: number) => number;

  /**
   * Alto del skeleton.
   */
  skeletonHeight?: number;

  /**
   * Hace sticky el header.
   */
  stickyHeader?: boolean;

  /**
   * Mostrar scrollbar vertical.
   */
  showsVerticalScrollIndicator?: boolean;

  /**
   * Estilo extra para el contenedor.
   */
  containerStyle?: StyleProp<ViewStyle>;

  /**
   * Estilo extra para las filas skeleton.
   */
  rowStyle?: StyleProp<ViewStyle>;

  /**
   * Componente personalizado para estado vacío.
   */
  emptyComponent?: React.ReactElement | null;
}

export function Table<T>({
  data,
  columns,
  loading = false,
  renderRow,
  keyExtractor,
  emptyMessage = "No se encontraron registros",
  skeletonRows = 5,
  animated = true,
  staggerDelay,
  skeletonHeight = 16,
  stickyHeader = true,
  showsVerticalScrollIndicator = true,
  containerStyle,
  rowStyle,
  emptyComponent,
}: TableProps<T>) {
  const { theme } = useTheme();
  const c = theme.colors;

  const renderHeader = () => (
    <View
      style={[
        styles.headerRow,
        {
          backgroundColor: c.backgroundSecondary,
          borderBottomColor: c.border,
        },
      ]}
    >
      {columns.map((column) => (
        <View key={column.key} style={column.style}>
          <ThemedText
            style={[
              styles.headerText,
              {
                color: c.textSecondary,
              },
            ]}
            numberOfLines={1}
          >
            {column.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );

  const renderSkeletonRows = () =>
    Array.from({ length: skeletonRows }).map((_, rowIndex) => (
      <View
        key={`skeleton-${rowIndex}`}
        style={[
          styles.row,
          {
            borderBottomColor: c.border,
          },
          rowStyle,
        ]}
      >
        {columns.map((column) => (
          <View
            key={`${column.key}-${rowIndex}`}
            style={column.style}
          >
            <Skeleton
              colorMode={theme.dark ? "dark" : "light"}
              width={column.skeletonWidth ?? "80%"}
              height={skeletonHeight}
              radius={4}
            />
          </View>
        ))}
      </View>
    ));

  const renderEmptyState = () => {
    if (emptyComponent) {
      return emptyComponent;
    }

    return (
      <View style={styles.empty}>
        <ThemedText
          style={{
            color: c.textSecondary,
          }}
        >
          {emptyMessage}
        </ThemedText>
      </View>
    );
  };

  const renderAnimatedRow = (item: T, index: number) => {
    const row = renderRow(item, index);

    if (!animated) {
      return row;
    }

    return (
      <MotiView
        from={{
          opacity: 0,
          translateY: 10,
        }}
        animate={{
          opacity: 1,
          translateY: 0,
        }}
        transition={{
          type: "timing",
          duration: 300,
          delay: staggerDelay
            ? staggerDelay(index)
            : index * 40,
        }}
      >
        {row}
      </MotiView>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.card,
          borderColor: c.border,
        },
        containerStyle,
      ]}
    >
      {loading ? (
        <>
          {renderHeader()}
          {renderSkeletonRows()}
        </>
      ) : (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          stickyHeaderIndices={stickyHeader ? [0] : undefined}
          renderItem={({ item, index }) =>
            renderAnimatedRow(item, index)
          }
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={
            showsVerticalScrollIndicator
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },

  contentContainer: {
    paddingBottom: 8,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  headerText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },

  empty: {
    width: "100%",
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});