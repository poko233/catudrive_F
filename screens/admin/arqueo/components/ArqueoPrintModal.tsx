import React, { useCallback, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { ReportPrintModal } from "@/components/ReportPrintModal";
import { PrinterSetupModal, usePrinterConnection } from "@/components/PrinterConnection";
import { ThermalHtmlRasterizer, ThermalHtmlRasterizerHandle } from "@/screens/user/pasajes/components/ThermalHtmlRasterizer";
import { arqueoService } from "../services/arqueoService";
import type { Arqueo } from "../types/arqueo.types";
import { num } from "../types/arqueo.types";

const REQUIREMENT={type:"receipt",paperSize:"receipt-58"} as const;
function cajero(a:Arqueo){const u=a.user;return `${u?.nombres??""} ${u?.primer_apellido??""}`.trim()||u?.usuario||`Usuario ${a.id_user}`}

export function ArqueoPrintModal({visible,arqueo,onClose}:{visible:boolean;arqueo:Arqueo|null;onClose:()=>void}){
 const rasterizerRef=useRef<ThermalHtmlRasterizerHandle|null>(null); const [setup,setSetup]=useState(false);
 const {configurationRequired,getDefaultPrinterForRequirement,print:printConfigured}=usePrinterConnection();
 const defaultPrinter=getDefaultPrinterForRequirement(REQUIREMENT);
 const fetchHtml=useCallback(async()=>{if(!arqueo)throw new Error("No hay arqueo seleccionado.");return arqueoService.obtenerHtmlComprobante(arqueo.id)},[arqueo]);
 const printHtml=useCallback(async(html:string)=>{const t=Date.now();if(Platform.OS==="web"){const blob=new Blob([html],{type:"text/html;charset=utf-8"});const url=URL.createObjectURL(blob);const w=window.open(url,"_blank","width=360,height=720");if(!w){URL.revokeObjectURL(url);throw new Error("El navegador bloqueó la ventana de impresión.")}setTimeout(()=>{try{w.focus();w.print()}finally{setTimeout(()=>URL.revokeObjectURL(url),60000)}},350);return Date.now()-t}try{const r=rasterizerRef.current;if(!r)throw new Error("El renderizador térmico todavía no está disponible.");const rasterImage=await r.captureHtml(html);await printConfigured({type:"receipt",paperSize:"receipt-58",html,rasterImage,copies:1,cutPaper:true,sunmi:{feedLines:4,imageMode:"binary"}});return Date.now()-t}catch(e){setSetup(true);throw e}},[printConfigured]);
 return <><ReportPrintModal visible={visible} onClose={onClose} fetchHtml={fetchHtml} onPrintHtml={printHtml} resetKey={`arqueo-${arqueo?.id??0}`} title={`Arqueo #${arqueo?.id??""}`} headerTitle="Resumen de arqueo" screenTitle="Ticket térmico 58 mm" screenSubtitle={arqueo?cajero(arqueo):undefined} screenTotalValue={arqueo?`Bs ${num(arqueo.total_general??arqueo.saldo_anterior).toFixed(2)}`:undefined} paperSize="receipt" outputHeight={650} printingDuration={1600} onComplete={()=>Toast.show({type:"success",text1:"Arqueo enviado a impresión"})} onError={(e)=>Toast.show({type:"error",text1:"No se pudo imprimir",text2:e instanceof Error?e.message:"Intenta nuevamente."})}><View style={p.ticket}><Text style={p.title}>RESUMEN DE ARQUEO</Text><Text style={p.center}>Arqueo #{arqueo?.id??"-"}</Text><View style={p.sep}/><Row k="Cajero" v={arqueo?cajero(arqueo):"-"}/><Row k="Estado" v={arqueo?.estado??"-"}/><Row k="Saldo anterior" v={`Bs ${num(arqueo?.saldo_anterior).toFixed(2)}`}/><View style={p.sep}/><Text style={p.total}>TOTAL Bs {num(arqueo?.total_general??arqueo?.saldo_anterior).toFixed(2)}</Text></View></ReportPrintModal><ThermalHtmlRasterizer ref={rasterizerRef}/><PrinterSetupModal visible={setup} requirement={REQUIREMENT} required={Platform.OS!=="web"&&(configurationRequired||!defaultPrinter)} onClose={()=>setSetup(false)} onConfigured={()=>setSetup(false)}/></>
}
function Row({k,v}:{k:string;v:string}){return <View style={p.row}><Text style={p.bold}>{k}</Text><Text>{v}</Text></View>}
const p=StyleSheet.create({ticket:{gap:5},title:{fontWeight:"900",textAlign:"center",fontSize:15},center:{textAlign:"center"},sep:{borderTopWidth:1,borderStyle:"dashed",marginVertical:4},row:{flexDirection:"row",justifyContent:"space-between",gap:8},bold:{fontWeight:"800"},total:{fontSize:16,fontWeight:"900",textAlign:"center"}});
