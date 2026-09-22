import { Modal } from "@/components/ui/Modal";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import { ScrollView, StyleSheet, View } from "react-native";
import { Encomienda } from "../types/encomienda.types";
const money=(v:any)=>`Bs ${Number(v||0).toFixed(2)}`;
export function EncomiendaDetalleModal({visible,encomienda,onClose}:{visible:boolean;encomienda:Encomienda|null;onClose:()=>void}){
 const {theme}=useTheme();const c=theme.colors;if(!encomienda)return null;
 return <Modal visible={visible} title={`Detalle ${encomienda.guia??""}`} onClose={onClose}><ScrollView style={styles.scroll}><View style={styles.body}>
  <View style={styles.grid}><D l="Remitente" v={encomienda.remitente?.nombre_completo??"—"}/><D l="Destinatario" v={encomienda.destinatario?.nombre_completo??"—"}/><D l="Ruta" v={`${encomienda.origen??"—"} → ${encomienda.destino??"—"}`}/><D l="Concepto" v={encomienda.concepto??"—"}/></View>
  <ThemedText style={styles.title}>Detalle registrado</ThemedText>
  {encomienda.detalles.map((d,i)=><View key={d.id??i} style={[styles.line,{borderColor:c.border}]}><ThemedText style={styles.flex}>{d.detalle}</ThemedText><ThemedText>{d.cantidad} × {money(d.precio_unitario)}</ThemedText><ThemedText style={styles.bold}>{money(Number(d.cantidad)*Number(d.precio_unitario))}</ThemedText></View>)}
  <View style={[styles.totalBox,{borderColor:c.border}]}><D l="Subtotal" v={money(encomienda.subtotal)}/><D l="Descuento" v={money(encomienda.descuento)}/><D l="Total" v={money(encomienda.total)}/><D l="Pago" v={`${encomienda.estado_pago} · ${encomienda.lugar_pago}${encomienda.tipo_pago?` · ${encomienda.tipo_pago}`:""}`}/></View>
 </View></ScrollView></Modal>;
}
function D({l,v}:{l:string;v:string}){return <View style={styles.d}><ThemedText style={styles.label}>{l}</ThemedText><ThemedText style={styles.bold}>{v}</ThemedText></View>}
const styles=StyleSheet.create({scroll:{maxHeight:620},body:{gap:14},grid:{flexDirection:"row",flexWrap:"wrap",gap:12},d:{minWidth:180,flex:1,gap:3},label:{fontSize:12,opacity:.65},bold:{fontWeight:"800"},title:{fontSize:16,fontWeight:"900"},line:{borderBottomWidth:1,paddingVertical:10,flexDirection:"row",gap:12,alignItems:"center"},flex:{flex:1},totalBox:{borderTopWidth:1,paddingTop:12,flexDirection:"row",flexWrap:"wrap",gap:12}});
