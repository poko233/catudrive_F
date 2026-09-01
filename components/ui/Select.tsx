// components/ui/Select.tsx

import { ThemedText } from "@/components/ThemedText";
import { SearchBar } from "@/components/ui/SearchBar";
import { useTheme } from "@/theme/useTheme";

import {
  Check,
  ChevronDown,
  Search,
  X,
} from "lucide-react-native";

import React, {
  useMemo,
  useState,
} from "react";

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

export type SelectValue =
  | string
  | number;

export interface SelectOption<
  T extends SelectValue = SelectValue,
> {
  /**
   * Texto visible de la opción.
   */
  label: string;

  /**
   * Valor asociado.
   */
  value: T;

  /**
   * Texto opcional debajo del label.
   */
  description?: string;

  /**
   * Deshabilita solamente esta opción.
   */
  disabled?: boolean;
}

interface SelectProps<
  T extends SelectValue = SelectValue,
> {
  /**
   * Valor seleccionado.
   */
  value?: T;

  /**
   * Opciones disponibles.
   */
  options: SelectOption<T>[];

  /**
   * Se ejecuta al seleccionar.
   */
  onValueChange: (
    value: T,
  ) => void;

  /**
   * Etiqueta superior.
   */
  label?: string;

  /**
   * Texto cuando no existe selección.
   */
  placeholder?: string;

  /**
   * Texto de error.
   */
  error?: string;

  /**
   * Texto auxiliar.
   */
  helperText?: string;

  /**
   * Deshabilita todo el selector.
   */
  disabled?: boolean;

  /**
   * Habilita el SearchBar.
   */
  searchable?: boolean;

  /**
   * Placeholder del SearchBar.
   */
  searchPlaceholder?: string;

  /**
   * Título mostrado en el modal.
   */
  modalTitle?: string;

  /**
   * Texto cuando no existen resultados.
   */
  emptyText?: string;

  /**
   * Etiqueta de accesibilidad.
   */
  accessibilityLabel?: string;
}

/*
|--------------------------------------------------------------------------
| SELECT
|--------------------------------------------------------------------------
*/

export function Select<
  T extends SelectValue = SelectValue,
