import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { MotiPressable } from "moti/interactions";
import React, { useMemo } from "react";
import {
  StyleSheet,
  View,
} from "react-native";

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
}

interface PaginationProps {
  meta: PaginationMeta;

  onPageChange: (page: number) => void;

  /**
   * Texto utilizado al final:
   * "Mostrando 1-10 de 50 registros"
   */
  itemLabel?: string;

  /**
   * Máximo número de páginas visibles.
   */
  maxVisiblePages?: number;

  /**
   * Permite ocultar el texto informativo.
   */
  showInfo?: boolean;
}

export function Pagination({
  meta,
  onPageChange,
  itemLabel = "registros",
  maxVisiblePages = 5,
  showInfo = true,
}: PaginationProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const totalPages = Math.max(
    1,
    Math.ceil(meta.total / meta.perPage),
  );

  const currentPage = Math.min(
    Math.max(meta.page, 1),
    totalPages,
  );

  const from =
    meta.total === 0
      ? 0
      : (currentPage - 1) * meta.perPage + 1;

  const to =
    meta.total === 0
      ? 0
      : Math.min(
          currentPage * meta.perPage,
          meta.total,
        );

  const pages = useMemo(() => {
    const visible = Math.min(
      maxVisiblePages,
      totalPages,
    );

    if (totalPages <= visible) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1,
      );
    }

    const half = Math.floor(visible / 2);

    let start = currentPage - half;

    start = Math.max(1, start);

    const maxStart =
      totalPages - visible + 1;

    start = Math.min(start, maxStart);

    return Array.from(
      { length: visible },
      (_, index) => start + index,
    );
  }, [
    currentPage,
    maxVisiblePages,
    totalPages,
  ]);

  const previousDisabled =
    currentPage <= 1 || meta.total === 0;

  const nextDisabled =
    currentPage >= totalPages ||
    meta.total === 0;

  /*
  |--------------------------------------------------------------------------
  | WORKLETS DE PRESS (HILO UI NATIVO)
  |--------------------------------------------------------------------------
  */

  const animatePrev = useMemo(
    () =>
      ({ pressed }: { pressed: boolean }) => {
        "worklet";
        return {
          scale: pressed && !previousDisabled ? 0.9 : 1,
        };
      },
    [previousDisabled],
  );

  const animateNext = useMemo(
    () =>
      ({ pressed }: { pressed: boolean }) => {
        "worklet";
        return {
          scale: pressed && !nextDisabled ? 0.9 : 1,
        };
      },
    [nextDisabled],
  );

  const animateNumber = useMemo(
    () =>
      ({ pressed }: { pressed: boolean }) => {
        "worklet";
        return {
          scale: pressed ? 0.9 : 1,
        };
      },
    [],
  );

  const changePage = (page: number) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === currentPage
    ) {
      return;
    }

    onPageChange(page);
  };

  return (
    <View
      style={[
        styles.footer,
        {
          borderTopColor: c.border,
          backgroundColor: c.card,
        },
      ]}
    >
      {showInfo ? (
        <ThemedText
          style={[
            styles.info,
            {
              color: c.textSecondary,
            },
          ]}
        >
          Mostrando {from}-{to} de{" "}
          {meta.total} {itemLabel}
        </ThemedText>
      ) : (
        <View />
      )}

      <View style={styles.buttons}>
        {/* ANTERIOR */}

        <MotiPressable
          disabled={previousDisabled}
          onPress={() =>
            changePage(currentPage - 1)
          }
          animate={animatePrev}
          accessibilityRole="button"
          accessibilityLabel="Página anterior"
          accessibilityState={{
            disabled: previousDisabled,
          }}
          style={[
            styles.pageButton,
            {
              backgroundColor:
                c.backgroundSecondary,
              borderColor: c.border,
              opacity: previousDisabled
                ? 0.4
                : 1,
            },
          ]}
        >
          <ChevronLeft
            size={18}
            color={c.textSecondary}
          />
        </MotiPressable>

        {/* NÚMEROS */}

        {pages.map((page) => {
          const active =
            page === currentPage;

          return (
            <MotiPressable
              key={page}
              onPress={() =>
                changePage(page)
              }
              animate={animateNumber}
              accessibilityRole="button"
              accessibilityLabel={`Página ${page}`}
              accessibilityState={{
                selected: active,
              }}
              style={[
                styles.pageNumber,
                {
                  backgroundColor: active
                    ? c.primary
                    : "transparent",
                  borderColor: active
                    ? c.primary
                    : c.border,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.pageText,
                  {
                    color: active
                      ? c.primaryForeground
                      : c.textSecondary,
                  },
                ]}
              >
                {page}
              </ThemedText>
            </MotiPressable>
          );
        })}

        {/* SIGUIENTE */}

        <MotiPressable
          disabled={nextDisabled}
          onPress={() =>
            changePage(currentPage + 1)
          }
          animate={animateNext}
          accessibilityRole="button"
          accessibilityLabel="Página siguiente"
          accessibilityState={{
            disabled: nextDisabled,
          }}
          style={[
            styles.pageButton,
            {
              backgroundColor:
                c.backgroundSecondary,
              borderColor: c.border,
              opacity: nextDisabled
                ? 0.4
                : 1,
            },
          ]}
        >
          <ChevronRight
            size={18}
            color={c.textSecondary}
          />
        </MotiPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,

    borderTopWidth: 1,

    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  info: {
    fontSize: 13,
  },

  buttons: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },

  pageButton: {
    width: 32,
    height: 32,

    borderWidth: 1,
    borderRadius: 8,

    alignItems: "center",
    justifyContent: "center",
  },

  pageNumber: {
    minWidth: 32,
    height: 32,

    paddingHorizontal: 8,

    borderWidth: 1,
    borderRadius: 8,

    alignItems: "center",
    justifyContent: "center",
  },

  pageText: {
    fontSize: 13,
    fontWeight: "700",
  },
});