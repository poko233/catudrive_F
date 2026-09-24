import { ThemedText } from "@/components/ThemedText";
import { Table, TableColumn } from "@/components/Table";
import Visibility from "@/components/Visibility";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination, PaginationMeta } from "@/components/ui/Pagination";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { TabBar } from "@/components/ui/TabBar";
import { useAuth } from "@/store/authStore";
import { useTheme } from "@/theme/useTheme";
import { ArrowRight, Banknote, Eye, MapPin, Package, PackageCheck, Pencil, QrCode, ScanLine, Truck, XCircle } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Toast from "react-native-toast-message";
import { EncomiendaDetalleModal } from "./components/EncomiendaDetalleModal";
import { EncomiendaFormModal } from "./components/EncomiendaFormModal";
import { EncomiendaPagoModal } from "./components/EncomiendaPagoModal";
import { EncomiendaPrintPreviewModal } from "./components/EncomiendaPrintPreviewModal";
import { EncomiendaQrScannerModal } from "./components/EncomiendaQrScannerModal";
import { RegistroEncomiendaPanel } from "./components/RegistroEncomiendaPanel";
import { useEncomiendas } from "./hooks/useEncomiendas";
import EncomiendaReportesScreen from "./reportes/EncomiendaReportesScreen";
import { encomiendaService } from "./services/encomienda.service";
import { Encomienda, EstadoEncomienda, TipoPago } from "./types/encomienda.types";

type Tab="REGISTRAR"|"LISTADO"|"REPORTES";
type Filtro="TODAS"|"EN_ORIGEN"|"EN_TRANSITO"|"EN_DESTINO"|"ENTREGADAS"|"ANULADAS";
const tabs=[{key:"REGISTRAR",label:"REGISTRAR ENCOMIENDA"},{key:"LISTADO",label:"LISTADO ENCOMIENDAS"},{key:"REPORTES",label:"REPORTE ENCOMIENDAS"}];
const columns:TableColumn[]=[
 {key:"guia",label:"Guía",flex:1,align:"center"},{key:"fecha",label:"Fecha",flex:.8,align:"center"},{key:"remitente",label:"Remitente",flex:1.3,align:"center"},
 {key:"destinatario",label:"Destinatario",flex:1.3,align:"center"},{key:"ruta",label:"Ruta",flex:1.3,align:"center"},{key:"cantidad",label:"Cant.",flex:.55,align:"center"},
 {key:"total",label:"Total",flex:.75,align:"center"},{key:"pago",label:"Pago",flex:.8,align:"center"},{key:"estado",label:"Estado",flex:.85,align:"center"},{key:"acciones",label:"Acciones",flex:1.65,align:"center"},
];
const nombre=(c:Encomienda["remitente"])=>c?.nombre_completo??"—";
const cantidad=(e:Encomienda)=>e.detalles.reduce((a,d)=>a+Number(d.cantidad||0),0);
const fecha=(v:string|null)=>{if(!v)return"—";const d=v.split("T")[0].split("-");return d.length===3?`${d[2]}/${d[1]}/${d[0]}`:v;};
function estadoLabel(e:EstadoEncomienda){return({EN_ORIGEN:"En origen",EN_TRANSITO:"En tránsito",EN_DESTINO:"En destino",ENTREGADA:"Entregada",ANULADA:"Anulada"} as const)[e];}
function estadoVariant(e:EstadoEncomienda):"info"|"warning"|"success"|"destructive"{if(e==="ANULADA")return"destructive";if(e==="ENTREGADA")return"success";if(e==="EN_TRANSITO"||e==="EN_DESTINO")return"warning";return"info";}