>({
  value,
  options,
  onValueChange,
  label,
  placeholder =
    "Seleccione una opción",
  error,
  helperText,
  disabled = false,
  searchable = false,
  searchPlaceholder =
    "Buscar...",
  modalTitle =
    "Seleccione una opción",
  emptyText =
    "No existen opciones disponibles.",
  accessibilityLabel,
}: SelectProps<T>) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  /*
  |--------------------------------------------------------------------------
  | ESTADO
  |--------------------------------------------------------------------------
  */

  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    search,
    setSearch,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | OPCIÓN SELECCIONADA
  |--------------------------------------------------------------------------
  */

  const selectedOption =
    useMemo(
      () =>
        options.find(
          (
            option,
          ) =>
            option.value ===
            value,
        ),
      [
        options,
        value,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | OPCIONES FILTRADAS
  |--------------------------------------------------------------------------
  */

  const filteredOptions =
    useMemo(
      () => {
        const normalized =
          search
            .trim()
            .toLowerCase();

        if (!normalized) {
          return options;
        }

        return options.filter(
          (
            option,
          ) => {
            const labelMatch =
              option.label
                .toLowerCase()
                .includes(
                  normalized,
                );

            const descriptionMatch =
              option.description
                ?.toLowerCase()
                .includes(
                  normalized,
                ) ??
              false;

            return (
              labelMatch ||
              descriptionMatch
            );
          },
        );
      },
      [
        options,
        search,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | ABRIR
  |--------------------------------------------------------------------------
  */

  const handleOpen =
    () => {
      if (disabled) {
        return;
      }

      setSearch("");

      setOpen(
        true,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CERRAR
  |--------------------------------------------------------------------------
  */

  const handleClose =
    () => {
      setOpen(
        false,
      );

      setSearch("");
    };

  /*
  |--------------------------------------------------------------------------
  | SELECCIONAR
  |--------------------------------------------------------------------------
  */

  const handleSelect = (
    option:
      SelectOption<T>,
  ) => {
    if (
      option.disabled
    ) {
      return;
    }

    onValueChange(
      option.value,
    );

    handleClose();
  };

  /*
  |--------------------------------------------------------------------------
  | COLOR DEL TRIGGER
  |--------------------------------------------------------------------------
  */

  const borderColor =
    error
      ? c.destructive
      : open
        ? c.primary
        : c.inputBorder;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={
        styles.wrapper
      }
    >
      {/* ======================================================= */}
      {/* LABEL */}
      {/* ======================================================= */}

      {label ? (
        <ThemedText
          style={[
            styles.label,

            {
              color:
                c.text,
            },
          ]}
        >
          {label}
        </ThemedText>
      ) : null}

      {/* ======================================================= */}
      {/* TRIGGER */}
      {/* ======================================================= */}

      <Pressable
        onPress={
          handleOpen
        }
        disabled={
          disabled
        }
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel ??
          label ??
          placeholder
        }
        accessibilityState={{
          disabled,

          expanded:
            open,
        }}
        style={({
          pressed,
        }) => [
          styles.trigger,

          {
            backgroundColor:
              c.input,

            borderColor,

            opacity:
              disabled
                ? 0.55
                : pressed
                  ? 0.85
                  : 1,
          },
        ]}
      >
        {/* TEXTO */}

        <View
          style={
            styles.triggerText
          }
        >
          <ThemedText
            numberOfLines={
              1
            }
            style={[
              styles.valueText,

              {
                color:
                  selectedOption
                    ? c.text
                    : c.textMuted,
              },
            ]}
          >
            {selectedOption
              ? selectedOption.label
              : placeholder}
          </ThemedText>

          {selectedOption
            ?.description ? (
            <ThemedText
              numberOfLines={
                1
              }
              style={[
                styles.selectedDescription,

                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              {
                selectedOption
                  .description
              }
            </ThemedText>
          ) : null}
        </View>

        {/* CHEVRON */}

        <View
          style={[
            styles.chevronContainer,

            {
              backgroundColor:
                open
                  ? c.primarySubtle
                  : c.backgroundSecondary,
            },
          ]}
        >
          <ChevronDown
            size={18}
            color={
              open
                ? c.primary
                : c.textSecondary
            }
            strokeWidth={
              2
            }
          />
        </View>
      </Pressable>

      {/* ======================================================= */}
      {/* ERROR / HELPER */}
      {/* ======================================================= */}

      {error ? (
        <ThemedText
          style={[
            styles.helper,

            {
              color:
                c.destructive,
            },
          ]}
        >
          {error}
        </ThemedText>
      ) : helperText ? (
        <ThemedText
          style={[
            styles.helper,

            {
              color:
                c.textSecondary,
            },
          ]}
        >
          {helperText}
        </ThemedText>
      ) : null}

      {/* ======================================================= */}
      {/* MODAL */}
      {/* ======================================================= */}

      <Modal
        visible={
          open
        }
        transparent
        animationType="fade"
        onRequestClose={
          handleClose
        }
        statusBarTranslucent
      >
        <View
          style={
            styles.modalRoot
          }
        >
          {/* BACKDROP */}

          <Pressable
            style={[
              StyleSheet.absoluteFill,
              styles.backdrop,
            ]}
            onPress={
              handleClose
            }
            accessibilityLabel="Cerrar selector"
          />

          {/* PANEL */}

          <View
            style={[
              styles.panel,

              {
                backgroundColor:
                  c.popover,

                borderColor:
                  c.border,
              },
            ]}
          >
            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <View
              style={[
                styles.modalHeader,

                {
                  borderBottomColor:
                    c.border,
                },
              ]}
            >
              <View
                style={
                  styles.modalHeaderText
                }
              >
                <ThemedText
                  style={[
                    styles.modalTitle,

                    {
                      color:
                        c.text,
                    },
                  ]}
                >
                  {modalTitle}
                </ThemedText>

                <ThemedText
                  style={[
                    styles.modalSubtitle,

                    {
                      color:
                        c.textSecondary,
                    },
                  ]}
                >
                  {
                    options.length
                  }{" "}
                  {options.length ===
                  1
                    ? "opción"
                    : "opciones"}
                </ThemedText>
              </View>

              <Pressable
                onPress={
                  handleClose
                }
                hitSlop={
                  10
                }
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                style={({
                  pressed,
                }) => [
                  styles.closeButton,

                  {
                    backgroundColor:
                      c.backgroundSecondary,

                    opacity:
                      pressed
                        ? 0.65
                        : 1,
                  },
                ]}
              >
                <X
                  size={18}
                  color={
                    c.textSecondary
                  }
                />
              </Pressable>
            </View>

            {/* ================================================= */}
            {/* SEARCH BAR REUTILIZABLE */}
            {/* ================================================= */}

            {searchable ? (
              <View
                style={
                  styles.searchWrapper
                }
              >
                <SearchBar
                  value={
                    search
                  }
                  onChangeText={
                    setSearch
                  }
                  placeholder={
                    searchPlaceholder
                  }
                />
              </View>
            ) : null}

            {/* ================================================= */}
            {/* LISTA */}
            {/* ================================================= */}

            <ScrollView
              style={
                styles.optionsList
              }
              contentContainerStyle={
                styles.optionsContent
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {filteredOptions.length >
              0 ? (
                filteredOptions.map(
                  (
                    option,
                    index,
                  ) => {
                    const selected =
                      option.value ===
                      value;

                    const isLast =
                      index ===
                      filteredOptions.length -
                        1;

                    return (
                      <Pressable
                        key={
                          String(
                            option.value,
                          )
                        }
                        disabled={
                          option.disabled
                        }
                        onPress={() =>
                          handleSelect(
                            option,
                          )
                        }
                        accessibilityRole="button"
                        accessibilityState={{
                          selected,

                          disabled:
                            option.disabled,
                        }}
                        style={({
                          pressed,
                        }) => [
                          styles.option,

                          {
                            backgroundColor:
                              selected
                                ? c.primarySubtle
                                : pressed
                                  ? c.input
                                  : c.backgroundSecondary,

                            borderColor:
                              selected
                                ? c.primary
                                : c.border,

                            opacity:
                              option.disabled
                                ? 0.45
                                : 1,

                            marginBottom:
                              isLast
                                ? 0
                                : 10,
                          },
                        ]}
                      >
                        {/* ACENTO IZQUIERDO */}

                        <View
                          style={[
                            styles.optionAccent,

                            {
                              backgroundColor:
                                selected
                                  ? c.primary
                                  : "transparent",
                            },
                          ]}
                        />

                        {/* TEXTO */}

                        <View
                          style={
                            styles.optionTextContainer
                          }
                        >
                          <ThemedText
                            numberOfLines={
                              1
                            }
                            style={[
                              styles.optionLabel,

                              {
                                color:
                                  selected
                                    ? c.primary
                                    : c.text,
                              },
                            ]}
                          >
                            {
                              option.label
                            }
                          </ThemedText>

                          {option.description ? (
                            <ThemedText
                              numberOfLines={
                                2
                              }
                              style={[
                                styles.optionDescription,

                                {
                                  color:
                                    c.textSecondary,
                                },
                              ]}
                            >
                              {
                                option.description
                              }
                            </ThemedText>
                          ) : null}
                        </View>

                        {/* CHECK */}

                        {selected ? (
                          <View
                            style={[
                              styles.checkContainer,

                              {
                                backgroundColor:
                                  c.primary,
                              },
                            ]}
                          >
                            <Check
                              size={15}
                              strokeWidth={
                                2.5
                              }
                              color={
                                c.primaryForeground
                              }
                            />
                          </View>
                        ) : (
                          /*
                           * Reservamos el espacio para mantener
                           * alineadas todas las opciones.
                           */
                          <View
                            style={
                              styles.checkPlaceholder
                            }
                          />
                        )}
                      </Pressable>
                    );
                  },
                )
              ) : (
                /* ============================================= */
                /* EMPTY */
                /* ============================================= */

                <View
                  style={
                    styles.emptyContainer
                  }
                >
                  <View
                    style={[
                      styles.emptyIcon,

                      {
                        backgroundColor:
                          c.backgroundSecondary,
                      },
                    ]}
                  >
                    <Search
                      size={24}
                      color={
                        c.textMuted
                      }
                    />
                  </View>

                  <ThemedText
                    style={[
                      styles.emptyText,

                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    {emptyText}
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    | WRAPPER
    |--------------------------------------------------------------------------
    */

    wrapper: {
      width:
        "100%",
    },

    /*
    |--------------------------------------------------------------------------
    | LABEL
    |--------------------------------------------------------------------------
    */

    label: {
      fontSize:
        13,

      fontWeight:
        "600",

      marginBottom:
        6,
    },

    /*
    |--------------------------------------------------------------------------
    | TRIGGER
    |--------------------------------------------------------------------------
    */

    trigger: {
      minHeight:
        48,

      flexDirection:
        "row",

      alignItems:
        "center",

      borderWidth:
        1,

      borderRadius:
        10,

      paddingLeft:
        14,

      paddingRight:
        8,

      gap:
        10,
    },

    triggerText: {
      flex:
        1,

      minWidth:
        0,

      justifyContent:
        "center",
    },

    valueText: {
      fontSize:
        14,

      fontWeight:
        "500",
    },

    selectedDescription: {
      fontSize:
        11,

      marginTop:
        2,
    },

    chevronContainer: {
      width:
        32,

      height:
        32,

      borderRadius:
        8,

      alignItems:
        "center",

      justifyContent:
        "center",

      flexShrink:
        0,
    },

    /*
    |--------------------------------------------------------------------------
    | HELPER
    |--------------------------------------------------------------------------
    */

    helper: {
      fontSize:
        12,

      lineHeight:
        17,

      marginTop:
        5,
    },

    /*
    |--------------------------------------------------------------------------
    | MODAL
    |--------------------------------------------------------------------------
    */

    modalRoot: {
      flex:
        1,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal:
        20,
    },

    backdrop: {
      backgroundColor:
        "rgba(0, 0, 0, 0.52)",
    },

    panel: {
      width:
        "100%",

      maxWidth:
        480,

      maxHeight:
        "76%",

      borderWidth:
        1,

      borderRadius:
        18,

      overflow:
        "hidden",

      elevation:
        20,
    },

    /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

    modalHeader: {
      minHeight:
        70,

      flexDirection:
        "row",

      alignItems:
        "center",

      paddingHorizontal:
        18,

      paddingVertical:
        13,

      borderBottomWidth:
        1,

      gap:
        12,
    },

    modalHeaderText: {
      flex:
        1,
    },

    modalTitle: {
      fontSize:
        16,

      fontWeight:
        "800",
    },

    modalSubtitle: {
      marginTop:
        3,

      fontSize:
        12,
    },

    closeButton: {
      width:
        36,

      height:
        36,

      borderRadius:
        10,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    |
    | Ya no tenemos otro TextInput.
    |
    | Reutilizamos:
    |
    | components/ui/SearchBar.tsx
    |
    */

    searchWrapper: {
      width:
        "100%",

      paddingHorizontal:
        16,

      paddingTop:
        16,
    },

    /*
    |--------------------------------------------------------------------------
    | OPTIONS
    |--------------------------------------------------------------------------
    */

    optionsList: {
      maxHeight:
        380,
    },

    optionsContent: {
      padding:
        16,
    },

    option: {
      position:
        "relative",

      minHeight:
        58,

      flexDirection:
        "row",

      alignItems:
        "center",

      borderWidth:
        1,

      borderRadius:
        12,

      paddingLeft:
        17,

      paddingRight:
        12,

      paddingVertical:
        11,

      gap:
        12,

      overflow:
        "hidden",
    },

    /*
     * Indicador lateral de opción activa.
     */

    optionAccent: {
      position:
        "absolute",

      left:
        0,

      top:
        8,

      bottom:
        8,

      width:
        3,

      borderRadius:
        999,
    },

    optionTextContainer: {
      flex:
        1,

      minWidth:
        0,

      justifyContent:
        "center",
    },

    optionLabel: {
      fontSize:
        14,

      fontWeight:
        "700",

      lineHeight:
        19,
    },

    optionDescription: {
      fontSize:
        12,

      lineHeight:
        17,

      marginTop:
        3,
    },

    /*
    |--------------------------------------------------------------------------
    | CHECK
    |--------------------------------------------------------------------------
    */

    checkContainer: {
      width:
        28,

      height:
        28,

      borderRadius:
        9,

      alignItems:
        "center",

      justifyContent:
        "center",

      flexShrink:
        0,
    },

    checkPlaceholder: {
      width:
        28,

      height:
        28,

      flexShrink:
        0,
    },

    /*
    |--------------------------------------------------------------------------
    | EMPTY
    |--------------------------------------------------------------------------
    */

    emptyContainer: {
      minHeight:
        140,

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        10,

      padding:
        20,
    },

    emptyIcon: {
      width:
        44,

      height:
        44,

      borderRadius:
        12,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    emptyText: {
      fontSize:
        13,

      textAlign:
        "center",
    },
  });