// screens/admin/modulos/components/ModuloModal.tsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  ThemedText,
} from "@/components/ThemedText";

import Visibility from "@/components/Visibility";

import {
  Badge,
} from "@/components/ui/Badge";

import {
  Button,
} from "@/components/ui/Button";

import {
  Checkbox,
} from "@/components/ui/Checkbox";

import {
  EmptyState,
} from "@/components/ui/EmptyState";

import {
  Input,
} from "@/components/ui/Input";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  Switch,
} from "@/components/ui/Switch";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  adminService,
} from "../../services/admin.service";

import {
  AdminFormulario,
} from "../../types/admin.types";

import {
  AVAILABLE_ICONS,
  CreateModuloPayload,
  Estado,
  getIconsByCategory,
  ICON_CATEGORIES,
  IconCategory,
  Modulo,
} from "../types/modulo.types";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type Props = {
  visible: boolean;

  modulo?:
    | Modulo
    | null;

  onClose: () => void;

  onSubmit: (
    payload: CreateModuloPayload,
  ) => Promise<boolean>;
};

type Categoria =
  | IconCategory
  | "Todos";

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function ModuloModal({
  visible,
  modulo,
  onClose,
  onSubmit,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const {
    height:
      screenHeight,
  } =
    useWindowDimensions();

  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */

  const [
    titulo,
    setTitulo,
  ] =
    useState("");

  const [
    descripcion,
    setDescripcion,
  ] =
    useState("");

  const [
    icono,
    setIcono,
  ] =
    useState(
      "home",
    );

  const [
    estado,
    setEstado,
  ] =
    useState<Estado>(
      "Activo",
    );

  const [
    categoria,
    setCategoria,
  ] =
    useState<Categoria>(
      "Académico",
    );

  /*
  |--------------------------------------------------------------------------
  | FORMULARIOS
  |--------------------------------------------------------------------------
  */

  const [
    formularios,
    setFormularios,
  ] =
    useState<
      AdminFormulario[]
    >(
      [],
    );

  const [
    seleccionados,
    setSeleccionados,
  ] =
    useState<
      Set<number>
    >(
      new Set(),
    );

  const [
    mostrarForms,
    setMostrarForms,
  ] =
    useState(
      false,
    );

  const [
    loadingForms,
    setLoadingForms,
  ] =
    useState(
      false,
    );

  /*
  |--------------------------------------------------------------------------
  | ESTADO UI
  |--------------------------------------------------------------------------
  */

  const [
    saving,
    setSaving,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | FLAGS
  |--------------------------------------------------------------------------
  */

  const editing =
    !!modulo;

  const action =
    editing
      ? "Editar"
      : "Crear";

  /*
  |--------------------------------------------------------------------------
  | ALTURA DEL SCROLL GENERAL
  |--------------------------------------------------------------------------
  */

  const bodyMaxHeight =
    useMemo(
      () =>
        Math.max(
          360,

          Math.min(
            680,

            screenHeight -
              170,
          ),
        ),
      [
        screenHeight,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | ICONOS
  |--------------------------------------------------------------------------
  */

  const icons =
    useMemo(
      () =>
        categoria ===
        "Todos"
          ? AVAILABLE_ICONS
          : getIconsByCategory(
              categoria,
            ),
      [
        categoria,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | ICONO SELECCIONADO
  |--------------------------------------------------------------------------
  */

  const selectedIcon =
    useMemo(
      () =>
        AVAILABLE_ICONS.find(
          (
            item,
          ) =>
            item.key ===
            icono,
        ),
      [
        icono,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | INIT
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (!visible) {
        return;
      }

      setTitulo(
        modulo?.modulo ??
          "",
      );

      setDescripcion(
        modulo?.descripcion ??
          "",
      );

      setIcono(
        modulo?.icono ??
          "home",
      );

      setEstado(
        modulo?.estado ??
          "Activo",
      );

      setSeleccionados(
        new Set(
          (
            modulo?.formularios ??
            []
          ).map(
            (
              form,
            ) =>
              form.id,
          ),
        ),
      );

      /*
       * Formularios cerrados inicialmente
       * para mantener el modal compacto.
       */

      setMostrarForms(
        false,
      );

      setError(
        "",
      );

      /*
      |--------------------------------------------------------------------------
      | CARGAR FORMULARIOS
      |--------------------------------------------------------------------------
      */

      setLoadingForms(
        true,
      );

      adminService
        .getFormularios()
        .then(
          setFormularios,
        )
        .finally(
          () =>
            setLoadingForms(
              false,
            ),
        );
    },
    [
      visible,
      modulo,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | TOGGLE FORMULARIO
  |--------------------------------------------------------------------------
  */

  const toggleForm =
    (
      id: number,
    ) => {
      setSeleccionados(
        (
          current,
        ) => {
          const next =
            new Set(
              current,
            );

          if (
            next.has(
              id,
            )
          ) {
            next.delete(
              id,
            );
          } else {
            next.add(
              id,
            );
          }

          return next;
        },
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CLOSE
  |--------------------------------------------------------------------------
  */

  const handleClose =
    () => {
      if (
        saving
      ) {
        return;
      }

      onClose();
    };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const submit =
    async () => {
      const nombre =
        titulo.trim();

      if (!nombre) {
        setError(
          "El nombre del módulo es obligatorio.",
        );

        return;
      }

      if (
        nombre.length >
        40
      ) {
        setError(
          "Máximo 40 caracteres.",
        );

        return;
      }

      setSaving(
        true,
      );

      try {
        const ok =
          await onSubmit({
            modulo:
              nombre,

            descripcion:
              descripcion
                .trim() ||
              undefined,

            icono,

            estado,

            formularios:
              Array.from(
                seleccionados,
              ),
          });

        if (ok) {
          onClose();
        }
      } finally {
        setSaving(
          false,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | FOOTER
  |--------------------------------------------------------------------------
  */

  const footer =
    (
      <View
        style={
          styles.footer
        }
      >
        <Button
          title="Cancelar"
          variant="secondary"
          disabled={
            saving
          }
          onPress={
            handleClose
          }
        />

        <Visibility
          action={
            action
          }
          selector={
            editing
              ? ".modulos-guardar-edicion"
              : ".modulos-guardar-creacion"
          }
        >
          <Button
            title={
              editing
                ? "Guardar cambios"
                : "Crear módulo"
            }
            loading={
              saving
            }
            disabled={
              saving
            }
            onPress={() => {
              void submit();
            }}
          />
        </Visibility>
      </View>
    );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <Modal
      visible={
        visible
      }
      title={
        editing
          ? "Editar módulo"
          : "Nuevo módulo"
      }
      onClose={
        handleClose
      }
      closeOnBackdropPress={
        !saving
      }
      width="94%"
      maxWidth={580}
      footer={
        footer
      }
    >
      {/* ================================================= */}
      {/* SCROLL GENERAL DEL MODAL */}
      {/* ================================================= */}

      <ScrollView
        style={[
          styles.body,

          {
            maxHeight:
              bodyMaxHeight,
          },
        ]}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <Visibility
          action={
            action
          }
          selector={
            editing
              ? ".modulos-form-editar"
              : ".modulos-form-crear"
          }
        >
          <View
            style={
              styles.formContent
            }
          >
            {/* ================================================= */}
            {/* NOMBRE */}
            {/* ================================================= */}

            <Input
              label="Nombre del módulo"
              value={
                titulo
              }
              placeholder="Ej: Control Académico"
              maxLength={40}
              error={
                error
              }
              onChangeText={(
                value,
              ) => {
                setTitulo(
                  value,
                );

                if (
                  error
                ) {
                  setError(
                    "",
                  );
                }
              }}
            />

            {/* ================================================= */}
            {/* DESCRIPCIÓN */}
            {/* ================================================= */}

            <Input
              label="Descripción"
              value={
                descripcion
              }
              placeholder="Describe brevemente la función del módulo"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              onChangeText={
                setDescripcion
              }
            />

            {/* ================================================= */}
            {/* ESTADO */}
            {/* ================================================= */}

            <Visibility
              action={
                action
              }
              selector=".modulos-estado"
            >
              <View
                style={[
                  styles.status,

                  {
                    backgroundColor:
                      c.backgroundSecondary,

                    borderColor:
                      c.border,
                  },
                ]}
              >
                <Switch
                  label={
                    estado
                  }
                  description={
                    estado ===
                    "Activo"
                      ? "El módulo está habilitado"
                      : "El módulo está deshabilitado"
                  }
                  value={
                    estado ===
                    "Activo"
                  }
                  onValueChange={(
                    value,
                  ) =>
                    setEstado(
                      value
                        ? "Activo"
                        : "Inactivo",
                    )
                  }
                />
              </View>
            </Visibility>

            {/* ================================================= */}
            {/* ICONOS */}
            {/* ================================================= */}

            <Visibility
              action={
                action
              }
              selector=".modulos-icono"
            >
              <View
                style={
                  styles.section
                }
              >
                {/* ============================================= */}
                {/* HEADER */}
                {/* ============================================= */}

                <View
                  style={
                    styles.sectionHeader
                  }
                >
                  <View
                    style={
                      styles.sectionCopy
                    }
                  >
                    <ThemedText
                      style={
                        styles.label
                      }
                    >
                      Ícono
                    </ThemedText>

                    <ThemedText
                      style={[
                        styles.helper,

                        {
                          color:
                            c.textSecondary,
                        },
                      ]}
                    >
                      Selecciona un ícono para el módulo
                    </ThemedText>
                  </View>

                  {/* =========================================== */}
                  {/* ICONO ACTUAL */}
                  {/* =========================================== */}

                  <View
                    style={[
                      styles.selectedIcon,

                      {
                        borderColor:
                          c.primary,

                        backgroundColor:
                          c.primarySubtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        (
                          selectedIcon
                            ?.ionicon ??
                          "apps-outline"
                        ) as any
                      }
                      size={20}
                      color={
                        c.primary
                      }
                    />
                  </View>
                </View>

                {/* ============================================= */}
                {/* CATEGORÍAS CON SCROLL HORIZONTAL */}
                {/* ============================================= */}

                <View
                  style={
                    styles.categoriesWrapper
                  }
                >
                  <ScrollView
                    horizontal
                    style={
                      styles.categoriesScroll
                    }
                    contentContainerStyle={
                      styles.categories
                    }

                    /*
                     * Mostramos scrollbar horizontal.
                     */

                    showsHorizontalScrollIndicator
                    keyboardShouldPersistTaps="handled"
                    directionalLockEnabled
                  >
                    {(
                      [
                        "Todos",
                        ...ICON_CATEGORIES,
                      ] as Categoria[]
                    ).map(
                      (
                        cat,
                      ) => {
                        const active =
                          categoria ===
                          cat;

                        return (
                          <Pressable
                            key={
                              cat
                            }
                            onPress={() =>
                              setCategoria(
                                cat,
                              )
                            }
                            style={({
                              pressed,
                            }) => [
                              styles.category,

                              {
                                borderColor:
                                  active
                                    ? c.primary
                                    : c.border,

                                backgroundColor:
                                  active
                                    ? c.primarySubtle
                                    : c.backgroundSecondary,

                                opacity:
                                  pressed
                                    ? 0.75
                                    : 1,
                              },
                            ]}
                          >
                            <ThemedText
                              numberOfLines={
                                1
                              }
                              style={{
                                color:
                                  active
                                    ? c.primary
                                    : c.textSecondary,

                                fontSize:
                                  10,

                                fontWeight:
                                  "700",
                              }}
                            >
                              {
                                cat
                              }
                            </ThemedText>
                          </Pressable>
                        );
                      },
                    )}
                  </ScrollView>
                </View>

                {/* ============================================= */}
                {/* ICONOS COMPACTOS */}
                {/* ============================================= */}

                <View
                  style={[
                    styles.icons,

                    {
                      backgroundColor:
                        c.backgroundSecondary,

                      borderColor:
                        c.border,
                    },
                  ]}
                >
                  {icons.map(
                    (
                      item,
                    ) => {
                      const selected =
                        icono ===
                        item.key;

                      return (
                        <Pressable
                          key={
                            item.key
                          }
                          onPress={() =>
                            setIcono(
                              item.key,
                            )
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Seleccionar icono ${item.key}`}
                          style={({
                            pressed,
                          }) => [
                            styles.icon,

                            {
                              borderColor:
                                selected
                                  ? c.primary
                                  : "transparent",

                              backgroundColor:
                                selected
                                  ? c.primarySubtle
                                  : "transparent",

                              opacity:
                                pressed
                                  ? 0.7
                                  : 1,
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              item.ionicon as any
                            }
                            size={20}
                            color={
                              selected
                                ? c.primary
                                : c.textMuted
                            }
                          />
                        </Pressable>
                      );
                    },
                  )}
                </View>
              </View>
            </Visibility>

            {/* ================================================= */}
            {/* FORMULARIOS */}
            {/* ================================================= */}

            <Visibility
              action={
                action
              }
              selector=".modulos-formularios"
            >
              <View
                style={
                  styles.section
                }
              >
                {/* ============================================= */}
                {/* HEADER */}
                {/* ============================================= */}

                <View
                  style={
                    styles.sectionHeader
                  }
                >
                  <View
                    style={
                      styles.sectionCopy
                    }
                  >
                    <View
                      style={
                        styles.formsTitle
                      }
                    >
                      <ThemedText
                        style={
                          styles.label
                        }
                      >
                        Formularios vinculados
                      </ThemedText>

                      <Badge
                        label={
                          String(
                            seleccionados.size,
                          )
                        }
                        variant={
                          seleccionados.size >
                          0
                            ? "info"
                            : "muted"
                        }
                      />
                    </View>

                    <ThemedText
                      style={[
                        styles.helper,

                        {
                          color:
                            c.textSecondary,
                        },
                      ]}
                    >
                      Selecciona los formularios que pertenecerán al módulo.
                    </ThemedText>
                  </View>

                  <Button
                    title={
                      mostrarForms
                        ? "Ocultar"
                        : "Seleccionar"
                    }
                    variant="secondary"
                    loading={
                      loadingForms
                    }
                    disabled={
                      loadingForms
                    }
                    onPress={() =>
                      setMostrarForms(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                  />
                </View>

                {/* ============================================= */}
                {/* LISTADO */}
                {/* ============================================= */}

                {mostrarForms ? (
                  formularios.length >
                  0 ? (
                    <View
                      style={[
                        styles.forms,

                        {
                          backgroundColor:
                            c.backgroundSecondary,

                          borderColor:
                            c.border,
                        },
                      ]}
                    >
                      {formularios.map(
                        (
                          form,
                          index,
                        ) => {
                          const checked =
                            seleccionados.has(
                              form.id,
                            );

                          return (
                            <View
                              key={
                                form.id
                              }
                              style={[
                                styles.form,

                                index <
                                  formularios.length -
                                    1 && {
                                  borderBottomWidth:
                                    1,

                                  borderBottomColor:
                                    c.border,
                                },
                              ]}
                            >
                              <Checkbox
                                checked={
                                  checked
                                }
                                onPress={() =>
                                  toggleForm(
                                    form.id,
                                  )
                                }
                                accessibilityLabel={`Seleccionar ${form.formulario}`}
                              />

                              <Pressable
                                style={
                                  styles.formText
                                }
                                onPress={() =>
                                  toggleForm(
                                    form.id,
                                  )
                                }
                              >
                                <ThemedText
                                  numberOfLines={
                                    1
                                  }
                                  style={
                                    styles.formName
                                  }
                                >
                                  {
                                    form.formulario
                                  }
                                </ThemedText>

                                {!!form.ruta && (
                                  <ThemedText
                                    numberOfLines={
                                      1
                                    }
                                    style={[
                                      styles.formRoute,

                                      {
                                        color:
                                          c.textMuted,
                                      },
                                    ]}
                                  >
                                    {
                                      form.ruta
                                    }
                                  </ThemedText>
                                )}
                              </Pressable>
                            </View>
                          );
                        },
                      )}
                    </View>
                  ) : (
                    <EmptyState
                      icon="document-text-outline"
                      title="Sin formularios"
                      subtitle="No existen formularios disponibles para vincular."
                    />
                  )
                ) : (
                  /*
                  |--------------------------------------------------------------------------
                  | RESUMEN DE SELECCIONADOS
                  |--------------------------------------------------------------------------
                  */

                  <View
                    style={
                      styles.chips
                    }
                  >
                    {formularios
                      .filter(
                        (
                          form,
                        ) =>
                          seleccionados.has(
                            form.id,
                          ),
                      )
                      .slice(
                        0,
                        5,
                      )
                      .map(
                        (
                          form,
                        ) => (
                          <Pressable
                            key={
                              form.id
                            }
                            onPress={() =>
                              toggleForm(
                                form.id,
                              )
                            }
                          >
                            <Badge
                              label={
                                form.formulario
                              }
                              variant="info"
                            />
                          </Pressable>
                        ),
                      )}

                    {seleccionados.size >
                    5 ? (
                      <Badge
                        label={`+${
                          seleccionados.size -
                          5
                        }`}
                        variant="muted"
                      />
                    ) : null}

                    {seleccionados.size ===
                    0 ? (
                      <ThemedText
                        style={[
                          styles.emptySelection,

                          {
                            color:
                              c.textMuted,
                          },
                        ]}
                      >
                        Sin formularios seleccionados.
                      </ThemedText>
                    ) : null}
                  </View>
                )}
              </View>
            </Visibility>
          </View>
        </Visibility>
      </ScrollView>
    </Modal>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    /*
    |--------------------------------------------------------------------------
    | SCROLL GENERAL
    |--------------------------------------------------------------------------
    */

    body: {
      width:
        "100%",
    },

    content: {
      paddingBottom:
        14,
    },

    formContent: {
      gap:
        13,
    },

    /*
    |--------------------------------------------------------------------------
    | ESTADO
    |--------------------------------------------------------------------------
    */

    status: {
      borderWidth:
        1,

      borderRadius:
        10,

      paddingHorizontal:
        10,

      paddingVertical:
        8,
    },

    /*
    |--------------------------------------------------------------------------
    | SECCIONES
    |--------------------------------------------------------------------------
    */

    section: {
      gap:
        8,
    },

    sectionHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        10,
    },

    sectionCopy: {
      flex:
        1,

      minWidth:
        0,
    },

    label: {
      fontSize:
        11,

      fontWeight:
        "800",
    },

    helper: {
      marginTop:
        1,

      fontSize:
        9,

      lineHeight:
        13,
    },

    /*
    |--------------------------------------------------------------------------
    | ICONO SELECCIONADO
    |--------------------------------------------------------------------------
    */

    selectedIcon: {
      width:
        38,

      height:
        38,

      borderRadius:
        10,

      borderWidth:
        1,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | CATEGORÍAS
    |--------------------------------------------------------------------------
    */

    categoriesWrapper: {
      width:
        "100%",

      minWidth:
        0,
    },

    categoriesScroll: {
      width:
        "100%",

      flexGrow:
        0,
    },

    categories: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        5,

      paddingRight:
        14,

      /*
       * Espacio para que la barra horizontal
       * no quede pegada a los chips.
       */

      paddingBottom:
        8,
    },

    category: {
      flexShrink:
        0,

      paddingHorizontal:
        9,

      paddingVertical:
        5,

      borderWidth:
        1,

      borderRadius:
        999,
    },

    /*
    |--------------------------------------------------------------------------
    | ICONOS
    |--------------------------------------------------------------------------
    */

    icons: {
      width:
        "100%",

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        4,

      padding:
        7,

      borderWidth:
        1,

      borderRadius:
        10,
    },

    icon: {
      width:
        40,

      height:
        40,

      borderWidth:
        1.5,

      borderRadius:
        8,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | FORMULARIOS
    |--------------------------------------------------------------------------
    */

    formsTitle: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        6,
    },

    forms: {
      width:
        "100%",

      borderWidth:
        1,

      borderRadius:
        10,

      overflow:
        "hidden",
    },

    form: {
      minHeight:
        44,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        9,

      paddingHorizontal:
        10,

      paddingVertical:
        7,
    },

    formText: {
      flex:
        1,

      minWidth:
        0,
    },

    formName: {
      fontSize:
        11,

      fontWeight:
        "700",
    },

    formRoute: {
      marginTop:
        1,

      fontSize:
        9,
    },

    /*
    |--------------------------------------------------------------------------
    | CHIPS
    |--------------------------------------------------------------------------
    */

    chips: {
      minHeight:
        25,

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      alignItems:
        "center",

      gap:
        5,
    },

    emptySelection: {
      fontSize:
        10,
    },

    /*
    |--------------------------------------------------------------------------
    | FOOTER
    |--------------------------------------------------------------------------
    */

    footer: {
      width:
        "100%",

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      justifyContent:
        "flex-end",

      gap:
        8,
    },
  });

export default ModuloModal;