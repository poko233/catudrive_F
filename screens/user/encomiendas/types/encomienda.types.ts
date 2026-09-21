export type EstadoEncomienda = "EN_ORIGEN" | "EN_TRANSITO" | "EN_DESTINO" | "ENTREGADA" | "ANULADA";
export type EstadoPago = "Pendiente" | "Pagado";
export type LugarPago = "Origen" | "Destino";
export type TipoPago = "Efectivo" | "QR" | "Transferencia";

export interface Cliente {
  id:number; nombres:string; apellido_paterno:string; apellido_materno:string|null;
  nombre_completo:string; ci:string|null; telefono:string|null;
}
export interface ClientePayload { nombres:string; apellido_paterno:string; apellido_materno?:string|null; ci?:string|null; telefono?:string|null; }
export interface ClientesResponse { clientes:Cliente[]; }
export interface ClienteResponse { cliente:Cliente; message?:string; }

export interface DetalleEncomienda { id?:number; detalle:string; cantidad:number; precio_unitario:number|string; subtotal?:number|string; }
export interface EncomiendaRuta { id:number; origen:string; destino:string; estado?:string|null; }
export interface EncomiendaChofer { id:number; nombre:string; ci?:string|null; }
export interface EncomiendaVehiculo { id:number; placa:string|null; tipo?:string|null; }
export interface EncomiendaViaje {
  id:number; estado:string|null; hora_inicio?:string|null; ruta:EncomiendaRuta|null;
  chofer:EncomiendaChofer|null; vehiculo:EncomiendaVehiculo|null;
}
export interface Encomienda {
  id:number; guia:string|null; qr_token?:string|null;
  remitente:Cliente|null; destinatario:Cliente|null; concepto:string|null; detalles:DetalleEncomienda[];
  subtotal:string; descuento:string; total:string; lugar_pago:LugarPago; estado_pago:EstadoPago; tipo_pago:TipoPago|null;
  estado:EstadoEncomienda; usuario_registro?:{id:number;nombre:string}|null;
  origen:string|null; destino:string|null; viaje:EncomiendaViaje|null; qr_disponible:boolean;
  created_at:string|null; updated_at:string|null;
}
export interface EncomiendaPayload {
  id_viaje:number; id_remitente:number; id_destinatario:number; concepto?:string|null; descuento?:number;
  lugar_pago:LugarPago; estado_pago:EstadoPago; tipo_pago?:TipoPago|null;
  detalles:Array<{detalle:string;cantidad:number;precio_unitario:number}>;
}
export interface EncomiendaUpdatePayload {
  id_remitente?:number; id_destinatario?:number; concepto?:string|null; descuento?:number;
  lugar_pago?:LugarPago; estado_pago?:EstadoPago; tipo_pago?:TipoPago|null;
}
export interface AsignarEncomiendaPayload { id_viaje:number; }
export interface CambiarEstadoEncomiendaPayload { estado:"EN_TRANSITO"|"EN_DESTINO"; }

export interface EncomiendaCatalogoChofer { id:number; nombre:string; ci:string|null; }
export interface EncomiendaCatalogoVehiculo { id:number; placa:string|null; tipo:string|null; }
export interface EncomiendaCatalogoRuta { id:number; origen:string; destino:string; estado?:string|null; }
export interface EncomiendaCatalogoViaje {
  id:number; estado:string|null; hora_inicio:string|null; ruta:EncomiendaCatalogoRuta|null;
  chofer:EncomiendaCatalogoChofer|null; vehiculo:EncomiendaCatalogoVehiculo|null;
}
export interface EncomiendaCatalogos {
  viajes:EncomiendaCatalogoViaje[]; estados:EstadoEncomienda[]; lugares_pago:LugarPago[];
  estados_pago:EstadoPago[]; tipos_pago:TipoPago[];
}
export interface EncomiendaListFilters { buscar?:string; estado?:EstadoEncomienda; estado_pago?:EstadoPago; lugar_pago?:LugarPago; page?:number; per_page?:number; }
export interface EncomiendaPaginationMeta { current_page:number; last_page:number; per_page:number; total:number; }
export interface EncomiendaResumen { total:number; enOrigen:number; enTransito:number; enDestino:number; entregadas:number; anuladas:number; ingresos:number; }
export interface EncomiendasResponse { encomiendas:Encomienda[]; meta:EncomiendaPaginationMeta; resumen:EncomiendaResumen; }
export interface EncomiendaResponse { encomienda:Encomienda; }
export interface EncomiendaMutationResponse { message:string; encomienda:Encomienda; }
export interface EncomiendaQr { contenido:string; imagen:string; }
export interface EncomiendaQrResponse { qr:EncomiendaQr; encomienda:Encomienda; }
export interface EscanearEncomiendaQrPayload { qr:string; }
