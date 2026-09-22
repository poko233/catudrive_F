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
  | OBTENER PRÓXIMA HORA
  |--------------------------------------------------------------------------
  |
  | Ruta:
  |
  | 06:00
  |
  | Sin viajes:
  | → 06:00
  |
  | Ya existe 06:00:
  | → 06:30
  |
  | Ya existen 06:00 y 06:30:
  | → 07:00
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
        !horaInicio
      ) {
        setError(
          "No se pudo determinar la hora del viaje.",
        );

        return;
      }

      setLoading(
        true,
      );

      setError(
        null,
      );

      try {
        /*
         * El backend vuelve a calcular la hora.
         *
         * No confiamos únicamente en la hora mostrada,
         * porque otro usuario podría haber creado otro
         * viaje mientras el modal estaba abierto.
         */

        await crearViajeProgramado({
          id_asignacion_vehiculo_chofer:
            idAsignacion,

          id_ruta:
            idRuta,
        });

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
            false
          }

          placeholder="Selecciona una ruta"

          helperText={
            horaInicio
              ? `Fecha: ${fechaSalida} · Intervalo automático de 30 minutos`
              : "La hora se obtiene automáticamente desde la ruta."
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