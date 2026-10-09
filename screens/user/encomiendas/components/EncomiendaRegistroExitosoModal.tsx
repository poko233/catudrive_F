import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/theme/useTheme";
import { StyleSheet, View } from "react-native";
import { Encomienda } from "../types/encomienda.types";

type Props={visible:boolean;encomienda:Encomienda|null;onImprimir:()=>void;onVerEncomiendas:()=>void;};
const nombre=(c:Encomienda["remitente"])=>c?.nombre_completo??"—";
const cantidad=(e:Encomienda)=>e.detalles.reduce((a,d)=>a+Number(d.cantidad||0),0);
export function EncomiendaRegistroExitosoModal({visible,encomienda,onImprimir,onVerEncomiendas}:Props){
 const {theme}=useTheme();const c=theme.colors;if(!encomienda)return null;
 return <Modal visible={visible} title="Encomienda registrada" onClose={onVerEncomiendas} maxWidth={560} scrollable={false} closeOnBackdropPress={false} footer={<View style={styles.footer}><Button title="Ver encomiendas" variant="secondary" onPress={onVerEncomiendas}/><Button title="Imprimir" onPress={onImprimir}/></View>}>
  <View style={styles.body}><View style={[styles.success,{backgroundColor:c.backgroundSecondary}]}><ThemedText style={styles.guia}>{encomienda.guia??"Encomienda"}</ThemedText><ThemedText style={{color:c.textSecondary}}>Registro realizado correctamente</ThemedText></View>
  <View style={styles.grid}><Dato label="Remitente" value={nombre(encomienda.remitente)}/><Dato label="Destinatario" value={nombre(encomienda.destinatario)}/><Dato label="Ruta" value={`${encomienda.origen??"—"} → ${encomienda.destino??"—"}`}/><Dato label="Cantidad" value={String(cantidad(encomienda))}/><Dato label="Total" value={`Bs ${Number(encomienda.total).toFixed(2)}`}/><Dato label="Pago" value={encomienda.estado_pago}/></View></View>
 </Modal>;
 function Dato({label,value}:{label:string;value:string}){return <View style={styles.dato}><ThemedText style={{color:c.textSecondary,fontSize:12}}>{label}</ThemedText><ThemedText numberOfLines={2} style={styles.valor}>{value}</ThemedText></View>}
}
const styles=StyleSheet.create({body:{gap:14},success:{padding:14,borderRadius:12,alignItems:"center"},guia:{fontSize:22,fontWeight:"900"},grid:{flexDirection:"row",flexWrap:"wrap",gap:10},dato:{width:"48%",minWidth:150},valor:{fontWeight:"800",marginTop:2},footer:{flexDirection:"row",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}});
