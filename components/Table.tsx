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

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

export type TableColumnAlign =
  | "left"
  | "center"
  | "right";

/*
|--------------------------------------------------------------------------
| COLUMNA
|--------------------------------------------------------------------------
*/

export interface TableColumn {
  key: string;

  label: string;

  /**
   * Peso proporcional de la columna.
   *
   * Recomendado para tablas responsive.
   *
   * Ejemplo:
   *
   * flex: 1
   * flex: 1.5
   * flex: 0.7
   */
  flex?: number;

  /**
   * Ancho fijo opcional.
   *
   * Solamente usar cuando realmente
   * se necesite un ancho fijo.
   */
  width?: number;

  /**
   * Alineación de la información.
   *
   * El encabezado siempre queda centrado.
   *
   * Default:
   * center
   */
  align?: TableColumnAlign;

  /**
   * Compatibilidad con tablas antiguas.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Ancho visual del Skeleton.
   */
  skeletonWidth?:
    | number
    | `${number}%`;
}

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface TableProps<T> {
  data: T[];

  columns: TableColumn[];

  loading?: boolean;

  /**
   * FORMA RECOMENDADA.
   *
   * Table crea:
   *
   * - fila
   * - celda
   * - ancho
   * - alineación
   *
   * La pantalla solamente devuelve
   * el contenido.
   */
  renderCell?: (
    item: T,
    column: TableColumn,
    rowIndex: number,
    columnIndex: number,
  ) => React.ReactNode;

  /**
   * Compatibilidad con vistas antiguas.
   */
  renderRow?: (
    item: T,
    index: number,
  ) => React.ReactElement;

  keyExtractor: (
    item: T,
    index: number,
  ) => string;

  emptyMessage?: string;

  emptyComponent?:
    React.ReactElement | null;

  skeletonRows?: number;

  skeletonHeight?: number;

  animated?: boolean;

  staggerDelay?: (
    index: number,
  ) => number;

  stickyHeader?: boolean;

  showsVerticalScrollIndicator?: boolean;

  /**
   * Scroll interno de la tabla.
   *
   * Default:
   * true
   *
   * En false la lista no desplaza por sí misma:
   * muestra todas las filas y es el ScrollView
   * de la pantalla quien desplaza (ej. ver los
   * 15 registros de la página completos).
   */
  scrollEnabled?: boolean;

  containerStyle?:
    StyleProp<ViewStyle>;

  dataRowStyle?:
    StyleProp<ViewStyle>;

  rowStyle?:
    StyleProp<ViewStyle>;

  /**
   * Espacio entre columnas.
   *
   * Default:
   * 2
   */
  columnGap?: number;

  /**
   * Padding lateral general.
   *
   * Default:
   * 6
   */
  horizontalPadding?: number;

  /**
   * Padding horizontal interno
   * de cada celda.
   *
   * Default:
   * 3
   */
  cellPaddingHorizontal?: number;
}

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export function Table<T>({
  data,

  columns,

  loading = false,

  renderCell,

  renderRow,

  keyExtractor,

  emptyMessage =
    "No se encontraron registros",

  emptyComponent,

  skeletonRows = 5,

  skeletonHeight = 16,

  animated = true,

  staggerDelay,

  stickyHeader = true,

  showsVerticalScrollIndicator = true,

  scrollEnabled = true,

  containerStyle,

  dataRowStyle,

  rowStyle,

  columnGap = 2,

  horizontalPadding = 6,

  cellPaddingHorizontal = 3,
}: TableProps<T>) {
  const { theme } =
    useTheme();

  const c =
    theme.colors;

  /*
  |--------------------------------------------------------------------------
  | ALINEACIÓN
  |--------------------------------------------------------------------------
  */

  const getAlignment = (
    align:
      TableColumnAlign = "center",
  ): ViewStyle => {
    switch (align) {
      case "left":
        return {
          alignItems:
            "flex-start",

          justifyContent:
            "center",
        };

      case "right":
        return {
          alignItems:
            "flex-end",

          justifyContent:
            "center",
        };

      case "center":

      default:
        return {
          alignItems:
            "center",

          justifyContent:
            "center",
        };
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LAYOUT BASE DE COLUMNA
  |--------------------------------------------------------------------------
  |
  | MUY IMPORTANTE:
  |
  | Header y filas utilizan EXACTAMENTE
  | esta misma función.
  |
  */

  const getBaseColumnStyle = (
    column:
      TableColumn,
  ): StyleProp<ViewStyle> => {
    /*
    |--------------------------------------------------------------------------
    | ANCHO FIJO
    |--------------------------------------------------------------------------
    */

    if (
      typeof column.width ===
      "number"
    ) {
      return [
        {
          width:
            column.width,

          minWidth:
            column.width,

          maxWidth:
            column.width,

          flexGrow:
            0,

          flexShrink:
            0,
        },

        getAlignment(
          column.align,
        ),
      ];
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSIVE
    |--------------------------------------------------------------------------
    |
    | flexBasis: 0 hace que React Native
    | reparta el espacio exclusivamente
    | mediante los pesos flex.
    |
    */

    return [
      {
        flex:
          column.flex ??
          1,

        flexGrow:
          column.flex ??
          1,

        flexShrink:
          1,

        flexBasis:
          0,

        minWidth:
          0,
      },

      getAlignment(
        column.align,
      ),
    ];
  };

  /*
  |--------------------------------------------------------------------------
  | CELDA
  |--------------------------------------------------------------------------
  */

  const getCellStyle = (
    column:
      TableColumn,

    index:
      number,
  ): StyleProp<ViewStyle> => [
    styles.cell,

    getBaseColumnStyle(
      column,
    ),

    /*
     * Compatibilidad visual.
     *
     * Dejamos style al final solamente
     * para estilos como padding o background.
     *
     * En las tablas nuevas evita poner
     * width/flex dentro de style.
     */
    column.style,

    {
      paddingHorizontal:
        cellPaddingHorizontal,
    },

    index <
    columns.length - 1
      ? {
          marginRight:
            columnGap,
        }
      : null,
  ];

  /*
  |--------------------------------------------------------------------------
  | HEADER
  |--------------------------------------------------------------------------
  */

  const renderHeader =
    () => (
      <View
        style={[
          styles.headerRow,

          {
            backgroundColor:
              c.backgroundSecondary,

            borderBottomColor:
              c.border,

            paddingHorizontal:
              horizontalPadding,
          },
        ]}
      >
        {columns.map(
          (
            column,
            index,
          ) => (
            <View
              key={
                column.key
              }
              style={[
                getCellStyle(
                  column,
                  index,
                ),

                /*
                 * Todos los nombres
                 * de columnas centrados.
                 */
                styles.headerCell,
              ]}
            >
              <ThemedText
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.headerText,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                {
                  column.label
                }
              </ThemedText>
            </View>
          ),
        )}
      </View>
    );

  /*
  |--------------------------------------------------------------------------
  | SKELETON
  |--------------------------------------------------------------------------
  */

  const renderSkeletonRows =
    () =>
      Array.from({
        length:
          skeletonRows,
      }).map(
        (
          _,
          rowIndex,
        ) => (
          <View
            key={`skeleton-${rowIndex}`}
            style={[
              styles.row,

              {
                borderBottomColor:
                  c.border,

                paddingHorizontal:
                  horizontalPadding,
              },

              rowStyle,
            ]}
          >
            {columns.map(
              (
                column,
                columnIndex,
              ) => (
                <View
                  key={`${column.key}-${rowIndex}`}
                  style={
                    getCellStyle(
                      column,
                      columnIndex,
                    )
                  }
                >
                  <Skeleton
                    colorMode={
                      theme.dark
                        ? "dark"
                        : "light"
                    }
                    width={
                      column.skeletonWidth ??
                      "60%"
                    }
                    height={
                      skeletonHeight
                    }
                    radius={4}
                  />
                </View>
              ),
            )}
          </View>
        ),
      );

  /*
  |--------------------------------------------------------------------------
  | ESTADO VACÍO
  |--------------------------------------------------------------------------
  */

  const renderEmptyState =
    () => {
      if (
        emptyComponent
      ) {
        return emptyComponent;
      }

      return (
        <View
          style={
            styles.empty
          }
        >
          <ThemedText
            style={{
              color:
                c.textSecondary,
            }}
          >
            {
              emptyMessage
            }
          </ThemedText>
        </View>
      );
    };

  /*
  |--------------------------------------------------------------------------
  | FILA GENERADA
  |--------------------------------------------------------------------------
  |
  | Table crea exactamente la misma
  | geometría utilizada por el Header.
  |
  */

  const renderGeneratedRow = (
    item: T,

    rowIndex:
      number,
  ) => (
    <View
      style={[
        styles.row,

        {
          borderBottomColor:
            c.border,

          paddingHorizontal:
            horizontalPadding,
        },

        dataRowStyle,
      ]}
    >
      {columns.map(
        (
          column,
          columnIndex,
        ) => (
          <View
            key={
              column.key
            }
            style={
              getCellStyle(
                column,
                columnIndex,
              )
            }
          >
            {
              renderCell?.(
                item,
                column,
                rowIndex,
                columnIndex,
              )
            }
          </View>
        ),
      )}
    </View>
  );

  /*
  |--------------------------------------------------------------------------
  | OBTENER FILA
  |--------------------------------------------------------------------------
  */

  const getRow = (
    item: T,

    index:
      number,
  ): React.ReactElement => {
    /*
    |--------------------------------------------------------------------------
    | NUEVO ESTÁNDAR
    |--------------------------------------------------------------------------
    */

    if (
      renderCell
    ) {
      return renderGeneratedRow(
        item,
        index,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | LEGACY
    |--------------------------------------------------------------------------
    */

    if (
      renderRow
    ) {
      return renderRow(
        item,
        index,
      );
    }

    return (
      <View
        style={[
          styles.row,

          {
            borderBottomColor:
              c.border,
          },
        ]}
      />
    );
  };

  /*
  |--------------------------------------------------------------------------
  | ANIMACIÓN
  |--------------------------------------------------------------------------
  */

  const renderAnimatedRow = (
    item: T,

    index:
      number,
  ) => {
    const row =
      getRow(
        item,
        index,
      );

    if (
      !animated
    ) {
      return row;
    }

    return (
      <MotiView
        style={
          styles.animatedRow
        }
        from={{
          opacity:
            0,

          translateY:
            7,
        }}
        animate={{
          opacity:
            1,

          translateY:
            0,
        }}
        transition={{
          type:
            "timing",

          duration:
            260,

          delay:
            staggerDelay
              ? staggerDelay(
                  index,
                )
              : Math.min(
                  index *
                    30,

                  240,
                ),
        }}
      >
        {row}
      </MotiView>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={[
        styles.container,

        {
          backgroundColor:
            c.card,

          borderColor:
            c.border,
        },

        containerStyle,
      ]}
    >
      {loading ? (
        <>
          {
            renderHeader()
          }

          {
            renderSkeletonRows()
          }
        </>
      ) : (
        <FlatList
          data={
            data
          }
          style={
            styles.list
          }
          scrollEnabled={
            scrollEnabled
          }
          keyExtractor={
            keyExtractor
          }
          ListHeaderComponent={
            renderHeader
          }
          ListEmptyComponent={
            renderEmptyState
          }
          stickyHeaderIndices={
            stickyHeader
              ? [0]
              : undefined
          }
          renderItem={({
            item,
            index,
          }) =>
            renderAnimatedRow(
              item,
              index,
            )
          }
          contentContainerStyle={
            styles.contentContainer
          }
          showsVerticalScrollIndicator={
            showsVerticalScrollIndicator
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| ESTILOS
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    /*
    |--------------------------------------------------------------------------
    | CONTENEDOR
    |--------------------------------------------------------------------------
    |
    | Conservamos la altura original.
    |
    */

    container: {
      width:
        "100%",

      flex:
        1,

      minWidth:
        0,

      borderWidth:
        1,

      borderRadius:
        12,

      overflow:
        "hidden",

      marginBottom:
        16,
    },

    /*
    |--------------------------------------------------------------------------
    | LISTA
    |--------------------------------------------------------------------------
    */

    list: {
      width:
        "100%",

      flex:
        1,

      minWidth:
        0,
    },

    contentContainer: {
      width:
        "100%",

      minWidth:
        0,

      paddingBottom:
        8,
    },

    /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

    headerRow: {
      width:
        "100%",

      minWidth:
        0,

      flexDirection:
        "row",

      alignItems:
        "stretch",

      borderBottomWidth:
        1,

      paddingVertical:
        10,
    },

    headerCell: {
      alignItems:
        "center",

      justifyContent:
        "center",
    },

    headerText: {
      width:
        "100%",

      textAlign:
        "center",

      fontSize:
        10,

      lineHeight:
        14,

      fontWeight:
        "700",

      textTransform:
        "uppercase",

      letterSpacing:
        0.2,
    },

    /*
    |--------------------------------------------------------------------------
    | FILA
    |--------------------------------------------------------------------------
    */

    row: {
      width:
        "100%",

      minWidth:
        0,

      flexDirection:
        "row",

      alignItems:
        "stretch",

      paddingVertical:
        9,

      minHeight:
        54,

      borderBottomWidth:
        1,
    },

    /*
    |--------------------------------------------------------------------------
    | CELDA
    |--------------------------------------------------------------------------
    */

    cell: {
      minWidth:
        0,

      overflow:
        "hidden",
    },

    /*
    |--------------------------------------------------------------------------
    | ANIMACIÓN
    |--------------------------------------------------------------------------
    */

    animatedRow: {
      width:
        "100%",

      minWidth:
        0,
    },

    /*
    |--------------------------------------------------------------------------
    | EMPTY
    |--------------------------------------------------------------------------
    */

    empty: {
      width:
        "100%",

      paddingVertical:
        48,

      alignItems:
        "center",

      justifyContent:
        "center",
    },
  });