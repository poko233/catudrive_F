import {
  Input,
} from "@/components/ui/Input";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  Button,
} from "@/components/ui/Button";

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  Select,
  SelectOption,
} from "@/components/ui/Select";

import {
  Encomienda,
  EncomiendaCatalogos,
  EncomiendaPayload,
} from "../types/encomienda.types";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface EncomiendaFormModalProps {
  visible: boolean;

  encomienda:
    Encomienda | null;

  catalogos:
    EncomiendaCatalogos | null;

  loadingCatalogos:
    boolean;

  saving:
    boolean;

  onClose:
    () => void;

  onLoadCatalogos:
    () => Promise<boolean>;

  onCreate:
    (
      payload:
        EncomiendaPayload,
    ) => Promise<boolean>;

  onUpdate:
    (
      encomienda:
        Encomienda,

      payload:
        EncomiendaPayload,
    ) => Promise<boolean>;
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function EncomiendaFormModal({
  visible,

  encomienda,

  catalogos,

  loadingCatalogos,

  saving,

  onClose,

  onLoadCatalogos,

  onCreate,

  onUpdate,
}: EncomiendaFormModalProps) {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    remitente,
    setRemitente,
  ] =
    useState("");

  const [
    destinatario,
    setDestinatario,
  ] =
    useState("");

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
    descripcion,
    setDescripcion,
  ] =
    useState("");

  const [
    cantidad,
    setCantidad,
  ] =
    useState("1");

  const [
    precio,
    setPrecio,
  ] =
    useState("");

  const [
    errorRemitente,
    setErrorRemitente,
  ] =
    useState("");

  const [
    errorDestinatario,
    setErrorDestinatario,
  ] =
    useState("");

  const [
    errorViaje,
    setErrorViaje,
  ] =
    useState("");

  const [
    errorCantidad,
    setErrorCantidad,
  ] =
    useState("");

  const [
    errorPrecio,
    setErrorPrecio,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | CARGAR DATOS
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (!visible) {
        return;
      }

      void onLoadCatalogos();

      setRemitente(
        encomienda
          ?.remitente ??
          "",
      );

      setDestinatario(
        encomienda
          ?.destinatario ??
          "",
      );

      setIdViaje(
        encomienda
          ? encomienda.viaje?.id
          : undefined,
      );

      setDescripcion(
        encomienda
          ?.descripcion ??
          "",
      );

      setCantidad(
        encomienda
          ? String(
              encomienda.cantidad,
            )
          : "1",
      );

      setPrecio(
        encomienda
          ? String(
              encomienda.precio,
            )
          : "",
      );

      setErrorRemitente(
        "",
      );

      setErrorDestinatario(
        "",
      );

      setErrorViaje(
        "",
      );

      setErrorCantidad(
        "",
      );

      setErrorPrecio(
        "",
      );
    },

    [
      visible,
      encomienda,
      onLoadCatalogos,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | OPCIONES DE VIAJES
  |--------------------------------------------------------------------------
  */

  const viajeOptions =
    useMemo(
      (): SelectOption<number>[] => {
        if (!catalogos) {
          return [];
        }

        return catalogos.viajes.map(
          (viaje) => {
            const ruta = viaje.ruta
              ? `${viaje.ruta.origen} → ${viaje.ruta.destino}`
              : "Sin ruta";

            const placa =
              viaje.vehiculo?.placa
                ? ` · ${viaje.vehiculo.placa}`
                : "";

            const chofer =
              viaje.chofer?.nombre
                ? ` · ${viaje.chofer.nombre}`
                : "";

            return {
              label: `Viaje #${viaje.id} · ${ruta}${placa}${chofer}`,
              value: viaje.id,
            };
          },
        );
      },
      [catalogos],
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

      setErrorRemitente(
        "",
      );

      setErrorDestinatario(
        "",
      );

      setErrorViaje(
        "",
      );

      setErrorCantidad(
        "",
      );

      setErrorPrecio(
        "",
      );

      if (
        !remitente.trim()
      ) {
        setErrorRemitente(
          "El remitente es obligatorio.",
        );

        valido =
          false;
      }

      if (
        !destinatario.trim()
      ) {
        setErrorDestinatario(
          "El destinatario es obligatorio.",
        );

        valido =
          false;
      }

      if (
        idViaje ===
        undefined
      ) {
        setErrorViaje(
          "Debe seleccionar un viaje.",
        );

        valido =
          false;
      }

      const cantidadNumero =
        Number(
          cantidad,
        );

      if (
        !cantidad.trim() ||
        !Number.isInteger(
          cantidadNumero,
        ) ||
        cantidadNumero < 1
      ) {
        setErrorCantidad(
          "La cantidad debe ser mayor o igual a 1.",
        );

        valido =
          false;
      }

      const precioNumero =
        Number(
          precio,
        );

      if (
        !precio.trim() ||
        Number.isNaN(
          precioNumero,
        ) ||
        precioNumero < 0
      ) {
        setErrorPrecio(
          "Ingrese un precio válido.",
        );

        valido =
          false;
      }

      return valido;
    };

  /*
  |--------------------------------------------------------------------------
  | GUARDAR
  |--------------------------------------------------------------------------
  */

  const guardar =
    async () => {
      if (
        saving ||
        !validar()
      ) {
        return;
      }

      if (
        idViaje ===
        undefined
      ) {
        return;
      }

      const payload:
        EncomiendaPayload = {
          id_viaje:
            idViaje,

          remitente:
            remitente.trim(),

          destinatario:
            destinatario.trim(),

          descripcion:
            descripcion.trim()
              ? descripcion.trim()
              : null,

          cantidad:
            Number(
              cantidad,
            ),

          precio:
            Number(
              precio,
            ),
        };

      let ok =
        false;

      if (encomienda) {
        ok =
          await onUpdate(
            encomienda,

            payload,
          );
      } else {
        ok =
          await onCreate(
            payload,
          );
      }

      if (ok) {
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
        encomienda
          ? "Editar encomienda"
          : "Nueva encomienda"
      }

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
            title={
              encomienda
                ? "Guardar cambios"
                : "Registrar encomienda"
            }

            loading={
              saving
            }

            disabled={
              saving ||
              loadingCatalogos
            }

            onPress={() =>
              void guardar()
            }
          />
        </View>
      }
    >
      <View style={styles.content}>
        {encomienda ? (
          <View
            style={
              styles.guiaContainer
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
        ) : null}

        <View
          style={
            styles.row
          }
        >
          <View
            style={
              styles.field
            }
          >
            <Input
              label="Remitente *"

              placeholder="Nombre del remitente"

              value={
                remitente
              }

              error={
                errorRemitente ||
                undefined
              }

              editable={
                !saving
              }

              onChangeText={
                setRemitente
              }
            />
          </View>

          <View
            style={
              styles.field
            }
          >
            <Input
              label="Destinatario *"

              placeholder="Nombre del destinatario"

              value={
                destinatario
              }

              error={
                errorDestinatario ||
                undefined
              }

              editable={
                !saving
              }

              onChangeText={
                setDestinatario
              }
            />
          </View>
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
              saving ||
              encomienda !== null
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

        <Input
          label="Descripción"

          placeholder="Descripción de la encomienda"

          value={
            descripcion
          }

          editable={
            !saving
          }

          onChangeText={
            setDescripcion
          }
        />

        <View
          style={
            styles.row
          }
        >
          <View
            style={
              styles.field
            }
          >
            <Input
              label="Cantidad *"

              placeholder="1"

              value={
                cantidad
              }

              keyboardType="numeric"

              error={
                errorCantidad ||
                undefined
              }

              editable={
                !saving
              }

              onChangeText={
                setCantidad
              }
            />
          </View>

          <View
            style={
              styles.field
            }
          >
            <Input
              label="Precio *"

              placeholder="0.00"

              value={
                precio
              }

              keyboardType="decimal-pad"

              error={
                errorPrecio ||
                undefined
              }

              editable={
                !saving
              }

              onChangeText={
                setPrecio
              }
            />
          </View>
        </View>
      </View>
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

    row: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        12,
    },

    field: {
      flex:
        1,

      minWidth:
        220,
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

    guiaContainer: {
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
        17,

      fontWeight:
        "800",
    },

    error: {
      fontSize:
        12,

      marginTop:
        4,
    },
  });
