import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import {
  WalletCards,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Filter,
  RefreshCw,
} from "lucide-react-native";

import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DatePicker, DatePickerResult } from "@/components/ui/DatePicker";
import { Modal } from "@/components/ui/Modal";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { useTheme } from "@/theme/useTheme";
import { ConfirmModal, useConfirmLocal } from "@/screens/admin/arqueo/components/ConfirmModal";
import { MovimientoFormModal } from "@/screens/admin/arqueo/components/MovimientoFormModal";
import { MovimientoPrintModal } from "@/screens/admin/arqueo/components/MovimientoPrintModal";
import { useEgresos } from "@/screens/admin/arqueo/hooks/useMovimientos";
import type {
  Egreso,
  EstadoMovimiento,
  TipoPago,
} from "@/screens/admin/arqueo/types/arqueo.types";
import { num } from "@/screens/admin/arqueo/types/arqueo.types";

const PAGOS: Array<{ label: string; value: TipoPago | "" }> = [
  { label: "Todos", value: "" },
  { label: "Efectivo", value: "Efectivo" },
  { label: "Tarjeta", value: "Tarjeta" },
  { label: "QR", value: "QR" },
  { label: "Transferencia", value: "Transferencia" },
];

const ESTADOS: Array<{ label: string; value: EstadoMovimiento | "" }> = [
  { label: "Todos", value: "" },
  { label: "Válidos", value: "Valido" },
  { label: "Anulados", value: "Anulado" },
];

