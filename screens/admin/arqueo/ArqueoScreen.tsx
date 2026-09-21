// screens/admin/arqueo/ArqueoScreen.tsx

import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Ban,
  Eye,
  Lock,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
} from "lucide-react-native";
import Visibility from "@/components/Visibility";
import { Table, TableColumn } from "@/components/Table";
import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { TabBar } from "@/components/ui/TabBar";
import { useTheme } from "@/theme/useTheme";
import { useArqueoStore } from "./store/arqueoStore";
import { ConfirmModal, useConfirmLocal } from "./components/ConfirmModal";
import { useArqueoAbierto } from "./hooks/useArqueoAbierto";
import { useArqueos } from "./hooks/useArqueos";
import { useEgresos, useIngresos } from "./hooks/useMovimientos";
import { useTiposTransaccion } from "./hooks/useTiposTransaccion";
import { AbrirArqueoModal } from "./components/AbrirArqueoModal";
import { DetalleArqueoModal } from "./components/DetalleArqueoModal";
import { MovimientoPrintModal } from "./components/MovimientoPrintModal";
import { MovimientoFormModal } from "./components/MovimientoFormModal";
import { TipoTransaccionFormModal } from "./components/TipoTransaccionFormModal";
import type {
  Egreso,
  EstadoArqueo,
  EstadoMovimiento,
  Ingreso,
  MovimientoPayload,
  NaturalezaTransaccion,
  TipoPago,
  TipoTransaccion,
} from "./types/arqueo.types";
import { num } from "./types/arqueo.types";

type TabKey = "arqueos" | "ingresos" | "egresos" | "tipos";

const tabs = [
  { key: "arqueos", label: "Arqueos" },
  { key: "ingresos", label: "Ingresos" },
  { key: "egresos", label: "Egresos" },
  { key: "tipos", label: "Tipos" },
];

const arqueoColumns: TableColumn[] = [
  { key: "nro", label: "N.º", flex: 0.4, align: "center" },
  { key: "cajero", label: "Cajero", flex: 1.6, align: "center" },
  { key: "apertura", label: "Apertura", flex: 1.1, align: "center" },
  { key: "estado", label: "Estado", flex: 0.8, align: "center" },
  { key: "saldo", label: "Saldo / Total", flex: 0.9, align: "center" },
  { key: "acciones", label: "Acciones", flex: 0.8, align: "center" },
];

const movColumns: TableColumn[] = [
  { key: "nro", label: "#", flex: 0.4, align: "center" },
  { key: "tipo", label: "Tipo", flex: 1.8, align: "center" },
  { key: "pago", label: "Pago", flex: 0.8, align: "center" },
  { key: "monto", label: "Monto", flex: 0.8, align: "center" },
  { key: "estado", label: "Estado", flex: 0.8, align: "center" },
  { key: "acciones", label: "Acciones", flex: 1.1, align: "center" },
];

const tipoColumns: TableColumn[] = [
  { key: "nro", label: "#", flex: 0.4, align: "center" },
  { key: "codigo", label: "Código", flex: 1.2, align: "center" },
  { key: "nombre", label: "Nombre", flex: 1.8, align: "center" },
  { key: "naturaleza", label: "Naturaleza", flex: 0.8, align: "center" },
  { key: "acciones", label: "Acciones", flex: 0.8, align: "center" },
];

function nombreCajero(a: { id_user: number; user?: unknown }): string {
  const u = a.user as
    | {
        nombres?: string | null;
        primer_apellido?: string | null;
        usuario?: string;
      }
    | null
    | undefined;
  if (u && typeof u === "object") {
    const full = `${u.nombres ?? ""} ${u.primer_apellido ?? ""}`.trim();
    if (full) return full;
    if (u.usuario) return u.usuario;
  }
  return `Usuario ${a.id_user}`;
}

