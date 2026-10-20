// screens/user/dashboard/DashboardScreen.tsx
// Dashboard financiero simplificado: cuatro tarjetas en cuadrícula 2x2.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Banknote,
  CircleDollarSign,
  Layers,
  LayoutDashboard,
  Package,
  RefreshCw,
  TrendingDown,
  Calculator,
} from "lucide-react-native";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
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
  ancho: number | "48%";
  compacto: boolean;
};

function TarjetaFinanciera({
  titulo,
  valor,
  detalle,
  icono,
  color,
  ancho,
  compacto,
}: TarjetaFinancieraProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={[
        styles.tarjeta,
        compacto && styles.tarjetaCompacta,
        {
          width: ancho,
          backgroundColor: c.card,
          borderColor: c.border,
        },
      ]}
    >
      <View style={[styles.tarjetaCabecera, compacto && styles.tarjetaCabeceraCompacta]}>
        <View style={[styles.tarjetaIcono, { backgroundColor: c.backgroundSecondary }]}>
          {icono}
        </View>
        <ThemedText
          numberOfLines={2}
          style={[styles.tarjetaTitulo, compacto && styles.tarjetaTituloCompacto, { color: c.textSecondary }]}
        >
          {titulo}
        </ThemedText>
      </View>
      <ThemedText
        adjustsFontSizeToFit
        minimumFontScale={0.65}
        numberOfLines={1}
        style={[styles.tarjetaMonto, compacto && styles.tarjetaMontoCompacto, { color }]}
      >
        {moneda(valor)}
      </ThemedText>
      <ThemedText
        numberOfLines={2}
        style={[styles.tarjetaDetalle, { color: c.textMuted }]}
      >
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
 * - Módulos: acceso al Arqueo original, solo con permiso /arqueo.
 *
 * Se usa el período "todos" para que no exista un filtro de fechas oculto.
 */
export default function DashboardScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { user, allowedRoutes, isAdmin } = useAuth();
  const router = useRouter();
  // La pantalla /arqueo conserva sus permisos de acceso originales.
  const puedeAccederArqueo = isAdmin || allowedRoutes.has("/arqueo");

  const [datos, setDatos] = useState<DashboardChoferesResponse | null>(null);
  const [anchoGrid, setAnchoGrid] = useState(0);
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
  // Dos tarjetas por fila siempre, incluso en celular.
  // Se mide el ancho real disponible (no el de la ventana), ya que en
  // escritorio puede existir una barra lateral que reduce el espacio.
  const anchoTarjeta: number | "48%" =
    anchoGrid > 0 ? Math.max(0, (anchoGrid - 12) / 2) : "48%";
  const compacto = anchoGrid > 0 && anchoGrid < 620;
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

          <View
            style={styles.tarjetasGrid}
            onLayout={(event) => {
              const nuevoAncho = event.nativeEvent.layout.width;
              setAnchoGrid((actual) =>
                Math.abs(actual - nuevoAncho) >= 1 ? nuevoAncho : actual,
              );
            }}
          >
            <TarjetaFinanciera
              titulo="Ingreso por pasajes"
              valor={indicadores.ingresos_pasajes}
              detalle="Ventas de pasajes pagadas"
              icono={<Banknote size={21} color={c.success} />}
              color={c.success}
              ancho={anchoTarjeta}
              compacto={compacto}
            />
            <TarjetaFinanciera
              titulo="Ingreso por encomiendas"
              valor={indicadores.ingresos_encomiendas}
              detalle="Encomiendas pagadas y no anuladas"
              icono={<Package size={21} color={c.primary} />}
              color={c.primary}
              ancho={anchoTarjeta}
              compacto={compacto}
            />
            <TarjetaFinanciera
              titulo="Saldo referencial"
              valor={saldo}
              detalle="Pasajes + encomiendas − egresos"
              icono={<CircleDollarSign size={21} color={saldo < 0 ? c.destructive : c.primary} />}
              color={saldo < 0 ? c.destructive : c.text}
              ancho={anchoTarjeta}
              compacto={compacto}
            />
            <TarjetaFinanciera
              titulo="Egresos de choferes"
              valor={indicadores.egresos_validos}
              detalle="Egresos válidos registrados"
              icono={<TrendingDown size={21} color={c.destructive} />}
              color={c.destructive}
              ancho={anchoTarjeta}
              compacto={compacto}
            />
          </View>
        </>
      ) : null}

      <View style={[styles.modulos, { borderTopColor: c.border }]}>
        <View style={styles.seccionTitulo}>
          <Layers size={21} color={c.primary} />
          <ThemedText style={styles.seccionTexto}>Módulos</ThemedText>
        </View>
        {puedeAccederArqueo ? (
          <IconButton
            icon={Calculator}
            variant="primary"
            size="lg"
            iconSize={Platform.OS === "web" ? 36 : 27}
            style={Platform.OS === "web" ? styles.arqueoIconoWeb : undefined}
            accessibilityLabel="Abrir Arqueo de caja (calculadora de cierre)"
            onPress={() => router.push("/arqueo")}
          />
        ) : (
          <ThemedText style={[styles.sinModulos, { color: c.textSecondary }]}>
            No tienes módulos adicionales habilitados.
          </ThemedText>
        )}
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
  tarjetaCompacta: { padding: 12, minHeight: 158, gap: 8 },
  tarjetaCabecera: { flexDirection: "row", alignItems: "center", gap: 10 },
  tarjetaCabeceraCompacta: { flexDirection: "column", alignItems: "flex-start", gap: 7 },
  tarjetaIcono: {
    width: 39,
    height: 39,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tarjetaTitulo: { fontSize: 13, fontWeight: "800", flexShrink: 1 },
  tarjetaTituloCompacto: { fontSize: 12, lineHeight: 16, flexShrink: 0 },
  tarjetaMonto: { fontSize: 27, fontWeight: "900", fontVariant: ["tabular-nums"] },
  tarjetaMontoCompacto: { fontSize: 21 },
  tarjetaDetalle: { fontSize: 11, lineHeight: 16 },
  modulos: { borderTopWidth: 1, paddingTop: 20, gap: 14 },
  seccionTitulo: { flexDirection: "row", alignItems: "center", gap: 9 },
  seccionTexto: { fontSize: 18, fontWeight: "900" },
  // Solo web: botón de Arqueo más visible. Android mantiene 48 x 48.
  arqueoIconoWeb: { width: 76, height: 76, borderRadius: 17 },
  sinModulos: { fontSize: 12, lineHeight: 18 },

});
