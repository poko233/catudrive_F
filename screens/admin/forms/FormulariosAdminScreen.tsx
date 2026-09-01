// screens/admin/formularios/FormulariosAdminScreen.tsx

import {
  useMemo,
  useState,
} from "react";

import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  Pencil,
  Trash2,
} from "lucide-react-native";

import {
  Table,
  TableColumn,
} from "@/components/Table";

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
  Card,
} from "@/components/ui/Card";

import {
  IconButton,
} from "@/components/ui/IconButton";

import {
  PageHeader,
} from "@/components/ui/PageHeader";

import {
  SearchBar,
} from "@/components/ui/SearchBar";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  AdminFormulario,
  CreateFormularioPayload,
} from "../types/admin.types";

import {
  DeleteFormularioModal,
} from "./DeleteFormularioModal";

import {
  FormularioFormModal,
} from "./FormularioFormModal";

import {
  useFormularios,
} from "./useFormularios";

/*
|--------------------------------------------------------------------------
| COLUMNAS
|--------------------------------------------------------------------------
*/

const columns:
  TableColumn[] = [
    {
      key:
        "formulario",

      label:
        "FORMULARIO",

      style: {
        width:
          220,
      },
    },

    {
      key:
        "ruta",

      label:
        "RUTA",

      style: {
        width:
          220,
      },
    },

    {
      key:
        "descripcion",

      label:
        "DESCRIPCIÓN",

      style: {
        flex:
          1,

        minWidth:
          260,
      },
    },

    {
      key:
        "modulos",

      label:
        "MÓDULOS",

      style: {
        width:
          240,
      },
    },

    {
      key:
        "estado",

      label:
        "ESTADO",

      style: {
        width:
          110,
      },
    },

    {
      key:
        "acciones",

      label:
        "ACCIONES",

      style: {
        width:
          110,
      },
    },
  ];

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export function FormulariosAdminScreen() {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  /*
  |--------------------------------------------------------------------------
  | HOOK
  |--------------------------------------------------------------------------
  */

  const {
    formularios,

    loading,

    saving,

    deletingId,

    createFormulario,

    deleteFormulario,

    updateFormulario,
  } =
    useFormularios();

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const [
    search,
    setSearch,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | CREATE / EDIT
  |--------------------------------------------------------------------------
  */

  const [
    modalVisible,
    setModalVisible,
  ] =
    useState(
      false,
    );

  const [
    editing,
    setEditing,
  ] =
    useState<
      AdminFormulario | null
    >(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<
      AdminFormulario | null
    >(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | PROCESSING
  |--------------------------------------------------------------------------
  */

  const processing =
    saving ||
    deletingId !==
      null;

  /*
  |--------------------------------------------------------------------------
  | FILTER
  |--------------------------------------------------------------------------
  */

  const filtered =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (
          !query
        ) {
          return formularios;
        }

        return formularios.filter(
          (
            item,
          ) =>
            [
              item.formulario,

              item.ruta,

              item.descripcion,

              item.estado,

              ...(
                item.modulos ??
                []
              ).map(
                (
                  modulo,
                ) =>
                  modulo.modulo,
              ),
            ]
              .filter(
                Boolean,
              )
              .join(
                " ",
              )
              .toLowerCase()
              .includes(
                query,
              ),
        );
      },
      [
        formularios,
        search,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CREATE
  |--------------------------------------------------------------------------
  */

  const openCreate =
    () => {
      if (
        processing
      ) {
        return;
      }

      setEditing(
        null,
      );

      setModalVisible(
        true,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const openEdit =
    (
      item:
        AdminFormulario,
    ) => {
      if (
        processing
      ) {
        return;
      }

      setEditing(
        item,
      );

      setModalVisible(
        true,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CLOSE FORM
  |--------------------------------------------------------------------------
  */

  const closeModal =
    () => {
      if (
        saving
      ) {
        return;
      }

      setModalVisible(
        false,
      );

      setEditing(
        null,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  const handleSave =
    async (
      payload:
        CreateFormularioPayload,
    ): Promise<boolean> => {
      if (
        editing
      ) {
        return updateFormulario(
          editing.id,
          payload,
        );
      }

      return createFormulario(
        payload,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | OPEN DELETE
  |--------------------------------------------------------------------------
  */

  const openDelete =
    (
      item:
        AdminFormulario,
    ) => {
      if (
        processing
      ) {
        return;
      }

      setDeleteTarget(
        item,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CLOSE DELETE
  |--------------------------------------------------------------------------
  */

  const closeDelete =
    () => {
      if (
        deletingId !==
        null
      ) {
        return;
      }

      setDeleteTarget(
        null,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CONFIRM DELETE
  |--------------------------------------------------------------------------
  */

  const confirmDelete =
    async () => {
      if (
        !deleteTarget
      ) {
        return;
      }

      const deleted =
        await deleteFormulario(
          deleteTarget,
        );

      if (
        deleted
      ) {
        setDeleteTarget(
          null,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={[
        styles.screen,

        {
          backgroundColor:
            c.background,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <Visibility
          action="Ver"
          selector=".formularios-header"
        >
          <PageHeader
            badge="Configuración"
            badgeVariant="info"
            title="Formularios"
            description="Administra formularios, rutas y módulos vinculados."
            rightContent={
              <Visibility
                action="Crear"
                selector=".formularios-crear"
              >
                <Button
                  title="Nuevo formulario"
                  disabled={
                    processing
                  }
                  onPress={
                    openCreate
                  }
                />
              </Visibility>
            }
          />
        </Visibility>

        {/* ================================================= */}
        {/* LIST */}
        {/* ================================================= */}

        <Visibility
          action="Ver"
          selector=".formularios-listado"
        >
          <Card
            padding={0}
            style={
              styles.card
            }
          >
            {/* ============================================= */}
            {/* TOOLBAR */}
            {/* ============================================= */}

            <View
              style={[
                styles.toolbar,

                {
                  borderBottomColor:
                    c.border,
                },
              ]}
            >
              <View
                style={
                  styles.toolbarText
                }
              >
                <ThemedText
                  style={
                    styles.listTitle
                  }
                >
                  Listado de formularios
                </ThemedText>

                <Badge
                  label={`${filtered.length} formulario${
                    filtered.length ===
                    1
                      ? ""
                      : "s"
                  }`}
                  variant="muted"
                />
              </View>
            </View>

            {/* ============================================= */}
            {/* SEARCH */}
            {/* ============================================= */}

            <Visibility
              action="Ver"
              selector=".formularios-buscador"
            >
              <View
                style={
                  styles.search
                }
              >
                <SearchBar
                  value={
                    search
                  }
                  onChangeText={
                    setSearch
                  }
                  placeholder="Buscar formulario, ruta o módulo..."
                />
              </View>
            </Visibility>

            {/* ============================================= */}
            {/* TABLE */}
            {/* ============================================= */}

            <View
              style={
                styles.table
              }
            >
              <Table<AdminFormulario>
                data={
                  filtered
                }
                columns={
                  columns
                }
                loading={
                  loading
                }
                emptyMessage={
                  search
                    ? "No se encontraron resultados."
                    : "No hay formularios registrados."
                }
                keyExtractor={(
                  item,
                ) =>
                  String(
                    item.id,
                  )
                }
                renderRow={(
                  item,
                ) => {
                  const deleting =
                    deletingId ===
                    item.id;

                  const modulos =
                    item.modulos ??
                    [];

                  return (
                    <View
                      style={[
                        styles.row,

                        {
                          borderBottomColor:
                            c.border,

                          opacity:
                            deleting
                              ? 0.6
                              : 1,
                        },
                      ]}
                    >
                      {/* ===================================== */}
                      {/* FORMULARIO */}
                      {/* ===================================== */}

                      <Cell
                        width={
                          220
                        }
                        text={
                          item.formulario
                        }
                        bold
                      />

                      {/* ===================================== */}
                      {/* RUTA */}
                      {/* ===================================== */}

                      <Cell
                        width={
                          220
                        }
                        text={
                          item.ruta ||
                          "Sin ruta"
                        }
                        muted={
                          !item.ruta
                        }
                      />

                      {/* ===================================== */}
                      {/* DESCRIPCIÓN */}
                      {/* ===================================== */}

                      <View
                        style={[
                          styles.cell,

                          styles.description,
                        ]}
                      >
                        <ThemedText
                          numberOfLines={
                            2
                          }
                          style={[
                            styles.descriptionText,

                            {
                              color:
                                c.textSecondary,
                            },
                          ]}
                        >
                          {item.descripcion ||
                            "Sin descripción"}
                        </ThemedText>
                      </View>

                      {/* ===================================== */}
                      {/* MÓDULOS */}
                      {/* ===================================== */}

                      <View
                        style={[
                          styles.cell,

                          styles.modules,
                        ]}
                      >
                        {modulos.length >
                        0 ? (
                          <>
                            {modulos
                              .slice(
                                0,
                                2,
                              )
                              .map(
                                (
                                  modulo,
                                ) => (
                                  <Badge
                                    key={
                                      modulo.id
                                    }
                                    label={
                                      modulo.modulo
                                    }
                                    variant="info"
                                  />
                                ),
                              )}

                            {modulos.length >
                              2 && (
                              <Badge
                                label={`+${
                                  modulos.length -
                                  2
                                }`}
                                variant="muted"
                              />
                            )}
                          </>
                        ) : (
                          <ThemedText
                            style={[
                              styles.noModules,

                              {
                                color:
                                  c.textMuted,
                              },
                            ]}
                          >
                            Sin módulos
                          </ThemedText>
                        )}
                      </View>

                      {/* ===================================== */}
                      {/* ESTADO */}
                      {/* ===================================== */}

                      <View
                        style={[
                          styles.cell,

                          styles.statusCell,
                        ]}
                      >
                        <Badge
                          label={
                            item.estado ??
                            "Activo"
                          }
                          variant={
                            item.estado ===
                            "Activo"
                              ? "success"
                              : "muted"
                          }
                        />
                      </View>

                      {/* ===================================== */}
                      {/* ACCIONES */}
                      {/* ===================================== */}

                      <View
                        style={[
                          styles.cell,

                          styles.actions,
                        ]}
                      >
                        <Visibility
                          action="Editar"
                          selector=".formularios-editar"
                        >
                          <IconButton
                            icon={
                              Pencil
                            }
                            size="sm"
                            variant="secondary"
                            disabled={
                              processing
                            }
                            accessibilityLabel={`Editar ${item.formulario}`}
                            onPress={() =>
                              openEdit(
                                item,
                              )
                            }
                          />
                        </Visibility>

                        <Visibility
                          action="Eliminar"
                          selector=".formularios-eliminar"
                        >
                          <IconButton
                            icon={
                              Trash2
                            }
                            size="sm"
                            variant="destructive"
                            loading={
                              deleting
                            }
                            disabled={
                              saving ||
                              (
                                deletingId !==
                                  null &&
                                !deleting
                              )
                            }
                            accessibilityLabel={`Eliminar ${item.formulario}`}
                            onPress={() =>
                              openDelete(
                                item,
                              )
                            }
                          />
                        </Visibility>
                      </View>
                    </View>
                  );
                }}
              />
            </View>
          </Card>
        </Visibility>
      </ScrollView>

      {/* ================================================= */}
      {/* CREATE / EDIT */}
      {/* ================================================= */}

      <FormularioFormModal
        visible={
          modalVisible
        }
        formulario={
          editing
        }
        saving={
          saving
        }
        onClose={
          closeModal
        }
        onSave={
          handleSave
        }
      />

      {/* ================================================= */}
      {/* DELETE */}
      {/* ================================================= */}

      <DeleteFormularioModal
        visible={
          !!deleteTarget
        }
        formulario={
          deleteTarget
        }
        deleting={
          !!deleteTarget &&
          deletingId ===
            deleteTarget.id
        }
        onClose={
          closeDelete
        }
        onConfirm={
          confirmDelete
        }
      />
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| CELL
|--------------------------------------------------------------------------
*/

function Cell({
  width,
  text,
  bold = false,
  muted = false,
}: {
  width: number;

  text: string;

  bold?: boolean;

  muted?: boolean;
}) {
  const {
    theme,
  } =
    useTheme();

  return (
    <View
      style={[
        styles.cell,

        {
          width,
        },
      ]}
    >
      <ThemedText
        numberOfLines={
          2
        }
        style={{
          color:
            muted
              ? theme
                  .colors
                  .textMuted
              : theme
                  .colors
                  .text,

          fontSize:
            12,

          fontWeight:
            bold
              ? "800"
              : "600",
        }}
      >
        {
          text
        }
      </ThemedText>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    screen: {
      flex:
        1,
    },

    content: {
      width:
        "100%",

      maxWidth:
        1500,

      alignSelf:
        "center",

      padding:
        18,

      gap:
        16,
    },

    card: {
      overflow:
        "hidden",
    },

    toolbar: {
      padding:
        16,

      borderBottomWidth:
        1,

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        10,
    },

    toolbarText: {
      flex:
        1,

      minWidth:
        220,

      flexDirection:
        "row",

      alignItems:
        "center",

      flexWrap:
        "wrap",

      gap:
        10,
    },

    listTitle: {
      fontSize:
        18,

      fontWeight:
        "900",
    },

    search: {
      padding:
        14,
    },

    table: {
      height:
        620,
    },

    row: {
      minWidth:
        1160,

      minHeight:
        72,

      flexDirection:
        "row",

      borderBottomWidth:
        1,
    },

    cell: {
      minHeight:
        72,

      justifyContent:
        "center",

      paddingHorizontal:
        10,
    },

    description: {
      flex:
        1,

      minWidth:
        260,
    },

    descriptionText: {
      fontSize:
        12,
    },

    modules: {
      width:
        240,

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      alignItems:
        "center",

      gap:
        5,
    },

    noModules: {
      fontSize:
        11,
    },

    statusCell: {
      width:
        110,

      alignItems:
        "flex-start",
    },

    actions: {
      width:
        110,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        7,
    },
  });

export default FormulariosAdminScreen;