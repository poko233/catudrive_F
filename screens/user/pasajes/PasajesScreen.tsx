import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  LayoutAnimation,
  Pressable,
  Platform,
} from "react-native";
import { Skeleton } from "moti/skeleton";
import Toast from "react-native-toast-message";
import { ThemedText } from "@/components/ThemedText";

import { useTheme } from "@/theme/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { usePermiso } from "@/hooks/usePermiso";
import { haptics } from "@/animations/haptics";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { Pagination, PaginationMeta } from "@/components/ui/Pagination";
import { DatePicker, DatePickerResult } from "@/components/ui/DatePicker";
import { Table, TableColumn } from "@/components/Table";
import { Visibility } from "@/components/Visibility";

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

import {
  getVenta as obtenerVentaDetalle,
  invalidarCacheVenta,
  invalidarCacheAsientos,
  cancelarVenta as cancelarVentaService,
  anularVenta as anularVentaDetalle,
  cambiarAsiento as cambiarAsientoDetalleService,
  eliminarDetalle as eliminarDetalleDetalleService,
} from "./services/pasajes.service";

import { etiquetaAsiento, pisoDeAsiento } from "./utils/asientoPiso";
import { estiloFilaViaje } from "./utils/viajeEstadoStyle";

import { BusMap } from "./components/BusMap";
import { ResponsiveActionButton } from "./components/ResponsiveActionButton";
import { ViajeFiltrosModal } from "./components/ViajeFiltrosModal";
import { ResumenVenta } from "./components/ResumenVenta";
import { ViajeMobileCard, ViajesFechaBar } from "./components/ViajesMobileList";
import { PasoStepper } from "./components/PasoStepper";
import { FormularioPasajero } from "./components/FormularioPasajero";
import { ResumenCompra } from "./components/ResumenCompra";
import { MetodoPagoSelector } from "./components/MetodoPagoSelector";
import { BanecoQrPaymentModal } from "@/components/BanecoQrPaymentModal";
import { ModalNuevaRelacion } from "./components/ModalNuevaRelacion";
import { ModalConsultarVenta } from "./components/ModalConsultarVenta";

import {
  ModalCambioEstadoViaje,
  TRANSICIONES_ESTADO_VIAJE,
} from "./components/ModalCambioEstadoViaje";

import { ModalVentaExitosa } from "./components/ModalVentaExitosa";

import { ViajePasajerosAction } from "./components/ViajePasajerosAction";

import { ViajeEncomiendasAction } from "./components/ViajeEncomiendasAction";

import {
  ArrowLeft,
  ArrowRight,
  ArrowRightCircle,
  Bus,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Filter,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react-native";

enum Paso {
  BuscarViaje = 1,
  SeleccionAsientos = 2,
  DatosYPago = 3,
  Confirmacion = 4,
}

/*
|--------------------------------------------------------------------------
| STEPPER SOLO EN REGISTRO
|--------------------------------------------------------------------------
|
| Buscar viaje es la pantalla base (sin stepper). Al entrar
| a vender, el stepper muestra Asientos → Datos y pago →
| Confirmación (numero - 1 mapea al Paso real).
|
*/

const PASOS_REGISTRO = ["Asientos", "Datos y pago", "Confirmación"];

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

  // Más espacio porque ahora tenemos 4 botones.
  { key: "acciones", label: "Acciones", flex: 1.5, align: "center" },
];

export function PasajesScreen() {
  return (
    <PrinterConnectionProvider autoConnect={false} detectSunmiOnStart={false}>
      <PasajesScreenContent />
    </PrinterConnectionProvider>
  );
}

