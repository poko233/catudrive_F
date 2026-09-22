import type { ViajeEstado } from "./pasajes.types";

export interface ViajeEncomiendaItem {
  id: number;
  guia: string | null;
  concepto: string | null;
  subtotal: number;
  descuento: number;
  total: number;
  lugar_pago: string;
  estado_pago: string;
  tipo_pago: string | null;
  estado: string;
  remitente: {
    id: number;
    nombre_completo: string;
    ci: string | null;
    telefono: string | null;
  };
  destinatario: {
    id: number;
    nombre_completo: string;
    ci: string | null;
    telefono: string | null;
  };
  detalles: {
    id: number;
    detalle: string;
    cantidad: number;
    precio_unitario: number;
  }[];
}

export interface ViajeEncomiendasResponse {
  viaje: {
    id: number;
    estado: ViajeEstado | string;
    origen: string | null;
    destino: string | null;
    hora_salida: string | null;
    vehiculo: string | null;
    chofer: string | null;
  };
  total: number;
  encomiendas: ViajeEncomiendaItem[];
}
