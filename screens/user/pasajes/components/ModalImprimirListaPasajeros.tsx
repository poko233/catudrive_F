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
  if (
    item.asiento.numero_asiento !== null &&
    item.asiento.numero_asiento !== undefined
  ) {
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
  return match
    ? `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}`
    : value;
}

/** Documento HTML compacto compatible con el rasterizador térmico de CatuDrive. */
export function construirHtmlLista(datos: ViajePasajerosResponse): string {
  const v = datos.viaje;

  // Se mantiene la estructura exacta de las filas originales
  const filas = datos.pasajeros
    .map(
      (item, index) => `
    <section class="fila">
      <div class="numero">${index + 1}. ASIENTO ${textoSeguro(asiento(item))}${item.asiento.piso ? ` · ${textoSeguro(item.asiento.piso)}` : ""}</div>
      <div class="nombre">${textoSeguro(item.pasajero.nombre_completo || "Sin nombre")}</div>
      <div class="meta">CI: ${textoSeguro(item.pasajero.ci || "—")} · Venta #${textoSeguro(item.id_venta)}</div>
    </section>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Lista de pasajeros - Viaje #${textoSeguro(v.id)}</title>
<style>
  @page { size: 48mm auto; margin: 0; }
  
  * { box-sizing: border-box; }
  
  html, body { 
    margin: 0; 
    padding: 0; 
    background: #fff; 
    color: #000; 
  }
  
  body { 
    font-family: 'DejaVu Sans Mono', 'Consolas', 'Courier New', monospace; 
    font-size: 11px; 
    width: 48mm;
    margin: 0 auto;
    padding: 0.5mm 0.3mm 5mm 0.3mm; 
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.25px;
    -webkit-font-smoothing: none;
    text-rendering: geometricPrecision;
  }

  .center { text-align: center; }
  
  .title { 
    font-size: 15px; 
    text-transform: uppercase;
    letter-spacing: -0.2px;
  }
  
  .subtitle { 
    font-size: 11px; 
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  .linea { 
    border-top: 1px dashed #000; 
    margin: 2px 0; 
  }

  .dato { 
    margin: 0 0 1px 0; 
    overflow-wrap: anywhere; 
    font-size: 11px;
  }

  .fila { 
    border-bottom: 1px dashed #000; 
    padding: 2px 0; 
    margin-bottom: 2px;
    page-break-inside: avoid; 
  }

  .numero { 
    font-size: 11px; 
    text-transform: uppercase;
    margin-bottom: 0;
  }

  .nombre { 
    font-size: 11px; 
    text-transform: uppercase;
    margin-bottom: 0;
    overflow-wrap: anywhere; 
  }

  .meta { 
    font-size: 11px; 
  }

  .total { 
    text-align: right; 
    font-size: 13px; 
    padding: 2px 0; 
    margin-top: 2px;
  }

  .pie { 
    text-align: center; 
    font-size: 11px; 
    margin-top: 4px; 
  }
</style>
</head>
<body>
<div class="center title">CATUDRIVE</div>
<div class="center subtitle">LISTA DE PASAJEROS</div>
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
      resetKey={
        datos
          ? `${datos.viaje.id}:${datos.pasajeros.map((p) => p.id_detalle_venta).join("-")}`
          : "sin-lista"
      }
      headerTitle="Lista de pasajeros"
      screenTitle={
        datos
          ? `${datos.viaje.origen ?? "—"} → ${datos.viaje.destino ?? "—"}`
          : undefined
      }
      screenSubtitle={datos ? `Viaje #${datos.viaje.id}` : undefined}
      screenTotalLabel="Pasajeros"
      screenTotalValue={datos ? String(datos.pasajeros.length) : undefined}
      reprintLabel="Reimprimir lista"
      printingDuration={1500}
      outputHeight={560}
    >
      <View style={styles.preview}>
        <ReceiptPrinter.Text tone="strong" style={styles.titulo}>
          CATUDRIVE
        </ReceiptPrinter.Text>
        <ReceiptPrinter.Text tone="strong" style={styles.titulo}>
          LISTA DE PASAJEROS
        </ReceiptPrinter.Text>
        <ReceiptPrinter.Divider />
        <ReceiptPrinter.Text style={styles.texto}>
          Viaje: #{datos?.viaje.id ?? "—"}
        </ReceiptPrinter.Text>
        <ReceiptPrinter.Text style={styles.texto}>
          Ruta: {datos?.viaje.origen ?? "—"} → {datos?.viaje.destino ?? "—"}
        </ReceiptPrinter.Text>
        <ReceiptPrinter.Text style={styles.texto}>
          Salida: {salida(datos?.viaje.hora_salida)}
        </ReceiptPrinter.Text>
        <ReceiptPrinter.Text style={styles.texto}>
          Vehículo: {datos?.viaje.vehiculo ?? "—"}
        </ReceiptPrinter.Text>
        <ReceiptPrinter.Text style={styles.texto}>
          Chofer: {datos?.viaje.chofer ?? "—"}
        </ReceiptPrinter.Text>
        <ReceiptPrinter.Divider />
        {(datos?.pasajeros ?? []).map((item, index) => (
          <View key={item.id_detalle_venta} style={styles.fila}>
            <ReceiptPrinter.Text tone="strong" style={styles.texto}>
              {index + 1}. Asiento {asiento(item)}
              {item.asiento.piso ? ` · ${item.asiento.piso}` : ""}
            </ReceiptPrinter.Text>
            <ReceiptPrinter.Text style={styles.texto}>
              {item.pasajero.nombre_completo || "Sin nombre"}
            </ReceiptPrinter.Text>
            <ReceiptPrinter.Text style={styles.texto}>
              CI: {item.pasajero.ci || "—"} · Venta #{item.id_venta}
            </ReceiptPrinter.Text>
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
  titulo: {
    fontSize: 12,
    color: "#000",
    textAlign: "center",
    fontWeight: "900",
  },
  texto: { fontSize: 10, color: "#000" },
  fila: { gap: 2, paddingVertical: 5 },
  total: {
    fontSize: 11,
    color: "#000",
    textAlign: "center",
    fontWeight: "900",
  },
});
