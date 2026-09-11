// components/Table.tsx

import { ThemedText } from "@/components/ThemedText";

import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

import { useResponsive } from "@/hooks/useResponsive";
import { useTheme } from "@/theme/useTheme";

import { MotiView } from "moti";

import React, {
  useMemo,
} from "react";

import {
  FlatList,
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
   * Peso proporcional.
   */
  flex?: number;

  /**
   * Ancho fijo opcional.
   */
  width?: number;

  /**
   * Alineación.
   */
  align?: TableColumnAlign;

  /**
   * Compatibilidad con código anterior.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Ancho del skeleton.
   */
  skeletonWidth?:
    | number
    | `${number}%`;

  /*
  |--------------------------------------------------------------------------
  | RESPONSIVE
  |--------------------------------------------------------------------------
  */

  /**
   * Ocultar en móvil/tablet.
   */
  mobileHidden?: boolean;

  /**
   * Label diferente en modo card.
   */
  mobileLabel?: string;

  /**
   * Orden dentro de la card.
   */
  mobileOrder?: number;

  /**
   * Ocupa una fila completa.
   */
  mobileFullWidth?: boolean;

  /**
   * Ocultar label.
   */
  mobileHideLabel?: boolean;

  /**
   * Tipo de campo dentro de la card.
   *
   * field:
   * campo normal.
   *
   * title:
   * cabecera de la card.
   *
   * actions:
   * botones al final.
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

  renderCell?: (
    item: T,
    column: TableColumn,
    rowIndex: number,
    columnIndex: number,
  ) => React.ReactNode;

  /**
   * Compatibilidad legacy.
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

  scrollEnabled?: boolean;

  containerStyle?:
    StyleProp<ViewStyle>;

  dataRowStyle?:
    StyleProp<ViewStyle>;

  rowStyle?:
    StyleProp<ViewStyle>;

  columnGap?: number;

  horizontalPadding?: number;

  cellPaddingHorizontal?: number;

  /**
   * cards:
   *
   * Desktop -> tabla
   * Tablet  -> cards
   * Mobile  -> cards
   *
   * scroll:
   *
   * mantiene tabla horizontal
   * en tablet/móvil.
   */
  responsiveMode?: TableResponsiveMode;

  /**
   * Estilo adicional de las cards.
   */
  cardStyle?:
    StyleProp<ViewStyle>;

  /**
   * Ancho máximo opcional.
   */
  cardMaxWidth?: number;
}

