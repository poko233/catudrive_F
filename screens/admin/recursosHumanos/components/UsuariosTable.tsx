// screens/admin/recursosHumanos/components/UsuariosTable.tsx

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
  SearchBar,
} from "@/components/ui/SearchBar";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  Pencil,
  QrCode,
  UserRound,
} from "lucide-react-native";

import {
  useMemo,
  useState,
} from "react";

import {
  Image,
  StyleSheet,
  View,
} from "react-native";

import {
  UsuarioRRHH,
} from "../types/recursosHumanos.types";

/*
|--------------------------------------------------------------------------
| COLUMNAS
|--------------------------------------------------------------------------
*/

const COL = {
  foto:
    0.55,

  usuario:
    1.15,

  nombre:
    2.1,

  ci:
    1,

  contacto:
    1.8,

  roles:
    1.45,

  qr:
    0.55,

  estado:
    0.95,

  acciones:
    0.75,
};

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

type Props = {
  usuarios: UsuarioRRHH[];

  /*
   * Carga inicial.
   *
   * Controla skeleton de tabla.
   */
  loading: boolean;

  /*
   * Refresh manual.
   *
   * Solo controla botón Actualizar.
   */
  refreshing?: boolean;

  onEditar: (
    usuario: UsuarioRRHH,
  ) => void;

  onRefresh:
    () =>
      void |
      Promise<void>;
};

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
        "FOTO",

      style: {
        flex:
          COL.foto,

        minWidth:
          0,
      },
    },

    {
      key:
        "usuario",

      label:
        "USUARIO",

      style: {
        flex:
          COL.usuario,

        minWidth:
          0,
      },
    },

    {
      key:
        "nombre",

      label:
        "NOMBRE COMPLETO",

      style: {
        flex:
          COL.nombre,

        minWidth:
          0,
      },
    },

    {
      key:
        "ci",

      label:
        "CI",

      style: {
        flex:
          COL.ci,

        minWidth:
          0,
      },
    },

    {
      key:
        "contacto",

      label:
        "CONTACTO",

      style: {
        flex:
          COL.contacto,

        minWidth:
          0,
      },
    },

    {
      key:
        "roles",

      label:
        "ROLES",

      style: {
        flex:
          COL.roles,

        minWidth:
          0,
      },
    },

    {
      key:
        "qr",

      label:
        "QR",

      style: {
        flex:
          COL.qr,

        minWidth:
          0,
      },
    },

    {
      key:
        "estado",

      label:
        "ESTADO",

      style: {
        flex:
          COL.estado,

        minWidth:
          0,
      },
    },

    {
      key:
        "acciones",

      label:
        "ACCIÓN",

      style: {
        flex:
          COL.acciones,

        minWidth:
          0,
      },
    },
  ];

/*
|--------------------------------------------------------------------------
| NOMBRE
|--------------------------------------------------------------------------
*/

