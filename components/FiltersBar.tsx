// components/ui/FiltersBar.tsx

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import { Filter, X } from "lucide-react-native";
import { AnimatePresence, MotiView } from "moti";
import { MotiPressable } from "moti/interactions";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

export interface FilterChip {
  key: string;
  label: string;
  onRemove?: () => void;
}

interface FiltersBarProps {
  /**
   * Número de filtros activos.
   */
  activeFiltersCount?: number;

  /**
   * Controles que estarán siempre visibles
   * al lado del botón Filtros.
   *
   * Ejemplo:
   * - Estado
   * - Categoría
   * - Carrera
   */
  rightContent?: React.ReactNode;

  /**
   * Contenido del panel desplegable.
   */
  children?: React.ReactNode;

  /**
   * Chips de filtros activos.
   */
  chips?: FilterChip[];

  /**
   * Limpia todos los filtros.
   */
  onClearFilters?: () => void;

  /**
   * Texto del botón limpiar.
   */
  clearLabel?: string;

  /**
   * Panel abierto inicialmente.
   */
  defaultOpen?: boolean;

  /**
   * Estilo general.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Estilo del panel.
   */
  panelStyle?: StyleProp<ViewStyle>;
}

/*
|--------------------------------------------------------------------------
| FILTER GROUP
|--------------------------------------------------------------------------
*/

interface FilterGroupProps {
  label?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function FilterGroup({
  label,
  children,
  style,
}: FilterGroupProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.filterGroup, style]}>
      {label ? (
        <ThemedText
          style={[
            styles.filterLabel,
            {
              color: c.textSecondary,
            },
          ]}
        >
          {label}
        </ThemedText>
      ) : null}

      {children}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| FILTERS BAR
|--------------------------------------------------------------------------
*/

