// screens/admin/formularios/FormularioFormModal.tsx

import {
  useEffect,
  useState,
} from "react";

import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";

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
  moduloService,
} from "../modulos/services/modulo.service";

import {
  Modulo,
} from "../modulos/types/modulo.types";

import {
  AdminFormulario,
  CreateFormularioPayload,
  Estado,
} from "../types/admin.types";

const RUTA_REGEX =
  /^\/[a-z0-9\-_/]*$/i;

type Props = {
  visible: boolean;

  formulario?:
    | AdminFormulario
    | null;

  saving: boolean;

  onClose:
    () => void;

  onSave: (
    payload:
      CreateFormularioPayload,
  ) =>
    Promise<boolean>;
};

export function FormularioFormModal({
  visible,
  formulario,
  saving,
  onClose,
  onSave,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */

  const [
    nombre,
    setNombre,
  ] =
    useState("");

  const [
    ruta,
    setRuta,
  ] =
    useState("");

  const [
    descripcion,
    setDescripcion,
  ] =
    useState("");

  const [
    estado,
    setEstado,
  ] =
    useState<Estado>(
      "Activo",
    );

  /*
  |--------------------------------------------------------------------------
  | MÓDULOS
  |--------------------------------------------------------------------------
  */

  const [
    modulos,
    setModulos,
  ] =
    useState<
      Modulo[]
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
    mostrarModulos,
    setMostrarModulos,
  ] =
    useState(
      false,
    );

  const [
    loadingModulos,
    setLoadingModulos,
  ] =
    useState(
      false,
    );

  /*
  |--------------------------------------------------------------------------
  | VALIDACIONES
  |--------------------------------------------------------------------------
  */

  const [
    nombreError,
    setNombreError,
  ] =
    useState("");

  const [
    rutaError,
    setRutaError,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | MODE
  |--------------------------------------------------------------------------
  */

  const editing =
    !!formulario;

  const action =
    editing
      ? "Editar"
      : "Crear";

  /*
  |--------------------------------------------------------------------------
  | INIT
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !visible
      ) {
        return;
      }

      let active =
        true;

      setNombre(
        formulario
          ?.formulario ??
          "",
      );

      setRuta(
        formulario
          ?.ruta ??
          "",
      );

      setDescripcion(
        formulario
          ?.descripcion ??
          "",
      );

      setEstado(
        formulario
          ?.estado ??
          "Activo",
      );

      setSeleccionados(
        new Set(
          (
            formulario
              ?.modulos ??
            []
          ).map(
            (
              modulo,
            ) =>
              modulo.id,
          ),
        ),
      );

      setMostrarModulos(
        false,
      );

      setNombreError(
        "",
      );

      setRutaError(
        "",
      );

      setLoadingModulos(
        true,
      );

      void moduloService
        .getAll()
        .then(
          (
            data,
          ) => {
            if (
              active
            ) {
              setModulos(
                data,
              );
            }
          },
        )
        .catch(
          () => {
            if (
              active
            ) {
              setModulos(
                [],
              );
            }
          },
        )
        .finally(
          () => {
            if (
              active
            ) {
              setLoadingModulos(
                false,
              );
            }
          },
        );

      return () => {
        active =
          false;
      };
    },
    [
      visible,
      formulario,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | TOGGLE MÓDULO
  |--------------------------------------------------------------------------
  */

  const toggleModulo =
    (
      id:
        number,
    ) => {
      if (
        saving
      ) {
        return;
      }

      setSeleccionados(
        (
          prev,
        ) => {
          const next =
            new Set(
              prev,
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
  | SAVE
  |--------------------------------------------------------------------------
  */

  const save =
    async () => {
      if (
        saving
      ) {
        return;
      }

      const value =
        nombre.trim();

      const route =
        ruta.trim();

      /*
      |--------------------------------------------------------------------------
      | Nombre
      |--------------------------------------------------------------------------
      */

      if (
        !value
      ) {
        setNombreError(
          "El nombre del formulario es obligatorio.",
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Ruta
      |--------------------------------------------------------------------------
      */

      if (
        route &&
        !RUTA_REGEX.test(
          route,
        )
      ) {
        setRutaError(
          "La ruta debe tener formato /seccion/subseccion.",
        );

        return;
      }

      setNombreError(
        "",
      );

      setRutaError(
        "",
      );

      /*
      |--------------------------------------------------------------------------
      | Payload
      |--------------------------------------------------------------------------
      */

      const ok =
        await onSave({
          formulario:
            value,

          ruta:
            route ||
            null,

          descripcion:
            descripcion
              .trim() ||
            undefined,

          estado,

          modulos:
            Array.from(
              seleccionados,
            ),
        });

      if (
        ok
      ) {
        onClose();
      }
    };

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
          ? "Editar formulario"
          : "Nuevo formulario"
      }
      onClose={
        onClose
      }
      closeOnBackdropPress={
        !saving
      }
      width="96%"
      maxWidth={620}

      /*
       * El Modal general ahora maneja
       * automáticamente el scroll vertical.
       */

      footer={
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
              onClose
            }
          />

          <Visibility
            action={
              action
            }
            selector={
              editing
                ? ".formularios-guardar-edicion"
                : ".formularios-guardar-creacion"
            }
          >
            <Button
              title={
                editing
                  ? "Guardar cambios"
                  : "Crear formulario"
              }
              loading={
                saving
              }
              disabled={
                saving
              }
              onPress={() => {
                void save();
              }}
            />
          </Visibility>
        </View>
      }
    >
      <Visibility
        action={
          action
        }
        selector={
          editing
            ? ".formularios-form-editar"
            : ".formularios-form-crear"
        }
      >
        <View
          style={
            styles.formContent
          }
        >
          {/* ============================================= */}
          {/* NOMBRE */}
          {/* ============================================= */}

          <Input
            label="Nombre"
            value={
              nombre
            }
            placeholder="Ej: Usuarios"
            error={
              nombreError
            }
            onChangeText={(
              value,
            ) => {
              setNombre(
                value,
              );

              if (
                nombreError
              ) {
                setNombreError(
                  "",
                );
              }
            }}
          />

          {/* ============================================= */}
          {/* RUTA */}
          {/* ============================================= */}

          <Visibility
            action={
              action
            }
            selector=".formularios-ruta"
          >
            <View
              style={
                styles.field
              }
            >
              <Input
                label="Ruta"
                value={
                  ruta
                }
                placeholder="/admin/usuarios"
                autoCapitalize="none"
                error={
                  rutaError
                }
                onChangeText={(
                  value,
                ) => {
                  setRuta(
                    value,
                  );

                  if (
                    rutaError
                  ) {
                    setRutaError(
                      "",
                    );
                  }
                }}
              />
            </View>
          </Visibility>

          {/* ============================================= */}
          {/* DESCRIPCIÓN */}
          {/* ============================================= */}

          <Input
            label="Descripción"
            value={
              descripcion
            }
            placeholder="Gestión de usuarios del sistema"
            multiline
            numberOfLines={
              3
            }
            textAlignVertical="top"
            onChangeText={
              setDescripcion
            }
          />

          {/* ============================================= */}
          {/* ESTADO */}
          {/* ============================================= */}

          <Visibility
            action={
              action
            }
            selector=".formularios-estado"
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
                    ? "Formulario disponible"
                    : "Formulario deshabilitado"
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

          {/* ============================================= */}
          {/* MÓDULOS */}
          {/* ============================================= */}

          <Visibility
            action={
              action
            }
            selector=".formularios-modulos"
          >
            <View
              style={
                styles.section
              }
            >
              <View
                style={
                  styles.sectionHeader
                }
              >
                <View
                  style={
                    styles.sectionText
                  }
                >
                  <ThemedText
                    style={
                      styles.sectionTitle
                    }
                  >
                    Módulos vinculados
                  </ThemedText>

                  <ThemedText
                    style={[
                      styles.sectionSubtitle,

                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    {
                      seleccionados.size
                    }{" "}
                    seleccionado(s)
                  </ThemedText>
                </View>

                <Button
                  title={
                    mostrarModulos
                      ? "Ocultar"
                      : "Seleccionar"
                  }
                  variant="secondary"
                  loading={
                    loadingModulos
                  }
                  disabled={
                    loadingModulos ||
                    saving
                  }
                  onPress={() =>
                    setMostrarModulos(
                      (
                        value,
                      ) =>
                        !value,
                    )
                  }
                />
              </View>

              {/* ========================================= */}
              {/* SELECTOR */}
              {/* ========================================= */}

              {mostrarModulos ? (
                modulos.length >
                0 ? (
                  <View
                    style={[
                      styles.selector,

                      {
                        borderColor:
                          c.border,

                        backgroundColor:
                          c.backgroundSecondary,
                      },
                    ]}
                  >
                    {modulos.map(
                      (
                        modulo,
                        index,
                      ) => {
                        const checked =
                          seleccionados.has(
                            modulo.id,
                          );

                        const last =
                          index ===
                          modulos.length -
                            1;

                        return (
                          <View
                            key={
                              modulo.id
                            }
                            style={[
                              styles.option,

                              {
                                borderBottomColor:
                                  c.border,

                                borderBottomWidth:
                                  last
                                    ? 0
                                    : 1,
                              },
                            ]}
                          >
                            <Checkbox
                              checked={
                                checked
                              }
                              disabled={
                                saving
                              }
                              onPress={() =>
                                toggleModulo(
                                  modulo.id,
                                )
                              }
                              accessibilityLabel={`Seleccionar ${modulo.modulo}`}
                            />

                            <Pressable
                              disabled={
                                saving
                              }
                              style={
                                styles.optionText
                              }
                              onPress={() =>
                                toggleModulo(
                                  modulo.id,
                                )
                              }
                            >
                              <ThemedText
                                style={
                                  styles.optionName
                                }
                              >
                                {
                                  modulo.modulo
                                }
                              </ThemedText>

                              {!!modulo.descripcion && (
                                <ThemedText
                                  numberOfLines={
                                    2
                                  }
                                  style={[
                                    styles.optionDescription,

                                    {
                                      color:
                                        c.textMuted,
                                    },
                                  ]}
                                >
                                  {
                                    modulo.descripcion
                                  }
                                </ThemedText>
                              )}
                            </Pressable>

                            <Badge
                              label={
                                checked
                                  ? "Vinculado"
                                  : "Disponible"
                              }
                              variant={
                                checked
                                  ? "success"
                                  : "muted"
                              }
                            />
                          </View>
                        );
                      },
                    )}
                  </View>
                ) : (
                  <EmptyState
                    icon="apps-outline"
                    title="Sin módulos"
                    subtitle="No existen módulos disponibles para vincular."
                  />
                )
              ) : (
                <View
                  style={
                    styles.chips
                  }
                >
                  {modulos
                    .filter(
                      (
                        modulo,
                      ) =>
                        seleccionados.has(
                          modulo.id,
                        ),
                    )
                    .map(
                      (
                        modulo,
                      ) => (
                        <Pressable
                          key={
                            modulo.id
                          }
                          disabled={
                            saving
                          }
                          onPress={() =>
                            toggleModulo(
                              modulo.id,
                            )
                          }
                        >
                          <Badge
                            label={
                              modulo.modulo
                            }
                            variant="info"
                          />
                        </Pressable>
                      ),
                    )}

                  {seleccionados.size ===
                    0 && (
                    <ThemedText
                      style={[
                        styles.noModules,

                        {
                          color:
                            c.textMuted,
                        },
                      ]}
                    >
                      Sin módulos seleccionados.
                    </ThemedText>
                  )}
                </View>
              )}
            </View>
          </Visibility>
        </View>
      </Visibility>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    formContent: {
      gap:
        16,
    },

    field: {
      gap:
        5,
    },

    status: {
      borderWidth:
        1,

      borderRadius:
        12,

      padding:
        12,
    },

    section: {
      gap:
        10,
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

    sectionText: {
      flex:
        1,

      minWidth:
        0,
    },

    sectionTitle: {
      fontSize:
        12,

      fontWeight:
        "800",
    },

    sectionSubtitle: {
      marginTop:
        2,

      fontSize:
        11,
    },

    selector: {
      borderWidth:
        1,

      borderRadius:
        10,

      overflow:
        "hidden",
    },

    option: {
      minHeight:
        50,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,

      paddingHorizontal:
        12,

      paddingVertical:
        9,
    },

    optionText: {
      flex:
        1,

      minWidth:
        0,
    },

    optionName: {
      fontSize:
        12,

      fontWeight:
        "800",
    },

    optionDescription: {
      marginTop:
        2,

      fontSize:
        10,

      lineHeight:
        14,
    },

    chips: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        6,
    },

    noModules: {
      fontSize:
        11,
    },

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
        10,
    },
  });

export default FormularioFormModal;