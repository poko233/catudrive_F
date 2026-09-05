import {
  RichSelectOption,
} from "@/components/ui/SelectRich";
import {
  ArrowRightLeft,
  Car,
  Route,
} from "lucide-react-native";
import { Asignacion } from "@/screens/user/asignacionesVehiculos/types/asignacionVehiculo.types";
import { Ruta } from "@/screens/user/rutas/types/ruta.types";
import { VehiculoChoferRuta } from "../types/pasajes.types";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function esEstadoActivo(estado: string | null | undefined): boolean {
  if (!estado) return false;
  const s = estado.toUpperCase();
  return s === "ACTIVO" || s === "ACTIVA";
}

function nombreChofer(chofer: {
  nombre?: string | null;
  nombre_completo?: string | null;
} | null | undefined): string {
  return chofer?.nombre ?? chofer?.nombre_completo ?? "Chofer ?";
}

type ChoferVisual = {
  nombre?: string | null;
  nombre_completo?: string | null;
  ci?: string | null;
  carnet_sindical?: string | null;
  telefono?: string | null;
};

/*
|--------------------------------------------------------------------------
| OPCIONES DE ASIGNACIÓN (Vehículo-Chofer)
|--------------------------------------------------------------------------
*/

export function opcionesAsignaciones(
  asignaciones: Asignacion[],
): RichSelectOption<number>[] {
  return asignaciones
    .filter((a) => esEstadoActivo(a.estado))
    .map((a) => {
      const v = a.vehiculo;
      const ch = a.chofer;

      return {
        value: a.id,
        icon: Car,
        title: `${v.placa} · ${ch.nombre}`,
        subtitle: [v.marca, v.modelo, v.tipo, v.color]
          .filter(Boolean)
          .join(" · "),
        badge: { label: "Activo", variant: "success" },
        fields: [
          { label: "Cap.", value: v.capacidad ?? null, accent: true },
          { label: "Marca", value: v.marca ?? null },
          { label: "Modelo", value: v.modelo ?? null },
          { label: "Tipo", value: v.tipo ?? null },
          { label: "Color", value: v.color ?? null },
          { label: "Estado", value: v.estado ?? null },
          { label: "CI", value: ch.ci ?? null },
          { label: "Sind.", value: ch.carnet_sindical ?? null },
          { label: "Tel", value: ch.telefono ?? null },
        ],
      };
    });
}

/*
|--------------------------------------------------------------------------
| OPCIONES DE RUTA
|--------------------------------------------------------------------------
*/

export function opcionesRutas(rutas: Ruta[]): RichSelectOption<number>[] {
  return rutas.map((r) => {
    const activa = esEstadoActivo(r.estado);
    const horario = [r.hora_inicio, r.hora_fin].filter(Boolean).join(" → ").trim();

    return {
      value: r.id,
      icon: Route,
      title: `${r.origen} → ${r.destino}`,
      subtitle:
        [
          r.tarifa != null ? `Bs. ${r.tarifa}` : null,
          horario ? `Horario: ${horario}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || undefined,
      badge: {
        label: activa ? "Activa" : "Inactiva",
        variant: activa ? "success" : "muted",
      },
      fields: [
        { label: "Bs", value: r.tarifa ?? null, accent: true },
        { label: "Inicio", value: r.fecha_inicio ?? null },
        { label: "Fin", value: r.fecha_fin ?? null },
        { label: "Salida", value: r.hora_inicio ?? null },
        { label: "Llegada", value: r.hora_fin ?? null },
        { label: "Viajes", value: r.viajes_count ?? null },
        { label: "Estado", value: r.estado ?? null },
      ],
      disabled: !activa,
    };
  });
}

/*
|--------------------------------------------------------------------------
| OPCIONES DE RELACIÓN VEHÍCULO-CHOFER-RUTA
|--------------------------------------------------------------------------
*/

export function opcionesVCR(
  relaciones: VehiculoChoferRuta[],
  asignaciones: Asignacion[],
  rutas: Ruta[],
): RichSelectOption<number>[] {
  return relaciones.map((rel) => {
    const asignacion =
      asignaciones.find((a) => a.id === rel.id_asignacion_vehiculo_chofer) ??
      rel.asignacion;
    const ruta = rutas.find((r) => r.id === rel.id_ruta) ?? rel.ruta;

    const vehiculo = asignacion?.vehiculo;
    const chofer = (asignacion?.chofer ?? null) as ChoferVisual | null;

    const activo =
      esEstadoActivo(asignacion?.estado) &&
      esEstadoActivo(ruta?.estado);

    return {
      value: rel.id,
      icon: ArrowRightLeft,
      title: `${vehiculo?.placa ?? "?"} · ${nombreChofer(chofer)}`,
      subtitle: `${ruta?.origen ?? "?"} → ${ruta?.destino ?? "?"}`,
      badge: {
        label: activo ? "Disponible" : "Inactivo",
        variant: activo ? "success" : "muted",
      },
      fields: [
        { label: "Bs", value: ruta?.tarifa ?? null, accent: true },
        { label: "Salida", value: ruta?.hora_inicio ?? null },
        { label: "Cap.", value: vehiculo?.capacidad ?? null, accent: true },
        { label: "Marca", value: vehiculo?.marca ?? null },
        { label: "Modelo", value: vehiculo?.modelo ?? null },
        { label: "Tipo", value: vehiculo?.tipo ?? null },
        { label: "Color", value: vehiculo?.color ?? null },
        { label: "CI", value: chofer?.ci ?? null },
        { label: "Sind.", value: chofer?.carnet_sindical ?? null },
        { label: "Tel", value: chofer?.telefono ?? null },
      ],
      disabled: !activo,
    };
  });
}