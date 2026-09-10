// components/Table.tsx

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import { useResponsive } from "@/hooks/useResponsive";

import { MotiView } from "moti";
import { Skeleton } from "moti/skeleton";

import React, { useMemo } from "react";

import {
  FlatList,
  ScrollView,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
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

export type TableResponsiveMode =
  | "cards"
  | "scroll";

export type TableMobileRole =
  | "field"
  | "title"
  | "actions";

/*
|--------------------------------------------------------------------------
| COLUMNA
|--------------------------------------------------------------------------
*/

export interface TableColumn {
  key: string;

  label: string;

  /*
  |--------------------------------------------------------------------------
  | DESKTOP
  |--------------------------------------------------------------------------
  */

  /**
   * Peso proporcional de la columna.
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
   */
  width?: number;

  /**
   * Alineación del contenido.
   *
   * Default:
   * center
   */
  align?: TableColumnAlign;

  /**
   * Compatibilidad con tablas existentes.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Ancho visual del Skeleton.
   */
  skeletonWidth?:
    | number
    | `${number}%`;

  /*
  |--------------------------------------------------------------------------
  | RESPONSIVE / CARDS
  |--------------------------------------------------------------------------
  */

  /**
   * Oculta esta columna cuando la tabla
   * se transforma a cards.
   *
   * Default:
   * false
   */
  mobileHidden?: boolean;

  /**
   * Nombre diferente dentro de la card.
   *
   * Si no se especifica utiliza:
   * column.label
   */
  mobileLabel?: string;

  /**
   * Orden dentro de la card.
   *
   * Las columnas sin mobileOrder
   * mantienen su posición original.
   */
  mobileOrder?: number;

  /**
   * Hace que este campo ocupe
   * todo el ancho de la card.
   */
  mobileFullWidth?: boolean;

  /**
   * Oculta el label dentro de la card.
   *
   * Útil para botones / acciones.
   */
  mobileHideLabel?: boolean;

  /**
   * Define un comportamiento visual especial.
   *
   * field:
   * campo normal.
   *
   * title:
   * contenido principal de la card.
   *
   * actions:
   * botones de acciones.
   */
  mobileRole?: TableMobileRole;
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
   * Table crea las celdas y la pantalla
   * solamente devuelve el contenido.
   */
  renderCell?: (
    item: T,
    column: TableColumn,
    rowIndex: number,
    columnIndex: number,
  ) => React.ReactNode;

  /**
   * Compatibilidad con tablas antiguas.
   *
   * IMPORTANTE:
   *
   * Cuando solamente existe renderRow,
   * Table conserva automáticamente el
   * modo tabla/scroll en móvil porque
   * no puede separar las celdas.
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
   * Scroll interno.
   *
   * true:
   * FlatList interna.
   *
   * false:
   * muestra todos los registros
   * y deja el scroll a la pantalla padre.
   */
  scrollEnabled?: boolean;

  containerStyle?:
    StyleProp<ViewStyle>;

  dataRowStyle?:
    StyleProp<ViewStyle>;

  rowStyle?:
    StyleProp<ViewStyle>;

  /**
   * Separación de columnas desktop.
   */
  columnGap?: number;

  /**
   * Padding horizontal desktop.
   */
  horizontalPadding?: number;

  /**
   * Padding interno de celda.
   */
  cellPaddingHorizontal?: number;

  /*
  |--------------------------------------------------------------------------
  | RESPONSIVE
  |--------------------------------------------------------------------------
  */

  /**
   * cards:
   *
   * Celular -> cards
   * Tablet  -> cards
   * Desktop -> tabla
   *
   * scroll:
   *
   * Celular/Tablet -> tabla con scroll horizontal.
   *
   * Default:
   * cards
   */
  responsiveMode?: TableResponsiveMode;

  /**
   * Desde qué ancho se consideran
   * dos cards por fila.
   *
   * Default:
   * 700
   */
  tabletBreakpoint?: number;

  /**
   * Máximo ancho de una card.
   *
   * Útil especialmente en tablets.
   */
  cardMaxWidth?: number;

  /**
   * Estilo extra para las cards.
   */
  cardStyle?:
    StyleProp<ViewStyle>;
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

  responsiveMode = "cards",

  tabletBreakpoint = 700,

  cardMaxWidth,

  cardStyle,
}: TableProps<T>) {
  const { theme } =
    useTheme();

  const c =
    theme.colors;

  const { width } =
    useWindowDimensions();

  const { isDesktop } =
    useResponsive();

  /*
  |--------------------------------------------------------------------------
  | TIPO DE PANTALLA
  |--------------------------------------------------------------------------
  */

  const esResponsive =
    !isDesktop;

  const esTablet =
    esResponsive &&
    width >= tabletBreakpoint;

  /*
  |--------------------------------------------------------------------------
  | DECIDIR MODO REAL
  |--------------------------------------------------------------------------
  |
  | Si una tabla antigua utiliza exclusivamente renderRow,
  | no podemos descomponer esa fila en campos individuales.
  |
  | Por seguridad dejamos el comportamiento anterior:
  | scroll horizontal.
  |
  */

  const puedeUsarCards =
    !!renderCell;

  const usarCards =
    esResponsive &&
    responsiveMode === "cards" &&
    puedeUsarCards;

  const usarScrollHorizontal =
    esResponsive &&
    !usarCards;

  /*
  |--------------------------------------------------------------------------
  | COLUMNAS RESPONSIVE
  |--------------------------------------------------------------------------
  */

  const mobileColumns =
    useMemo(() => {
      return columns
        .map(
          (
            column,
            originalIndex,
          ) => ({
            column,
            originalIndex,
          }),
        )
        .filter(
          ({ column }) =>
            !column.mobileHidden,
        )
        .sort((a, b) => {
          const orderA =
            a.column.mobileOrder ??
            a.originalIndex;

          const orderB =
            b.column.mobileOrder ??
            b.originalIndex;

          return orderA - orderB;
        });
    }, [columns]);

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
  | COLUMNAS DESKTOP
  |--------------------------------------------------------------------------
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
    | FLEX
    |--------------------------------------------------------------------------
    */

    const minWidthMovil =
      !usarScrollHorizontal
        ? undefined
        : column.flex !==
              undefined &&
            column.flex < 0.6
          ? 56
          : 112;

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
          minWidthMovil ??
          0,
      },

      getAlignment(
        column.align,
      ),
    ];
  };

  /*
  |--------------------------------------------------------------------------
  | ANCHO MÍNIMO PARA TABLA CON SCROLL
  |--------------------------------------------------------------------------
  */

  const anchoMinimoMovil =
    columns.reduce(
      (
        total,
        column,
        index,
      ) => {
        const ancho =
          typeof column.width ===
          "number"
            ? column.width
            : column.flex !==
                  undefined &&
                column.flex <
                  0.6
              ? 56
              : 112;

        const separacion =
          index <
          columns.length - 1
            ? columnGap
            : 0;

        return (
          total +
          ancho +
          separacion
        );
      },

      horizontalPadding *
        2 +
        cellPaddingHorizontal *
          2 *
          columns.length,
    );

  /*
  |--------------------------------------------------------------------------
  | CELDA DESKTOP
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
  | SKELETON TABLA
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
  | EMPTY
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
    if (
      renderCell
    ) {
      return renderGeneratedRow(
        item,
        index,
      );
    }

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
  | ANIMACIÓN FILA
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
  | CARD RESPONSIVE
  |--------------------------------------------------------------------------
  */

  const renderCard = (
    item: T,

    rowIndex:
      number,
  ) => {
    const content = (
      <View
        style={[
          styles.card,

          {
            backgroundColor:
              c.card,

            borderColor:
              c.border,
          },

          cardMaxWidth
            ? {
                maxWidth:
                  cardMaxWidth,
              }
            : null,

          cardStyle,
        ]}
      >
        {mobileColumns.map(
          ({
            column,
            originalIndex,
          }) => {
            const role =
              column.mobileRole ??
              "field";

            /*
            |--------------------------------------------------------------------------
            | TÍTULO
            |--------------------------------------------------------------------------
            */

            if (
              role ===
              "title"
            ) {
              return (
                <View
                  key={
                    column.key
                  }
                  style={[
                    styles.cardTitleField,

                    {
                      borderBottomColor:
                        c.border,
                    },
                  ]}
                >
                  {!column.mobileHideLabel &&
                    column.mobileLabel && (
                      <ThemedText
                        style={[
                          styles.cardLabel,

                          {
                            color:
                              c.textSecondary,
                          },
                        ]}
                      >
                        {
                          column.mobileLabel
                        }
                      </ThemedText>
                    )}

                  <View
                    style={
                      styles.cardTitleValue
                    }
                  >
                    {renderCell?.(
                      item,
                      column,
                      rowIndex,
                      originalIndex,
                    )}
                  </View>
                </View>
              );
            }

            /*
            |--------------------------------------------------------------------------
            | ACCIONES
            |--------------------------------------------------------------------------
            */

            if (
              role ===
              "actions"
            ) {
              return (
                <View
                  key={
                    column.key
                  }
                  style={[
                    styles.cardActions,

                    {
                      borderTopColor:
                        c.border,
                    },
                  ]}
                >
                  {!column.mobileHideLabel && (
                    <ThemedText
                      style={[
                        styles.cardLabel,

                        {
                          color:
                            c.textSecondary,
                        },
                      ]}
                    >
                      {
                        column.mobileLabel ??
                        column.label
                      }
                    </ThemedText>
                  )}

                  <View
                    style={
                      styles.cardActionsContent
                    }
                  >
                    {renderCell?.(
                      item,
                      column,
                      rowIndex,
                      originalIndex,
                    )}
                  </View>
                </View>
              );
            }

            /*
            |--------------------------------------------------------------------------
            | CAMPO NORMAL
            |--------------------------------------------------------------------------
            */

            return (
              <View
                key={
                  column.key
                }
                style={[
                  styles.cardField,

                  column.mobileFullWidth &&
                    styles.cardFieldFull,
                ]}
              >
                {!column.mobileHideLabel && (
                  <ThemedText
                    numberOfLines={
                      1
                    }
                    style={[
                      styles.cardLabel,

                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    {
                      column.mobileLabel ??
                      column.label
                    }
                  </ThemedText>
                )}

                <View
                  style={[
                    styles.cardValue,

                    column.align ===
                    "center"
                      ? styles.cardValueCenter
                      : column.align ===
                          "right"
                        ? styles.cardValueRight
                        : styles.cardValueLeft,
                  ]}
                >
                  {renderCell?.(
                    item,
                    column,
                    rowIndex,
                    originalIndex,
                  )}
                </View>
              </View>
            );
          },
        )}
      </View>
    );

    if (
      !animated
    ) {
      return content;
    }

    return (
      <MotiView
        style={[
          styles.cardAnimated,

          esTablet
            ? styles.cardAnimatedTablet
            : styles.cardAnimatedMobile,
        ]}
        from={{
          opacity:
            0,

          translateY:
            8,

          scale:
            0.99,
        }}
        animate={{
          opacity:
            1,

          translateY:
            0,

          scale:
            1,
        }}
        transition={{
          type:
            "timing",

          duration:
            260,

          delay:
            staggerDelay
              ? staggerDelay(
                  rowIndex,
                )
              : Math.min(
                  rowIndex *
                    35,

                  280,
                ),
        }}
      >
        {content}
      </MotiView>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | SKELETON CARD
  |--------------------------------------------------------------------------
  */

  const renderCardSkeleton = (
    index:
      number,
  ) => (
    <View
      key={`card-skeleton-${index}`}
      style={[
        styles.cardAnimated,

        esTablet
          ? styles.cardAnimatedTablet
          : styles.cardAnimatedMobile,
      ]}
    >
      <View
        style={[
          styles.card,

          {
            backgroundColor:
              c.card,

            borderColor:
              c.border,
          },

          cardMaxWidth
            ? {
                maxWidth:
                  cardMaxWidth,
              }
            : null,

          cardStyle,
        ]}
      >
        <View
          style={[
            styles.cardSkeletonTitle,

            {
              borderBottomColor:
                c.border,
            },
          ]}
        >
          <Skeleton
            colorMode={
              theme.dark
                ? "dark"
                : "light"
            }
            width="58%"
            height={18}
            radius={5}
          />

          <Skeleton
            colorMode={
              theme.dark
                ? "dark"
                : "light"
            }
            width={64}
            height={22}
            radius={10}
          />
        </View>

        <View
          style={
            styles.cardSkeletonContent
          }
        >
          {Array.from({
            length:
              Math.min(
                Math.max(
                  mobileColumns.length -
                    1,

                  3,
                ),

                6,
              ),
          }).map(
            (
              _,
              fieldIndex,
            ) => (
              <View
                key={`field-${fieldIndex}`}
                style={
                  styles.cardSkeletonField
                }
              >
                <Skeleton
                  colorMode={
                    theme.dark
                      ? "dark"
                      : "light"
                  }
                  width="45%"
                  height={10}
                  radius={4}
                />

                <Skeleton
                  colorMode={
                    theme.dark
                      ? "dark"
                      : "light"
                  }
                  width="75%"
                  height={
                    skeletonHeight
                  }
                  radius={4}
                />
              </View>
            ),
          )}
        </View>
      </View>
    </View>
  );

  /*
  |--------------------------------------------------------------------------
  | CARDS SIN SCROLL INTERNO
  |--------------------------------------------------------------------------
  */

  const renderCardsExpanded =
    () => {
      if (
        loading
      ) {
        return (
          <View
            style={[
              styles.cardsGrid,

              esTablet &&
                styles.cardsGridTablet,
            ]}
          >
            {Array.from({
              length:
                skeletonRows,
            }).map(
              (
                _,
                index,
              ) =>
                renderCardSkeleton(
                  index,
                ),
            )}
          </View>
        );
      }

      if (
        data.length ===
        0
      ) {
        return renderEmptyState();
      }

      return (
        <View
          style={[
            styles.cardsGrid,

            esTablet &&
              styles.cardsGridTablet,
          ]}
        >
          {data.map(
            (
              item,
              index,
            ) => (
              <View
                key={keyExtractor(
                  item,
                  index,
                )}
                style={[
                  styles.cardItemWrapper,

                  esTablet
                    ? styles.cardItemWrapperTablet
                    : styles.cardItemWrapperMobile,
                ]}
              >
                {renderCard(
                  item,
                  index,
                )}
              </View>
            ),
          )}
        </View>
      );
    };

  /*
  |--------------------------------------------------------------------------
  | RENDER CARDS RESPONSIVE
  |--------------------------------------------------------------------------
  */

  if (
    usarCards
  ) {
    /*
    |--------------------------------------------------------------------------
    | SIN SCROLL PROPIO
    |--------------------------------------------------------------------------
    */

    if (
      !scrollEnabled
    ) {
      return (
        <View
          style={[
            styles.cardsContainer,

            containerStyle,
          ]}
        >
          {
            renderCardsExpanded()
          }
        </View>
      );
    }

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (
      loading
    ) {
      return (
        <ScrollView
          showsVerticalScrollIndicator={
            showsVerticalScrollIndicator
          }
          contentContainerStyle={[
            styles.cardsScrollContent,
          ]}
        >
          <View
            style={[
              styles.cardsGrid,

              esTablet &&
                styles.cardsGridTablet,
            ]}
          >
            {Array.from({
              length:
                skeletonRows,
            }).map(
              (
                _,
                index,
              ) =>
                renderCardSkeleton(
                  index,
                ),
            )}
          </View>
        </ScrollView>
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FLATLIST CARDS
    |--------------------------------------------------------------------------
    */

    const numeroColumnas =
      esTablet
        ? 2
        : 1;

    return (
      <FlatList
        key={`table-cards-${numeroColumnas}`}
        data={data}
        numColumns={
          numeroColumnas
        }
        keyExtractor={
          keyExtractor
        }
        renderItem={({
          item,
          index,
        }) => (
          <View
            style={[
              styles.cardItemWrapper,

              esTablet
                ? styles.cardItemWrapperTablet
                : styles.cardItemWrapperMobile,
            ]}
          >
            {renderCard(
              item,
              index,
            )}
          </View>
        )}
        columnWrapperStyle={
          numeroColumnas >
          1
            ? styles.cardColumnWrapper
            : undefined
        }
        ListEmptyComponent={
          renderEmptyState
        }
        contentContainerStyle={
          styles.cardsScrollContent
        }
        showsVerticalScrollIndicator={
          showsVerticalScrollIndicator
        }
        scrollEnabled={
          scrollEnabled
        }
        keyboardShouldPersistTaps="handled"
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TABLA CLÁSICA
  |--------------------------------------------------------------------------
  */

  const cuerpoTabla =
    loading ? (
      <>
        {
          renderHeader()
        }

        {
          renderSkeletonRows()
        }
      </>
    ) : !scrollEnabled ? (
      <>
        {
          renderHeader()
        }

        {data.length ===
        0
          ? renderEmptyState()
          : data.map(
              (
                item,
                index,
              ) => (
                <View
                  key={keyExtractor(
                    item,
                    index,
                  )}
                >
                  {
                    renderAnimatedRow(
                      item,
                      index,
                    )
                  }
                </View>
              ),
            )}

        <View
          style={
            styles.expandedBottomPad
          }
        />
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
    );

  const contenidoTabla = (
    <View
      style={[
        styles.container,

        {
          backgroundColor:
            c.card,

          borderColor:
            c.border,
        },

        usarScrollHorizontal && {
          flex:
            0,

          minWidth:
            anchoMinimoMovil,
        },

        containerStyle,
      ]}
    >
      {
        cuerpoTabla
      }
    </View>
  );

  /*
  |--------------------------------------------------------------------------
  | DESKTOP
  |--------------------------------------------------------------------------
  */

  if (
    !usarScrollHorizontal
  ) {
    return contenidoTabla;
  }

  /*
  |--------------------------------------------------------------------------
  | RESPONSIVE EN MODO SCROLL
  |--------------------------------------------------------------------------
  */

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={
        false
      }
      nestedScrollEnabled
      contentContainerStyle={{
        flexGrow:
          1,

        minWidth:
          anchoMinimoMovil,
      }}
    >
      {
        contenidoTabla
      }
    </ScrollView>
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
    | TABLA
    |--------------------------------------------------------------------------
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

    expandedBottomPad: {
      width:
        "100%",

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

    cell: {
      minWidth:
        0,

      overflow:
        "hidden",
    },

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

      paddingHorizontal:
        20,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | CARDS
    |--------------------------------------------------------------------------
    */

    cardsContainer: {
      width:
        "100%",

      minWidth:
        0,
    },

    cardsScrollContent: {
      flexGrow:
        1,

      paddingBottom:
        16,
    },

    cardsGrid: {
      width:
        "100%",

      flexDirection:
        "column",
    },

    cardsGridTablet: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      marginHorizontal:
        -5,
    },

    cardColumnWrapper: {
      width:
        "100%",

      gap:
        10,
    },

    cardItemWrapper: {
      minWidth:
        0,

      marginBottom:
        10,
    },

    cardItemWrapperMobile: {
      width:
        "100%",
    },

    cardItemWrapperTablet: {
      flex:
        1,

      minWidth:
        0,

      maxWidth:
        "50%",
    },

    cardAnimated: {
      width:
        "100%",

      minWidth:
        0,
    },

    cardAnimatedMobile: {
      width:
        "100%",
    },

    cardAnimatedTablet: {
      width:
        "100%",
    },

    card: {
      width:
        "100%",

      alignSelf:
        "center",

      borderWidth:
        1,

      borderRadius:
        14,

      padding:
        14,

      overflow:
        "hidden",
    },

    /*
    |--------------------------------------------------------------------------
    | TÍTULO CARD
    |--------------------------------------------------------------------------
    */

    cardTitleField: {
      width:
        "100%",

      paddingBottom:
        12,

      marginBottom:
        12,

      borderBottomWidth:
        StyleSheet.hairlineWidth,
    },

    cardTitleValue: {
      width:
        "100%",

      minWidth:
        0,

      justifyContent:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | CAMPO CARD
    |--------------------------------------------------------------------------
    */

    cardField: {
      width:
        "100%",

      minWidth:
        0,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      paddingVertical:
        7,

      gap:
        12,
    },

    cardFieldFull: {
      flexDirection:
        "column",

      alignItems:
        "stretch",

      gap:
        5,
    },

    cardLabel: {
      flexShrink:
        1,

      fontSize:
        10,

      lineHeight:
        14,

      fontWeight:
        "700",

      textTransform:
        "uppercase",

      letterSpacing:
        0.25,
    },

    cardValue: {
      minWidth:
        0,

      flex:
        1,
    },

    cardValueLeft: {
      alignItems:
        "flex-end",

      justifyContent:
        "center",
    },

    cardValueCenter: {
      alignItems:
        "flex-end",

      justifyContent:
        "center",
    },

    cardValueRight: {
      alignItems:
        "flex-end",

      justifyContent:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | ACCIONES CARD
    |--------------------------------------------------------------------------
    */

    cardActions: {
      width:
        "100%",

      marginTop:
        10,

      paddingTop:
        12,

      borderTopWidth:
        StyleSheet.hairlineWidth,

      gap:
        8,
    },

    cardActionsContent: {
      width:
        "100%",

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      alignItems:
        "center",

      justifyContent:
        "flex-end",

      gap:
        8,
    },

    /*
    |--------------------------------------------------------------------------
    | SKELETON CARD
    |--------------------------------------------------------------------------
    */

    cardSkeletonTitle: {
      width:
        "100%",

      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      gap:
        12,

      paddingBottom:
        12,

      marginBottom:
        8,

      borderBottomWidth:
        StyleSheet.hairlineWidth,
    },

    cardSkeletonContent: {
      width:
        "100%",
    },

    cardSkeletonField: {
      width:
        "100%",

      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      paddingVertical:
        8,

      gap:
        16,
    },
  });