/*
|--------------------------------------------------------------------------
| TABLE
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

  cardStyle,

  cardMaxWidth,
}: TableProps<T>) {
  const { theme } =
    useTheme();

  const c =
    theme.colors;

  const {
    isDesktop,
    isTablet,
  } = useResponsive();

  /*
  |--------------------------------------------------------------------------
  | MODO
  |--------------------------------------------------------------------------
  */

  const responsive =
    !isDesktop;

  /*
   * Para generar cards necesitamos renderCell.
   *
   * Las tablas viejas que usan renderRow
   * continúan con scroll horizontal.
   */
  const canUseCards =
    Boolean(renderCell);

  const useCards =
    responsive &&
    responsiveMode === "cards" &&
    canUseCards;

  const useHorizontalScroll =
    responsive &&
    !useCards;

  /*
  |--------------------------------------------------------------------------
  | COLUMNAS DE CARD
  |--------------------------------------------------------------------------
  */

  const responsiveColumns =
    useMemo(() => {
      return columns
        .map(
          (
            column,
            index,
          ) => ({
            column,
            index,
          }),
        )
        .filter(
          ({ column }) =>
            !column.mobileHidden,
        )
        .sort(
          (a, b) => {
            const aOrder =
              a.column.mobileOrder ??
              a.index;

            const bOrder =
              b.column.mobileOrder ??
              b.index;

            return (
              aOrder -
              bOrder
            );
          },
        );
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
  | ESTILO BASE DE COLUMNA
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

    const minWidthResponsive =
      useHorizontalScroll
        ? column.flex !==
              undefined &&
            column.flex < 0.6
          ? 56
          : 112
        : undefined;

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
          minWidthResponsive ??
          0,
      },

      getAlignment(
        column.align,
      ),
    ];
  };

  /*
  |--------------------------------------------------------------------------
  | ANCHO MÍNIMO TABLA RESPONSIVE
  |--------------------------------------------------------------------------
  */

  const minimumResponsiveWidth =
    columns.reduce(
      (
        total,
        column,
        index,
      ) => {
        const width =
          typeof column.width ===
          "number"
            ? column.width
            : column.flex !==
                  undefined &&
                column.flex <
                  0.6
              ? 56
              : 112;

        const gap =
          index <
          columns.length - 1
            ? columnGap
            : 0;

        return (
          total +
          width +
          gap
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
                numberOfLines={
                  1
                }
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
  | SKELETON DESKTOP
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
                    width={
                      column.skeletonWidth ??
                      "60%"
                    }
                    height={
                      skeletonHeight
                    }
                  />
                </View>
              ),
            )}
          </View>
        ),
      );

  /*
  |--------------------------------------------------------------------------
  | EMPTY STATE
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
            styles.emptyWrapper
          }
        >
          <EmptyState
            icon="folder-open-outline"
            title={
              emptyMessage
            }
            subtitle="No existen datos para mostrar en este momento."
          />
        </View>
      );
    };

  /*
  |--------------------------------------------------------------------------
  | FILA DESKTOP
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
            {renderCell?.(
              item,
              column,
              rowIndex,
              columnIndex,
            )}
          </View>
        ),
      )}
    </View>
  );

  /*
  |--------------------------------------------------------------------------
  | FILA LEGACY
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

  const renderResponsiveCard = (
    item: T,

    rowIndex:
      number,
  ) => {
    /*
    |--------------------------------------------------------------------------
    | SEPARAR TIPOS DE CAMPOS
    |--------------------------------------------------------------------------
    */

    const titleColumns =
      responsiveColumns.filter(
        ({ column }) =>
          column.mobileRole ===
          "title",
      );

    const fieldColumns =
      responsiveColumns.filter(
        ({ column }) =>
          (
            column.mobileRole ??
            "field"
          ) === "field",
      );

    const actionColumns =
      responsiveColumns.filter(
        ({ column }) =>
          column.mobileRole ===
          "actions",
      );

    const card = (
      <Card
        style={[
          styles.responsiveCard,

          cardMaxWidth
            ? {
                maxWidth:
                  cardMaxWidth,
              }
            : null,

          cardStyle,
        ]}
      >
        {/*
        |--------------------------------------------------------------------------
        | CABECERA
        |--------------------------------------------------------------------------
        */}

        {titleColumns.length >
          0 && (
          <>
            <View
              style={
                styles.cardHeader
              }
            >
              {titleColumns.map(
                ({
                  column,
                  index,
                }) => (
                  <View
                    key={
                      column.key
                    }
                    style={
                      styles.cardTitleItem
                    }
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
                        styles.cardTitleValue
                      }
                    >
                      {renderCell?.(
                        item,
                        column,
                        rowIndex,
                        index,
                      )}
                    </View>
                  </View>
                ),
              )}
            </View>

            <Divider />
          </>
        )}

        {/*
        |--------------------------------------------------------------------------
        | CAMPOS
        |--------------------------------------------------------------------------
        */}

        {fieldColumns.length >
          0 && (
          <View
            style={
              styles.cardFields
            }
          >
            {fieldColumns.map(
              ({
                column,
                index,
              }) => (
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
                      styles.cardFieldValue
                    }
                  >
                    {renderCell?.(
                      item,
                      column,
                      rowIndex,
                      index,
                    )}
                  </View>
                </View>
              ),
            )}
          </View>
        )}

        {/*
        |--------------------------------------------------------------------------
        | ACCIONES
        |--------------------------------------------------------------------------
        */}

        {actionColumns.length >
          0 && (
          <>
            <Divider />

            <View
              style={
                styles.cardActions
              }
            >
              {actionColumns.map(
                ({
                  column,
                  index,
                }) => (
                  <View
                    key={
                      column.key
                    }
                    style={
                      styles.cardActionItem
                    }
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
                        styles.cardActionContent
                      }
                    >
                      {renderCell?.(
                        item,
                        column,
                        rowIndex,
                        index,
                      )}
                    </View>
                  </View>
                ),
              )}
            </View>
          </>
        )}
      </Card>
    );

    /*
    |--------------------------------------------------------------------------
    | SIN ANIMACIÓN
    |--------------------------------------------------------------------------
    */

    if (
      !animated
    ) {
      return card;
    }

    /*
    |--------------------------------------------------------------------------
    | CON ANIMACIÓN
    |--------------------------------------------------------------------------
    */

    return (
      <MotiView
        style={
          styles.cardAnimation
        }
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
        {card}
      </MotiView>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | CARD SKELETON
  |--------------------------------------------------------------------------
  */

  const renderCardSkeleton = (
    index:
      number,
  ) => (
    <Card
      key={`card-skeleton-${index}`}
      style={[
        styles.responsiveCard,

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
        style={
          styles.skeletonHeader
        }
      >
        <Skeleton
          width="58%"
          height={20}
        />

        <Skeleton
          width={68}
          height={20}
        />
      </View>

      <Divider />

      <View
        style={
          styles.skeletonFields
        }
      >
        <View
          style={
            styles.skeletonField
          }
        >
          <Skeleton
            width="32%"
            height={12}
          />

          <Skeleton
            width="42%"
            height={
              skeletonHeight
            }
          />
        </View>

        <View
          style={
            styles.skeletonField
          }
        >
          <Skeleton
            width="28%"
            height={12}
          />

          <Skeleton
            width="55%"
            height={
              skeletonHeight
            }
          />
        </View>

        <View
          style={
            styles.skeletonField
          }
        >
          <Skeleton
            width="35%"
            height={12}
          />

          <Skeleton
            width="38%"
            height={
              skeletonHeight
            }
          />
        </View>
      </View>
    </Card>
  );

  /*
  |--------------------------------------------------------------------------
  | CARDS EXPANDIDAS
  |--------------------------------------------------------------------------
  */

  const renderExpandedCards =
    () => {
      if (
        loading
      ) {
        return (
          <View
            style={[
              styles.cardsGrid,

              isTablet &&
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
              ) => (
                <View
                  key={
                    index
                  }
                  style={[
                    styles.cardWrapper,

                    isTablet
                      ? styles.cardWrapperTablet
                      : styles.cardWrapperMobile,
                  ]}
                >
                  {
                    renderCardSkeleton(
                      index,
                    )
                  }
                </View>
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

            isTablet &&
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
                  styles.cardWrapper,

                  isTablet
                    ? styles.cardWrapperTablet
                    : styles.cardWrapperMobile,
                ]}
              >
                {
                  renderResponsiveCard(
                    item,
                    index,
                  )
                }
              </View>
            ),
          )}
        </View>
      );
    };

  /*
  |--------------------------------------------------------------------------
  | MODO CARDS
  |--------------------------------------------------------------------------
  */

  if (
    useCards
  ) {
    /*
    |--------------------------------------------------------------------------
    | SIN SCROLL INTERNO (MÓVIL/TABLET SIEMPRE EXPANDIDO)
    |--------------------------------------------------------------------------
    |
    | En móvil las cards se renderizan directo (sin FlatList):
    | altura total, desplaza la página y no hay warning de
    | VirtualizedList anidada. Desktop no llega aquí.
    |
    */

    if (
      !scrollEnabled ||
      responsive
    ) {
      return (
        <View
          style={[
            styles.cardsContainer,

            containerStyle,
          ]}
        >
          {
            renderExpandedCards()
          }
        </View>
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CARGANDO
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
          contentContainerStyle={
            styles.cardsScrollContent
          }
        >
          {
            renderExpandedCards()
          }
        </ScrollView>
      );
    }

    /*
    |--------------------------------------------------------------------------
    | LISTA
    |--------------------------------------------------------------------------
    */

    const columnsCount =
      isTablet
        ? 2
        : 1;

    return (
      <FlatList
        key={`cards-${columnsCount}`}
        data={
          data
        }
        numColumns={
          columnsCount
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
              styles.cardWrapper,

              isTablet
                ? styles.cardWrapperTablet
                : styles.cardWrapperMobile,
            ]}
          >
            {
              renderResponsiveCard(
                item,
                index,
              )
            }
          </View>
        )}
        columnWrapperStyle={
          columnsCount >
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
        scrollEnabled={
          scrollEnabled
        }
        showsVerticalScrollIndicator={
          showsVerticalScrollIndicator
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

  const tableBody =
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

  /*
  |--------------------------------------------------------------------------
  | CONTENEDOR TABLA
  |--------------------------------------------------------------------------
  */

  const tableContent = (
    <View
      style={[
        styles.container,

        {
          backgroundColor:
            c.card,

          borderColor:
            c.border,
        },

        useHorizontalScroll && {
          flex:
            0,

          minWidth:
            minimumResponsiveWidth,
        },

        containerStyle,
      ]}
    >
      {
        tableBody
      }
    </View>
  );

  /*
  |--------------------------------------------------------------------------
  | DESKTOP
  |--------------------------------------------------------------------------
  */

  if (
    !useHorizontalScroll
  ) {
    return tableContent;
  }

  /*
  |--------------------------------------------------------------------------
  | FALLBACK RESPONSIVE
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
          minimumResponsiveWidth,
      }}
    >
      {
        tableContent
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

    emptyWrapper: {
      width:
        "100%",

      paddingVertical:
        28,

      paddingHorizontal:
        16,
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

      gap:
        10,
    },

    cardsGridTablet: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",
    },

    cardColumnWrapper: {
      width:
        "100%",

      gap:
        10,
    },

    cardWrapper: {
      minWidth:
        0,

      marginBottom:
        10,
    },

    cardWrapperMobile: {
      width:
        "100%",
    },

    cardWrapperTablet: {
      flex:
        1,

      minWidth:
        0,
    },

    cardAnimation: {
      width:
        "100%",

      minWidth:
        0,
    },

    responsiveCard: {
      width:
        "100%",

      alignSelf:
        "center",

      gap:
        12,
    },

    /*
    |--------------------------------------------------------------------------
    | HEADER CARD
    |--------------------------------------------------------------------------
    */

    cardHeader: {
      width:
        "100%",

      gap:
        8,
    },

    cardTitleItem: {
      width:
        "100%",

      minWidth:
        0,

      gap:
        4,
    },

    cardTitleValue: {
      width:
        "100%",

      minWidth:
        0,
    },

    /*
    |--------------------------------------------------------------------------
    | CAMPOS
    |--------------------------------------------------------------------------
    */

    cardFields: {
      width:
        "100%",

      gap:
        4,
    },

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

      gap:
        12,

      paddingVertical:
        5,
    },

    cardFieldFull: {
      flexDirection:
        "column",

      alignItems:
        "stretch",

      gap:
        6,
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

    cardFieldValue: {
      flex:
        1,

      minWidth:
        0,

      alignItems:
        "flex-end",

      justifyContent:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | ACCIONES
    |--------------------------------------------------------------------------
    */

    cardActions: {
      width:
        "100%",

      gap:
        8,
    },

    cardActionItem: {
      width:
        "100%",

      gap:
        6,
    },

    cardActionContent: {
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
    | SKELETON
    |--------------------------------------------------------------------------
    */

    skeletonHeader: {
      width:
        "100%",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        12,
    },

    skeletonFields: {
      width:
        "100%",

      gap:
        12,
    },

    skeletonField: {
      width:
        "100%",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        12,
    },
  });