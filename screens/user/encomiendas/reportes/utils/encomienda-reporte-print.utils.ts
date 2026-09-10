import {
  EncomiendaCatalogoRuta,
} from "../../types/encomienda.types";

import {
  EncomiendaReporteFiltros,
  EncomiendaReporteResponse,
} from "../types/encmienda-reporte.types";

/*
|--------------------------------------------------------------------------
| TEXTO
|--------------------------------------------------------------------------
*/

function textoEstado(
  estado:
    string,
): string {
  switch (
    estado
  ) {
    case "REGISTRADA":
      return "Registrada";

    case "EN_TRANSITO":
      return "En tránsito";

    case "ENTREGADA":
      return "Entregada";

    case "ANULADA":
      return "Anulada";

    default:
      return estado;
  }
}

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

function rutaFiltro(
  filtros:
    EncomiendaReporteFiltros,

  rutas:
    EncomiendaCatalogoRuta[],
): string {
  if (
    !filtros.id_ruta
  ) {
    return "Todas las rutas";
  }

  const ruta =
    rutas.find(
      (
        item,
      ) =>
        item.id ===
        filtros.id_ruta,
    );

  return ruta
    ? `${ruta.origen} -> ${ruta.destino}`
    : `Ruta #${filtros.id_ruta}`;
}

/*
|--------------------------------------------------------------------------
| TEXTO PARA IMPRESORAS TÉRMICAS
|--------------------------------------------------------------------------
*/

export function construirTextoReporteEncomienda(
  reporte:
    EncomiendaReporteResponse,

  filtros:
    EncomiendaReporteFiltros,

  rutas:
    EncomiendaCatalogoRuta[],
): string {
  const lineas:
    string[] = [
      reporte.titulo,
      "================================",
      `Registros: ${reporte.total_registros}`,
      `Ruta: ${rutaFiltro(filtros, rutas)}`,
      `Fechas: ${
        filtros.fecha_inicio &&
        filtros.fecha_fin
          ? `${fecha(filtros.fecha_inicio)} - ${fecha(filtros.fecha_fin)}`
          : "Todas"
      }`,
  ];

  if (
    reporte.total_ingresos !==
    undefined
  ) {
    lineas.push(
      `Total ingresos: Bs ${reporte.total_ingresos}`,
    );
  }

  if (
    reporte.total_destinos !==
    undefined
  ) {
    lineas.push(
      `Destinos: ${reporte.total_destinos}`,
    );
  }

  lineas.push(
    "================================",
    "",
  );

  reporte.items.forEach(
    (
      item,
      index,
    ) => {
      lineas.push(
        `${index + 1}. ${item.guia ?? "Sin guía"}`,
        `${item.origen ?? "-"} -> ${item.destino ?? "-"}`,
        `Fecha: ${fecha(item.fecha)}`,
        `Remitente: ${item.remitente}`,
        `Destinatario: ${item.destinatario}`,
        `Cantidad: ${item.cantidad}`,
        `Estado: ${textoEstado(item.estado)}`,
        `Precio: Bs ${item.precio}`,
        item.viaje
          ? `Viaje: #${item.viaje.id}`
          : "Viaje: -",
        "--------------------------------",
      );
    },
  );

  if (
    reporte.tipo ===
      "por_destino" &&
    reporte.resumen_destinos
  ) {
    lineas.push(
      "",
      "RESUMEN POR DESTINO",
      "================================",
    );

    reporte.resumen_destinos.forEach(
      (
        item,
      ) => {
        lineas.push(
          `${item.destino}: ${item.cantidad} - Bs ${item.total}`,
        );
      },
    );
  }

  return lineas.join(
    "\n",
  );
}

export function descripcionFiltrosReporte(
  filtros:
    EncomiendaReporteFiltros,

  rutas:
    EncomiendaCatalogoRuta[],
): string {
  const periodo =
    filtros.fecha_inicio &&
    filtros.fecha_fin
      ? `${fecha(filtros.fecha_inicio)} - ${fecha(filtros.fecha_fin)}`
      : "Todas las fechas";

  return `${periodo} | ${rutaFiltro(
    filtros,
    rutas,
  )}`;
}
