import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useTheme } from "@/theme/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { Table, TableColumn } from "@/components/Table";
import { Pagination, PaginationMeta } from "@/components/ui/Pagination";
import { Visibility } from "@/components/Visibility";
import { usePermiso } from "@/hooks/usePermiso";
import { haptics } from "@/animations/haptics";
import { usePasajesStore } from "@/screens/user/pasajes/store/pasajesStore";
import { Viaje, ViajeEstado, Venta, Asiento } from "./types/pasajes.types";
import { useViajes } from "./hooks/useViajes";
import { useAsientos } from "./hooks/useAsientos";
import { useVenta } from "./hooks/useVenta";
import { invalidarCacheAsientos } from "./services/pasajes.service";
import { compartirPdfVenta } from "./utils/compartirPdfVenta";
import { BusMap } from "./components/BusMap";
import { FormularioPasajero } from "./components/FormularioPasajero";
import { ResumenCompra } from "./components/ResumenCompra";
import { MetodoPagoSelector } from "./components/MetodoPagoSelector";
import { ModalNuevoViaje } from "./components/ModalNuevoViaje";
import {
  ModalCambioEstadoViaje,
  TRANSICIONES_ESTADO_VIAJE,
} from "./components/ModalCambioEstadoViaje";
import { ModalVentaExitosa } from "./components/ModalVentaExitosa";
import {
  ArrowLeftRight,
  ArrowRightCircle,
  Bus,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Pencil,
} from "lucide-react-native";

enum Paso {
  BuscarViaje = 1,
  SeleccionAsientos = 2,
  DatosYPago = 3,
}

type FiltroViaje = "TODOS" | ViajeEstado;

const PER_PAGE = 10;

const viajeColumns: TableColumn[] = [
  { key: "ruta", label: "Ruta", flex: 1.6, align: "center" },
  { key: "hora", label: "Hora Salida", flex: 0.9, align: "center" },
  { key: "vehiculo", label: "Vehículo", flex: 1.1, align: "center" },
  { key: "chofer", label: "Chofer", flex: 1.2, align: "center" },
  { key: "tarifa", label: "Tarifa", flex: 0.85, align: "center" },
  { key: "estado", label: "Estado", flex: 0.9, align: "center" },
  { key: "acciones", label: "Acciones", flex: 0.95, align: "center" },
];

