import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PressableAnimated } from "@/components/ui/PressableAnimated";
import { Copy, ChevronDown, ChevronUp } from "lucide-react-native";
import { DatosPasajero } from "../store/pasajesStore";

interface Props {
  titulo: string;
  asientoLabel: string;
  datos: DatosPasajero;
  onChange: (campo: keyof DatosPasajero, valor: string) => void;
  esPrincipal?: boolean;
  precio: number;
  onPrecioChange: (precio: number) => void;
  onTodosIguales: (precio: number) => void;
  onCopiarCampo?: (campo: keyof DatosPasajero, valor: string) => void;
  error?: string | null;
}

export function FormularioPasajero({
  titulo,
  asientoLabel,
  datos,
  onChange,
  esPrincipal,
  precio,
  onPrecioChange,
  onTodosIguales,
  onCopiarCampo,
  error,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false);

  const datosSeguros = datos ?? {
    nombres: "",
    apellido_paterno: "",
    apellido_materno: "",
    ci: "",
  };

  const renderCampoConCopiar = (
    campo: keyof DatosPasajero,
    label: string,
    placeholder: string,
    keyboardType?: "default" | "numeric",
  ) => (
    <View style={styles.campoRow}>
      <View style={styles.campoInput}>
        <Input
          label={label}
          value={datosSeguros[campo]}
          onChangeText={(v) => onChange(campo, v)}
          placeholder={placeholder}
          keyboardType={keyboardType}
        />
      </View>
      <PressableAnimated
        onPress={() => onCopiarCampo?.(campo, datosSeguros[campo] ?? "")}
        style={[
          styles.copiarBtn,
          { backgroundColor: c.primary, borderColor: c.primary },
        ]}
        accessibilityLabel={`Copiar ${label} a todos`}
      >
        <Copy size={16} color={c.primaryForeground} />
      </PressableAnimated>
    </View>
  );

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>
            {titulo}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            {asientoLabel}
          </Text>
        </View>
        {esPrincipal && <Badge label="Principal" variant="info" />}
      </View>

      <View style={styles.grid}>
        {renderCampoConCopiar("nombres", "Nombres", "Ej: Juan")}
        {renderCampoConCopiar(
          "apellido_paterno",
          "Apellido Paterno",
          "Ej: Pérez",
        )}

        <Pressable
          onPress={() => setMostrarAvanzado((v) => !v)}
          style={[
            styles.avanzadoToggle,
            { borderColor: c.inputBorder, backgroundColor: c.input },
          ]}
          accessibilityLabel="Mostrar datos avanzados"
        >
          <Text
            style={{ color: c.textSecondary, fontSize: 13, fontWeight: "700" }}
          >
            Avanzado
          </Text>
          {mostrarAvanzado ? (
            <ChevronUp size={16} color={c.textSecondary} />
          ) : (
            <ChevronDown size={16} color={c.textSecondary} />
          )}
        </Pressable>

        {mostrarAvanzado ? (
          <View style={styles.grid}>
            {renderCampoConCopiar(
              "apellido_materno",
              "Apellido Materno",
              "Ej: Flores",
            )}
            {renderCampoConCopiar("ci", "CI", "Ej: 1234567", "numeric")}
          </View>
        ) : null}
      </View>

      <View style={styles.precioContainer}>
        <Text style={{ color: c.text, fontWeight: "700" }}>
          Precio del pasaje
        </Text>
        <View style={styles.precioRow}>
          <View style={styles.precioInput}>
            <Text style={{ color: c.text, fontWeight: "700", fontSize: 14 }}>
              Bs.
            </Text>
            <View style={styles.precioField}>
              <Input
                value={String(precio)}
                onChangeText={(v) => {
                  const numero = parseFloat(v);
                  if (!isNaN(numero)) onPrecioChange(numero);
                }}
                keyboardType="numeric"
              />
            </View>
          </View>
          <PressableAnimated
            onPress={() => onTodosIguales(precio)}
            style={[
              styles.aplicarBtn,
              { backgroundColor: c.primary, borderColor: c.primary },
            ]}
            accessibilityLabel="Aplicar a todos"
          >
            <Copy size={16} color={c.primaryForeground} />
          </PressableAnimated>
        </View>
      </View>

      {error ? (
        <Text style={{ color: c.destructive, fontSize: 12, fontWeight: "700" }}>
          {error}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grid: {
    gap: 12,
  },
  campoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  campoInput: {
    flex: 1,
  },
  copiarBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    width: 44,
    height: 44,
    marginBottom: 1,
  },
  avanzadoToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  precioContainer: {
    gap: 8,
  },
  precioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  precioInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 2,
  },
  precioField: {
    flex: 1,
  },
  aplicarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
});
