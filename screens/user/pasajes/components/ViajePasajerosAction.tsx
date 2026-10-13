// screens/user/pasajes/components/ViajePasajerosAction.tsx
// Modal de pasajeros con agrupación visual por apellido paterno.
// No altera ventas, asientos ni datos del backend.

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/theme/useTheme";
import {
  Armchair,
  ChevronDown,
  ChevronUp,
  IdCard,
  UsersRound,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getPasajerosViaje } from "../services/viaje-pasajeros.service";
import type { Viaje } from "../types/pasajes.types";
import type {
  ViajePasajeroItem,
  ViajePasajerosResponse,
} from "../types/viaje-pasajeros.types";

type Props = { viaje: Viaje };

type GrupoPasajeros = {
  key: string;
  apellido: string | null;
  pasajeros: ViajePasajeroItem[];
};

/** Mantiene el mismo criterio de numeración que el modal original. */
function asientoLabel(item: ViajePasajeroItem): string {
  if (item.asiento.numero_asiento !== null && item.asiento.numero_asiento !== undefined) {
    return String(item.asiento.numero_asiento);
  }
  if (item.asiento.fila !== null && item.asiento.columna !== null) {
    return `${item.asiento.fila}-${item.asiento.columna}`;
  }
  return "—";
}

function mostrarHora(value: string | null | undefined): string {
  if (!value) return "—";
  const hora = value.includes(" ") ? value.split(" ")[1] : value;
  return hora ? hora.substring(0, 5) : "—";
}

/**
 * Agrupar únicamente por apellido paterno disponible en el backend.
 * No usamos el nombre completo, porque contiene los nombres y podría
 * asociar erróneamente a pasajeros que no comparten apellido.
 *
 * La comparación ignora tildes, mayúsculas y espacios repetidos:
 * LOPEZ, López y lopez se consideran el mismo apellido.
 */
