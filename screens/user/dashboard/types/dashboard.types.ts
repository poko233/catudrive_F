import type { Chofer } from "@/screens/user/choferes/types/chofer.types";

export type DashboardPeriodo = "hoy" | "7dias" | "mes" | "todos";

export interface DashboardIndicadores {
  viajes_total: number;
  viajes_finalizados: number;
  viajes_en_curso: number;
  viajes_programados: number;
  viajes_cancelados: number;
  ventas_pagadas: number;
  pasajes_vendidos: number;
  ingresos_pasajes: number;
  egresos_validos: number;
  egresos_cantidad: number;
  saldo_referencial: number;
  promedio_por_pasaje: number;
  promedio_por_viaje: number;
}

export interface DashboardVehiculo {
  id: number;
  placa: string;
  viajes_total: number;
  viajes_finalizados: number;
  viajes_en_curso: number;
  viajes_programados: number;
  viajes_cancelados: number;
  ventas_pagadas: number;
  pasajes_vendidos: number;
  ingresos_pasajes: number;
}

export interface DashboardChofer extends Chofer {
  indicadores: DashboardIndicadores;
  vehiculos: DashboardVehiculo[];
}

export interface DashboardResumen {
  total: number;
  activos: number;
  inactivos: number;
  indicadores: DashboardIndicadores;
}

export interface DashboardChoferesResponse {
  rol: "administrador" | "chofer";
  periodo: DashboardPeriodo;
  rango: { desde: string | null; hasta: string | null };
  choferes: DashboardChofer[];
  resumen: DashboardResumen;
  vehiculos: DashboardVehiculo[];
}
