import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Encomienda, EncomiendaCatalogos } from "../types/encomienda.types";

export function EncomiendaAsignarModal({visible,encomienda,catalogos,loadingCatalogos,saving,onClose,onLoadCatalogos,onAssign}:{
 visible:boolean; encomienda:Encomienda|null; catalogos:EncomiendaCatalogos|null; loadingCatalogos:boolean; saving:boolean;
 onClose:()=>void; onLoadCatalogos:()=>Promise<boolean>; onAssign:(e:Encomienda,idViaje:number)=>Promise<boolean>;
}){
 const [viaje,setViaje]=useState<number|undefined>();
 useEffect(()=>{if(visible){setViaje(encomienda?.viaje?.id);if(!catalogos)void onLoadCatalogos();}},[visible,encomienda,catalogos,onLoadCatalogos]);
 const options=useMemo(()=> (catalogos?.viajes??[]).map(v=>({value:v.id,label:`Viaje #${v.id} · ${v.ruta?`${v.ruta.origen} → ${v.ruta.destino}`:"Sin ruta"}`,description:[v.vehiculo?.placa,v.chofer?.nombre].filter(Boolean).join(" · ")})),[catalogos]);
 if(!encomienda)return null;
 return <Modal visible={visible} title="Cambiar viaje" onClose={onClose}><View style={styles.body}>
  <Select<number> label="Viaje" value={viaje} options={options} onValueChange={setViaje} searchable disabled={loadingCatalogos} placeholder="Seleccionar viaje"/>
  <View style={styles.actions}><Button title="Cancelar" variant="secondary" onPress={onClose}/><Button title="Guardar" loading={saving} disabled={!viaje} onPress={()=>{if(viaje)void onAssign(encomienda,viaje)}}/></View>
 </View></Modal>;
}
const styles=StyleSheet.create({body:{gap:14},actions:{flexDirection:"row",justifyContent:"flex-end",gap:8,flexWrap:"wrap"}});