function fechaLocal(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function mostrarFecha(fecha: string): string {
  if (!fecha) return "Sin fecha";
  const partes = fecha.replace("T", " ").split(" ");
  const [anio, mes, dia] = partes[0].split("-");
  if (!dia) return fecha;
  return `${dia}/${mes}/${anio}${partes[1] ? ` ${partes[1].slice(0, 5)}` : ""}`;
}

function Detalle({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.detalleFila}>
      <ThemedText style={[styles.detalleLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </ThemedText>
      <ThemedText style={styles.detalleValor}>{value}</ThemedText>
    </View>
  );
}

/**
 * Vista móvil del módulo de Egresos reutilizando íntegramente:
 * - useEgresos (listado, paginación, crear, anular, refrescar)
 * - MovimientoFormModal (validación y creación)
 * - MovimientoPrintModal (comprobante y conexión bajo demanda)
 * - ConfirmModal (anulación confirmada)
 *
 * El backend conserva sus permisos y sus reglas de arqueo.
 */
export default function DashboardEgresos() {
  const { theme } = useTheme();
  const c = theme.colors;
  const egresos = useEgresos();
  const confirmar = useConfirmLocal();

  const [buscar, setBuscar] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalFiltros, setModalFiltros] = useState(false);
  const [calendarioVisible, setCalendarioVisible] = useState(false);
  const [imprimir, setImprimir] = useState<Egreso | null>(null);

  const itemsFiltrados = useMemo(() => {
    const termino = buscar.trim().toLocaleLowerCase();
    if (!termino) return egresos.items;
    return egresos.items.filter((egreso) =>
      [
        egreso.detalle,
        egreso.tipo_transaccion?.transaccion,
        egreso.tipo_transaccion?.codigo,
        String(egreso.id),
        String(egreso.id_arqueo),
      ]
        .some((valor) => String(valor ?? "").toLocaleLowerCase().includes(termino)),
    );
  }, [egresos.items, buscar]);

  const totalPagina = useMemo(
    () => itemsFiltrados
      .filter((egreso) => egreso.estado === "Valido")
      .reduce((suma, egreso) => suma + num(egreso.monto), 0),
    [itemsFiltrados],
  );

  const aplicarRango = (desde: string, hasta: string) => {
    egresos.setPage(1);
    egresos.setFechaDesde(desde);
    egresos.setFechaHasta(hasta);
  };

  const elegirPeriodo = (tipo: "todos" | "hoy" | "semana" | "mes") => {
    if (tipo === "todos") {
      aplicarRango("", "");
      return;
    }
    const hoy = new Date();
    const inicio = new Date(hoy);
    if (tipo === "semana") inicio.setDate(inicio.getDate() - 6);
    if (tipo === "mes") inicio.setDate(1);
    aplicarRango(fechaLocal(inicio), fechaLocal(hoy));
  };

  const anular = async (egreso: Egreso) => {
    const ok = await confirmar.ask({
      title: "Anular egreso",
      message: `¿Anular el egreso #${egreso.id} por Bs ${num(egreso.monto).toFixed(2)}?`,
      confirmText: "Anular egreso",
      variant: "warning",
    });
    if (!ok) return;
    try {
      await egresos.anular(egreso.id);
    } finally {
      confirmar.closeConfirm();
    }
  };

  return (
    <View style={styles.root}>
      <Card style={styles.cabecera}>
        <View style={styles.cabeceraTitulo}>
          <View style={[styles.icono, { backgroundColor: c.backgroundSecondary }]}>
            <WalletCards size={24} color={c.primary} />
          </View>
          <View style={styles.flex}>
            <ThemedText style={styles.titulo}>Egresos</ThemedText>
            <ThemedText style={[styles.subtitulo, { color: c.textSecondary }]}>
              Registra y consulta las salidas de dinero de caja.
            </ThemedText>
          </View>
        </View>
        <View style={styles.accionesCabecera}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Actualizar egresos"
            onPress={() => void egresos.refrescar()}
            disabled={egresos.refreshing}
            style={[styles.iconButton, { borderColor: c.border, backgroundColor: c.backgroundSecondary }]}
          >
            {egresos.refreshing
              ? <ActivityIndicator size="small" color={c.primary} />
              : <RefreshCw size={19} color={c.text} />}
          </Pressable>
          <View style={styles.flex}>
            <Button title="+ Nuevo egreso" onPress={() => setModalNuevo(true)} />
          </View>
        </View>
      </Card>

      <View style={styles.periodos}>
        {(["todos", "hoy", "semana", "mes"] as const).map((periodo) => {
          const hoy = fechaLocal(new Date());
          const activo = periodo === "todos"
            ? !egresos.fechaDesde && !egresos.fechaHasta
            : periodo === "hoy"
              ? egresos.fechaDesde === hoy && egresos.fechaHasta === hoy
              : false;
          const label = { todos: "Todos", hoy: "Hoy", semana: "7 días", mes: "Este mes" }[periodo];
          return (
            <Pressable
              key={periodo}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar egresos: ${label}`}
              onPress={() => elegirPeriodo(periodo)}
              style={[
                styles.chip,
                {
                  borderColor: activo ? c.primary : c.border,
                  backgroundColor: activo ? c.primary : c.card,
                },
              ]}
            >
              <ThemedText style={[styles.chipText, { color: activo ? c.primaryForeground : c.text }]}>
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Elegir fechas"
          onPress={() => setCalendarioVisible(true)}
          style={[styles.chip, { borderColor: c.border, backgroundColor: c.card }]}
        >
          <CalendarDays size={17} color={c.primary} />
        </Pressable>
      </View>

      {egresos.fechaDesde && egresos.fechaHasta ? (
        <ThemedText style={[styles.rangoLabel, { color: c.textSecondary }]}>
          Período: {mostrarFecha(egresos.fechaDesde)} — {mostrarFecha(egresos.fechaHasta)}
        </ThemedText>
      ) : null}

      <View style={styles.busqueda}>
        <View style={styles.flex}>
          <SearchBar
            value={buscar}
            onChangeText={setBuscar}
            placeholder="Buscar en esta página..."
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filtrar egresos"
          onPress={() => setModalFiltros(true)}
          style={[styles.iconButton, { borderColor: c.border, backgroundColor: c.card }]}
        >
          <Filter size={19} color={c.text} />
        </Pressable>
      </View>

      <View style={[styles.total, { backgroundColor: c.backgroundSecondary, borderColor: c.border }]}>
        <View style={styles.flex}>
          <ThemedText style={[styles.totalLabel, { color: c.textSecondary }]}>
            TOTAL VÁLIDO VISIBLE
          </ThemedText>
          <ThemedText style={[styles.totalAyuda, { color: c.textMuted }]}>
            Suma de los egresos mostrados en esta página
          </ThemedText>
        </View>
        <ThemedText style={[styles.totalValor, { color: c.text }]}>Bs {totalPagina.toFixed(2)}</ThemedText>
      </View>

      {egresos.loading ? (
        <View style={styles.cargando}>
          <ActivityIndicator size="large" color={c.primary} />
          <ThemedText style={{ color: c.textSecondary }}>Cargando egresos...</ThemedText>
        </View>
      ) : itemsFiltrados.length === 0 ? (
        <Card style={styles.vacio}>
          <WalletCards size={32} color={c.textMuted} />
          <ThemedText style={styles.vacioTitulo}>No hay egresos para mostrar</ThemedText>
          <ThemedText style={[styles.vacioTexto, { color: c.textSecondary }]}>
            Ajusta los filtros o registra un nuevo egreso.
          </ThemedText>
        </Card>
      ) : (
        <View style={styles.lista}>
          {itemsFiltrados.map((egreso) => {
            const abierto = expandido === egreso.id;
            const valido = egreso.estado === "Valido";
            return (
              <Card key={egreso.id} padding={0} style={styles.movimiento}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ver detalle del egreso ${egreso.id}`}
                  onPress={() => setExpandido(abierto ? null : egreso.id)}
                  style={styles.movimientoCabecera}
                >
                  <View style={[styles.movimientoIcono, { backgroundColor: c.backgroundSecondary }]}>
                    <WalletCards size={21} color={c.primary} />
                  </View>
                  <View style={styles.flex}>
                    <ThemedText numberOfLines={1} style={styles.movimientoTitulo}>
                      {egreso.tipo_transaccion?.transaccion ?? `Egreso #${egreso.id}`}
                    </ThemedText>
                    <ThemedText numberOfLines={1} style={[styles.movimientoSub, { color: c.textSecondary }]}>
                      #{egreso.id} · {mostrarFecha(egreso.fecha_registro)}
                    </ThemedText>
                    <Badge label={valido ? "Válido" : "Anulado"} variant={valido ? "success" : "muted"} />
                  </View>
                  <View style={styles.montoDerecha}>
                    <ThemedText style={[styles.movimientoMonto, { color: valido ? c.text : c.textMuted }]}>
                      Bs {num(egreso.monto).toFixed(2)}
                    </ThemedText>
                    {abierto ? <ChevronUp size={18} color={c.textSecondary} /> : <ChevronDown size={18} color={c.textSecondary} />}
                  </View>
                </Pressable>
                {abierto ? (
                  <View style={[styles.movimientoDetalle, { borderTopColor: c.border }]}>
                    <Detalle label="Detalle" value={egreso.detalle || "—"} />
                    <Detalle label="Tipo" value={egreso.tipo_transaccion?.codigo ?? `#${egreso.id_tipo_transaccion}`} />
                    <Detalle label="Forma de pago" value={egreso.tipo_pago} />
                    <Detalle label="Arqueo" value={`#${egreso.id_arqueo}`} />
                    <Detalle label="Estado" value={valido ? "Válido" : "Anulado"} />
                    <View style={styles.movimientoAcciones}>
                      <View style={styles.flex}>
                        <Button title="Comprobante" variant="secondary" onPress={() => setImprimir(egreso)} />
                      </View>
                      {valido ? (
                        <View style={styles.flex}>
                          <Button
                            title={egresos.anulandoId === egreso.id ? "Anulando..." : "Anular"}
                            variant="destructive"
                            disabled={egresos.anulandoId === egreso.id}
                            onPress={() => void anular(egreso)}
                          />
                        </View>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      )}

      <View style={styles.paginacion}>
        <ThemedText style={[styles.paginaInfo, { color: c.textSecondary }]}>
          {egresos.total} registro(s) · Página {egresos.page} de {Math.max(1, egresos.lastPage)}
        </ThemedText>
        <View style={styles.paginaBotones}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Página anterior"
            disabled={egresos.page <= 1 || egresos.loading}
            onPress={() => { setExpandido(null); egresos.setPage(egresos.page - 1); }}
            style={[styles.paginaBoton, { borderColor: c.border, opacity: egresos.page <= 1 ? 0.4 : 1 }]}
          >
            <ChevronLeft size={22} color={c.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Página siguiente"
            disabled={egresos.page >= egresos.lastPage || egresos.loading}
            onPress={() => { setExpandido(null); egresos.setPage(egresos.page + 1); }}
            style={[styles.paginaBoton, { borderColor: c.border, opacity: egresos.page >= egresos.lastPage ? 0.4 : 1 }]}
          >
            <ChevronRight size={22} color={c.text} />
          </Pressable>
        </View>
      </View>

      <Modal visible={modalFiltros} title="Filtros de egresos" onClose={() => setModalFiltros(false)} maxWidth={440}>
        <View style={styles.filtrosModal}>
          <Select<TipoPago | "">
            label="Forma de pago"
            value={egresos.tipoPago}
            options={PAGOS}
            onValueChange={(valor) => { egresos.setPage(1); egresos.setTipoPago(valor); }}
            modalTitle="Forma de pago"
          />
          <Select<EstadoMovimiento | "">
            label="Estado"
            value={egresos.estado}
            options={ESTADOS}
            onValueChange={(valor) => { egresos.setPage(1); egresos.setEstado(valor); }}
            modalTitle="Estado del egreso"
          />
          <Button title="Ver resultados" onPress={() => setModalFiltros(false)} />
        </View>
      </Modal>

      <DatePicker
        visible={calendarioVisible}
        mode="range"
        title="Fechas de egresos"
        initialRange={egresos.fechaDesde && egresos.fechaHasta
          ? { start: egresos.fechaDesde, end: egresos.fechaHasta }
          : undefined}
        onClose={() => setCalendarioVisible(false)}
        onApply={(resultado: DatePickerResult) => {
          if (resultado.type === "range") aplicarRango(resultado.start, resultado.end);
          setCalendarioVisible(false);
        }}
      />

      <MovimientoFormModal
        visible={modalNuevo}
        tipo="Egreso"
        saving={egresos.saving}
        onClose={() => setModalNuevo(false)}
        onSave={egresos.crear}
      />
      <MovimientoPrintModal
        visible={imprimir !== null}
        kind="egreso"
        movimiento={imprimir}
        onClose={() => setImprimir(null)}
      />
      <ConfirmModal
        state={confirmar.confirmState}
        busy={confirmar.confirmBusy}
        onCancel={confirmar.handleCancel}
        onConfirm={confirmar.handleConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  cabecera: { gap: 14 },
  cabeceraTitulo: { flexDirection: "row", alignItems: "center", gap: 12 },
  icono: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  titulo: { fontSize: 20, fontWeight: "900" },
  subtitulo: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  accionesCabecera: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: { width: 46, height: 46, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  periodos: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, minHeight: 38, justifyContent: "center", alignItems: "center" },
  chipText: { fontSize: 12, fontWeight: "700" },
  rangoLabel: { fontSize: 12 },
  busqueda: { flexDirection: "row", gap: 9, alignItems: "center" },
  total: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, padding: 14 },
  totalLabel: { fontSize: 11, fontWeight: "800" },
  totalAyuda: { fontSize: 10, marginTop: 4 },
  totalValor: { fontSize: 20, fontWeight: "900" },
  cargando: { padding: 32, alignItems: "center", gap: 12 },
  vacio: { alignItems: "center", gap: 9, paddingVertical: 28 },
  vacioTitulo: { fontSize: 15, fontWeight: "800", textAlign: "center" },
  vacioTexto: { fontSize: 12, textAlign: "center" },
  lista: { gap: 9 },
  movimiento: { overflow: "hidden" },
  movimientoCabecera: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13 },
  movimientoIcono: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  movimientoTitulo: { fontSize: 14, fontWeight: "800" },
  movimientoSub: { fontSize: 11, marginTop: 3, marginBottom: 6 },
  montoDerecha: { alignItems: "flex-end", gap: 7 },
  movimientoMonto: { fontSize: 14, fontWeight: "900" },
  movimientoDetalle: { borderTopWidth: 1, padding: 13, gap: 10 },
  detalleFila: { flexDirection: "row", gap: 10 },
  detalleLabel: { width: 110, fontSize: 12 },
  detalleValor: { flex: 1, fontSize: 12, fontWeight: "700" },
  movimientoAcciones: { flexDirection: "row", gap: 8, marginTop: 5 },
  paginacion: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingVertical: 5 },
  paginaInfo: { flex: 1, fontSize: 11 },
  paginaBotones: { flexDirection: "row", gap: 8 },
  paginaBoton: { width: 40, height: 40, borderWidth: 1, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  filtrosModal: { gap: 16 },
});
