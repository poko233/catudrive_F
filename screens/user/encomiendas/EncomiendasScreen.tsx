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
import { DatePicker, DatePickerResult } from "@/components/ui/DatePicker";
import { useAuth } from "@/store/authStore";
import { useTheme } from "@/theme/useTheme";
import { ArrowRight, Banknote, BarChart3, CalendarDays, CalendarRange, Eye, Filter, MapPin, Package, PackageCheck, Pencil, Plus, Printer, RefreshCw, ScanLine, Truck, XCircle } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Toast from "react-native-toast-message";
import { PrinterConnectionProvider, PrinterSetupModal, usePrinterConnection } from "@/components/PrinterConnection";
import { ThermalHtmlRasterizer, ThermalHtmlRasterizerHandle } from "@/screens/user/pasajes/components/ThermalHtmlRasterizer";
import { EncomiendaDetalleModal } from "./components/EncomiendaDetalleModal";
import { EncomiendaFormModal } from "./components/EncomiendaFormModal";
import { EncomiendaPagoModal } from "./components/EncomiendaPagoModal";
import { EncomiendaPrintPreviewModal } from "./components/EncomiendaPrintPreviewModal";
import { EncomiendaQrScannerModal } from "./components/EncomiendaQrScannerModal";
import { RegistroEncomiendaPanel } from "./components/RegistroEncomiendaPanel";
import { EncomiendaRegistroExitosoModal } from "./components/EncomiendaRegistroExitosoModal";
import { EncomiendaFiltrosModal } from "./components/EncomiendaFiltrosModal";
import { PasoStepper } from "@/screens/user/pasajes/components/PasoStepper";
import { useEncomiendas } from "./hooks/useEncomiendas";
import EncomiendaReportesScreen from "./reportes/EncomiendaReportesScreen";
import { encomiendaService } from "./services/encomienda.service";
import { Encomienda, EncomiendaListFilters, EstadoEncomienda, TipoPago } from "./types/encomienda.types";

type Filtro="TODAS"|"EN_ORIGEN"|"EN_TRANSITO"|"EN_DESTINO"|"ENTREGADAS"|"ANULADAS";
const columns:TableColumn[]=[
 {key:"guia",label:"Guía",flex:1,align:"center"},{key:"fecha",label:"Fecha",flex:.8,align:"center"},{key:"remitente",label:"Remitente",flex:1.3,align:"center"},
 {key:"destinatario",label:"Destinatario",flex:1.3,align:"center"},{key:"ruta",label:"Ruta",flex:1.3,align:"center"},{key:"cantidad",label:"Cant.",flex:.55,align:"center"},
 {key:"total",label:"Total",flex:.75,align:"center"},{key:"pago",label:"Pago",flex:.8,align:"center"},{key:"estado",label:"Estado",flex:.85,align:"center"},{key:"acciones",label:"Acciones",flex:1.65,align:"center"},
];
const nombre=(c:Encomienda["remitente"])=>c?.nombre_completo??"—";
const cantidad=(e:Encomienda)=>e.detalles.reduce((a,d)=>a+Number(d.cantidad||0),0);
const fecha=(v:string|null)=>{if(!v)return"—";const d=v.split("T")[0].split("-");return d.length===3?`${d[2]}/${d[1]}/${d[0]}`:v;};
const fechaHora=(v:string|null)=>{if(!v)return"—";const dt=v.replace("T"," ").split(".")[0];const [f,h=""] = dt.split(" ");const d=f.split("-");return d.length===3?`${d[2]}/${d[1]}/${d[0]}${h?` ${h.slice(0,5)}`:""}`:v;};
function estadoLabel(e:EstadoEncomienda){return({EN_ORIGEN:"En origen",EN_TRANSITO:"En tránsito",EN_DESTINO:"En destino",ENTREGADA:"Entregada",ANULADA:"Anulada"} as const)[e];}
function estadoVariant(e:EstadoEncomienda):"info"|"warning"|"success"|"destructive"{if(e==="ANULADA")return"destructive";if(e==="ENTREGADA")return"success";if(e==="EN_TRANSITO"||e==="EN_DESTINO")return"warning";return"info";}