const nombreCompleto = (
  usuario: UsuarioRRHH,
): string =>
  [
    usuario.nombres,

    usuario.apellidoPaterno,

    usuario.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(" ");

/*
|--------------------------------------------------------------------------
| ROLES
|--------------------------------------------------------------------------
*/

const rolesTexto = (
  usuario: UsuarioRRHH,
): string =>
  usuario.roles
    ?.map(
      (
        rol,
      ) =>
        rol.rol,
    )
    .filter(Boolean)
    .join(", ") ||
  "Sin rol";

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function UsuariosTable({
  usuarios,

  loading,

  refreshing = false,

  onEditar,

  onRefresh,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  /*
  |--------------------------------------------------------------------------
  | BUSCADOR
  |--------------------------------------------------------------------------
  */

  const [
    search,
    setSearch,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | FILTRADO LOCAL
  |--------------------------------------------------------------------------
  |
  | El buscador NO hace requests.
  |
  | Trabaja directamente sobre usuarios cacheados.
  |
  */

  const data =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return usuarios;
        }

        return usuarios.filter(
          (
            usuario,
          ) =>
            [
              usuario.usuario,

              usuario.ci,

              nombreCompleto(
                usuario,
              ),

              usuario.email,

              usuario.celular,

              usuario.telefono,

              usuario.estado,

              rolesTexto(
                usuario,
              ),
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(
                query,
              ),
        );
      },
      [
        usuarios,
        search,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <Card
      padding={0}
      style={
        styles.card
      }
    >
      {/* ================================================= */}
      {/* TOOLBAR */}
      {/* ================================================= */}

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
            styles.heading
          }
        >
          <ThemedText
            style={
              styles.title
            }
          >
            Usuarios del sistema
          </ThemedText>

          <ThemedText
            style={[
              styles.resultCount,

              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            {data.length} resultado(s)
          </ThemedText>
        </View>

        {/* ================================================= */}
        {/* ACTUALIZAR */}
        {/* ================================================= */}

        <Visibility
          action="Ver"
          selector=".rrhh-actualizar-listado"
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
              loading ||
              refreshing
            }
            onPress={() => {
              void onRefresh();
            }}
          />
        </Visibility>
      </View>

      {/* ================================================= */}
      {/* BUSCADOR */}
      {/* ================================================= */}

      <Visibility
        action="Ver"
        selector=".rrhh-buscador"
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
            placeholder="Buscar por nombre, CI, correo, usuario o rol..."
          />
        </View>
      </Visibility>

      {/* ================================================= */}
      {/* TABLE */}
      {/* ================================================= */}

      <View
        style={
          styles.table
        }
      >
        <Table<UsuarioRRHH>
          data={
            data
          }
          columns={
            columns
          }

          /*
           * IMPORTANTE:
           *
           * refreshing NO activa skeleton.
           *
           * La tabla solo muestra skeleton cuando
           * realmente es la primera carga sin cache.
           */

          loading={
            loading
          }
          emptyMessage="No se encontraron usuarios."
          keyExtractor={(
            usuario,
          ) =>
            String(
              usuario.id,
            )
          }
          renderRow={(
            usuario,
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
              {/* ================================================= */}
              {/* FOTO */}
              {/* ================================================= */}

              <View
                style={[
                  styles.cell,

                  styles.center,

                  {
                    flex:
                      COL.foto,
                  },
                ]}
              >
                {usuario.fotoUrl ? (
                  <Image
                    source={{
                      uri:
                        usuario.fotoUrl,
                    }}
                    style={
                      styles.avatar
                    }
                  />
                ) : (
                  <UserRound
                    size={21}
                    color={
                      c.textMuted
                    }
                  />
                )}
              </View>

              {/* ================================================= */}
              {/* USUARIO */}
              {/* ================================================= */}

              <Cell
                flex={
                  COL.usuario
                }
                primary={
                  usuario.usuario ||
                  "-"
                }
                secondary={
                  `ID #${usuario.id}`
                }
              />

              {/* ================================================= */}
              {/* NOMBRE */}
              {/* ================================================= */}

              <Cell
                flex={
                  COL.nombre
                }
                primary={
                  nombreCompleto(
                    usuario,
                  ) ||
                  "-"
                }
              />

              {/* ================================================= */}
              {/* CI */}
              {/* ================================================= */}

              <Cell
                flex={
                  COL.ci
                }
                primary={
                  usuario.ci ||
                  "-"
                }
                secondary={
                  usuario.expedido ||
                  ""
                }
              />

              {/* ================================================= */}
              {/* CONTACTO */}
              {/* ================================================= */}

              <Cell
                flex={
                  COL.contacto
                }
                primary={
                  usuario.email ||
                  "Sin correo"
                }
                secondary={
                  usuario.celular ||
                  usuario.telefono ||
                  "Sin teléfono"
                }
              />

              {/* ================================================= */}
              {/* ROLES */}
              {/* ================================================= */}

              <Cell
                flex={
                  COL.roles
                }
                primary={
                  rolesTexto(
                    usuario,
                  )
                }
              />

              {/* ================================================= */}
              {/* QR */}
              {/* ================================================= */}

              <View
                style={[
                  styles.cell,

                  styles.center,

                  {
                    flex:
                      COL.qr,
                  },
                ]}
              >
                {usuario.qrUrl ? (
                  <Image
                    source={{
                      uri:
                        usuario.qrUrl,
                    }}
                    style={
                      styles.qr
                    }
                  />
                ) : (
                  <QrCode
                    size={21}
                    color={
                      c.textMuted
                    }
                  />
                )}
              </View>

              {/* ================================================= */}
              {/* ESTADO */}
              {/* ================================================= */}

              <View
                style={[
                  styles.cell,

                  styles.center,

                  {
                    flex:
                      COL.estado,
                  },
                ]}
              >
                <Badge
                  label={
                    usuario.estado ||
                    "SIN ESTADO"
                  }
                  variant={
                    usuario.estado ===
                    "ACTIVO"
                      ? "success"
                      : usuario.estado ===
                          "INACTIVO"
                        ? "destructive"
                        : "muted"
                  }
                />
              </View>

              {/* ================================================= */}
              {/* EDIT */}
              {/* ================================================= */}

              <View
                style={[
                  styles.cell,

                  styles.center,

                  {
                    flex:
                      COL.acciones,
                  },
                ]}
              >
                <Visibility
                  action="Editar"
                  selector=".rrhh-editar-usuario"
                >
                  <IconButton
                    icon={
                      Pencil
                    }
                    size="sm"
                    variant="secondary"
                    accessibilityLabel={
                      `Editar ${nombreCompleto(
                        usuario,
                      )}`
                    }
                    onPress={() =>
                      onEditar(
                        usuario,
                      )
                    }
                  />
                </Visibility>
              </View>
            </View>
          )}
        />
      </View>
    </Card>
  );
}

/*
|--------------------------------------------------------------------------
| CELL
|--------------------------------------------------------------------------
*/

function Cell({
  flex,

  primary,

  secondary,
}: {
  flex: number;

  primary: string;

  secondary?: string;
}) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  return (
    <View
      style={[
        styles.cell,

        {
          flex,
        },
      ]}
    >
      <ThemedText
        numberOfLines={1}
        ellipsizeMode="tail"
        style={
          styles.primary
        }
      >
        {primary}
      </ThemedText>

      {!!secondary && (
        <ThemedText
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            styles.secondary,

            {
              color:
                c.textSecondary,
            },
          ]}
        >
          {secondary}
        </ThemedText>
      )}
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
    card: {
      width:
        "100%",

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

    heading: {
      flex:
        1,

      minWidth:
        220,

      gap:
        3,
    },

    title: {
      fontSize:
        19,

      fontWeight:
        "900",
    },

    resultCount: {
      fontSize:
        12,
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
      width:
        "100%",

      height:
        620,
    },

    row: {
      width:
        "100%",

      minHeight:
        66,

      flexDirection:
        "row",

      borderBottomWidth:
        1,
    },

    cell: {
      minWidth:
        0,

      minHeight:
        66,

      paddingHorizontal:
        8,

      justifyContent:
        "center",

      gap:
        2,
    },

    center: {
      alignItems:
        "center",

      justifyContent:
        "center",
    },

    primary: {
      fontSize:
        12,

      fontWeight:
        "700",

      lineHeight:
        16,
    },

    secondary: {
      fontSize:
        10,

      lineHeight:
        14,
    },

    avatar: {
      width:
        38,

      height:
        38,

      borderRadius:
        12,
    },

    qr: {
      width:
        36,

      height:
        36,

      resizeMode:
        "contain",
    },
  });