export function PasajesScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { isDesktop } = useResponsive();

  // Estado global Zustand
  const {
    viajeSeleccionado,
    setViajeSeleccionado,
    asientosSeleccionados,
    toggleAsiento,
    clearAsientos,
    pasajeros,
    actualizarPasajero,
    resetPasajeros,
    precios,
    setPrecios,
    setPrecioAsiento,
    aplicarPrecioATodos,
    metodoPago,
    setMetodoPago,
  } = usePasajesStore();

  const [pasoActual, setPasoActual] = useState<Paso>(Paso.BuscarViaje);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroViaje>("TODOS");
  const [pagina, setPagina] = useState(1);
  const [modalCrearViaje, setModalCrearViaje] = useState(false);
  const [viajeEstadoModal, setViajeEstadoModal] = useState<Viaje | null>(null);
  const [ventaExitosa, setVentaExitosa] = useState<Venta | null>(null);

  const { viajes, loading, error, refetch } = useViajes();
  const {
    pisos,
    loading: loadingAsientos,
    refetch: refetchAsientos,
  } = useAsientos(viajeSeleccionado?.id ?? null);
  const {
    loading: loadingVenta,
    ventaActual,
    iniciar,
    confirmar,
    cancelar,
    anular,
    cambiarAsientoDetalle,
    eliminarDetalleVenta,
    limpiarVenta,
  } = useVenta();

  const puedeVer = usePermiso("Ventas", "Pasajes", "Ver");

  /*
  |--------------------------------------------------------------------------
  | FILTROS LOCALES DEL PASO 1 (BÚSQUEDA + ESTADO)
  |--------------------------------------------------------------------------
  */

  const resumen = useMemo(
    () => ({
      total: viajes.length,
      vendiendo: viajes.filter((v) => v.estado === "Vendiendo").length,
      enCurso: viajes.filter((v) => v.estado === "En curso").length,
      finalizado: viajes.filter((v) => v.estado === "Finalizado").length,
    }),
    [viajes],
  );

  const viajesFiltrados = useMemo(() => {
    let lista = viajes;
    if (filtroEstado !== "TODOS") {
      lista = lista.filter((v) => v.estado === filtroEstado);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      lista = lista.filter((v) =>
        [v.origen, v.destino, v.vehiculo, v.chofer, v.estado, v.tarifa]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return lista;
  }, [viajes, filtroEstado, search]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(viajesFiltrados.length / PER_PAGE),
  );
  const paginaActual = Math.min(pagina, totalPaginas);

  const viajesPagina = useMemo(
    () =>
      viajesFiltrados.slice(
        (paginaActual - 1) * PER_PAGE,
        paginaActual * PER_PAGE,
      ),
    [viajesFiltrados, paginaActual],
  );

  const paginationMeta: PaginationMeta = {
    total: viajesFiltrados.length,
    page: paginaActual,
    perPage: PER_PAGE,
  };

  const filtroTexto =
    filtroEstado === "TODOS" ? "Todos" : filtroEstado;

  const handleChangeFiltro = (f: FiltroViaje) => {
    haptics.selection();
    setFiltroEstado(f);
    setPagina(1);
  };

  const handleChangeSearch = (texto: string) => {
    setSearch(texto);
    setPagina(1);
  };

  const handleIrAPagina = (p: number) => {
    haptics.selection();
    setPagina(p);
  };

  /*
  |--------------------------------------------------------------------------
  | FLUJO DEL WIZARD
  |--------------------------------------------------------------------------
  */

  const handleSeleccionarViaje = (viaje: Viaje) => {
    haptics.selection();
    setViajeSeleccionado(viaje);
    setPasoActual(Paso.SeleccionAsientos);
  };

  const handleSeleccionarAsientos = async () => {
    if (asientosSeleccionados.length === 0) return;
    if (!viajeSeleccionado) return;
    haptics.selection();
    try {
      // Si existe una venta pendiente previa, se cancela defensivamente
      // para liberar los asientos reservados antes de iniciar una nueva.
      if (ventaActual && ventaActual.estado === "Pendiente") {
        await cancelar();
        invalidarCacheAsientos(viajeSeleccionado.id);
        void refetchAsientos();
      }
      const asientosPayload = asientosSeleccionados.map((a) => ({
        id_asiento: a.id,
        precio_unitario: parseFloat(viajeSeleccionado.tarifa),
      }));
      await iniciar(viajeSeleccionado.id, asientosPayload);
    } catch {
      haptics.error();
      return;
    }
    haptics.light();
    // Inicializar pasajeros
    resetPasajeros(asientosSeleccionados.length);
    // Inicializar precios con tarifa base
    const tarifa = parseFloat(viajeSeleccionado.tarifa) || 0;
    const nuevosPrecios: { [asientoId: number]: number } = {};
    asientosSeleccionados.forEach((a) => {
      nuevosPrecios[a.id] = tarifa;
    });
    setPrecios(nuevosPrecios);
    setPasoActual(Paso.DatosYPago);
  };

  const handleConfirmarPago = async (metodo: "qr" | "tarjeta" | "efectivo") => {
    try {
      const formaPago =
        metodo === "qr"
          ? "QR Simple"
          : metodo === "tarjeta"
            ? "Tarjeta"
            : "Efectivo";
      const venta = await confirmar(formaPago);
      haptics.success();
      setVentaExitosa(venta);
    } catch {
      haptics.error();
    }
  };

  const handleBack = async () => {
    haptics.selection();
    if (pasoActual === Paso.SeleccionAsientos) {
      setViajeSeleccionado(null);
      clearAsientos();
      setPasoActual(Paso.BuscarViaje);
    } else if (pasoActual === Paso.DatosYPago) {
      // Si hay una venta pendiente (asientos reservados), se cancela para liberarlos.
      if (ventaActual && ventaActual.estado === "Pendiente") {
        try {
          await cancelar();
        } catch {
          // Se permite volver aunque la cancelación falle.
        }
        if (viajeSeleccionado) {
          invalidarCacheAsientos(viajeSeleccionado.id);
          void refetchAsientos();
        }
      }
      setPasoActual(Paso.SeleccionAsientos);
    }
  };

  const handleViajeCreado = () => {
    refetch();
  };

  /*
  |--------------------------------------------------------------------------
  | GESTIÓN DE LA VENTA REGISTRADA (FASE 2)
  |--------------------------------------------------------------------------
  */

  const limpiarFlujo = () => {
    resetPasajeros(0);
    clearAsientos();
    setViajeSeleccionado(null);
    setVentaExitosa(null);
    setPasoActual(Paso.BuscarViaje);
    limpiarVenta();
  };

  const handleCompartirPdf = async () => {
    if (!ventaExitosa) return;
    await compartirPdfVenta(ventaExitosa.id);
  };

  const handleAnularVenta = async () => {
    if (!ventaExitosa) return;
    await anular();
    invalidarCacheAsientos(ventaExitosa.id_viaje);
    void refetchAsientos();
    limpiarFlujo();
  };

  const handleCambiarAsientoModal = async (
    detalleId: number,
    nuevoIdAsiento: number,
  ) => {
    const venta = await cambiarAsientoDetalle(detalleId, nuevoIdAsiento);
    setVentaExitosa(venta);
    invalidarCacheAsientos(venta.id_viaje);
    void refetchAsientos();
  };

  const handleEliminarDetalleModal = async (detalleId: number) => {
    const venta = await eliminarDetalleVenta(detalleId);
    setVentaExitosa(venta);
    invalidarCacheAsientos(venta.id_viaje);
    void refetchAsientos();
  };

  /*
  |--------------------------------------------------------------------------
  | ASIENTOS LIBRES (PARA CAMBIAR DE ASIENTO)
  |--------------------------------------------------------------------------
  */

  const asientosLibres = useMemo(() => {
    const resultado: Asiento[] = [];
    pisos.forEach((piso) => {
      piso.asientos.forEach((asiento) => {
        if (
          asiento.tipo_celda === "pasajero" &&
          asiento.estado_ocupacion === "libre"
        ) {
          resultado.push(asiento);
        }
      });
    });
    return resultado;
  }, [pisos]);

  /*
  |--------------------------------------------------------------------------
  | TARJETAS RESUMEN
  |--------------------------------------------------------------------------
  */

  const tarjetasResumen: {
    id: FiltroViaje;
    icono: React.ComponentType<{ size?: number; color?: string }>;
    label: string;
    valor: number;
    color: string;
  }[] = [
    {
      id: "TODOS",
      icono: Bus,
      label: "Total",
      valor: resumen.total,
      color: c.primary,
    },
    {
      id: "Vendiendo",
      icono: CircleDollarSign,
      label: "Vendiendo",
      valor: resumen.vendiendo,
      color: c.success,
    },
    {
      id: "En curso",
      icono: Clock,
      label: "En curso",
      valor: resumen.enCurso,
      color: c.info,
    },
    {
      id: "Finalizado",
      icono: CheckCircle2,
      label: "Finalizado",
      valor: resumen.finalizado,
      color: c.textMuted,
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | RENDER DE PASOS
  |--------------------------------------------------------------------------
  */

  const renderStep = () => {
    switch (pasoActual) {
      case Paso.BuscarViaje:
        return (
          <View style={[styles.stepContainer, styles.stepFill]}>
            <PageHeader
              title="Pasajes"
              description="Selecciona un viaje disponible para vender boletos, o crea uno nuevo."
              badge={`${viajesFiltrados.length} · ${filtroTexto}`}
              rightContent={
                <View style={styles.headerActions}>
                  <Visibility
                    action="Ver"
                    selector=".pasajes-refrescar"
                  >
                    <Button
                      title="Actualizar"
                      variant="secondary"
                      loading={loading}
                      onPress={() => void refetch()}
                    />
                  </Visibility>
                  <Visibility
                    action="Crear"
                    selector=".pasajes-crear"
                  >
                    <Button
                      title="Nuevo viaje"
                      onPress={() => setModalCrearViaje(true)}
                    />
                  </Visibility>
                </View>
              }
            />

            <View style={styles.summary}>
              {tarjetasResumen.map((tarjeta) => {
                const activo = filtroEstado === tarjeta.id;
                const Icono = tarjeta.icono;
                return (
                  <Pressable
                    key={tarjeta.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activo }}
                    onPress={() => handleChangeFiltro(tarjeta.id)}
                    style={({ pressed }) => [
                      styles.summaryPressable,
                      { opacity: pressed ? 0.78 : 1 },
                    ]}
                  >
                    <Card
                      style={[
                        styles.summaryCard,
                        activo
                          ? { borderColor: c.primary, borderWidth: 2 }
                          : null,
                      ]}
                    >
                      <Icono size={20} color={tarjeta.color} />
                      <View style={styles.summaryContent}>
                        <Text
                          style={[styles.summaryValue, { color: c.text }]}
                        >
                          {tarjeta.valor}
                        </Text>
                        <Text
                          style={{ color: c.textSecondary, fontSize: 12 }}
                        >
                          {tarjeta.label}
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>

            <SearchBar
              value={search}
              onChangeText={handleChangeSearch}
              placeholder="Buscar por origen, destino, vehículo, chofer..."
            />

            {error && !loading ? (
              <Text style={{ color: c.destructive, textAlign: "center" }}>
                {error}
              </Text>
            ) : null}

            <View style={styles.tableContainer}>
              <Table<Viaje>
                data={viajesPagina}
                columns={viajeColumns}
                loading={loading}
                columnGap={1}
                horizontalPadding={5}
                cellPaddingHorizontal={2}
                keyExtractor={(item) => String(item.id)}
                emptyMessage="No se encontraron viajes para este filtro."
                renderCell={(item, column) => {
                  switch (column.key) {
                    case "ruta":
                      return (
                        <View style={styles.cellRoute}>
                          <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={[
                              styles.cellBold,
                              { color: c.text, flexShrink: 1 },
                            ]}
                          >
                            {item.origen}
                          </Text>
                          <ArrowLeftRight
                            size={12}
                            color={c.textMuted}
                          />
                          <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={[
                              styles.cellBold,
                              { color: c.text, flexShrink: 1 },
                            ]}
                          >
                            {item.destino}
                          </Text>
                        </View>
                      );

                    case "hora": {
                      const fecha = new Date(item.hora_salida);
                      const hora = fecha.toLocaleTimeString("es-BO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <Text style={[styles.cellText, { color: c.textSecondary }]}>
                          {hora}
                        </Text>
                      );
                    }

                    case "vehiculo":
                      return (
                        <Text
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          style={[styles.cellBold, { color: c.text }]}
                        >
                          {item.vehiculo}
                        </Text>
                      );

                    case "chofer":
                      return (
                        <Text
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          style={[styles.cellText, { color: c.textSecondary }]}
                        >
                          {item.chofer}
                        </Text>
                      );

                    case "tarifa":
                      return (
                        <Text style={[styles.cellTarifa, { color: c.primary }]}>
                          Bs. {item.tarifa}
                        </Text>
                      );

                    case "estado":
                      return (
                        <Badge
                          label={item.estado}
                          variant={
                            item.estado === "Vendiendo"
                              ? "success"
                              : item.estado === "En curso"
                                ? "info"
                                : item.estado === "Cancelado"
                                  ? "destructive"
                                  : "muted"
                          }
                        />
                      );

case "acciones":
  return (
    <View style={styles.accionesCell}>
      <IconButton
        icon={ArrowRightCircle}
        variant="primary"
        size="sm"
        disabled={item.estado !== "Vendiendo"}
        onPress={() => handleSeleccionarViaje(item)}
        accessibilityLabel={`Seleccionar viaje ${item.origen} → ${item.destino}`}
      />
      {TRANSICIONES_ESTADO_VIAJE[item.estado].length > 0 ? (
        <Visibility action="Editar" selector=".pasajes-estado">
          <IconButton
            icon={Pencil}
            variant="secondary"
            size="sm"
            onPress={() => setViajeEstadoModal(item)}
            accessibilityLabel={`Cambiar estado del viaje ${item.origen} → ${item.destino}`}
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
              meta={paginationMeta}
              onPageChange={handleIrAPagina}
              itemLabel="viajes"
            />
          </View>
        );

      case Paso.SeleccionAsientos:
        return (
          <View style={[styles.stepContainer, styles.stepFill]}>
            <View style={styles.stepHeader}>
              <Text style={[styles.stepTitle, { color: c.text }]}>
                Selecciona tus asientos
              </Text>
              <Badge
                label={`${asientosSeleccionados.length} seleccionados`}
                variant="info"
              />
            </View>
            {loadingAsientos ? (
              <ActivityIndicator color={c.primary} />
            ) : (
              <BusMap
                pisos={pisos}
                asientosSeleccionados={asientosSeleccionados}
                onToggleSeleccion={toggleAsiento}
              />
            )}
            <View style={styles.bottomBar}>
              <Button
                title="Volver"
                variant="secondary"
                onPress={handleBack}
              />
              <Visibility action="Crear" selector=".pasajes-continuar">
                <Button
                  title="Continuar"
                  loading={loadingVenta}
                  disabled={asientosSeleccionados.length === 0}
                  onPress={handleSeleccionarAsientos}
                />
              </Visibility>
            </View>
          </View>
        );

      case Paso.DatosYPago:
        return (
          <View style={[styles.stepContainer, styles.stepFill]}>
            <View style={styles.stepHeader}>
              <Text style={[styles.stepTitle, { color: c.text }]}>
                Datos de Pasajeros y Pago
              </Text>
              <Badge
                label={`${asientosSeleccionados.length} pasajeros`}
                variant="info"
              />
            </View>
            <View style={isDesktop ? styles.twoColumns : styles.oneColumn}>
              <View style={styles.leftColumn}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pasajerosList}
                >
                  {asientosSeleccionados.map((asiento, index) => (
                    <FormularioPasajero
                      key={asiento.id}
                      titulo={`Pasajero ${index + 1}`}
                      asientoLabel={`Asiento ${asiento.numero_asiento ?? asiento.id}`}
                      datos={pasajeros[index]}
                      onChange={(campo, valor) =>
                        actualizarPasajero(index, campo, valor)
                      }
                      esPrincipal={index === 0}
                      precio={
                        precios[asiento.id] ??
                        parseFloat(viajeSeleccionado?.tarifa ?? "0")
                      }
                      onPrecioChange={(precio) =>
                        setPrecioAsiento(asiento.id, precio)
                      }
                      onTodosIguales={aplicarPrecioATodos}
                    />
                  ))}
                </ScrollView>
              </View>
<ScrollView
  style={styles.rightColumn}
  contentContainerStyle={styles.rightColumnContent}
  showsVerticalScrollIndicator={false}
>
  <ResumenCompra
    viaje={viajeSeleccionado}
    asientos={asientosSeleccionados}
    precios={precios}
  />
  <MetodoPagoSelector
    onSelect={setMetodoPago}
    valorInicial={metodoPago}
  />
  <Visibility action="Editar" selector=".pasajes-confirmar">
    <Button
      title="Confirmar y Pagar"
      loading={loadingVenta}
      onPress={() => handleConfirmarPago(metodoPago)}
    />
  </Visibility>
</ScrollView>
            </View>
            <View style={styles.bottomBar}>
              <Button
                title="Volver"
                variant="secondary"
                onPress={handleBack}
              />
            </View>
          </View>
        );
    }
  };

  if (!puedeVer) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <Text style={{ color: c.destructive }}>
          No tienes permiso para ver pasajes
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      {renderStep()}

      <ModalNuevoViaje
        visible={modalCrearViaje}
        onClose={() => setModalCrearViaje(false)}
        onViajeCreado={handleViajeCreado}
      />

      <ModalCambioEstadoViaje
        visible={viajeEstadoModal !== null}
        viaje={viajeEstadoModal}
        onClose={() => setViajeEstadoModal(null)}
        onCambiado={handleViajeCreado}
      />

      <ModalVentaExitosa
        venta={ventaExitosa}
        asientosLibres={asientosLibres}
        onClose={limpiarFlujo}
        onListo={limpiarFlujo}
        onCompartirPdf={handleCompartirPdf}
        onAnular={handleAnularVenta}
        onCambiarAsiento={handleCambiarAsientoModal}
        onEliminarDetalle={handleEliminarDetalleModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    padding: 18,
    gap: 12,
  },
  stepContainer: {
    gap: 16,
  },
  stepFill: {
    flex: 1,
    minHeight: 0,
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summary: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryPressable: {
    flex: 1,
    minWidth: 170,
  },
  summaryCard: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryContent: {
    gap: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "900",
  },
  tableContainer: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    overflow: "hidden",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  twoColumns: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
    minWidth: 0,
    minHeight: 0,
  },
  oneColumn: {
    flex: 1,
    flexDirection: "column",
    gap: 16,
    minWidth: 0,
    minHeight: 0,
  },
  leftColumn: {
    flex: 2.7,
    gap: 16,
    minWidth: 0,
    minHeight: 0,
  },
  rightColumn: {
    flex: 2.3,
    gap: 12,
    minWidth: 0,
    minHeight: 0,
  },
  rightColumnContent: {
    gap: 12,
    paddingBottom: 4,
  },
  pasajerosList: {
    gap: 12,
    paddingBottom: 4,
  },
  cellRoute: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 0,
  },
  cellText: {
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  cellBold: {
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
  },
  cellTarifa: {
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  selectButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  accionesCell: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});