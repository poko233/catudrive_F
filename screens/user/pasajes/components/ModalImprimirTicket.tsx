import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import {
  ReceiptPrinter,
  ReceiptPrinterStage,
} from "@/components/ReceiptPrinter";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { haptics } from "@/animations/haptics";
import { useTheme } from "@/theme/useTheme";
import { Venta } from "../types/pasajes.types";
import { obtenerTicketHtml } from "../services/pasajes.service";

/*
|--------------------------------------------------------------------------
| TIEMPOS
|--------------------------------------------------------------------------
|
| PRINTING_DURATION_MS = duración visual del papel saliendo
| (escala del default 1750ms del componente, acorde al ticket).
|
| El tiempo REAL de impresión se mide con Date.now()
| alrededor de la salida (expo-print / ventana) y se
| reporta al finalizar: ningún adapter expone progreso
| físico, solo resolución de la promesa.
|
*/

const PRINTING_DURATION_MS = 2000;

type Fase = "procesando" | "imprimiendo" | "completado" | "error";

/*
|--------------------------------------------------------------------------
| VENTANA PREABIERTA (WEB)
|--------------------------------------------------------------------------
|
| Estructural: { closed, location.href }. Se abre en el gesto
| del botón (sincrónico) para que el bloqueador de popups
| no la rechace; al completar se navega a la URL del blob.
|
*/

interface Props {
  visible: boolean;
  venta: Venta | null;
  vehiculoNombre?: string | null;
  choferNombre?: string | null;
  onClose: () => void;
  onImprimirHtml: (html: string) => Promise<number>;
  onListo: (elapsedMs: number) => void;
}

function faseAStage(fase: Fase): ReceiptPrinterStage {
  switch (fase) {
    case "imprimiendo":
      return "printing";
    case "completado":
      return "complete";
    case "procesando":
    case "error":
    default:
      return "processing";
  }
}

function textoEstado(fase: Fase): string {
  switch (fase) {
    case "procesando":
      return "Obteniendo ticket…";
    case "imprimiendo":
      return "Imprimiendo…";
    case "completado":
      return "¡Ticket listo!";
    case "error":
    default:
      return "No se pudo imprimir";
  }
}

/*
|--------------------------------------------------------------------------
| FORMATO TÉRMICO (ESPEJO DEL ticket-html DEL BACKEND)
|--------------------------------------------------------------------------
|
| dd/mm/yyyy HH:i como now()->format('d/m/Y H:i').
| Precios con 2 decimales como number_format(x, 2).
|
*/

function dosDigitos(valor: number): string {
  return valor < 10 ? `0${valor}` : String(valor);
}

function formatearFechaCorta(fecha: Date): string {
  return (
    `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/` +
    `${fecha.getFullYear()} ${dosDigitos(fecha.getHours())}:` +
    dosDigitos(fecha.getMinutes())
  );
}

