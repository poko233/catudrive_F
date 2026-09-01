// Extrae solo la parte de fecha (YYYY-MM-DD) de un ISO string completo
function extractDatePart(isoString: string): string {
  if (!isoString) return "";
  // Si contiene "T", extrae la parte antes de la T
  return isoString.split("T")[0];
}

// Formato DIA/MES/AÑO (sin hora)
export function formatDateToDDMMYYYY(
  isoString: string | null | undefined,
): string {
  if (!isoString) return "—";
  const datePart = extractDatePart(isoString);
  const [year, month, day] = datePart.split("-");
  return `${day}/${month}/${year}`;
}

// Formato DIA/MES/AÑO HH:MM (con hora)
export function formatDateTimeToDD_MM_YYYY_HH_MM(
  isoString: string | null | undefined,
): string {
  if (!isoString) return "—";
  const [datePart, timePart] = isoString.split("T");
  const [year, month, day] = datePart.split("-");

  if (!timePart) return `${day}/${month}/${year}`;

  // Extrae HH:MM de timePart (por si viene con Z o con segundos)
  const timeWithoutZ = timePart.replace("Z", "");
  const [hours, minutes] = timeWithoutZ.split(":");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Versión que acepta también Date o timestamp, pero prefiere ISO string
export function formatDisplayDate(
  date: string | Date | null | undefined,
): string {
  if (!date) return "—";
  let iso = "";
  if (typeof date === "string") {
    iso = date;
  } else if (date instanceof Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    iso = `${y}-${m}-${d}`;
  }
  if (!iso) return "—";
  const datePart = extractDatePart(iso);
  const [year, month, day] = datePart.split("-");
  return `${day}/${month}/${year}`;
}
