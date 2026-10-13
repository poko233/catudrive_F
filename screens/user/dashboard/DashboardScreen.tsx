// screens/user/dashboard/DashboardScreen.tsx
// Dashboard financiero simplificado: cuatro tarjetas y acceso al módulo Egresos.

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Banknote,
  CircleDollarSign,
  Layers,
  LayoutDashboard,
  Package,
  RefreshCw,
  TrendingDown,
  WalletCards,
} from "lucide-react-native";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/store/authStore";
import { useTheme } from "@/theme/useTheme";
import { dashboardService } from "./services/dashboard.service";
import type { DashboardChoferesResponse } from "./types/dashboard.types";

function moneda(valor: number | string | null | undefined): string {
  const numero = Number(valor ?? 0);
  const partes = (Number.isFinite(numero) ? numero : 0).toFixed(2).split(".");
  return `Bs ${partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${partes[1]}`;
}

type TarjetaFinancieraProps = {
  titulo: string;
  valor: number;
  detalle: string;
  icono: React.ReactNode;
  color: string;
  ancho: string;
};

function TarjetaFinanciera({
  titulo,
  valor,
  detalle,
  icono,
  color,
  ancho,
}: TarjetaFinancieraProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={[
        styles.tarjeta,
        {
          width: ancho as any,
          backgroundColor: c.card,
          borderColor: c.border,
        },
      ]}
    >
      <View style={styles.tarjetaCabecera}>
        <View style={[styles.tarjetaIcono, { backgroundColor: c.backgroundSecondary }]}>
          {icono}
        </View>
        <ThemedText style={[styles.tarjetaTitulo, { color: c.textSecondary }]}>
          {titulo}
        </ThemedText>
      </View>
      <ThemedText
        adjustsFontSizeToFit
        numberOfLines={1}
        style={[styles.tarjetaMonto, { color }]}
      >
        {moneda(valor)}
      </ThemedText>
      <ThemedText style={[styles.tarjetaDetalle, { color: c.textMuted }]}>
        {detalle}
      </ThemedText>
    </View>
  );
}

/**
 * /dashboard
 * - Administrador: totales de todos los choferes.
 * - Chofer: únicamente cifras asociadas a su cuenta, filtradas por Laravel.
 * - Cuatro tarjetas financieras, sin gráficos, listas ni indicadores adicionales.
 * - La pantalla de Egresos sigue separada en /dashboard/egresos.
 *
 * Se usa el período "todos" para que no exista un filtro de fechas oculto.
 */
