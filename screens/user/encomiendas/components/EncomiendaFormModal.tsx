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
  useState,
} from "react";

import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  Encomienda,
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

  saving: boolean;

  onClose:
    () => void;

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

  saving,

  onClose,

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
    origen,
    setOrigen,
  ] =
    useState("");

  const [
    destino,
    setDestino,
  ] =
    useState("");

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
    errorOrigen,
    setErrorOrigen,
  ] =
    useState("");

  const [
    errorDestino,
    setErrorDestino,
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

      setOrigen(
        encomienda
          ?.origen ??
          "",
      );

      setDestino(
        encomienda
          ?.destino ??
          "",
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

      setErrorOrigen(
        "",
      );

      setErrorDestino(
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

      setErrorRemitente(
        "",
      );

      setErrorDestinatario(
        "",
      );

      setErrorOrigen(
        "",
      );

      setErrorDestino(
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
        !origen.trim()
      ) {
        setErrorOrigen(
          "El origen es obligatorio.",
        );

        valido =
          false;
      }

      if (
        !destino.trim()
      ) {
        setErrorDestino(
          "El destino es obligatorio.",
        );

        valido =
          false;
      }

      if (
        origen
          .trim()
          .toLowerCase() ===
          destino
            .trim()
            .toLowerCase() &&
        origen.trim() &&
        destino.trim()
      ) {
        setErrorDestino(
          "El destino debe ser diferente al origen.",
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

      const payload:
        EncomiendaPayload = {
          remitente:
            remitente.trim(),

          destinatario:
            destinatario.trim(),

          origen:
            origen.trim(),

          destino:
            destino.trim(),

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
              saving
            }

            onPress={() =>
              void guardar()
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
              label="Origen *"

              placeholder="Ej. Cochabamba"

              value={
                origen
              }

              error={
                errorOrigen ||
                undefined
              }

              editable={
                !saving
              }

              onChangeText={
                setOrigen
              }
            />
          </View>

          <View
            style={
              styles.field
            }
          >
            <Input
              label="Destino *"

              placeholder="Ej. Quillacollo"

              value={
                destino
              }

              error={
                errorDestino ||
                undefined
              }

              editable={
                !saving
              }

              onChangeText={
                setDestino
              }
            />
          </View>
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
  });