function PasajesScreenContent() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { isDesktop } = useResponsive();

  const { configurationRequired, getDefaultPrinterForRequirement } =
    usePrinterConnection();

  const pasajesDefaultPrinter = getDefaultPrinterForRequirement(
    PASAJES_PRINTER_REQUIREMENT,
  );

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
    ventaPendienteId,
  } = usePasajesStore();

  const [pasoActual, setPasoActual] = useState<Paso>(Paso.BuscarViaje);
  /*
  |--------------------------------------------------------------------------
  | BUSCADOR ÚNICO (dual origen → destino, secuencial)
  |--------------------------------------------------------------------------
  */

  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroViaje>("TODOS");

  const [modalCrearViaje, setModalCrearViaje] = useState(false);
  const [viajeEstadoModal, setViajeEstadoModal] = useState<Viaje | null>(null);
  const [filtrosModal, setFiltrosModal] = useState(false);

  const [ventaExitosa, setVentaExitosa] = useState<Venta | null>(null);
  const [ventaEsNueva, setVentaEsNueva] = useState(false);

  const [erroresPasajeros, setErroresPasajeros] = useState<(string | null)[]>(
    [],
  );

  const [modalConsultarVenta, setModalConsultarVenta] = useState(false);
  const [consultandoVenta, setConsultandoVenta] = useState(false);

  const [volviendo, setVolviendo] = useState(false);

  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [printerSetupVisible, setPrinterSetupVisible] = useState(false);

  const {
    viajes,
    loading,
    cargandoMas,
    hayMas,
    error,
    meta,
    perPage,
    totalCombinado,
    changeFiltros,
    buscarTexto,
    goToPage,
    cargarMas,
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
    anular,
    cambiarAsientoDetalle,
    eliminarDetalleVenta,
    limpiarVenta,
  } = useVenta();

  const puedeVer = usePermiso("Ventas", "Pasajes", "Ver");

  /*
  |--------------------------------------------------------------------------
  | IMPRESORA BAJO DEMANDA
  |--------------------------------------------------------------------------
  |
  | No se busca, conecta ni solicita una impresora al entrar a Pasajes.
  | PrinterSetupModal solamente se abre después de que el usuario intenta
  | imprimir y la impresión falla por no existir una impresora disponible.
  |
  */

  /*
|--------------------------------------------------------------------------
| PAGO QR — estado pendiente
|--------------------------------------------------------------------------
|
| Se guarda el payload ya validado mientras el usuario paga el QR.
| No se guarda `ventaActual` completo: solo lo necesario para
| poder registrar la venta DESPUÉS de que el banco confirme.
|
| Sin este estado, si el usuario navega o el hook re-renderiza,
| el payload se perdería al llegar el `onSuccess`.
|
*/

  const [qrPayment, setQrPayment] = useState<{
    monto: number;
    pasajerosPayload: ConfirmarPasajero[];
    formaPago: "QR" | "Tarjeta" | "Efectivo";
    descripcion: string;
  } | null>(null);

  const [qrConfirmando, setQrConfirmando] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | FECHA (dos modos: día específico o rango, nunca ambos)
  |--------------------------------------------------------------------------
  */

  type ModoFechaFiltro = "" | "single" | "range";

  const [modoFecha, setModoFecha] = useState<ModoFechaFiltro>("");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [mobileExpandedId, setMobileExpandedId] = useState<number | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<"single" | "range">(
    "single",
  );

  const aplicarFiltrosServidor = (
    estado: FiltroViaje,
    modo: ModoFechaFiltro,
    fecha?: string,
    desde?: string,
    hasta?: string,
  ) => {
    changeFiltros({
      estado: estado === "TODOS" ? undefined : estado,

      fecha:
        modo === "single" && fecha && fecha.trim() ? fecha.trim() : undefined,

      fecha_desde:
        modo === "range" && desde && desde.trim() ? desde.trim() : undefined,

      fecha_hasta:
        modo === "range" && hasta && hasta.trim() ? hasta.trim() : undefined,
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void buscarTexto(textoBusqueda);
    }, DEBOUNCE_BUSQUEDA_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textoBusqueda]);

  const aplicarFechaSingle = (fecha: string) => {
    haptics.selection();
    setModoFecha(fecha ? "single" : "");
    setFechaFiltro(fecha);
    setFechaDesde("");
    setFechaHasta("");
    aplicarFiltrosServidor(filtroEstado, fecha ? "single" : "", fecha);
  };

  const aplicarRangoFechas = (desde: string, hasta: string) => {
    // Validación previa: evita el 422 del backend.
    if (desde && hasta && hasta < desde) {
      haptics.error();

      Toast.show({
        type: "error",
        text1: "Rango inválido",
        text2: "La fecha final debe ser mayor o igual a la inicial.",
      });

      return;
    }

    haptics.selection();
    const modo: ModoFechaFiltro = desde || hasta ? "range" : "";
    setModoFecha(modo);
    setFechaFiltro("");
    setFechaDesde(desde);
    setFechaHasta(hasta);
    aplicarFiltrosServidor(filtroEstado, modo, undefined, desde, hasta);
  };

  const limpiarFechas = () => {
    haptics.selection();
    setModoFecha("");
    setFechaFiltro("");
    setFechaDesde("");
    setFechaHasta("");
    aplicarFiltrosServidor(filtroEstado, "");
  };

  const abrirCalendario = (mode: "single" | "range") => {
    setDatePickerMode(mode);
    setDatePickerVisible(true);
  };

  const aplicarFechaPicker = (result: DatePickerResult) => {
    if (result.type === "single") {
      aplicarFechaSingle(result.date);
      return;
    }

    if (result.type === "range") {
      aplicarRangoFechas(result.start, result.end);
    }
  };

  const toggleMobileViaje = (id: number) => {
    LayoutAnimation.configureNext({
      duration: 360,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    setMobileExpandedId((prev) => (prev === id ? null : id));
  };

  const paginationMeta: PaginationMeta = {
    total: meta?.total ?? 0,
    page: meta?.current_page ?? 1,
    perPage: meta?.per_page ?? perPage,
  };

  /*
  |--------------------------------------------------------------------------
  | FILTRO ESTADO (vía modal, espejo de encomiendas)
  |--------------------------------------------------------------------------
  */

  const aplicarEstadoFiltro = (filtro: FiltroViaje) => {
    haptics.selection();

    setFiltroEstado(filtro);

    aplicarFiltrosServidor(
      filtro,
      modoFecha,
      fechaFiltro,
      fechaDesde,
      fechaHasta,
    );
  };

  const handleIrAPagina = (page: number) => {
    haptics.selection();
    goToPage(page);
  };

  /*
  |--------------------------------------------------------------------------
  | RECONCILIAR VENTA PENDIENTE (BUG RESERVA FANTASMA)
  |--------------------------------------------------------------------------
  |
  | ventaActual (useVenta) es useState local: se pierde al
  | salir por el sidebar, pero la reserva sigue viva en el
  | backend. Se usa el id persistente del store para poder
  | cancelar la venta EN EDICIÓN al Volver explícito.
  |
  | Modelo multi-reserva: Continuar NUNCA cancela (crea
  | una pendiente nueva sin tocar las anteriores) y
  | reanudar tampoco. Solo Volver cancela la que se edita.
  |
  */

  const idVentaPendiente = () => {
    if (ventaActual && ventaActual.estado === "Pendiente") {
      return ventaActual.id;
    }

    return ventaPendienteId;
  };

  const cancelarPendiente = async (viajeId?: number): Promise<void> => {
    const pendiente = idVentaPendiente();

    if (pendiente === null || pendiente === undefined) {
      return;
    }

    try {
      await cancelarVentaService(pendiente);
    } catch {
      // Best effort: aunque falle, se limpia el estado local
      // para no arrastrar la reserva fantasma.
    }

    limpiarVenta();

    if (viajeId !== undefined) {
      invalidarCacheAsientos(viajeId);

      void refetchAsientos();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SELECCIONAR VIAJE (selección fresca, sin arrastre)
  |--------------------------------------------------------------------------
  */

  const handleSeleccionarViaje = (viaje: Viaje) => {
    haptics.selection();

    // Solo limpia estado de DISPLAY de una sesión anterior
    // (sobrevive en zustand al navegar por el sidebar).
    // NO se cancela ni se olvida la reserva pendiente aquí:
    // el usuario debe poder verla y reanudarla. Se reconcilia
    // al Continuar, al Volver o al reanudar otra venta.
    clearAsientos();

    setPrecios({});

    resetPasajeros(0);

    setErroresPasajeros([]);

    setViajeSeleccionado(viaje);

    setPasoActual(Paso.SeleccionAsientos);
  };

  /*
  |--------------------------------------------------------------------------
  | SELECCIONAR ASIENTOS
  |--------------------------------------------------------------------------
  */

  const handleSeleccionarAsientos = async () => {
    if (asientosSeleccionados.length === 0 || !viajeSeleccionado) {
      return;
    }

    haptics.selection();

    try {
      // NO se cancela nada aquí: el backend soporta varias
      // reservas pendientes a la vez. Se crea una reserva
      // nueva solo con los asientos seleccionados; las
      // anteriores (ej. 2 y 4) quedan intactas.
      const asientosPayload = asientosSeleccionados.map((asiento) => ({
        id_asiento: asiento.id,

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

      invalidarCacheAsientos(viajeSeleccionado.id);

      void refetchAsientos();

      return;
    }

    haptics.light();

    resetPasajeros(asientosSeleccionados.length);

    setErroresPasajeros(new Array(asientosSeleccionados.length).fill(null));

    const tarifa = parseFloat(viajeSeleccionado.tarifa) || 0;

    const nuevosPrecios: {
      [asientoId: number]: number;
    } = {};

    asientosSeleccionados.forEach((asiento) => {
      nuevosPrecios[asiento.id] = tarifa;
    });

    setPrecios(nuevosPrecios);

    setPasoActual(Paso.DatosYPago);
  };

  /*
  |--------------------------------------------------------------------------
  | CONFIRMAR PAGO
  |--------------------------------------------------------------------------
  */

  /*
  |--------------------------------------------------------------------------
  | VALIDAR PASAJEROS (paso 3 → revisión, paso 4 → confirmar)
  |--------------------------------------------------------------------------
  */

  const validarPasajeros = () => {
    const datosLimpios = pasajeros.map((pasajero) => ({
      nombres: (pasajero?.nombres ?? "").trim(),

      apellido_paterno: (pasajero?.apellido_paterno ?? "").trim(),

      apellido_materno: (pasajero?.apellido_materno ?? "").trim(),

      ci: (pasajero?.ci ?? "").trim(),
    }));

    const invalidos: number[] = [];

    datosLimpios.forEach((pasajero, index) => {
      if (!pasajero.nombres || !pasajero.apellido_paterno) {
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

      return null;
    }

    return datosLimpios;
  };

  const irARevision = () => {
    const datosLimpios = validarPasajeros();

    if (!datosLimpios) {
      // Vuelve al formulario si venía del stepper.
      if (pasoActual === Paso.Confirmacion) {
        setPasoActual(Paso.DatosYPago);
      }

      return;
    }

    haptics.selection();

    setPasoActual(Paso.Confirmacion);
  };

  /*
  |--------------------------------------------------------------------------
  | CONSTRUIR PAYLOAD DE PASAJEROS (validación + armado)
  |--------------------------------------------------------------------------
  |
  | Extraída de handleConfirmarPago para reusarse cuando el usuario
  | toca "QR" en el selector (queremos abrir el modal al instante,
  | sin esperar a "Revisar" → "Confirmar y pagar").
  |
  | Devuelve null si la validación falla o no hay venta activa.
  |
  */

  const construirPayloadPasajeros = (): ConfirmarPasajero[] | null => {
    const datosLimpios = validarPasajeros();

    if (!datosLimpios) {
      return null;
    }

    if (!ventaActual) {
      haptics.error();

      Toast.show({
        type: "error",
        text1: "Sin venta activa",
        text2: "Inicia la venta de nuevo.",
      });

      return null;
    }

    const detallePorAsiento = new Map<number, number>();

    ventaActual.detalles.forEach((detalle) => {
      detallePorAsiento.set(detalle.asiento.id, detalle.id);
    });

    return asientosSeleccionados.map((asiento, index) => ({
      id_detalle_venta: detallePorAsiento.get(asiento.id) ?? 0,

      nombres: datosLimpios[index].nombres,

      apellido_paterno: datosLimpios[index].apellido_paterno,

      apellido_materno: datosLimpios[index].apellido_materno || null,

      ci: datosLimpios[index].ci || null,

      precio_unitario:
        precios[asiento.id] ??
        parseFloat(
          ventaActual.detalles.find(
            (detalle) => detalle.asiento.id === asiento.id,
          )?.precio_unitario ?? "0",
        ),
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | SELECCIÓN DE MÉTODO DE PAGO
  |--------------------------------------------------------------------------
  |
  | Cambia el método en el store. Si es "qr", intenta abrir el
  | modal inmediatamente:
  |
  | - Valida pasajeros (si fallan, NO abre el modal → queda en
  |   DatosYPago con errores marcados).
  | - Si valida → arma el payload y abre BanecoQrPaymentModal
  |   SIN pasar por Confirmación.
  |
  | El botón "Revisar" y "Confirmar y pagar" siguen funcionando
  | como fallback (por si el usuario cierra el modal y quiere
  | reintentar o revisar primero).
  |
  */

  const handleMetodoPagoSelect = (metodo: "qr" | "tarjeta" | "efectivo") => {
    // Si NO es QR, cambiamos directo
    if (metodo !== "qr") {
      setMetodoPago(metodo);
      return;
    }

    // Si ES QR, validamos ANTES de cambiar el estado
    const pasajerosPayload = construirPayloadPasajeros();

    if (!pasajerosPayload) {
      //  No llamamos a setMetodoPago("qr"). El selector se queda
      // visualmente en la opción anterior porque es controlado.
      return;
    }

    const monto = pasajerosPayload.reduce(
      (sum, p) => sum + p.precio_unitario,
      0,
    );

    if (monto <= 0) {
      haptics.error();
      Toast.show({
        type: "error",
        text1: "Monto inválido",
        text2: "El total a pagar debe ser mayor a cero.",
      });
      return;
    }

    //  Todo está bien: cambiamos a QR y abrimos el modal
    setMetodoPago("qr");
    haptics.selection();

    setQrPayment({
      monto,
      pasajerosPayload,
      formaPago: "QR",
      descripcion: `Venta #${ventaActual!.id} — ${
        viajeSeleccionado?.origen ?? ""
      } → ${viajeSeleccionado?.destino ?? ""}`,
    });
  };
  /*
|--------------------------------------------------------------------------
| EJECUTAR CONFIRMACIÓN (QR, tarjeta, efectivo)
|--------------------------------------------------------------------------
|
| Extraída de `handleConfirmarPago` para reusarse cuando el pago
| por QR ya fue cobrado por el banco. En ese caso, si falla,
| el error debe ser MUY visible: el dinero ya entró.
|
*/

  const ejecutarConfirmacion = async (
    formaPago: "QR" | "Tarjeta" | "Efectivo",
    pasajerosPayload: ConfirmarPasajero[],
    qrId?: string,
  ): Promise<Venta | null> => {
    try {
      const venta = await confirmar(formaPago, pasajerosPayload);

      haptics.success();

      setVentaExitosa(venta);
      setVentaEsNueva(true);

      invalidarCacheAsientos(venta.id_viaje);
      void refetchAsientos();

      return venta;
    } catch (err: any) {
      haptics.error();

      /*
    |--------------------------------------------------------------------------
    | CRÍTICO: pago cobrado pero venta NO registrada
    |--------------------------------------------------------------------------
    |
    | Si `qrId` existe, el banco YA cobró. El operador debe
    | saberlo para no vender un asiento ya ocupado realmente
    | (o duplicar el cobro).
    |
    */

      if (qrId) {
        Toast.show({
          type: "error",
          text1: "⚠️ Pago cobrado, venta no registrada",
          text2: `ID de pago: ${qrId}. Contacta al administrador para registrar la venta manualmente.`,
          visibilityTime: 15000,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "No se pudo confirmar la venta",
          text2: err?.message || "Intenta nuevamente.",
        });
      }

      return null;
    }
  };

  const handleConfirmarPago = async (metodo: "qr" | "tarjeta" | "efectivo") => {
    const formaPago =
      metodo === "qr" ? "QR" : metodo === "tarjeta" ? "Tarjeta" : "Efectivo";

    const pasajerosPayload = construirPayloadPasajeros();

    if (!pasajerosPayload) {
      setPasoActual(Paso.DatosYPago);
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | RAMA QR — abrir modal (fallback: por si cerró y quiere reintentar)
    |--------------------------------------------------------------------------
    */

    if (metodo === "qr") {
      const monto = pasajerosPayload.reduce(
        (sum, p) => sum + p.precio_unitario,
        0,
      );

      if (monto <= 0) {
        haptics.error();

        Toast.show({
          type: "error",
          text1: "Monto inválido",
          text2: "El total a pagar debe ser mayor a cero.",
        });

        return;
      }

      haptics.selection();

      setQrPayment({
        monto,
        pasajerosPayload,
        formaPago,
        descripcion: `Venta #${ventaActual!.id} — ${
          viajeSeleccionado?.origen ?? ""
        } → ${viajeSeleccionado?.destino ?? ""}`,
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | RAMA NO-QR — ejecutar directo
    |--------------------------------------------------------------------------
    */

    await ejecutarConfirmacion(formaPago, pasajerosPayload);
  };

  /*
|--------------------------------------------------------------------------
| QR SUCCESS
|--------------------------------------------------------------------------
|
| El banco ya confirmó el pago. Ahora SÍ registramos la venta.
| El modal QR se mantiene abierto mostrando "¡Pago confirmado!"
| hasta que el usuario presione "Continuar" → onClose → qrPayment=null
| → se renderiza ModalVentaExitosa (gated por !qrPayment).
|
*/

  const handleQrSuccess = async (qrId: string | null) => {
    if (!qrPayment) return;

    const payment = qrPayment;

    setQrConfirmando(true);

    try {
      await ejecutarConfirmacion(
        payment.formaPago,
        payment.pasajerosPayload,
        qrId ?? undefined, // null → undefined → manual, sin toast crítico
      );
    } finally {
      setQrConfirmando(false);
    }
  };

  /*
|--------------------------------------------------------------------------
| QR CLOSE (Continuar / X / backdrop / Android back)
|--------------------------------------------------------------------------
*/

  const handleQrClose = () => {
    setQrPayment(null);
  };

  /*
  |--------------------------------------------------------------------------
  | REANUDAR VENTA
  |--------------------------------------------------------------------------
  */

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
      // NO se cancela la otra pendiente: pueden coexistir.
      // Solo se carga la venta a reanudar.
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

      const idsVenta = new Set(
        venta.detalles.map((detalle) => detalle.asiento.id),
      );

      const asientosReanudados: Asiento[] = [];

      pisos.forEach((piso) => {
        piso.asientos.forEach((asientoActual) => {
          if (idsVenta.has(asientoActual.id)) {
            asientosReanudados.push(asientoActual);
          }
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

      const viajeEnLista = viajes.find((viaje) => viaje.id === venta.id_viaje);

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

      const preciosReanudados: {
        [asientoId: number]: number;
      } = {};

      venta.detalles.forEach((detalle) => {
        preciosReanudados[detalle.asiento.id] = parseFloat(
          detalle.precio_unitario,
        );
      });

      setPrecios(preciosReanudados);

      resetPasajeros(asientosReanudados.length);

      setErroresPasajeros(new Array(asientosReanudados.length).fill(null));

      setMetodoPago("efectivo");

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

  /*
  |--------------------------------------------------------------------------
  | CONSULTAR VENTA
  |--------------------------------------------------------------------------
  */

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
  | DETALLE VENTA
  |--------------------------------------------------------------------------
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

  const handleAnularDetalle = async () => {
    if (!ventaDetalle) {
      return;
    }

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
    if (!ventaDetalle) {
      return;
    }

    const idVenta = ventaDetalle.id;

    const idViaje = ventaDetalle.id_viaje;

    await eliminarDetalleDetalleService(detalleId);

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

  /*
  |--------------------------------------------------------------------------
  | NAVEGACIÓN
  |--------------------------------------------------------------------------
  */

  const retrocederDesdeSeleccion = () => {
    setViajeSeleccionado(null);
    clearAsientos();

    setPasoActual(Paso.BuscarViaje);
  };

  const retrocederDesdeDatosYPago = async () => {
    const pendiente = idVentaPendiente();

    if (pendiente !== null && pendiente !== undefined) {
      await cancelarPendiente(viajeSeleccionado?.id);
    }

    setPasoActual(Paso.SeleccionAsientos);

    setErroresPasajeros([]);
  };

  const handleBack = async () => {
    if (volviendo) {
      return;
    }

    haptics.selection();

    setVolviendo(true);

    try {
      if (pasoActual === Paso.SeleccionAsientos) {
        retrocederDesdeSeleccion();
      } else if (pasoActual === Paso.DatosYPago) {
        await retrocederDesdeDatosYPago();
      } else if (pasoActual === Paso.Confirmacion) {
        // Volver de la revisión NO cancela la reserva.
        setPasoActual(Paso.DatosYPago);
      }
    } finally {
      setVolviendo(false);
    }
  };

  const navegarAPaso = async (destino: Paso) => {
    if (destino === pasoActual || volviendo || loadingVenta) {
      return;
    }

    haptics.selection();

    if (destino < pasoActual) {
      setVolviendo(true);

      try {
        if (pasoActual === Paso.DatosYPago) {
          await retrocederDesdeDatosYPago();
        } else if (pasoActual === Paso.Confirmacion) {
          if (destino === Paso.DatosYPago) {
            setPasoActual(Paso.DatosYPago);
          } else {
            await retrocederDesdeDatosYPago();
          }
        }

        if (destino === Paso.BuscarViaje) {
          retrocederDesdeSeleccion();
        }
      } finally {
        setVolviendo(false);
      }

      return;
    }

    if (pasoActual === Paso.BuscarViaje) {
      Toast.show({
        type: "info",
        text1: "Selecciona un viaje",
        text2: "Elige un viaje de la lista para continuar.",
      });

      return;
    }

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

    if (pasoActual === Paso.DatosYPago) {
      irARevision();
    }
  };

  const handleViajeCreado = () => {
    void refetch();
  };

  /*
  |--------------------------------------------------------------------------
  | VENTA EXITOSA
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

  const handleAnularVenta = async () => {
    if (!ventaExitosa) {
      return;
    }

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
    if (!ventaExitosa) {
      return;
    }

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
  | ASIENTOS LIBRES
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
            scrollEventThrottle={400}
            onScroll={
              !isDesktop
                ? ({ nativeEvent }) => {
                    const { layoutMeasurement, contentOffset, contentSize } =
                      nativeEvent;
                    if (
                      layoutMeasurement.height + contentOffset.y >=
                      contentSize.height - 600
                    ) {
                      void cargarMas();
                    }
                  }
                : undefined
            }
          >
            <View
              style={[
                styles.compactHeader,
                !isDesktop && styles.compactHeaderMobile,
                {
                  borderColor: c.border,
                  backgroundColor: c.backgroundSecondary,
                },
              ]}
            >
              <View style={styles.compactHeaderIdentity}>
                <View
                  style={[
                    styles.headerPackageIcon,
                    { backgroundColor: c.background },
                  ]}
                >
                  <Bus size={isDesktop ? 22 : 20} color={c.primary} />
                </View>

                <ThemedText
                  style={[
                    styles.compactHeaderTitle,
                    !isDesktop && styles.compactHeaderTitleMobile,
                  ]}
                >
                  Pasajes
                </ThemedText>

                <Badge label={`${paginationMeta.total}`} variant="info" />
              </View>

              <View style={styles.compactHeaderActions}>
                <Visibility action="Ver" selector=".pasajes-consultar">
                  <IconButton
                    icon={Search}
                    size={isDesktop ? "md" : "sm"}
                    variant="secondary"
                    accessibilityLabel="Consultar venta"
                    onPress={() => setModalConsultarVenta(true)}
                  />
                </Visibility>

                <Visibility action="Crear" selector=".pasajes-crear">
                  <IconButton
                    icon={Plus}
                    size={isDesktop ? "md" : "sm"}
                    variant="primary"
                    accessibilityLabel="Nuevo viaje"
                    onPress={() => setModalCrearViaje(true)}
                  />
                </Visibility>

                <Visibility action="Ver" selector=".pasajes-refrescar">
                  <IconButton
                    icon={RefreshCw}
                    size={isDesktop ? "md" : "sm"}
                    variant="secondary"
                    accessibilityLabel="Actualizar"
                    loading={loading}
                    onPress={() => void refetch(true)}
                  />
                </Visibility>
              </View>
            </View>

            {!isDesktop ? (
              <ViajesFechaBar
                modo={modoFecha}
                fecha={fechaFiltro}
                desde={fechaDesde}
                hasta={fechaHasta}
                onSingle={aplicarFechaSingle}
                onClear={limpiarFechas}
                onOpenCalendar={abrirCalendario}
              />
            ) : null}

            <View style={styles.searchRow}>
              <View style={styles.searchField}>
                <SearchBar
                  value={textoBusqueda}
                  onChangeText={setTextoBusqueda}
                  placeholder="Buscar por origen o destino..."
                />
              </View>

              <IconButton
                icon={Filter}
                size="md"
                variant={filtroEstado !== "TODOS" ? "primary" : "secondary"}
                accessibilityLabel="Filtrar por estado"
                onPress={() => setFiltrosModal(true)}
              />
            </View>

            {error && !loading ? (
              <Text
                style={{
                  color: c.destructive,
                  textAlign: "center",
                }}
              >
                {error}
              </Text>
            ) : null}

            {!isDesktop ? (
              <View style={styles.mobileListContent}>
                {loading && viajes.length === 0 ? (
                  <ActivityIndicator color={c.primary} />
                ) : (
                  viajes.map((item) => (
                    <ViajeMobileCard
                      key={item.id}
                      viaje={item}
                      expanded={mobileExpandedId === item.id}
                      onToggle={() => toggleMobileViaje(item.id)}
                      onSeleccionar={() => handleSeleccionarViaje(item)}
                      puedeCambiarEstado={
                        TRANSICIONES_ESTADO_VIAJE[item.estado].length > 0
                      }
                      onCambiarEstado={() => setViajeEstadoModal(item)}
                    />
                  ))
                )}

                {!loading && !cargandoMas && viajes.length === 0 && !hayMas ? (
                  <Text style={{ color: c.textSecondary, textAlign: "center" }}>
                    No se encontraron viajes para este filtro.
                  </Text>
                ) : null}

                {cargandoMas ? <ActivityIndicator color={c.primary} /> : null}

                {hayMas && !loading && !cargandoMas ? (
                  <Button
                    title="Mostrar más"
                    variant="secondary"
                    onPress={() => void cargarMas()}
                  />
                ) : null}
              </View>
            ) : (
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
                  getRowStyle={(item) => estiloFilaViaje(item.estado, c)}
                  renderCell={(item, column, rowIndex) => {
                    switch (column.key) {
                      case "nro": {
                        const numero =
                          (paginationMeta.page - 1) * paginationMeta.perPage +
                          rowIndex +
                          1;

                        return (
                          <Text
                            style={[
                              styles.cellText,
                              {
                                color: c.textMuted,
                              },
                            ]}
                          >
                            {numero}
                          </Text>
                        );
                      }

                      case "ruta":
                        return (
                          <Text
                            numberOfLines={2}
                            ellipsizeMode="tail"
                            style={[
                              styles.cellBold,
                              {
                                color: c.text,
                              },
                            ]}
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
                            style={[
                              styles.cellText,
                              {
                                color: c.textSecondary,
                              },
                            ]}
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
                            style={[
                              styles.cellBold,
                              {
                                color: c.text,
                              },
                            ]}
                          >
                            {item.vehiculo}
                          </Text>
                        );

                      case "chofer":
                        return (
                          <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={[
                              styles.cellText,
                              {
                                color: c.textSecondary,
                              },
                            ]}
                          >
                            {item.chofer}
                          </Text>
                        );

                      case "tarifa":
                        return (
                          <Text
                            style={[
                              styles.cellTarifa,
                              {
                                color: c.primary,
                              },
                            ]}
                          >
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

                      /*
                    |--------------------------------------------------------------------------
                    | ACCIONES
                    |--------------------------------------------------------------------------
                    |
                    | 1. Pasajeros
                    | 2. Encomiendas
                    | 3. Seleccionar viaje
                    | 4. Cambiar estado
                    |
                    */

                      case "acciones":
                        return (
                          <View style={styles.accionesCell}>
                            {/*
                             * No usamos Visibility aquí.
                             * El botón debe aparecer para todos
                             * los usuarios que pueden ver Pasajes.
                             */}
                            <ViajePasajerosAction viaje={item} />

                            <ViajeEncomiendasAction viaje={item} />

                            <IconButton
                              icon={ArrowRightCircle}
                              variant="primary"
                              size="sm"
                              disabled={item.estado !== "Vendiendo"}
                              onPress={() => handleSeleccionarViaje(item)}
                              accessibilityLabel={`Seleccionar viaje ${item.origen} → ${item.destino}`}
                            />

                            {TRANSICIONES_ESTADO_VIAJE[item.estado].length >
                            0 ? (
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
            )}

            {isDesktop ? (
              <View
                style={[styles.desktopBottomBar, { borderColor: c.border }]}
              >
                <View style={styles.desktopPagination}>
                  <Pagination
                    meta={paginationMeta}
                    onPageChange={handleIrAPagina}
                    itemLabel="viajes"
                    maxVisiblePages={7}
                  />
                </View>

                <View pointerEvents="none" style={styles.desktopTotal}>
                  <ThemedText style={styles.totalLabel}>TOTAL:</ThemedText>

                  <ThemedText style={styles.totalValue}>
                    Bs {Number(totalCombinado ?? 0).toFixed(2)}
                  </ThemedText>
                </View>
              </View>
            ) : null}

            <DatePicker
              visible={datePickerVisible}
              mode={datePickerMode}
              title={
                datePickerMode === "single"
                  ? "Filtrar por día específico"
                  : "Filtrar por rango de fechas"
              }
              initialDate={fechaFiltro || undefined}
              initialRange={
                fechaDesde || fechaHasta
                  ? {
                      start: fechaDesde || fechaHasta,
                      end: fechaHasta || fechaDesde,
                    }
                  : undefined
              }
              onClose={() => setDatePickerVisible(false)}
              onApply={aplicarFechaPicker}
            />
          </ScrollView>
        );

      case Paso.SeleccionAsientos:
        return (
          <View style={[styles.stepContainer, styles.stepFill]}>
            <View style={styles.stepHeader}>
              <Text
                style={[
                  styles.stepTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
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
              <ScrollView
                style={styles.seatScroll}
                contentContainerStyle={styles.seatScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <BusMap
                  pisos={pisos}
                  asientosSeleccionados={asientosSeleccionados}
                  onToggleSeleccion={toggleAsiento}
                  onOcupado={handleVerVentaAsiento}
                  onReanudar={alReanudarVentaReservada}
                />
              </ScrollView>
            )}

            <View
              style={[
                styles.bottomBar,
                styles.bottomBarFijo,
                {
                  borderTopColor: c.border,
                  backgroundColor: c.background,
                },
              ]}
            >
              <ResponsiveActionButton
                title="Volver"
                icon={ArrowLeft}
                variant="secondary"
                onPress={handleBack}
                loading={volviendo}
              />

              <Visibility action="Crear" selector=".pasajes-continuar">
                <ResponsiveActionButton
                  title="Continuar"
                  icon={ArrowRight}
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
              <Text
                style={[
                  styles.stepTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
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
                        asientoLabel={etiquetaAsiento(
                          asiento,
                          pisoDeAsiento(pisos, asiento.id),
                        )}
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
                    pisos={pisos}
                  />

                  <MetodoPagoSelector
                    onSelect={handleMetodoPagoSelect}
                    valorInicial={metodoPago}
                  />

                  <Visibility action="Editar" selector=".pasajes-confirmar">
                    <Button
                      title="Revisar"
                      loading={loadingVenta}
                      onPress={irARevision}
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
                    asientoLabel={etiquetaAsiento(
                      asiento,
                      pisoDeAsiento(pisos, asiento.id),
                    )}
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
                  pisos={pisos}
                />

                <MetodoPagoSelector
                  onSelect={handleMetodoPagoSelect}
                  valorInicial={metodoPago}
                />

                <Visibility action="Editar" selector=".pasajes-confirmar">
                  <Button
                    title="Revisar"
                    loading={loadingVenta}
                    onPress={irARevision}
                  />
                </Visibility>
              </ScrollView>
            )}

            <View style={styles.bottomBar}>
              <ResponsiveActionButton
                title="Volver"
                icon={ArrowLeft}
                variant="secondary"
                onPress={handleBack}
                loading={volviendo}
              />
            </View>
          </View>
        );

      case Paso.Confirmacion:
        return (
          <View style={[styles.stepContainer, styles.stepFill]}>
            <View style={styles.stepHeader}>
              <Text
                style={[
                  styles.stepTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                Revisa tu compra
              </Text>

              <Badge
                label={`${asientosSeleccionados.length} pasajes`}
                variant="info"
              />
            </View>

            <ScrollView
              style={styles.seatScroll}
              contentContainerStyle={styles.seatScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <ResumenVenta
                viaje={viajeSeleccionado}
                asientos={asientosSeleccionados}
                pasajeros={pasajeros}
                precios={precios}
                pisos={pisos}
                metodoPago={metodoPago}
              />
            </ScrollView>

            <View
              style={[
                styles.bottomBar,
                styles.bottomBarFijo,
                {
                  borderTopColor: c.border,
                  backgroundColor: c.background,
                },
              ]}
            >
              <ResponsiveActionButton
                title="Volver"
                icon={ArrowLeft}
                variant="secondary"
                onPress={handleBack}
                loading={volviendo}
              />

              <Visibility action="Editar" selector=".pasajes-confirmar">
                <Button
                  title="Confirmar y pagar"
                  loading={loadingVenta}
                  disabled={loadingVenta || qrConfirmando}
                  onPress={() => handleConfirmarPago(metodoPago)}
                />
              </Visibility>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PERMISOS
  |--------------------------------------------------------------------------
  */

  if (!puedeVer) {
    return (
      <View
        style={[
          styles.screen,
          {
            backgroundColor: c.background,
          },
        ]}
      >
        <Text
          style={{
            color: c.destructive,
          }}
        >
          No tienes permiso para ver pasajes
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: c.background,
        },
      ]}
    >
      {pasoActual === Paso.BuscarViaje ? null : (
        <PasoStepper
          pasoActual={pasoActual - 1}
          pasos={PASOS_REGISTRO}
          onStepPress={(numero) => {
            const destino = (numero + 1) as Paso;

            if (destino === Paso.SeleccionAsientos) {
              void navegarAPaso(Paso.SeleccionAsientos);
            } else if (destino === Paso.DatosYPago) {
              void navegarAPaso(Paso.DatosYPago);
            } else if (destino === Paso.Confirmacion) {
              void navegarAPaso(Paso.Confirmacion);
            }
          }}
          deshabilitado={volviendo || loadingVenta}
        />
      )}

      {renderStep()}

      {pasoActual === Paso.BuscarViaje && !isDesktop ? (
        <View
          style={[
            styles.totalBar,
            styles.totalBarFija,
            { borderColor: c.border, backgroundColor: c.background },
          ]}
        >
          <ThemedText style={styles.totalLabel}>TOTAL:</ThemedText>

          <ThemedText style={styles.totalValue}>
            Bs {Number(totalCombinado ?? 0).toFixed(2)}
          </ThemedText>
        </View>
      ) : null}

      {/*
      |--------------------------------------------------------------------------
      | NUEVO VIAJE
      |--------------------------------------------------------------------------
      */}

      <ModalNuevaRelacion
        visible={modalCrearViaje}
        onClose={() => setModalCrearViaje(false)}
        onCreated={() => {
          setModalCrearViaje(false);

          handleViajeCreado();
        }}
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

      <ViajeFiltrosModal
        visible={filtrosModal}
        valor={filtroEstado}
        onClose={() => setFiltrosModal(false)}
        onApply={aplicarEstadoFiltro}
        onClear={() => {
          aplicarEstadoFiltro("TODOS");
          setFiltrosModal(false);
        }}
      />

      {qrPayment ? (
        <BanecoQrPaymentModal
          visible={qrPayment !== null}
          monto={qrPayment.monto}
          moneda="BOB"
          descripcion={qrPayment.descripcion}
          onSuccess={handleQrSuccess}
          onCancel={() => {
            haptics.selection();
            setMetodoPago("efectivo");
          }}
          onClose={handleQrClose}
        />
      ) : null}

      {/* Gate: mientras el modal QR esté abierto, ocultamos el de venta exitosa */}
      {!qrPayment ? (
        <ModalVentaExitosa
          venta={ventaExitosa}
          asientosLibres={asientosLibres}
          pisos={pisos}
          accionFooter={ventaEsNueva ? "Nueva venta" : "Cerrar"}
          onClose={limpiarFlujo}
          onListo={limpiarFlujo}
          vehiculoNombre={viajeSeleccionado?.vehiculo}
          choferNombre={viajeSeleccionado?.chofer}
          onAnular={handleAnularVenta}
          onCambiarAsiento={handleCambiarAsientoModal}
          onEliminarDetalle={handleEliminarDetalleModal}
        />
      ) : null}

      <ModalVentaExitosa
        venta={ventaDetalle}
        asientosLibres={asientosLibres}
        pisos={pisos}
        accionFooter="Cerrar"
        onClose={() => setVentaDetalle(null)}
        onListo={() => setVentaDetalle(null)}
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

          <Text
            style={{
              color: c.textSecondary,
              fontSize: 13,
            }}
          >
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

  /*
  |--------------------------------------------------------------------------
  | MÓVIL (espejo de EncomiendasScreen)
  |--------------------------------------------------------------------------
  */

  compactHeader: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  compactHeaderMobile: {
    minHeight: 48,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  compactHeaderIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },

  headerPackageIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  compactHeaderTitle: {
    fontSize: 20,
    fontWeight: "900",
  },

  compactHeaderTitleMobile: {
    fontSize: 16,
  },

  compactHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },

  mobileListScroll: {
    flex: 1,
    minHeight: 0,
  },

  mobileListContent: {
    gap: 7,
    paddingBottom: 8,
  },

  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  /*
  |--------------------------------------------------------------------------
  | FOOTER FIJO (BUG MÓVIL)
  |--------------------------------------------------------------------------
  |
  | El mapa de un bus largo empuja los botones fuera de la
  | pantalla y en Android no había scroll. El contenido va
  | en ScrollView (flex:1) y la barra queda fija abajo,
  | siempre visible y tapeable.
  |
  */

  seatScroll: {
    flex: 1,
    minHeight: 0,
  },

  seatScrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },

  bottomBarFijo: {
    marginTop: 0,
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
  },

  twoColumns: {
    flex: 1,
    flexDirection: "row",
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
    alignItems: "center",
    gap: 8,
  },

  searchField: {
    flex: 1,
    minWidth: 0,
  },

  totalBar: {
    borderTopWidth: 1,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  totalBarFija: {
    paddingHorizontal: 18,
    paddingBottom: 10,
  },

  totalLabel: {
    fontWeight: "900",
  },

  totalValue: {
    fontSize: 18,
    fontWeight: "900",
  },

  desktopBottomBar: {
    borderTopWidth: 1,
    position: "relative",
    justifyContent: "center",
  },

  desktopPagination: {
    width: "100%",
  },

  desktopTotal: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
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

  accionesCell: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
});
