export type ViajeEstado = "Vendiendo" | "En curso" | "Finalizado" | "Cancelado";

export interface Viaje {
  id: number;
  estado: ViajeEstado;
  id_vehiculo_chofer_ruta: number;
  origen: string;
  destino: string;
  hora_salida: string; // formato "YYYY-MM-DD HH:MM:SS"
  tarifa: string; // decimal como string
  vehiculo: string;
  chofer: string;
  created_at: string;
}

export interface PaginacionMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ViajesResponse {
  data: Viaje[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: PaginacionMeta;
}

export type TipoCelda =
  | "pasajero"
  | "conductor"
  | "escaleras"
  | "no_disponible"
  | "pasillo";

export type EstadoOcupacion =
  | "libre"
  | "reservado"
  | "vendido"
  | "no_disponible";

export interface Asiento {
  id: number;
  fila: number;
  columna: number;
  tipo_celda: TipoCelda;
  numero_asiento: number | null;
  estado: "Activo" | "Inactivo";
  estado_ocupacion: EstadoOcupacion;
  id_venta?: number | null;
  id_detalle_venta?: number | null;
}

export interface Piso {
  id: number;
  nombre: string;
  numero: number;
  asientos: Asiento[];
}

export interface AsientosResponse {
  success: boolean;
  data: Piso[];
}

export interface Pasajero {
  id: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  ci: string;
}

export interface DetalleVenta {
  id: number;
  asiento: {
    id: number;
    fila: number;
    columna: number;
    numero_asiento: number | null;
  };
  pasajero: Pasajero | null;
  precio_unitario: string;
}

export interface Venta {
  id: number;
  id_viaje: number;
  origen: string;
  destino: string;
  hora_salida: string;
  estado: "Pendiente" | "Pagada" | "Anulada";
  forma_pago: string | null;
  precio_total: string;
  detalles: DetalleVenta[];
}

export interface VentaResponse {
  data: Venta;
}

export interface PeticionIniciarVenta {
  id_viaje: number;
  asientos: {
    id_asiento: number;
    precio_unitario: number;
  }[];
}

export interface ConfirmarPasajero {
  id_detalle_venta: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  ci: string;
  precio_unitario: number;
}

export interface PeticionConfirmarVenta {
  forma_pago: string;
  pasajeros: ConfirmarPasajero[];
}

export interface PeticionCambiarAsiento {
  nuevo_id_asiento: number;
}

export interface Asignacion {
  id: number;
  id_chofer: number;
  id_vehiculo: number;
  fecha_asignacion: string;
  fecha_finalizacion: string | null;
  observacion: string | null;
  estado: "Activo" | "Inactivo" | string;
  chofer?: {
    id: number;
    nombre_completo?: string | null;
    nombre?: string | null;
    ci?: string | null;
    foto?: string | null;
    carnet_sindical?: string | null;
    telefono?: string | null;
  } | null;
  vehiculo?: {
    id: number;
    placa: string;
    tipo: string;
    marca: string;
    modelo: string;
    color?: string | null;
    capacidad: number;
    estado: string;
  } | null;
}

export interface Ruta {
  id: number;
  origen: string;
  destino: string;
  fecha_inicio: string | null;
  hora_inicio: string | null;
  fecha_fin?: string | null;
  hora_fin?: string | null;
  tarifa: string;
  estado: "Activa" | "Inactiva" | string;
  viajes_count?: number;
}

export interface VehiculoChoferRuta {
  id: number;
  id_asignacion_vehiculo_chofer: number;
  id_ruta: number;
  hora_inicio: string | null;
  asignacion?: Asignacion | null;
  ruta?: Ruta | null;
}

export interface VCRResponse {
  data: VehiculoChoferRuta[];
  links: any;
  meta: any;
}
