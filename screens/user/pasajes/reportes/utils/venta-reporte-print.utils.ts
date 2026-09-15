import {
  VentaReporteFiltros,
} from "../types/venta-reporte.types";

/*
|--------------------------------------------------------------------------
| ETIQUETAS RESUELTAS
|--------------------------------------------------------------------------
|
| Nombres ya resueltos desde los catálogos cacheados
| (rutas, vehículos y choferes) para describir los filtros.
|
*/

export interface EtiquetasFiltrosVenta {
  rutaNombre?: string | null;
  vehiculoNombre?: string | null;
  choferNombre?: string | null;
}

/*
|--------------------------------------------------------------------------
| FECHA / PERIODO
|--------------------------------------------------------------------------
*/

function fecha(
  value?:
    string | null,
): string {
  if (!value) {
    return "-";
  }

  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    );

  if (!match) {
    return value;
  }

  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function periodoReporte(
  filtros:
    VentaReporteFiltros,
): string {
  if (
    filtros.fecha_inicio &&
    filtros.fecha_fin
  ) {
    return `${fecha(filtros.fecha_inicio)} - ${fecha(filtros.fecha_fin)}`;
  }

  if (
    filtros.fecha_inicio
  ) {
    return `Desde ${fecha(filtros.fecha_inicio)}`;
  }

  if (
    filtros.fecha_fin
  ) {
    return `Hasta ${fecha(filtros.fecha_fin)}`;
  }

  return "Todas las fechas";
}

/*
|--------------------------------------------------------------------------
| ESTADO (el backend filtra solo Pagada si se omite)
|--------------------------------------------------------------------------
*/

export function estadoReporte(
  filtros:
    VentaReporteFiltros,
): string {
  return (
    filtros.estado ??
    "Pagada (por defecto)"
  );
}

/*
|--------------------------------------------------------------------------
| TEXTO PARA IMPRESORAS TÉRMICAS
|--------------------------------------------------------------------------
|
| El backend no expone JSON para este módulo, así que el texto
| térmico describe el reporte + los filtros aplicados. El detalle
| fila por fila viaja en el HTML del backend.
|
*/

export function construirTextoReporteVenta(
  titulo:
    string,

  filtros:
    VentaReporteFiltros,

  etiquetas:
    EtiquetasFiltrosVenta = {},

  esPlanilla =
    false,

  idViaje?:
    number,
): string {
  const lineas:
    string[] = [
      titulo,
      "================================",
    ];

  if (
    esPlanilla
  ) {
    lineas.push(
      `Viaje: #${idViaje ?? "-"}`,
      "Solo ventas Pagada",
    );
  } else {
    lineas.push(
      `Periodo: ${periodoReporte(filtros)}`,
      `Estado: ${estadoReporte(filtros)}`,
    );
  }

  if (
    filtros.id_ruta !==
    undefined
  ) {
    lineas.push(
      `Ruta: ${etiquetas.rutaNombre ?? `#${filtros.id_ruta}`}`,
    );
  }

  if (
    filtros.id_vehiculo !==
    undefined
  ) {
    lineas.push(
      `Vehiculo: ${etiquetas.vehiculoNombre ?? `#${filtros.id_vehiculo}`}`,
    );
  }

  if (
    filtros.id_chofer !==
    undefined
  ) {
    lineas.push(
      `Chofer: ${etiquetas.choferNombre ?? `#${filtros.id_chofer}`}`,
    );
  }

  if (
    filtros.forma_pago
  ) {
    lineas.push(
      `Forma de pago: ${filtros.forma_pago}`,
    );
  }

  lineas.push(
    "================================",
    "",
    "El detalle del reporte se imprime",
    "desde el documento generado.",
  );

  return lineas.join(
    "\n",
  );
}

/*
|--------------------------------------------------------------------------
| DESCRIPCIÓN CORTA (subtítulo del modal)
|--------------------------------------------------------------------------
*/

export function descripcionFiltrosReporteVenta(
  filtros:
    VentaReporteFiltros,

  etiquetas:
    EtiquetasFiltrosVenta = {},

  esPlanilla =
    false,

  idViaje?:
    number,
): string {
  if (
    esPlanilla
  ) {
    return `Viaje #${idViaje ?? "-"} | Solo ventas Pagada`;
  }

  const partes:
    string[] = [
      periodoReporte(
        filtros,
      ),

      estadoReporte(
        filtros,
      ),
    ];

  if (
    filtros.id_ruta !==
    undefined
  ) {
    partes.push(
      etiquetas.rutaNombre ??
      `Ruta #${filtros.id_ruta}`,
    );
  }

  if (
    filtros.id_vehiculo !==
    undefined
  ) {
    partes.push(
      etiquetas.vehiculoNombre ??
      `Vehiculo #${filtros.id_vehiculo}`,
    );
  }

  if (
    filtros.id_chofer !==
    undefined
  ) {
    partes.push(
      etiquetas.choferNombre ??
      `Chofer #${filtros.id_chofer}`,
    );
  }

  if (
    filtros.forma_pago
  ) {
    partes.push(
      filtros.forma_pago,
    );
  }

  return partes.join(
    " | ",
  );
}
