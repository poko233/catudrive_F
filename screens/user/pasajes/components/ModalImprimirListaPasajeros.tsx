// screens/user/pasajes/components/ModalImprimirListaPasajeros.tsx
// Lista térmica (58 mm) de TODOS los pasajeros confirmados de un solo viaje.
// No cambia ventas ni crea registros: únicamente prepara una copia imprimible.

import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { ReceiptPrinter } from "@/components/ReceiptPrinter";
import { TicketPrintModal } from "@/components/TicketPrintModal";
import type {
  ViajePasajeroItem,
  ViajePasajerosResponse,
} from "../types/viaje-pasajeros.types";

type Props = {
  visible: boolean;
  datos: ViajePasajerosResponse | null;
  onClose: () => void;
  onImprimirHtml: (html: string) => Promise<number>;
  /** HTML que ya se revisó en la vista previa (opcional). */
  htmlPreCargado?: string;
  onListo?: (elapsedMs: number) => void;
};

function asiento(item: ViajePasajeroItem): string {
  if (item.asiento.numero_asiento !== null && item.asiento.numero_asiento !== undefined) {
    return String(item.asiento.numero_asiento);
  }
  if (item.asiento.fila !== null && item.asiento.columna !== null) {
    return `${item.asiento.fila}-${item.asiento.columna}`;
  }
  return "—";
}

