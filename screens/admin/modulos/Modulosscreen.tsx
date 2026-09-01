// screens/admin/modulos/ModulosScreen.tsx

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
  Ionicons,
} from "@expo/vector-icons";

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
  DeleteModuloModal,
} from "./components/DeleteModuloModal";

import {
  ModuloModal,
} from "./components/Modulomodal";

import {
  ModuloOrderModal,
} from "./components/ModuloOrderModal";

import {
  useModulos,
} from "./hooks/useModulos";

import {
  AVAILABLE_ICONS,
  CreateModuloPayload,
  Modulo,
} from "./types/modulo.types";

/*
|--------------------------------------------------------------------------
| COLUMNAS
|--------------------------------------------------------------------------
*/

const columns:
  TableColumn[] = [
    {
      key:
        "orden",

      label:
        "ORDEN",

      style: {
        width:
          85,
      },
    },

    {
      key:
        "icono",

      label:
        "ICONO",

      style: {
        width:
          80,
      },
    },

    {
      key:
        "modulo",

      label:
        "MÓDULO",

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
        "formularios",

      label:
        "FORMULARIOS",

      style: {
        width:
          120,
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

export function ModulosScreen() {
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
    modulos,

    loading,

    refreshing,

    savingOrder,

    deletingId,

    onRefresh,

    createModulo,

    updateModulo,

    reorderModulos,

    deleteModulo,
  } =
    useModulos();

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
      Modulo | null
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
      Modulo | null
    >(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | ORDEN SIDEBAR
  |--------------------------------------------------------------------------
  */

  const [
    orderVisible,
    setOrderVisible,
  ] =
    useState(
      false,
    );

  /*
  |--------------------------------------------------------------------------
  | BLOQUEO GLOBAL DE ACCIONES
  |--------------------------------------------------------------------------
  */

  const processing =
    deletingId !==
      null ||
    savingOrder;

  /*
  |--------------------------------------------------------------------------
  | FILTRO
  |--------------------------------------------------------------------------
  */

  const filtered =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return modulos;
        }

        return modulos.filter(
          (
            modulo,
          ) => {
            const formularios =
              modulo.formularios
                ?.map(
                  (
                    formulario,
                  ) =>
                    formulario.formulario,
                )
                .join(" ") ??
              "";

            return [
              modulo.orden,

              modulo.modulo,

              modulo.descripcion,

              modulo.estado,

              formularios,
            ]
              .filter(
                (
                  value,
                ) =>
                  value !==
                    null &&
                  value !==
                    undefined,
              )
              .join(" ")
              .toLowerCase()
              .includes(
                query,
              );
          },
        );
      },
      [
        modulos,
        search,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CREAR
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
  | EDITAR
  |--------------------------------------------------------------------------
  */

  const openEdit =
    (
      modulo:
        Modulo,
    ) => {
      if (
        processing
      ) {
        return;
      }

      setEditing(
        modulo,
      );

      setModalVisible(
        true,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CERRAR CREATE / EDIT
  |--------------------------------------------------------------------------
  */

  const closeModal =
    () => {
      setModalVisible(
        false,
      );

      setEditing(
        null,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT CREATE / EDIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    (
      payload:
        CreateModuloPayload,
    ) =>
      editing
        ? updateModulo(
            editing.id,
            payload,
          )
        : createModulo(
            payload,
          );

  /*
  |--------------------------------------------------------------------------
  | ABRIR DELETE
  |--------------------------------------------------------------------------
  */

  const openDelete =
    (
      modulo:
        Modulo,
    ) => {
      if (
        processing
      ) {
        return;
      }

      setDeleteTarget(
        modulo,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CERRAR DELETE
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
        await deleteModulo(
          deleteTarget,
        );

      /*
       * Si hubo error dejamos el modal
       * abierto para permitir reintentar.
       */

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
  | ABRIR ORDEN
  |--------------------------------------------------------------------------
  */

  const openOrder =
    () => {
      if (
        processing ||
        loading ||
        modulos.length <
          2
      ) {
        return;
      }

      setOrderVisible(
        true,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CERRAR ORDEN
  |--------------------------------------------------------------------------
  */

  const closeOrder =
    () => {
      if (
        savingOrder
      ) {
        return;
      }

      setOrderVisible(
        false,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | GUARDAR ORDEN
  |--------------------------------------------------------------------------
  */

  const handleSaveOrder =
    async (
      ids:
        number[],
    ): Promise<boolean> => {
      return reorderModulos(
        ids,
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
          selector=".modulos-header"
        >
          <PageHeader
            badge="Configuración"
            badgeVariant="info"
            title="Módulos"
            description="Administra los módulos del sistema, sus formularios vinculados y el orden en que aparecen en el Sidebar."
            rightContent={
              <View
                style={
                  styles.headerActions
                }
              >
                {/* ========================================= */}
                {/* ORDENAR SIDEBAR */}
                {/* ========================================= */}

                <Visibility
                  action="Editar"
                  selector=".modulos-ordenar"
                >
                  <Button
                    title="Ordenar Sidebar"
                    variant="secondary"
                    disabled={
                      processing ||
                      loading ||
                      modulos.length <
                        2
                    }
                    onPress={
                      openOrder
                    }
                  />
                </Visibility>

                {/* ========================================= */}
                {/* CREAR */}
                {/* ========================================= */}

                <Visibility
                  action="Crear"
                  selector=".modulos-crear"
                >
                  <Button
                    title="Nuevo módulo"
                    disabled={
                      processing
                    }
                    onPress={
                      openCreate
                    }
                  />
                </Visibility>
              </View>
            }
          />
        </Visibility>

        {/* ================================================= */}
        {/* LISTADO */}
        {/* ================================================= */}

        <Visibility
          action="Ver"
          selector=".modulos-listado"
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
                  Listado de módulos
                </ThemedText>

                <Badge
                  label={`${filtered.length} módulo${
                    filtered.length ===
                    1
                      ? ""
                      : "s"
                  }`}
                  variant="muted"
                />
              </View>

              <Visibility
                action="Ver"
                selector=".modulos-actualizar"
              >
                <Button
                  title={
                    refreshing
                      ? "Actualizando"
                      : "Actualizar"
                  }
                  variant="secondary"
                  loading={
                    refreshing
                  }
                  disabled={
                    refreshing ||
                    loading ||
                    processing
                  }
                  onPress={() => {
                    void onRefresh();
                  }}
                />
              </Visibility>
            </View>

            {/* ============================================= */}
            {/* BUSCADOR */}
            {/* ============================================= */}

            <Visibility
              action="Ver"
              selector=".modulos-buscador"
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
                  placeholder="Buscar módulo o formulario..."
                />
              </View>
            </Visibility>

            {/* ============================================= */}
            {/* TABLA */}
            {/* ============================================= */}

            <View
              style={
                styles.table
              }
            >
              <Table<Modulo>
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
                    : "No hay módulos registrados."
                }
                keyExtractor={(
                  modulo,
                ) =>
                  String(
                    modulo.id,
                  )
                }
                renderRow={(
                  modulo,
                ) => {
                  /*
                  |--------------------------------------------------------------------------
                  | ICONO
                  |--------------------------------------------------------------------------
                  */

                  const icon =
                    AVAILABLE_ICONS.find(
                      (
                        item,
                      ) =>
                        item.key ===
                        modulo.icono,
                    )
                      ?.ionicon ??
                    "apps-outline";

                  /*
                  |--------------------------------------------------------------------------
                  | FORMULARIOS
                  |--------------------------------------------------------------------------
                  */

                  const totalFormularios =
                    modulo.formularios
                      ?.length ??
                    0;

                  /*
                  |--------------------------------------------------------------------------
                  | DELETE
                  |--------------------------------------------------------------------------
                  */

                  const deleting =
                    deletingId ===
                    modulo.id;

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
                      {/* ORDEN */}
                      {/* ===================================== */}

                      <View
                        style={[
                          styles.cell,

                          styles.center,

                          {
                            width:
                              85,
                          },
                        ]}
                      >
                        <Badge
                          label={
                            String(
                              modulo.orden ??
                                0,
                            )
                          }
                          variant="info"
                        />
                      </View>

                      {/* ===================================== */}
                      {/* ICONO */}
                      {/* ===================================== */}

                      <View
                        style={[
                          styles.cell,

                          styles.center,

                          {
                            width:
                              80,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.iconBox,

                            {
                              backgroundColor:
                                c.primarySubtle,
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              icon as any
                            }
                            size={20}
                            color={
                              c.primary
                            }
                          />
                        </View>
                      </View>

                      {/* ===================================== */}
                      {/* MÓDULO */}
                      {/* ===================================== */}

                      <Cell
                        width={
                          220
                        }
                        text={
                          modulo.modulo
                        }
                        bold
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
                          style={{
                            color:
                              c.textSecondary,

                            fontSize:
                              12,
                          }}
                        >
                          {modulo.descripcion ||
                            "Sin descripción"}
                        </ThemedText>
                      </View>

                      {/* ===================================== */}
                      {/* FORMULARIOS */}
                      {/* ===================================== */}

                      <View
                        style={[
                          styles.cell,

                          styles.center,

                          {
                            width:
                              120,
                          },
                        ]}
                      >
                        <Badge
                          label={
                            `${totalFormularios}`
                          }
                          variant={
                            totalFormularios >
                            0
                              ? "info"
                              : "muted"
                          }
                        />
                      </View>

                      {/* ===================================== */}
                      {/* ESTADO */}
                      {/* ===================================== */}

                      <View
                        style={[
                          styles.cell,

                          styles.center,

                          {
                            width:
                              110,
                          },
                        ]}
                      >
                        <Badge
                          label={
                            modulo.estado ??
                            "Activo"
                          }
                          variant={
                            modulo.estado ===
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
                        {/* ================================= */}
                        {/* EDITAR */}
                        {/* ================================= */}

                        <Visibility
                          action="Editar"
                          selector=".modulos-editar"
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
                            accessibilityLabel={`Editar ${modulo.modulo}`}
                            onPress={() =>
                              openEdit(
                                modulo,
                              )
                            }
                          />
                        </Visibility>

                        {/* ================================= */}
                        {/* ELIMINAR */}
                        {/* ================================= */}

                        <Visibility
                          action="Eliminar"
                          selector=".modulos-eliminar"
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
                              savingOrder ||
                              (
                                deletingId !==
                                  null &&
                                !deleting
                              )
                            }
                            accessibilityLabel={`Eliminar ${modulo.modulo}`}
                            onPress={() =>
                              openDelete(
                                modulo,
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
      {/* CREATE / EDIT MODAL */}
      {/* ================================================= */}

      <ModuloModal
        visible={
          modalVisible
        }
        modulo={
          editing
        }
        onClose={
          closeModal
        }
        onSubmit={
          handleSubmit
        }
      />

      {/* ================================================= */}
      {/* DELETE MODAL */}
      {/* ================================================= */}

      <DeleteModuloModal
        visible={
          !!deleteTarget
        }
        modulo={
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

      {/* ================================================= */}
      {/* ORDER SIDEBAR MODAL */}
      {/* ================================================= */}

      <ModuloOrderModal
        visible={
          orderVisible
        }
        modulos={
          modulos
        }
        saving={
          savingOrder
        }
        onClose={
          closeOrder
        }
        onSave={
          handleSaveOrder
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
}: {
  width: number;

  text: string;

  bold?: boolean;
}) {
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
          1
        }
        style={{
          fontSize:
            13,

          fontWeight:
            bold
              ? "800"
              : "700",
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
    /*
    |--------------------------------------------------------------------------
    | SCREEN
    |--------------------------------------------------------------------------
    */

    screen: {
      flex:
        1,
    },

    content: {
      width:
        "100%",

      maxWidth:
        1400,

      alignSelf:
        "center",

      padding:
        18,

      gap:
        16,
    },

    /*
    |--------------------------------------------------------------------------
    | HEADER ACTIONS
    |--------------------------------------------------------------------------
    */

    headerActions: {
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
    | CARD
    |--------------------------------------------------------------------------
    */

    card: {
      overflow:
        "hidden",
    },

    /*
    |--------------------------------------------------------------------------
    | TOOLBAR
    |--------------------------------------------------------------------------
    */

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
        12,
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

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    search: {
      padding:
        14,
    },

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    table: {
      height:
        620,
    },

    row: {
      /*
       * Aumentamos porque agregamos
       * la columna ORDEN.
       */

      minWidth:
        985,

      minHeight:
        70,

      flexDirection:
        "row",

      borderBottomWidth:
        1,
    },

    cell: {
      minHeight:
        70,

      justifyContent:
        "center",

      paddingHorizontal:
        10,
    },

    center: {
      alignItems:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | ICON
    |--------------------------------------------------------------------------
    */

    iconBox: {
      width:
        38,

      height:
        38,

      borderRadius:
        11,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | DESCRIPTION
    |--------------------------------------------------------------------------
    */

    description: {
      flex:
        1,

      minWidth:
        260,
    },

    /*
    |--------------------------------------------------------------------------
    | ACTIONS
    |--------------------------------------------------------------------------
    */

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

export default ModulosScreen;