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

  const detalleVacio=<View style={styles.empty}><ThemedText style={{color:c.textSecondary}}>Todavía no agregaste ningún detalle.</ThemedText></View>;

  const tablaDetalleDesktop=<View style={styles.desktopDetailTable}>
    <View style={[styles.tableHead,{borderColor:c.border,backgroundColor:c.backgroundSecondary}]}>
      <ThemedText style={[styles.colDetail,styles.th]}>Detalle</ThemedText><ThemedText style={[styles.colQty,styles.th]}>Cant.</ThemedText>
      <ThemedText style={[styles.colMoney,styles.th]}>P/U</ThemedText><ThemedText style={[styles.colMoney,styles.th]}>Subtotal</ThemedText><ThemedText style={[styles.colAct,styles.th]}>Acc.</ThemedText>
    </View>
    {detalles.length===0?detalleVacio:<ScrollView style={styles.desktopDetailRows} contentContainerStyle={styles.desktopDetailRowsContent} nestedScrollEnabled showsVerticalScrollIndicator>
      {detalles.map((d,i)=><View key={`${i}-${d.detalle}`} style={[styles.tableRow,{borderColor:c.border}]}>
        <ThemedText numberOfLines={2} style={styles.colDetail}>{d.detalle}</ThemedText><ThemedText style={styles.colQty}>{d.cantidad}</ThemedText>
        <ThemedText style={styles.colMoney}>Bs {dinero(Number(d.precio_unitario))}</ThemedText><ThemedText style={styles.colMoney}>Bs {dinero(Number(d.cantidad)*Number(d.precio_unitario))}</ThemedText>
        <View style={[styles.colAct,styles.actions]}><Pressable onPress={()=>editar(i)}><Pencil size={17} color={c.primary}/></Pressable><Pressable onPress={()=>quitar(i)}><Trash2 size={17} color={c.destructive}/></Pressable></View>
      </View>)}
    </ScrollView>}
  </View>;

  const mobileContent=<ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Card style={styles.card}>
      <View style={[styles.row,styles.stack]}>
        <View style={[styles.flex,styles.mobileFull]}><ClienteBox label="Remitente" value={remitente} tipo="remitente"/></View>
        <View style={[styles.flex,styles.mobileFull]}><ClienteBox label="Destinatario" value={destinatario} tipo="destinatario"/></View>
      </View>
      <View style={[styles.row,styles.stack]}>
        <View style={[styles.flex,styles.mobileFull]}><Select value={rutaFiltro} options={rutas} onValueChange={(v)=>{setRutaFiltro(v);setIdViaje(undefined);}} label="Filtrar por ruta" placeholder="Todas las rutas" searchable /></View>
        <View style={[styles.flex2,styles.mobileFull]}><Select value={idViaje} options={viajes} onValueChange={setIdViaje} label="Viaje *" placeholder={loading?"Cargando...":"Seleccionar viaje"} searchable searchPlaceholder="Buscar viaje, ruta, placa o chofer..." disabled={loading}/></View>
      </View>
      <Input label="Concepto" value={concepto} onChangeText={setConcepto} placeholder="Ej. Envío de mercadería"/>
    </Card>

    <Card style={[styles.card,styles.mobileDetailCard]}>
      <ThemedText style={styles.sectionTitle}>Detalle de encomienda</ThemedText>
      <View style={[styles.detailEntry,styles.stack]}>
        <View style={[styles.flex2,styles.mobileFull]}><Input label="Detalle *" value={detalle} onChangeText={setDetalle} placeholder="Caja, sobre, paquete..."/></View>
        <View style={[styles.small,styles.mobileFull]}><Input label="Cantidad *" value={cantidad} onChangeText={setCantidad} keyboardType="numeric"/></View>
        <View style={[styles.small,styles.mobileFull]}><Input label="Precio unitario (Bs) *" value={precio} onChangeText={setPrecio} keyboardType="decimal-pad"/></View>
        <Button title={editIndex===null?"+ Agregar":"Guardar"} onPress={agregar} style={styles.mobileAddButton}/>
      </View>
      {detalles.length===0?detalleVacio:detalles.map((d,i)=><View key={`${i}-${d.detalle}`} style={[styles.mobileDetail,{borderColor:c.border}]}>
        <View style={styles.mobileDetailTop}><ThemedText style={styles.mobileDetailTitle}>{d.detalle}</ThemedText><View style={styles.actions}><Pressable onPress={()=>editar(i)}><Pencil size={18} color={c.primary}/></Pressable><Pressable onPress={()=>quitar(i)}><Trash2 size={18} color={c.destructive}/></Pressable></View></View>
        <ThemedText style={{color:c.textSecondary}}>{d.cantidad} × Bs {dinero(Number(d.precio_unitario))}</ThemedText><ThemedText style={styles.mobileDetailTotal}>Bs {dinero(Number(d.cantidad)*Number(d.precio_unitario))}</ThemedText>
      </View>)}
    </Card>

    <Card style={[styles.card,styles.mobileSummaryCard]}>
      <View style={[styles.summary,styles.mobileSummary]}>
        <View style={[styles.metric,styles.mobileMetric]}><ThemedText style={{color:c.textSecondary}}>Cantidad</ThemedText><ThemedText style={styles.metricValue}>{cantidadTotal}</ThemedText></View>
        <View style={[styles.metric,styles.mobileMetric]}><ThemedText style={{color:c.textSecondary}}>Subtotal</ThemedText><ThemedText style={styles.metricValue}>Bs {dinero(subtotal)}</ThemedText></View>
        <View style={[styles.discount,styles.mobileDiscount]}><Input label="Descuento (Bs)" value={descuento} onChangeText={setDescuento} keyboardType="decimal-pad"/></View>
        <View style={[styles.metric,styles.mobileMetric]}><ThemedText style={{color:c.textSecondary}}>Total</ThemedText><ThemedText style={[styles.total,{color:c.primary}]}>Bs {dinero(total)}</ThemedText></View>
      </View>
      <View style={[styles.payment,styles.mobilePayment,{borderTopColor:c.border}]}>
        <View style={[styles.flex,styles.mobilePaymentField]}><Select value={lugarPago} options={[{value:"Origen",label:"Pago en origen"},{value:"Destino",label:"Pago en destino"}]} onValueChange={(v)=>{setLugarPago(v);if(v==="Destino")setTipoPago(undefined);else setTipoPago("Efectivo");}} label="Lugar de pago"/></View>
        <View style={[styles.flex,styles.mobilePaymentField]}><Select value={tipoPago} options={[{value:"Efectivo",label:"Efectivo"},{value:"QR",label:"QR"},{value:"Transferencia",label:"Transferencia"}]} onValueChange={setTipoPago} label="Método de pago" placeholder={lugarPago==="Destino"?"Se define al cobrar":"Seleccionar"} disabled={lugarPago==="Destino"}/></View>
        <Button title="Registrar encomienda" onPress={()=>void registrar()} loading={saving} disabled={loading||detalles.length===0} style={styles.mobileRegisterButton}/>
      </View>
    </Card>
  </ScrollView>;

  const desktopContent=<View style={styles.desktopRoot}>
    <Card style={styles.desktopGeneralCard}>
      <View style={styles.desktopGeneralTop}>
        <View style={styles.desktopClients}>
          <View style={styles.desktopClient}><ClienteBox label="Remitente" value={remitente} tipo="remitente"/></View>
          <View style={styles.desktopClient}><ClienteBox label="Destinatario" value={destinatario} tipo="destinatario"/></View>
        </View>
      </View>
      <View style={styles.desktopGeneralFields}>
        <View style={styles.desktopRoute}><Select value={rutaFiltro} options={rutas} onValueChange={(v)=>{setRutaFiltro(v);setIdViaje(undefined);}} label="Filtrar por ruta" placeholder="Todas las rutas" searchable /></View>
        <View style={styles.desktopTrip}><Select value={idViaje} options={viajes} onValueChange={setIdViaje} label="Viaje *" placeholder={loading?"Cargando...":"Seleccionar viaje"} searchable searchPlaceholder="Buscar viaje, ruta, placa o chofer..." disabled={loading}/></View>
        <View style={styles.desktopConcept}><Input label="Concepto" value={concepto} onChangeText={setConcepto} placeholder="Ej. Envío de mercadería"/></View>
      </View>
    </Card>

    <View style={styles.desktopMainRow}>
      <Card style={styles.desktopDetailCard}>
        <ThemedText style={styles.desktopSectionTitle}>Detalle de encomienda</ThemedText>
        <View style={styles.desktopDetailEntryTop}>
          <View style={styles.desktopDetailInput}><Input label="Detalle *" value={detalle} onChangeText={setDetalle} placeholder="Caja, sobre, paquete..."/></View>
          <View style={styles.desktopQtyInput}><Input label="Cantidad *" value={cantidad} onChangeText={setCantidad} keyboardType="numeric"/></View>
          <View style={styles.desktopPriceInput}><Input label="Precio unitario (Bs) *" value={precio} onChangeText={setPrecio} keyboardType="decimal-pad"/></View>
          <Button title={editIndex===null?"+ Agregar":"Guardar"} onPress={agregar} style={styles.desktopAddButton}/>
        </View>
        {tablaDetalleDesktop}
      </Card>

      <Card style={styles.desktopPaymentCard}>
        <ThemedText style={styles.desktopSectionTitle}>Resumen y pago</ThemedText>
        <View style={styles.desktopMetricsRow}>
          <View style={styles.desktopMetric}><ThemedText style={[styles.desktopMetricLabel,{color:c.textSecondary}]}>Cantidad</ThemedText><ThemedText style={styles.desktopMetricValue}>{cantidadTotal}</ThemedText></View>
          <View style={styles.desktopMetric}><ThemedText style={[styles.desktopMetricLabel,{color:c.textSecondary}]}>Subtotal</ThemedText><ThemedText style={styles.desktopMetricValue}>Bs {dinero(subtotal)}</ThemedText></View>
        </View>
        <View style={styles.desktopTotalRow}>
          <View style={styles.desktopDiscount}><Input label="Descuento (Bs)" value={descuento} onChangeText={setDescuento} keyboardType="decimal-pad"/></View>
          <View style={styles.desktopTotalBox}><ThemedText style={[styles.desktopMetricLabel,{color:c.textSecondary}]}>Total</ThemedText><ThemedText style={[styles.desktopTotal,{color:c.primary}]}>Bs {dinero(total)}</ThemedText></View>
        </View>
        <View style={[styles.desktopPaymentDivider,{borderTopColor:c.border}]}/>
        <View style={styles.desktopPaymentFields}>
          <View style={styles.desktopPaymentField}><Select value={lugarPago} options={[{value:"Origen",label:"Pago en origen"},{value:"Destino",label:"Pago en destino"}]} onValueChange={(v)=>{setLugarPago(v);if(v==="Destino")setTipoPago(undefined);else setTipoPago("Efectivo");}} label="Lugar de pago"/></View>
          <View style={styles.desktopPaymentField}><Select value={tipoPago} options={[{value:"Efectivo",label:"Efectivo"},{value:"QR",label:"QR"},{value:"Transferencia",label:"Transferencia"}]} onValueChange={setTipoPago} label="Método de pago" placeholder={lugarPago==="Destino"?"Se define al cobrar":"Seleccionar"} disabled={lugarPago==="Destino"}/></View>
        </View>
        <Button title="Registrar encomienda" onPress={()=>void registrar()} loading={saving} disabled={loading||detalles.length===0} style={styles.desktopRegisterButton}/>
      </Card>
    </View>
  </View>;

  const selectorModal=<ClienteSelectorModal visible={selector!==null} title={selector==="remitente"?"Seleccionar remitente":"Seleccionar destinatario"} value={selector==="remitente"?remitente:destinatario} onClose={()=>setSelector(null)} onSelect={(cl)=>selector==="remitente"?setRemitente(cl):setDestinatario(cl)}/>;

  if(mobile){
    return <>
      {mobileContent}
      {selectorModal}
    </>;
  }

  return <View style={styles.root}>
    {desktopContent}
    {selectorModal}
  </View>;
}
const styles=StyleSheet.create({
 root:{flex:1,minHeight:0},
 scroll:{flex:1},content:{gap:12,paddingBottom:100},card:{gap:12,flexGrow:0,flexShrink:0},title:{fontSize:22,fontWeight:"900"},sectionTitle:{fontSize:17,fontWeight:"900"},
 row:{flexDirection:"row",gap:12,alignItems:"flex-start"},stack:{flexDirection:"column"},flex:{flex:1,minWidth:220},flex2:{flex:2,minWidth:260},small:{width:150,minWidth:130},
 clientWrap:{gap:5},label:{fontSize:13,fontWeight:"600"},clientBox:{minHeight:52,borderWidth:1.5,borderRadius:10,paddingHorizontal:12,flexDirection:"row",alignItems:"center",gap:10},
 clientText:{flex:1},clientName:{fontWeight:"800"},detailEntry:{flexDirection:"row",gap:10,alignItems:"flex-end"},addButton:{minWidth:120},
 tableHead:{flexDirection:"row",paddingVertical:8,paddingHorizontal:10,borderWidth:1,borderRadius:8},tableRow:{flexDirection:"row",paddingVertical:8,paddingHorizontal:10,borderBottomWidth:1,alignItems:"center"},th:{fontWeight:"800",fontSize:12},
 colDetail:{flex:3},colQty:{flex:.7,textAlign:"center"},colMoney:{flex:1,textAlign:"right"},colAct:{width:64,textAlign:"center"},actions:{flexDirection:"row",gap:12,justifyContent:"center"},
 empty:{padding:20,alignItems:"center"},summary:{flexDirection:"row",gap:20,alignItems:"center",justifyContent:"space-between"},metric:{minWidth:120},metricValue:{fontSize:20,fontWeight:"900"},discount:{minWidth:180},total:{fontSize:24,fontWeight:"900"},
 payment:{borderTopWidth:1,paddingTop:14,flexDirection:"row",gap:12,alignItems:"flex-end"},status:{minWidth:140,paddingBottom:10},statusValue:{fontWeight:"900"},
 mobileDetail:{borderWidth:1,borderRadius:10,padding:12,gap:5},mobileDetailTop:{flexDirection:"row",justifyContent:"space-between",gap:8},mobileDetailTitle:{fontWeight:"800",flex:1},mobileDetailTotal:{fontWeight:"900",fontSize:16},
 mobileFull:{width:"100%",minWidth:0,flexGrow:0,flexShrink:0,flexBasis:"auto"},mobileDetailCard:{gap:16,flexGrow:0,flexShrink:0},mobileAddButton:{alignSelf:"flex-start",minWidth:150,marginTop:2},
 mobileSummaryCard:{alignItems:"center",flexGrow:0,flexShrink:0},mobileSummary:{width:"100%",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20},mobileMetric:{minWidth:0,width:"100%",alignItems:"center"},mobileDiscount:{minWidth:0,width:"100%",maxWidth:260},
 mobilePayment:{width:"100%",flexDirection:"column",alignItems:"center",gap:16},mobilePaymentField:{width:"100%",maxWidth:300,minWidth:0,flexGrow:0,flexShrink:0,flexBasis:"auto"},mobileStatus:{minWidth:0,paddingBottom:0,alignItems:"center"},mobileRegisterButton:{width:"100%",maxWidth:300,minHeight:50},

 desktopRoot:{flex:1,minHeight:0,gap:10},
 desktopGeneralCard:{gap:8,paddingVertical:10,paddingHorizontal:14},
 desktopGeneralTop:{flexDirection:"row",alignItems:"flex-end",gap:16},
 desktopGeneralTitleWrap:{width:250,paddingBottom:2},desktopTitle:{fontSize:18,fontWeight:"900"},desktopSubtitle:{fontSize:12,marginTop:2},
 desktopClients:{flex:1,flexDirection:"row",gap:10,width:"100%"},desktopClient:{flex:1,minWidth:0},
 desktopGeneralFields:{flexDirection:"row",gap:10,alignItems:"flex-end"},desktopRoute:{flex:1,minWidth:180},desktopTrip:{flex:1.45,minWidth:240},desktopConcept:{flex:1.25,minWidth:220},
 desktopMainRow:{flex:1,minHeight:0,flexDirection:"row",gap:10},
 desktopDetailCard:{flex:1.55,minWidth:0,minHeight:0,gap:8,paddingVertical:10,paddingHorizontal:12},desktopPaymentCard:{flex:1,minWidth:330,minHeight:0,gap:9,paddingVertical:10,paddingHorizontal:12},
 desktopSectionTitle:{fontSize:16,fontWeight:"900"},desktopDetailEntryTop:{flexDirection:"row",gap:8,alignItems:"flex-end"},desktopDetailInput:{flex:1.8,minWidth:180},desktopQtyInput:{width:105},desktopPriceInput:{width:145},desktopAddButton:{minWidth:105},
 desktopDetailTable:{flex:1,minHeight:0},desktopDetailRows:{flex:1,minHeight:0},desktopDetailRowsContent:{paddingBottom:2},
 desktopMetricsRow:{flexDirection:"row",gap:8},desktopMetric:{flex:1,borderRadius:8,paddingVertical:7,paddingHorizontal:10,alignItems:"center"},desktopMetricLabel:{fontSize:12,fontWeight:"600"},desktopMetricValue:{fontSize:18,fontWeight:"900",marginTop:2},
 desktopTotalRow:{flexDirection:"row",gap:10,alignItems:"flex-end"},desktopDiscount:{flex:1,minWidth:0},desktopTotalBox:{flex:1,alignItems:"center",paddingBottom:4},desktopTotal:{fontSize:22,fontWeight:"900",marginTop:1},
 desktopPaymentDivider:{borderTopWidth:1,marginTop:1},desktopPaymentFields:{flexDirection:"row",gap:8},desktopPaymentField:{flex:1,minWidth:0},desktopStatus:{alignItems:"center",paddingVertical:2},desktopStatusValue:{fontWeight:"900",fontSize:16,marginTop:1},desktopRegisterButton:{width:"100%",minHeight:42,marginTop:"auto"}
});