function textoSeguro(value: string | number | null | undefined): string {
  return String(value ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function salida(value: string | null | undefined): string {
  if (!value) return "—";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}` : value;
}

/** Documento HTML compacto compatible con el rasterizador térmico de CatuDrive. */
export function construirHtmlLista(datos: ViajePasajerosResponse): string {
  const v = datos.viaje;
  const filas = datos.pasajeros.map((item, index) => `
    <section class="fila">
      <div class="numero">${index + 1}. ASIENTO ${textoSeguro(asiento(item))}${item.asiento.piso ? ` · ${textoSeguro(item.asiento.piso)}` : ""}</div>
      <div class="nombre">${textoSeguro(item.pasajero.nombre_completo || "Sin nombre")}</div>
      <div class="meta">CI: ${textoSeguro(item.pasajero.ci || "—")} · Venta #${textoSeguro(item.id_venta)}</div>
    </section>`).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Lista de pasajeros - Viaje #${textoSeguro(v.id)}</title>
<style>
  @page { size: 58mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { width: 100%; padding: 0; margin: 0; background: #fff; color: #000; }
  body { font-family: Arial, sans-serif; font-size: 10px; padding: 7px 5px 12px; }
  h1 { font-size: 13px; text-align: center; margin: 2px 0; }
  h2 { font-size: 11px; text-align: center; margin: 0 0 8px; }
  .linea { border-top: 1px dashed #000; margin: 7px 0; }
  .dato { margin: 3px 0; overflow-wrap: anywhere; }
  .fila { border-bottom: 1px dashed #888; padding: 6px 0; page-break-inside: avoid; }
  .numero { font-weight: 800; font-size: 11px; }
  .nombre { font-weight: 700; margin: 3px 0; overflow-wrap: anywhere; }
  .meta { font-size: 9px; }
  .total { text-align: center; font-weight: 800; font-size: 12px; padding: 7px 0; }
  .pie { text-align: center; font-size: 9px; margin-top: 6px; }
</style>
</head>
<body>
<h1>CATUDRIVE</h1>
<h2>LISTA DE PASAJEROS</h2>
<div class="linea"></div>
<div class="dato"><b>Viaje:</b> #${textoSeguro(v.id)}</div>
<div class="dato"><b>Ruta:</b> ${textoSeguro(v.origen)} → ${textoSeguro(v.destino)}</div>
<div class="dato"><b>Salida:</b> ${textoSeguro(salida(v.hora_salida))}</div>
<div class="dato"><b>Vehículo:</b> ${textoSeguro(v.vehiculo)}</div>
<div class="dato"><b>Chofer:</b> ${textoSeguro(v.chofer)}</div>
<div class="linea"></div>
${filas}
<div class="total">TOTAL: ${datos.pasajeros.length} PASAJEROS</div>
<div class="pie">Lista correspondiente únicamente al viaje #${textoSeguro(v.id)}</div>
<script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 250); });</script>
</body>
</html>`;
}

export function ModalImprimirListaPasajeros({
  visible,
  datos,
  onClose,
  onImprimirHtml,
  htmlPreCargado,
  onListo,
}: Props) {
  const obtenerHtml = useCallback(async (): Promise<string> => {
    if (!datos || datos.pasajeros.length === 0) {
      throw new Error("No hay pasajeros confirmados para imprimir.");
    }
    return htmlPreCargado ?? construirHtmlLista(datos);
  }, [datos, htmlPreCargado]);

  return (
    <TicketPrintModal
      visible={visible && datos !== null}
      onClose={onClose}
      fetchHtml={obtenerHtml}
      onPrintHtml={onImprimirHtml}
      onComplete={onListo}
      resetKey={datos ? `${datos.viaje.id}:${datos.pasajeros.map((p) => p.id_detalle_venta).join("-")}` : "sin-lista"}
      headerTitle="Lista de pasajeros"
      screenTitle={datos ? `${datos.viaje.origen ?? "—"} → ${datos.viaje.destino ?? "—"}` : undefined}
      screenSubtitle={datos ? `Viaje #${datos.viaje.id}` : undefined}
      screenTotalLabel="Pasajeros"
      screenTotalValue={datos ? String(datos.pasajeros.length) : undefined}
      reprintLabel="Reimprimir lista"
      printingDuration={1500}
      outputHeight={560}
    >
      <View style={styles.preview}>
        <ReceiptPrinter.Text tone="strong" style={styles.titulo}>CATUDRIVE</ReceiptPrinter.Text>
        <ReceiptPrinter.Text tone="strong" style={styles.titulo}>LISTA DE PASAJEROS</ReceiptPrinter.Text>
        <ReceiptPrinter.Divider />
        <ReceiptPrinter.Text style={styles.texto}>Viaje: #{datos?.viaje.id ?? "—"}</ReceiptPrinter.Text>
        <ReceiptPrinter.Text style={styles.texto}>Ruta: {datos?.viaje.origen ?? "—"} → {datos?.viaje.destino ?? "—"}</ReceiptPrinter.Text>
        <ReceiptPrinter.Text style={styles.texto}>Salida: {salida(datos?.viaje.hora_salida)}</ReceiptPrinter.Text>
        <ReceiptPrinter.Text style={styles.texto}>Vehículo: {datos?.viaje.vehiculo ?? "—"}</ReceiptPrinter.Text>
        <ReceiptPrinter.Text style={styles.texto}>Chofer: {datos?.viaje.chofer ?? "—"}</ReceiptPrinter.Text>
        <ReceiptPrinter.Divider />
        {(datos?.pasajeros ?? []).map((item, index) => (
          <View key={item.id_detalle_venta} style={styles.fila}>
            <ReceiptPrinter.Text tone="strong" style={styles.texto}>
              {index + 1}. Asiento {asiento(item)}{item.asiento.piso ? ` · ${item.asiento.piso}` : ""}
            </ReceiptPrinter.Text>
            <ReceiptPrinter.Text style={styles.texto}>{item.pasajero.nombre_completo || "Sin nombre"}</ReceiptPrinter.Text>
            <ReceiptPrinter.Text style={styles.texto}>CI: {item.pasajero.ci || "—"} · Venta #{item.id_venta}</ReceiptPrinter.Text>
          </View>
        ))}
        <ReceiptPrinter.Divider />
        <ReceiptPrinter.Text tone="strong" style={styles.total}>
          TOTAL: {datos?.pasajeros.length ?? 0} PASAJEROS
        </ReceiptPrinter.Text>
      </View>
    </TicketPrintModal>
  );
}

const styles = StyleSheet.create({
  preview: { gap: 3 },
  titulo: { fontSize: 12, color: "#000", textAlign: "center", fontWeight: "900" },
  texto: { fontSize: 10, color: "#000" },
  fila: { gap: 2, paddingVertical: 5 },
  total: { fontSize: 11, color: "#000", textAlign: "center", fontWeight: "900" },
});