const ENCOMIENDAS_PRINTER_REQUIREMENT={type:"receipt",paperSize:"receipt-58"} as const;

export default function EncomiendasScreen(){return <PrinterConnectionProvider autoConnect detectSunmiOnStart><EncomiendasScreenContent/></PrinterConnectionProvider>}

function EncomiendasScreenContent(){
 const {theme}=useTheme();const c=theme.colors;const {width}=useWindowDimensions();const mobile=width<768;
 const thermalRasterizerRef=useRef<ThermalHtmlRasterizerHandle|null>(null);
 const [printerSetupVisible,setPrinterSetupVisible]=useState(false);
 const {configurationRequired,getDefaultPrinterForRequirement,print:printWithConfiguredPrinter}=usePrinterConnection();
 const encomiendasDefaultPrinter=getDefaultPrinterForRequirement(ENCOMIENDAS_PRINTER_REQUIREMENT);
 const {roles}=useAuth();const esChofer=roles.some(r=>r.trim().toLowerCase()==="chofer");
 const [paso,setPaso]=useState(1),[registrando,setRegistrando]=useState(false),[reportes,setReportes]=useState(false),[registroExitoso,setRegistroExitoso]=useState<Encomienda|null>(null),[resetRegistroKey,setResetRegistroKey]=useState(0);
 const [search,setSearch]=useState(""),[mobileExpandedId,setMobileExpandedId]=useState<number|null>(null);
 const hoy=()=>{try{return new Intl.DateTimeFormat("en-CA",{timeZone:"America/La_Paz",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}catch{return new Date().toISOString().slice(0,10)}};
 const [fechaDesde,setFechaDesde]=useState(hoy),[fechaHasta,setFechaHasta]=useState(hoy),[datePickerVisible,setDatePickerVisible]=useState(false),[datePickerMode,setDatePickerMode]=useState<"single"|"range">("single");
 const [filtrosModal,setFiltrosModal]=useState(false),[filtrosAvanzados,setFiltrosAvanzados]=useState<Pick<EncomiendaListFilters,"estado"|"estado_pago"|"tipo_pago"|"id_cliente"|"id_chofer">>({});
 const [detalle,setDetalle]=useState<Encomienda|null>(null),[editing,setEditing]=useState<Encomienda|null>(null),[cobro,setCobro]=useState<Encomienda|null>(null);
 const [scannerVisible,setScannerVisible]=useState(false),[scanning,setScanning]=useState(false);
 const [previewVisible,setPreviewVisible]=useState(false),[previewHtml,setPreviewHtml]=useState(""),[previewTitle,setPreviewTitle]=useState("Etiqueta QR"),[previewLoading,setPreviewLoading]=useState(false);
 const {encomiendas,loading,saving,processingId,meta,perPage,resumen,cambiarFiltros,irAPagina,refresh,actualizar,cargarCatalogos,catalogos,loadingCatalogos,asignar,cambiarEstado,entregar,anular,escanearQr}=useEncomiendas();

 useEffect(()=>{if(registrando||reportes)return;const t=setTimeout(()=>cambiarFiltros({buscar:search,fecha_desde:fechaDesde||undefined,fecha_hasta:fechaHasta||undefined,...filtrosAvanzados}),250);return()=>clearTimeout(t);},[registrando,reportes,search,fechaDesde,fechaHasta,filtrosAvanzados,cambiarFiltros]);
 const pmeta:PaginationMeta={total:meta?.total??0,page:meta?.current_page??1,perPage:meta?.per_page??perPage};
 const filtros=[
  ["TODAS","Todas",resumen.total,Package],["EN_ORIGEN","En origen",resumen.enOrigen,Package],["EN_TRANSITO","En tránsito",resumen.enTransito,Truck],
  ["EN_DESTINO","En destino",resumen.enDestino,MapPin],["ENTREGADAS","Entregadas",resumen.entregadas,PackageCheck],["ANULADAS","Anuladas",resumen.anuladas,XCircle],
 ] as const;

 const imprimirHtmlReal=useCallback(async(html:string):Promise<number>=>{
  const inicio=Date.now();
  try{
   if(Platform.OS==="web"){
    const htmlImprimible=html.includes("</body>")?html.replace("</body>",`<script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},150);});<\/script></body>`):html;const blob=new Blob([htmlImprimible],{type:"text/html"});const url=URL.createObjectURL(blob);const win=window.open(url,"_blank","width=400,height=600");
    if(!win)throw new Error("El navegador bloqueó la pestaña. Permite ventanas emergentes e inténtalo de nuevo.");
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    return Date.now()-inicio;
   }
   const rasterizer=thermalRasterizerRef.current;
   if(!rasterizer)throw new Error("El renderizador térmico todavía no está disponible.");
   const rasterImage=await rasterizer.captureHtml(html);
   await printWithConfiguredPrinter({type:"receipt",paperSize:"receipt-58",html,rasterImage,copies:1,cutPaper:true,sunmi:{feedLines:4,imageMode:"binary"}});
   return Date.now()-inicio;
  }catch(err:any){
   if(Platform.OS!=="web")setPrinterSetupVisible(true);
   throw err;
  }
 },[printWithConfiguredPrinter]);

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
 const scan=async(value:string)=>{
  setScanning(true);
  try{
   const item=await escanearQr(value);
   if(!item)return false;
   setScannerVisible(false);
   setDetalle(item);
   return true;
  }finally{setScanning(false);}
 };

 const acciones=(e:Encomienda,modoMobile=false)=><View style={modoMobile?styles.mobileActions:styles.actions}>
  {!modoMobile?<Visibility action="Ver" selector=".encomiendas-ver"><IconButton icon={Eye} size="sm" variant="secondary" accessibilityLabel="Ver encomienda" onPress={()=>setDetalle(e)}/></Visibility>:null}
  {e.qr_disponible?<Visibility action="Ver" selector=".encomiendas-qr"><IconButton icon={Printer} size={modoMobile?"md":"sm"} variant="secondary" accessibilityLabel="Imprimir encomienda" onPress={()=>void abrirTicket(e)}/></Visibility>:null}
  {e.estado==="EN_ORIGEN"?<Visibility action="Editar" selector=".encomiendas-editar"><IconButton icon={Pencil} size={modoMobile?"md":"sm"} variant="secondary" accessibilityLabel="Editar encomienda" onPress={()=>setEditing(e)}/></Visibility>:null}
  {(e.estado==="EN_ORIGEN"||e.estado==="EN_TRANSITO")?<Visibility action="Editar" selector=".encomiendas-editar"><IconButton icon={ArrowRight} size={modoMobile?"md":"sm"} variant="secondary" accessibilityLabel={e.estado==="EN_ORIGEN"?"Marcar en tránsito":"Marcar en destino"} loading={processingId===e.id} onPress={()=>void avanzar(e)}/></Visibility>:null}
  {e.estado==="EN_DESTINO"&&e.estado_pago==="Pendiente"?<Visibility action="Editar" selector=".encomiendas-editar"><IconButton icon={Banknote} size={modoMobile?"md":"sm"} variant="secondary" accessibilityLabel="Cobrar encomienda" onPress={()=>setCobro(e)}/></Visibility>:null}
  {e.estado==="EN_DESTINO"?<Visibility action="Editar" selector=".encomiendas-entregar"><IconButton icon={PackageCheck} size={modoMobile?"md":"sm"} variant="secondary" accessibilityLabel="Entregar encomienda" loading={processingId===e.id} onPress={()=>void entregarItem(e)}/></Visibility>:null}
  {!esChofer&&e.estado==="EN_ORIGEN"?<Visibility action="Editar" selector=".encomiendas-anular"><IconButton icon={XCircle} size={modoMobile?"md":"sm"} variant="destructive" accessibilityLabel="Anular encomienda" loading={processingId===e.id} onPress={()=>void anular(e)}/></Visibility>:null}
 </View>;

 const toggleMobile=(id:number)=>{
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setMobileExpandedId(prev=>prev===id?null:id);
 };

 const aplicarFecha=(result:DatePickerResult)=>{
  if(result.type==="single"){setFechaDesde(result.date);setFechaHasta(result.date)}
  else if(result.type==="range"){setFechaDesde(result.start);setFechaHasta(result.end)}
  setDatePickerVisible(false);
 };
 const isoOffset=(days:number)=>{const base=new Date(`${hoy()}T12:00:00`);base.setDate(base.getDate()+days);return `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,"0")}-${String(base.getDate()).padStart(2,"0")}`};
 const cortoFecha=(v:string)=>{const [,m,d]=v.split("-");return `${Number(d)} ${(["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"])[Number(m)-1]}`};
 const quickDates=[isoOffset(-2),isoOffset(-1),isoOffset(0)];
 const fechaFiltroLabel=()=>fechaDesde===fechaHasta?cortoFecha(fechaDesde):`${cortoFecha(fechaDesde)} - ${cortoFecha(fechaHasta)}`;
 const abrirFecha=(mode:"single"|"range")=>{setDatePickerMode(mode);setDatePickerVisible(true)};
 const fechaBar=<View style={styles.dateQuickRow}>{quickDates.map(d=><Pressable key={d} onPress={()=>{setFechaDesde(d);setFechaHasta(d)}} style={[styles.quickDate,{borderColor:c.border,backgroundColor:fechaDesde===d&&fechaHasta===d?c.primary:c.background}]}><ThemedText style={[styles.quickDateText,fechaDesde===d&&fechaHasta===d&&{fontWeight:"900"}]}>{cortoFecha(d)}</ThemedText></Pressable>)}<IconButton icon={CalendarDays} size="sm" variant="secondary" accessibilityLabel="Seleccionar fecha" onPress={()=>abrirFecha("single")}/><IconButton icon={CalendarRange} size="sm" variant="secondary" accessibilityLabel="Seleccionar rango de fechas" onPress={()=>abrirFecha("range")}/></View>;

 const listado=<View style={styles.listWrap}>
  {mobile?<View style={styles.mobileDateBar}>{fechaBar}</View>:null}
  <View style={styles.searchFilterRow}>
   <View style={styles.search}><SearchBar value={search} onChangeText={setSearch} placeholder={mobile?"Buscar por guía, remitente...":"Buscar por guía, remitente, destinatario, CI, teléfono o detalle..."}/></View>
   <IconButton icon={Filter} size={mobile?"md":"md"} variant="secondary" accessibilityLabel="Filtros" onPress={()=>{void cargarCatalogos();setFiltrosModal(true)}}/>
  </View>
  <View style={styles.listBody}>
   {mobile?<ScrollView style={styles.mobileListScroll} contentContainerStyle={styles.cards} showsVerticalScrollIndicator nestedScrollEnabled>{loading&&encomiendas.length===0?<ActivityIndicator color={c.primary}/>:encomiendas.map(e=>{const expanded=mobileExpandedId===e.id;return <Card key={e.id} style={styles.mobileCard}>
    <Pressable onPress={()=>toggleMobile(e.id)} accessibilityRole="button" accessibilityLabel={`${expanded?"Contraer":"Ver detalle de"} ${e.guia??"encomienda"}`}>
     <View style={styles.mobileCompactRow}>
      <View style={[styles.mobilePackageIcon,{backgroundColor:c.backgroundSecondary}]}><Package size={22} color={c.primary}/></View>
      <View style={styles.mobileCompactInfo}><ThemedText style={styles.bold}>{e.guia??"—"}</ThemedText><ThemedText style={[styles.mobileDate,{color:c.textSecondary}]}>{fecha(e.created_at)}</ThemedText></View>
      <View style={styles.mobileCompactStatus}><Badge label={estadoLabel(e.estado)} variant={estadoVariant(e.estado)}/></View>
     </View>
    </Pressable>
    {expanded?<View style={[styles.mobileExpanded,{borderTopColor:c.border}]}>
     <View style={styles.ticketRows}>
      <View style={styles.ticketRow}><ThemedText style={styles.ticketLabel}>Fecha:</ThemedText><ThemedText style={styles.ticketValue}>{fechaHora(e.created_at)}</ThemedText></View>
      <View style={styles.ticketRow}><ThemedText style={styles.ticketLabel}>Estado:</ThemedText><ThemedText style={styles.ticketValue}>{estadoLabel(e.estado)}</ThemedText></View>
      <View style={styles.ticketRow}><ThemedText style={styles.ticketLabel}>Estado pago:</ThemedText><ThemedText style={styles.ticketValue}>{e.estado_pago}</ThemedText></View>
      <View style={styles.ticketRow}><ThemedText style={styles.ticketLabel}>Ruta:</ThemedText><ThemedText style={styles.ticketValue}>{e.origen??"—"} → {e.destino??"—"}</ThemedText></View>
      <View style={styles.ticketRow}><ThemedText style={styles.ticketLabel}>Remitente:</ThemedText><ThemedText style={styles.ticketValue}>{nombre(e.remitente)}</ThemedText></View>
      <View style={styles.ticketRow}><ThemedText style={styles.ticketLabel}>Destinatario:</ThemedText><ThemedText style={styles.ticketValue}>{nombre(e.destinatario)}</ThemedText></View>
     </View>
     <View style={[styles.mobileDetailTable,{borderColor:c.border}]}>
      <View style={[styles.mobileDetailHeader,{borderBottomColor:c.border}]}><ThemedText style={[styles.detailHead,styles.detailDesc]}>Detalle</ThemedText><ThemedText style={[styles.detailHead,styles.detailCant]}>Cant.</ThemedText><ThemedText style={[styles.detailHead,styles.detailMoney]}>P/U</ThemedText><ThemedText style={[styles.detailHead,styles.detailMoney]}>Subtotal</ThemedText></View>
      {e.detalles.length?e.detalles.map((d,i)=><View key={`${e.id}-${i}`} style={[styles.mobileDetailRow,i<e.detalles.length-1&&{borderBottomColor:c.border,borderBottomWidth:1}]}><ThemedText style={styles.detailDesc}>{d.detalle}</ThemedText><ThemedText style={styles.detailCant}>{Number(d.cantidad)}</ThemedText><ThemedText style={styles.detailMoney}>Bs {Number(d.precio_unitario).toFixed(2)}</ThemedText><ThemedText style={styles.detailMoney}>Bs {(Number(d.cantidad)*Number(d.precio_unitario)).toFixed(2)}</ThemedText></View>):<ThemedText style={{color:c.textSecondary}}>Sin detalle registrado.</ThemedText>}
     </View>
     <View style={styles.ticketRows}>
      <View style={styles.ticketRow}><ThemedText style={styles.ticketLabel}>Cantidad:</ThemedText><ThemedText style={styles.ticketValue}>{cantidad(e)}</ThemedText></View>
      {Number(e.descuento)>0?<View style={styles.ticketRow}><ThemedText style={styles.ticketLabel}>Descuento:</ThemedText><ThemedText style={styles.ticketValue}>Bs {Number(e.descuento).toFixed(2)}</ThemedText></View>:null}
      <View style={styles.ticketRow}><ThemedText style={styles.ticketTotal}>TOTAL:</ThemedText><ThemedText style={styles.ticketTotal}>Bs {Number(e.total).toFixed(2)}</ThemedText></View>
      <View style={styles.ticketRow}><ThemedText style={styles.ticketLabel}>Concepto:</ThemedText><ThemedText style={styles.ticketValue}>{e.concepto||"—"}</ThemedText></View>
      <View style={styles.ticketRow}><ThemedText style={styles.ticketLabel}>Viaje:</ThemedText><ThemedText style={styles.ticketValue}>#{e.viaje?.id??"—"}</ThemedText></View>
     </View>
     <View style={[styles.mobileActionsRow,{borderTopColor:c.border}]}>{acciones(e,true)}</View>
    </View>:null}
   </Card>})}</ScrollView>:
   <Table<Encomienda> data={encomiendas} columns={columns} loading={loading} keyExtractor={e=>String(e.id)} renderCell={(e,col)=>{switch(col.key){case"guia":return <ThemedText style={styles.bold}>{e.guia??"—"}</ThemedText>;case"fecha":return <ThemedText>{fecha(e.created_at)}</ThemedText>;case"remitente":return <View style={styles.centerCell}><ThemedText numberOfLines={2} style={styles.centerCellText}>{nombre(e.remitente)}</ThemedText></View>;case"destinatario":return <View style={styles.centerCell}><ThemedText numberOfLines={2} style={styles.centerCellText}>{nombre(e.destinatario)}</ThemedText></View>;case"ruta":return <View style={styles.centerCell}><ThemedText numberOfLines={2} style={styles.centerCellText}>{e.origen??"—"} → {e.destino??"—"}</ThemedText></View>;case"cantidad":return <ThemedText>{cantidad(e)}</ThemedText>;case"total":return <ThemedText>Bs {Number(e.total).toFixed(2)}</ThemedText>;case"pago":return <View style={styles.centerCell}><Badge label={e.estado_pago} variant={e.estado_pago==="Pagado"?"success":"warning"}/></View>;case"estado":return <View style={styles.centerCell}><Badge label={estadoLabel(e.estado)} variant={estadoVariant(e.estado)}/></View>;case"acciones":return acciones(e);default:return null;}}}/>}
  </View>
  {mobile?<View style={[styles.totalBar,{borderColor:c.border}]}><ThemedText style={styles.totalLabel}>TOTAL:</ThemedText><ThemedText style={styles.totalValue}>Bs {Number(resumen.ingresos||0).toFixed(2)}</ThemedText></View>:<View style={[styles.desktopBottomBar,{borderColor:c.border}]}><View style={styles.desktopPagination}><Pagination meta={pmeta} onPageChange={irAPagina} itemLabel="encomiendas" maxVisiblePages={7}/></View><View pointerEvents="none" style={styles.desktopTotal}><ThemedText style={styles.totalLabel}>TOTAL:</ThemedText><ThemedText style={styles.totalValue}>Bs {Number(resumen.ingresos||0).toFixed(2)}</ThemedText></View></View>}
 </View>;

 const nuevaEncomienda=()=>{setReportes(false);setResetRegistroKey(v=>v+1);setPaso(1);setRegistrando(true);};
 const verEncomiendas=()=>{setRegistroExitoso(null);setReportes(false);setRegistrando(false);setPaso(1);void refresh();};
 const imprimirRegistro=()=>{if(!registroExitoso)return;void abrirTicket(registroExitoso,"comprobante");};

 return <View style={[styles.screen,mobile&&styles.screenMobile,{backgroundColor:c.background}]}>
  {registrando&&!reportes?<PasoStepper pasoActual={paso} pasos={["Detalle","Viaje","Pago","Registro"]}/>:null}
  {reportes?<View style={styles.reportRoot}><View style={[styles.reportTop,mobile&&styles.reportTopMobile]}><Button title="Volver a encomiendas" variant="secondary" onPress={()=>{setReportes(false);setRegistrando(false)}}/></View><EncomiendaReportesScreen embedded/></View>:
   !registrando?<>
    <View style={[styles.compactHeader,mobile&&styles.compactHeaderMobile,{borderColor:c.border,backgroundColor:c.backgroundSecondary}]}>
     <View style={styles.compactHeaderIdentity}><View style={[styles.headerPackageIcon,{backgroundColor:c.background}]}><Package size={mobile?20:22} color={c.primary}/></View><ThemedText style={[styles.compactHeaderTitle,mobile&&styles.compactHeaderTitleMobile]}>Encomiendas</ThemedText><Badge label={`${pmeta.total}`} variant="info"/></View>
     <View style={styles.compactHeaderActions}>
      {!mobile?fechaBar:null}
      <IconButton icon={BarChart3} size={mobile?"sm":"md"} variant="secondary" accessibilityLabel="Reportes" onPress={()=>setReportes(true)}/>
      <IconButton icon={Plus} size={mobile?"sm":"md"} variant="primary" accessibilityLabel="Nueva encomienda" onPress={nuevaEncomienda}/>
      <IconButton icon={RefreshCw} size={mobile?"sm":"md"} variant="secondary" accessibilityLabel="Actualizar" loading={loading} onPress={()=>void refresh()}/>
      <IconButton icon={ScanLine} size={mobile?"sm":"md"} variant="secondary" accessibilityLabel="Escanear QR" onPress={()=>setScannerVisible(true)}/>
     </View>
    </View>
    {listado}
   </>:<RegistroEncomiendaPanel paso={paso} onPasoChange={setPaso} onCancelar={()=>{setRegistrando(false);setPaso(1)}} resetKey={resetRegistroKey} onCreated={(e)=>{setRegistroExitoso(e);void refresh();}}/>}

  <EncomiendaRegistroExitosoModal visible={!!registroExitoso&&!previewVisible} encomienda={registroExitoso} onImprimir={imprimirRegistro} onVerEncomiendas={verEncomiendas}/>
  <EncomiendaDetalleModal visible={!!detalle} encomienda={detalle} onClose={()=>setDetalle(null)}/>
  <EncomiendaFormModal visible={!!editing} encomienda={editing} catalogos={catalogos} loadingCatalogos={loadingCatalogos} saving={saving} onClose={()=>setEditing(null)}
   onLoadCatalogos={cargarCatalogos} onUpdate={async(e,p)=>{const ok=await actualizar(e,p);if(ok)setEditing(null);return ok}}
   onChangeTrip={async(e,idViaje)=>asignar(e,{id_viaje:idViaje})}/>
  <EncomiendaPagoModal visible={!!cobro} encomienda={cobro} saving={saving} onClose={()=>setCobro(null)} onConfirm={cobrar}/>
  <DatePicker visible={datePickerVisible} mode={datePickerMode} title={datePickerMode==="single"?"Seleccionar fecha":"Seleccionar rango de fechas"} initialDate={fechaDesde} initialRange={fechaDesde&&fechaHasta?{start:fechaDesde,end:fechaHasta}:undefined} onClose={()=>setDatePickerVisible(false)} onApply={aplicarFecha}/>
  <EncomiendaFiltrosModal visible={filtrosModal} value={filtrosAvanzados} choferes={catalogos?.viajes.map(v=>v.chofer).filter((x):x is NonNullable<typeof x>=>!!x).filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i)??[]} onClose={()=>setFiltrosModal(false)} onApply={setFiltrosAvanzados}/>
  <EncomiendaQrScannerModal visible={scannerVisible} loading={scanning} onClose={()=>setScannerVisible(false)} onScan={scan}/>
  <ThermalHtmlRasterizer ref={thermalRasterizerRef}/>
  <EncomiendaPrintPreviewModal visible={previewVisible} title={previewTitle} html={previewHtml} loading={previewLoading} onPrintHtml={imprimirHtmlReal} onClose={()=>{if(!previewLoading){setPreviewVisible(false);setPreviewHtml("")}}}/>
  <PrinterSetupModal visible={printerSetupVisible} requirement={ENCOMIENDAS_PRINTER_REQUIREMENT} required={Platform.OS!=="web"&&(configurationRequired||!encomiendasDefaultPrinter)} onClose={()=>setPrinterSetupVisible(false)} onConfigured={(device)=>{setPrinterSetupVisible(false);Toast.show({type:"success",text1:"Impresora lista",text2:`${device.name} quedó guardada como predeterminada.`})}}/>
 </View>;
}
const styles=StyleSheet.create({
 screen:{flex:1,width:"100%",padding:18,gap:10,minHeight:0},screenMobile:{padding:10,gap:8},listWrap:{flex:1,gap:10,minHeight:0},listBody:{flex:1,minHeight:0},
 actions:{flexDirection:"row",gap:5,justifyContent:"center",flexWrap:"wrap"},bold:{fontWeight:"800"},centerCell:{flex:1,width:"100%",alignSelf:"stretch",alignItems:"center",justifyContent:"center"},centerCellText:{width:"100%",textAlign:"center"},
 searchFilterRow:{flexDirection:"row",gap:8,alignItems:"center"},search:{flex:1,minWidth:0},mobileDateBar:{alignItems:"flex-start"},dateQuickRow:{flexDirection:"row",gap:6,alignItems:"center",flexWrap:"nowrap"},quickDate:{height:36,minWidth:58,paddingHorizontal:10,borderWidth:1,borderRadius:18,alignItems:"center",justifyContent:"center"},quickDateText:{fontSize:11},totalBar:{borderTopWidth:1,paddingVertical:8,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},totalLabel:{fontWeight:"900"},totalValue:{fontSize:18,fontWeight:"900"},desktopBottomBar:{borderTopWidth:1,position:"relative",justifyContent:"center"},desktopPagination:{width:"100%"},desktopTotal:{position:"absolute",left:0,right:0,top:0,bottom:0,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},
 mobileListScroll:{flex:1,minHeight:0},cards:{gap:7,paddingBottom:8},mobileCard:{padding:0,overflow:"hidden"},mobileCompactRow:{minHeight:58,paddingHorizontal:12,paddingVertical:8,flexDirection:"row",alignItems:"center",gap:10},mobilePackageIcon:{width:38,height:38,borderRadius:10,alignItems:"center",justifyContent:"center",flexShrink:0},mobileCompactInfo:{flex:1,minWidth:0,gap:2},mobileDate:{fontSize:12},mobileCompactStatus:{alignItems:"flex-end",flexShrink:0},mobileExpanded:{borderTopWidth:1,paddingHorizontal:12,paddingVertical:10,gap:10},ticketRows:{gap:5},ticketRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",gap:12},ticketLabel:{fontSize:12,fontWeight:"800",flexShrink:0},ticketValue:{fontSize:12,textAlign:"right",flex:1},ticketTotal:{fontSize:13,fontWeight:"900"},mobileDetailTable:{borderWidth:1,borderRadius:8,overflow:"hidden"},mobileDetailHeader:{flexDirection:"row",paddingHorizontal:7,paddingVertical:6,borderBottomWidth:1},mobileDetailRow:{flexDirection:"row",paddingHorizontal:7,paddingVertical:7,alignItems:"flex-start"},detailHead:{fontSize:10,fontWeight:"900"},detailDesc:{flex:1.55,minWidth:0,fontSize:10},detailCant:{width:38,textAlign:"center",fontSize:10},detailMoney:{width:67,textAlign:"right",fontSize:10},mobileActionsRow:{borderTopWidth:1,paddingTop:9,alignItems:"center"},mobileActions:{flexDirection:"row",gap:8,justifyContent:"center",flexWrap:"wrap"},
 compactHeader:{minHeight:58,borderWidth:1,borderRadius:14,paddingHorizontal:12,paddingVertical:8,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},compactHeaderMobile:{minHeight:48,paddingHorizontal:9,paddingVertical:6},compactHeaderIdentity:{flexDirection:"row",alignItems:"center",gap:8,flex:1,minWidth:0},headerPackageIcon:{width:36,height:36,borderRadius:9,alignItems:"center",justifyContent:"center"},compactHeaderTitle:{fontSize:20,fontWeight:"900"},compactHeaderTitleMobile:{fontSize:16},compactHeaderActions:{flexDirection:"row",alignItems:"center",gap:6,flexShrink:0},
 desktopHeaderContent:{paddingVertical:2},reportRoot:{flex:1,minHeight:0,gap:8},reportTop:{alignItems:"flex-start",marginHorizontal:18},reportTopMobile:{marginHorizontal:12}
});
