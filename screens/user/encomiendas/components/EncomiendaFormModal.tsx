import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ThemedText } from "@/components/ThemedText";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ClienteSelectorModal } from "./ClienteSelectorModal";
import { Cliente, Encomienda, EncomiendaCatalogos, EncomiendaUpdatePayload, LugarPago, TipoPago } from "../types/encomienda.types";

export function EncomiendaFormModal({visible,encomienda,catalogos,loadingCatalogos,saving,onClose,onLoadCatalogos,onUpdate,onChangeTrip}:{
 visible:boolean; encomienda:Encomienda|null; catalogos:EncomiendaCatalogos|null; loadingCatalogos:boolean; saving:boolean;
 onClose:()=>void; onLoadCatalogos:()=>Promise<boolean>;
 onUpdate:(e:Encomienda,p:EncomiendaUpdatePayload)=>Promise<boolean>;
 onChangeTrip:(e:Encomienda,idViaje:number)=>Promise<boolean>;
}){
 const [rem,setRem]=useState<Cliente|null>(null),[des,setDes]=useState<Cliente|null>(null),[sel,setSel]=useState<"r"|"d"|null>(null);
 const [concepto,setConcepto]=useState(""),[descuento,setDescuento]=useState("0");
 const [lugar,setLugar]=useState<LugarPago>("Origen"),[tipo,setTipo]=useState<TipoPago|undefined>("Efectivo");
 const [viaje,setViaje]=useState<number|undefined>();

 useEffect(()=>{if(visible&&encomienda){setRem(encomienda.remitente);setDes(encomienda.destinatario);setConcepto(encomienda.concepto??"");
   setDescuento(String(encomienda.descuento??"0"));setLugar(encomienda.lugar_pago);setTipo(encomienda.tipo_pago??undefined);setViaje(encomienda.viaje?.id);
   if(!catalogos)void onLoadCatalogos();}},[visible,encomienda,catalogos,onLoadCatalogos]);

 const viajes=useMemo(()=> (catalogos?.viajes??[]).map(v=>({value:v.id,label:`Viaje #${v.id} · ${v.ruta?`${v.ruta.origen} → ${v.ruta.destino}`:"Sin ruta"}`,description:[v.vehiculo?.placa,v.chofer?.nombre].filter(Boolean).join(" · ")})),[catalogos]);
 if(!encomienda)return null;
 const guardar=async()=>{
   if(!rem||!des||rem.id===des.id)return;
   const d=Math.max(0,Number(descuento)||0);
   const estadoPago = lugar==="Origen" ? "Pagado" as const : "Pendiente" as const;
   const payload:EncomiendaUpdatePayload={id_remitente:rem.id,id_destinatario:des.id,concepto:concepto.trim()||null,descuento:d,lugar_pago:lugar,estado_pago:estadoPago,tipo_pago:lugar==="Origen"?(tipo??"Efectivo"):null};
   const ok=await onUpdate(encomienda,payload);
   if(ok&&viaje&&viaje!==encomienda.viaje?.id)await onChangeTrip(encomienda,viaje);
 };
 return <><Modal visible={visible} title={`Editar ${encomienda.guia??"encomienda"}`} onClose={onClose}><View style={styles.body}>
  <ThemedText>Los datos generales y el viaje solo pueden modificarse mientras la encomienda está en origen. El detalle registrado permanece bloqueado.</ThemedText>
  <View style={styles.row}><Button title={`Remitente: ${rem?.nombre_completo??"Seleccionar"}`} variant="secondary" onPress={()=>setSel("r")}/><Button title={`Destinatario: ${des?.nombre_completo??"Seleccionar"}`} variant="secondary" onPress={()=>setSel("d")}/></View>
  <Select<number> label="Viaje" value={viaje} options={viajes} onValueChange={setViaje} searchable disabled={loadingCatalogos} placeholder="Seleccionar viaje"/>
  <Input label="Concepto" value={concepto} onChangeText={setConcepto}/>
  <Input label="Descuento (Bs)" value={descuento} onChangeText={setDescuento} keyboardType="decimal-pad"/>
  <View style={styles.row}><View style={styles.flex}><Select<LugarPago> label="Lugar de pago" value={lugar} options={[{value:"Origen",label:"Pago en origen"},{value:"Destino",label:"Pago en destino"}]} onValueChange={v=>{setLugar(v);setTipo(v==="Origen"?"Efectivo":undefined)}}/></View>
  <View style={styles.flex}><Select<TipoPago> label="Método" value={tipo} options={[{value:"Efectivo",label:"Efectivo"},{value:"QR",label:"QR"},{value:"Transferencia",label:"Transferencia"}]} onValueChange={setTipo} disabled={lugar==="Destino"} placeholder={lugar==="Destino"?"Pendiente":"Seleccionar"}/></View></View>
  <View style={styles.actions}><Button title="Cancelar" variant="secondary" onPress={onClose} disabled={saving}/><Button title="Guardar cambios" onPress={()=>void guardar()} loading={saving} disabled={!rem||!des||rem.id===des.id||!viaje}/></View>
 </View></Modal>
 <ClienteSelectorModal visible={sel!==null} title={sel==="r"?"Seleccionar remitente":"Seleccionar destinatario"} value={sel==="r"?rem:des} onClose={()=>setSel(null)} onSelect={c=>sel==="r"?setRem(c):setDes(c)}/>
 </>;
}
const styles=StyleSheet.create({body:{gap:14},row:{flexDirection:"row",gap:8,flexWrap:"wrap"},flex:{flex:1,minWidth:180},actions:{flexDirection:"row",justifyContent:"flex-end",gap:8,flexWrap:"wrap"}});
