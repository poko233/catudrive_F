import React, {
  useEffect,
  useState,
} from "react";

import {
  Text,
  View,
} from "react-native";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  Input,
} from "@/components/ui/Input";

import {
  SelectRich,
} from "@/components/ui/SelectRich";

import {
  Button,
} from "@/components/ui/Button";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  haptics,
} from "@/animations/haptics";

import {
  useAsignacionesCacheadas,
} from "../hooks/useAsignaciones";

import {
  useRutasCacheadas,
} from "../hooks/useRutas";

import {
  opcionesAsignaciones as armarOpcionesAsignaciones,
  opcionesRutas as armarOpcionesRutas,
} from "../utils/opcionesSeleccion";

import {
  crearViajeProgramado,
  getProximaHoraViaje,
} from "../services/pasajes.service";

interface Props {
  visible: boolean;

  onClose: () => void;

  onCreated: () => void;
}

const HORA_REGEX =
  /^(?:[01]?\d|2[0-3]):[0-5]\d$/;

function normalizarHora(
  hora:
    string,
): string {
  const [
    horas,
    minutos,
  ] =
    hora.split(
      ":",
    );

  return `${horas.padStart(
    2,
    "0",
  )}:${minutos}`;
}

export function ModalNuevaRelacion({
  visible,
  onClose,
  onCreated,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const {
    data:
      asignaciones,

    loading:
      loadingAsignaciones,
  } =
    useAsignacionesCacheadas(
      visible,
    );

  const {
    data:
      rutas,

    loading:
      loadingRutas,
  } =
    useRutasCacheadas(
      visible,
    );

  const [
    idAsignacion,
    setIdAsignacion,
  ] =
    useState<number | null>(
      null,
    );

  const [
    idRuta,
    setIdRuta,
  ] =
    useState<number | null>(
      null,
    );

  const [
    horaInicio,
    setHoraInicio,
  ] =
    useState(
      "",
    );

  const [
    fechaSalida,
    setFechaSalida,
  ] =
    useState(
      "",
    );

  const [
    loadingHora,
    setLoadingHora,
  ] =
    useState(
      false,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const opcionesAsignaciones =
    armarOpcionesAsignaciones(
      asignaciones,
    );

  const opcionesRutas =
    armarOpcionesRutas(
      rutas,
    );

  /*
  |--------------------------------------------------------------------------
  | LIMPIAR FORMULARIO
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!visible) {
      setIdAsignacion(
        null,
      );

      setIdRuta(
        null,
      );

      setHoraInicio(
        "",
      );

      setFechaSalida(
        "",
      );

      setError(
        null,
      );

      setLoadingHora(
        false,
      );

      setLoading(
        false,
      );
    }
  }, [
    visible,
  ]);

  /*
  |--------------------------------------------------------------------------
  | OBTENER HORA SUGERIDA
  |--------------------------------------------------------------------------
  |
  | El backend sigue calculando la siguiente hora como antes.
  |
  | Ejemplo:
  |
  | 06:00
  | 06:30
  | 07:00
  |
  | La diferencia es que ahora esa hora solamente es una sugerencia.
  | El usuario puede modificarla antes de crear el viaje.
  |
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !visible ||
      !idRuta
    ) {
      setHoraInicio(
        "",
      );

      setFechaSalida(
        "",
      );

      return;
    }

    let activo =
      true;

    const cargar =
      async () => {
        setLoadingHora(
          true,
        );

        setError(
          null,
        );

        try {
          const resultado =
            await getProximaHoraViaje(
              idRuta,
            );

          if (!activo) {
            return;
          }

          setHoraInicio(
            resultado.hora,
          );

          setFechaSalida(
            resultado.fecha,
          );
        } catch (
          err: any
        ) {
          if (!activo) {
            return;
          }

          setHoraInicio(
            "",
          );

          setFechaSalida(
            "",
          );

          setError(
            err?.message ||
              "No se pudo calcular la próxima hora de salida.",
          );
        } finally {
          if (activo) {
            setLoadingHora(
              false,
            );
          }
        }
      };

    void cargar();

    return () => {
      activo =
        false;
    };
  }, [
    idRuta,
    visible,
  ]);

  /*
  |--------------------------------------------------------------------------
  | CAMBIAR HORA
  |--------------------------------------------------------------------------
  */

  const handleCambiarHora =
    (
      value:
        string,
    ) => {
      const limpio =
        value
          .replace(
            /[^0-9:]/g,
            "",
          )
          .slice(
            0,
            5,
          );

      setHoraInicio(
        limpio,
      );

      if (error) {
        setError(
          null,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | CREAR VIAJE
  |--------------------------------------------------------------------------
  */

  const handleCrear =
    async () => {
      if (
        !idAsignacion ||
        !idRuta
      ) {
        setError(
          "Selecciona asignación y ruta.",
        );

        return;
      }

      if (
        !fechaSalida
      ) {
        setError(
          "No se pudo determinar la fecha de salida.",
        );

        return;
      }

      if (
        !horaInicio
      ) {
        setError(
          "Ingresa la hora de salida.",
        );

        return;
      }

      if (
        !HORA_REGEX.test(
          horaInicio,
        )
      ) {
        setError(
          "Ingresa una hora válida en formato HH:mm.",
        );

        return;
      }

      const horaNormalizada =
        normalizarHora(
          horaInicio,
        );

      setLoading(
        true,
      );

      setError(
        null,
      );

      try {
        /*
         * La función crearViajeProgramado ya envía el objeto completo
         * como body al backend.
         *
         * Guardamos primero el payload en una variable para conservar
         * compatibilidad con el tipo actual del servicio, aunque agreguemos
         * hora_inicio al body.
         */

        const payload = {
          id_asignacion_vehiculo_chofer:
            idAsignacion,

          id_ruta:
            idRuta,

          hora_inicio:
            `${fechaSalida} ${horaNormalizada}:00`,
        };

        await crearViajeProgramado(
          payload,
        );

        haptics.success();

        onCreated();

        onClose();
      } catch (
        err: any
      ) {
        setError(
          err?.message ||
            "Error al crear viaje.",
        );

        haptics.error();
      } finally {
        setLoading(
          false,
        );
      }
    };

  return (
    <Modal
      visible={
        visible
      }

      onClose={
        onClose
      }

      title="Nueva Relación Vehículo-Chofer-Ruta"

      footer={
        <View
          style={{
            flexDirection:
              "row",

            gap:
              10,

            justifyContent:
              "flex-end",
          }}
        >
          <Button
            title="Cancelar"

            variant="secondary"

            disabled={
              loading
            }

            onPress={
              onClose
            }
          />

          <Button
            title="Crear viaje"

            loading={
              loading
            }

            disabled={
              !idAsignacion ||
              !idRuta ||
              !horaInicio ||
              loadingHora
            }

            onPress={
              handleCrear
            }
          />
        </View>
      }
    >
      <View
        style={{
          gap:
            12,
        }}
      >
        <SelectRich
          label="Asignación (Vehículo-Chofer)"

          value={
            idAsignacion ??
            undefined
          }

          onValueChange={
            setIdAsignacion
          }

          options={
            opcionesAsignaciones
          }

          searchable

          searchPlaceholder="Buscar por placa, chofer o CI"

          modalTitle="Seleccionar asignación"

          placeholder={
            asignaciones.length ===
            0
              ? "No hay opciones disponibles"
              : "Selecciona asignación"
          }

          loading={
            loadingAsignaciones &&
            asignaciones.length ===
              0
          }

          disabled={
            asignaciones.length ===
            0
          }
        />

        <SelectRich
          label="Ruta"

          value={
            idRuta ??
            undefined
          }

          onValueChange={
            setIdRuta
          }

          options={
            opcionesRutas
          }

          searchable

          searchPlaceholder="Buscar por origen o destino"

          modalTitle="Seleccionar ruta"

          placeholder={
            rutas.length ===
            0
              ? "No hay opciones disponibles"
              : "Selecciona ruta"
          }

          loading={
            loadingRutas &&
            rutas.length ===
              0
          }

          disabled={
            rutas.length ===
            0
          }
        />

        <Input
          label="Hora de salida"

          value={
            loadingHora
              ? "Calculando..."
              : horaInicio
          }

          editable={
            !loadingHora
          }

          onChangeText={
            handleCambiarHora
          }

          maxLength={
            5
          }

          placeholder="HH:mm"

          helperText={
            horaInicio
              ? `Fecha: ${fechaSalida} · Hora sugerida automáticamente. Puedes modificarla.`
              : "Selecciona una ruta para obtener una hora sugerida."
          }
        />

        {error ? (
          <Text
            style={{
              color:
                c.destructive,

              fontSize:
                13,
            }}
          >
            {error}
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}
