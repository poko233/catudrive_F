// screens/user/pasajes/components/ResumenVenta.tsx

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { Badge } from "@/components/ui/Badge";
import type { DatosPasajero } from "../store/pasajesStore";
import type { Asiento, Piso, Viaje } from "../types/pasajes.types";
import {
  detalleFilaAsiento,
  pisoDeAsiento,
} from "../utils/asientoPiso";

/*
|--------------------------------------------------------------------------
| REVISAR VENTA (paso Confirmación, espejo de encomiendas)
|--------------------------------------------------------------------------
|
| Pantalla de confirmación con todos los datos antes de
| pagar: viaje, pasajeros con asiento/piso/CI/precio,
| método de pago y total. Web y app.
|
*/

const METODO_LABEL: Record<string, string> = {
  qr: "QR",
  tarjeta: "Tarjeta",
  efectivo: "Efectivo",
};

interface Props {
  viaje: Viaje | null;
  asientos: Asiento[];
  pasajeros: DatosPasajero[];
  precios: { [asientoId: number]: number };
  pisos?: Piso[];
  metodoPago: string;
}

export function ResumenVenta({
  viaje,
  asientos,
  pasajeros,
  precios,
  pisos = [],
  metodoPago,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  if (!viaje) return null;

  const precioDe = (asientoId: number) =>
    precios[asientoId] ?? parseFloat(viaje.tarifa ?? "0");

  const total = asientos.reduce((sum, a) => sum + precioDe(a.id), 0);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>
          Revisar venta
        </Text>

        <Badge label={`${asientos.length} pasajes`} variant="info" />
      </View>

      <View style={styles.section}>
        <Row label="Ruta" value={`${viaje.origen} → ${viaje.destino}`} />
        <Row
          label="Salida"
          value={new Date(viaje.hora_salida).toLocaleString("es-BO", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        />
        <Row label="Vehículo" value={viaje.vehiculo || "—"} />
        <Row label="Chofer" value={viaje.chofer || "—"} />
      </View>

      <Divider spacing={8} />

      <View style={styles.tableHeader}>
        <Text style={[styles.head, styles.colDetalle, { color: c.textSecondary }]}>
          Pasajero
        </Text>
        <Text style={[styles.head, styles.colCant, { color: c.textSecondary }]}>
          Asiento
        </Text>
        <Text style={[styles.head, styles.colMoney, { color: c.textSecondary }]}>
          P/U
        </Text>
        <Text style={[styles.head, styles.colMoney, { color: c.textSecondary }]}>
          Subtotal
        </Text>
      </View>

      {asientos.map((asiento, index) => {
        const pasajero = pasajeros[index];
        const nombre = pasajero
          ? `${pasajero.nombres} ${pasajero.apellido_paterno}`.trim() ||
            `Pasajero ${index + 1}`
          : `Pasajero ${index + 1}`;
        const piso = pisoDeAsiento(pisos, asiento.id);
        const precio = precioDe(asiento.id);

        return (
          <View key={asiento.id} style={styles.item}>
            <View style={styles.colDetalle}>
              <Text
                style={[styles.itemName, { color: c.text }]}
                numberOfLines={2}
              >
                {nombre}
              </Text>

              <Text style={[styles.itemSub, { color: c.textSecondary }]}>
                {pasajero?.ci ? `CI: ${pasajero.ci}` : "Sin CI"}
              </Text>
            </View>

            <View style={styles.colCant}>
              <Text style={[styles.cell, { color: c.text, textAlign: "center" }]}>
                {`Nº ${asiento.numero_asiento ?? asiento.id}`}
              </Text>

              <Text
                style={{ color: c.textSecondary, fontSize: 10, textAlign: "center" }}
              >
                {detalleFilaAsiento(asiento, piso)}
              </Text>
            </View>

            <Text style={[styles.cell, styles.colMoney, { color: c.text }]}>
              Bs. {precio.toFixed(2)}
            </Text>

            <Text style={[styles.cellBold, styles.colMoney, { color: c.text }]}>
              Bs. {precio.toFixed(2)}
            </Text>
          </View>
        );
      })}

      <Divider spacing={8} />

      <Row label="Cantidad" value={`${asientos.length}`} />
      <Row label="Método de pago" value={METODO_LABEL[metodoPago] ?? metodoPago} />

      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: c.text }]}>TOTAL</Text>
        <Text style={[styles.totalValue, { color: c.primary }]}>
          Bs. {total.toFixed(2)}
        </Text>
      </View>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: c.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "900",
  },

  section: {
    gap: 4,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 0,
  },

  value: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
  },

  tableHeader: {
    flexDirection: "row",
    gap: 6,
  },

  head: {
    fontSize: 10,
    fontWeight: "900",
  },

  colDetalle: {
    flex: 1.55,
    minWidth: 0,
  },

  colCant: {
    width: 64,
    textAlign: "center",
  },

  colMoney: {
    width: 72,
    textAlign: "right",
  },

  item: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
    paddingVertical: 6,
  },

  itemName: {
    fontSize: 12,
    fontWeight: "700",
  },

  itemSub: {
    fontSize: 11,
    marginTop: 2,
  },

  cell: {
    fontSize: 12,
  },

  cellBold: {
    fontSize: 12,
    fontWeight: "800",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: "900",
  },

  totalValue: {
    fontSize: 20,
    fontWeight: "900",
  },
});
