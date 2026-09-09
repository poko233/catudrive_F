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
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  useResponsive,
} from "@/hooks/useResponsive";

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
| FILTRO RESUMEN
|--------------------------------------------------------------------------
*/

type FiltroChofer =
  | "TODOS"
  | "ACTIVOS"
  | "INACTIVOS";

/*
|--------------------------------------------------------------------------
| COLUMNAS
|--------------------------------------------------------------------------
|
| No utilizamos width/minWidth.
|
| Table reparte todo el ancho disponible
| utilizando flex.
|
| Header y datos utilizan exactamente
| la misma geometría.
|
*/

const columns:
  TableColumn[] = [
    {
      key:
        "foto",

      label:
        "Foto",

      flex:
        0.55,

      align:
        "center",

      skeletonWidth:
        40,
    },

    {
      key:
        "sindical",

      label:
        "Carnet Sindical",

      flex:
        1.05,

      align:
        "center",
    },

    {
      key:
        "nombre",

      label:
        "Nombre Completo",

      flex:
        1.85,

      align:
        "center",
    },

    {
      key:
        "ci",

      label:
        "C.I.",

      flex:
        0.95,

      align:
        "center",
    },

    {
      key:
        "telefono",

      label:
        "Teléfono",

      flex:
        0.95,

      align:
        "center",
    },

    {
      key:
        "licencia",

      label:
        "Nro. Licencia",

      flex:
        1,

      align:
        "center",
    },

    {
      key:
        "categoria",

      label:
        "Categoría",

      flex:
        0.72,

      align:
        "center",
    },

    {
      key:
        "estado",

      label:
        "Estado",

      flex:
        0.85,

      align:
        "center",
    },

    {
      key:
        "acciones",

      label:
        "Acciones",

      /*
       * Necesitamos un poco más de espacio
       * porque existen cinco botones.
       */
      flex:
        1.65,

      align:
        "center",
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
    isDesktop,
  } =
    useResponsive();

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
    filtro,
    setFiltro,
  ] =
    useState<FiltroChofer>(
      "TODOS",
    );

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
  | FILTRO DE TARJETAS
  |--------------------------------------------------------------------------
  */

  const choferesPorEstado =
    useMemo(
      () => {
        switch (
          filtro
        ) {
          case "ACTIVOS":
            return choferes.filter(
              (
                item,
              ) =>
                item.estado ===
                "ACTIVO",
            );

          case "INACTIVOS":
            return choferes.filter(
              (
                item,
              ) =>
                item.estado ===
                "INACTIVO",
            );

          case "TODOS":

          default:
            return choferes;
        }
      },

      [
        choferes,
        filtro,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | BUSCADOR
  |--------------------------------------------------------------------------
  |
  | El buscador trabaja sobre el filtro
  | seleccionado en las tarjetas.
  |
  */

  const filtrados =
    useMemo(
      () => {
        const q =
          search
            .trim()
            .toLowerCase();

        if (!q) {
          return choferesPorEstado;
        }

        return choferesPorEstado.filter(
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
        choferesPorEstado,
        search,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | TEXTO DEL FILTRO
  |--------------------------------------------------------------------------
  */

  const filtroTexto =
    useMemo(
      () => {
        switch (
          filtro
        ) {
          case "ACTIVOS":
            return "Activos";

          case "INACTIVOS":
            return "Inactivos";

          default:
            return "Todos";
        }
      },

      [
        filtro,
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
      if (
        saving
      ) {
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
      {/*
      |--------------------------------------------------------------------------
      | HEADER
      |--------------------------------------------------------------------------
      */}

      <PageHeader
        title="Choferes"

        description="Registro, modificación, baja, carnet sindical, código QR e historial de asignaciones."

        badge={`${filtrados.length} · ${filtroTexto}`}

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
      | TARJETAS / FILTROS
      |--------------------------------------------------------------------------
      */}

      <View
        style={
          styles.summary
        }
      >
        {/*
        |--------------------------------------------------------------------------
        | TODOS
        |--------------------------------------------------------------------------
        */}

        <Pressable
          accessibilityRole="button"

          accessibilityState={{
            selected:
              filtro ===
              "TODOS",
          }}

          onPress={() =>
            setFiltro(
              "TODOS",
            )
          }

          style={({
            pressed,
          }) => [
            styles.summaryPressable,

            !isDesktop &&
              styles.summaryPressableMobile,

            {
              opacity:
                pressed
                  ? 0.78
                  : 1,
            },
          ]}
        >
          <Card
            style={[
              styles.summaryCard,

              filtro ===
                "TODOS"
                ? {
                    borderColor:
                      c.primary,

                    borderWidth:
                      2,
                  }
                : null,
            ]}
          >
            <UserPlus
              size={
                20
              }

              color={
                c.primary
              }
            />

            <View
              style={
                styles.summaryContent
              }
            >
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
        </Pressable>

        {/*
        |--------------------------------------------------------------------------
        | ACTIVOS
        |--------------------------------------------------------------------------
        */}

        <Pressable
          accessibilityRole="button"

          accessibilityState={{
            selected:
              filtro ===
              "ACTIVOS",
          }}

          onPress={() =>
            setFiltro(
              "ACTIVOS",
            )
          }

          style={({
            pressed,
          }) => [
            styles.summaryPressable,

            !isDesktop &&
              styles.summaryPressableMobile,

            {
              opacity:
                pressed
                  ? 0.78
                  : 1,
            },
          ]}
        >
          <Card
            style={[
              styles.summaryCard,

              filtro ===
                "ACTIVOS"
                ? {
                    borderColor:
                      c.primary,

                    borderWidth:
                      2,
                  }
                : null,
            ]}
          >
            <IdCard
              size={
                20
              }

              color={
                c.success
              }
            />

            <View
              style={
                styles.summaryContent
              }
            >
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
        </Pressable>

        {/*
        |--------------------------------------------------------------------------
        | INACTIVOS
        |--------------------------------------------------------------------------
        */}

        <Pressable
          accessibilityRole="button"

          accessibilityState={{
            selected:
              filtro ===
              "INACTIVOS",
          }}

          onPress={() =>
            setFiltro(
              "INACTIVOS",
            )
          }

          style={({
            pressed,
          }) => [
            styles.summaryPressable,

            !isDesktop &&
              styles.summaryPressableMobile,

            {
              opacity:
                pressed
                  ? 0.78
                  : 1,
            },
          ]}
        >
          <Card
            style={[
              styles.summaryCard,

              filtro ===
                "INACTIVOS"
                ? {
                    borderColor:
                      c.primary,

                    borderWidth:
                      2,
                  }
                : null,
            ]}
          >
            <UserMinus
              size={
                20
              }

              color={
                c.destructive
              }
            />

            <View
              style={
                styles.summaryContent
              }
            >
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
        </Pressable>
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
      |
      | Ya no existe ScrollView horizontal.
      |
      | Ya no existe tableWidth.
      |
      | Ya no existe renderRow manual.
      |
      */}

      <View
        style={
          styles.tableContainer
        }
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

          columnGap={
            1
          }

          horizontalPadding={
            5
          }

          cellPaddingHorizontal={
            2
          }

          keyExtractor={(
            item,
          ) =>
            String(
              item.id,
            )
          }

          emptyMessage="No existen choferes para este filtro."

          renderCell={(
            item,
            column,
          ) => {
            switch (
              column.key
            ) {
              /*
              |--------------------------------------------------------------------------
              | FOTO
              |--------------------------------------------------------------------------
              */

              case "foto":
                return (
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
                        style={[
                          styles.avatarLetter,

                          {
                            color:
                              c.textSecondary,
                          },
                        ]}
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
                );

              /*
              |--------------------------------------------------------------------------
              | CARNET SINDICAL
              |--------------------------------------------------------------------------
              */

              case "sindical":
                return (
                  <ThemedText
                    numberOfLines={
                      1
                    }

                    ellipsizeMode="tail"

                    style={
                      styles.cellBold
                    }
                  >
                    {
                      item.carnet_sindical
                    }
                  </ThemedText>
                );

              /*
              |--------------------------------------------------------------------------
              | NOMBRE
              |--------------------------------------------------------------------------
              */

              case "nombre":
                return (
                  <ThemedText
                    numberOfLines={
                      1
                    }

                    ellipsizeMode="tail"

                    style={
                      styles.cellBold
                    }
                  >
                    {
                      item.nombre_completo
                    }
                  </ThemedText>
                );

              /*
              |--------------------------------------------------------------------------
              | CI
              |--------------------------------------------------------------------------
              */

              case "ci":
                return (
                  <ThemedText
                    numberOfLines={
                      1
                    }

                    adjustsFontSizeToFit

                    minimumFontScale={
                      0.8
                    }

                    style={
                      styles.cellText
                    }
                  >
                    {
                      item.carnet_identidad
                    }
                  </ThemedText>
                );

              /*
              |--------------------------------------------------------------------------
              | TELÉFONO
              |--------------------------------------------------------------------------
              */

              case "telefono":
                return (
                  <ThemedText
                    numberOfLines={
                      1
                    }

                    adjustsFontSizeToFit

                    minimumFontScale={
                      0.8
                    }

                    style={
                      styles.cellText
                    }
                  >
                    {
                      item.telefono
                    }
                  </ThemedText>
                );

              /*
              |--------------------------------------------------------------------------
              | LICENCIA
              |--------------------------------------------------------------------------
              */

              case "licencia":
                return (
                  <ThemedText
                    numberOfLines={
                      1
                    }

                    adjustsFontSizeToFit

                    minimumFontScale={
                      0.75
                    }

                    style={
                      styles.cellText
                    }
                  >
                    {
                      item.numero_licencia
                    }
                  </ThemedText>
                );

              /*
              |--------------------------------------------------------------------------
              | CATEGORÍA
              |--------------------------------------------------------------------------
              */

              case "categoria":
                return (
                  <Badge
                    label={
                      String(
                        item.categoria_licencia,
                      )
                    }

                    variant="info"
                  />
                );

              /*
              |--------------------------------------------------------------------------
              | ESTADO
              |--------------------------------------------------------------------------
              */

              case "estado":
                return (
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
                );

              /*
              |--------------------------------------------------------------------------
              | ACCIONES
              |--------------------------------------------------------------------------
              */

              case "acciones":
                return (
                  <View
                    style={
                      styles.actions
                    }
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

                        disabled={
                          saving ||
                          deletingId !==
                            null
                        }

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

                        disabled={
                          saving ||
                          deletingId !==
                            null
                        }

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

                        disabled={
                          saving ||
                          deletingId !==
                            null
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
                );

              default:
                return null;
            }
          }}
        />
      </View>

      {/*
      |--------------------------------------------------------------------------
      | CREAR / EDITAR
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
      | BAJA
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
    /*
    |--------------------------------------------------------------------------
    | SCREEN
    |--------------------------------------------------------------------------
    */

    screen: {
      flex:
        1,

      width:
        "100%",

      minWidth:
        0,

      padding:
        18,

      gap:
        12,
    },

    /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

    headerActions: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        8,
    },

    /*
    |--------------------------------------------------------------------------
    | FILTROS
    |--------------------------------------------------------------------------
    */

    summary: {
      width:
        "100%",

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        10,
    },

    summaryPressable: {
      flex:
        1,

      minWidth:
        170,
    },

    summaryPressableMobile: {
      flexGrow:
        0,

      flexBasis:
        "47%",

      minWidth:
        0,
    },

    summaryCard: {
      minHeight:
        78,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        12,
    },

    summaryContent: {
      gap:
        1,
    },

    summaryValue: {
      fontSize:
        20,

      fontWeight:
        "900",
    },

    /*
    |--------------------------------------------------------------------------
    | TABLA
    |--------------------------------------------------------------------------
    */

    tableContainer: {
      flex:
        1,

      width:
        "100%",

      minWidth:
        0,

      overflow:
        "hidden",
    },

    /*
    |--------------------------------------------------------------------------
    | FOTO
    |--------------------------------------------------------------------------
    */

    avatar: {
      width:
        40,

      height:
        40,

      borderRadius:
        11,

      borderWidth:
        1,

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

    avatarLetter: {
      fontWeight:
        "900",

      fontSize:
        14,
    },

    /*
    |--------------------------------------------------------------------------
    | TEXTOS
    |--------------------------------------------------------------------------
    */

    cellText: {
      width:
        "100%",

      textAlign:
        "center",

      fontSize:
        12,

      fontVariant: [
        "tabular-nums",
      ],
    },

    cellBold: {
      width:
        "100%",

      textAlign:
        "center",

      fontSize:
        12,

      fontWeight:
        "800",
    },

    /*
    |--------------------------------------------------------------------------
    | ACCIONES
    |--------------------------------------------------------------------------
    */

    actions: {
      width:
        "100%",

      minWidth:
        0,

      flexDirection:
        "row",

      flexWrap:
        "nowrap",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        3,
    },
  });