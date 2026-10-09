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

/*
|--------------------------------------------------------------------------
| LISTA MÓVIL DE VIAJES (espejo de EncomiendasScreen)
|--------------------------------------------------------------------------
|
| Barra de fecha con chips + calendario, y cards con
| dropdown: fila compacta (ruta, hora, badge) y al
| expandir todo el detalle + botones de acción.
| La lógica (filtros, selección, estados) vive en la
| pantalla; aquí solo presentación móvil.
|
*/

/*
|--------------------------------------------------------------------------
| FECHA
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
| CARD CON DROPDOWN
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

      {expanded ? (
        <View style={[styles.mobileExpanded, { borderTopColor: c.border }]}>
          <View style={styles.ticketRows}>
            <View style={styles.ticketRow}>
              <ThemedText style={styles.ticketLabel}>Hora salida:</ThemedText>
              <ThemedText style={styles.ticketValue}>{horaCorta(viaje.hora_salida)}</ThemedText>
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

          <View style={[styles.mobileActionsRow, { borderTopColor: c.border }]}>
            <View style={styles.mobileActions}>
              <IconButton
                icon={ArrowRightCircle}
                variant="primary"
                size="md"
                disabled={viaje.estado !== "Vendiendo"}
                onPress={onSeleccionar}
                accessibilityLabel={`Seleccionar viaje ${viaje.origen} a ${viaje.destino}`}
              />

              {puedeCambiarEstado ? (
                <Visibility action="Editar" selector=".pasajes-estado">
                  <IconButton
                    icon={Pencil}
                    variant="secondary"
                    size="md"
                    onPress={onCambiarEstado}
                    accessibilityLabel={`Cambiar estado del viaje ${viaje.origen} a ${viaje.destino}`}
                  />
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
  dateQuickRow: { flexDirection: "row", gap: 6, alignItems: "center", flexWrap: "nowrap" },
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
  mobileExpanded: { borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  ticketRows: { gap: 5 },
  ticketRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  ticketLabel: { fontSize: 12, fontWeight: "800", flexShrink: 0 },
  ticketValue: { fontSize: 12, textAlign: "right", flex: 1 },
  mobileActionsRow: { borderTopWidth: 1, paddingTop: 9, alignItems: "center" },
  mobileActions: { flexDirection: "row", gap: 8, justifyContent: "center", flexWrap: "wrap" },
});
