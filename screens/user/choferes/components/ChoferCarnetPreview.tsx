import {
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type {
  Chofer,
} from "../types/chofer.types";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

type Props = {
  chofer:
    Chofer;
};

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
|
| Vista previa visual del carnet.
|
| No realiza la impresión real.
| La impresión física/navegador está en:
|
| utils/choferCarnet.ts
|
*/

export function ChoferCarnetPreview({
  chofer,
}: Props) {
  return (
    <View
      style={
        styles.card
      }
    >
      {/*
      |--------------------------------------------------------------------------
      | CABECERA
      |--------------------------------------------------------------------------
      */}

      <View
        style={
          styles.top
        }
      >
        <Text
          style={
            styles.brand
          }
        >
          CATUDRIVE
        </Text>

        <Text
          style={
            styles.kind
          }
        >
          CARNET SINDICAL
        </Text>
      </View>

      {/*
      |--------------------------------------------------------------------------
      | CUERPO
      |--------------------------------------------------------------------------
      */}

      <View
        style={
          styles.body
        }
      >
        {/*
        |--------------------------------------------------------------------------
        | FOTO
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.photoColumn
          }
        >
          <View
            style={
              styles.photo
            }
          >
            {chofer.fotoUrl ? (
              <Image
                source={{
                  uri:
                    chofer.fotoUrl,
                }}
                style={
                  styles.photoImage
                }
                resizeMode="cover"
              />
            ) : (
              <Text
                style={
                  styles.placeholderText
                }
              >
                SIN FOTO
              </Text>
            )}
          </View>
        </View>

        {/*
        |--------------------------------------------------------------------------
        | DATOS
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.data
          }
        >
          <Text
            numberOfLines={
              2
            }
            style={
              styles.name
            }
          >
            {
              chofer.nombre_completo
            }
          </Text>

          <DataLine
            label="Carnet sindical"
            value={
              chofer.carnet_sindical
            }
          />

          <DataLine
            label="C.I."
            value={
              chofer.carnet_identidad
            }
          />

          <DataLine
            label="Teléfono"
            value={
              chofer.telefono
            }
          />

          <DataLine
            label="Licencia"
            value={
              chofer.numero_licencia
            }
          />

          <DataLine
            label="Categoría"
            value={
              String(
                chofer.categoria_licencia,
              )
            }
          />
        </View>

        {/*
        |--------------------------------------------------------------------------
        | QR
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.qrColumn
          }
        >
          <View
            style={
              styles.qr
            }
          >
            {chofer.qrUrl ? (
              <Image
                source={{
                  uri:
                    chofer.qrUrl,
                }}
                style={
                  styles.qrImage
                }
                resizeMode="contain"
              />
            ) : (
              <Text
                style={
                  styles.placeholderText
                }
              >
                SIN QR
              </Text>
            )}
          </View>
        </View>
      </View>

      {/*
      |--------------------------------------------------------------------------
      | PIE
      |--------------------------------------------------------------------------
      */}

      <View
        style={
          styles.footer
        }
      >
        <Text
          style={
            styles.footerText
          }
        >
          Identificación sindical digital
        </Text>

        <View
          style={[
            styles.status,

            chofer.estado ===
            "ACTIVO"
              ? styles.statusActive
              : styles.statusInactive,
          ]}
        >
          <Text
            style={[
              styles.statusText,

              chofer.estado ===
              "ACTIVO"
                ? styles.statusTextActive
                : styles.statusTextInactive,
            ]}
          >
            {
              chofer.estado
            }
          </Text>
        </View>
      </View>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| DATA LINE
|--------------------------------------------------------------------------
*/

function DataLine({
  label,
  value,
}: {
  label: string;

  value:
    | string
    | number
    | null
    | undefined;
}) {
  return (
    <View
      style={
        styles.line
      }
    >
      <Text
        style={
          styles.label
        }
      >
        {label}
      </Text>

      <Text
        numberOfLines={
          1
        }
        ellipsizeMode="tail"
        style={
          styles.value
        }
      >
        {
          value ??
          "—"
        }
      </Text>
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
    | TARJETA
    |--------------------------------------------------------------------------
    */

    card: {
      width:
        "100%",

      aspectRatio:
        85.6 / 54,

      overflow:
        "hidden",

      position:
        "relative",

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#1F2937",
    },

    /*
    |--------------------------------------------------------------------------
    | CABECERA
    |--------------------------------------------------------------------------
    */

    top: {
      height:
        50,

      paddingHorizontal:
        18,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      backgroundColor:
        "#111827",
    },

    brand: {
      color:
        "#FFFFFF",

      fontSize:
        18,

      fontWeight:
        "900",

      letterSpacing:
        1.2,
    },

    kind: {
      color:
        "#FFFFFF",

      fontSize:
        10,

      fontWeight:
        "800",

      letterSpacing:
        0.8,

      opacity:
        0.9,
    },

    /*
    |--------------------------------------------------------------------------
    | BODY
    |--------------------------------------------------------------------------
    */

    body: {
      flex:
        1,

      minHeight:
        0,

      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        12,

      paddingHorizontal:
        16,

      paddingTop:
        14,

      paddingBottom:
        42,
    },

    /*
    |--------------------------------------------------------------------------
    | FOTO
    |--------------------------------------------------------------------------
    */

    photoColumn: {
      width:
        "21%",
    },

    photo: {
      width:
        "100%",

      aspectRatio:
        3 / 4,

      overflow:
        "hidden",

      alignItems:
        "center",

      justifyContent:
        "center",

      borderWidth:
        1,

      borderColor:
        "#D1D5DB",

      borderRadius:
        8,

      backgroundColor:
        "#F9FAFB",
    },

    photoImage: {
      width:
        "100%",

      height:
        "100%",
    },

    /*
    |--------------------------------------------------------------------------
    | DATOS
    |--------------------------------------------------------------------------
    */

    data: {
      flex:
        1,

      minWidth:
        0,

      gap:
        4,
    },

    name: {
      marginBottom:
        5,

      color:
        "#111827",

      fontSize:
        15,

      lineHeight:
        18,

      fontWeight:
        "900",

      textTransform:
        "uppercase",
    },

    line: {
      width:
        "100%",

      minHeight:
        18,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        6,
    },

    label: {
      width:
        90,

      color:
        "#6B7280",

      fontSize:
        9,

      fontWeight:
        "700",
    },

    value: {
      flex:
        1,

      color:
        "#111827",

      fontSize:
        9,

      fontWeight:
        "800",
    },

    /*
    |--------------------------------------------------------------------------
    | QR
    |--------------------------------------------------------------------------
    */

    qrColumn: {
      width:
        "20%",

      alignItems:
        "flex-end",
    },

    qr: {
      width:
        "100%",

      aspectRatio:
        1,

      overflow:
        "hidden",

      alignItems:
        "center",

      justifyContent:
        "center",

      padding:
        5,

      borderWidth:
        1,

      borderColor:
        "#D1D5DB",

      borderRadius:
        8,

      backgroundColor:
        "#FFFFFF",
    },

    qrImage: {
      width:
        "100%",

      height:
        "100%",
    },

    placeholderText: {
      color:
        "#6B7280",

      fontSize:
        8,

      fontWeight:
        "800",

      textAlign:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | FOOTER
    |--------------------------------------------------------------------------
    */

    footer: {
      position:
        "absolute",

      left:
        16,

      right:
        16,

      bottom:
        9,

      minHeight:
        28,

      paddingTop:
        7,

      borderTopWidth:
        1,

      borderTopColor:
        "#D1D5DB",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        10,
    },

    footerText: {
      color:
        "#4B5563",

      fontSize:
        8,

      fontWeight:
        "600",
    },

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    status: {
      paddingHorizontal:
        8,

      paddingVertical:
        4,

      borderRadius:
        999,
    },

    statusActive: {
      backgroundColor:
        "#D1FAE5",
    },

    statusInactive: {
      backgroundColor:
        "#FEE2E2",
    },

    statusText: {
      fontSize:
        8,

      fontWeight:
        "900",
    },

    statusTextActive: {
      color:
        "#065F46",
    },

    statusTextInactive: {
      color:
        "#991B1B",
    },
  });
