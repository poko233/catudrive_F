// screens/admin/arqueo/components/MovimientoPrintModal.tsx

import React, { useCallback } from "react";
import Toast from "react-native-toast-message";
import { ReportPrintModal } from "@/components/ReportPrintModal";
import { egresoService } from "../services/egresoService";
import { ingresoService } from "../services/ingresoService";
import { imprimirComprobanteHtml } from "../utils/imprimirHtml";
import {
  MovComprobante,
  MovimientoComprobantePreview,
} from "./MovimientoComprobantePrint";

/*
|--------------------------------------------------------------------------
| MODAL DE IMPRESIÓN DEL COMPROBANTE (patrón ModalImprimirTicket)
|--------------------------------------------------------------------------
|
| 1. Se abre en loading esperando el HTML del backend.
| 2. fetchHtml: ÚNICA llamada → HTML exacto del endpoint
|    /comprobante (Blade). Sin fetch extra del detalle.
| 3. Al llegar, el modal pasa a modo impresión (preview
|    genérico con datos de la fila) y se abre la VENTANA
|    NUEVA con el diálogo print() de esa ventana.
|
*/

export type KindMovimiento = "ingreso" | "egreso";

interface Props {
  visible: boolean;
  kind: KindMovimiento;
  movimiento: MovComprobante | null;
  onClose: () => void;
}

export function MovimientoPrintModal({ visible, kind, movimiento, onClose }: Props) {
  const fetchHtml = useCallback(async (): Promise<string> => {
    if (!movimiento) throw new Error("No hay movimiento seleccionado para imprimir.");

    const html =
      kind === "ingreso"
        ? await ingresoService.obtenerHtmlComprobante(movimiento.id)
        : await egresoService.obtenerHtmlComprobante(movimiento.id);

    if (!html || !html.trim()) {
      throw new Error("El servidor devolvió un comprobante vacío.");
    }

    return html;
  }, [kind, movimiento]);

  const handlePrint = useCallback(async (html: string): Promise<number> => {
    return imprimirComprobanteHtml(html);
  }, []);

  return (
    <ReportPrintModal
      visible={visible}
      onClose={onClose}
      fetchHtml={fetchHtml}
      onPrintHtml={handlePrint}
      onComplete={() => {
        Toast.show({ type: "success", text1: "Comprobante enviado a impresión" });
      }}
      onError={(e) => {
        Toast.show({
          type: "error",
          text1: "No se pudo imprimir",
          text2: e instanceof Error ? e.message : "Intenta nuevamente.",
        });
      }}
      resetKey={`${kind}-${movimiento?.id ?? 0}`}
      title={kind === "ingreso" ? `Ingreso #${movimiento?.id ?? ""}` : `Egreso #${movimiento?.id ?? ""}`}
      headerTitle="Comprobante de caja"
      screenTitle={kind === "ingreso" ? "Comprobante de ingreso" : "Comprobante de egreso"}
      screenSubtitle={
        movimiento?.tipo_transaccion
          ? `${movimiento.tipo_transaccion.codigo} — ${movimiento.tipo_transaccion.transaccion}`
          : undefined
      }
      screenTotalValue={movimiento ? `Bs ${Number(movimiento.monto || 0).toFixed(2)}` : undefined}
      statusLabels={{
        processing: "Esperando el comprobante del servidor…",
        printing: "Imprimiendo comprobante…",
        complete: "Comprobante impreso",
      }}
      paperSize="letter"
      outputHeight={760}
      printingDuration={1900}
    >
      {movimiento ? <MovimientoComprobantePreview kind={kind} mov={movimiento} /> : null}
    </ReportPrintModal>
  );
}

export default MovimientoPrintModal;
