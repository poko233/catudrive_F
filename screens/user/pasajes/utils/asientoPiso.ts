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
| NORMALIZAR NUMERACIÓN (igual que el modal de vehículo)
|--------------------------------------------------------------------------
|
| El backend numera TODAS las celdas (pasillo, conductor,
| no_disponible también consumen números). El modal de
| vehículo reenumera los pasajeros 1..N en orden
| fila-major para mostrar (limpiarPisosParaEdicion) —
| aquí se hace lo mismo al cargar, para que pasajes se
| vea idéntico al modal.
|
| Solo display: id/fila/columna intactos (la venta usa
| ids). Los no-pasajeros quedan con numero_asiento null.
|
*/

export function normalizarNumeracionPasajeros(
  asientos: Asiento[],
): Asiento[] {
  const pasajeros = asientos
    .filter((a) => a.tipo_celda === "pasajero")
    .sort((a, b) =>
      a.fila !== b.fila ? a.fila - b.fila : a.columna - b.columna,
    );

  const numeros = new Map<number, number>();
  pasajeros.forEach((a, i) => numeros.set(a.id, i + 1));

  return asientos.map((a) =>
    a.tipo_celda === "pasajero"
      ? { ...a, numero_asiento: numeros.get(a.id) ?? a.numero_asiento }
      : { ...a, numero_asiento: null },
  );
}

export function normalizarPisosNumeracion(pisos: Piso[]): Piso[] {
  return pisos.map((piso) => ({
    ...piso,
    asientos: normalizarNumeracionPasajeros(piso.asientos),
  }));
}
