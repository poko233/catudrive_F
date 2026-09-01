// utils/semesterHelpers.ts
export interface SemesterOption {
  label: string; // "Semestre 1", "Semestre 2", ...
  value: number; // índice secuencial: 1, 2, 3...
}

/**
 * Devuelve los semestres secuenciales (1,2,3...) que abarcan las cuotas,
 * basándose en la cantidad total de cuotas mensuales (tipo MENSUAL) y cuotas_por_anio.
 * Asume que las cuotas están ordenadas por fecha.
 */
export function getSequentialSemestersFromCuotas(
  cuotas: any[],
  cuotasPorAnio: number,
): SemesterOption[] {
  const mensuales = cuotas.filter((c) => c.tipo === "MENSUAL");
  if (mensuales.length === 0) return [];

  const totalMensuales = mensuales.length;
  const cuotasPorSemestre = cuotasPorAnio / 2; // ej. 12/2 = 6 cuotas por semestre
  const totalSemestres = Math.ceil(totalMensuales / cuotasPorSemestre);

  return Array.from({ length: totalSemestres }, (_, i) => ({
    label: `Semestre ${i + 1}`,
    value: i + 1,
  }));
}

/**
 * Filtra las cuotas según el semestre secuencial.
 * @param cuotas Lista de cuotas (debe contener las mensuales)
 * @param semesterNumber Número de semestre (1, 2, ...)
 * @param cuotasPorAnio Cuotas por año (para saber cuántas por semestre)
 */
export function filterCuotasBySequentialSemester(
  cuotas: any[],
  semesterNumber: number,
  cuotasPorAnio: number,
): any[] {
  const mensuales = cuotas.filter((c) => c.tipo === "MENSUAL");
  if (mensuales.length === 0) return [];

  const cuotasPorSemestre = cuotasPorAnio / 2;
  const start = (semesterNumber - 1) * cuotasPorSemestre;
  const end = start + cuotasPorSemestre;

  // Obtenemos los IDs de las cuotas mensuales que caen en ese rango
  const mensualesEnSemestre = mensuales.slice(start, end);
  const mensualesIds = new Set(mensualesEnSemestre.map((c) => c.idCuota));

  // Devolvemos todas las cuotas (incluyendo matrículas) que estén en ese semestre
  // Por simplicidad, devolvemos las mensuales más las matrículas que tengan fecha dentro del rango de fechas del semestre
  // Pero como las matrículas tienen fechas distribuidas, podemos filtrarlas por fecha (rango de inicio y fin del semestre)
  if (mensualesEnSemestre.length === 0) return [];

  const primeraFecha = mensualesEnSemestre[0].fecha_vencimiento;
  const ultimaFecha =
    mensualesEnSemestre[mensualesEnSemestre.length - 1].fecha_vencimiento;

  return cuotas.filter((c) => {
    if (c.tipo === "MENSUAL") return mensualesIds.has(c.idCuota);
    // Para matrículas, si su fecha está dentro del rango del semestre, se incluye
    if (c.tipo === "MATRICULA" && c.fecha_vencimiento) {
      return (
        c.fecha_vencimiento >= primeraFecha &&
        c.fecha_vencimiento <= ultimaFecha
      );
    }
    return false;
  });
}
