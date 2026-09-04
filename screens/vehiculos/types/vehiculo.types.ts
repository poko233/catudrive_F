export type EstadoVehiculo = "Operativo" | "En mantenimiento" | "Baja";
export type EstadoPiso = "Activo" | "Inactivo";
export type EstadoAsiento = "Activo" | "Inactivo";
export type TipoCelda =
  | "pasajero"
  | "conductor"
  | "escaleras"
  | "no_disponible"
  | "pasillo";

export interface CategoriaVehiculo {
  id: number;
  categoria: string;
}

export interface Asiento {
  id?: number; // presente al editar, opcional al crear
  fila: number;
  columna: number;
  tipo_celda: TipoCelda;
  numero_asiento: number | null;
  estado: EstadoAsiento;
}

export interface Piso {
  id?: number;
  numero: number;
  nombre: string;
  filas: number;
  columnas: number;
  orden: number;
  estado: EstadoPiso;
  asientos: Asiento[];
}

export interface Vehiculo {
  id: number;
  id_categoria: number;
  placa: string;
  tipo: string;
  marca: string;
  modelo: string;
  color: string | null;
  capacidad: number;
  estado: EstadoVehiculo;
  categoria?: CategoriaVehiculo;
  pisos?: Piso[];
}

export interface VehiculoForm {
  id_categoria: number;
  placa: string;
  tipo: string;
  marca: string;
  modelo: string;
  color: string | null;
  estado: EstadoVehiculo;
  pisos: Piso[];
}

export interface VehiculoResponseCollection {
  data: Vehiculo[];
}

export interface CategoriaVehiculoResponse {
  data: CategoriaVehiculo[];
}

export interface VehiculoMutationResponse extends Vehiculo {}
