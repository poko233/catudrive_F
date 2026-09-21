// screens/admin/arqueo/components/MovimientoComprobantePrint.tsx

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Egreso, Ingreso } from "../types/arqueo.types";
import { num } from "../types/arqueo.types";

/*
|--------------------------------------------------------------------------
| PREVIEW GENÉRICO DEL COMPROBANTE (children de ReportPrintModal)
|--------------------------------------------------------------------------
|
| Solo usa los datos que ya trae la fila (sin fetch extra).
| El HTML exacto a imprimir lo devuelve el endpoint
| /comprobante y va directo a la ventana nueva.
|
| Hoja blanca fija → colores fijos, sin theme.
|
*/

export type MovComprobante = Ingreso | Egreso;

function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function nombreUsuario(mov: MovComprobante): string {
  const u = mov.user as {
    usuario?: string;
    nombres?: string | null;
    primer_apellido?: string | null;
  } | null | undefined;
  if (u && typeof u === "object") {
    const full = `${u.nombres ?? ""} ${u.primer_apellido ?? ""}`.trim();
    if (u.usuario && full) return `${u.usuario} · ${full}`;
    if (u.usuario) return u.usuario;
    if (full) return full;
  }
  return `Usuario #${mov.id_user}`;
}

export function MovimientoComprobantePreview({
  kind,
  mov,
}: {
  kind: "ingreso" | "egreso";
  mov: MovComprobante;
}) {
  const esIngreso = kind === "ingreso";
  const acento = esIngreso ? "#1e7a3a" : "#a02020";
  const tipo = mov.tipo_transaccion;

  return (
    <View style={p.hoja}>
      <Text style={p.titulo}>{esIngreso ? "COMPROBANTE DE INGRESO" : "COMPROBANTE DE EGRESO"}</Text>
      <Text style={p.sub}>CatuDrive · Movimiento de caja · #{mov.id}</Text>

      <View style={[p.montoBox, { borderColor: acento }]}>
        <Text style={p.montoLabel}>MONTO REGISTRADO</Text>
        <Text style={[p.montoValue, { color: acento }]}>Bs {num(mov.monto).toFixed(2)}</Text>
      </View>

      <Fila label="Fecha" value={fechaCorta(mov.fecha_registro)} />
      <Fila label="Tipo de pago" value={mov.tipo_pago} />
      <Fila label="Tipo" value={tipo ? `${tipo.codigo} — ${tipo.transaccion}` : `Tipo #${mov.id_tipo_transaccion}`} />
      <Fila label="Estado" value={mov.estado} />
      <Fila label="Usuario" value={nombreUsuario(mov)} />
      <Fila label="Arqueo" value={`#${mov.id_arqueo}`} />

      <Text style={p.detalleLabel}>DETALLE</Text>
      <Text style={p.detalle}>{mov.detalle || "-"}</Text>
    </View>
  );
}

function Fila({ label, value }: { label: string; value: string }) {
  return (
    <View style={p.fila}>
      <Text style={p.filaLabel}>{label}</Text>
      <Text style={p.filaValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const p = StyleSheet.create({
  hoja: { gap: 6 },
  titulo: { fontSize: 16, fontWeight: "900", color: "#111" },
  sub: { fontSize: 10, color: "#555", marginBottom: 6 },
  montoBox: { borderWidth: 2, borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 8 },
  montoLabel: { fontSize: 9, color: "#555", letterSpacing: 1 },
  montoValue: { fontSize: 26, fontWeight: "900", marginTop: 4 },
  fila: { flexDirection: "row", gap: 8, borderBottomWidth: 1, borderBottomColor: "#e5e5e5", paddingVertical: 5 },
  filaLabel: { width: 90, fontSize: 10, fontWeight: "800", color: "#555" },
  filaValue: { flex: 1, fontSize: 11, color: "#111" },
  detalleLabel: { fontSize: 9, fontWeight: "800", color: "#555", letterSpacing: 0.5, marginTop: 8 },
  detalle: { fontSize: 11, color: "#111", borderWidth: 1, borderColor: "#cfcfcf", borderRadius: 8, padding: 10, minHeight: 50 },
});
