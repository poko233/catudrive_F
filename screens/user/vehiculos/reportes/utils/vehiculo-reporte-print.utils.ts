import {
  VehiculoReporteFiltros,
} from "../types/vehiculo-reporte.types";

/*
|--------------------------------------------------------------------------
| ETIQUETAS RESUELTAS
|--------------------------------------------------------------------------
|
| Nombres ya resueltos desde los catálogos cacheados
| (categorías y choferes) para describir los filtros.
|
*/

export interface EtiquetasFiltrosVehiculo {
  categoriaNombre?: string | null;
  choferNombre?: string | null;
}

/*
|--------------------------------------------------------------------------
| FECHA
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
    VehiculoReporteFiltros,
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
| TEXTO PARA IMPRESORAS TÉRMICAS
|--------------------------------------------------------------------------
|
| El backend no expone JSON para este módulo, así que el texto
| térmico describe el reporte + los filtros aplicados. El detalle
| fila por fila viaja en el HTML del backend.
|
*/

export function construirTextoReporteVehiculo(
  titulo:
    string,

  filtros:
    VehiculoReporteFiltros,

  etiquetas:
    EtiquetasFiltrosVehiculo = {},
): string {
  const lineas:
    string[] = [
      titulo,
      "================================",
      `Periodo: ${periodoReporte(filtros)}`,
    ];

  if (
    filtros.estado
  ) {
    lineas.push(
      `Estado: ${filtros.estado}`,
    );
  }

  if (
    filtros.id_categoria !==
    undefined
  ) {
    lineas.push(
      `Categoria: ${etiquetas.categoriaNombre ?? `#${filtros.id_categoria}`}`,
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

export function descripcionFiltrosReporteVehiculo(
  filtros:
    VehiculoReporteFiltros,

  etiquetas:
    EtiquetasFiltrosVehiculo = {},
): string {
  const partes:
    string[] = [
      periodoReporte(
        filtros,
      ),
    ];

  if (
    filtros.estado
  ) {
    partes.push(
      filtros.estado,
    );
  }

  if (
    filtros.id_categoria !==
    undefined
  ) {
    partes.push(
      etiquetas.categoriaNombre ??
      `Categoria #${filtros.id_categoria}`,
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

  return partes.join(
    " | ",
  );
}
