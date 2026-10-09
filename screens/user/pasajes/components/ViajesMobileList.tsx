// screens/user/pasajes/components/ViajesMobileList.tsx

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  ArrowRightCircle,
  Bus,
  CalendarDays,
  CalendarRange,
  Pencil,
} from "lucide-react-native";

import Visibility from "@/components/Visibility";
import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { useTheme } from "@/theme/useTheme";

import type { Viaje } from "../types/pasajes.types";
import { colorEstadoViaje, estiloFilaViaje } from "../utils/viajeEstadoStyle";
import { ViajePasajerosAction } from "./ViajePasajerosAction";
import { ViajeEncomiendasAction } from "./ViajeEncomiendasAction";

/*
|--------------------------------------------------------------------------
| LISTA MÓVIL DE VIAJES
|--------------------------------------------------------------------------
|
| Conserva la barra de fechas y las tarjetas desplegables.
| Las 4 acciones de la tabla de escritorio también están en móvil:
| 1. Ver pasajeros
| 2. Ver encomiendas
| 3. Seleccionar viaje para vender
| 4. Cambiar estado (cuando corresponda y haya permiso)
|
| Los botones se muestran únicamente al desplegar la tarjeta.
| La lógica de filtros, selección y estados sigue en PasajesScreen.
|
*/

/*
|--------------------------------------------------------------------------
| FECHAS
|--------------------------------------------------------------------------
*/

function hoyBoliviaIso(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/La_Paz",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function isoOffset(days: number): string {
  const base = new Date(`${hoyBoliviaIso()}T12:00:00`);
  base.setDate(base.getDate() + days);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
}

function cortoFecha(v: string): string {
  const [, m, d] = v.split("-");
  return `${Number(d)} ${(["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"])[Number(m) - 1]}`;
}

const QUICK_DATES = [isoOffset(-2), isoOffset(-1), isoOffset(0)];

