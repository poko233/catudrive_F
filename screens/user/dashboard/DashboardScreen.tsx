import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
  BusFront,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Layers,
  LayoutDashboard,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react-native";

import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SearchBar } from "@/components/ui/SearchBar";
import { useAuth } from "@/store/authStore";
import { useTheme } from "@/theme/useTheme";
import { dashboardService } from "./services/dashboard.service";
import type {
  DashboardChofer,
  DashboardChoferesResponse,
  DashboardIndicadores,
  DashboardPeriodo,
  DashboardVehiculo,
} from "./types/dashboard.types";

type EstadoFiltro = "TODOS" | "ACTIVO" | "INACTIVO";

const PERIODOS: Array<{ value: DashboardPeriodo; label: string }> = [
  { value: "hoy", label: "Hoy" },
  { value: "7dias", label: "7 días" },
  { value: "mes", label: "Este mes" },
  { value: "todos", label: "Histórico" },
];

function entero(valor: unknown): string {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
}

function moneda(valor: unknown): string {
  const n = Number(valor ?? 0);
  const partes = (Number.isFinite(n) ? n : 0).toFixed(2).split(".");
  return `Bs ${partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${partes[1]}`;
}

function campo(valor: unknown): string {
  return String(valor ?? "").trim() || "No registrado";
}

function datoBuscable(chofer: DashboardChofer): string {
  return [
    chofer.nombre_completo,
    chofer.carnet_identidad,
    chofer.carnet_sindical,
    chofer.numero_licencia,
    chofer.telefono,
    ...chofer.vehiculos.map((v) => v.placa),
  ].join(" ").toLocaleLowerCase();
}

function InfoDato({ etiqueta, valor }: { etiqueta: string; valor: unknown }) {
  const { theme } = useTheme();
  return (
    <View style={styles.dato}>
      <ThemedText style={[styles.datoEtiqueta, { color: theme.colors.textSecondary }]}>{etiqueta}</ThemedText>
      <ThemedText style={styles.datoValor}>{campo(valor)}</ThemedText>
    </View>
  );
}