export const ArqueoScreen: React.FC = () => {
  const { theme } = useTheme();
  const c = theme.colors;

  const [activeTab, setActiveTab] = useState<TabKey>("arqueos");

  const {
    abierto,
    loading: loadingAbierto,
    refreshing: refreshingAbierto,
    refrescar: refrescarAbierto,
  } = useArqueoAbierto(true);
  const [abrirVisible, setAbrirVisible] = useState(false);
  const [detalleId, setDetalleId] = useState<number | null>(null);

  const fetchAbiertoStore = useArqueoStore((s) => s.fetchAbierto);
  const syncAbiertoStore = useArqueoStore((s) => s.syncAbierto);

  /*
  |--------------------------------------------------------------------------
  | ABRIR CAJA (con chequeo fresco previo, igual que el dot)
  |--------------------------------------------------------------------------
  */

  const handleAbrirCaja = async () => {
    const actual = useArqueoStore.getState().abierto;
    if (actual) {
      setDetalleId(actual.id);
      return;
    }
    const fresco = await syncAbiertoStore();
    if (fresco) {
      setDetalleId(fresco.id);
    } else {
      setAbrirVisible(true);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Visibility action="Ver" selector=".arqueo-header">
          <PageHeader
            badge="Caja"
            badgeVariant={abierto ? "success" : "destructive"}
            title="Arqueo de caja"
            description={
              loadingAbierto
                ? "Verificando tu arqueo abierto..."
                : abierto
                  ? `Tienes el arqueo #${abierto.id} abierto • Saldo anterior Bs. ${num(abierto.saldo_anterior).toFixed(2)}`
                  : "No tienes arqueo abierto. Ábrelo para registrar movimientos."
            }
            action={
              abierto
                ? {
                    title: "Ver mi caja",
                    onPress: () => setDetalleId(abierto.id),
                    variant: "secondary",
                  }
                : {
                    title: "Abrir arqueo",
                    onPress: () => void handleAbrirCaja(),
                    variant: "primary",
                  }
            }
            secondaryAction={{
              title: refreshingAbierto ? "Actualizando..." : "Actualizar",
              onPress: () => void refrescarAbierto(),
              variant: "ghost",
              loading: refreshingAbierto,
            }}
          />
        </Visibility>

        <Visibility action="Ver" selector=".arqueo-tabs">
          <TabBar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(k) => setActiveTab(k as TabKey)}
          />
        </Visibility>

        {activeTab === "arqueos" && <ArqueosTab onDetalle={setDetalleId} />}
        {activeTab === "ingresos" && <IngresosTab />}
        {activeTab === "egresos" && <EgresosTab />}
        {activeTab === "tipos" && <TiposTab />}
      </ScrollView>

      <AbrirArqueoModal
        visible={abrirVisible}
        onClose={() => setAbrirVisible(false)}
      />
      <DetalleArqueoModal
        visible={detalleId !== null}
        arqueoId={detalleId}
        onClose={() => setDetalleId(null)}
        onClosed={() => void fetchAbiertoStore(true)}
      />
    </View>
  );
};

// ─── TAB ARQUEOS ───

