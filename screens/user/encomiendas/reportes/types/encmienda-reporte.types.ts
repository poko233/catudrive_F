import {
    Encomienda,
} from "../../types/encomienda.types";

/*
|--------------------------------------------------------------------------
| TIPO REPORTE
|--------------------------------------------------------------------------
*/

export type TipoReporteEncomienda =
    | "registradas"
    | "pendientes"
    | "entregadas"
    | "por_destino"
    | "ingresos";

/*
|--------------------------------------------------------------------------
| FILTROS
|--------------------------------------------------------------------------
*/

export interface EncomiendaReporteFiltros {
    fecha_inicio?: string;
    fecha_fin?: string;
    id_ruta?: number;
}

/*
|--------------------------------------------------------------------------
| RESUMEN DESTINO
|--------------------------------------------------------------------------
*/

export interface EncomiendaReporteDestinoResumen {
    destino: string;
    cantidad: number;
    total: string;
}

/*
|--------------------------------------------------------------------------
| RESPUESTA BASE
|--------------------------------------------------------------------------
*/

export interface EncomiendaReporteResponse {
    tipo: TipoReporteEncomienda;
    titulo: string;
    total_registros: number;
    items: Encomienda[];

    total_destinos?: number;

    resumen_destinos?:
        EncomiendaReporteDestinoResumen[];

    total_ingresos?: string;
}