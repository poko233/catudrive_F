import { DatePicker } from "@/components/DatePickerModal";

import { ThemedText } from "@/components/ThemedText";

import { Button } from "@/components/ui/Button";

import { Input } from "@/components/ui/Input";

import { Modal } from "@/components/ui/Modal";

import { RichSelectOption, SelectRich } from "@/components/ui/SelectRich";

import { useTheme } from "@/theme/useTheme";

import { CalendarDays, Car, User } from "lucide-react-native";

import { useEffect, useMemo, useState } from "react";

import { Pressable, StyleSheet, View } from "react-native";

import Toast from "react-native-toast-message";

import { getCatalogosAsignacion } from "../services/asignacionVehiculo.service";

import {
  Asignacion,
  AsignacionForm,
  AsignacionPayload,
  CatalogosAsignacionResponse,
} from "../types/asignacionVehiculo.types";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

type Props = {
  visible: boolean;

  asignacion: Asignacion | null;

  saving: boolean;

  onClose: () => void;

  onCreate: (payload: AsignacionPayload) => Promise<boolean>;

  onChange: (
    actual: Asignacion,

    payload: AsignacionPayload,
  ) => Promise<boolean>;
};

/*
|--------------------------------------------------------------------------
| HOY
|--------------------------------------------------------------------------
*/