function ArqueosTab({ onDetalle }: { onDetalle: (id: number) => void }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const confirmLocal = useConfirmLocal();
  const h = useArqueos();

  return (
    <View style={styles.tabBody}>
      <Card>
        <View style={styles.toolbar}>
          <View style={styles.toolbarTitle}>
            <ThemedText style={styles.listTitle}>Listado de arqueos</ThemedText>
            <Badge label={`${h.total} registros`} variant="muted" />
          </View>
          <View style={styles.toolbarActions}>
            <IconButton
              icon={RefreshCw}
              variant="secondary"
              size="sm"
              accessibilityLabel="Actualizar arqueos"
              loading={h.refreshing}
              disabled={h.refreshing}
              onPress={() => void h.refrescar()}
            />
            <Visibility action="Eliminar">
              <Button
                title="Limpiar filtros"
                variant="ghost"
                onPress={h.limpiarFiltros}
              />
            </Visibility>
          </View>
        </View>

        <View style={styles.filters}>
          <View style={styles.filterItem}>
            <Select<EstadoArqueo | "">
              label="Estado"
              value={h.estado}
              options={[
                { label: "Todos", value: "" },
                { label: "Iniciado", value: "Iniciado" },
                { label: "Terminado", value: "Terminado" },
              ]}
              onValueChange={(v) => {
                h.setEstado(v);
                h.setPage(1);
              }}
              modalTitle="Estado"
            />
          </View>
          <View style={styles.filterItem}>
            <ThemedText
              style={[styles.filterLabel, { color: c.textSecondary }]}
            >
              Apertura desde (YYYY-MM-DD)
            </ThemedText>
            <SearchBar
              value={h.fechaDesde}
              onChangeText={(v) => {
                h.setFechaDesde(v);
                h.setPage(1);
              }}
              placeholder="2026-09-01"
            />
          </View>
          <View style={styles.filterItem}>
            <ThemedText
              style={[styles.filterLabel, { color: c.textSecondary }]}
            >
              Apertura hasta
            </ThemedText>
            <SearchBar
              value={h.fechaHasta}
              onChangeText={(v) => {
                h.setFechaHasta(v);
                h.setPage(1);
              }}
              placeholder="2026-09-30"
            />
          </View>
        </View>

        <Visibility action="Ver">
          <View style={styles.tableContainer}>
            <Table
              data={h.items}
              columns={arqueoColumns}
              loading={h.loading}
              scrollEnabled={false}
              columnGap={1}
              horizontalPadding={5}
              cellPaddingHorizontal={2}
              keyExtractor={(item) => String(item.id)}
              emptyMessage="No hay arqueos con esos filtros."
              renderCell={(item, column, rowIndex) => {
                switch (column.key) {
                  case "nro": {
                    const numero = (h.page - 1) * h.perPage + rowIndex + 1;
                    return (
                      <Text style={[styles.cellText, { color: c.textMuted }]}>
                        {numero}
                      </Text>
                    );
                  }
                  case "cajero":
                    return (
                      <Text
                        numberOfLines={2}
                        ellipsizeMode="tail"
                        style={[styles.cellBold, { color: c.text }]}
                      >
                        {nombreCajero(item)}
                      </Text>
                    );
                  case "apertura":
                    return (
                      <Text
                        numberOfLines={2}
                        style={[styles.cellText, { color: c.textSecondary }]}
                      >
                        {String(item.fecha_apertura ?? "")
                          .slice(0, 16)
                          .replace("T", " ")}
                      </Text>
                    );
                  case "estado":
                    return (
                      <Badge
                        label={item.estado}
                        variant={
                          item.estado === "Iniciado" ? "success" : "muted"
                        }
                      />
                    );
                  case "saldo":
                    return (
                      <Text style={[styles.cellMonto, { color: c.text }]}>
                        Bs.{" "}
                        {num(item.total_general ?? item.saldo_anterior).toFixed(
                          2,
                        )}
                      </Text>
                    );
                  case "acciones":
                    return (
                      <View style={styles.accionesCell}>
                        <Visibility action="Ver">
                          <IconButton
                            icon={Eye}
                            size="sm"
                            variant="secondary"
                            accessibilityLabel={`Ver arqueo ${item.id}`}
                            onPress={() => onDetalle(item.id)}
                          />
                        </Visibility>
                        {item.estado === "Iniciado" ? (
                          <Visibility action="Editar">
                            <IconButton
                              icon={Lock}
                              size="sm"
                              variant="secondary"
                              accessibilityLabel={`Cerrar arqueo ${item.id}`}
                              onPress={() => onDetalle(item.id)}
                            />
                          </Visibility>
                        ) : null}
                        <Visibility action="Eliminar">
                          <IconButton
                            icon={Trash2}
                            size="sm"
                            variant="destructive"
                            accessibilityLabel={`Eliminar arqueo ${item.id}`}
                            loading={h.deletingId === item.id}
                            disabled={h.deletingId === item.id}
                            onPress={async () => {
                              const ok = await confirmLocal.ask({
                                title: "Eliminar arqueo",
                                message: `¿Eliminar el arqueo #${item.id}? Solo Terminados (soft-delete).`,
                                variant: "danger",
                                confirmText: "Eliminar",
                              });
                              if (!ok) return;
                              try {
                                await h.eliminar(item.id);
                              } finally {
                                confirmLocal.closeConfirm();
                              }
                            }}
                          />
                        </Visibility>
                      </View>
                    );
                  default:
                    return null;
                }
              }}
            />
          </View>
          <Pagination
            meta={{ total: h.total, page: h.page, perPage: h.perPage }}
            onPageChange={h.setPage}
            itemLabel="arqueos"
          />
        </Visibility>
      </Card>

      <ConfirmModal
        state={confirmLocal.confirmState}
        busy={confirmLocal.confirmBusy}
        onCancel={confirmLocal.handleCancel}
        onConfirm={confirmLocal.handleConfirm}
      />
    </View>
  );
}

