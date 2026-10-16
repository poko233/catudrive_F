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
  Printer,
  UsersRound,
} from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Toast from "react-native-toast-message";
import {
  PrinterSetupModal,
  usePrinterConnection,
} from "@/components/PrinterConnection";
import { getVenta, invalidarCacheVenta, obtenerTicketHtml } from "../services/pasajes.service";
import { ModalImprimirTicket } from "./ModalImprimirTicket";
import { ModalImprimirListaPasajeros, construirHtmlLista } from "./ModalImprimirListaPasajeros";
import { ModalVistaPreviaReimpresion } from "./ModalVistaPreviaReimpresion";
import {
  ThermalHtmlRasterizer,
  type ThermalHtmlRasterizerHandle,
} from "./ThermalHtmlRasterizer";
import { getPasajerosViaje } from "../services/viaje-pasajeros.service";
import type { Viaje, Venta } from "../types/pasajes.types";
import type {
  ViajePasajeroItem,
  ViajePasajerosResponse,
} from "../types/viaje-pasajeros.types";
import type { PrinterDevice } from "@/services/printer";

type Props = { viaje: Viaje };

/** El HTML mostrado en la vista previa será el que se envía a imprimir. */
type DocumentoReimpresion =
  | { tipo: "venta"; venta: Venta; html: string }
  | { tipo: "lista"; datos: ViajePasajerosResponse; html: string };

type GrupoPasajeros = {
  key: string;
  apellido: string | null;
  pasajeros: ViajePasajeroItem[];
};

type GrupoVenta = {
  idVenta: number;
  pasajeros: ViajePasajeroItem[];
};

const REQUISITO_IMPRESORA = {
  type: "receipt",
  paperSize: "receipt-58",
} as const;

/** Una venta puede incluir varios asientos: se imprime una sola vez por venta. */
function agruparPorVenta(pasajeros: ViajePasajeroItem[]): GrupoVenta[] {
  const resultado: GrupoVenta[] = [];
  const posiciones = new Map<number, number>();
  for (const item of pasajeros) {
    const pos = posiciones.get(item.id_venta);
    if (pos === undefined) {
      posiciones.set(item.id_venta, resultado.length);
      resultado.push({ idVenta: item.id_venta, pasajeros: [item] });
    } else {
      resultado[pos].pasajeros.push(item);
    }
  }
  return resultado;
}


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
  venta,
  ventaInfo,
}: {
  item: ViajePasajeroItem;
  numero: number;
  anidado?: boolean;
  ventaInfo?: { idVenta: number; cantidad: number };
  venta?: {
    idVenta: number;
    cantidad: number;
    cargando: boolean;
    bloqueado: boolean;
    onReimprimir: (id: number) => void;
  };
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
        </View>

        <View style={styles.ciRow}>
          <IdCard size={15} color={c.textSecondary} />
          <Text style={[styles.ciText, { color: c.textSecondary }]}>
            CI: {item.pasajero.ci || "—"}
          </Text>
          {item.asiento.piso ? (
            <Badge label={item.asiento.piso} variant="muted" />
          ) : null}
        </View>

        {venta || ventaInfo ? (
          <View style={styles.saleInfoInline}>
            <Text style={[styles.saleTitle, { color: c.text }]}>Venta #{(venta ?? ventaInfo)!.idVenta}</Text>
            <Text style={[styles.saleSubtitle, { color: c.textSecondary }]}>
              · {(venta ?? ventaInfo)!.cantidad} {(venta ?? ventaInfo)!.cantidad === 1 ? "pasaje" : "pasajes"}
            </Text>
          </View>
        ) : null}
      </View>

      {/* La acción de impresión se alinea con los datos del pasajero.
          En familias la impresora se coloca en la cabecera del dropdown. */}
      {venta ? (
        <AccionReimprimirVenta
          idVenta={venta.idVenta}
          cargando={venta.cargando}
          bloqueado={venta.bloqueado}
          onReimprimir={venta.onReimprimir}
        />
      ) : null}
    </View>
  );

  if (anidado) return contenido;
  return <Card padding={0}>{contenido}</Card>;
}

