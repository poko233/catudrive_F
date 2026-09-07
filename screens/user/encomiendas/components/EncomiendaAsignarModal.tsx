import {
  Button,
} from "@/components/ui/Button";

import {
  Input,
} from "@/components/ui/Input";

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
    idAsignacion,
    setIdAsignacion,
  ] =
    useState<
      number | undefined
    >(
      undefined,
    );

  const [
    idRuta,
    setIdRuta,
  ] =
    useState<
      number | undefined
    >(
      undefined,
    );

  const [
    horaInicio,
    setHoraInicio,
  ] =
    useState("");

  const [
    errorAsignacion,
    setErrorAsignacion,
  ] =
    useState("");

  const [
    errorRuta,
    setErrorRuta,
  ] =
    useState("");

  const [
    errorHoraInicio,
    setErrorHoraInicio,
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

      setIdAsignacion(
        undefined,
      );

      setIdRuta(
        undefined,
      );

      setHoraInicio(
        "",
      );

      setErrorAsignacion(
        "",
      );

      setErrorRuta(
        "",
      );

      setErrorHoraInicio(
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
  | OPCIONES ASIGNACIONES
  |--------------------------------------------------------------------------
  */

  const asignacionOptions =
    useMemo(
      (): SelectOption<number>[] => {
        if (
          !catalogos
        ) {
          return [];
        }

        return catalogos
          .asignaciones
          .map(
            (
              item,
            ) => ({
              label:
                `${
                  item.vehiculo
                    .placa ??
                  "Sin placa"
                } - ${
                  item.chofer
                    .nombre
                }`,

              value:
                item.id,
            }),
          );
      },

      [
        catalogos,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | OPCIONES RUTAS
  |--------------------------------------------------------------------------
  */

  const rutaOptions =
    useMemo(
      (): SelectOption<number>[] => {
        if (
          !catalogos
        ) {
          return [];
        }

        return catalogos
          .rutas
          .map(
            (
              item,
            ) => ({
              label:
                `${item.origen} → ${item.destino}`,

              value:
                item.id,
            }),
          );
      },

      [
        catalogos,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | FILTRAR RUTA CORRESPONDIENTE
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !visible ||
        !encomienda ||
        !catalogos
      ) {
        return;
      }

      const ruta =
        catalogos
          .rutas
          .find(
            (
              item,
            ) =>
              item.origen
                .trim()
                .toLowerCase() ===
                encomienda
                  .origen
                  .trim()
                  .toLowerCase() &&
              item.destino
                .trim()
                .toLowerCase() ===
                encomienda
                  .destino
                  .trim()
                  .toLowerCase(),
          );

      if (ruta) {
        setIdRuta(
          ruta.id,
        );
      }
    },

    [
      visible,
      encomienda,
      catalogos,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | VALIDAR
  |--------------------------------------------------------------------------
  */

  const validar =
    (): boolean => {
      let valido =
        true;

      setErrorAsignacion(
        "",
      );

      setErrorRuta(
        "",
      );

      setErrorHoraInicio(
        "",
      );

      if (
        idAsignacion ===
        undefined
      ) {
        setErrorAsignacion(
          "Seleccione una asignación de vehículo y chofer.",
        );

        valido =
          false;
      }

      if (
        idRuta ===
        undefined
      ) {
        setErrorRuta(
          "Seleccione una ruta.",
        );

        valido =
          false;
      }

      if (
        !horaInicio.trim()
      ) {
        setErrorHoraInicio(
          "La fecha y hora de salida es obligatoria.",
        );

        valido =
          false;
      }

      return valido;
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
        idAsignacion ===
          undefined ||
        idRuta ===
          undefined
      ) {
        return;
      }

      const payload:
        AsignarEncomiendaPayload = {
          id_asignacion_vehiculo_chofer:
            idAsignacion,

          id_ruta:
            idRuta,

          hora_inicio:
            horaInicio.trim(),
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
              loadingCatalogos
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
            label="Vehículo / Chofer *"

            value={
              idAsignacion
            }

            options={
              asignacionOptions
            }

            onValueChange={
              setIdAsignacion
            }

            searchable

            disabled={
              loadingCatalogos ||
              saving
            }
          />

          {errorAsignacion ? (
            <ThemedText
              style={
                styles.error
              }
            >
              {
                errorAsignacion
              }
            </ThemedText>
          ) : null}
        </View>

        <View>
          <Select<number>
            label="Ruta *"

            value={
              idRuta
            }

            options={
              rutaOptions
            }

            onValueChange={
              setIdRuta
            }

            searchable

            disabled={
              loadingCatalogos ||
              saving
            }
          />

          {errorRuta ? (
            <ThemedText
              style={
                styles.error
              }
            >
              {
                errorRuta
              }
            </ThemedText>
          ) : null}
        </View>

        <Input
          label="Fecha y hora de salida *"

          placeholder="2026-09-05 14:30:00"

          value={
            horaInicio
          }

          error={
            errorHoraInicio ||
            undefined
          }

          editable={
            !saving
          }

          onChangeText={
            setHoraInicio
          }

          helperText="Formato: YYYY-MM-DD HH:mm:ss"
        />
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