export default function DashboardScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const router = useRouter();

  const [datos, setDatos] = useState<DashboardChoferesResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const cargar = useCallback(async (refresco = false) => {
    const actual = ++requestId.current;
    if (refresco) setRefrescando(true);
    else setCargando(true);

    try {
      // El backend limita los datos según el rol autenticado.
      const respuesta = await dashboardService.choferes("todos");
      if (actual !== requestId.current) return;
      setDatos(respuesta);
      setError(null);
    } catch (e) {
      if (actual !== requestId.current) return;
      setError(e instanceof Error ? e.message : "No se pudo cargar el Dashboard.");
    } finally {
      if (actual === requestId.current) {
        setCargando(false);
        setRefrescando(false);
      }
    }
  }, []);

  useEffect(() => {
    setDatos(null);
    setError(null);
    void cargar();
    return () => {
      requestId.current += 1;
    };
  }, [cargar, user?.id]);

  const indicadores = datos?.resumen.indicadores;
  const anchoTarjeta = width >= 1200 ? "23.5%" : width >= 700 ? "48.5%" : "100%";
  const saldo = indicadores?.saldo_referencial ?? 0;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={styles.contenido}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={() => void cargar(true)}
          colors={[c.primary]}
          tintColor={c.primary}
        />
      }
    >
      <View style={styles.encabezado}>
        <View style={[styles.headerIcono, { backgroundColor: c.backgroundSecondary }]}>
          <LayoutDashboard size={25} color={c.primary} />
        </View>
        <View style={styles.flex}>
          <ThemedText style={styles.titulo}>Inicio</ThemedText>
          <ThemedText style={[styles.subtitulo, { color: c.textSecondary }]}>
            {datos?.rol === "chofer" ? "Mi resumen financiero" : "Resumen financiero general"}
            {" · Histórico"}
          </ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Actualizar Dashboard"
          accessibilityState={{ disabled: refrescando }}
          disabled={refrescando}
          onPress={() => void cargar(true)}
          style={[styles.actualizar, { backgroundColor: c.card, borderColor: c.border }]}
        >
          {refrescando ? (
            <ActivityIndicator size="small" color={c.primary} />
          ) : (
            <RefreshCw size={20} color={c.text} />
          )}
        </Pressable>
      </View>

      {cargando && !datos ? (
        <View style={styles.cargando}>
          <ActivityIndicator size="large" color={c.primary} />
          <ThemedText style={{ color: c.textSecondary }}>Cargando resumen financiero...</ThemedText>
        </View>
      ) : error && !datos ? (
        <Card style={styles.mensaje}>
          <ThemedText style={[styles.mensajeTitulo, { color: c.destructive }]}>
            No se pudo cargar el Dashboard
          </ThemedText>
          <ThemedText style={[styles.mensajeSub, { color: c.textSecondary }]}>
            {error}
          </ThemedText>
          <Button title="Reintentar" onPress={() => void cargar()} />
        </Card>
      ) : indicadores ? (
        <>
          {error ? (
            <ThemedText style={[styles.error, { color: c.destructive }]}>
              No se pudo actualizar: {error}
            </ThemedText>
          ) : null}

          <View style={styles.tarjetasGrid}>
            <TarjetaFinanciera
              titulo="Ingreso por pasajes"
              valor={indicadores.ingresos_pasajes}
              detalle="Ventas de pasajes pagadas"
              icono={<Banknote size={21} color={c.success} />}
              color={c.success}
              ancho={anchoTarjeta}
            />
            <TarjetaFinanciera
              titulo="Ingreso por encomiendas"
              valor={indicadores.ingresos_encomiendas}
              detalle="Encomiendas pagadas y no anuladas"
              icono={<Package size={21} color={c.primary} />}
              color={c.primary}
              ancho={anchoTarjeta}
            />
            <TarjetaFinanciera
              titulo="Saldo referencial"
              valor={saldo}
              detalle="Pasajes + encomiendas − egresos"
              icono={<CircleDollarSign size={21} color={saldo < 0 ? c.destructive : c.primary} />}
              color={saldo < 0 ? c.destructive : c.text}
              ancho={anchoTarjeta}
            />
            <TarjetaFinanciera
              titulo="Egresos de choferes"
              valor={indicadores.egresos_validos}
              detalle="Egresos válidos registrados"
              icono={<TrendingDown size={21} color={c.destructive} />}
              color={c.destructive}
              ancho={anchoTarjeta}
            />
          </View>
        </>
      ) : null}

      <View style={[styles.modulos, { borderTopColor: c.border }]}>
        <View style={styles.seccionTitulo}>
          <Layers size={21} color={c.primary} />
          <ThemedText style={styles.seccionTexto}>Módulos</ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir módulo de Egresos"
          onPress={() => router.push("/dashboard/egresos" as any)}
          style={[styles.moduloBoton, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <View style={[styles.moduloIcono, { backgroundColor: c.backgroundSecondary }]}>
            <WalletCards size={25} color={c.primary} />
          </View>
          <View style={styles.flex}>
            <ThemedText style={styles.moduloTitulo}>Egresos</ThemedText>
            <ThemedText style={[styles.moduloDescripcion, { color: c.textSecondary }]}>
              Registrar, consultar, anular e imprimir egresos
            </ThemedText>
          </View>
          <ArrowRight size={22} color={c.primary} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contenido: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 45,
    gap: 20,
    maxWidth: 1300,
    width: "100%",
    alignSelf: "center",
  },
  flex: { flex: 1, minWidth: 0 },
  encabezado: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcono: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: { fontSize: 25, fontWeight: "900" },
  subtitulo: { fontSize: 12, marginTop: 2 },
  actualizar: {
    width: 43,
    height: 43,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cargando: { minHeight: 170, alignItems: "center", justifyContent: "center", gap: 12 },
  mensaje: { gap: 12, alignItems: "center", paddingVertical: 22 },
  mensajeTitulo: { fontSize: 15, fontWeight: "800", textAlign: "center" },
  mensajeSub: { fontSize: 12, textAlign: "center" },
  error: { fontSize: 12 },
  tarjetasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  tarjeta: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 142,
    justifyContent: "space-between",
    gap: 12,
  },
  tarjetaCabecera: { flexDirection: "row", alignItems: "center", gap: 10 },
  tarjetaIcono: {
    width: 39,
    height: 39,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tarjetaTitulo: { fontSize: 13, fontWeight: "800", flexShrink: 1 },
  tarjetaMonto: { fontSize: 27, fontWeight: "900", fontVariant: ["tabular-nums"] },
  tarjetaDetalle: { fontSize: 11, lineHeight: 16 },
  modulos: { borderTopWidth: 1, paddingTop: 20, gap: 14 },
  seccionTitulo: { flexDirection: "row", alignItems: "center", gap: 9 },
  seccionTexto: { fontSize: 18, fontWeight: "900" },
  moduloBoton: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 82,
  },
  moduloIcono: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  moduloTitulo: { fontSize: 16, fontWeight: "900" },
  moduloDescripcion: { fontSize: 12, marginTop: 3, lineHeight: 17 },
});
