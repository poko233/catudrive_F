import type {
  Venta,
} from "../types/pasajes.types";

const WIDTH =
  32;

function linea(
  char =
    "-",
): string {
  return char.repeat(
    WIDTH,
  );
}

function money(
  value:
    string | number | null | undefined,
): string {
  const n =
    Number(
      value ?? 0,
    );

  return Number.isFinite(
    n,
  )
    ? n.toFixed(
        2,
      )
    : "0.00";
}

function fechaHora(
  value:
    string,
): string {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "es-BO",
    {
      year:
        "numeric",
      month:
        "2-digit",
      day:
        "2-digit",
      hour:
        "2-digit",
      minute:
        "2-digit",
    },
  );
}

function nombrePasajero(
  venta:
    Venta,
  index:
    number,
): string {
  const pasajero =
    venta.detalles[
      index
    ]?.pasajero;

  if (
    !pasajero
  ) {
    return "Sin pasajero";
  }

  return [
    pasajero.nombres,
    pasajero.apellido_paterno,
    pasajero.apellido_materno,
  ]
    .filter(
      Boolean,
    )
    .join(
      " ",
    );
}

interface OpcionesTicket {
  vehiculo?:
    string | null;

  chofer?:
    string | null;
}

/**
 * Ticket de texto pensado para 58 mm.
 *
 * - SUNMI imprime el Unicode normal.
 * - Bluetooth/Wi-Fi ESC/POS aplican su fallback ASCII en el adapter.
 * - La impresora del sistema seguirá usando el HTML recibido del backend.
 */
export function construirTicketVentaTexto(
  venta:
    Venta,
  opciones:
    OpcionesTicket = {},
): string {
  const rows:
    string[] = [
    `Venta #${venta.id}`,
    `${venta.origen} -> ${venta.destino}`,
    fechaHora(
      venta.hora_salida,
    ),
  ];

  if (
    opciones.vehiculo
  ) {
    rows.push(
      `Vehiculo: ${opciones.vehiculo}`,
    );
  }

  if (
    opciones.chofer
  ) {
    rows.push(
      `Chofer: ${opciones.chofer}`,
    );
  }

  rows.push(
    linea(),
  );

  venta.detalles.forEach(
    (
      detalle,
      index,
    ) => {
      rows.push(
        `Pasajero ${index + 1}`,
        nombrePasajero(
          venta,
          index,
        ),
      );

      if (
        detalle.pasajero?.ci
      ) {
        rows.push(
          `CI: ${detalle.pasajero.ci}`,
        );
      }

      rows.push(
        `Asiento: ${detalle.asiento.numero_asiento ?? detalle.asiento.id}`,
        `Precio: Bs ${money(detalle.precio_unitario)}`,
        linea(),
      );
    },
  );

  rows.push(
    `TOTAL: Bs ${money(venta.precio_total)}`,
    `Pago: ${venta.forma_pago ?? "-"}`,
    linea("="),
    "Gracias por viajar con nosotros",
  );

  return rows.join(
    "\n",
  );
}
