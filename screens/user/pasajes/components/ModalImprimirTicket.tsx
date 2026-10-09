import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { ReceiptPrinter } from "@/components/ReceiptPrinter";
import { TicketPrintModal } from "@/components/TicketPrintModal";
import { Venta, Piso } from "../types/pasajes.types";
import { pisoDeAsiento } from "../utils/asientoPiso";
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
  pisos?: Piso[];
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
| PREVIEW GENÉRICO (ESPEJO DEL ticket-html DEL BACKEND)
|--------------------------------------------------------------------------
|
| El ticket exacto lo renderiza el backend. Aquí se dibuja
| una vista genérica con los datos a la mano (venta,
| detalles, piso) y mocks genéricos para lo que el front
| no tiene (empresa, placa/color, monto en letras,
| usuario vendedor). Negro sobre blanco, igual que el HTML.
|
*/

function codigoAsiento(
  detalle: NonNullable<Venta["detalles"]>[number],
  pisos: Piso[],
): string {
  const piso = pisoDeAsiento(pisos, detalle.asiento.id);
  const numero =
    detalle.asiento.numero_asiento ??
    `${detalle.asiento.fila}-${detalle.asiento.columna}`;

  return piso && typeof piso.numero === "number"
    ? `P${piso.numero}-${numero}`
    : `${numero}`;
}

function nombrePasajeroTicket(
  detalle: NonNullable<Venta["detalles"]>[number],
): string {
  const pasajero = detalle.pasajero;

  if (!pasajero) return "(SIN PASAJERO)";

  const apellido = String(pasajero.apellido_paterno ?? "").toUpperCase();
  const nombres = String(pasajero.nombres ?? "").trim().toUpperCase();
  const ci = pasajero.ci ? ` (${pasajero.ci})` : "";

  return `${apellido} ${nombres}${ci}`.trim() || "(SIN PASAJERO)";
}

export function ModalImprimirTicket({
  visible,
  venta,
  vehiculoNombre,
  choferNombre,
  pisos = [],
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
      <TicketPreviewNuevo
        venta={venta}
        vehiculoNombre={vehiculoNombre}
        choferNombre={choferNombre}
        pisos={pisos}
      />
    </TicketPrintModal>
  );
}

/*
|--------------------------------------------------------------------------
| PREVIEW NUEVO DISEÑO (espejo del Blade actual)
|--------------------------------------------------------------------------
*/

function TicketPreviewNuevo({
  venta,
  vehiculoNombre,
  choferNombre,
  pisos,
}: {
  venta: Venta | null;
  vehiculoNombre?: string | null;
  choferNombre?: string | null;
  pisos: Piso[];
}) {
  const detalles = venta?.detalles ?? [];

  const subtotal = detalles.reduce(
    (s, d) => s + (parseFloat(d.precio_unitario) || 0),
    0,
  );

  const totalMonto = parseFloat(venta?.precio_total ?? "0") || 0;
  const centavos = String(
    Math.round((totalMonto - Math.floor(totalMonto)) * 100),
  ).padStart(2, "0");

  return (
    <View style={styles.ticketBloque}>
      <ReceiptPrinter.Text tone="strong" style={[styles.ticketTitle, styles.ticketCenter]}>
        CATUDRIVE
      </ReceiptPrinter.Text>
      <ReceiptPrinter.Text tone="strong" style={[styles.ticketTitle, styles.ticketCenter]}>
        BOLETO DE VIAJE
      </ReceiptPrinter.Text>

      <ReceiptPrinter.Divider />

      <TicketDato label="Fecha:" valor={formatearFechaCorta(new Date())} />
      <TicketDato label="Boleto:" valor={venta ? String(venta.id) : "-"} />
      <TicketDato label="Origen:" valor={textoONulo(venta?.origen)} />
      <TicketDato label="Destino:" valor={textoONulo(venta?.destino)} />
      <TicketDato
        label="Salida:"
        valor={venta ? formatearSalida(venta.hora_salida) : "-"}
      />
      <TicketDato label="PLACA:" valor={textoONulo(vehiculoNombre)} />
      <TicketDato label="COLOR:" valor="-" />
      <TicketDato label="Chofer:" valor={textoONulo(choferNombre)} />
      <TicketDato label="T. Pago:" valor={venta?.forma_pago ?? "-"} />

      <ReceiptPrinter.Divider />

      <ReceiptPrinter.Text tone="strong" style={[styles.ticket, styles.ticketCenter]}>
        DETALLE
      </ReceiptPrinter.Text>

      <ReceiptPrinter.Divider />

      {detalles.map((detalle) => (
        <View key={detalle.id} style={styles.ticketItem}>
          <ReceiptPrinter.Text tone="strong" style={styles.ticket}>
            {codigoAsiento(detalle, pisos)} | {nombrePasajeroTicket(detalle)}
          </ReceiptPrinter.Text>
          <View style={styles.ticketFila}>
            <ReceiptPrinter.Text style={styles.ticket}>
              1 x Bs. {formatearPrecio(detalle.precio_unitario)}
            </ReceiptPrinter.Text>
            <ReceiptPrinter.Text style={styles.ticket}>
              Bs. {formatearPrecio(detalle.precio_unitario)}
            </ReceiptPrinter.Text>
          </View>
        </View>
      ))}

      <ReceiptPrinter.Divider />

      <ReceiptPrinter.Text tone="strong" style={[styles.ticket, styles.ticketRight]}>
        TOTAL PRODUCTOS {detalles.length}
      </ReceiptPrinter.Text>
      <ReceiptPrinter.Text tone="strong" style={[styles.ticket, styles.ticketRight]}>
        SUBTOTAL Bs. {subtotal.toFixed(2)}
      </ReceiptPrinter.Text>
      <ReceiptPrinter.Text tone="strong" style={[styles.ticketTotal, styles.ticketRight]}>
        TOTAL MONTO Bs. {totalMonto.toFixed(2)}
      </ReceiptPrinter.Text>

      <ReceiptPrinter.Text style={styles.ticket}>
        Son: --- (en letras en el ticket)
      </ReceiptPrinter.Text>
      <ReceiptPrinter.Text style={styles.ticket}>
        {centavos}/100 Bolivianos
      </ReceiptPrinter.Text>

      <ReceiptPrinter.Divider />

      <TicketDato label="USUARIO:" valor="-" />
      <TicketDato label="NOMBRE:" valor="-" />

      <ReceiptPrinter.Text style={[styles.ticketPie, styles.ticketCenter]}>
        Gracias por su compra
      </ReceiptPrinter.Text>
    </View>
  );
}

function TicketDato({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.ticketFila}>
      <ReceiptPrinter.Text tone="strong" style={styles.ticket}>
        {label}
      </ReceiptPrinter.Text>
      <ReceiptPrinter.Text style={styles.ticket}>
        {valor}
      </ReceiptPrinter.Text>
    </View>
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
  ticketTitle: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#000000",
  },
  ticketTotal: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#000000",
  },
  ticketPie: {
    fontFamily: "monospace",
    fontSize: 9,
    color: "#000000",
    marginTop: 3,
  },
  ticketCenter: {
    textAlign: "center",
  },
  ticketRight: {
    textAlign: "right",
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
  ticketItem: {
    gap: 1,
    marginBottom: 4,
  },
});