export default function EncomiendasScreen(){
 const {theme}=useTheme();const c=theme.colors;const {width}=useWindowDimensions();const mobile=width<768;
 const {roles}=useAuth();const esChofer=roles.some(r=>r.trim().toLowerCase()==="chofer");
 const [tab,setTab]=useState<Tab>("REGISTRAR"),[search,setSearch]=useState(""),[filtro,setFiltro]=useState<Filtro>("TODAS");
 const [detalle,setDetalle]=useState<Encomienda|null>(null),[editing,setEditing]=useState<Encomienda|null>(null),[cobro,setCobro]=useState<Encomienda|null>(null);
 const [scannerVisible,setScannerVisible]=useState(false),[scannerItem,setScannerItem]=useState<Encomienda|null>(null),[scanning,setScanning]=useState(false);
 const [previewVisible,setPreviewVisible]=useState(false),[previewHtml,setPreviewHtml]=useState(""),[previewTitle,setPreviewTitle]=useState("Etiqueta QR"),[previewLoading,setPreviewLoading]=useState(false);
 const {encomiendas,loading,saving,processingId,meta,perPage,resumen,cambiarFiltros,irAPagina,refresh,actualizar,cargarCatalogos,catalogos,loadingCatalogos,asignar,cambiarEstado,entregar,anular,escanearQr}=useEncomiendas();

 useEffect(()=>{if(tab!=="LISTADO")return;const estado=filtro==="TODAS"?undefined:filtro==="ENTREGADAS"?"ENTREGADA":filtro==="ANULADAS"?"ANULADA":filtro;const t=setTimeout(()=>cambiarFiltros({buscar:search,estado}),250);return()=>clearTimeout(t);},[tab,filtro,search,cambiarFiltros]);
 const pmeta:PaginationMeta={total:meta?.total??0,page:meta?.current_page??1,perPage:meta?.per_page??perPage};
 const filtros=[
  ["TODAS","Todas",resumen.total,Package],["EN_ORIGEN","En origen",resumen.enOrigen,Package],["EN_TRANSITO","En tránsito",resumen.enTransito,Truck],
  ["EN_DESTINO","En destino",resumen.enDestino,MapPin],["ENTREGADAS","Entregadas",resumen.entregadas,PackageCheck],["ANULADAS","Anuladas",resumen.anuladas,XCircle],
 ] as const;

 const abrirTicket=useCallback(async(e:Encomienda,tipo:"etiqueta"|"comprobante"="etiqueta")=>{
   setPreviewTitle(`${tipo==="etiqueta"?"Etiqueta QR":"Comprobante"} - ${e.guia??"Encomienda"}`);setPreviewHtml("");setPreviewVisible(true);setPreviewLoading(true);
   try{setPreviewHtml(await encomiendaService.obtenerTicketQrHtml(e.id,tipo));}
   catch(err:any){setPreviewVisible(false);Toast.show({type:"error",text1:"No se pudo preparar la impresión",text2:err?.message??"Intenta nuevamente."});}
   finally{setPreviewLoading(false);}
 },[]);

 const avanzar=async(e:Encomienda)=>{
   if(e.estado==="EN_ORIGEN")await cambiarEstado(e,"EN_TRANSITO");
   else if(e.estado==="EN_TRANSITO")await cambiarEstado(e,"EN_DESTINO");
 };
 const cobrar=async(tipo:TipoPago)=>{
   if(!cobro)return false;
   const ok=await actualizar(cobro,{estado_pago:"Pagado",tipo_pago:tipo});
   if(ok)setCobro(null);return ok;
 };
 const entregarItem=async(e:Encomienda)=>{if(e.estado_pago==="Pendiente"){setCobro(e);return;}await entregar(e);};
 const scan=async(value:string)=>{setScanning(true);const item=await escanearQr(value);setScannerItem(item);setScanning(false);};
 const llegadaScanner=async(e:Encomienda)=>{const ok=await cambiarEstado(e,"EN_DESTINO");if(ok){const fresh=await encomiendaService.obtener(e.id);setScannerItem(fresh);}};

 const acciones=(e:Encomienda,modoMobile=false)=><View style={modoMobile?styles.mobileActions:styles.actions}>
  {!modoMobile?<Visibility action="Ver" selector=".encomiendas-ver"><IconButton icon={Eye} size="sm" variant="secondary" accessibilityLabel="Ver encomienda" onPress={()=>setDetalle(e)}/></Visibility>:null}
  {e.qr_disponible?<Visibility action="Ver" selector=".encomiendas-qr"><IconButton icon={QrCode} size={modoMobile?"md":"sm"} variant="secondary" accessibilityLabel="QR e impresión" onPress={()=>void abrirTicket(e)}/></Visibility>:null}
  {e.estado==="EN_ORIGEN"?<Visibility action="Editar" selector=".encomiendas-editar"><IconButton icon={Pencil} size={modoMobile?"md":"sm"} variant="secondary" accessibilityLabel="Editar encomienda" onPress={()=>setEditing(e)}/></Visibility>:null}
  {(e.estado==="EN_ORIGEN"||e.estado==="EN_TRANSITO")?<Visibility action="Editar" selector=".encomiendas-editar"><IconButton icon={ArrowRight} size={modoMobile?"md":"sm"} variant="secondary" accessibilityLabel={e.estado==="EN_ORIGEN"?"Marcar en tránsito":"Marcar en destino"} loading={processingId===e.id} onPress={()=>void avanzar(e)}/></Visibility>:null}
  {e.estado==="EN_DESTINO"&&e.estado_pago==="Pendiente"?<Visibility action="Editar" selector=".encomiendas-editar"><IconButton icon={Banknote} size={modoMobile?"md":"sm"} variant="secondary" accessibilityLabel="Cobrar encomienda" onPress={()=>setCobro(e)}/></Visibility>:null}
  {e.estado==="EN_DESTINO"?<Visibility action="Editar" selector=".encomiendas-entregar"><IconButton icon={PackageCheck} size={modoMobile?"md":"sm"} variant="secondary" accessibilityLabel="Entregar encomienda" loading={processingId===e.id} onPress={()=>void entregarItem(e)}/></Visibility>:null}
  {!esChofer&&e.estado==="EN_ORIGEN"?<Visibility action="Editar" selector=".encomiendas-anular"><IconButton icon={XCircle} size={modoMobile?"md":"sm"} variant="destructive" accessibilityLabel="Anular encomienda" loading={processingId===e.id} onPress={()=>void anular(e)}/></Visibility>:null}
 </View>;

 const listado=<View style={styles.listWrap}>
  {mobile?(
   <>
    <View style={styles.mobileFilterRow}>
     <View style={styles.mobileFilterSelect}>
      <Select<Filtro>
       value={filtro}
       options={filtros.map(([key,label,value])=>({value:key as Filtro,label:`${label} (${value})`}))}
       onValueChange={setFiltro}
       label="Estado"
      />
     </View>
     <View style={styles.mobileListButtons}><Button title="Escanear QR" variant="secondary" onPress={()=>{setScannerItem(null);setScannerVisible(true)}} style={styles.mobileScanButton}/><Button title="Actualizar" variant="secondary" loading={loading} onPress={()=>void refresh()} style={styles.mobileScanButton}/></View>
    </View>
    <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar por guía, cliente, CI, teléfono o detalle..."/>
   </>
  ):(
   <>
    <View style={styles.summary}>{filtros.map(([key,label,value,Icon])=><Pressable key={key} style={styles.summaryPress} onPress={()=>setFiltro(key as Filtro)}><Card style={[styles.summaryCard,filtro===key?{borderColor:c.primary,borderWidth:2}:null]}><Icon size={19} color={c.primary}/><View><ThemedText style={styles.summaryValue}>{value}</ThemedText><ThemedText>{label}</ThemedText></View></Card></Pressable>)}</View>
    <View style={styles.searchRow}><View style={styles.search}><SearchBar value={search} onChangeText={setSearch} placeholder="Buscar por guía, remitente, destinatario, CI, teléfono o detalle..."/></View><Button title="Actualizar" variant="secondary" loading={loading} onPress={()=>void refresh()}/><Button title="Escanear QR" variant="secondary" onPress={()=>{setScannerItem(null);setScannerVisible(true)}}/></View>
   </>
  )}
  {mobile?<View style={styles.cards}>{loading&&encomiendas.length===0?<ActivityIndicator color={c.primary}/>:encomiendas.map(e=><Pressable key={e.id} onPress={()=>setDetalle(e)} accessibilityRole="button" accessibilityLabel={`Ver detalle de ${e.guia??"encomienda"}`}>
   <Card style={styles.mobileCard}>
    <View style={styles.mobileCardBody}>
     <View style={styles.mobileInfo}>
      <ThemedText style={styles.bold}>{e.guia??"—"}</ThemedText>
      <ThemedText style={{color:c.textSecondary}}>{fecha(e.created_at)}</ThemedText>
      <ThemedText numberOfLines={2}>{nombre(e.remitente)} → {nombre(e.destinatario)}</ThemedText>
      <ThemedText style={{color:c.textSecondary}} numberOfLines={2}>{e.origen??"—"} → {e.destino??"—"}</ThemedText>
      <ThemedText>{cantidad(e)} bulto(s) · Bs {Number(e.total).toFixed(2)}</ThemedText>
      <ThemedText style={{color:c.textSecondary}}>{e.estado_pago}</ThemedText>
     </View>
     <View style={styles.mobileRight}>
      <Badge label={estadoLabel(e.estado)} variant={estadoVariant(e.estado)}/>
      {acciones(e,true)}
     </View>
    </View>
   </Card>
  </Pressable>)}</View>:
  <Table<Encomienda> data={encomiendas} columns={columns} loading={loading} keyExtractor={e=>String(e.id)} renderCell={(e,col)=>{
   switch(col.key){case"guia":return <ThemedText style={styles.bold}>{e.guia??"—"}</ThemedText>;case"fecha":return <ThemedText>{fecha(e.created_at)}</ThemedText>;case"remitente":return <View style={styles.centerCell}><ThemedText numberOfLines={2} style={styles.centerCellText}>{nombre(e.remitente)}</ThemedText></View>;
   case"destinatario":return <View style={styles.centerCell}><ThemedText numberOfLines={2} style={styles.centerCellText}>{nombre(e.destinatario)}</ThemedText></View>;case"ruta":return <View style={styles.centerCell}><ThemedText numberOfLines={2} style={styles.centerCellText}>{e.origen??"—"} → {e.destino??"—"}</ThemedText></View>;case"cantidad":return <ThemedText>{cantidad(e)}</ThemedText>;
   case"total":return <ThemedText>Bs {Number(e.total).toFixed(2)}</ThemedText>;case"pago":return <View style={styles.centerCell}><Badge label={e.estado_pago} variant={e.estado_pago==="Pagado"?"success":"warning"}/></View>;
   case"estado":return <View style={styles.centerCell}><Badge label={estadoLabel(e.estado)} variant={estadoVariant(e.estado)}/></View>;case"acciones":return acciones(e);default:return null;}
  }}/>}
  <Pagination meta={pmeta} onPageChange={irAPagina} itemLabel="encomiendas" maxVisiblePages={mobile?3:7}/>
 </View>;

 return <View style={[styles.screen,{backgroundColor:c.background}]}>
  {mobile?(<View style={[styles.mobileHeader,{borderColor:c.border,backgroundColor:c.backgroundSecondary}]}>
   <View style={styles.mobileHeaderTitleRow}><ThemedText style={styles.mobileHeaderTitle}>Encomiendas</ThemedText><View style={[styles.mobileHeaderBadge,{borderColor:c.primary}]}><ThemedText style={[styles.mobileHeaderBadgeText,{color:c.primary}]}>{pmeta.total} registros</ThemedText></View></View>
   <ThemedText style={[styles.mobileHeaderDescription,{color:c.textSecondary}]} numberOfLines={1}>Registro, seguimiento, cobro y reportes de encomiendas.</ThemedText>
  </View>):<PageHeader title="Encomiendas" description="Registro, seguimiento, cobro y reportes de encomiendas." badge={`${pmeta.total} registros`}/>}
  <TabBar tabs={tabs} activeTab={tab} onTabChange={key=>setTab(key as Tab)}/>
  {tab==="REGISTRAR"?(
   <RegistroEncomiendaPanel onCreated={()=>{void refresh();setTab("LISTADO")}}/>
  ):tab==="LISTADO"?(
   mobile?(
    <ScrollView
     style={styles.mobileListScroll}
     contentContainerStyle={styles.mobileListScrollContent}
     showsVerticalScrollIndicator
     keyboardShouldPersistTaps="handled"
     nestedScrollEnabled
    >
     {listado}
    </ScrollView>
   ):listado
  ):<EncomiendaReportesScreen embedded/>}

  <EncomiendaDetalleModal visible={!!detalle} encomienda={detalle} onClose={()=>setDetalle(null)}/>
  <EncomiendaFormModal visible={!!editing} encomienda={editing} catalogos={catalogos} loadingCatalogos={loadingCatalogos} saving={saving} onClose={()=>setEditing(null)}
   onLoadCatalogos={cargarCatalogos} onUpdate={async(e,p)=>{const ok=await actualizar(e,p);if(ok)setEditing(null);return ok}}
   onChangeTrip={async(e,idViaje)=>asignar(e,{id_viaje:idViaje})}/>
  <EncomiendaPagoModal visible={!!cobro} encomienda={cobro} saving={saving} onClose={()=>setCobro(null)} onConfirm={cobrar}/>
  <EncomiendaQrScannerModal visible={scannerVisible} encomienda={scannerItem} loading={scanning} printing={previewLoading} onClose={()=>{setScannerVisible(false);setScannerItem(null)}} onScan={scan} onReset={()=>setScannerItem(null)}
   onPrint={()=>{if(scannerItem)void abrirTicket(scannerItem,"comprobante")}} onMarkArrival={e=>void llegadaScanner(e)}/>
  <EncomiendaPrintPreviewModal visible={previewVisible} title={previewTitle} html={previewHtml} loading={previewLoading} onClose={()=>{if(!previewLoading){setPreviewVisible(false);setPreviewHtml("")}}}/>
 </View>;
}
const styles=StyleSheet.create({
 screen:{flex:1,width:"100%",padding:18,gap:12,minHeight:0},listWrap:{flex:1,gap:12,minHeight:0},mobileListScroll:{flex:1,minHeight:0},mobileListScrollContent:{flexGrow:1,paddingBottom:110},summary:{flexDirection:"row",flexWrap:"wrap",gap:8},summaryPress:{flex:1,minWidth:135},
 summaryCard:{minHeight:70,flexDirection:"row",alignItems:"center",gap:10},summaryValue:{fontSize:19,fontWeight:"900"},actions:{flexDirection:"row",gap:5,justifyContent:"center",flexWrap:"wrap"},
 bold:{fontWeight:"800"},centerCell:{flex:1,width:"100%",alignSelf:"stretch",alignItems:"center",justifyContent:"center"},centerCellText:{width:"100%",textAlign:"center"},cards:{gap:10,paddingBottom:80},mobileCard:{padding:14},mobileCardBody:{flexDirection:"row",gap:12,alignItems:"flex-start"},mobileInfo:{flex:1,gap:5,minWidth:0},mobileRight:{alignItems:"flex-end",gap:10},mobileActions:{gap:8,alignItems:"center"},
 searchRow:{flexDirection:"row",gap:8,alignItems:"center",flexWrap:"wrap"},search:{flex:1,minWidth:240},
 mobileHeader:{borderWidth:1,borderRadius:14,paddingHorizontal:14,paddingVertical:11,gap:4},mobileHeaderTitleRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},mobileHeaderTitle:{fontSize:24,fontWeight:"900",flexShrink:1},mobileHeaderBadge:{borderWidth:1,borderRadius:999,paddingHorizontal:10,paddingVertical:4},mobileHeaderBadgeText:{fontSize:12,fontWeight:"800"},mobileHeaderDescription:{fontSize:13},
 mobileFilterRow:{flexDirection:"row",gap:10,alignItems:"flex-end"},mobileFilterSelect:{flex:1,minWidth:0},mobileListButtons:{gap:8,alignItems:"stretch"},mobileScanButton:{minHeight:48,paddingHorizontal:12}
});
