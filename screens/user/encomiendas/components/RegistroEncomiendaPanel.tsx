import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select, SelectOption } from "@/components/ui/Select";
import { useTheme } from "@/theme/useTheme";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import Toast from "react-native-toast-message";
import { encomiendaService } from "../services/encomienda.service";
import { Cliente, DetalleEncomienda, EncomiendaCatalogos, EncomiendaPayload, LugarPago, TipoPago } from "../types/encomienda.types";
import { ClienteSelectorModal } from "./ClienteSelectorModal";

function dinero(n:number){return Number.isFinite(n)?n.toFixed(2):"0.00";}

export function RegistroEncomiendaPanel({onCreated}:{onCreated?:()=>void}){
  const {theme}=useTheme(); const c=theme.colors; const {width}=useWindowDimensions(); const mobile=width<768;
  const [catalogos,setCatalogos]=useState<EncomiendaCatalogos|null>(null);
  const [loading,setLoading]=useState(false); const [saving,setSaving]=useState(false);
  const [remitente,setRemitente]=useState<Cliente|null>(null); const [destinatario,setDestinatario]=useState<Cliente|null>(null);
  const [selector,setSelector]=useState<"remitente"|"destinatario"|null>(null);
  const [idViaje,setIdViaje]=useState<number|undefined>(); const [rutaFiltro,setRutaFiltro]=useState<string|undefined>();
  const [concepto,setConcepto]=useState("");
  const [detalle,setDetalle]=useState(""); const [cantidad,setCantidad]=useState("1"); const [precio,setPrecio]=useState("");
  const [detalles,setDetalles]=useState<DetalleEncomienda[]>([]); const [editIndex,setEditIndex]=useState<number|null>(null);
  const [descuento,setDescuento]=useState("0"); const [lugarPago,setLugarPago]=useState<LugarPago>("Origen");
  const [tipoPago,setTipoPago]=useState<TipoPago|undefined>("Efectivo");

  useEffect(()=>{(async()=>{setLoading(true);try{setCatalogos(await encomiendaService.catalogos());}catch(e:any){Toast.show({type:"error",text1:"No se pudieron cargar viajes",text2:e?.message});}finally{setLoading(false);}})();},[]);

  const rutas=useMemo(()=>{const m=new Map<number,string>();(catalogos?.viajes??[]).forEach(v=>{if(v.ruta)m.set(v.ruta.id,`${v.ruta.origen} → ${v.ruta.destino}`)});return Array.from(m.entries()).map(([id,label])=>({value:String(id),label}));},[catalogos]);
  const viajes=useMemo<SelectOption<number>[]>(()=> (catalogos?.viajes??[]).filter(v=>!rutaFiltro||String(v.ruta?.id)===rutaFiltro).map(v=>({
    value:v.id,label:`Viaje #${v.id} · ${v.ruta?`${v.ruta.origen} → ${v.ruta.destino}`:"Sin ruta"}`,
    description:[v.vehiculo?.placa,v.chofer?.nombre,v.estado].filter(Boolean).join(" · ")
  })),[catalogos,rutaFiltro]);

  const cantidadTotal=useMemo(()=>detalles.reduce((a,d)=>a+Number(d.cantidad||0),0),[detalles]);
  const subtotal=useMemo(()=>detalles.reduce((a,d)=>a+Number(d.cantidad||0)*Number(d.precio_unitario||0),0),[detalles]);
  const desc=Math.max(0,Number(descuento)||0); const total=Math.max(0,subtotal-desc);

  const limpiarDetalle=()=>{setDetalle("");setCantidad("1");setPrecio("");setEditIndex(null);};
  const agregar=()=>{
    const cant=Number(cantidad), pu=Number(precio);
    if(!detalle.trim()){Toast.show({type:"error",text1:"Falta el detalle"});return;}
    if(!Number.isInteger(cant)||cant<1){Toast.show({type:"error",text1:"Cantidad inválida"});return;}
    if(!Number.isFinite(pu)||pu<0){Toast.show({type:"error",text1:"Precio inválido"});return;}
    const nuevo={detalle:detalle.trim(),cantidad:cant,precio_unitario:pu};
    setDetalles(prev=>editIndex===null?[...prev,nuevo]:prev.map((x,i)=>i===editIndex?nuevo:x)); limpiarDetalle();
  };
  const editar=(i:number)=>{const d=detalles[i];setDetalle(d.detalle);setCantidad(String(d.cantidad));setPrecio(String(d.precio_unitario));setEditIndex(i);};
  const quitar=(i:number)=>{setDetalles(prev=>prev.filter((_,idx)=>idx!==i)); if(editIndex===i)limpiarDetalle();};

  const reset=()=>{setRemitente(null);setDestinatario(null);setIdViaje(undefined);setRutaFiltro(undefined);setConcepto("");setDetalles([]);limpiarDetalle();setDescuento("0");setLugarPago("Origen");setTipoPago("Efectivo");};

  const registrar=async()=>{
    if(!remitente||!destinatario){Toast.show({type:"error",text1:"Selecciona remitente y destinatario"});return;}
    if(remitente.id===destinatario.id){Toast.show({type:"error",text1:"Remitente y destinatario deben ser diferentes"});return;}
    if(!idViaje){Toast.show({type:"error",text1:"Selecciona un viaje"});return;}
    if(detalles.length===0){Toast.show({type:"error",text1:"Agrega al menos un detalle"});return;}
    if(desc>subtotal){Toast.show({type:"error",text1:"El descuento no puede superar el subtotal"});return;}
    const pagado=lugarPago==="Origen";
    if(pagado&&!tipoPago){Toast.show({type:"error",text1:"Selecciona el método de pago"});return;}
    const payload:EncomiendaPayload={id_viaje:idViaje,id_remitente:remitente.id,id_destinatario:destinatario.id,concepto:concepto.trim()||null,
      descuento:desc,lugar_pago:lugarPago,estado_pago:pagado?"Pagado":"Pendiente",tipo_pago:pagado?tipoPago:null,
      detalles:detalles.map(d=>({detalle:d.detalle,cantidad:Number(d.cantidad),precio_unitario:Number(d.precio_unitario)}))};
    setSaving(true);
    try{const r=await encomiendaService.crear(payload);Toast.show({type:"success",text1:"Encomienda registrada",text2:r.encomienda.guia??r.message});reset();onCreated?.();}
    catch(e:any){Toast.show({type:"error",text1:"No se pudo registrar",text2:e?.message||"Revisa los datos."});}
    finally{setSaving(false);}
  };

  const ClienteBox=({label,value,tipo}:{label:string,value:Cliente|null,tipo:"remitente"|"destinatario"})=><View style={styles.clientWrap}>
    <ThemedText style={[styles.label,{color:c.textSecondary}]}>{label}</ThemedText>
    <Pressable onPress={()=>setSelector(tipo)} style={[styles.clientBox,{borderColor:c.border,backgroundColor:c.input}]}>
      <UserRound size={18} color={c.primary}/><View style={styles.clientText}><ThemedText numberOfLines={1} style={styles.clientName}>{value?.nombre_completo??`Buscar ${label.toLowerCase()}...`}</ThemedText>
      {value?<ThemedText style={{color:c.textSecondary}}>CI {value.ci||"—"} · {value.telefono||"Sin teléfono"}</ThemedText>:null}</View><Plus size={20} color={c.primary}/>
    </Pressable>
  </View>;

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Card style={styles.card}>
      <ThemedText style={styles.title}>Registrar encomienda</ThemedText>
      <ThemedText style={{color:c.textSecondary}}>Selecciona clientes y viaje, agrega uno o varios detalles y confirma el pago.</ThemedText>
      <View style={[styles.row,mobile&&styles.stack]}>
        <View style={styles.flex}><ClienteBox label="Remitente" value={remitente} tipo="remitente"/></View>
        <View style={styles.flex}><ClienteBox label="Destinatario" value={destinatario} tipo="destinatario"/></View>
      </View>
      <View style={[styles.row,mobile&&styles.stack]}>
        <View style={styles.flex}><Select value={rutaFiltro} options={rutas} onValueChange={(v)=>{setRutaFiltro(v);setIdViaje(undefined);}} label="Filtrar por ruta" placeholder="Todas las rutas" searchable /></View>
        <View style={[styles.flex2]}><Select value={idViaje} options={viajes} onValueChange={setIdViaje} label="Viaje *" placeholder={loading?"Cargando...":"Seleccionar viaje"} searchable searchPlaceholder="Buscar viaje, ruta, placa o chofer..." disabled={loading}/></View>
      </View>
      <Input label="Concepto" value={concepto} onChangeText={setConcepto} placeholder="Ej. Envío de mercadería"/>
    </Card>

    <Card style={styles.card}>
      <ThemedText style={styles.sectionTitle}>Detalle de encomienda</ThemedText>
      <View style={[styles.detailEntry,mobile&&styles.stack]}>
        <View style={styles.flex2}><Input label="Detalle *" value={detalle} onChangeText={setDetalle} placeholder="Caja, sobre, paquete..."/></View>
        <View style={styles.small}><Input label="Cantidad *" value={cantidad} onChangeText={setCantidad} keyboardType="numeric"/></View>
        <View style={styles.small}><Input label="Precio unitario (Bs) *" value={precio} onChangeText={setPrecio} keyboardType="decimal-pad"/></View>
        <Button title={editIndex===null?"+ Agregar":"Guardar"} onPress={agregar} style={styles.addButton}/>
      </View>

      {!mobile?<View style={[styles.tableHead,{borderColor:c.border,backgroundColor:c.backgroundSecondary}]}>
        <ThemedText style={[styles.colDetail,styles.th]}>Detalle</ThemedText><ThemedText style={[styles.colQty,styles.th]}>Cant.</ThemedText>
        <ThemedText style={[styles.colMoney,styles.th]}>P/U</ThemedText><ThemedText style={[styles.colMoney,styles.th]}>Subtotal</ThemedText><ThemedText style={[styles.colAct,styles.th]}>Acc.</ThemedText>
      </View>:null}
      {detalles.length===0?<View style={styles.empty}><ThemedText style={{color:c.textSecondary}}>Todavía no agregaste ningún detalle.</ThemedText></View>:
      detalles.map((d,i)=>mobile?<View key={`${i}-${d.detalle}`} style={[styles.mobileDetail,{borderColor:c.border}]}>
        <View style={styles.mobileDetailTop}><ThemedText style={styles.mobileDetailTitle}>{d.detalle}</ThemedText><View style={styles.actions}><Pressable onPress={()=>editar(i)}><Pencil size={18} color={c.primary}/></Pressable><Pressable onPress={()=>quitar(i)}><Trash2 size={18} color={c.destructive}/></Pressable></View></View>
        <ThemedText style={{color:c.textSecondary}}>{d.cantidad} × Bs {dinero(Number(d.precio_unitario))}</ThemedText><ThemedText style={styles.mobileDetailTotal}>Bs {dinero(Number(d.cantidad)*Number(d.precio_unitario))}</ThemedText>
      </View>:<View key={`${i}-${d.detalle}`} style={[styles.tableRow,{borderColor:c.border}]}>
        <ThemedText style={styles.colDetail}>{d.detalle}</ThemedText><ThemedText style={styles.colQty}>{d.cantidad}</ThemedText>
        <ThemedText style={styles.colMoney}>Bs {dinero(Number(d.precio_unitario))}</ThemedText><ThemedText style={styles.colMoney}>Bs {dinero(Number(d.cantidad)*Number(d.precio_unitario))}</ThemedText>
        <View style={[styles.colAct,styles.actions]}><Pressable onPress={()=>editar(i)}><Pencil size={18} color={c.primary}/></Pressable><Pressable onPress={()=>quitar(i)}><Trash2 size={18} color={c.destructive}/></Pressable></View>
      </View>)}
    </Card>

    <Card style={styles.card}>
      <View style={[styles.summary,mobile&&styles.stack]}>
        <View style={styles.metric}><ThemedText style={{color:c.textSecondary}}>Cantidad</ThemedText><ThemedText style={styles.metricValue}>{cantidadTotal}</ThemedText></View>
        <View style={styles.metric}><ThemedText style={{color:c.textSecondary}}>Subtotal</ThemedText><ThemedText style={styles.metricValue}>Bs {dinero(subtotal)}</ThemedText></View>
        <View style={styles.discount}><Input label="Descuento (Bs)" value={descuento} onChangeText={setDescuento} keyboardType="decimal-pad"/></View>
        <View style={styles.metric}><ThemedText style={{color:c.textSecondary}}>Total</ThemedText><ThemedText style={[styles.total,{color:c.primary}]}>Bs {dinero(total)}</ThemedText></View>
      </View>
      <View style={[styles.payment,mobile&&styles.stack,{borderTopColor:c.border}]}>
        <View style={styles.flex}><Select value={lugarPago} options={[{value:"Origen",label:"Pago en origen"},{value:"Destino",label:"Pago en destino"}]} onValueChange={(v)=>{setLugarPago(v);if(v==="Destino")setTipoPago(undefined);else setTipoPago("Efectivo");}} label="Lugar de pago"/></View>
        <View style={styles.flex}><Select value={tipoPago} options={[{value:"Efectivo",label:"Efectivo"},{value:"QR",label:"QR"},{value:"Transferencia",label:"Transferencia"}]} onValueChange={setTipoPago} label="Método de pago" placeholder={lugarPago==="Destino"?"Se define al cobrar":"Seleccionar"} disabled={lugarPago==="Destino"}/></View>
        <View style={styles.status}><ThemedText style={{color:c.textSecondary}}>Estado de pago</ThemedText><ThemedText style={styles.statusValue}>{lugarPago==="Origen"?"PAGADO":"PENDIENTE"}</ThemedText></View>
        <Button title="Registrar encomienda" onPress={()=>void registrar()} loading={saving} disabled={loading||detalles.length===0}/>
      </View>
    </Card>

    <ClienteSelectorModal visible={selector!==null} title={selector==="remitente"?"Seleccionar remitente":"Seleccionar destinatario"} value={selector==="remitente"?remitente:destinatario} onClose={()=>setSelector(null)} onSelect={(cl)=>selector==="remitente"?setRemitente(cl):setDestinatario(cl)}/>
  </ScrollView>;
}
const styles=StyleSheet.create({
 scroll:{flex:1},content:{gap:12,paddingBottom:100},card:{gap:12},title:{fontSize:22,fontWeight:"900"},sectionTitle:{fontSize:17,fontWeight:"900"},
 row:{flexDirection:"row",gap:12,alignItems:"flex-start"},stack:{flexDirection:"column"},flex:{flex:1,minWidth:220},flex2:{flex:2,minWidth:260},small:{width:150,minWidth:130},
 clientWrap:{gap:6},label:{fontSize:13,fontWeight:"600"},clientBox:{minHeight:58,borderWidth:1.5,borderRadius:10,paddingHorizontal:12,flexDirection:"row",alignItems:"center",gap:10},
 clientText:{flex:1},clientName:{fontWeight:"800"},detailEntry:{flexDirection:"row",gap:10,alignItems:"flex-end"},addButton:{minWidth:120},
 tableHead:{flexDirection:"row",padding:10,borderWidth:1,borderRadius:8},tableRow:{flexDirection:"row",padding:10,borderBottomWidth:1,alignItems:"center"},th:{fontWeight:"800"},
 colDetail:{flex:3},colQty:{flex:0.7,textAlign:"center"},colMoney:{flex:1,textAlign:"right"},colAct:{width:72,textAlign:"center"},actions:{flexDirection:"row",gap:14,justifyContent:"center"},
 empty:{padding:24,alignItems:"center"},summary:{flexDirection:"row",gap:20,alignItems:"center",justifyContent:"space-between"},metric:{minWidth:120},metricValue:{fontSize:20,fontWeight:"900"},discount:{minWidth:180},total:{fontSize:24,fontWeight:"900"},
 payment:{borderTopWidth:1,paddingTop:14,flexDirection:"row",gap:12,alignItems:"flex-end"},status:{minWidth:140,paddingBottom:10},statusValue:{fontWeight:"900"},scrollPad:{paddingBottom:100},
 mobileDetail:{borderWidth:1,borderRadius:10,padding:12,gap:5},mobileDetailTop:{flexDirection:"row",justifyContent:"space-between",gap:8},mobileDetailTitle:{fontWeight:"800",flex:1},mobileDetailTotal:{fontWeight:"900",fontSize:16}
});
