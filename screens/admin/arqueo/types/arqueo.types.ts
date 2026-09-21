// screens/admin/arqueo/types/arqueo.types.ts

export type EstadoArqueo = "Iniciado" | "Terminado";
export type EstadoMovimiento = "Valido" | "Anulado";
export type TipoPago = "Efectivo" | "Tarjeta" | "QR" | "Transferencia";
export type NaturalezaTransaccion = "Ingreso" | "Egreso";

export interface ArqueoUser {
  id: number;
  usuario?: string;
  nombres?: string | null;
  primer_apellido?: string | null;
  segundo_apellido?: string | null;
  email?: string | null;
  foto?: string | null;
  estado?: string;
  [key: string]: unknown;
}

export interface ConteoArqueo {
  billete_200: number;
  billete_100: number;
  billete_50: number;
  billete_20: number;
  billete_10: number;
  moneda_5: number;
  moneda_2: number;
  moneda_1: number;
  moneda_50_ctvs: number;
  moneda_20_ctvs: number;
  moneda_10_ctvs: number;
}

export const CONTEO_VACIO: ConteoArqueo = {
  billete_200: 0,
  billete_100: 0,
  billete_50: 0,
  billete_20: 0,
  billete_10: 0,
  moneda_5: 0,
  moneda_2: 0,
  moneda_1: 0,
  moneda_50_ctvs: 0,
  moneda_20_ctvs: 0,
  moneda_10_ctvs: 0,
};

/*
|--------------------------------------------------------------------------
| DESGLOSE POR VIAJE (solo rol Chofer, GET /api/arqueos/{id})
|--------------------------------------------------------------------------
|
| Las claves viajes / viajes_totales SOLO existen cuando el
| usuario autenticado es chofer. Para no-choferes la clave
| está ausente (no confundir con [] = chofer sin viajes).
|
| ingresos_de_otros es INFORMATIVO (lo que la oficina le
| debe pagar físicamente al chofer): NO suma al arqueo.
|
*/

export interface ViajeArqueoAsiento {
  id_venta: number;
  id_detalle_venta: number;
  numero_asiento: number | null;
  fila: number;
  columna: number;
  monto: string;
  fecha: string | null;
  estado_venta: string;
}

export interface ViajeArqueoMisIngresos {
  total: string;
  asientos: ViajeArqueoAsiento[];
}

export interface ViajeArqueoOtro {
  id_user: number;
  usuario: string;
  nombre_completo: string;
  total: string;
  asientos: ViajeArqueoAsiento[];
}

export interface ViajeArqueo {
  id_viaje: number;
  estado_viaje: string;
  ruta: { origen: string; destino: string } | null;
  vehiculo: { placa: string; tipo: string } | null;
  asientos: {
    totales: number;
    vendidos_por_mi: number;
    vendidos_por_otros: number;
    pendientes: number;
  };
  mis_ingresos: ViajeArqueoMisIngresos;
  ingresos_de_otros: ViajeArqueoOtro[];
}

export interface ViajesTotales {
  viajes: number;
  asientos_totales: number;
  vendidos_por_mi: number;
  vendidos_por_otros: number;
  pendientes: number;
  ingreso_por_mi: string;
  ingreso_por_otros: string;
}

/** true solo si la clave viajes existe (usuario chofer). */
export function esDesgloseChofer(a: Arqueo | null | undefined): boolean {
  return !!a && Array.isArray(a.viajes);
}

export function etiquetaAsiento(a: ViajeArqueoAsiento): string {
  if (a.numero_asiento !== null && a.numero_asiento !== undefined) {
    return `Asiento ${a.numero_asiento}`;
  }
  return `F${a.fila}-C${a.columna}`;
}

export interface Arqueo {
  id: number;
  id_user: number;
  fecha_apertura: string;
  fecha_cierre: string | null;
  saldo_anterior: string;
  total_efectivo: string | null;
  total_tarjeta: string | null;
  total_qr: string | null;
  total_transferencia: string | null;
  total_general: string | null;
  billete_200: number;
  billete_100: number;
  billete_50: number;
  billete_20: number;
  billete_10: number;
  moneda_5: number;
  moneda_2: number;
  moneda_1: number;
  moneda_50_ctvs: number;
  moneda_20_ctvs: number;
  moneda_10_ctvs: number;
  estado: EstadoArqueo;
  created_at: string;
  updated_at: string;
  user?: ArqueoUser | null;
  ingresos?: Ingreso[];
  egresos?: Egreso[];
  /** Solo presente si el usuario autenticado es chofer. */
  viajes?: ViajeArqueo[];
  viajes_totales?: ViajesTotales;
}

export interface TipoTransaccion {
  id: number;
  codigo: string;
  transaccion: string;
  tipo_transaccion: NaturalezaTransaccion;
  created_at: string;
  updated_at: string;
}

