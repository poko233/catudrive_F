// screens/admin/arqueo/components/ChoferResumen.tsx

import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Banknote,
  Bus,
  Clock,
  HandCoins,
  RefreshCw,
  Ticket,
  Wallet,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { useTheme } from "@/theme/useTheme";
import { useAuth } from "@/store/authStore";
import { useArqueoStore } from "../store/arqueoStore";
import { arqueoService } from "../services/arqueoService";
import { num, type Arqueo } from "../types/arqueo.types";

/*
|--------------------------------------------------------------------------
| RESUMEN RÁPIDO PARA CHOFER (solo rol Chofer, mobile y desktop)
|--------------------------------------------------------------------------
|
| Cards arriba de todo con lo que le interesa al chofer de
| un vistazo: estado de caja, saldo, viajes activos,
| vendidos, pendientes, mi ingreso y lo que la oficina
| le debe (informativo, no suma al arqueo).
|
*/

function MiniCard({
  icon,
  label,
  value,
  sub,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  onPress?: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole={onPress ? "button" : undefined}
      style={[styles.mini, { opacity: pressed ? 0.78 : 1 }]}
    >
      <Card style={styles.miniCard}>
        {icon}
        <View style={styles.miniText}>
          <ThemedText style={[styles.miniValue, { color: c.text }]} numberOfLines={1}>
            {value}
          </ThemedText>
          <ThemedText style={[styles.miniLabel, { color: c.textSecondary }]} numberOfLines={2}>
            {label}
          </ThemedText>
          {sub ? (
            <ThemedText style={[styles.miniSub, { color: c.textMuted }]} numberOfLines={1}>
              {sub}
            </ThemedText>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

export function ChoferResumen({ onVerDetalle }: { onVerDetalle?: (id: number) => void }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { roles } = useAuth();

  const esChofer = roles.some((r) => r.toLowerCase().includes("chofer"));

  const abierto = useArqueoStore((s) => s.abierto);

  const [detalle, setDetalle] = useState<Arqueo | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(
    async (force = false) => {
      if (!abierto) {
        setDetalle(null);
        return;
      }
      if (force) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await arqueoService.getById(abierto.id, { force });
        setDetalle(data);
      } catch (e) {
        Toast.show({
          type: "error",
          text1: "No se pudo cargar tu caja",
          text2: e instanceof Error ? e.message : "Intenta nuevamente.",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [abierto],
  );

  useEffect(() => {
    if (esChofer) void cargar();
  }, [esChofer, cargar]);

  if (!esChofer) return null;

  const totales = detalle?.viajes_totales;
  const viajesActivos = totales?.viajes ?? detalle?.viajes?.length ?? 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Mi caja hoy</ThemedText>
        <View style={styles.headerRight}>
          {abierto ? (
            <Badge label={`Arqueo #${abierto.id}`} variant={abierto.estado === "Iniciado" ? "success" : "muted"} />
          ) : (
            <Badge label="Sin arqueo" variant="destructive" />
          )}
          <IconButton
            icon={RefreshCw}
            size="sm"
            variant="secondary"
            accessibilityLabel="Actualizar mi caja"
            loading={refreshing}
            disabled={refreshing || loading}
            onPress={() => void cargar(true)}
          />
        </View>
      </View>

      <View style={styles.grid}>
        <MiniCard
          icon={<Wallet size={20} color={c.primary} />}
          label="Saldo anterior"
          value={abierto ? `Bs. ${num(abierto.saldo_anterior).toFixed(2)}` : "—"}
          sub={abierto ? (abierto.estado === "Iniciado" ? "Caja abierta" : "Caja cerrada") : "Abre tu caja"}
          onPress={abierto && onVerDetalle ? () => onVerDetalle(abierto.id) : undefined}
        />
        <MiniCard
          icon={<Bus size={20} color={c.info} />}
          label="Viajes activos"
          value={loading && !detalle ? "…" : String(viajesActivos)}
          onPress={abierto && onVerDetalle ? () => onVerDetalle(abierto.id) : undefined}
        />
        <MiniCard
          icon={<Ticket size={20} color={c.success} />}
          label="Asientos vendidos por mí"
          value={loading && !detalle ? "…" : String(totales?.vendidos_por_mi ?? 0)}
          onPress={abierto && onVerDetalle ? () => onVerDetalle(abierto.id) : undefined}
        />
        <MiniCard
          icon={<Clock size={20} color={c.warning} />}
          label="Asientos pendientes"
          value={loading && !detalle ? "…" : String(totales?.pendientes ?? 0)}
          onPress={abierto && onVerDetalle ? () => onVerDetalle(abierto.id) : undefined}
        />
        <MiniCard
          icon={<Banknote size={20} color={c.success} />}
          label="Mi ingreso"
          value={loading && !detalle ? "…" : `Bs. ${num(totales?.ingreso_por_mi).toFixed(2)}`}
          onPress={abierto && onVerDetalle ? () => onVerDetalle(abierto.id) : undefined}
        />
        <MiniCard
          icon={<HandCoins size={20} color={c.warning} />}
          label="Oficina me debe"
          value={loading && !detalle ? "…" : `Bs. ${num(totales?.ingreso_por_otros).toFixed(2)}`}
          sub="Informativo"
          onPress={abierto && onVerDetalle ? () => onVerDetalle(abierto.id) : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  mini: { flex: 1, minWidth: 150 },
  miniCard: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: 12 },
  miniText: { flex: 1, gap: 1, minWidth: 0 },
  miniValue: { fontSize: 17, fontWeight: "900" },
  miniLabel: { fontSize: 12 },
  miniSub: { fontSize: 11 },
});