function hoy(): string {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
|--------------------------------------------------------------------------
| MOSTRAR FECHA
|--------------------------------------------------------------------------
*/

function mostrarFecha(value: string): string {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export function AsignacionFormModal({
  visible,

  asignacion,

  saving,

  onClose,

  onCreate,

  onChange,
}: Props) {
  const { theme } = useTheme();

  const c = theme.colors;

  const changing = !!asignacion;

  const [form, setForm] = useState<AsignacionForm>({
    fecha_asignacion: hoy(),

    id_chofer: null,

    id_vehiculo: null,

    observacion: "",
  });

  const [catalogos, setCatalogos] = useState<CatalogosAsignacionResponse>({
    choferes: [],

    vehiculos: [],
  });

  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  const [dateVisible, setDateVisible] = useState(false);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | CARGAR CATÁLOGOS
  |--------------------------------------------------------------------------
  |
  | GET REAL siempre.
  |
  | Esto garantiza que solamente aparezcan:
  |
  | - choferes disponibles
  | - vehículos disponibles
  |
  */

  useEffect(() => {
    if (!visible) {
      return;
    }

    setForm({
      fecha_asignacion: hoy(),

      id_chofer: asignacion?.chofer.id ?? null,

      id_vehiculo: asignacion?.vehiculo.id ?? null,

      observacion: asignacion?.observacion ?? "",
    });

    setError("");

    setDateVisible(false);

    let active = true;

    setLoadingCatalogos(true);

    getCatalogosAsignacion(asignacion?.id)
      .then((response) => {
        if (active) {
          setCatalogos(response);
        }
      })
      .catch((error) => {
        Toast.show({
          type: "error",

          text1: "No se pudieron cargar los datos",

          text2: error instanceof Error ? error.message : "Intenta nuevamente.",
        });
      })
      .finally(() => {
        if (active) {
          setLoadingCatalogos(false);
        }
      });

    return () => {
      active = false;
    };
  }, [visible, asignacion]);

  /*
  |--------------------------------------------------------------------------
  | CHOFER OPTIONS
  |--------------------------------------------------------------------------
  */

  const choferOptions = useMemo<RichSelectOption<number>[]>(
    () =>
      catalogos.choferes.map((item) => ({
        value: item.id,

        icon: User,

        title: item.nombre,

        subtitle: item.telefono ? `Tel: ${item.telefono}` : undefined,

        fields: [
          {
            label: "CI",

            value: item.ci,
          },

          {
            label: "Sind.",

            value: item.carnet_sindical,
          },

          {
            label: "Tel",

            value: item.telefono ?? null,
          },

          {
            label: "Licencia",

            value: item.numero_licencia,
          },

          {
            label: "Categoría",

            value: item.categoria_licencia,
          },
        ],
      })),

    [catalogos.choferes],
  );

  /*
  |--------------------------------------------------------------------------
  | VEHÍCULO OPTIONS
  |--------------------------------------------------------------------------
  */

  const vehiculoOptions = useMemo<RichSelectOption<number>[]>(
    () =>
      catalogos.vehiculos.map((item) => {
        const activo = item.estado.toUpperCase() === "OPERATIVO";

        return {
          value: item.id,

          icon: Car,

          title: item.placa,

          subtitle: [item.marca, item.modelo, item.tipo, item.color]
            .filter(Boolean)
            .join(" · "),

          badge: {
            label: item.estado,

            variant: activo ? "success" : "destructive",
          },

          fields: [
            {
              label: "Cap.",

              value: item.capacidad,

              accent: true,
            },

            {
              label: "Marca",

              value: item.marca,
            },

            {
              label: "Modelo",

              value: item.modelo,
            },

            {
              label: "Tipo",

              value: item.tipo,
            },

            {
              label: "Color",

              value: item.color,
            },

            {
              label: "Estado",

              value: item.estado,
            },
          ],
        };
      }),

    [catalogos.vehiculos],
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE
  |--------------------------------------------------------------------------
  */

  const update = <K extends keyof AsignacionForm>(
    key: K,

    value: AsignacionForm[K],
  ) => {
    setForm((current) => ({
      ...current,

      [key]: value,
    }));

    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | GUARDAR
  |--------------------------------------------------------------------------
  */

  const guardar = async () => {
    if (!form.fecha_asignacion) {
      setError("Debe seleccionar una fecha.");

      return;
    }

    if (!form.id_chofer) {
      setError("Debe seleccionar un chofer.");

      return;
    }

    if (!form.id_vehiculo) {
      setError("Debe seleccionar un vehículo.");

      return;
    }

    const payload: AsignacionPayload = {
      fecha_asignacion: form.fecha_asignacion,

      id_chofer: form.id_chofer,

      id_vehiculo: form.id_vehiculo,

      observacion: form.observacion.trim() || null,
    };

    const ok =
      changing && asignacion
        ? await onChange(
            asignacion,

            payload,
          )
        : await onCreate(payload);

    if (ok) {
      onClose();
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        title={changing ? "Cambio de asignación" : "Asignar vehículo"}
        onClose={onClose}
        closeOnBackdropPress={!saving}
        width="96%"
        maxWidth={720}
        footer={
          <View style={styles.footer}>
            <Button
              title="Cancelar"
              variant="secondary"
              disabled={saving}
              onPress={onClose}
            />

            <Button
              title={changing ? "Realizar cambio" : "Asignar vehículo"}
              loading={saving}
              disabled={saving || loadingCatalogos}
              onPress={guardar}
            />
          </View>
        }
      >
        <View style={styles.content}>
          <View style={styles.field}>
            <ThemedText
              style={[
                styles.label,

                {
                  color: c.textSecondary,
                },
              ]}
            >
              Fecha de asignación
            </ThemedText>

            <Pressable
              disabled={saving}
              onPress={() => setDateVisible(true)}
              style={[
                styles.dateButton,

                {
                  backgroundColor: c.input,

                  borderColor: c.inputBorder,
                },
              ]}
            >
              <CalendarDays size={18} color={c.primary} />

              <ThemedText style={styles.dateText}>
                {mostrarFecha(form.fecha_asignacion)}
              </ThemedText>
            </Pressable>
          </View>

          <SelectRich<number>
            label="Chofer"
            value={form.id_chofer ?? undefined}
            options={choferOptions}
            searchable
            searchPlaceholder="Buscar por nombre o CI..."
            modalTitle="Seleccionar chofer"
            placeholder="Seleccione un chofer"
            disabled={saving || loadingCatalogos}
            loading={loadingCatalogos}
            onValueChange={(value) =>
              update(
                "id_chofer",

                value,
              )
            }
          />

          <SelectRich<number>
            label="Vehículo"
            value={form.id_vehiculo ?? undefined}
            options={vehiculoOptions}
            searchable
            searchPlaceholder="Buscar por placa o modelo..."
            modalTitle="Seleccionar vehículo"
            placeholder="Seleccione un vehículo"
            disabled={saving || loadingCatalogos}
            loading={loadingCatalogos}
            onValueChange={(value) =>
              update(
                "id_vehiculo",

                value,
              )
            }
          />

          <Input
            label="Observación"
            value={form.observacion}
            placeholder="Ej. Vehículo asignado temporalmente..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={2000}
            editable={!saving}
            onChangeText={(value) =>
              update(
                "observacion",

                value,
              )
            }
          />

          {!!error && (
            <ThemedText
              style={{
                color: c.destructive,

                fontSize: 12,

                fontWeight: "700",
              }}
            >
              {error}
            </ThemedText>
          )}
        </View>
      </Modal>

      <DatePicker
        visible={dateVisible}
        mode="single"
        title={changing ? "Fecha del cambio" : "Fecha de asignación"}
        initialDate={form.fecha_asignacion}
        minDate={changing ? asignacion?.fecha_asignacion : undefined}
        maxDate={hoy()}
        onClose={() => setDateVisible(false)}
        onApply={(result) => {
          if (result.type !== "single") {
            return;
          }

          update(
            "fecha_asignacion",

            result.date,
          );

          setDateVisible(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
  },

  field: {
    gap: 6,
  },

  label: {
    fontSize: 13,

    fontWeight: "600",
  },

  dateButton: {
    minHeight: 46,

    borderWidth: 1.5,

    borderRadius: 10,

    paddingHorizontal: 14,

    flexDirection: "row",

    alignItems: "center",

    gap: 10,
  },

  dateText: {
    fontSize: 14,

    fontWeight: "700",
  },

  footer: {
    flexDirection: "row",

    flexWrap: "wrap",

    justifyContent: "flex-end",

    gap: 10,
  },
});