function formatearSalida(horaSalida: string | null | undefined): string {
  // El backend puede devolver null (ventas consultadas) → "-".
  if (!horaSalida) return "-";
  // Backend: "YYYY-MM-DD HH:MM:SS" → "dd/mm/yyyy HH:i".
  const coincidencia = horaSalida.match(
    /(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/,
  );
  if (!coincidencia) return horaSalida;
  const [, anio, mes, dia, hora, minutos] = coincidencia;
  return `${dia}/${mes}/${anio} ${hora}:${minutos}`;
}

function formatearPrecio(valor: string | number): string {
  const numero = typeof valor === "number" ? valor : parseFloat(valor);
  if (Number.isNaN(numero)) return "0.00";
  return numero.toFixed(2);
}

function textoONulo(valor?: string | null): string {
  const limpio = valor?.trim();
  return limpio ? limpio : "-";
}

/*
|--------------------------------------------------------------------------
| QR GENÉRICO DECORATIVO (ESPEJO DEL BLOQUE qr DEL HTML)
|--------------------------------------------------------------------------
|
| El backend incluye su QR real solo a veces (@if isset qrData).
| Aquí se dibuja un QR visual genérico determinista (no escaneable)
| con patrones buscadores y relleno pseudoaleatorio por venta,
| usando react-native-svg (ya instalado en el proyecto).
|
*/

const QR_MODULOS = 25;
const QR_TAMANO = 104;

function mulberry32(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function moduloBuscador(fila: number, columna: number): boolean | null {
  // Esquinas 7x7 de buscador (con zona de separación de 8x8).
  const esquinas = [
    { f: 0, c: 0 },
    { f: 0, c: QR_MODULOS - 7 },
    { f: QR_MODULOS - 7, c: 0 },
  ];
  for (const esquina of esquinas) {
    const df = fila - esquina.f;
    const dc = columna - esquina.c;
    if (df >= 0 && df < 7 && dc >= 0 && dc < 7) {
      const borde = df === 0 || df === 6 || dc === 0 || dc === 6;
      const centro = df >= 2 && df <= 4 && dc >= 2 && dc <= 4;
      return borde || centro;
    }
  }
  return null;
}

function esZonaFuncion(fila: number, columna: number): boolean {
  if (moduloBuscador(fila, columna) !== null) return true;
  // Separadores alrededor de buscadores.
  if (fila < 8 && columna < 8) return true;
  if (fila < 8 && columna >= QR_MODULOS - 8) return true;
  if (fila >= QR_MODULOS - 8 && columna < 8) return true;
  // Patrones de tiempo (fila/columna 6).
  if (fila === 6 || columna === 6) return true;
  return false;
}

function TicketQr({ semilla }: { semilla: number }) {
  const modulos = useMemo(() => {
    const aleatorio = mulberry32(semilla || 1);
    const celdas: { fila: number; columna: number }[] = [];
    for (let fila = 0; fila < QR_MODULOS; fila++) {
      for (let columna = 0; columna < QR_MODULOS; columna++) {
        const buscador = moduloBuscador(fila, columna);
        if (buscador !== null) {
          if (buscador) celdas.push({ fila, columna });
          continue;
        }
        if (esZonaFuncion(fila, columna)) {
          // Patrón de tiempo alternado.
          if (fila === 6 || columna === 6) {
            if ((fila + columna) % 2 === 0) celdas.push({ fila, columna });
          }
          continue;
        }
        if (aleatorio() < 0.44) celdas.push({ fila, columna });
      }
    }
    return celdas;
  }, [semilla]);

  return (
    <Svg
      width={QR_TAMANO}
      height={QR_TAMANO}
      viewBox={`0 0 ${QR_MODULOS} ${QR_MODULOS}`}
      accessibilityLabel="Código QR del ticket"
    >
      <Rect
        x={0}
        y={0}
        width={QR_MODULOS}
        height={QR_MODULOS}
        fill="#FFFFFF"
      />
      {modulos.map((celda, indice) => (
        <Rect
          key={`qr-${indice}`}
          x={celda.columna}
          y={celda.fila}
          width={1.02}
          height={1.02}
          fill="#000000"
        />
      ))}
    </Svg>
  );
}

export function ModalImprimirTicket({
  visible,
  venta,
  vehiculoNombre,
  choferNombre,
  onClose,
  onImprimirHtml,
  onListo,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [fase, setFase] = useState<Fase>("procesando");
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const ventaId = venta?.id ?? null;

  /*
  |--------------------------------------------------------------------------
  | CALLBACKS EN REF
  |--------------------------------------------------------------------------
  |
  | Evita que el efecto se reinicie si el padre
  | re-renderiza con callbacks nuevos a mitad
  | de la secuencia de impresión.
  |
  */

  const callbacks = useRef({ onImprimirHtml, onListo });
  callbacks.current = { onImprimirHtml, onListo };

  /*
  |--------------------------------------------------------------------------
  | SECUENCIA: BACKEND → VISUAL → SALIDA REAL (SIN AUTOCIERRE)
  |--------------------------------------------------------------------------
  |
  | 1. processing: espera al backend (ticket-html).
  | 2. printing: animación del papel (PRINTING_DURATION_MS).
  | 3. salida real (pestaña / expo-print) y medición.
  | 4. complete: se queda en "¡Ticket listo!" hasta que el
  |    usuario lo cierre вручную. Nada se cierra solo.
  |
  */

  useEffect(() => {
    if (!visible || ventaId === null) return;

    let cancelado = false;
    const temporizadores: ReturnType<typeof setTimeout>[] = [];

    const esperar = (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, ms);
        temporizadores.push(timer);
      });

    const correr = async () => {
      setFase("procesando");
      setMensajeError(null);

      try {
        const crudo = await obtenerTicketHtml(ventaId);

        // Si el backend envuelve el HTML en JSON (p.ej. {html: "..."}),
        // se extrae; si no, ya es HTML plano.
        let html = crudo;
        try {
          const parsed = JSON.parse(crudo);
          if (parsed.html) html = parsed.html;
        } catch {
          // Ya es HTML plano
        }

        if (cancelado) return;

        setFase("imprimiendo");
        await esperar(PRINTING_DURATION_MS);
        if (cancelado) return;

        const elapsedMs = await callbacks.current.onImprimirHtml(html);
        if (cancelado) return;

        setFase("completado");
        haptics.success();
        callbacks.current.onListo(elapsedMs);
      } catch (err: any) {
        if (cancelado) return;
        setFase("error");
        setMensajeError(err?.message || "No se pudo imprimir el ticket.");
        haptics.error();
      }
    };

    void correr();

    return () => {
      cancelado = true;
      temporizadores.forEach(clearTimeout);
    };
  }, [visible, ventaId]);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Imprimiendo ticket"
      maxWidth={440}
      footer={
        <View style={styles.footer}>
          <Button
            title={fase === "completado" || fase === "error" ? "Cerrar" : "Cancelar"}
            variant="secondary"
            onPress={onClose}
          />
        </View>
      }
    >
      <View
        style={[
          styles.impresoraFondo,
          {
            backgroundColor: c.background,
            borderColor: c.border,
          },
        ]}
      >
      <ReceiptPrinter.Root
        stage={faseAStage(fase)}
        feedMotion="stepped"
        printingDuration={PRINTING_DURATION_MS}
        maxWidth={390}
        outputHeight={560}
      >
        <ReceiptPrinter.Machine>
          <ReceiptPrinter.Header>
            <View style={[styles.marca, { backgroundColor: c.primary }]}>
              <Text style={[styles.marcaTexto, { color: c.primaryForeground }]}>
                C
              </Text>
            </View>
            <Text style={styles.pantallaClaro}>Ticket</Text>
          </ReceiptPrinter.Header>

          <ReceiptPrinter.Screen>
            <View style={styles.pantallaFila}>
              <View style={styles.pantallaInfo}>
                <Text style={styles.pantallaTitulo}>
                  {venta ? `${venta.origen} → ${venta.destino}` : "Venta"}
                </Text>
                <Text style={styles.pantallaSubtitulo}>
                  {venta ? `Venta #${venta.id}` : "Boleto de transporte"}
                </Text>
              </View>
              <View style={styles.pantallaTotal}>
                <Text style={styles.pantallaSubtitulo}>Total</Text>
                <Text style={styles.pantallaTitulo}>
                  Bs. {venta?.precio_total ?? "0.00"}
                </Text>
              </View>
            </View>

            <ReceiptPrinter.Status>{textoEstado(fase)}</ReceiptPrinter.Status>
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>

        <ReceiptPrinter.Output>
          <ReceiptPrinter.Paper>
            <ReceiptPrinter.Text
              tone="strong"
              style={[styles.ticket, styles.ticketCenter]}
            >
              Catudrive
            </ReceiptPrinter.Text>
            <ReceiptPrinter.Text style={[styles.ticket, styles.ticketCenter]}>
              Comprobante #{venta?.id ?? "-"}
            </ReceiptPrinter.Text>

            <ReceiptPrinter.Divider />

            <View style={styles.ticketBloque}>
              <View style={styles.ticketFila}>
                <ReceiptPrinter.Text tone="strong" style={styles.ticket}>
                  Estado:
                </ReceiptPrinter.Text>
                <ReceiptPrinter.Text style={styles.ticket}>
                  {venta?.estado ?? "-"}
                </ReceiptPrinter.Text>
              </View>
              <View style={styles.ticketFila}>
                <ReceiptPrinter.Text tone="strong" style={styles.ticket}>
                  Fecha:
                </ReceiptPrinter.Text>
                <ReceiptPrinter.Text style={styles.ticket}>
                  {formatearFechaCorta(new Date())}
                </ReceiptPrinter.Text>
              </View>
              <View style={styles.ticketFila}>
                <ReceiptPrinter.Text tone="strong" style={styles.ticket}>
                  Origen:
                </ReceiptPrinter.Text>
                <ReceiptPrinter.Text style={styles.ticket}>
                  {textoONulo(venta?.origen)}
                </ReceiptPrinter.Text>
              </View>
              <View style={styles.ticketFila}>
                <ReceiptPrinter.Text tone="strong" style={styles.ticket}>
                  Destino:
                </ReceiptPrinter.Text>
                <ReceiptPrinter.Text style={styles.ticket}>
                  {textoONulo(venta?.destino)}
                </ReceiptPrinter.Text>
              </View>
              <View style={styles.ticketFila}>
                <ReceiptPrinter.Text tone="strong" style={styles.ticket}>
                  Salida:
                </ReceiptPrinter.Text>
                <ReceiptPrinter.Text style={styles.ticket}>
                  {venta ? formatearSalida(venta.hora_salida) : "-"}
                </ReceiptPrinter.Text>
              </View>
              <View style={styles.ticketFila}>
                <ReceiptPrinter.Text tone="strong" style={styles.ticket}>
                  Vehículo:
                </ReceiptPrinter.Text>
                <ReceiptPrinter.Text style={styles.ticket}>
                  {textoONulo(vehiculoNombre)}
                </ReceiptPrinter.Text>
              </View>
              <View style={styles.ticketFila}>
                <ReceiptPrinter.Text tone="strong" style={styles.ticket}>
                  Chofer:
                </ReceiptPrinter.Text>
                <ReceiptPrinter.Text style={styles.ticket}>
                  {textoONulo(choferNombre)}
                </ReceiptPrinter.Text>
              </View>
            </View>

            <ReceiptPrinter.Divider />

            <View style={styles.ticketFila}>
              <ReceiptPrinter.Text
                tone="strong"
                style={[styles.ticketChico, styles.ticketColNro]}
              >
                #
              </ReceiptPrinter.Text>
              <ReceiptPrinter.Text
                tone="strong"
                style={[styles.ticketChico, styles.ticketColAsiento]}
              >
                Asiento
              </ReceiptPrinter.Text>
              <ReceiptPrinter.Text
                tone="strong"
                style={[styles.ticketChico, styles.ticketColPasajero]}
              >
                Pasajero
              </ReceiptPrinter.Text>
              <ReceiptPrinter.Text
                tone="strong"
                style={[styles.ticketChico, styles.ticketColCi]}
              >
                CI
              </ReceiptPrinter.Text>
              <ReceiptPrinter.Text
                tone="strong"
                style={[styles.ticketChico, styles.ticketColPrecio]}
              >
                Precio
              </ReceiptPrinter.Text>
            </View>

            <View style={styles.ticketBloque}>
              {(venta?.detalles ?? []).map((detalle, indice) => (
                <View key={detalle.id} style={styles.ticketFila}>
                  <ReceiptPrinter.Text
                    style={[styles.ticketChico, styles.ticketColNro]}
                  >
                    {indice + 1}
                  </ReceiptPrinter.Text>
                  <ReceiptPrinter.Text
                    style={[styles.ticketChico, styles.ticketColAsiento]}
                  >
                    {detalle.asiento.numero_asiento ??
                      `${detalle.asiento.fila}-${detalle.asiento.columna}`}
                  </ReceiptPrinter.Text>
                  <ReceiptPrinter.Text
                    style={[styles.ticketChico, styles.ticketColPasajero]}
                  >
                    {detalle.pasajero
                      ? `${detalle.pasajero.nombres} ${detalle.pasajero.apellido_paterno}`.trim()
                      : "-"}
                  </ReceiptPrinter.Text>
                  <ReceiptPrinter.Text
                    style={[styles.ticketChico, styles.ticketColCi]}
                  >
                    {detalle.pasajero?.ci ?? "-"}
                  </ReceiptPrinter.Text>
                  <ReceiptPrinter.Text
                    style={[styles.ticketChico, styles.ticketColPrecio]}
                  >
                    Bs {formatearPrecio(detalle.precio_unitario)}
                  </ReceiptPrinter.Text>
                </View>
              ))}
            </View>

            <ReceiptPrinter.Divider />

            <View style={styles.ticketFila}>
              <ReceiptPrinter.Text tone="strong" style={styles.ticket}>
                TOTAL
              </ReceiptPrinter.Text>
              <ReceiptPrinter.Text tone="strong" style={styles.ticket}>
                Bs {formatearPrecio(venta?.precio_total ?? "0")}
              </ReceiptPrinter.Text>
            </View>

            <View style={styles.qrBloque}>
              <TicketQr semilla={venta?.id ?? 1} />
            </View>

            <ReceiptPrinter.Text
              style={[styles.ticketPie, styles.ticketCenter]}
            >
              Gracias por su compra
            </ReceiptPrinter.Text>
          </ReceiptPrinter.Paper>
        </ReceiptPrinter.Output>
        </ReceiptPrinter.Root>
      </View>

      {fase === "error" && mensajeError ? (
        <Text style={[styles.error, { color: c.destructive }]}>
          {mensajeError}
        </Text>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  /*
  |--------------------------------------------------------------------------
  | FONDO DE CONTRASTE
  |--------------------------------------------------------------------------
  |
  | El papel es blanco: sin este fondo se funde con el modal
  | en tema claro. background + borde del tema lo separan
  | en los 3 temas sin tocar el componente impresora.
  |
  */
  impresoraFondo: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  marca: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  marcaTexto: {
    fontSize: 15,
    fontWeight: "900",
  },
  pantallaFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  pantallaInfo: {
    flex: 1,
    gap: 2,
  },
  pantallaTotal: {
    alignItems: "flex-end",
    gap: 2,
  },
  /*
  |--------------------------------------------------------------------------
  | PANTALLA LCD (TINTA CLARA SOBRE FONDO OSCURO FIJO)
  |--------------------------------------------------------------------------
  |
  | Excepción justificada a theme.colors: la pantalla de la
  | impresora es siempre oscura (#1D1D1D fija del componente),
  | así que su texto debe ser siempre claro para leerse en
  | los 3 temas. ReceiptPrinter.Text es tinta de papel
  | (#111 sobre blanco) y aquí quedaba invisible.
  |
  */
  pantallaClaro: {
    color: "#F7F7F7",
    fontSize: 13,
    fontWeight: "700",
  },
  pantallaTitulo: {
    color: "#F7F7F7",
    fontSize: 14,
    fontWeight: "800",
  },
  pantallaSubtitulo: {
    color: "#A9A9A9",
    fontSize: 12,
  },
  papelTitulo: {
    textAlign: "center",
  },
  /*
  |--------------------------------------------------------------------------
  | TICKET TÉRMICO 58MM (ESPEJO DEL HTML DEL BACKEND)
  |--------------------------------------------------------------------------
  |
  | Excepción justificada a theme.colors: el ticket térmico es
  | negro sobre blanco por definición, igual que el HTML
  | del backend (color:#000, background:#fff, Courier 10px).
  |
  */
  ticket: {
    fontFamily: "monospace",
    fontSize: 10,
    color: "#000000",
  },
  ticketChico: {
    fontFamily: "monospace",
    fontSize: 9,
    color: "#000000",
  },
  ticketPie: {
    fontFamily: "monospace",
    fontSize: 8,
    color: "#000000",
    marginTop: 3,
  },
  ticketCenter: {
    textAlign: "center",
  },
  ticketFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 4,
  },
  ticketBloque: {
    gap: 2,
  },
  ticketColNro: {
    flex: 0.5,
  },
  ticketColAsiento: {
    flex: 1.1,
  },
  ticketColPasajero: {
    flex: 2,
  },
  ticketColCi: {
    flex: 1.1,
  },
  ticketColPrecio: {
    flex: 1.3,
    textAlign: "right",
  },
  qrBloque: {
    alignItems: "center",
    marginVertical: 4,
  },
  error: {
    fontSize: 13,
    textAlign: "center",
  },
});
