// screens/user/pasajes/utils/asientoPiso.ts

import type { Asiento, Piso } from "../types/pasajes.types";

/*
|--------------------------------------------------------------------------
| PISO DEL ASIENTO
|--------------------------------------------------------------------------
|
| El endpoint de asientos no trae el piso dentro de cada
| asiento: el piso vive en la estructura Piso[] (numero,
| nombre + asientos). Este helper resuelve a qué piso
| pertenece un asiento para mostrarlo en etiquetas,
| resúmenes y modales (la numeración 1-2-3 se repite
| por piso y sin el piso es ambigua).
|
*/

export function pisoDeAsiento(
  pisos: Piso[],
  asientoId: number,
): Piso | undefined {
  for (const piso of pisos) {
    if (piso.asientos.some((a) => a.id === asientoId)) return piso;
  }
  return undefined;
}

/** "Piso 1" (corto para etiquetas). */
export function nombreCortoPiso(piso: Piso | undefined): string | null {
  if (!piso) return null;
  if (typeof piso.numero === "number") return `Piso ${piso.numero}`;
  return piso.nombre || null;
}

/** "P1 · Asiento 5" (corto para filas y tickets). */
export function etiquetaCortaAsiento(
  asiento: { id: number; numero_asiento: number | null },
  piso?: Piso,
): string {
  const base = `Asiento ${asiento.numero_asiento ?? asiento.id}`;
  const nombre = piso ? nombreCortoPiso(piso) : null;
  if (!nombre) return base;
  const corto = nombre.replace("Piso ", "P");
  return `${corto} - ${base}`;
}

/** "Asiento 5 - Piso 1" (etiqueta principal con piso). */
export function etiquetaAsiento(
  asiento: { id: number; numero_asiento: number | null },
  piso?: Piso,
): string {
  const base = `Asiento ${asiento.numero_asiento ?? asiento.id}`;
  const nombre = piso ? nombreCortoPiso(piso) : null;
  return nombre ? `${base} - ${nombre}` : base;
}

/** "Fila 2 · Piso 1" (detalle de posición con piso). */
export function detalleFilaAsiento(
  asiento: { fila: number },
  piso?: Piso,
): string {
  const base = `Fila ${asiento.fila}`;
  const nombre = piso ? nombreCortoPiso(piso) : null;
  return nombre ? `${base} - ${nombre}` : base;
}

/*
|--------------------------------------------------------------------------
| ORDEN POSICIONAL (auditoría punto 5)
|--------------------------------------------------------------------------
|
| La numeración se respeta TAL CUAL la envía el backend
| (incluye la personalizada del módulo de vehículos).
| Solo se ordena por (fila, columna) porque el endpoint
| devuelve los asientos en orden arbitrario (ej. f2c5
| primero) y sin orden las columnas salen mezcladas.
| Solo orden: ids, números y datos intactos.
|
*/

export function ordenarPisosPosicional(pisos: Piso[]): Piso[] {
  return pisos.map((piso) => {
    const ordenados = piso.asientos.slice().sort((a, b) =>
      a.fila !== b.fila ? a.fila - b.fila : a.columna - b.columna,
    );

    return { ...piso, asientos: ordenados };
  });
}