function IndicadorGrande({
  titulo, valor, detalle, icono, color, ancho,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  icono: React.ReactNode;
  color: string;
  ancho: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={[styles.indicador, { width: ancho as any, backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.indicadorTop}>
        <View style={[styles.indicadorIcono, { backgroundColor: c.backgroundSecondary }]}>{icono}</View>
        <ThemedText style={[styles.indicadorTitulo, { color: c.textSecondary }]}>{titulo}</ThemedText>
      </View>
      <ThemedText adjustsFontSizeToFit numberOfLines={1} style={[styles.indicadorValor, { color }]}>{valor}</ThemedText>
      <ThemedText style={[styles.indicadorDetalle, { color: c.textMuted }]}>{detalle}</ThemedText>
    </View>
  );
}

function IndicadorCompacto({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={[styles.miniIndicador, { backgroundColor: c.backgroundSecondary, borderColor: c.border }]}>
      <ThemedText style={styles.miniValor}>{valor}</ThemedText>
      <ThemedText style={[styles.miniEtiqueta, { color: c.textSecondary }]}>{etiqueta}</ThemedText>
    </View>
  );
}

function ResumenFinanciero({ indicadores, anchoPantalla }: { indicadores: DashboardIndicadores; anchoPantalla: number }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const ancho = anchoPantalla >= 800 ? "23.5%" : "48.5%";
  return (
    <View style={styles.resumenContenedor}>
      <View style={styles.indicadoresGrid}>
        <IndicadorGrande titulo="Ingresos por pasajes" valor={moneda(indicadores.ingresos_pasajes)} detalle="Ventas pagadas" icono={<TrendingUp size={20} color={c.success} />} color={c.success} ancho={ancho} />
        <IndicadorGrande titulo="Egresos de choferes" valor={moneda(indicadores.egresos_validos)} detalle={`${entero(indicadores.egresos_cantidad)} movimientos válidos`} icono={<TrendingDown size={20} color={c.destructive} />} color={c.destructive} ancho={ancho} />
        <IndicadorGrande titulo="Saldo referencial" valor={moneda(indicadores.saldo_referencial)} detalle="Pasajes menos egresos" icono={<CircleDollarSign size={20} color={c.primary} />} color={c.text} ancho={ancho} />
        <IndicadorGrande titulo="Viajes registrados" valor={entero(indicadores.viajes_total)} detalle="Incluye viajes cancelados" icono={<BusFront size={20} color={c.primary} />} color={c.text} ancho={ancho} />
      </View>
      <View style={styles.miniGrid}>
        <IndicadorCompacto etiqueta="Pasajes vendidos" valor={entero(indicadores.pasajes_vendidos)} />
        <IndicadorCompacto etiqueta="Ventas pagadas" valor={entero(indicadores.ventas_pagadas)} />
        <IndicadorCompacto etiqueta="Viajes finalizados" valor={entero(indicadores.viajes_finalizados)} />
        <IndicadorCompacto etiqueta="En curso" valor={entero(indicadores.viajes_en_curso)} />
        <IndicadorCompacto etiqueta="En venta" valor={entero(indicadores.viajes_programados)} />
        <IndicadorCompacto etiqueta="Cancelados" valor={entero(indicadores.viajes_cancelados)} />
      </View>
      <Card style={styles.promedios}>
        <View style={styles.flex}>
          <ThemedText style={[styles.promedioLabel, { color: c.textSecondary }]}>Ingreso medio por pasaje</ThemedText>
          <ThemedText style={styles.promedioValor}>{moneda(indicadores.promedio_por_pasaje)}</ThemedText>
        </View>
        <View style={styles.flex}>
          <ThemedText style={[styles.promedioLabel, { color: c.textSecondary }]}>Relación ingreso / viaje</ThemedText>
          <ThemedText style={styles.promedioValor}>{moneda(indicadores.promedio_por_viaje)}</ThemedText>
        </View>
      </Card>
    </View>
  );
}

function ListaVehiculos({ vehiculos, limite = 0 }: { vehiculos: DashboardVehiculo[]; limite?: number }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [todos, setTodos] = useState(false);
  const visibles = limite > 0 && !todos ? vehiculos.slice(0, limite) : vehiculos;
  if (vehiculos.length === 0) {
    return <ThemedText style={[styles.ayuda, { color: c.textSecondary }]}>No hay viajes ni ventas de vehículos en el período seleccionado.</ThemedText>;
  }
  return (
    <View style={styles.listaVehiculos}>
      {visibles.map((vehiculo) => (
        <View key={vehiculo.id} style={[styles.vehiculo, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.vehiculoIcono, { backgroundColor: c.backgroundSecondary }]}>
            <BusFront size={21} color={c.primary} />
          </View>
          <View style={styles.flex}>
            <ThemedText numberOfLines={1} style={styles.placa}>{campo(vehiculo.placa)}</ThemedText>
            <ThemedText style={[styles.vehiculoDetalle, { color: c.textSecondary }]}>
              {entero(vehiculo.viajes_total)} viajes · {entero(vehiculo.pasajes_vendidos)} pasajes
            </ThemedText>
            <ThemedText style={[styles.vehiculoDetalle, { color: c.textMuted }]}>
              {entero(vehiculo.ventas_pagadas)} ventas pagadas
            </ThemedText>
          </View>
          <View style={styles.vehiculoMontoContenedor}>
            <ThemedText style={[styles.vehiculoMonto, { color: c.success }]}>{moneda(vehiculo.ingresos_pasajes)}</ThemedText>
            <ThemedText style={[styles.vehiculoDetalle, { color: c.textMuted }]}>Recaudación</ThemedText>
          </View>
        </View>
      ))}
      {limite > 0 && vehiculos.length > limite ? (
        <Pressable onPress={() => setTodos((v) => !v)} accessibilityRole="button" style={[styles.verMas, { borderColor: c.border }]}>
          <ThemedText style={{ color: c.primary, fontWeight: "800" }}>{todos ? "Ver menos vehículos" : `Ver todos los vehículos (${vehiculos.length})`}</ThemedText>
          {todos ? <ChevronUp size={17} color={c.primary} /> : <ChevronDown size={17} color={c.primary} />}
        </Pressable>
      ) : null}
    </View>
  );
}

function TarjetaChofer({ chofer, esPropio, dobleColumna }: { chofer: DashboardChofer; esPropio: boolean; dobleColumna: boolean }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [expandido, setExpandido] = useState(esPropio);
  const i = chofer.indicadores;
  const activo = String(chofer.estado).toUpperCase() === "ACTIVO";
  return (
    <Card style={[styles.choferCard, dobleColumna ? styles.choferDoble : styles.choferSimple]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ver indicadores de ${chofer.nombre_completo}`} onPress={() => setExpandido((v) => !v)}>
        <View style={styles.choferEncabezado}>
          <View style={[styles.avatar, { backgroundColor: c.backgroundSecondary }]}>
            {chofer.fotoUrl ? <Image source={{ uri: chofer.fotoUrl }} style={styles.avatarImagen} resizeMode="cover" /> : <UserRound size={24} color={c.primary} />}
          </View>
          <View style={styles.flex}>
            <ThemedText numberOfLines={2} style={styles.nombreChofer}>{campo(chofer.nombre_completo)}</ThemedText>
            <ThemedText style={[styles.choferCodigo, { color: c.textSecondary }]}>Chofer #{chofer.id}</ThemedText>
          </View>
          <View style={styles.choferEstado}>
            <Badge label={activo ? "Activo" : "Inactivo"} variant={activo ? "success" : "muted"} />
            {expandido ? <ChevronUp size={18} color={c.textMuted} /> : <ChevronDown size={18} color={c.textMuted} />}
          </View>
        </View>
        <View style={[styles.choferCifras, { borderTopColor: c.border }]}>
          <View style={styles.cifraChofer}>
            <ThemedText style={[styles.cifraChoferLabel, { color: c.textSecondary }]}>Viajes</ThemedText>
            <ThemedText style={styles.cifraChoferValor}>{entero(i.viajes_total)}</ThemedText>
          </View>
          <View style={styles.cifraChofer}>
            <ThemedText style={[styles.cifraChoferLabel, { color: c.textSecondary }]}>Pasajes</ThemedText>
            <ThemedText style={styles.cifraChoferValor}>{entero(i.pasajes_vendidos)}</ThemedText>
          </View>
          <View style={[styles.cifraChofer, styles.cifraChoferAncha]}>
            <ThemedText style={[styles.cifraChoferLabel, { color: c.textSecondary }]}>Recaudación</ThemedText>
            <ThemedText adjustsFontSizeToFit numberOfLines={1} style={[styles.cifraChoferValor, { color: c.success }]}>{moneda(i.ingresos_pasajes)}</ThemedText>
          </View>
        </View>
      </Pressable>
      {expandido ? (
        <View style={[styles.choferExpandido, { borderTopColor: c.border }]}>
          <View style={styles.datosGrid}>
            <InfoDato etiqueta="Carnet de identidad" valor={chofer.carnet_identidad} />
            <InfoDato etiqueta="Teléfono" valor={chofer.telefono} />
            <InfoDato etiqueta="Carnet sindical" valor={chofer.carnet_sindical} />
            <InfoDato etiqueta="Licencia" valor={chofer.numero_licencia} />
            <InfoDato etiqueta="Categoría" valor={chofer.categoria_licencia} />
          </View>
          <View style={[styles.detalleFinanciero, { borderTopColor: c.border }]}>
            <InfoDato etiqueta="Ventas pagadas" valor={entero(i.ventas_pagadas)} />
            <InfoDato etiqueta="Viajes finalizados" valor={entero(i.viajes_finalizados)} />
            <InfoDato etiqueta="Egresos válidos" valor={moneda(i.egresos_validos)} />
            <InfoDato etiqueta="Saldo referencial" valor={moneda(i.saldo_referencial)} />
          </View>
          <ThemedText style={styles.subtituloTarjeta}>Ingresos por vehículo</ThemedText>
          <ListaVehiculos vehiculos={chofer.vehiculos} />
        </View>
      ) : null}
    </Card>
  );
}

/**
 * /dashboard
 * Administrador: totales y detalle de TODOS los choferes.
 * Chofer: sus indicadores, vehículos y egresos (filtrados por Laravel).
 * Egresos es una ruta independiente y no se monta al entrar al inicio.
 */
export default function DashboardScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const router = useRouter();
  const [periodo, setPeriodo] = useState<DashboardPeriodo>("mes");
  const [datos, setDatos] = useState<DashboardChoferesResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoFiltro>("TODOS");
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const requestId = useRef(0);

  const cargar = useCallback(async (refresco = false) => {
    const actual = ++requestId.current;
    if (refresco) setRefrescando(true);
    else setCargando(true);
    try {
      const respuesta = await dashboardService.choferes(periodo);
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
  }, [periodo]);

  useEffect(() => {
    setDatos(null);
    setError(null);
    void cargar();
    return () => { requestId.current += 1; };
  }, [cargar, user?.id]);

  const administrador = datos?.rol === "administrador";
  const choferes = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase();
    return (datos?.choferes ?? []).filter((chofer) => {
      const coincideEstado = estado === "TODOS" || String(chofer.estado).toUpperCase() === estado;
      return coincideEstado && (!termino || datoBuscable(chofer).includes(termino));
    });
  }, [datos, busqueda, estado]);
  const visibles = administrador && !mostrarTodos ? choferes.slice(0, 8) : choferes;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={styles.contenido}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void cargar(true)} colors={[c.primary]} tintColor={c.primary} />}
    >
      <View style={styles.encabezado}>
        <View style={[styles.headerIcono, { backgroundColor: c.backgroundSecondary }]}><LayoutDashboard size={26} color={c.primary} /></View>
        <View style={styles.flex}>
          <ThemedText style={styles.titulo}>Inicio</ThemedText>
          <ThemedText style={[styles.subtitulo, { color: c.textSecondary }]}>
            {`Bienvenido${user?.nombres ? `, ${user.nombres}` : ""} · Resumen operativo`}
          </ThemedText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Actualizar dashboard" onPress={() => void cargar(true)} disabled={refrescando} style={[styles.actualizar, { backgroundColor: c.card, borderColor: c.border }]}>
          {refrescando ? <ActivityIndicator color={c.primary} size="small" /> : <RefreshCw size={20} color={c.text} />}
        </Pressable>
      </View>

      <View style={styles.seccionTitulo}>
        <Banknote size={21} color={c.primary} />
        <ThemedText style={styles.seccionTexto}>Resumen financiero y viajes</ThemedText>
      </View>
      <View style={styles.periodos}>
        {PERIODOS.map((item) => {
          const activo = periodo === item.value;
          return (
            <Pressable key={item.value} accessibilityRole="button" accessibilityLabel={`Período ${item.label}`} onPress={() => { if (!activo) setPeriodo(item.value); }} style={[styles.periodoChip, { backgroundColor: activo ? c.primary : c.card, borderColor: activo ? c.primary : c.border }]}>
              <ThemedText style={[styles.periodoTexto, { color: activo ? c.primaryForeground : c.text }]}>{item.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      {cargando && !datos ? (
        <View style={styles.cargando}>
          <ActivityIndicator color={c.primary} size="large" />
          <ThemedText style={{ color: c.textSecondary }}>Calculando viajes y recaudación...</ThemedText>
        </View>
      ) : error && !datos ? (
        <Card style={styles.mensaje}>
          <ThemedText style={[styles.mensajeTitulo, { color: c.destructive }]}>No se pudo cargar el Dashboard</ThemedText>
          <ThemedText style={[styles.mensajeSub, { color: c.textSecondary }]}>{error}</ThemedText>
          <Button title="Reintentar" onPress={() => void cargar()} />
        </Card>
      ) : datos ? (
        <>
          {error ? <ThemedText style={{ color: c.destructive, fontSize: 12 }}>No se pudo actualizar: {error}</ThemedText> : null}
          <ResumenFinanciero indicadores={datos.resumen.indicadores} anchoPantalla={width} />
          <ThemedText style={[styles.ayuda, { color: c.textSecondary }]}>
            Recaudación: ventas pagadas según su fecha de cobro. Viajes: fecha programada de salida. Egresos: movimientos válidos de los choferes. El saldo y la relación ingreso/viaje son referenciales; no equivalen al cierre contable.
          </ThemedText>

          <View style={styles.seccionTitulo}>
            <BusFront size={21} color={c.primary} />
            <ThemedText style={styles.seccionTexto}>Ingresos por vehículo</ThemedText>
          </View>
          <ListaVehiculos vehiculos={datos.vehiculos} limite={6} />

          <View style={styles.seccionTitulo}>
            <Users size={21} color={c.primary} />
            <ThemedText style={styles.seccionTexto}>{administrador ? "Rendimiento por chofer" : "Mi rendimiento como chofer"}</ThemedText>
          </View>
          {administrador ? (
            <>
              <ThemedText style={[styles.ayuda, { color: c.textSecondary }]}>
                {entero(datos.resumen.total)} choferes · {entero(datos.resumen.activos)} activos · {entero(datos.resumen.inactivos)} inactivos
              </ThemedText>
              <SearchBar value={busqueda} onChangeText={(v) => { setBusqueda(v); setMostrarTodos(false); }} placeholder="Buscar chofer, CI o placa..." />
              <View style={styles.filtros}>
                {(["TODOS", "ACTIVO", "INACTIVO"] as const).map((opcion) => {
                  const activo = estado === opcion;
                  return (
                    <Pressable key={opcion} accessibilityRole="button" onPress={() => { setEstado(opcion); setMostrarTodos(false); }} style={[styles.filtro, { backgroundColor: activo ? c.primary : c.card, borderColor: activo ? c.primary : c.border }]}>
                      <ThemedText style={[styles.filtroTexto, { color: activo ? c.primaryForeground : c.text }]}>{opcion === "TODOS" ? "Todos" : opcion === "ACTIVO" ? "Activos" : "Inactivos"}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              <ThemedText style={[styles.ayuda, { color: c.textSecondary }]}>{entero(choferes.length)} chofer(es) encontrados</ThemedText>
            </>
          ) : (
            <Card style={styles.avisoPersonal}>
              <UserRound size={18} color={c.primary} />
              <ThemedText style={[styles.avisoTexto, { color: c.textSecondary }]}>Solo puedes consultar tus propios viajes, ventas e indicadores.</ThemedText>
            </Card>
          )}

          {visibles.length === 0 ? (
            <Card style={styles.mensaje}>
              <ThemedText style={styles.mensajeTitulo}>{administrador ? "No se encontraron choferes" : "No hay ficha de chofer asociada a tu cuenta"}</ThemedText>
              <ThemedText style={[styles.mensajeSub, { color: c.textSecondary }]}>{administrador ? "Prueba con otro filtro." : "Consulta con administración para verificar tu registro."}</ThemedText>
            </Card>
          ) : (
            <View style={styles.tarjetas}>
              {visibles.map((chofer) => <TarjetaChofer key={chofer.id} chofer={chofer} esPropio={!administrador} dobleColumna={width >= 880} />)}
            </View>
          )}
          {administrador && choferes.length > 8 ? (
            <Pressable accessibilityRole="button" onPress={() => setMostrarTodos((v) => !v)} style={[styles.verMas, { borderColor: c.border }]}>
              <ThemedText style={{ color: c.primary, fontWeight: "800" }}>{mostrarTodos ? "Mostrar menos" : `Mostrar todos los choferes (${choferes.length})`}</ThemedText>
              {mostrarTodos ? <ChevronUp size={17} color={c.primary} /> : <ChevronDown size={17} color={c.primary} />}
            </Pressable>
          ) : null}
        </>
      ) : null}

      <View style={[styles.modulos, { borderTopColor: c.border }]}>
        <View style={styles.seccionTitulo}>
          <Layers size={21} color={c.primary} />
          <ThemedText style={styles.seccionTexto}>Módulos</ThemedText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir módulo de Egresos" onPress={() => router.push("/dashboard/egresos" as any)} style={[styles.moduloBoton, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.moduloIcono, { backgroundColor: c.backgroundSecondary }]}><WalletCards size={26} color={c.primary} /></View>
          <View style={styles.flex}>
            <ThemedText style={styles.moduloTitulo}>Egresos</ThemedText>
            <ThemedText style={[styles.moduloDescripcion, { color: c.textSecondary }]}>Registrar, consultar, anular e imprimir egresos</ThemedText>
          </View>
          <ArrowRight size={23} color={c.primary} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contenido: { paddingHorizontal: 14, paddingTop: 18, paddingBottom: 45, gap: 15, maxWidth: 1200, width: "100%", alignSelf: "center" },
  flex: { flex: 1, minWidth: 0 },
  encabezado: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcono: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  titulo: { fontSize: 25, fontWeight: "900" },
  subtitulo: { fontSize: 12, marginTop: 2 },
  actualizar: { width: 43, height: 43, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  seccionTitulo: { flexDirection: "row", alignItems: "center", gap: 9 },
  seccionTexto: { fontSize: 18, fontWeight: "900", flexShrink: 1 },
  periodos: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  periodoChip: { borderRadius: 11, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10 },
  periodoTexto: { fontSize: 12, fontWeight: "800" },
  cargando: { minHeight: 170, alignItems: "center", justifyContent: "center", gap: 12 },
  mensaje: { gap: 12, alignItems: "center", paddingVertical: 22 },
  mensajeTitulo: { fontSize: 15, fontWeight: "800", textAlign: "center" },
  mensajeSub: { fontSize: 12, textAlign: "center" },
  resumenContenedor: { gap: 9 },
  indicadoresGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 9 },
  indicador: { borderWidth: 1, borderRadius: 15, padding: 12, minHeight: 121, gap: 6 },
  indicadorTop: { flexDirection: "row", alignItems: "center", gap: 7 },
  indicadorIcono: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  indicadorTitulo: { fontSize: 11, fontWeight: "700", flexShrink: 1 },
  indicadorValor: { fontSize: 22, fontWeight: "900", minWidth: 0 },
  indicadorDetalle: { fontSize: 10 },
  miniGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  miniIndicador: { flexGrow: 1, flexBasis: "30%", minWidth: 95, borderWidth: 1, borderRadius: 12, padding: 11, gap: 4 },
  miniValor: { fontSize: 18, fontWeight: "900" },
  miniEtiqueta: { fontSize: 11 },
  promedios: { flexDirection: "row", gap: 12 },
  promedioLabel: { fontSize: 11, lineHeight: 16 },
  promedioValor: { fontSize: 16, fontWeight: "900", marginTop: 5 },
  ayuda: { fontSize: 11, lineHeight: 17 },
  listaVehiculos: { gap: 8 },
  vehiculo: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 13, padding: 12, gap: 9 },
  vehiculoIcono: { width: 39, height: 39, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  placa: { fontSize: 14, fontWeight: "900" },
  vehiculoDetalle: { fontSize: 10, marginTop: 3 },
  vehiculoMontoContenedor: { alignItems: "flex-end", maxWidth: "40%" },
  vehiculoMonto: { fontSize: 15, fontWeight: "900", textAlign: "right" },
  verMas: { minHeight: 43, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, paddingHorizontal: 8 },
  filtros: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  filtro: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
  filtroTexto: { fontSize: 12, fontWeight: "700" },
  avisoPersonal: { flexDirection: "row", gap: 10, alignItems: "center" },
  avisoTexto: { flex: 1, fontSize: 12, lineHeight: 18 },
  tarjetas: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  choferCard: { gap: 11 },
  choferSimple: { width: "100%" },
  choferDoble: { width: "49%" },
  choferEncabezado: { flexDirection: "row", alignItems: "center", gap: 9 },
  avatar: { width: 49, height: 49, borderRadius: 13, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  avatarImagen: { width: "100%", height: "100%" },
  nombreChofer: { fontSize: 14, fontWeight: "900" },
  choferCodigo: { fontSize: 11, marginTop: 3 },
  choferEstado: { alignItems: "center", gap: 5 },
  choferCifras: { flexDirection: "row", gap: 6, borderTopWidth: 1, paddingTop: 12 },
  cifraChofer: { flex: 1, minWidth: 0 },
  cifraChoferAncha: { flex: 1.7 },
  cifraChoferLabel: { fontSize: 10 },
  cifraChoferValor: { fontSize: 16, fontWeight: "900", marginTop: 5 },
  choferExpandido: { borderTopWidth: 1, paddingTop: 12, gap: 12 },
  datosGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 11 },
  dato: { width: "50%", paddingRight: 8, gap: 3 },
  datoEtiqueta: { fontSize: 11 },
  datoValor: { fontSize: 12, fontWeight: "800" },
  detalleFinanciero: { borderTopWidth: 1, paddingTop: 11, flexDirection: "row", flexWrap: "wrap", rowGap: 10 },
  subtituloTarjeta: { fontSize: 13, fontWeight: "900" },
  modulos: { borderTopWidth: 1, paddingTop: 19, marginTop: 8, gap: 12 },
  moduloBoton: { minHeight: 82, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 15, padding: 14, gap: 12 },
  moduloIcono: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  moduloTitulo: { fontSize: 16, fontWeight: "900" },
  moduloDescripcion: { fontSize: 11, lineHeight: 17, marginTop: 4 },
});
