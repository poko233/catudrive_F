import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { useTheme } from "@/theme/useTheme";
import { UserRound } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { clienteService } from "../services/cliente.service";
import { Cliente, EncomiendaCatalogoChofer, EncomiendaListFilters, EstadoEncomienda, EstadoPago, TipoPago } from "../types/encomienda.types";

type Value={estado?:EstadoEncomienda;tipo_pago?:TipoPago;estado_pago?:EstadoPago;id_cliente?:number;id_chofer?:number};
export function EncomiendaFiltrosModal({visible,value,choferes,onClose,onApply}:{visible:boolean;value:Value;choferes:EncomiendaCatalogoChofer[];onClose:()=>void;onApply:(v:Value)=>void}){
 const {theme}=useTheme();const c=theme.colors;const {width}=useWindowDimensions();const mobile=width<768;
 const [draft,setDraft]=useState<Value>(value);const [clientes,setClientes]=useState<Cliente[]>([]);const [buscarCliente,setBuscarCliente]=useState("");const [buscarChofer,setBuscarChofer]=useState("");const [loadingClientes,setLoadingClientes]=useState(false);const seq=useRef(0);
 useEffect(()=>{if(visible)setDraft(value)},[visible,value]);
 const cargarClientes=useCallback(async(q:string)=>{const n=++seq.current;setLoadingClientes(true);try{const r=await clienteService.buscar(q.trim());if(n===seq.current)setClientes(r.slice(0,10));}finally{if(n===seq.current)setLoadingClientes(false)}},[]);
 useEffect(()=>{if(!visible)return;const t=setTimeout(()=>void cargarClientes(buscarCliente),300);return()=>clearTimeout(t)},[visible,buscarCliente,cargarClientes]);
 const choferesFiltrados=useMemo(()=>{const q=buscarChofer.trim().toLowerCase();return choferes.filter(x=>!q||`${x.nombre} ${x.ci??""} ${x.telefono??""}`.toLowerCase().includes(q)).slice(0,10)},[choferes,buscarChofer]);
 const limpiar=()=>setDraft({});
 return <Modal visible={visible} title="Filtrar encomiendas" onClose={onClose}>
  <ScrollView style={styles.scroll} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
   <View style={[styles.grid,mobile&&styles.stack]}>
    <View style={styles.flex}><Select value={draft.estado??"TODOS"} label="Estado" options={[{value:"TODOS",label:"Todos"},{value:"EN_ORIGEN",label:"En origen"},{value:"EN_TRANSITO",label:"En tránsito"},{value:"EN_DESTINO",label:"En destino"},{value:"ENTREGADA",label:"Entregada"},{value:"ANULADA",label:"Anulada"}]} onValueChange={(v:any)=>setDraft(d=>({...d,estado:v==="TODOS"?undefined:v}))}/></View>
    <View style={styles.flex}><Select value={draft.tipo_pago??"TODOS"} label="Tipo de pago" options={[{value:"TODOS",label:"Todos"},{value:"Efectivo",label:"Efectivo"},{value:"QR",label:"QR"},{value:"Transferencia",label:"Transferencia"}]} onValueChange={(v:any)=>setDraft(d=>({...d,tipo_pago:v==="TODOS"?undefined:v}))}/></View>
    <View style={styles.flex}><Select value={draft.estado_pago??"TODOS"} label="Estado de pago" options={[{value:"TODOS",label:"Todos"},{value:"Pagado",label:"Pagado"},{value:"Pendiente",label:"Pendiente"}]} onValueChange={(v:any)=>setDraft(d=>({...d,estado_pago:v==="TODOS"?undefined:v}))}/></View>
   </View>
   <View style={[styles.grid,mobile&&styles.stack]}>
    <View style={styles.selector}><ThemedText style={styles.label}>Cliente</ThemedText><SearchBar value={buscarCliente} onChangeText={setBuscarCliente} placeholder="Nombre, CI o teléfono..."/>{loadingClientes?<ActivityIndicator color={c.primary}/>:<ScrollView style={styles.list} nestedScrollEnabled>{draft.id_cliente?<Pressable onPress={()=>setDraft(d=>({...d,id_cliente:undefined}))} style={[styles.selected,{borderColor:c.primary}]}><ThemedText style={styles.bold}>Todos los clientes</ThemedText></Pressable>:null}{clientes.map(x=><Pressable key={x.id} onPress={()=>setDraft(d=>({...d,id_cliente:x.id}))} style={[styles.item,{borderColor:draft.id_cliente===x.id?c.primary:c.border,backgroundColor:c.card}]}><UserRound size={17} color={c.primary}/><View style={styles.flex}><ThemedText numberOfLines={1} style={styles.bold}>{x.nombre_completo}</ThemedText><ThemedText numberOfLines={1} style={{color:c.textSecondary,fontSize:11}}>CI {x.ci||"—"} · {x.telefono||"Sin teléfono"}</ThemedText></View></Pressable>)}</ScrollView>}</View>
    <View style={styles.selector}><ThemedText style={styles.label}>Chofer</ThemedText><SearchBar value={buscarChofer} onChangeText={setBuscarChofer} placeholder="Nombre, CI o teléfono..."/><ScrollView style={styles.list} nestedScrollEnabled>{draft.id_chofer?<Pressable onPress={()=>setDraft(d=>({...d,id_chofer:undefined}))} style={[styles.selected,{borderColor:c.primary}]}><ThemedText style={styles.bold}>Todos los choferes</ThemedText></Pressable>:null}{choferesFiltrados.map(x=><Pressable key={x.id} onPress={()=>setDraft(d=>({...d,id_chofer:x.id}))} style={[styles.item,{borderColor:draft.id_chofer===x.id?c.primary:c.border,backgroundColor:c.card}]}><UserRound size={17} color={c.primary}/><View style={styles.flex}><ThemedText numberOfLines={1} style={styles.bold}>{x.nombre}</ThemedText><ThemedText numberOfLines={1} style={{color:c.textSecondary,fontSize:11}}>CI {x.ci||"—"}{x.telefono?` · ${x.telefono}`:""}</ThemedText></View></Pressable>)}</ScrollView></View>
   </View>
  </ScrollView>
  <View style={styles.footer}><Button title="Limpiar" variant="secondary" onPress={limpiar} style={styles.button}/><Button title="Ver resultados" onPress={()=>{onApply(draft);onClose()}} style={styles.button}/></View>
 </Modal>
}
const styles=StyleSheet.create({scroll:{maxHeight:560},body:{gap:14,paddingBottom:8},grid:{flexDirection:"row",gap:10},stack:{flexDirection:"column"},flex:{flex:1,minWidth:0},selector:{flex:1,minWidth:0,gap:7},label:{fontWeight:"800",fontSize:13},list:{maxHeight:220},item:{borderWidth:1,borderRadius:10,padding:9,flexDirection:"row",gap:8,alignItems:"center",marginBottom:6},selected:{borderWidth:1,borderRadius:10,padding:9,marginBottom:6},bold:{fontWeight:"800"},footer:{flexDirection:"row",gap:10,paddingTop:10},button:{flex:1}});