// ─── TAB INGRESOS / EGRESOS ───

function MovimientoTabShell({
  kind,
  items,
  total,
  page,
  perPage,
  loading,
  refreshing,
  saving,
  anulandoId,
  tipoPago,
  setTipoPago,
  estado,
  setEstado,
  setPage,
  refrescar,
  crear,
  anular,
}: {
  kind: "ingreso" | "egreso";
  items: (Ingreso | Egreso)[];
  total: number;
  page: number;
  perPage: number;
  loading: boolean;
  refreshing: boolean;
  saving: boolean;
  anulandoId: number | null;
  tipoPago: TipoPago | "";
  setTipoPago: (v: TipoPago | "") => void;
  estado: EstadoMovimiento | "";
  setEstado: (v: EstadoMovimiento | "") => void;
  setPage: (p: number) => void;
  refrescar: () => void;
  crear: (p: MovimientoPayload) => Promise<boolean>;
  anular: (id: number) => Promise<boolean>;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const confirmLocal = useConfirmLocal();
  const [formVisible, setFormVisible] = useState(false);
  const [filtroArqueo, setFiltroArqueo] = useState("");

  const esIngreso = kind === "ingreso";
  const naturaleza: NaturalezaTransaccion = esIngreso ? "Ingreso" : "Egreso";

  /*
  |--------------------------------------------------------------------------
  | IMPRESIÓN (patrón ModalImprimirTicket)
  |--------------------------------------------------------------------------
  |
  | Solo se abre el modal con el mov de la fila. El modal
  | espera el HTML del endpoint y al llegar abre la
  | ventana nueva con el print() de esa ventana.
  |
  */

  const [printTarget, setPrintTarget] = useState<Ingreso | Egreso | null>(null);

  const filtrados = useMemo(() => {
    const q = filtroArqueo.trim();
    if (!q) return items;
    return items.filter((m) => String(m.id_arqueo) === q);
  }, [items, filtroArqueo]);

  return (
    <View style={styles.tabBody}>
      <Card>
        <View style={styles.toolbar}>
          <View style={styles.toolbarTitle}>
            <ThemedText style={styles.listTitle}>
              {esIngreso ? "Ingresos" : "Egresos"}
            </ThemedText>
            <Badge label={`${total} registros`} variant="muted" />
            {refreshing ? (
              <Badge label="Actualizando" variant="warning" />
            ) : null}
          </View>
          <View style={styles.toolbarActions}>
            <IconButton
              icon={RefreshCw}
              variant="secondary"
              size="sm"
              accessibilityLabel={
                esIngreso ? "Actualizar ingresos" : "Actualizar egresos"
              }
              loading={refreshing}
              disabled={refreshing}
              onPress={refrescar}
            />
            <Visibility action="Crear">
              <Button
                title={esIngreso ? "Nuevo ingreso" : "Nuevo egreso"}
                onPress={() => setFormVisible(true)}
              />
            </Visibility>
          </View>
        </View>

        <View style={styles.filters}>
          <View style={styles.filterItem}>
            <Select<TipoPago | "">
              label="Tipo de pago"
              value={tipoPago}
              options={[
                { label: "Todos", value: "" },
                { label: "Efectivo", value: "Efectivo" },
                { label: "Tarjeta", value: "Tarjeta" },
                { label: "QR", value: "QR" },
                { label: "Transferencia", value: "Transferencia" },
              ]}
              onValueChange={setTipoPago}
              modalTitle="Tipo de pago"
            />
          </View>
          <View style={styles.filterItem}>
            <Select<EstadoMovimiento | "">
              label="Estado"
              value={estado}
              options={[
                { label: "Todos", value: "" },
                { label: "Valido", value: "Valido" },
                { label: "Anulado", value: "Anulado" },
              ]}
              onValueChange={setEstado}
              modalTitle="Estado"
            />
          </View>
          <View style={styles.filterItem}>
            <ThemedText
              style={[styles.filterLabel, { color: c.textSecondary }]}
            >
              Filtrar por arqueo (id)
            </ThemedText>
            <SearchBar
              value={filtroArqueo}
              onChangeText={setFiltroArqueo}
              placeholder="Ej: 12"
            />
          </View>
        </View>

        <Visibility action="Ver">
          <View style={styles.tableContainer}>
            <Table
              data={filtrados}
              columns={movColumns}
              loading={loading}
              scrollEnabled={false}
              columnGap={1}
              horizontalPadding={5}
              cellPaddingHorizontal={2}
              keyExtractor={(item) => String(item.id)}
              emptyMessage={esIngreso ? "Sin ingresos." : "Sin egresos."}
              renderCell={(item, column, rowIndex) => {
                switch (column.key) {
                  case "nro": {
                    const numero = (page - 1) * perPage + rowIndex + 1;
                    return (
                      <Text style={[styles.cellText, { color: c.textMuted }]}>
                        {numero}
                      </Text>
                    );
                  }
                  case "tipo":
                    return (
                      <Text
                        numberOfLines={2}
                        ellipsizeMode="tail"
                        style={[styles.cellBold, { color: c.text }]}
                      >
                        {item.tipo_transaccion
                          ? `${item.tipo_transaccion.codigo} — ${item.tipo_transaccion.transaccion}`
                          : `Tipo ${item.id_tipo_transaccion}`}
                      </Text>
                    );
                  case "pago":
                    return <Badge label={item.tipo_pago} variant="info" />;
                  case "monto":
                    return (
                      <Text style={[styles.cellMonto, { color: c.primary }]}>
                        Bs. {num(item.monto).toFixed(2)}
                      </Text>
                    );
                  case "estado":
                    return (
                      <Badge
                        label={item.estado}
                        variant={item.estado === "Valido" ? "success" : "muted"}
                      />
                    );
                  case "acciones":
                    return (
                      <View style={styles.accionesCell}>
                        <Visibility action="Ver">
                          <IconButton
                            icon={Printer}
                            size="sm"
                            variant="secondary"
                            accessibilityLabel={`Imprimir comprobante #${item.id}`}
                            onPress={() => setPrintTarget(item)}
                          />
                        </Visibility>
                        {item.estado === "Valido" ? (
                          <Visibility action="Editar">
                            <IconButton
                              icon={Ban}
                              size="sm"
                              variant="secondary"
                              accessibilityLabel={`Anular ${item.id}`}
                              loading={anulandoId === item.id}
                              disabled={anulandoId === item.id}
                              onPress={async () => {
                                const ok = await confirmLocal.ask({
                                  title: "Anular movimiento",
                                  message: `¿Anular el registro #${item.id}? No se borra, queda para auditoría.`,
                                  variant: "warning",
                                  confirmText: "Anular",
                                });
                                if (!ok) return;
                                try {
                                  await anular(item.id);
                                } finally {
                                  confirmLocal.closeConfirm();
                                }
                              }}
                            />
                          </Visibility>
                        ) : null}
                      </View>
                    );
                  default:
                    return null;
                }
              }}
            />
          </View>
          <Pagination
            meta={{ total, page, perPage }}
            onPageChange={setPage}
            itemLabel={esIngreso ? "ingresos" : "egresos"}
          />
        </Visibility>
      </Card>

      <MovimientoFormModal
        visible={formVisible}
        tipo={naturaleza}
        saving={saving}
        onClose={() => setFormVisible(false)}
        onSave={crear}
      />

      <MovimientoPrintModal
        visible={printTarget !== null}
        kind={kind}
        movimiento={printTarget}
        onClose={() => setPrintTarget(null)}
      />

      <ConfirmModal
        state={confirmLocal.confirmState}
        busy={confirmLocal.confirmBusy}
        onCancel={confirmLocal.handleCancel}
        onConfirm={confirmLocal.handleConfirm}
      />
    </View>
  );
}

function IngresosTab() {
  const h = useIngresos();
  return (
    <MovimientoTabShell
      kind="ingreso"
      items={h.items}
      total={h.total}
      page={h.page}
      perPage={h.perPage}
      loading={h.loading}
      refreshing={h.refreshing}
      saving={h.saving}
      anulandoId={h.anulandoId}
      tipoPago={h.tipoPago}
      setTipoPago={(v) => {
        h.setTipoPago(v);
        h.setPage(1);
      }}
      estado={h.estado}
      setEstado={(v) => {
        h.setEstado(v);
        h.setPage(1);
      }}
      setPage={h.setPage}
      refrescar={() => void h.refrescar()}
      crear={h.crear}
      anular={h.anular}
    />
  );
}

function EgresosTab() {
  const h = useEgresos();
  return (
    <MovimientoTabShell
      kind="egreso"
      items={h.items}
      total={h.total}
      page={h.page}
      perPage={h.perPage}
      loading={h.loading}
      refreshing={h.refreshing}
      saving={h.saving}
      anulandoId={h.anulandoId}
      tipoPago={h.tipoPago}
      setTipoPago={(v) => {
        h.setTipoPago(v);
        h.setPage(1);
      }}
      estado={h.estado}
      setEstado={(v) => {
        h.setEstado(v);
        h.setPage(1);
      }}
      setPage={h.setPage}
      refrescar={() => void h.refrescar()}
      crear={h.crear}
      anular={h.anular}
    />
  );
}

// ─── TAB TIPOS ───

function TiposTab() {
  const { theme } = useTheme();
  const c = theme.colors;
  const confirmLocal = useConfirmLocal();
  const h = useTiposTransaccion();
  const [modalVisible, setModalVisible] = useState(false);
  const [actual, setActual] = useState<TipoTransaccion | null>(null);

  const openCreate = () => {
    setActual(null);
    setModalVisible(true);
  };
  const openEdit = (t: TipoTransaccion) => {
    setActual(t);
    setModalVisible(true);
  };

  return (
    <View style={styles.tabBody}>
      <Card>
        <View style={styles.toolbar}>
          <View style={styles.toolbarTitle}>
            <ThemedText style={styles.listTitle}>
              Tipos de transacción
            </ThemedText>
            <Badge label={`${h.total} registros`} variant="muted" />
          </View>
          <View style={styles.toolbarActions}>
            <IconButton
              icon={RefreshCw}
              variant="secondary"
              size="sm"
              accessibilityLabel="Actualizar tipos"
              loading={h.refreshing}
              disabled={h.refreshing}
              onPress={() => void h.refrescar()}
            />
            <Visibility action="Crear">
              <Button title={"Nueva Transaccion"} onPress={openCreate} />
            </Visibility>
          </View>
        </View>

        <View style={styles.filters}>
          <View style={styles.filterItem}>
            <Select<NaturalezaTransaccion | "">
              label="Naturaleza"
              value={h.naturaleza}
              options={[
                { label: "Todas", value: "" },
                { label: "Ingreso", value: "Ingreso" },
                { label: "Egreso", value: "Egreso" },
              ]}
              onValueChange={(v) => {
                h.setNaturaleza(v);
                h.setPage(1);
              }}
              modalTitle="Naturaleza"
            />
          </View>
          <View style={[styles.filterItem, { flexGrow: 2 }]}>
            <ThemedText
              style={[styles.filterLabel, { color: c.textSecondary }]}
            >
              Buscar (código o nombre)
            </ThemedText>
            <SearchBar
              value={h.buscar}
              onChangeText={h.setBuscar}
              placeholder="VENTA, gasto..."
            />
          </View>
        </View>

        <Visibility action="Ver">
          <View style={styles.tableContainer}>
            <Table<TipoTransaccion>
              data={h.items}
              columns={tipoColumns}
              loading={h.loading}
              scrollEnabled={false}
              columnGap={1}
              horizontalPadding={5}
              cellPaddingHorizontal={2}
              keyExtractor={(item) => String(item.id)}
              emptyMessage="Sin tipos."
              emptyComponent={null}
              renderCell={(item, column, rowIndex) => {
                switch (column.key) {
                  case "nro": {
                    const numero = (h.page - 1) * h.perPage + rowIndex + 1;
                    return (
                      <Text style={[styles.cellText, { color: c.textMuted }]}>
                        {numero}
                      </Text>
                    );
                  }
                  case "codigo":
                    return (
                      <Text
                        numberOfLines={1}
                        style={[styles.cellBold, { color: c.text }]}
                      >
                        {item.codigo}
                      </Text>
                    );
                  case "nombre":
                    return (
                      <Text
                        numberOfLines={2}
                        ellipsizeMode="tail"
                        style={[styles.cellText, { color: c.textSecondary }]}
                      >
                        {item.transaccion}
                      </Text>
                    );
                  case "naturaleza":
                    return (
                      <Badge
                        label={item.tipo_transaccion}
                        variant={
                          item.tipo_transaccion === "Ingreso"
                            ? "success"
                            : "warning"
                        }
                      />
                    );
                  case "acciones":
                    return (
                      <View style={styles.accionesCell}>
                        <Visibility action="Editar">
                          <IconButton
                            icon={Pencil}
                            size="sm"
                            variant="secondary"
                            accessibilityLabel={`Editar ${item.codigo}`}
                            onPress={() => openEdit(item)}
                          />
                        </Visibility>
                        <Visibility action="Eliminar">
                          <IconButton
                            icon={Trash2}
                            size="sm"
                            variant="destructive"
                            accessibilityLabel={`Eliminar ${item.codigo}`}
                            loading={h.deletingId === item.id}
                            disabled={h.deletingId === item.id}
                            onPress={async () => {
                              const ok = await confirmLocal.ask({
                                title: "Eliminar tipo",
                                message: `¿Eliminar "${item.codigo}"? Falla si tiene movimientos (delete físico).`,
                                variant: "danger",
                                confirmText: "Eliminar",
                              });
                              if (!ok) return;
                              try {
                                await h.eliminar(item.id);
                              } finally {
                                confirmLocal.closeConfirm();
                              }
                            }}
                          />
                        </Visibility>
                      </View>
                    );
                  default:
                    return null;
                }
              }}
            />
          </View>
          <Pagination
            meta={{ total: h.total, page: h.page, perPage: h.perPage }}
            onPageChange={h.setPage}
            itemLabel="tipos"
          />
        </Visibility>
      </Card>

      <TipoTransaccionFormModal
        visible={modalVisible}
        actual={actual}
        saving={h.saving}
        onClose={() => setModalVisible(false)}
        onSave={(payload) => h.guardar(payload, actual?.id)}
      />

      <ConfirmModal
        state={confirmLocal.confirmState}
        busy={confirmLocal.confirmBusy}
        onCancel={confirmLocal.handleCancel}
        onConfirm={confirmLocal.handleConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 1500,
    alignSelf: "center",
    padding: 18,
    gap: 16,
    flexGrow: 1,
  },
  tabBody: { gap: 12 },
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  toolbarTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  toolbarActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  listTitle: { fontSize: 17, fontWeight: "900" },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  filterItem: { flex: 1, minWidth: 170 },
  filterLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  tableContainer: { width: "100%" },
  cellText: { fontSize: 12, textAlign: "center" },
  cellBold: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  cellMonto: { fontSize: 12, fontWeight: "800", textAlign: "center" },
  accionesCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexWrap: "nowrap",
  },
});

export default ArqueoScreen;
