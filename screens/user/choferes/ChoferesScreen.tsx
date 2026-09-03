import {
  ThemedText,
} from "@/components/ThemedText";

import {
  Table,
  TableColumn,
} from "@/components/Table";

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
  History,
  IdCard,
  Pencil,
  Printer,
  QrCode,
  UserMinus,
  UserPlus,
} from "lucide-react-native";

import {
  useMemo,
  useState,
} from "react";

import {
  Image,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import {
  ChoferBajaModal,
} from "./components/ChoferBajaModal";

import {
  ChoferCarnetModal,
} from "./components/ChoferCarnetModal";

import {
  ChoferFormModal,
} from "./components/ChoferFormModal";

import {
  ChoferHistorialModal,
} from "./components/ChoferHistorialModal";

import {
  useChoferes,
} from "./hooks/useChoferes";

import {
  Chofer,
} from "./types/chofer.types";

/*
|--------------------------------------------------------------------------
| COLUMNAS
|--------------------------------------------------------------------------
*/

const columns:
  TableColumn[] = [
    {
      key:
        "foto",

      label:
        "Foto",

      style: {
        width: 70,
      },

      skeletonWidth:
        40,
    },

    {
      key:
        "sindical",

      label:
        "Carnet Sindical",

      style: {
        width: 140,
      },
    },

    {
      key:
        "nombre",

      label:
        "Nombre Completo",

      style: {
        flex: 1,

        minWidth: 230,
      },
    },

    {
      key:
        "ci",

      label:
        "C.I.",

      style: {
        width: 120,
      },
    },

    {
      key:
        "telefono",

      label:
        "Teléfono",

      style: {
        width: 120,
      },
    },

    {
      key:
        "licencia",

      label:
        "Nro. Licencia",

      style: {
        width: 135,
      },
    },

    {
      key:
        "categoria",

      label:
        "Categoría",

      style: {
        width: 95,
      },
    },

    {
      key:
        "estado",

      label:
        "Estado",

      style: {
        width: 105,
      },
    },

    {
      key:
        "acciones",

      label:
        "Acciones",

      style: {
        width: 220,
      },
    },
  ];

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export default function ChoferesScreen() {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const {
    width,
  } =
    useWindowDimensions();

  const {
    choferes,

    loading,

    saving,

    deletingId,

    qrLoadingId,

    resumen,

    refresh,

    guardar,

    darBaja,

    regenerarQr,
  } =
    useChoferes();

  /*
  |--------------------------------------------------------------------------
  | ESTADOS
  |--------------------------------------------------------------------------
  */

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    formVisible,
    setFormVisible,
  ] =
    useState(false);

  const [
    editing,
    setEditing,
  ] =
    useState<
      Chofer | null
    >(null);

  const [
    bajaChofer,
    setBajaChofer,
  ] =
    useState<
      Chofer | null
    >(null);

  const [
    historialChofer,
    setHistorialChofer,
  ] =
    useState<
      Chofer | null
    >(null);

  const [
    carnetChofer,
    setCarnetChofer,
  ] =
    useState<
      Chofer | null
    >(null);

  /*
  |--------------------------------------------------------------------------
  | FILTRADO
  |--------------------------------------------------------------------------
  */

  const filtrados =
    useMemo(
      () => {
        const q =
          search
            .trim()
            .toLowerCase();

        if (!q) {
          return choferes;
        }

        return choferes.filter(
          (
            item,
          ) =>
            [
              item.carnet_sindical,

              item.nombre_completo,

              item.carnet_identidad,

              item.telefono,

              item.numero_licencia,

              item.categoria_licencia,

              item.estado,
            ]
              .join(
                " ",
              )
              .toLowerCase()
              .includes(
                q,
              ),
        );
      },

      [
        choferes,
        search,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CREAR
  |--------------------------------------------------------------------------
  */

  const abrirCrear =
    () => {
      setEditing(
        null,
      );

      setFormVisible(
        true,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | EDITAR
  |--------------------------------------------------------------------------
  */

  const abrirEditar =
    (
      chofer:
        Chofer,
    ) => {
      setEditing(
        chofer,
      );

      setFormVisible(
        true,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CERRAR FORM
  |--------------------------------------------------------------------------
  */

  const cerrarForm =
    () => {
      if (saving) {
        return;
      }

      setFormVisible(
        false,
      );

      setEditing(
        null,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | BAJA
  |--------------------------------------------------------------------------
  */

  const confirmarBaja =
    async (
      chofer:
        Chofer,
    ) => {
      const ok =
        await darBaja(
          chofer,
        );

      if (ok) {
        setBajaChofer(
          null,
        );

        if (
          carnetChofer?.id ===
          chofer.id
        ) {
          setCarnetChofer(
            null,
          );
        }
      }
    };

  /*
  |--------------------------------------------------------------------------
  | QR
  |--------------------------------------------------------------------------
  */

  const regenerarQrDesdeCarnet =
    async (
      chofer:
        Chofer,
    ) => {
      const actualizado =
        await regenerarQr(
          chofer,
        );

      if (
        actualizado
      ) {
        setCarnetChofer(
          actualizado,
        );
      }

      return actualizado;
    };

  /*
  |--------------------------------------------------------------------------
  | RESPONSIVE TABLA
  |--------------------------------------------------------------------------
  */

  const tableWidth =
    Math.max(
      width - 56,

      1240,
    );

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
      <PageHeader
        title="Choferes"
        description="Registro, modificación, baja, carnet sindical, código QR e historial de asignaciones."
        badge={`${resumen.total} registrados`}
        rightContent={
          <View
            style={
              styles.headerActions
            }
          >
            <Visibility
              action="Ver"
              selector=".choferes-refrescar"
            >
              <Button
                title="Actualizar"
                variant="secondary"
                loading={
                  loading
                }
                disabled={
                  saving ||
                  deletingId !==
                    null
                }
                onPress={() =>
                  void refresh()
                }
              />
            </Visibility>

            <Visibility
              action="Crear"
              selector=".choferes-crear"
            >
              <Button
                title="Nuevo chofer"
                disabled={
                  saving ||
                  deletingId !==
                    null
                }
                onPress={
                  abrirCrear
                }
              />
            </Visibility>
          </View>
        }
      />

      {/*
      |--------------------------------------------------------------------------
      | RESUMEN
      |--------------------------------------------------------------------------
      */}

      <View
        style={
          styles.summary
        }
      >
        <Card
          style={
            styles.summaryCard
          }
        >
          <UserPlus
            size={
              20
            }
            color={
              c.primary
            }
          />

          <View>
            <ThemedText
              style={
                styles.summaryValue
              }
            >
              {
                resumen.total
              }
            </ThemedText>

            <ThemedText
              style={{
                color:
                  c.textSecondary,
              }}
            >
              Total
            </ThemedText>
          </View>
        </Card>

        <Card
          style={
            styles.summaryCard
          }
        >
          <IdCard
            size={
              20
            }
            color={
              c.success
            }
          />

          <View>
            <ThemedText
              style={
                styles.summaryValue
              }
            >
              {
                resumen.activos
              }
            </ThemedText>

            <ThemedText
              style={{
                color:
                  c.textSecondary,
              }}
            >
              Activos
            </ThemedText>
          </View>
        </Card>

        <Card
          style={
            styles.summaryCard
          }
        >
          <UserMinus
            size={
              20
            }
            color={
              c.destructive
            }
          />

          <View>
            <ThemedText
              style={
                styles.summaryValue
              }
            >
              {
                resumen.inactivos
              }
            </ThemedText>

            <ThemedText
              style={{
                color:
                  c.textSecondary,
              }}
            >
              Inactivos
            </ThemedText>
          </View>
        </Card>
      </View>

      {/*
      |--------------------------------------------------------------------------
      | BUSCADOR
      |--------------------------------------------------------------------------
      */}

      <SearchBar
        value={
          search
        }
        onChangeText={
          setSearch
        }
        placeholder="Buscar por nombre, CI, carnet sindical, licencia..."
      />

      {/*
      |--------------------------------------------------------------------------
      | TABLA
      |--------------------------------------------------------------------------
      */}

      <ScrollView
        horizontal
        style={
          styles.tableScroll
        }
        contentContainerStyle={
          styles.tableScrollContent
        }
        showsHorizontalScrollIndicator
      >
        <View
          style={[
            styles.tableWidth,

            {
              width:
                tableWidth,
            },
          ]}
        >
          <Table<Chofer>
            data={
              filtrados
            }
            columns={
              columns
            }
            loading={
              loading
            }
            keyExtractor={(
              item,
            ) =>
              String(
                item.id,
              )
            }
            emptyMessage="No se encontraron choferes."
            renderRow={(
              item,
            ) => (
              <View
                style={[
                  styles.row,

                  {
                    borderBottomColor:
                      c.border,
                  },
                ]}
              >
                {/*
                | FOTO
                */}

                <View
                  style={
                    columns[0]
                      .style
                  }
                >
                  <View
                    style={[
                      styles.avatar,

                      {
                        backgroundColor:
                          c.backgroundSecondary,

                        borderColor:
                          c.border,
                      },
                    ]}
                  >
                    {item.fotoUrl ? (
                      <Image
                        source={{
                          uri:
                            item.fotoUrl,
                        }}
                        style={
                          styles.avatarImage
                        }
                        resizeMode="cover"
                      />
                    ) : (
                      <ThemedText
                        style={{
                          color:
                            c.textSecondary,

                          fontWeight:
                            "900",
                        }}
                      >
                        {
                          item.nombre_completo
                            .charAt(
                              0,
                            )
                            .toUpperCase()
                        }
                      </ThemedText>
                    )}
                  </View>
                </View>

                {/*
                | CARNET SINDICAL
                */}

                <View
                  style={
                    columns[1]
                      .style
                  }
                >
                  <ThemedText
                    numberOfLines={
                      1
                    }
                    style={
                      styles.bold
                    }
                  >
                    {
                      item.carnet_sindical
                    }
                  </ThemedText>
                </View>

                {/*
                | NOMBRE
                */}

                <View
                  style={
                    columns[2]
                      .style
                  }
                >
                  <ThemedText
                    numberOfLines={
                      2
                    }
                    style={
                      styles.bold
                    }
                  >
                    {
                      item.nombre_completo
                    }
                  </ThemedText>
                </View>

                {/*
                | CI
                */}

                <View
                  style={
                    columns[3]
                      .style
                  }
                >
                  <ThemedText
                    numberOfLines={
                      1
                    }
                  >
                    {
                      item.carnet_identidad
                    }
                  </ThemedText>
                </View>

                {/*
                | TELÉFONO
                */}

                <View
                  style={
                    columns[4]
                      .style
                  }
                >
                  <ThemedText
                    numberOfLines={
                      1
                    }
                  >
                    {
                      item.telefono
                    }
                  </ThemedText>
                </View>

                {/*
                | LICENCIA
                */}

                <View
                  style={
                    columns[5]
                      .style
                  }
                >
                  <ThemedText
                    numberOfLines={
                      1
                    }
                  >
                    {
                      item.numero_licencia
                    }
                  </ThemedText>
                </View>

                {/*
                | CATEGORÍA
                */}

                <View
                  style={
                    columns[6]
                      .style
                  }
                >
                  <Badge
                    label={
                      String(
                        item.categoria_licencia,
                      )
                    }
                    variant="info"
                  />
                </View>

                {/*
                | ESTADO
                */}

                <View
                  style={
                    columns[7]
                      .style
                  }
                >
                  <Badge
                    label={
                      item.estado
                    }
                    variant={
                      item.estado ===
                      "ACTIVO"
                        ? "success"
                        : "destructive"
                    }
                  />
                </View>

                {/*
                | ACCIONES
                */}

                <View
                  style={[
                    columns[8]
                      .style,

                    styles.actions,
                  ]}
                >
                  <Visibility
                    action="Editar"
                    selector=".choferes-editar"
                  >
                    <IconButton
                      icon={
                        Pencil
                      }
                      size="sm"
                      variant="secondary"
                      accessibilityLabel="Modificar chofer"
                      disabled={
                        saving ||
                        deletingId !==
                          null
                      }
                      onPress={() =>
                        abrirEditar(
                          item,
                        )
                      }
                    />
                  </Visibility>

                  <Visibility
                    action="Ver"
                    selector=".choferes-historial"
                  >
                    <IconButton
                      icon={
                        History
                      }
                      size="sm"
                      variant="secondary"
                      accessibilityLabel="Ver historial"
                      onPress={() =>
                        setHistorialChofer(
                          item,
                        )
                      }
                    />
                  </Visibility>

                  <Visibility
                    action="Ver"
                    selector=".choferes-imprimir"
                  >
                    <IconButton
                      icon={
                        Printer
                      }
                      size="sm"
                      variant="secondary"
                      accessibilityLabel="Carnet sindical"
                      onPress={() =>
                        setCarnetChofer(
                          item,
                        )
                      }
                    />
                  </Visibility>

                  <Visibility
                    action="Editar"
                    selector=".choferes-qr"
                  >
                    <IconButton
                      icon={
                        QrCode
                      }
                      size="sm"
                      variant="secondary"
                      accessibilityLabel="Código QR"
                      loading={
                        qrLoadingId ===
                        item.id
                      }
                      onPress={() =>
                        setCarnetChofer(
                          item,
                        )
                      }
                    />
                  </Visibility>

                  <Visibility
                    action="Eliminar"
                    selector=".choferes-baja"
                  >
                    <IconButton
                      icon={
                        UserMinus
                      }
                      size="sm"
                      variant="destructive"
                      accessibilityLabel="Dar de baja"
                      loading={
                        deletingId ===
                        item.id
                      }
                      disabled={
                        item.estado ===
                          "INACTIVO" ||
                        saving
                      }
                      onPress={() =>
                        setBajaChofer(
                          item,
                        )
                      }
                    />
                  </Visibility>
                </View>
              </View>
            )}
          />
        </View>
      </ScrollView>

      {/*
      |--------------------------------------------------------------------------
      | MODAL CREAR / EDITAR
      |--------------------------------------------------------------------------
      */}

      <ChoferFormModal
        visible={
          formVisible
        }
        chofer={
          editing
        }
        saving={
          saving
        }
        onClose={
          cerrarForm
        }
        onSubmit={
          guardar
        }
      />

      {/*
      |--------------------------------------------------------------------------
      | MODAL BAJA
      |--------------------------------------------------------------------------
      */}

      <ChoferBajaModal
        visible={
          !!bajaChofer
        }
        chofer={
          bajaChofer
        }
        loading={
          bajaChofer
            ? deletingId ===
              bajaChofer.id
            : false
        }
        onClose={() => {
          if (
            deletingId ===
            null
          ) {
            setBajaChofer(
              null,
            );
          }
        }}
        onConfirm={
          confirmarBaja
        }
      />

      {/*
      |--------------------------------------------------------------------------
      | HISTORIAL
      |--------------------------------------------------------------------------
      */}

      <ChoferHistorialModal
        visible={
          !!historialChofer
        }
        chofer={
          historialChofer
        }
        onClose={() =>
          setHistorialChofer(
            null,
          )
        }
      />

      {/*
      |--------------------------------------------------------------------------
      | CARNET / QR
      |--------------------------------------------------------------------------
      */}

      <ChoferCarnetModal
        visible={
          !!carnetChofer
        }
        chofer={
          carnetChofer
        }
        qrLoading={
          carnetChofer
            ? qrLoadingId ===
              carnetChofer.id
            : false
        }
        onClose={() => {
          if (
            qrLoadingId ===
            null
          ) {
            setCarnetChofer(
              null,
            );
          }
        }}
        onRegenerarQr={
          regenerarQrDesdeCarnet
        }
      />
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
      flex: 1,

      padding: 18,

      gap: 12,
    },

    headerActions: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap: 8,
    },

    summary: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap: 10,
    },

    summaryCard: {
      minWidth: 180,

      flex: 1,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 12,
    },

    summaryValue: {
      fontSize: 20,

      fontWeight:
        "900",
    },

    tableScroll: {
      flex: 1,
    },

    tableScrollContent: {
      flexGrow: 1,
    },

    tableWidth: {
      flex: 1,

      minHeight: 360,
    },

    row: {
      flexDirection:
        "row",

      alignItems:
        "center",

      paddingVertical: 11,

      paddingHorizontal: 16,

      borderBottomWidth: 1,
    },

    avatar: {
      width: 42,

      height: 42,

      borderRadius: 12,

      borderWidth: 1,

      overflow:
        "hidden",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    avatarImage: {
      width:
        "100%",

      height:
        "100%",
    },

    bold: {
      fontWeight:
        "800",
    },

    actions: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 6,
    },
  });