/** Botón amarillo por venta, en línea con los datos del pasajero. */
function AccionReimprimirVenta({
  idVenta,
  cargando,
  bloqueado,
  onReimprimir,
}: {
  idVenta: number;
  cargando: boolean;
  bloqueado: boolean;
  onReimprimir: (id: number) => void;
}) {
  return (
    <IconButton
      icon={Printer}
      variant="primary"
      size="md"
      loading={cargando}
      disabled={bloqueado}
      onPress={() => onReimprimir(idVenta)}
      accessibilityLabel={`Reimprimir todos los pasajes de la venta ${idVenta}`}
    />
  );
}

/**
 * Se mantiene el IconButton original y su carga diferida.
 * El dropdown agrupa por apellido; las reimpresiones se agrupan por venta.
 */
export function ViajePasajerosAction({ viaje }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { width: anchoPantalla } = useWindowDimensions();
  const compacto = anchoPantalla < 540;

  // Usa el proveedor que ya envuelve PasajesScreen: no conecta al iniciar.
  const {
    configurationRequired,
    getDefaultPrinterForRequirement,
    print: printWithConfiguredPrinter,
  } = usePrinterConnection();
  const impresoraPredeterminada = getDefaultPrinterForRequirement(REQUISITO_IMPRESORA);
  const rasterizadorRef = useRef<ThermalHtmlRasterizerHandle | null>(null);
  const solicitudRef = useRef(0);
  const impresoraElegidaRef = useRef<PrinterDevice | null>(null);
  const ventanaWebRef = useRef<Window | null>(null);
  const htmlConfirmadoRef = useRef<string | null>(null);
  const temporizadorImpresionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [ventaReimpresion, setVentaReimpresion] = useState<Venta | null>(null);
  const [idVentaCargando, setIdVentaCargando] = useState<number | null>(null);
  const [listaImpresion, setListaImpresion] = useState<ViajePasajerosResponse | null>(null);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [printerSetupVisible, setPrinterSetupVisible] = useState(false);
  const [configurandoDesdeVistaPrevia, setConfigurandoDesdeVistaPrevia] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState<DocumentoReimpresion | null>(null);

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ViajePasajerosResponse | null>(null);
  const [gruposAbiertos, setGruposAbiertos] = useState<Set<string>>(new Set());
  // Solo se usa cuando una misma familia contiene varias ventas distintas.
  const [familiaSeleccionImpresion, setFamiliaSeleccionImpresion] = useState<GrupoPasajeros | null>(null);

  const abrir = useCallback(async () => {
    const solicitud = ++solicitudRef.current;
    setVisible(true);
    setLoading(true);
    setError("");
    setData(null);
    setGruposAbiertos(new Set());
    setFamiliaSeleccionImpresion(null);

    try {
      const response = await getPasajerosViaje(viaje.id);
      if (solicitud !== solicitudRef.current) return;
      setData(response);
    } catch (err) {
      if (solicitud !== solicitudRef.current) return;
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los pasajeros.",
      );
    } finally {
      if (solicitud === solicitudRef.current) setLoading(false);
    }
  }, [viaje.id]);

  const cerrar = () => {
    // Evita respuestas tardías de una petición al cerrar el modal.
    ++solicitudRef.current;
    setVisible(false);
    setError("");
    setData(null);
    setGruposAbiertos(new Set());
    setFamiliaSeleccionImpresion(null);
    setVentaReimpresion(null);
    setListaImpresion(null);
    setVistaPrevia(null);
    setConfigurandoDesdeVistaPrevia(false);
    setPrinterSetupVisible(false);
    impresoraElegidaRef.current = null;
    htmlConfirmadoRef.current = null;
    if (temporizadorImpresionRef.current) {
      clearTimeout(temporizadorImpresionRef.current);
      temporizadorImpresionRef.current = null;
    }
    setIdVentaCargando(null);
    setCargandoLista(false);
  };

  /** Reutiliza el mismo ticket HTML oficial de las ventas de Pasajes. */
  const reimprimirVenta = async (idVenta: number) => {
    if (idVentaCargando !== null || cargandoLista || ventaReimpresion || listaImpresion || vistaPrevia) return;
    const solicitud = solicitudRef.current;
    setIdVentaCargando(idVenta);
    try {
      // No imprimir una versión antigua de la venta después de un cambio.
      invalidarCacheVenta(idVenta);
      const response = await getVenta(idVenta);
      if (solicitud !== solicitudRef.current) return;
      const venta = response.data;
      if (venta.id_viaje !== viaje.id || venta.estado !== "Pagada") {
        throw new Error("La venta ya no está pagada o no corresponde a este viaje.");
      }
      // La vista previa muestra el HTML oficial, todavía NO imprime.
      const crudo = await obtenerTicketHtml(idVenta);
      if (solicitud !== solicitudRef.current) return;
      let html = crudo;
      try {
        const json = JSON.parse(crudo);
        if (typeof json?.html === "string") html = json.html;
      } catch {
        // El endpoint devuelve HTML plano normalmente.
      }
      if (!html.trim()) throw new Error("El ticket de la venta está vacío.");
      setVistaPrevia({ tipo: "venta", venta, html });
    } catch (err) {
      if (solicitud !== solicitudRef.current) return;
      Toast.show({
        type: "error",
        text1: "No se pudo consultar la venta",
        text2: err instanceof Error ? err.message : "Intenta nuevamente.",
      });
    } finally {
      if (solicitud === solicitudRef.current) setIdVentaCargando(null);
    }
  };

  /** Actualiza la lista antes de imprimir, sin mezclar otros viajes. */
  const reimprimirLista = async () => {
    if (cargandoLista || idVentaCargando !== null || ventaReimpresion || listaImpresion || vistaPrevia) return;
    const solicitud = solicitudRef.current;
    setCargandoLista(true);
    try {
      const actualizados = await getPasajerosViaje(viaje.id);
      if (solicitud !== solicitudRef.current) return;
      if (actualizados.viaje.id !== viaje.id || actualizados.pasajeros.length === 0) {
        throw new Error("Este viaje no tiene pasajeros confirmados para imprimir.");
      }
      setData(actualizados);
      setVistaPrevia({ tipo: "lista", datos: actualizados, html: construirHtmlLista(actualizados) });
    } catch (err) {
      if (solicitud !== solicitudRef.current) return;
      Toast.show({
        type: "error",
        text1: "No se pudo preparar la lista",
        text2: err instanceof Error ? err.message : "Intenta nuevamente.",
      });
    } finally {
      if (solicitud === solicitudRef.current) setCargandoLista(false);
    }
  };

  /** El usuario confirma la vista previa y la impresora antes de abrir
   * el modal animado de impresión existente. */
  const confirmarVistaPrevia = (dispositivo: PrinterDevice) => {
    if (!vistaPrevia) return;
    const documento = vistaPrevia;
    impresoraElegidaRef.current = dispositivo;
    htmlConfirmadoRef.current = documento.html;
    // Los navegadores suelen bloquear window.open() desde efectos asíncronos.
    // Reservamos la ventana en el clic del usuario, antes de la animación.
    if (Platform.OS === "web" && typeof window !== "undefined") {
      ventanaWebRef.current = window.open("about:blank", "_blank", "width=420,height=640");
      if (ventanaWebRef.current) {
        ventanaWebRef.current.document.title = "Preparando reimpresión";
        ventanaWebRef.current.document.body.textContent = "Preparando documento para imprimir...";
      }
    }
    setVistaPrevia(null);
    // Android necesita terminar de ocultar un RN Modal antes de abrir otro.
    if (temporizadorImpresionRef.current) clearTimeout(temporizadorImpresionRef.current);
    temporizadorImpresionRef.current = setTimeout(() => {
      temporizadorImpresionRef.current = null;
      if (documento.tipo === "venta") setVentaReimpresion(documento.venta);
      else setListaImpresion(documento.datos);
    }, Platform.OS === "web" ? 0 : 240);
  };

  /** Mismo flujo térmico que PasajesScreen: HTML -> raster -> impresora. */
  const imprimirHtmlReal = useCallback(async (html: string): Promise<number> => {
    const inicio = Date.now();
    // Usar exactamente el documento que se revisó en la vista previa.
    const htmlFinal = htmlConfirmadoRef.current ?? html;
    const impresora = impresoraElegidaRef.current;
    try {
      if (Platform.OS === "web") {
        const blob = new Blob([htmlFinal], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const ventanaReservada = ventanaWebRef.current;
        const ventana = ventanaReservada && !ventanaReservada.closed
          ? ventanaReservada
          : window.open(url, "_blank", "width=420,height=640");
        if (!ventana) {
          URL.revokeObjectURL(url);
          throw new Error("El navegador bloqueó la pestaña de impresión. Habilita las ventanas emergentes.");
        }
        if (ventana === ventanaReservada) ventana.location.href = url;
        ventanaWebRef.current = null;
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return Date.now() - inicio;
      }

      // La impresión del sistema acepta HTML directamente. Las impresoras
      // SUNMI, Bluetooth y Wi-Fi térmicas necesitan raster ESC/POS.
      let rasterImage;
      if (impresora?.connectionType !== "system") {
        const rasterizador = rasterizadorRef.current;
        if (!rasterizador) {
          throw new Error("El renderizador térmico todavía no está disponible.");
        }
        rasterImage = await rasterizador.captureHtml(htmlFinal);
      }
      await printWithConfiguredPrinter({
        type: "receipt",
        paperSize: "receipt-58",
        html: htmlFinal,
        rasterImage,
        copies: 1,
        cutPaper: true,
        sunmi: { feedLines: 4, imageMode: "binary" },
      }, impresora ?? undefined);
    } catch (err) {
      if (Platform.OS !== "web") setPrinterSetupVisible(true);
      Toast.show({
        type: "error",
        text1: "No se pudo imprimir",
        text2: err instanceof Error ? err.message : "Revisa la impresora e inténtalo de nuevo.",
      });
      throw err;
    }
    return Date.now() - inicio;
  }, [printWithConfiguredPrinter]);

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
          <View style={[styles.footer, compacto && styles.footerCompact]}>
            <Button
              title="Reimprimir lista de pasajeros"
              loading={cargandoLista}
              disabled={loading || !data?.pasajeros.length || idVentaCargando !== null || listaImpresion !== null || ventaReimpresion !== null || vistaPrevia !== null}
              onPress={() => void reimprimirLista()}
              style={compacto ? styles.fullButton : undefined}
              accessibilityLabel={`Reimprimir la lista completa de pasajeros del viaje ${viaje.id}`}
            />
            <Button title="Cerrar" variant="secondary" onPress={cerrar} style={compacto ? styles.fullButton : undefined} />
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
                    <Card key={grupo.key} padding={0} style={styles.saleCard}>
                      <FilaPasajero
                        item={item}
                        numero={numeros.get(item.id_detalle_venta) ?? 1}
                        anidado
                        venta={{
                          idVenta: item.id_venta,
                          cantidad: data.pasajeros.filter((p) => p.id_venta === item.id_venta).length,
                          cargando: idVentaCargando === item.id_venta,
                          bloqueado: idVentaCargando !== null || cargandoLista || ventaReimpresion !== null || listaImpresion !== null || vistaPrevia !== null,
                          onReimprimir: (id) => void reimprimirVenta(id),
                        }}
                      />
                    </Card>
                  );
                }

                const abierto = gruposAbiertos.has(grupo.key);
                const asientos = grupo.pasajeros.map(asientoLabel);
                const ventasFamilia = agruparPorVenta(grupo.pasajeros);
                const idVentaUnica = ventasFamilia.length === 1 ? ventasFamilia[0].idVenta : null;
                const impresionBloqueada = idVentaCargando !== null || cargandoLista || ventaReimpresion !== null || listaImpresion !== null || vistaPrevia !== null;

                return (
                  <Card key={grupo.key} padding={0} style={styles.familyCard}>
                    <View style={[styles.familyHeader, { backgroundColor: c.card }]}>
                      {/* Área desplegable separada del botón de impresión:
                          pulsar la impresora NO abre ni cierra la familia. */}
                      <Pressable
                        onPress={() => alternarGrupo(grupo.key)}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: abierto }}
                        accessibilityLabel={`Familia ${grupo.apellido}, ${grupo.pasajeros.length} pasajeros, asientos ${asientos.join(", ")}`}
                        style={({ pressed }) => [
                          styles.familyToggle,
                          pressed && { backgroundColor: c.primarySubtle },
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
                      </Pressable>

                      {/* Un único botón en la cabecera. Si el apellido reúne
                          ventas diferentes, permite elegir cuál reimprimir. */}
                      <IconButton
                        icon={Printer}
                        variant="primary"
                        size="md"
                        loading={idVentaUnica !== null && idVentaCargando === idVentaUnica}
                        disabled={impresionBloqueada}
                        onPress={() => {
                          if (idVentaUnica !== null) {
                            void reimprimirVenta(idVentaUnica);
                          } else {
                            setFamiliaSeleccionImpresion(grupo);
                          }
                        }}
                        accessibilityLabel={`Reimprimir ${ventasFamilia.length === 1 ? `venta ${idVentaUnica}` : `una de las ${ventasFamilia.length} ventas`} de la familia ${grupo.apellido}`}
                      />

                      <Pressable
                        onPress={() => alternarGrupo(grupo.key)}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: abierto }}
                        accessibilityLabel={abierto ? `Contraer familia ${grupo.apellido}` : `Desplegar familia ${grupo.apellido}`}
                        style={styles.familyChevronButton}
                      >
                        {abierto ? (
                          <ChevronUp size={20} color={c.primary} />
                        ) : (
                          <ChevronDown size={20} color={c.textSecondary} />
                        )}
                      </Pressable>
                    </View>

                    {abierto ? (
                      <View style={[styles.familyDetails, { borderTopColor: c.border }]}>
                        {agruparPorVenta(grupo.pasajeros).map((ventaGrupo, indexVenta) => (
                          <View key={ventaGrupo.idVenta}>
                            {indexVenta > 0 ? (
                              <View style={[styles.memberDivider, { backgroundColor: c.border }]} />
                            ) : null}
                            {ventaGrupo.pasajeros.map((item, index) => (
                              <View key={item.id_detalle_venta}>
                                {index > 0 ? (
                                  <View style={[styles.memberDivider, { backgroundColor: c.border }]} />
                                ) : null}
                                <FilaPasajero
                                  item={item}
                                  numero={numeros.get(item.id_detalle_venta) ?? index + 1}
                                  anidado
                                  // En las familias solo se muestra el número de venta.
                                  // La impresora está arriba, junto a «Familia».
                                  ventaInfo={index === 0 ? {
                                    idVenta: ventaGrupo.idVenta,
                                    cantidad: data.pasajeros.filter((p) => p.id_venta === ventaGrupo.idVenta).length,
                                  } : undefined}
                                />
                              </View>
                            ))}
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

      {/* Si una familia tiene varias ventas, no se mezclan sus tickets.
          Se elige la venta concreta antes de lanzar la impresión oficial. */}
      <Modal
        visible={familiaSeleccionImpresion !== null}
        title={`Reimprimir · Familia ${familiaSeleccionImpresion?.apellido ?? ""}`}
        onClose={() => setFamiliaSeleccionImpresion(null)}
        maxWidth={430}
        footer={
          <Button
            title="Cancelar"
            variant="secondary"
            onPress={() => setFamiliaSeleccionImpresion(null)}
          />
        }
      >
        <View style={styles.salePicker}>
          <Text style={[styles.salePickerHint, { color: c.textSecondary }]}>
            Esta familia tiene varias ventas. Selecciona cuál deseas reimprimir.
          </Text>
          {agruparPorVenta(familiaSeleccionImpresion?.pasajeros ?? []).map((grupoVenta) => (
            <View key={grupoVenta.idVenta} style={[styles.salePickerRow, { borderColor: c.border }]}>
              <View style={styles.salePickerText}>
                <Text style={[styles.saleTitle, { color: c.text }]}>Venta #{grupoVenta.idVenta}</Text>
                <Text style={[styles.saleSubtitle, { color: c.textSecondary }]}>
                  {grupoVenta.pasajeros.length} {grupoVenta.pasajeros.length === 1 ? "pasajero" : "pasajeros"} en esta familia
                </Text>
              </View>
              <AccionReimprimirVenta
                idVenta={grupoVenta.idVenta}
                cargando={idVentaCargando === grupoVenta.idVenta}
                bloqueado={idVentaCargando !== null || cargandoLista || ventaReimpresion !== null || listaImpresion !== null || vistaPrevia !== null}
                onReimprimir={(id) => {
                  setFamiliaSeleccionImpresion(null);
                  void reimprimirVenta(id);
                }}
              />
            </View>
          ))}
        </View>
      </Modal>

      {/* Paso 1: vista previa del documento + select de impresoras.
          Solo después de confirmar se abre el modal animado original. */}
      {vistaPrevia ? (
        <ModalVistaPreviaReimpresion
          visible={!configurandoDesdeVistaPrevia}
          html={vistaPrevia.html}
          tipoDocumento={vistaPrevia.tipo}
          titulo={vistaPrevia.tipo === "venta"
            ? `Venta #${vistaPrevia.venta.id}`
            : `Lista de pasajeros · Viaje #${vistaPrevia.datos.viaje.id}`}
          subtitulo={vistaPrevia.tipo === "venta"
            ? `${vistaPrevia.venta.origen} → ${vistaPrevia.venta.destino}`
            : `${vistaPrevia.datos.viaje.origen} → ${vistaPrevia.datos.viaje.destino} · ${vistaPrevia.datos.pasajeros.length} pasajeros`}
          onClose={() => setVistaPrevia(null)}
          onConfirmar={confirmarVistaPrevia}
          onConfigurar={() => {
            setConfigurandoDesdeVistaPrevia(true);
            setPrinterSetupVisible(true);
          }}
        />
      ) : null}

      {/* Solo se monta mientras se consulta el modal: evita WebViews por cada fila. */}
      {visible && Platform.OS !== "web" ? (
        <ThermalHtmlRasterizer ref={rasterizadorRef} />
      ) : null}

      {ventaReimpresion ? (
        <ModalImprimirTicket
          visible
          venta={ventaReimpresion}
          vehiculoNombre={viaje.vehiculo}
          choferNombre={viaje.chofer}
          onClose={() => {
            setVentaReimpresion(null);
            htmlConfirmadoRef.current = null;
            impresoraElegidaRef.current = null;
          }}
          onImprimirHtml={imprimirHtmlReal}
          onListo={(ms) => Toast.show({
            type: "success",
            text1: "Venta enviada a impresión",
            text2: `Reimpresión completada en ${(ms / 1000).toFixed(1)} s.`,
          })}
        />
      ) : null}

      {listaImpresion ? (
        <ModalImprimirListaPasajeros
          visible
          datos={listaImpresion}
          htmlPreCargado={htmlConfirmadoRef.current ?? undefined}
          onClose={() => {
            setListaImpresion(null);
            htmlConfirmadoRef.current = null;
            impresoraElegidaRef.current = null;
          }}
          onImprimirHtml={imprimirHtmlReal}
          onListo={(ms) => Toast.show({
            type: "success",
            text1: "Lista enviada a impresión",
            text2: `Viaje #${viaje.id} · ${(ms / 1000).toFixed(1)} s.`,
          })}
        />
      ) : null}

      {printerSetupVisible ? (
        <PrinterSetupModal
          visible
          requirement={REQUISITO_IMPRESORA}
          required={Platform.OS !== "web" && (configurationRequired || !impresoraPredeterminada)}
          onClose={() => {
            setPrinterSetupVisible(false);
            setConfigurandoDesdeVistaPrevia(false);
          }}
          onConfigured={configurandoDesdeVistaPrevia && impresoraPredeterminada ? undefined : (device) => {
            setPrinterSetupVisible(false);
            setConfigurandoDesdeVistaPrevia(false);
            Toast.show({
              type: "success",
              text1: "Impresora lista",
              text2: `${device.name} quedó guardada como predeterminada.`,
            });
          }}
        />
      ) : null}
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
  ciRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  ciText: { fontSize: 12 },
  familyCard: { overflow: "hidden" },
  familyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 10,
    minHeight: 84,
  },
  familyToggle: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingLeft: 16,
    paddingVertical: 15,
    borderRadius: 10,
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
  familyChevronButton: {
    width: 28,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  familyDetails: { borderTopWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  memberDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 12 },
  saleCard: { overflow: "hidden" },
  saleInfoInline: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  saleTitle: { fontSize: 12, fontWeight: "900" },
  saleSubtitle: { fontSize: 11 },
  footer: { flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap", gap: 10 },
  footerCompact: { flexDirection: "column" },
  fullButton: { width: "100%" },
  salePicker: { gap: 12 },
  salePickerHint: { fontSize: 13, lineHeight: 19 },
  salePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  salePickerText: { flex: 1, minWidth: 0, gap: 4 },
});
