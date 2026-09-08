import {
  Button,
} from "@/components/ui/Button";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  Select,
  SelectOption,
} from "@/components/ui/Select";

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  AsignarEncomiendaPayload,
  Encomienda,
  EncomiendaCatalogoViaje,
  EncomiendaCatalogos,
} from "../types/encomienda.types";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface EncomiendaAsignarModalProps {
  visible: boolean;

  encomienda:
    Encomienda | null;

  catalogos:
    EncomiendaCatalogos | null;

  loadingCatalogos: boolean;

  saving: boolean;

  onClose:
    () => void;

  onLoadCatalogos:
    () => Promise<boolean>;

  onConfirm:
    (
      encomienda:
        Encomienda,

      payload:
        AsignarEncomiendaPayload,
    ) => Promise<boolean>;
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function EncomiendaAsignarModal({
  visible,

  encomienda,

  catalogos,

  loadingCatalogos,

  saving,

  onClose,

  onLoadCatalogos,

  onConfirm,
}: EncomiendaAsignarModalProps) {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    idViaje,
    setIdViaje,
  ] =
    useState<
      number | undefined
    >(
      undefined,
    );

  const [
    errorViaje,
    setErrorViaje,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | CARGAR CATÁLOGOS
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (!visible) {
        return;
      }

      setIdViaje(
        undefined,
      );

      setErrorViaje(
        "",
      );

      void onLoadCatalogos();
    },

    [
      visible,
      onLoadCatalogos,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | VIAJES COMPATIBLES CON LA ENCOMIENDA
  |--------------------------------------------------------------------------
  */

  const viajesDisponibles =
    useMemo(
      (): EncomiendaCatalogoViaje[] => {
        if (
          !catalogos ||
          !encomienda
        ) {
          return [];
        }

        return catalogos
          .viajes
          .filter(
            (
              viaje,
            ) => {
              const ruta =
                viaje.ruta;

              if (!ruta) {
                return false;
              }

              return (
                ruta.origen
                  .trim()
                  .toLowerCase() ===
                  encomienda
                    .origen
                    .trim()
                    .toLowerCase() &&
                ruta.destino
                  .trim()
                  .toLowerCase() ===
                  encomienda
                    .destino
                    .trim()
                    .toLowerCase()
              );
            },
          );
      },

      [
        catalogos,
        encomienda,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | OPCIONES VIAJES
  |--------------------------------------------------------------------------
  */

  const viajeOptions =
    useMemo(
      (): SelectOption<number>[] => {
        return viajesDisponibles
          .map(
            (
              viaje,
            ) => {
              const placa =
                viaje
                  .vehiculo
                  ?.placa ??
                "Sin placa";

              const chofer =
                viaje
                  .chofer
                  ?.nombre ??
                "Sin chofer";

              const ruta =
                viaje.ruta
                  ? `${viaje.ruta.origen} → ${viaje.ruta.destino}`
                  : "Sin ruta";

              const horaInicio =
                viaje.hora_inicio ??
                "Sin fecha/hora";

              return {
                label:
                  `${ruta} | ${placa} | ${chofer} | ${horaInicio}`,

                value:
                  viaje.id,
              };
            },
          );
      },

      [
        viajesDisponibles,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | VIAJE SELECCIONADO
  |--------------------------------------------------------------------------
  */

  const viajeSeleccionado =
    useMemo(
      (): EncomiendaCatalogoViaje | null => {
        if (
          idViaje ===
          undefined
        ) {
          return null;
        }

        return (
          viajesDisponibles
            .find(
              (
                viaje,
              ) =>
                viaje.id ===
                idViaje,
            ) ??
          null
        );
      },

      [
        idViaje,
        viajesDisponibles,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | VALIDAR
  |--------------------------------------------------------------------------
  */

  const validar =
    (): boolean => {
      setErrorViaje(
        "",
      );

      if (
        idViaje ===
        undefined
      ) {
        setErrorViaje(
          "Seleccione un viaje.",
        );

        return false;
      }

      return true;
    };

  /*
  |--------------------------------------------------------------------------
  | CONFIRMAR
  |--------------------------------------------------------------------------
  */

  const confirmar =
    async () => {
      if (
        !encomienda ||
        saving ||
        !validar() ||
        idViaje ===
          undefined
      ) {
        return;
      }

      const payload:
        AsignarEncomiendaPayload = {
          id_viaje:
            idViaje,
        };

      const ok =
        await onConfirm(
          encomienda,

          payload,
        );

      if (ok) {
        onClose();
      }
    };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  if (!encomienda) {
    return null;
  }

  return (
    <Modal
      visible={
        visible
      }

      title="Asignar encomienda"

      onClose={
        onClose
      }

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

          <Button
            title="Asignar"

            loading={
              saving
            }

            disabled={
              saving ||
              loadingCatalogos ||
              viajesDisponibles.length ===
                0
            }

            onPress={() =>
              void confirmar()
            }
          />
        </View>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }

        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={
            styles.info
          }
        >
          <ThemedText
            style={
              styles.guiaLabel
            }
          >
            Número de guía
          </ThemedText>

          <ThemedText
            style={
              styles.guia
            }
          >
            {
              encomienda.guia ??
              "—"
            }
          </ThemedText>
        </View>

        <View
          style={
            styles.routeInfo
          }
        >
          <ThemedText
            style={
              styles.routeLabel
            }
          >
            Ruta de la encomienda
          </ThemedText>

          <ThemedText
            style={
              styles.routeValue
            }
          >
            {
              encomienda.origen
            }
            {" → "}
            {
              encomienda.destino
            }
          </ThemedText>
        </View>

        <View>
          <Select<number>
            label="Viaje *"

            value={
              idViaje
            }

            options={
              viajeOptions
            }

            onValueChange={
              setIdViaje
            }

            searchable

            disabled={
              loadingCatalogos ||
              saving
            }
          />

          {errorViaje ? (
            <ThemedText
              style={
                styles.error
              }
            >
              {
                errorViaje
              }
            </ThemedText>
          ) : null}
        </View>

        {!loadingCatalogos &&
        viajesDisponibles.length ===
          0 ? (
          <View
            style={
              styles.warning
            }
          >
            <ThemedText
              style={
                styles.warningTitle
              }
            >
              No existen viajes disponibles
            </ThemedText>

            <ThemedText
              style={
                styles.warningText
              }
            >
              No se encontró un viaje con la ruta{" "}
              {encomienda.origen}
              {" → "}
              {encomienda.destino}.
            </ThemedText>
          </View>
        ) : null}

        {viajeSeleccionado ? (
          <View
            style={
              styles.detailCard
            }
          >
            <ThemedText
              style={
                styles.detailTitle
              }
            >
              Datos del viaje
            </ThemedText>

            <View
              style={
                styles.detailRow
              }
            >
              <ThemedText
                style={
                  styles.detailLabel
                }
              >
                Viaje
              </ThemedText>

              <ThemedText
                style={
                  styles.detailValue
                }
              >
                #{viajeSeleccionado.id}
              </ThemedText>
            </View>

            <View
              style={
                styles.detailRow
              }
            >
              <ThemedText
                style={
                  styles.detailLabel
                }
              >
                Estado
              </ThemedText>

              <ThemedText
                style={
                  styles.detailValue
                }
              >
                {
                  viajeSeleccionado.estado ??
                  "—"
                }
              </ThemedText>
            </View>

            <View
              style={
                styles.detailRow
              }
            >
              <ThemedText
                style={
                  styles.detailLabel
                }
              >
                Salida
              </ThemedText>

              <ThemedText
                style={
                  styles.detailValue
                }
              >
                {
                  viajeSeleccionado.hora_inicio ??
                  "—"
                }
              </ThemedText>
            </View>

            <View
              style={
                styles.detailRow
              }
            >
              <ThemedText
                style={
                  styles.detailLabel
                }
              >
                Ruta
              </ThemedText>

              <ThemedText
                style={
                  styles.detailValue
                }
              >
                {
                  viajeSeleccionado.ruta
                    ? `${viajeSeleccionado.ruta.origen} → ${viajeSeleccionado.ruta.destino}`
                    : "—"
                }
              </ThemedText>
            </View>

            <View
              style={
                styles.detailRow
              }
            >
              <ThemedText
                style={
                  styles.detailLabel
                }
              >
                Chofer
              </ThemedText>

              <ThemedText
                style={
                  styles.detailValue
                }
              >
                {
                  viajeSeleccionado
                    .chofer
                    ?.nombre ??
                  "—"
                }
              </ThemedText>
            </View>

            <View
              style={
                styles.detailRow
              }
            >
              <ThemedText
                style={
                  styles.detailLabel
                }
              >
                Vehículo
              </ThemedText>

              <ThemedText
                style={
                  styles.detailValue
                }
              >
                {
                  viajeSeleccionado
                    .vehiculo
                    ?.placa ??
                  "—"
                }
              </ThemedText>
            </View>
          </View>
        ) : null}
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
    content: {
      gap:
        14,

      paddingBottom:
        4,
    },

    info: {
      gap:
        2,
    },

    guiaLabel: {
      fontSize:
        12,

      opacity:
        0.7,
    },

    guia: {
      fontSize:
        18,

      fontWeight:
        "900",
    },

    routeInfo: {
      gap:
        2,
    },

    routeLabel: {
      fontSize:
        12,

      opacity:
        0.7,
    },

    routeValue: {
      fontSize:
        14,

      fontWeight:
        "700",
    },

    detailCard: {
      gap:
        10,

      padding:
        14,

      borderWidth:
        1,

      borderColor:
        "rgba(128, 128, 128, 0.25)",

      borderRadius:
        12,
    },

    detailTitle: {
      fontSize:
        15,

      fontWeight:
        "800",
    },

    detailRow: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      gap:
        12,
    },

    detailLabel: {
      fontSize:
        13,

      opacity:
        0.65,
    },

    detailValue: {
      flex:
        1,

      fontSize:
        13,

      fontWeight:
        "700",

      textAlign:
        "right",
    },

    warning: {
      gap:
        4,

      padding:
        14,

      borderWidth:
        1,

      borderColor:
        "rgba(128, 128, 128, 0.25)",

      borderRadius:
        12,
    },

    warningTitle: {
      fontSize:
        14,

      fontWeight:
        "800",
    },

    warningText: {
      fontSize:
        13,

      opacity:
        0.75,
    },

    footer: {
      flexDirection:
        "row",

      justifyContent:
        "flex-end",

      flexWrap:
        "wrap",

      gap:
        8,
    },

    error: {
      fontSize:
        12,

      marginTop:
        4,
    },
  });