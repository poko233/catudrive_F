import React, { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { ReceiptPrinter } from "@/components/ReceiptPrinter";
import { TicketPrintModal } from "@/components/TicketPrintModal";
import { Venta } from "../types/pasajes.types";
import { obtenerTicketHtml } from "../services/pasajes.service";

/*
|--------------------------------------------------------------------------
| ENVOLTORIO PASAJES DEL MODAL GENÉRICO
|--------------------------------------------------------------------------
|
| El shell (máquina processing → printing → complete,
| re-imprimir, salida) vive en components/TicketPrintModal.
| Aquí solo se aporta: de dónde sale el HTML, la salida
| real, los textos de pantalla y el diseño del papel
| (ticket térmico 58mm espejo del HTML del backend).
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
  const ventaId = venta?.id ?? null;

  const fetchHtml = useCallback(async (): Promise<string> => {
    if (ventaId === null) throw new Error("Sin venta seleccionada.");
    const crudo = await obtenerTicketHtml(ventaId);

    // Si el backend envuelve el HTML en JSON (p.ej. {html: "..."}),
    // se extrae; si no, ya es HTML plano.
    try {
      const parsed = JSON.parse(crudo);
      if (parsed.html) return parsed.html as string;
    } catch {
      // Ya es HTML plano
    }
    return crudo;
  }, [ventaId]);

  return (
    <TicketPrintModal
      visible={visible}
      onClose={onClose}
      fetchHtml={fetchHtml}
      onPrintHtml={onImprimirHtml}
      onComplete={onListo}
      resetKey={venta?.id ?? 0}
      printingDuration={2000}
      outputHeight={560}
      screenTitle={
        venta ? `${venta.origen} → ${venta.destino}` : undefined
      }
      screenSubtitle={venta ? `Venta #${venta.id}` : undefined}
      screenTotalValue={venta ? `Bs. ${venta.precio_total}` : undefined}
    >
      <ReceiptPrinter.Text tone="strong" style={[styles.ticket, styles.ticketCenter]}>
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

      <ReceiptPrinter.Text style={[styles.ticketPie, styles.ticketCenter]}>
        Gracias por su compra
      </ReceiptPrinter.Text>
    </TicketPrintModal>
  );
}

const styles = StyleSheet.create({
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
});
