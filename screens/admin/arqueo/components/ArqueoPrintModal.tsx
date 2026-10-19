import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { ReportPrintModal } from "@/components/ReportPrintModal";
import { FlujoTicketVistaPrevia } from "@/screens/user/pasajes/components/FlujoTicketVistaPrevia";

import { arqueoService } from "../services/arqueoService";
import type { Arqueo, Ingreso, Egreso } from "../types/arqueo.types";
import { num } from "../types/arqueo.types";

function cajero(a:Arqueo){const u=a.user;return `${u?.nombres??""} ${u?.primer_apellido??""}`.trim()||u?.usuario||`Usuario ${a.id_user}`}
function codigo(m:Ingreso|Egreso){return String(m.tipo_transaccion?.codigo??"").toUpperCase()}
function validos<T extends Ingreso|Egreso>(items:T[]|undefined){return (items??[]).filter(m=>m.estado!=="Anulado")}

export function ArqueoPrintModal({visible,arqueo,onClose}:{visible:boolean;arqueo:Arqueo|null;onClose:()=>void}){
 const [detalle,setDetalle]=useState<Arqueo|null>(arqueo);
 useEffect(()=>{let alive=true;if(visible&&arqueo?.id){setDetalle(arqueo);arqueoService.getById(arqueo.id,{force:true}).then(a=>{if(alive)setDetalle(a)}).catch(()=>{});}return()=>{alive=false}},[visible,arqueo?.id]);
 const a=detalle??arqueo;
 const ingresos=useMemo(()=>validos(a?.ingresos),[a?.ingresos]); const egresos=useMemo(()=>validos(a?.egresos),[a?.egresos]);
 const pasajes=useMemo(()=>ingresos.filter(m=>codigo(m)==="VPASAJE"),[ingresos]); const encomiendas=useMemo(()=>ingresos.filter(m=>codigo(m)==="ENCOMIENDA"),[ingresos]); const otros=useMemo(()=>ingresos.filter(m=>!["VPASAJE","ENCOMIENDA"].includes(codigo(m))),[ingresos]);
 const cargar=useCallback(async()=>{if(!arqueo)throw new Error("No hay arqueo seleccionado.");return {html:await arqueoService.obtenerHtmlComprobante(arqueo.id),titulo:`Arqueo #${arqueo.id}`,subtitulo:"Resumen y movimientos del arqueo"}},[arqueo?.id]);
 return <FlujoTicketVistaPrevia visible={visible} cargar={cargar} onClose={onClose} renderAnimado={({doc,imprimir,cerrar})=><ReportPrintModal visible onClose={cerrar} fetchHtml={async()=>doc.html} onPrintHtml={imprimir} resetKey={`arqueo-${arqueo?.id??0}`} title={doc.titulo} headerTitle="Detalle de arqueo" screenTitle="Ticket térmico 58 mm" screenSubtitle={a?cajero(a):undefined} screenTotalValue={a?`Bs ${num(a.total_general??a.saldo_anterior).toFixed(2)}`:undefined} paperSize="receipt" outputHeight={900} printingDuration={1600} onComplete={()=>Toast.show({type:"success",text1:"Arqueo enviado a impresión"})} onError={(e)=>Toast.show({type:"error",text1:"No se pudo imprimir",text2:e instanceof Error?e.message:"Intenta nuevamente."})}>
 <View style={p.ticket}><Text style={p.title}>DETALLE DE ARQUEO</Text><Text style={p.center}>Arqueo #{a?.id??"-"}</Text><View style={p.sep}/><Row k="Cajero" v={a?cajero(a):"-"}/><Row k="Estado" v={a?.estado??"-"}/><Row k="Saldo anterior" v={`Bs ${num(a?.saldo_anterior).toFixed(2)}`}/><View style={p.sep}/><Text style={p.total}>TOTAL Bs {num(a?.total_general??a?.saldo_anterior).toFixed(2)}</Text>
 <Section title={`VENTAS DE PASAJES (${pasajes.length})`} items={pasajes}/><Section title={`ENCOMIENDAS (${encomiendas.length})`} items={encomiendas}/><Section title={`OTROS INGRESOS (${otros.length})`} items={otros}/><Section title={`EGRESOS (${egresos.length})`} items={egresos}/>
 </View></ReportPrintModal>}/>
}
function Section({title,items}:{title:string;items:(Ingreso|Egreso)[]}){return <View style={p.section}><View style={p.sep}/><Text style={p.sectionTitle}>{title}</Text>{items.length===0?<Text style={p.empty}>Sin registros</Text>:items.map(m=><View key={`${title}-${m.id}`} style={p.item}><View style={p.itemTop}><Text style={p.itemStrong}>#{m.id}</Text><Text style={p.itemStrong}>Bs {num(m.monto).toFixed(2)}</Text></View><Text style={p.itemDetail}>{m.detalle}</Text><View style={p.itemTop}><Text style={p.small}>{String(m.fecha_registro).slice(0,16).replace("T"," ")}</Text><Text style={p.small}>{m.tipo_pago}</Text></View></View>)}</View>}
function Row({k,v}:{k:string;v:string}){return <View style={p.row}><Text style={p.bold}>{k}</Text><Text style={p.value}>{v}</Text></View>}
const p=StyleSheet.create({ticket:{gap:4},title:{fontWeight:"900",textAlign:"center",fontSize:15},center:{textAlign:"center"},sep:{borderTopWidth:1,borderStyle:"dashed",marginVertical:4},row:{flexDirection:"row",justifyContent:"space-between",gap:8},bold:{fontWeight:"800"},value:{textAlign:"right",flexShrink:1},total:{fontSize:16,fontWeight:"900",textAlign:"center"},section:{gap:3},sectionTitle:{fontWeight:"900",textAlign:"center",fontSize:11},empty:{textAlign:"center",fontSize:9},item:{paddingVertical:4,borderBottomWidth:1,borderStyle:"dotted"},itemTop:{flexDirection:"row",justifyContent:"space-between",gap:6},itemStrong:{fontWeight:"800",fontSize:10},itemDetail:{fontSize:9},small:{fontSize:8}});
