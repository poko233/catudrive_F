import React, { useCallback } from "react";
import Toast from "react-native-toast-message";
import { ReportPrintModal } from "@/components/ReportPrintModal";
import { FlujoTicketVistaPrevia } from "@/screens/user/pasajes/components/FlujoTicketVistaPrevia";
import { egresoService } from "../services/egresoService";
import { ingresoService } from "../services/ingresoService";
import { MovComprobante, MovimientoComprobantePreview } from "./MovimientoComprobantePrint";
export type KindMovimiento="ingreso"|"egreso";
export function MovimientoPrintModal({visible,kind,movimiento,onClose}:{visible:boolean;kind:KindMovimiento;movimiento:MovComprobante|null;onClose:()=>void}){
 const cargar=useCallback(async()=>{
  if(!movimiento)throw new Error("No hay movimiento seleccionado para imprimir.");
  const html=kind==="ingreso"?await ingresoService.obtenerHtmlComprobante(movimiento.id):await egresoService.obtenerHtmlComprobante(movimiento.id);
  return {html,titulo:`${kind==="ingreso"?"Ingreso":"Egreso"} #${movimiento.id}`,subtitulo:"Comprobante térmico de caja"};
 },[kind,movimiento?.id]);
 return <FlujoTicketVistaPrevia visible={visible} cargar={cargar} onClose={onClose} renderAnimado={({doc,imprimir,cerrar})=><ReportPrintModal visible onClose={cerrar} fetchHtml={async()=>doc.html} onPrintHtml={imprimir} resetKey={`${kind}-${movimiento?.id??0}`} title={doc.titulo} headerTitle="Comprobante de caja" screenTitle={kind==="ingreso"?"Comprobante de ingreso":"Comprobante de egreso"} screenSubtitle={movimiento?.tipo_transaccion?`${movimiento.tipo_transaccion.codigo} — ${movimiento.tipo_transaccion.transaccion}`:undefined} screenTotalValue={movimiento?`Bs ${Number(movimiento.monto||0).toFixed(2)}`:undefined} statusLabels={{processing:"Preparando ticket 58 mm…",printing:"Imprimiendo ticket…",complete:"Ticket impreso"}} paperSize="receipt" outputHeight={650} printingDuration={1600} onComplete={()=>Toast.show({type:"success",text1:"Comprobante enviado a impresión"})} onError={(e)=>Toast.show({type:"error",text1:"No se pudo imprimir",text2:e instanceof Error?e.message:"Intenta nuevamente."})}>{movimiento?<MovimientoComprobantePreview kind={kind} mov={movimiento}/>:null}</ReportPrintModal>}/>;
}
export default MovimientoPrintModal;
