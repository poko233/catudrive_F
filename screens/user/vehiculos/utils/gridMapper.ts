import type { Piso, Asiento, TipoCelda } from "../types/vehiculo.types";

export const TIPOS_CELDA: { type: TipoCelda; label: string; icon: string }[] = [
  { type: "pasajero", label: "Asiento Pasajero", icon: "chair" },
  {
    type: "conductor",
    label: "Asiento Conductor",
    icon: "airline-seat-recline-normal",
  },
  { type: "escaleras", label: "Escaleras", icon: "stairs" },
  { type: "no_disponible", label: "No Disponible / Mueble", icon: "block" },
  { type: "pasillo", label: "Pasillo (Vacío)", icon: "" },
];

export function crearPisoVacio(
  numero: number,
  filas: number,
  columnas: number,
): Piso {
  const asientos: Asiento[] = [];
  for (let f = 1; f <= filas; f++) {
    for (let c = 1; c <= columnas; c++) {
      asientos.push({
        fila: f,
        columna: c,
        tipo_celda: "pasillo",
        numero_asiento: null,
        estado: "Activo",
      });
    }
  }
  return {
    numero,
    nombre: `Piso ${numero}`,
    filas,
    columnas,
    orden: numero,
    estado: "Activo",
    asientos,
  };
}

export function cambiarDimensionPiso(
  piso: Piso,
  nuevasFilas: number,
  nuevasColumnas: number,
): Piso {
  const nuevosAsientos: Asiento[] = [];
  for (let f = 1; f <= nuevasFilas; f++) {
    for (let c = 1; c <= nuevasColumnas; c++) {
      const existente = piso.asientos.find(
        (a) => a.fila === f && a.columna === c,
      );
      if (existente) {
        nuevosAsientos.push(existente);
      } else {
        nuevosAsientos.push({
          fila: f,
          columna: c,
          tipo_celda: "pasillo",
          numero_asiento: null,
          estado: "Activo",
        });
      }
    }
  }
  return {
    ...piso,
    filas: nuevasFilas,
    columnas: nuevasColumnas,
    asientos: nuevosAsientos,
  };
}

export function actualizarCelda(
  piso: Piso,
  fila: number,
  columna: number,
  cambios: Partial<Asiento>,
): Piso {
  return {
    ...piso,
    asientos: piso.asientos.map((a) =>
      a.fila === fila && a.columna === columna ? { ...a, ...cambios } : a,
    ),
  };
}

export function calcularCapacidad(pisos: Piso[]): number {
  return pisos.reduce((total, piso) => {
    if (piso.estado !== "Activo") return total;
    return (
      total +
      piso.asientos.filter(
        (a) => a.estado === "Activo" && a.tipo_celda === "pasajero",
      ).length
    );
  }, 0);
}
export function normalizarPiso(piso: Piso): Piso {
  const mapa = new Map<string, Asiento>();

  // Conservamos el asiento más reciente (mayor id) por posición
  for (const asiento of piso.asientos) {
    const clave = `${asiento.fila}-${asiento.columna}`;
    const existente = mapa.get(clave);
    if (!existente || (asiento.id ?? 0) > (existente.id ?? 0)) {
      mapa.set(clave, asiento);
    }
  }

  const asientosNormalizados: Asiento[] = [];
  for (let fila = 1; fila <= piso.filas; fila++) {
    for (let columna = 1; columna <= piso.columnas; columna++) {
      const existente = mapa.get(`${fila}-${columna}`);
      if (existente) {
        asientosNormalizados.push(existente);
      } else {
        asientosNormalizados.push({
          fila,
          columna,
          tipo_celda: "pasillo",
          numero_asiento: null,
          estado: "Activo",
        });
      }
    }
  }

  return {
    ...piso,
    asientos: asientosNormalizados,
  };
}

export function siguienteNumeroPasajero(piso: Piso): number {
  let max = 0;
  for (const asiento of piso.asientos) {
    if (asiento.tipo_celda === "pasajero" && asiento.numero_asiento != null) {
      if (asiento.numero_asiento > max) {
        max = asiento.numero_asiento;
      }
    }
  }
  return max + 1;
}
export function limpiarPisosParaEdicion(pisos: Piso[]): Piso[] {
  return pisos
    .filter((piso) => piso.estado === "Activo") // solo activos
    .map((piso) => {
      const pisoNormalizado = normalizarPiso(piso); // elimina duplicados
      /*
      |--------------------------------------------------------------------------
      | COBERTURA COMPLETA DE CELDAS
      |--------------------------------------------------------------------------
      |
      | NO se filtran los asientos inactivos: cada celda necesita
      | una entrada para renderizarse y ser tapeable en la grilla.
      | Sin esto las posiciones sin entrada quedan invisibles y
      | no se pueden editar (además la validación exige
      | filas × columnas asientos). Solo se reenumeran los
      | pasajeros activos.
      |
      */
      let contador = 1;
      const asientosReenumerados = pisoNormalizado.asientos.map((asiento) => {
        if (
          asiento.tipo_celda === "pasajero" &&
          asiento.estado === "Activo"
        ) {
          return { ...asiento, numero_asiento: contador++ };
        }
        return asiento;
      });
      return {
        ...pisoNormalizado,
        asientos: asientosReenumerados,
      };
    });
}