function claveApellido(value: string | null | undefined): string | null {
  const limpio = (value ?? "").trim().replace(/\s+/g, " ");
  if (!limpio) return null;
  return limpio
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function nombreApellido(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .replace(/(^|[\s-])([^\s-])/g, (_match, separador: string, letra: string) =>
      separador + letra.toLocaleUpperCase("es"),
    );
}

/**
 * Un apellido solo se convierte en grupo cuando aparece 2 o más veces.
 * Los demás pasajeros mantienen su tarjeta individual y su asiento.
 * El orden es el de la primera aparición en la respuesta del servidor.
 */
function agruparPasajeros(pasajeros: ViajePasajeroItem[]): GrupoPasajeros[] {
  const conteos = new Map<string, number>();
  for (const item of pasajeros) {
    const clave = claveApellido(item.pasajero.apellido_paterno);
    if (clave) conteos.set(clave, (conteos.get(clave) ?? 0) + 1);
  }

  const grupos: GrupoPasajeros[] = [];
  const indices = new Map<string, number>();

  for (const item of pasajeros) {
    const clave = claveApellido(item.pasajero.apellido_paterno);
    if (clave && (conteos.get(clave) ?? 0) > 1) {
      const key = `apellido:${clave}`;
      const existente = indices.get(key);
      if (existente !== undefined) {
        grupos[existente].pasajeros.push(item);
      } else {
        indices.set(key, grupos.length);
        grupos.push({
          key,
          apellido: nombreApellido(item.pasajero.apellido_paterno!.trim()),
          pasajeros: [item],
        });
      }
    } else {
      grupos.push({
        key: `detalle:${item.id_detalle_venta}`,
        apellido: null,
        pasajeros: [item],
      });
    }
  }

  return grupos;
}

/**
 * Fila de un pasajero: conserva asiento, piso, nombre y CI.
 * Se usa tanto en las tarjetas individuales como dentro del dropdown.
 */
function FilaPasajero({
  item,
  numero,
  anidado = false,
}: {
  item: ViajePasajeroItem;
  numero: number;
  anidado?: boolean;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const contenido = (
    <View style={[styles.passengerCard, anidado && styles.passengerCardAnidada]}>
      <View
        style={[
          styles.seat,
          { backgroundColor: c.primarySubtle, borderColor: c.primary },
        ]}
      >
        <Armchair size={18} color={c.primary} />
        <Text style={[styles.seatNumber, { color: c.primary }]}>
          {asientoLabel(item)}
        </Text>
      </View>

      <View style={styles.passengerBody}>
        <View style={styles.nameRow}>
          <Text style={[styles.passengerName, { color: c.text }]}>
            {numero}. {item.pasajero.nombre_completo || "Pasajero sin nombre"}
          </Text>
          {item.asiento.piso ? (
            <Badge label={item.asiento.piso} variant="muted" />
          ) : null}
        </View>

        <View style={styles.ciRow}>
          <IdCard size={15} color={c.textSecondary} />
          <Text style={[styles.ciText, { color: c.textSecondary }]}>
            CI: {item.pasajero.ci || "—"}
          </Text>
        </View>
      </View>
    </View>
  );

  if (anidado) return contenido;
  return <Card padding={0}>{contenido}</Card>;
}

/**
 * Se mantiene el IconButton original y su carga diferida.
 * El dropdown solo cambia cómo se presentan los pasajeros ya consultados.
 */
export function ViajePasajerosAction({ viaje }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ViajePasajerosResponse | null>(null);
  const [gruposAbiertos, setGruposAbiertos] = useState<Set<string>>(new Set());

  const abrir = useCallback(async () => {
    setVisible(true);
    setLoading(true);
    setError("");
    setData(null);
    setGruposAbiertos(new Set());

    try {
      const response = await getPasajerosViaje(viaje.id);
      setData(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los pasajeros.",
      );
    } finally {
      setLoading(false);
    }
  }, [viaje.id]);

  const cerrar = () => {
    setVisible(false);
    setError("");
    setData(null);
    setGruposAbiertos(new Set());
  };

  const grupos = useMemo(
    () => agruparPasajeros(data?.pasajeros ?? []),
    [data?.pasajeros],
  );

  // Mantiene el número original de cada pasajero (según la lista del backend).
  const numeros = useMemo(() => {
    const resultado = new Map<number, number>();
    (data?.pasajeros ?? []).forEach((item, index) => {
      resultado.set(item.id_detalle_venta, index + 1);
    });
    return resultado;
  }, [data?.pasajeros]);

  const alternarGrupo = (key: string) => {
    setGruposAbiertos((actuales) => {
      const siguientes = new Set(actuales);
      if (siguientes.has(key)) siguientes.delete(key);
      else siguientes.add(key);
      return siguientes;
    });
  };

  return (
    <>
      <IconButton
        icon={UsersRound}
        variant="secondary"
        size="sm"
        onPress={() => void abrir()}
        accessibilityLabel={`Ver pasajeros del viaje ${viaje.origen} → ${viaje.destino}`}
      />

      <Modal
        visible={visible}
        title={`Pasajeros · ${viaje.origen} → ${viaje.destino}`}
        onClose={cerrar}
        width="95%"
        maxWidth={820}
        maxHeight={700}
        footer={
          <View style={styles.footer}>
            <Button title="Cerrar" variant="secondary" onPress={cerrar} />
          </View>
        }
      >
        <View style={styles.content}>
          {/* Resumen original: la cantidad sigue siendo de pasajeros, no de grupos. */}
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Hora</Text>
              <Text style={[styles.summaryValue, { color: c.text }]}>
                {mostrarHora(data?.viaje.hora_salida ?? viaje.hora_salida)}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Vehículo</Text>
              <Text style={[styles.summaryValue, { color: c.text }]}>
                {data?.viaje.vehiculo ?? viaje.vehiculo ?? "—"}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Chofer</Text>
              <Text numberOfLines={1} style={[styles.summaryValue, { color: c.text }]}>
                {data?.viaje.chofer ?? viaje.chofer ?? "—"}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Pasajeros</Text>
              <View style={styles.badgeContainer}>
                <Badge label={String(data?.total ?? 0)} variant="info" />
              </View>
            </View>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={c.primary} />
              <Text style={{ color: c.textSecondary }}>Cargando pasajeros...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <Text style={[styles.errorText, { color: c.destructive }]}>{error}</Text>
              <Button title="Reintentar" variant="secondary" onPress={() => void abrir()} />
            </View>
          ) : !data || data.pasajeros.length === 0 ? (
            <View style={styles.centerState}>
              <UsersRound size={34} color={c.textMuted} />
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                Este viaje todavía no tiene pasajeros con venta confirmada.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator
              nestedScrollEnabled
            >
              {grupos.map((grupo) => {
                // Un apellido que solo aparece una vez mantiene la tarjeta original.
                if (grupo.apellido === null) {
                  const item = grupo.pasajeros[0];
                  return (
                    <FilaPasajero
                      key={grupo.key}
                      item={item}
                      numero={numeros.get(item.id_detalle_venta) ?? 1}
                    />
                  );
                }

                const abierto = gruposAbiertos.has(grupo.key);
                const asientos = grupo.pasajeros.map(asientoLabel);

                return (
                  <Card key={grupo.key} padding={0} style={styles.familyCard}>
                    <Pressable
                      onPress={() => alternarGrupo(grupo.key)}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: abierto }}
                      accessibilityLabel={`Familia ${grupo.apellido}, ${grupo.pasajeros.length} pasajeros, asientos ${asientos.join(", ")}`}
                      style={({ pressed }) => [
                        styles.familyHeader,
                        { backgroundColor: pressed ? c.primarySubtle : c.card },
                      ]}
                    >
                      <View style={[styles.familyIcon, { backgroundColor: c.primarySubtle, borderColor: c.primary }]}>
                        <UsersRound size={22} color={c.primary} />
                      </View>

                      <View style={styles.familyBody}>
                        <Text style={[styles.familyTitle, { color: c.text }]}>
                          Familia {grupo.apellido}
                        </Text>
                        <Text style={[styles.familySubtitle, { color: c.textSecondary }]}>
                          {grupo.pasajeros.length} pasajeros · Asientos: {asientos.join(", ")}
                        </Text>
                      </View>

                      <View style={styles.familyChevron}>
                        {abierto ? (
                          <ChevronUp size={20} color={c.primary} />
                        ) : (
                          <ChevronDown size={20} color={c.textSecondary} />
                        )}
                      </View>
                    </Pressable>

                    {abierto ? (
                      <View style={[styles.familyDetails, { borderTopColor: c.border }]}>
                        {grupo.pasajeros.map((item, index) => (
                          <View key={item.id_detalle_venta}>
                            {index > 0 ? (
                              <View style={[styles.memberDivider, { backgroundColor: c.border }]} />
                            ) : null}
                            <FilaPasajero
                              item={item}
                              numero={numeros.get(item.id_detalle_venta) ?? index + 1}
                              anidado
                            />
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </Card>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  summary: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryItem: { flex: 1, minWidth: 135, gap: 4 },
  summaryLabel: { fontSize: 11, fontWeight: "700" },
  summaryValue: { fontSize: 13, fontWeight: "900" },
  badgeContainer: { alignSelf: "flex-start" },
  centerState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
  },
  errorText: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  emptyText: {
    maxWidth: 420,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  scroll: { maxHeight: 430 },
  list: { gap: 8, paddingBottom: 4 },
  passengerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  passengerCardAnidada: { paddingHorizontal: 12, paddingVertical: 12 },
  seat: {
    width: 58,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    flexShrink: 0,
  },
  seatNumber: { fontSize: 13, fontWeight: "900" },
  passengerBody: { flex: 1, minWidth: 0, gap: 6 },
  nameRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  passengerName: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "900",
  },
  ciRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  ciText: { fontSize: 12 },
  familyCard: { overflow: "hidden" },
  familyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    minHeight: 84,
  },
  familyIcon: {
    width: 56,
    height: 54,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  familyBody: { flex: 1, minWidth: 0, gap: 6 },
  familyTitle: { fontSize: 15, fontWeight: "900" },
  familySubtitle: { fontSize: 12, lineHeight: 17 },
  familyChevron: { width: 24, alignItems: "center", justifyContent: "center" },
  familyDetails: { borderTopWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  memberDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 12 },
  footer: { flexDirection: "row", justifyContent: "flex-end" },
});