export interface Ingreso {
  id: number;
  id_user: number;
  id_arqueo: number;
  id_tipo_transaccion: number;
  tipo_pago: TipoPago;
  fecha_registro: string;
  detalle: string;
  monto: string;
  estado: EstadoMovimiento;
  created_at: string;
  updated_at: string;
  user?: ArqueoUser | null;
  tipo_transaccion?: TipoTransaccion | null;
}

export interface Egreso {
  id: number;
  id_user: number;
  id_arqueo: number;
  id_tipo_transaccion: number;
  tipo_pago: TipoPago;
  fecha_registro: string;
  detalle: string;
  monto: string;
  estado: EstadoMovimiento;
  created_at: string;
  updated_at: string;
  user?: ArqueoUser | null;
  tipo_transaccion?: TipoTransaccion | null;
}

export interface LaravelPaginador<T> {
  data: T[];
  links: { first: string | null; last: string | null; prev: string | null; next: string | null };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

export interface ArqueoFiltros {
  id_user?: number;
  estado?: EstadoArqueo | "";
  fecha_desde?: string;
  fecha_hasta?: string;
  per_page?: number;
  page?: number;
}

export interface MovimientoFiltros {
  id_arqueo?: number;
  id_user?: number;
  id_tipo_transaccion?: number;
  tipo_pago?: TipoPago | "";
  estado?: EstadoMovimiento | "";
  fecha_desde?: string;
  fecha_hasta?: string;
  per_page?: number;
  page?: number;
}

export interface TipoTransaccionFiltros {
  tipo_transaccion?: NaturalezaTransaccion | "";
  buscar?: string;
  per_page?: number;
  page?: number;
}

export interface AbrirArqueoPayload {
  saldo_anterior: number;
}

export interface CerrarArqueoPayload {
  total_efectivo?: number;
  total_tarjeta?: number;
  total_qr?: number;
  total_transferencia?: number;
  total_general?: number;
  billete_200?: number;
  billete_100?: number;
  billete_50?: number;
  billete_20?: number;
  billete_10?: number;
  moneda_5?: number;
  moneda_2?: number;
  moneda_1?: number;
  moneda_50_ctvs?: number;
  moneda_20_ctvs?: number;
  moneda_10_ctvs?: number;
}

export interface MovimientoPayload {
  tipo_transaccion: number | string;
  monto: number;
  tipo_pago: TipoPago;
  detalle: string;
}

export interface TipoTransaccionPayload {
  codigo: string;
  transaccion: string;
  tipo_transaccion: NaturalezaTransaccion;
}

export interface TipoTransaccionUpdatePayload {
  codigo?: string;
  transaccion?: string;
  tipo_transaccion?: NaturalezaTransaccion;
}

export const DENOMINACIONES: { key: keyof ConteoArqueo; label: string; value: number }[] = [
  { key: "billete_200", label: "Billetes 200 Bs", value: 200 },
  { key: "billete_100", label: "Billetes 100 Bs", value: 100 },
  { key: "billete_50", label: "Billetes 50 Bs", value: 50 },
  { key: "billete_20", label: "Billetes 20 Bs", value: 20 },
  { key: "billete_10", label: "Billetes 10 Bs", value: 10 },
  { key: "moneda_5", label: "Monedas 5 Bs", value: 5 },
  { key: "moneda_2", label: "Monedas 2 Bs", value: 2 },
  { key: "moneda_1", label: "Monedas 1 Bs", value: 1 },
  { key: "moneda_50_ctvs", label: "Monedas 50 ctvs", value: 0.5 },
  { key: "moneda_20_ctvs", label: "Monedas 20 ctvs", value: 0.2 },
  { key: "moneda_10_ctvs", label: "Monedas 10 ctvs", value: 0.1 },
];

export function num(v: string | number | null | undefined): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function calcularTotalConteo(conteo: ConteoArqueo): number {
  let total = 0;
  for (const d of DENOMINACIONES) total += (conteo[d.key] || 0) * d.value;
  return Math.round(total * 100) / 100;
}

export function conteoDesdeArqueo(a: Arqueo | null | undefined): ConteoArqueo {
  if (!a) return { ...CONTEO_VACIO };
  return {
    billete_200: a.billete_200 ?? 0,
    billete_100: a.billete_100 ?? 0,
    billete_50: a.billete_50 ?? 0,
    billete_20: a.billete_20 ?? 0,
    billete_10: a.billete_10 ?? 0,
    moneda_5: a.moneda_5 ?? 0,
    moneda_2: a.moneda_2 ?? 0,
    moneda_1: a.moneda_1 ?? 0,
    moneda_50_ctvs: a.moneda_50_ctvs ?? 0,
    moneda_20_ctvs: a.moneda_20_ctvs ?? 0,
    moneda_10_ctvs: a.moneda_10_ctvs ?? 0,
  };
}