export function FiltersBar({
  activeFiltersCount = 0,
  rightContent,
  children,
  chips = [],
  onClearFilters,
  clearLabel = "Limpiar filtros",
  defaultOpen = false,
  style,
  panelStyle,
}: FiltersBarProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [showFilters, setShowFilters] =
    useState(defaultOpen);

  const hasFilters = Boolean(children);

  const filterActive =
    showFilters || activeFiltersCount > 0;

  /*
  |--------------------------------------------------------------------------
  | WORKLET DE PRESS (HILO UI NATIVO)
  |--------------------------------------------------------------------------
  */

  const animatePress = useMemo(
    () =>
      ({ pressed }: { pressed: boolean }) => {
        "worklet";
        return {
          scale: pressed ? 0.95 : 1,
        };
      },
    [],
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.card,
          borderColor: c.border,
        },
        style,
      ]}
    >
      {/* ======================================================= */}
      {/* BARRA SUPERIOR */}
      {/* ======================================================= */}

      <View
        style={[
          styles.topBar,
          {
            borderBottomColor:
              showFilters && hasFilters
                ? c.border
                : "transparent",
          },
        ]}
      >
        {/* BOTÓN FILTROS */}

        {hasFilters ? (
          <MotiPressable
            onPress={() =>
              setShowFilters(
                (current) => !current,
              )
            }
            animate={animatePress}
            accessibilityRole="button"
            accessibilityLabel="Filtros"
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  filterActive
                    ? c.primary
                    : c.backgroundSecondary,

                borderColor:
                  filterActive
                    ? c.primary
                    : c.border,
              },
            ]}
          >
            <Filter
              size={17}
              color={
                filterActive
                  ? c.primaryForeground
                  : c.text
              }
            />

            <ThemedText
              style={[
                styles.filterButtonText,
                {
                  color:
                    filterActive
                      ? c.primaryForeground
                      : c.text,
                },
              ]}
            >
              Filtros
              {activeFiltersCount > 0
                ? ` (${activeFiltersCount})`
                : ""}
            </ThemedText>
          </MotiPressable>
        ) : null}

        {/* FILTROS RÁPIDOS / CONTENIDO DERECHO */}

        {rightContent ? (
          <View style={styles.rightContent}>
            {rightContent}
          </View>
        ) : null}
      </View>

      {/* ======================================================= */}
      {/* PANEL DE FILTROS */}
      {/* ======================================================= */}

      <AnimatePresence>
        {showFilters && hasFilters ? (
          <MotiView
            key="filters-panel"
            from={{
              opacity: 0,
              translateY: -6,
            }}
            animate={{
              opacity: 1,
              translateY: 0,
            }}
            exit={{
              opacity: 0,
              translateY: -6,
            }}
            transition={{
              type: "timing",
              duration: 180,
            }}
            style={[
              styles.filtersPanel,
              {
                backgroundColor:
                  c.backgroundSecondary,
                borderTopColor: c.border,
              },
              panelStyle,
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.filtersScroll
              }
            >
              {children}

              {/* LIMPIAR FILTROS */}

              {activeFiltersCount > 0 &&
              onClearFilters ? (
                <View
                  style={
                    styles.clearContainer
                  }
                >
                  <MotiPressable
                    onPress={onClearFilters}
                    animate={animatePress}
                    accessibilityRole="button"
                    accessibilityLabel={
                      clearLabel
                    }
                    style={[
                      styles.clearButton,
                      {
                        backgroundColor:
                          c.destructive,
                      },
                    ]}
                  >
                    <X
                      size={15}
                      color={
                        c.destructiveForeground
                      }
                    />

                    <ThemedText
                      style={[
                        styles.clearText,
                        {
                          color:
                            c.destructiveForeground,
                        },
                      ]}
                    >
                      {clearLabel}
                    </ThemedText>
                  </MotiPressable>
                </View>
              ) : null}
            </ScrollView>
          </MotiView>
        ) : null}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* CHIPS DE FILTROS ACTIVOS */}
      {/* ======================================================= */}

      {activeFiltersCount > 0 &&
      !showFilters &&
      chips.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[
            styles.chipsContainer,
            {
              borderTopColor: c.border,
            },
          ]}
          contentContainerStyle={
            styles.chipsContent
          }
        >
          {chips.map((chip) => (
            <View
              key={chip.key}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    c.backgroundSecondary,
                  borderColor: c.border,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.chipText,
                  {
                    color: c.text,
                  },
                ]}
              >
                {chip.label}
              </ThemedText>

              {chip.onRemove ? (
                <Pressable
                  onPress={chip.onRemove}
                  hitSlop={6}
                  style={styles.chipRemove}
                >
                  <X
                    size={14}
                    color={c.textSecondary}
                  />
                </Pressable>
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /*
  |--------------------------------------------------------------------------
  | CONTENEDOR
  |--------------------------------------------------------------------------
  */

  container: {
    width: "100%",

    borderWidth: 1,
    borderRadius: 12,

    overflow: "hidden",
  },

  /*
  |--------------------------------------------------------------------------
  | BARRA SUPERIOR
  |--------------------------------------------------------------------------
  */

  topBar: {
    minHeight: 54,

    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "wrap",

    gap: 8,

    paddingHorizontal: 12,
    paddingVertical: 8,

    borderBottomWidth: 1,
  },

  /*
  |--------------------------------------------------------------------------
  | BOTÓN FILTROS
  |--------------------------------------------------------------------------
  */

  filterButton: {
    minHeight: 38,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 6,

    paddingHorizontal: 14,
    paddingVertical: 8,

    borderWidth: 1,
    borderRadius: 20,
  },

  filterButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },

  /*
  |--------------------------------------------------------------------------
  | CONTENIDO DERECHO
  |--------------------------------------------------------------------------
  */

  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",

    gap: 8,
  },

  /*
  |--------------------------------------------------------------------------
  | PANEL
  |--------------------------------------------------------------------------
  */

  filtersPanel: {
    width: "100%",

    borderTopWidth: 1,

    paddingVertical: 12,
  },

  filtersScroll: {
    alignItems: "flex-end",

    gap: 14,

    paddingHorizontal: 16,
  },

  /*
  |--------------------------------------------------------------------------
  | GRUPOS
  |--------------------------------------------------------------------------
  */

  filterGroup: {
    minWidth: 100,

    flexDirection: "column",

    gap: 5,
  },

  filterLabel: {
    fontSize: 11,
    fontWeight: "600",
  },

  /*
  |--------------------------------------------------------------------------
  | LIMPIAR
  |--------------------------------------------------------------------------
  */

  clearContainer: {
    justifyContent: "flex-end",
  },

  clearButton: {
    height: 36,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 6,

    paddingHorizontal: 12,

    borderRadius: 18,
  },

  clearText: {
    fontSize: 12,
    fontWeight: "700",
  },

  /*
  |--------------------------------------------------------------------------
  | CHIPS
  |--------------------------------------------------------------------------
  */

  chipsContainer: {
    borderTopWidth: 1,

    paddingVertical: 8,
  },

  chipsContent: {
    gap: 6,

    paddingHorizontal: 16,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",

    gap: 6,

    paddingHorizontal: 10,
    paddingVertical: 5,

    borderWidth: 1,
    borderRadius: 16,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  chipRemove: {
    padding: 2,
  },
});