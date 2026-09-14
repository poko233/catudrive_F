import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
} from "react-native";
import { Skeleton } from "moti/skeleton";
import Toast from "react-native-toast-message";
import { useTheme } from "@/theme/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { Table, TableColumn } from "@/components/Table";
import { Pagination, PaginationMeta } from "@/components/ui/Pagination";
import { Visibility } from "@/components/Visibility";
import { usePermiso } from "@/hooks/usePermiso";
import { haptics } from "@/animations/haptics";
import {
  PrinterConnectionProvider,
  PrinterSetupModal,
  usePrinterConnection,
} from "@/components/PrinterConnection";
import { usePasajesStore } from "@/screens/user/pasajes/store/pasajesStore";
import {
  Viaje,
  ViajeEstado,
  Venta,
  Asiento,
  ConfirmarPasajero,
} from "./types/pasajes.types";
import { useViajes } from "./hooks/useViajes";
import { useAsientos } from "./hooks/useAsientos";
import { useVenta } from "./hooks/useVenta";
import { invalidarCacheAsientos } from "./services/pasajes.service";
import {
  getVenta as obtenerVentaDetalle,
  invalidarCacheVenta,
  anularVenta as anularVentaDetalle,
  cambiarAsiento as cambiarAsientoDetalleService,
  eliminarDetalle as eliminarDetalleDetalleService,
} from "./services/pasajes.service";
import { compartirPdfVenta } from "./utils/compartirPdfVenta";
import {
  ThermalHtmlRasterizer,
  ThermalHtmlRasterizerHandle,
} from "./components/ThermalHtmlRasterizer";
import { BusMap } from "./components/BusMap";
import { PasoStepper } from "./components/PasoStepper";
import { FormularioPasajero } from "./components/FormularioPasajero";
import { ResumenCompra } from "./components/ResumenCompra";
import { MetodoPagoSelector } from "./components/MetodoPagoSelector";
import { ModalNuevoViaje } from "./components/ModalNuevoViaje";
import { ModalConsultarVenta } from "./components/ModalConsultarVenta";
import {
  ModalCambioEstadoViaje,
  TRANSICIONES_ESTADO_VIAJE,
} from "./components/ModalCambioEstadoViaje";
import { ModalVentaExitosa } from "./components/ModalVentaExitosa";
import {
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

const DEBOUNCE_BUSQUEDA_MS = 500;

const PASAJES_PRINTER_REQUIREMENT = {
  type: "receipt",
  paperSize: "receipt-58",
} as const;

const viajeColumns: TableColumn[] = [
  { key: "nro", label: "N.º", flex: 0.45, align: "center" },
  { key: "ruta", label: "Ruta", flex: 2, align: "center" },
  { key: "hora", label: "Hora Salida", flex: 0.85, align: "center" },
  { key: "vehiculo", label: "Vehículo", flex: 1, align: "center" },
  { key: "chofer", label: "Chofer", flex: 1.1, align: "center" },
  { key: "tarifa", label: "Tarifa", flex: 0.8, align: "center" },
  { key: "estado", label: "Estado", flex: 0.85, align: "center" },
  { key: "acciones", label: "Acciones", flex: 0.9, align: "center" },
];

export function PasajesScreen() {
  return (
    <PrinterConnectionProvider
      autoConnect
      detectSunmiOnStart
    >
      <PasajesScreenContent />
    </PrinterConnectionProvider>
  );
}

function PasajesScreenContent() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { isDesktop } = useResponsive();
  const thermalRasterizerRef =
    useRef<ThermalHtmlRasterizerHandle | null>(
      null,
    );
  const {
    loading: printerLoading,
    configurationRequired,
    getDefaultPrinterForRequirement,
    requestPrinter,
    print: printWithConfiguredPrinter,
  } = usePrinterConnection();

  const pasajesDefaultPrinter =
    getDefaultPrinterForRequirement(
      PASAJES_PRINTER_REQUIREMENT,
    );

  // Estado global Zustand
  const {
    viajeSeleccionado,
    setViajeSeleccionado,
    asientosSeleccionados,
    toggleAsiento,
    clearAsientos,
    setAsientosSeleccionados,
    pasajeros,
    actualizarPasajero,
    aplicarDatoATodos,
    resetPasajeros,
    precios,
    setPrecios,
    setPrecioAsiento,
    aplicarPrecioATodos,
    metodoPago,
    setMetodoPago,
  } = usePasajesStore();

  const [pasoActual, setPasoActual] = useState<Paso>(Paso.BuscarViaje);
  const [textoOrigen, setTextoOrigen] = useState("");
  const [textoDestino, setTextoDestino] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroViaje>("TODOS");
  const [modalCrearViaje, setModalCrearViaje] = useState(false);
  const [viajeEstadoModal, setViajeEstadoModal] = useState<Viaje | null>(null);
  const [ventaExitosa, setVentaExitosa] = useState<Venta | null>(null);
  const [ventaEsNueva, setVentaEsNueva] = useState(false);
  const [erroresPasajeros, setErroresPasajeros] = useState<(string | null)[]>(
    [],
  );
  const [modalConsultarVenta, setModalConsultarVenta] = useState(false);
  const [consultandoVenta, setConsultandoVenta] = useState(false);
  const [volviendo, setVolviendo] = useState(false);
  // Detalle de venta de un asiento vendido (solo lectura contextual:
  // no toca la ventaActual del flujo de compra en curso).
  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [printerSetupVisible, setPrinterSetupVisible] = useState(false);

  const {
    viajes,
    loading,
    error,
    meta,
    perPage,
    changeFiltros,
    goToPage,
    refetch,
  } = useViajes();

  const asientosId = viajeSeleccionado?.id ?? ventaExitosa?.id_viaje ?? null;

  const {
    pisos,
    loading: loadingAsientos,
    refetch: refetchAsientos,
  } = useAsientos(asientosId);
  const {
    loading: loadingVenta,
    ventaActual,
    iniciar,
    cargarVenta,
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
  | IMPRESORA: MOSTRAR CONFIGURACIÓN SOLO CUANDO HACE FALTA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (Platform.OS === "web" || printerLoading) {
      return;
    }

    if (configurationRequired || !pasajesDefaultPrinter) {
      requestPrinter(
        PASAJES_PRINTER_REQUIREMENT,
        !pasajesDefaultPrinter
          ? "No hay una impresora configurada para tickets de 58 mm."
          : undefined,
      );

      setPrinterSetupVisible(true);
    }
  }, [
    configurationRequired,
    pasajesDefaultPrinter,
    printerLoading,
    requestPrinter,
  ]);

  /*
  |--------------------------------------------------------------------------
  | FILTROS SERVIDOR (BUSCADOR ORIGEN/DESTINO + ESTADO)
  |--------------------------------------------------------------------------
  |
  | Todo filtro pega al endpoint multiparamétrico del backend
  | (LIKE en origen/destino, estado exacto) y vuelve a la
  | página 1. El texto lleva debounce para no pedir por tecla.
  |
  */

  const filtrosRef = useRef({
    textoOrigen: "",
    textoDestino: "",
    filtroEstado: "TODOS" as FiltroViaje,
  });
  filtrosRef.current = { textoOrigen, textoDestino, filtroEstado };

  const aplicarFiltrosServidor = (
    origen: string,
    destino: string,
    estado: FiltroViaje,
  ) => {
    changeFiltros({
      origen: origen.trim() ? origen.trim() : undefined,
      destino: destino.trim() ? destino.trim() : undefined,
      estado: estado === "TODOS" ? undefined : estado,
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const actual = filtrosRef.current;
      aplicarFiltrosServidor(
        actual.textoOrigen,
        actual.textoDestino,
        actual.filtroEstado,
      );
    }, DEBOUNCE_BUSQUEDA_MS);
    return () => clearTimeout(timer);
    // Solo depende del texto: el estado dispara directo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textoOrigen, textoDestino]);

  /*
  |--------------------------------------------------------------------------
  | TARJETAS RESUMEN (SIN PETICIONES EXTRA)
  |--------------------------------------------------------------------------
  |
  | Total sale del meta.total de la lista (exacto y gratis).
  | Cada tarjeta de estado cuenta lo cargado en la tabla y,
  | si ese estado es el filtro activo, usa meta.total exacto.
  | Al pulsar una tarjeta recién se pide esa lista al backend.
  |
  */

  const totalExacto = meta?.total ?? 0;

  const resumen = useMemo(() => {
    const contar = (estado: ViajeEstado) =>
      viajes.filter((v) => v.estado === estado).length;
    return {
      total: totalExacto,
      vendiendo:
        filtroEstado === "Vendiendo" ? totalExacto : contar("Vendiendo"),
      enCurso: filtroEstado === "En curso" ? totalExacto : contar("En curso"),
      finalizado:
        filtroEstado === "Finalizado" ? totalExacto : contar("Finalizado"),
    };
  }, [viajes, totalExacto, filtroEstado]);

  const paginationMeta: PaginationMeta = {
    total: meta?.total ?? 0,
    page: meta?.current_page ?? 1,
    perPage: meta?.per_page ?? perPage,
  };

  const filtroTexto = filtroEstado === "TODOS" ? "Todos" : filtroEstado;

  const handleChangeFiltro = (f: FiltroViaje) => {
    haptics.selection();
    setFiltroEstado(f);
    aplicarFiltrosServidor(textoOrigen, textoDestino, f);
  };

  const handleIrAPagina = (p: number) => {
    haptics.selection();
    goToPage(p);
  };

  /*
  |--------------------------------------------------------------------------
  | SALIDA REAL DE IMPRESIÓN (WEB / IMPRESORA CONFIGURADA)
  |--------------------------------------------------------------------------
  |
  | La llama ModalImprimirTicket cuando su visual llega a
  | "complete". Devuelve los ms reales que tomó la salida.
  |
  | Web: se abre la pestaña con el blob HTML en ese momento
  | (si el navegador la bloquea, se avisa para permitir popups).
  | Nativo: utiliza la impresora predeterminada compatible con el formato.
  |
  */

  const imprimirHtmlReal = useCallback(
  async (html: string): Promise<number> => {
    const inicio = Date.now();

    try {
      /*
      |--------------------------------------------------------------------------
      | WEB
      |--------------------------------------------------------------------------
      */

      if (Platform.OS === "web") {
        const blob =
          new Blob(
            [html],
            {
              type: "text/html",
            },
          );

        const url =
          URL.createObjectURL(
            blob,
          );

        const win =
          window.open(
            url,
            "_blank",
            "width=400,height=600",
          );

        if (!win) {
          throw new Error(
            "El navegador bloqueó la pestaña. Permite ventanas emergentes e inténtalo de nuevo.",
          );
        }

        setTimeout(
          () =>
            URL.revokeObjectURL(
              url,
            ),
          60000,
        );

        return (
          Date.now() -
          inicio
        );
      }

      /*
      |--------------------------------------------------------------------------
      | ANDROID / IOS
      |--------------------------------------------------------------------------
      |
      | El HTML viene directamente de:
      |
      | resources/views/pasajes/ticket-thermal.blade.php
      |
      | Lo convertimos a imagen raster para SUNMI / Bluetooth / TCP.
      |
      */

      const rasterizer =
        thermalRasterizerRef.current;

      if (!rasterizer) {
        throw new Error(
          "El renderizador térmico todavía no está disponible.",
        );
      }

      const rasterImage =
        await rasterizer.captureHtml(
          html,
        );

      /*
      |--------------------------------------------------------------------------
      | TRABAJO DE IMPRESIÓN
      |--------------------------------------------------------------------------
      |
      | system:
      |   utiliza html
      |
      | SUNMI:
      |   utiliza rasterImage
      |
      | Bluetooth:
      |   utiliza rasterImage
      |
      | TCP:
      |   utiliza rasterImage
      |
      */

      await printWithConfiguredPrinter({
        type:
          "receipt",

        paperSize:
          "receipt-58",

        html,

        rasterImage,

        copies:
          1,

        cutPaper:
          true,

        sunmi: {
          feedLines:
            4,

          imageMode:
            "binary",
        },
      });
    } catch (err: any) {
      if (
        Platform.OS !==
        "web"
      ) {
        setPrinterSetupVisible(
          true,
        );
      }

      Toast.show({
        type:
          "error",

        text1:
          "No se pudo imprimir",

        text2:
          err?.message ||
          "Revisa o selecciona la impresora e inténtalo nuevamente.",
      });

      throw err;
    }

    return (
      Date.now() -
      inicio
    );
  },
  [
    printWithConfiguredPrinter,
  ],
);
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
    } catch (err: any) {
      haptics.error();
      Toast.show({
        type: "error",
        text1: "No se pudieron reservar los asientos",
        text2: err?.message || "Algunos asientos ya no están disponibles.",
      });
      // El estado de ocupación cambió en el servidor: se invalida el cache
      // y se vuelve a pedir la grilla para reflejar los asientos tomados.
      invalidarCacheAsientos(viajeSeleccionado.id);
      void refetchAsientos();
      return;
    }
    haptics.light();
    // Inicializar pasajeros
    resetPasajeros(asientosSeleccionados.length);
    setErroresPasajeros(new Array(asientosSeleccionados.length).fill(null));
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
    const formaPago =
      metodo === "qr"
        ? "QR Simple"
        : metodo === "tarjeta"
          ? "Tarjeta"
          : "Efectivo";

    // Limpia y valida los datos de los pasajeros (obligatorios).
    const datosLimpios = pasajeros.map((p) => ({
      nombres: (p?.nombres ?? "").trim(),
      apellido_paterno: (p?.apellido_paterno ?? "").trim(),
      apellido_materno: (p?.apellido_materno ?? "").trim(),
      ci: (p?.ci ?? "").trim(),
    }));

    const invalidos: number[] = [];
    datosLimpios.forEach((p, index) => {
      if (!p.nombres || !p.apellido_paterno) {
        invalidos.push(index);
      }
    });

    if (invalidos.length > 0) {
      haptics.error();
      setErroresPasajeros(
        datosLimpios.map((_, index) =>
          invalidos.includes(index)
            ? `Completa nombres y apellido paterno del pasajero ${index + 1}.`
            : null,
        ),
      );
      Toast.show({
        type: "error",
        text1: "Pasajeros incompletos",
        text2: `Revisa los datos del pasajero ${invalidos[0] + 1}.`,
      });
      return;
    }

    if (!ventaActual) {
      haptics.error();
      Toast.show({
        type: "error",
        text1: "Sin venta activa",
        text2: "Inicia la venta de nuevo.",
      });
      return;
    }

    try {
      const detallePorAsiento = new Map<number, number>();
      ventaActual.detalles.forEach((detalle) => {
        detallePorAsiento.set(detalle.asiento.id, detalle.id);
      });

      const pasajerosPayload: ConfirmarPasajero[] = asientosSeleccionados.map(
        (asiento, index) => ({
          id_detalle_venta: detallePorAsiento.get(asiento.id) ?? 0,
          nombres: datosLimpios[index].nombres,
          apellido_paterno: datosLimpios[index].apellido_paterno,
          apellido_materno: datosLimpios[index].apellido_materno || null,
          ci: datosLimpios[index].ci || null,
          precio_unitario:
            precios[asiento.id] ??
            parseFloat(
              ventaActual.detalles.find((d) => d.asiento.id === asiento.id)
                ?.precio_unitario ?? "0",
            ),
        }),
      );

      const venta = await confirmar(formaPago, pasajerosPayload);
      haptics.success();
      setVentaExitosa(venta);
      setVentaEsNueva(true);
      invalidarCacheAsientos(venta.id_viaje);
      void refetchAsientos();
    } catch (err: any) {
      haptics.error();
      Toast.show({
        type: "error",
        text1: "No se pudo confirmar la venta",
        text2: err?.message || "Intenta nuevamente.",
      });
    }
  };

  const alReanudarVentaReservada = async (asiento: Asiento) => {
    const ventaId = asiento.id_venta;
    if (ventaId === null || ventaId === undefined) {
      haptics.error();
      Toast.show({
        type: "error",
        text1: "Venta no recuperable",
        text2: "Este asiento no tiene una venta pendiente asociada.",
      });
      return;
    }
    haptics.selection();
    try {
      // Si existe otra venta pendiente previa, se cancela defensivamente
      // para liberar sus asientos antes de reanudar esta.
      if (
        ventaActual &&
        ventaActual.estado === "Pendiente" &&
        ventaActual.id !== ventaId
      ) {
        await cancelar();
      }
      const venta = await cargarVenta(ventaId);

      if (venta.estado !== "Pendiente") {
        haptics.error();
        Toast.show({
          type: "error",
          text1: "Venta no reanudable",
          text2: "Solo se puede reanudar una venta reservada.",
        });
        invalidarCacheAsientos(venta.id_viaje);
        void refetchAsientos();
        return;
      }

      // Selecciona TODOS los asientos que pertenecen a esa venta.
      const idsVenta = new Set(venta.detalles.map((d) => d.asiento.id));
      const asientosReanudados: Asiento[] = [];
      pisos.forEach((piso) => {
        piso.asientos.forEach((a) => {
          if (idsVenta.has(a.id)) asientosReanudados.push(a);
        });
      });

      if (asientosReanudados.length === 0) {
        haptics.error();
        Toast.show({
          type: "error",
          text1: "No se pudo reanudar la venta",
          text2: "La venta no tiene asientos asociados.",
        });
        return;
      }

      // El viaje de la venta para el resumen (se prefiere el de la lista
      // cargada; si no está, se construye con los datos de la venta).
      const viajeEnLista = viajes.find((v) => v.id === venta.id_viaje);
      setViajeSeleccionado(
        viajeEnLista ?? {
          id: venta.id_viaje,
          estado: "Vendiendo",
          id_vehiculo_chofer_ruta: 0,
          origen: venta.origen,
          destino: venta.destino,
          hora_salida: venta.hora_salida,
          tarifa: venta.detalles[0]?.precio_unitario ?? "0",
          vehiculo: "",
          chofer: "",
          created_at: "",
        },
      );

      clearAsientos();
      setAsientosSeleccionados(asientosReanudados);

      const preciosReanudados: { [asientoId: number]: number } = {};
      venta.detalles.forEach((detalle) => {
        preciosReanudados[detalle.asiento.id] = parseFloat(
          detalle.precio_unitario,
        );
      });
      setPrecios(preciosReanudados);

      resetPasajeros(asientosReanudados.length);
      setErroresPasajeros(new Array(asientosReanudados.length).fill(null));
      setMetodoPago("qr");

      invalidarCacheAsientos(venta.id_viaje);
      void refetchAsientos();

      setPasoActual(Paso.DatosYPago);
    } catch (err: any) {
      haptics.error();
      Toast.show({
        type: "error",
        text1: "No se pudo reanudar la venta",
        text2: err?.message || "Intenta nuevamente.",
      });
    }
  };

  const handleConsultarVenta = async (id: number) => {
    setConsultandoVenta(true);
    try {
      const venta = await cargarVenta(id);
      invalidarCacheAsientos(venta.id_viaje);
      setVentaEsNueva(false);
      setVentaExitosa(venta);
      setModalConsultarVenta(false);
    } finally {
      setConsultandoVenta(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DETALLE DE ASIENTO VENDIDO (PASO ASIENTOS)
  |--------------------------------------------------------------------------
  |
  | Al pulsar un asiento vendido se pide GET /api/pasajes/ventas/{id}
  | y se abre el modal "Venta registrada" con ese detalle.
  | Usa el servicio directo (no cargarVenta del hook) para no
  | pisar la ventaActual del flujo de compra que esté en curso.
  |
  */

  const recargarVentaDetalle = async (ventaId: number): Promise<Venta> => {
    invalidarCacheVenta(ventaId);
    const response = await obtenerVentaDetalle(ventaId);
    setVentaDetalle(response.data);
    return response.data;
  };

  const handleVerVentaAsiento = async (asiento: Asiento) => {
    const ventaId = asiento.id_venta;
    if (ventaId === null || ventaId === undefined) {
      haptics.error();
      Toast.show({
        type: "error",
        text1: "Sin venta asociada",
        text2: `El asiento ${asiento.numero_asiento ?? asiento.id} no tiene una venta asociada.`,
      });
      return;
    }
    haptics.selection();
    setCargandoDetalle(true);
    try {
      await recargarVentaDetalle(ventaId);
    } catch (err: any) {
      haptics.error();
      Toast.show({
        type: "error",
        text1: "No se pudo cargar la venta",
        text2: err?.message || "Intenta nuevamente.",
      });
    } finally {
      setCargandoDetalle(false);
    }
  };

  const handleCompartirPdfDetalle = async () => {
    if (!ventaDetalle) return;
    await compartirPdfVenta(ventaDetalle.id);
  };

  const handleAnularDetalle = async () => {
    if (!ventaDetalle) return;
    await anularVentaDetalle(ventaDetalle.id);
    invalidarCacheAsientos(ventaDetalle.id_viaje);
    void refetchAsientos();
    setVentaDetalle(null);
  };

  const handleCambiarAsientoDetalle = async (
    detalleId: number,
    nuevoIdAsiento: number,
  ) => {
    const respuesta = await cambiarAsientoDetalleService(
      detalleId,
      nuevoIdAsiento,
    );
    const venta = await recargarVentaDetalle(respuesta.data.id);
    invalidarCacheAsientos(venta.id_viaje);
    void refetchAsientos();
  };

  const handleEliminarDetalleDeDetalle = async (detalleId: number) => {
    if (!ventaDetalle) return;
    const idVenta = ventaDetalle.id;
    const idViaje = ventaDetalle.id_viaje;
    await eliminarDetalleDetalleService(detalleId);
    // Si era el último asiento, el backend elimina la venta completa.
    try {
      const venta = await recargarVentaDetalle(idVenta);
      invalidarCacheAsientos(venta.id_viaje);
      void refetchAsientos();
    } catch {
      invalidarCacheAsientos(idViaje);
      void refetchAsientos();
      setVentaDetalle(null);
    }
  };

  // Retrocede de Selección de asientos a Búsqueda (misma lógica del botón Volver).
  const retrocederDesdeSeleccion = () => {
    setViajeSeleccionado(null);
    clearAsientos();
    setPasoActual(Paso.BuscarViaje);
  };

  // Retrocede de Datos y pago a Selección (cancela la reserva, igual que Volver).
  const retrocederDesdeDatosYPago = async () => {
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
    setErroresPasajeros([]);
  };

  const handleBack = async () => {
    if (volviendo) return;
    haptics.selection();
    setVolviendo(true);
    try {
      if (pasoActual === Paso.SeleccionAsientos) {
        retrocederDesdeSeleccion();
      } else if (pasoActual === Paso.DatosYPago) {
        await retrocederDesdeDatosYPago();
      }
    } finally {
      setVolviendo(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | NAVEGACIÓN DESDE EL STEPPER (MISMA LÓGICA QUE VOLVER / CONTINUAR)
  |--------------------------------------------------------------------------
  |
  | El stepper no tiene lógica propia: retroceder reutiliza los mismos
  | helpers que el botón Volver (incluye cancelar la reserva y spinner),
  | y avanzar reutiliza handleSeleccionarAsientos con sus validaciones.
  |
  */

  const navegarAPaso = async (destino: Paso) => {
    if (destino === pasoActual || volviendo || loadingVenta) return;
    haptics.selection();
    if (destino < pasoActual) {
      setVolviendo(true);
      try {
        if (pasoActual === Paso.DatosYPago) {
          await retrocederDesdeDatosYPago();
        }
        if (destino === Paso.BuscarViaje) {
          retrocederDesdeSeleccion();
        }
      } finally {
        setVolviendo(false);
      }
      return;
    }
    // Avanzar: desde Búsqueda no hay viaje elegido (elegirlo ya salta al
    // paso 2), así que se pide seleccionar uno de la lista.
    if (pasoActual === Paso.BuscarViaje) {
      Toast.show({
        type: "info",
        text1: "Selecciona un viaje",
        text2: "Elige un viaje de la lista para continuar.",
      });
      return;
    }
    // Desde Asientos: mismo flujo y validaciones que el botón Continuar
    // (requiere al menos un asiento; reserva e inicializa el paso 3).
    if (pasoActual === Paso.SeleccionAsientos) {
      if (asientosSeleccionados.length === 0) {
        Toast.show({
          type: "info",
          text1: "Sin asientos",
          text2: "Selecciona al menos un asiento para continuar.",
        });
        return;
      }
      await handleSeleccionarAsientos();
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
    setErroresPasajeros([]);
    clearAsientos();
    setViajeSeleccionado(null);
    setVentaExitosa(null);
    setVentaEsNueva(false);
    setPasoActual(Paso.BuscarViaje);
    limpiarVenta();
  };

  const handleCompartirPdf = async () => {
    if (!ventaExitosa) return;
    await compartirPdfVenta(ventaExitosa.id);
  };

  const handleAnularVenta = async () => {
    if (!ventaExitosa) return;
    await anular(ventaExitosa.id);
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
    if (!ventaExitosa) return;
    const venta = await eliminarDetalleVenta(detalleId, ventaExitosa.id);
    if (!venta) {
      limpiarFlujo();
      return;
    }
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
          <ScrollView
            style={styles.stepFill}
            contentContainerStyle={styles.stepScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <PageHeader
              title="Pasajes"
              description="Selecciona un viaje disponible para vender boletos, o crea uno nuevo."
              badge={`${paginationMeta.total} · ${filtroTexto}`}
              rightContent={
                <View style={styles.headerActions}>
                  <Visibility action="Ver" selector=".pasajes-consultar">
                    <Button
                      title="Consultar venta"
                      variant="secondary"
                      onPress={() => setModalConsultarVenta(true)}
                    />
                  </Visibility>
                  <Visibility action="Ver" selector=".pasajes-refrescar">
                    <Button
                      title="Actualizar"
                      variant="secondary"
                      loading={loading}
                      onPress={() => void refetch()}
                    />
                  </Visibility>
                  <Visibility action="Crear" selector=".pasajes-crear">
                    <Button
                      title="Nuevo viaje"
                      onPress={() => setModalCrearViaje(true)}
                    />
                  </Visibility>
                </View>
              }
            />

            <View
              style={[styles.summary, !isDesktop && styles.summaryMobile]}
            >
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
                        {loading ? (
                          <Skeleton
                            colorMode={theme.dark ? "dark" : "light"}
                            width={44}
                            height={24}
                            radius={6}
                          />
                        ) : (
                          <Text style={[styles.summaryValue, { color: c.text }]}>
                            {tarjeta.valor}
                          </Text>
                        )}
                        <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                          {tarjeta.label}
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.searchRow}>
              <View style={styles.searchField}>
                <SearchBar
                  value={textoOrigen}
                  onChangeText={setTextoOrigen}
                  placeholder="Origen (ej. La Paz)"
                />
              </View>
              <View style={styles.searchField}>
                <SearchBar
                  value={textoDestino}
                  onChangeText={setTextoDestino}
                  placeholder="Destino (ej. Oruro)"
                />
              </View>
            </View>

            {error && !loading ? (
              <Text style={{ color: c.destructive, textAlign: "center" }}>
                {error}
              </Text>
            ) : null}

            <View style={styles.tableContainer}>
              <Table<Viaje>
                data={viajes}
                columns={viajeColumns}
                loading={loading}
                scrollEnabled={false}
                columnGap={1}
                horizontalPadding={5}
                cellPaddingHorizontal={2}
                keyExtractor={(item) => String(item.id)}
                emptyMessage="No se encontraron viajes para este filtro."
                renderCell={(item, column, rowIndex) => {
                  switch (column.key) {
                    case "nro": {
                      // Numeración global continua: página 1 → 1-15,
                      // página 2 → 16-30, etc. (vale para cada filtro).
                      const numero =
                        (paginationMeta.page - 1) * paginationMeta.perPage +
                        rowIndex +
                        1;
                      return (
                        <Text style={[styles.cellText, { color: c.textMuted }]}>
                          {numero}
                        </Text>
                      );
                    }

                    case "ruta":
                      return (
                        <Text
                          numberOfLines={2}
                          ellipsizeMode="tail"
                          style={[styles.cellBold, { color: c.text }]}
                        >
                          {`${item.origen} → ${item.destino}`}
                        </Text>
                      );

                    case "hora": {
                      const fecha = new Date(item.hora_salida);
                      const hora = fecha.toLocaleTimeString("es-BO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <Text
                          style={[styles.cellText, { color: c.textSecondary }]}
                        >
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
                            <Visibility
                              action="Editar"
                              selector=".pasajes-estado"
                            >
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
          </ScrollView>
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
                onOcupado={handleVerVentaAsiento}
                onReanudar={alReanudarVentaReservada}
              />
            )}
            <View style={styles.bottomBar}>
              <Button title="Volver" variant="secondary" onPress={handleBack} loading={volviendo} />
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
            {isDesktop ? (
              <View style={styles.twoColumns}>
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
                        onCopiarCampo={(campo, valor) =>
                          aplicarDatoATodos(campo, valor)
                        }
                        error={erroresPasajeros[index]}
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
            ) : (
              <ScrollView
                style={styles.mobileSingleColumn}
                contentContainerStyle={styles.mobileSingleContent}
                showsVerticalScrollIndicator={false}
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
                    onCopiarCampo={(campo, valor) =>
                      aplicarDatoATodos(campo, valor)
                    }
                    error={erroresPasajeros[index]}
                  />
                ))}
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
            )}
            <View style={styles.bottomBar}>
              <Button title="Volver" variant="secondary" onPress={handleBack} loading={volviendo} />
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
      <PasoStepper
        pasoActual={pasoActual}
        onStepPress={(numero) => {
          if (numero === Paso.BuscarViaje) void navegarAPaso(Paso.BuscarViaje);
          else if (numero === Paso.SeleccionAsientos)
            void navegarAPaso(Paso.SeleccionAsientos);
          else if (numero === Paso.DatosYPago)
            void navegarAPaso(Paso.DatosYPago);
        }}
        deshabilitado={volviendo || loadingVenta}
      />
      {renderStep()}

      {/*
      |--------------------------------------------------------------------------
      | RENDERIZADOR TÉRMICO OCULTO
      |--------------------------------------------------------------------------
      |
      | Renderiza el HTML que viene de ticket-thermal.blade.php y lo convierte
      | en una imagen raster de 58 mm para SUNMI / Bluetooth / TCP.
      | No altera la previsualización visual del modal.
      |
      */}
      <ThermalHtmlRasterizer ref={thermalRasterizerRef} />

      <ModalNuevoViaje
        visible={modalCrearViaje}
        onClose={() => setModalCrearViaje(false)}
        onViajeCreado={handleViajeCreado}
      />

      <ModalConsultarVenta
        visible={modalConsultarVenta}
        loading={consultandoVenta}
        onClose={() => setModalConsultarVenta(false)}
        onBuscar={handleConsultarVenta}
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
        pisos={pisos}
        accionFooter={ventaEsNueva ? "Nueva venta" : "Cerrar"}
        onClose={limpiarFlujo}
        onListo={limpiarFlujo}
        onCompartirPdf={handleCompartirPdf}
        onImprimirHtml={imprimirHtmlReal}
        vehiculoNombre={viajeSeleccionado?.vehiculo}
        choferNombre={viajeSeleccionado?.chofer}
        onAnular={handleAnularVenta}
        onCambiarAsiento={handleCambiarAsientoModal}
        onEliminarDetalle={handleEliminarDetalleModal}
      />

      <ModalVentaExitosa
        venta={ventaDetalle}
        asientosLibres={asientosLibres}
        pisos={pisos}
        accionFooter="Cerrar"
        onClose={() => setVentaDetalle(null)}
        onListo={() => setVentaDetalle(null)}
        onCompartirPdf={handleCompartirPdfDetalle}
        onImprimirHtml={imprimirHtmlReal}
        vehiculoNombre={viajeSeleccionado?.vehiculo}
        choferNombre={viajeSeleccionado?.chofer}
        onAnular={handleAnularDetalle}
        onCambiarAsiento={handleCambiarAsientoDetalle}
        onEliminarDetalle={handleEliminarDetalleDeDetalle}
      />

      <Modal
        visible={cargandoDetalle}
        onClose={() => {}}
        title="Cargando venta"
        maxWidth={320}
      >
        <View style={styles.cargandoDetalle}>
          <ActivityIndicator color={c.primary} />
          <Text style={{ color: c.textSecondary, fontSize: 13 }}>
            Obteniendo el detalle de la venta…
          </Text>
        </View>
      </Modal>

      <PrinterSetupModal
        visible={printerSetupVisible}
        requirement={PASAJES_PRINTER_REQUIREMENT}
        required={
          Platform.OS !== "web" &&
          (configurationRequired || !pasajesDefaultPrinter)
        }
        onClose={() => setPrinterSetupVisible(false)}
        onConfigured={(device) => {
          setPrinterSetupVisible(false);

          Toast.show({
            type: "success",
            text1: "Impresora lista",
            text2: `${device.name} quedó guardada como predeterminada.`,
          });
        }}
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
  cargandoDetalle: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  stepContainer: {
    gap: 16,
  },
  stepScrollContent: {
    gap: 16,
    paddingBottom: 24,
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
  summaryMobile: {
    flexDirection: "column",
    flexWrap: "nowrap",
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
  mobileSingleColumn: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  mobileSingleContent: {
    gap: 12,
    paddingBottom: 16,
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
  searchRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  searchField: {
    flex: 1,
    minWidth: 220,
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