export function ViajesFechaBar({
  modo,
  fecha,
  desde,
  hasta,
  onSingle,
  onClear,
  onOpenCalendar,
}: {
  /** "" sin filtro, "single" día específico, "range" rango. */
  modo: "" | "single" | "range";
  fecha: string;
  desde: string;
  hasta: string;
  onSingle: (fecha: string) => void;
  onClear: () => void;
  onOpenCalendar: (mode: "single" | "range") => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const hayFiltro = modo !== "";

  const etiqueta = () => {
    if (modo === "single" && fecha) return cortoFecha(fecha);
    if (modo === "range" && (desde || hasta)) {
      return `${desde ? cortoFecha(desde) : "…"} → ${hasta ? cortoFecha(hasta) : "…"}`;
    }
    return "Fecha";
  };

  return (
    <View style={styles.fechaWrap}>
      <View style={styles.dateQuickRow}>
        {QUICK_DATES.map((d) => {
          const activo = modo === "single" && fecha === d;
          return (
            <Pressable
              key={d}
              onPress={() => onSingle(d)}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
              style={[
                styles.quickDate,
                {
                  borderColor: c.border,
                  backgroundColor: activo ? c.primary : c.background,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.quickDateText,
                  activo && { fontWeight: "900" },
                  { color: activo ? c.primaryForeground : c.text },
                ]}
              >
                {cortoFecha(d)}
              </ThemedText>
            </Pressable>
          );
        })}

        <IconButton
          icon={CalendarDays}
          size="sm"
          variant={modo === "single" ? "primary" : "secondary"}
          accessibilityLabel="Filtrar por día específico"
          onPress={() => onOpenCalendar("single")}
        />

        <IconButton
          icon={CalendarRange}
          size="sm"
          variant={modo === "range" ? "primary" : "secondary"}
          accessibilityLabel="Filtrar por rango de fechas"
          onPress={() => onOpenCalendar("range")}
        />

        {hayFiltro ? (
          <Button title="Limpiar" variant="ghost" onPress={onClear} />
        ) : null}
      </View>

      {hayFiltro ? (
        <ThemedText style={[styles.fechaActiva, { color: c.textSecondary }]}>
          {etiqueta()}
        </ThemedText>
      ) : null}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| TARJETA MÓVIL DE VIAJE
|--------------------------------------------------------------------------
*/

function horaCorta(horaSalida: string): string {
  const fecha = new Date(horaSalida);
  if (Number.isNaN(fecha.getTime())) return horaSalida;
  return fecha.toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fechaCorta(horaSalida: string): string {
  const fecha = new Date(horaSalida);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function ViajeMobileCard({
  viaje,
  expanded,
  onToggle,
  onSeleccionar,
  puedeCambiarEstado,
  onCambiarEstado,
}: {
  viaje: Viaje;
  expanded: boolean;
  onToggle: () => void;
  onSeleccionar: () => void;
  puedeCambiarEstado: boolean;
  onCambiarEstado: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Card style={[styles.mobileCard, estiloFilaViaje(viaje.estado, c)]}>
      {/* Encabezado: pulsar para expandir o contraer los detalles. */}
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? "Contraer" : "Ver detalle de"} viaje ${viaje.origen} a ${viaje.destino}`}
      >
        <View style={styles.mobileCompactRow}>
          <View style={[styles.mobileIcon, { backgroundColor: c.backgroundSecondary }]}>
            <Bus size={22} color={colorEstadoViaje(viaje.estado, c)} />
          </View>

          <View style={styles.mobileCompactInfo}>
            <ThemedText style={styles.bold} numberOfLines={1}>
              {`${viaje.origen} → ${viaje.destino}`}
            </ThemedText>
            <ThemedText style={[styles.mobileDate, { color: c.textSecondary }]}>
              {fechaCorta(viaje.hora_salida)} · {horaCorta(viaje.hora_salida)}
            </ThemedText>
          </View>

          <View style={styles.mobileCompactStatus}>
            <Badge
              label={viaje.estado}
              variant={
                viaje.estado === "Vendiendo"
                  ? "success"
                  : viaje.estado === "En curso"
                    ? "info"
                    : viaje.estado === "Cancelado"
                      ? "destructive"
                      : "muted"
              }
            />
          </View>
        </View>
      </Pressable>

      {/* Información adicional; conserva el dropdown original. */}
      {expanded ? (
        <View style={[styles.mobileExpanded, { borderTopColor: c.border }]}>
          <View style={styles.ticketRows}>
            <View style={styles.ticketRow}>
              <ThemedText style={styles.ticketLabel}>Hora salida:</ThemedText>
              <ThemedText style={styles.ticketValue}>
                {horaCorta(viaje.hora_salida)}
              </ThemedText>
            </View>

            <View style={styles.ticketRow}>
              <ThemedText style={styles.ticketLabel}>Vehículo:</ThemedText>
              <ThemedText style={styles.ticketValue} numberOfLines={1}>
                {viaje.vehiculo || "—"}
              </ThemedText>
            </View>

            <View style={styles.ticketRow}>
              <ThemedText style={styles.ticketLabel}>Chofer:</ThemedText>
              <ThemedText style={styles.ticketValue} numberOfLines={1}>
                {viaje.chofer || "—"}
              </ThemedText>
            </View>

            <View style={styles.ticketRow}>
              <ThemedText style={styles.ticketLabel}>Tarifa:</ThemedText>
              <ThemedText style={styles.ticketValue}>Bs. {viaje.tarifa}</ThemedText>
            </View>

            <View style={styles.ticketRow}>
              <ThemedText style={styles.ticketLabel}>Estado:</ThemedText>
              <ThemedText style={styles.ticketValue}>{viaje.estado}</ThemedText>
            </View>
          </View>

          {/* Acciones visibles únicamente al desplegar la tarjeta. */}
          <View style={[styles.mobileActionsRow, { borderTopColor: c.border }]}>
            <View style={styles.mobileActions}>
              <View style={styles.mobileActionItem}>
                <ViajePasajerosAction viaje={viaje} />
                <ThemedText
                  numberOfLines={1}
                  style={[styles.mobileActionLabel, { color: c.textSecondary }]}
                >
                  Pasajeros
                </ThemedText>
              </View>

              <View style={styles.mobileActionItem}>
                <ViajeEncomiendasAction viaje={viaje} />
                <ThemedText
                  numberOfLines={1}
                  style={[styles.mobileActionLabel, { color: c.textSecondary }]}
                >
                  Encomiendas
                </ThemedText>
              </View>

              <View style={styles.mobileActionItem}>
                <IconButton
                  icon={ArrowRightCircle}
                  variant="primary"
                  size="sm"
                  disabled={viaje.estado !== "Vendiendo"}
                  onPress={onSeleccionar}
                  accessibilityLabel={`Seleccionar viaje ${viaje.origen} a ${viaje.destino}`}
                />
                <ThemedText
                  numberOfLines={1}
                  style={[
                    styles.mobileActionLabel,
                    { color: viaje.estado === "Vendiendo" ? c.text : c.textSecondary },
                  ]}
                >
                  Vender
                </ThemedText>
              </View>

              {puedeCambiarEstado ? (
                <Visibility
                  action="Editar"
                  selector=".pasajes-estado"
                  style={styles.mobileActionItem}
                >
                  <IconButton
                    icon={Pencil}
                    variant="secondary"
                    size="sm"
                    onPress={onCambiarEstado}
                    accessibilityLabel={`Cambiar estado del viaje ${viaje.origen} a ${viaje.destino}`}
                  />
                  <ThemedText
                    numberOfLines={1}
                    style={[styles.mobileActionLabel, { color: c.textSecondary }]}
                  >
                    Estado
                  </ThemedText>
                </Visibility>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  fechaWrap: { alignItems: "flex-start" },
  dateQuickRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    flexWrap: "nowrap",
  },
  quickDate: {
    height: 36,
    minWidth: 58,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  quickDateText: { fontSize: 11 },
  fechaActiva: { fontSize: 12, fontWeight: "700" },
  mobileCard: { padding: 0, overflow: "hidden" },
  mobileCompactRow: {
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mobileIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  mobileCompactInfo: { flex: 1, minWidth: 0, gap: 2 },
  bold: { fontWeight: "800" },
  mobileDate: { fontSize: 12 },
  mobileCompactStatus: { alignItems: "flex-end", flexShrink: 0 },
  mobileExpanded: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  ticketRows: { gap: 5 },
  ticketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  ticketLabel: { fontSize: 12, fontWeight: "800", flexShrink: 0 },
  ticketValue: { fontSize: 12, textAlign: "right", flex: 1 },
  mobileActionsRow: {
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 9,
  },
  mobileActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 4,
  },
  mobileActionItem: {
    flexBasis: 58,
    flexGrow: 1,
    minWidth: 58,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  mobileActionLabel: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
});
