import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MotiView } from "moti";
import { Check } from "lucide-react-native";
import { useTheme } from "@/theme/useTheme";

interface Props {
  pasoActual: number;
  pasos?: string[];
  onStepPress?: (paso: number) => void;
  deshabilitado?: boolean;
}

const PASOS_DEFAULT = ["Buscar viaje", "Asientos", "Datos y pago"];

export function PasoStepper({
  pasoActual,
  pasos = PASOS_DEFAULT,
  onStepPress,
  deshabilitado = false,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.container}>
      {pasos.map((label, i) => {
        const numero = i + 1;
        const completado = numero < pasoActual;
        const activo = numero === pasoActual;

        const fondoCirculo = completado
          ? c.primary
          : activo
            ? c.primary
            : c.backgroundSecondary;
        const bordeCirculo = completado
          ? c.primary
          : activo
            ? c.primary
            : c.border;
        const colorTextoCirculo =
          completado || activo ? c.primaryForeground : c.textSecondary;
        const esActual = activo;
        const presionable =
          onStepPress !== undefined && !esActual && !deshabilitado;

        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <View
                style={[styles.conector, { backgroundColor: c.border }]}
              >
                <MotiView
                  from={{ width: "0%" }}
                  animate={{ width: numero <= pasoActual ? "100%" : "0%" }}
                  transition={{ type: "timing", duration: 400 }}
                  style={[styles.relleno, { backgroundColor: c.primary }]}
                />
              </View>
            )}
            <Pressable
              onPress={() => onStepPress?.(numero)}
              disabled={!presionable}
              accessibilityRole={presionable ? "button" : undefined}
              accessibilityLabel={`Ir al paso ${numero}: ${label}`}
              style={[styles.paso, deshabilitado && { opacity: 0.7 }]}
            >
              <MotiView
                animate={{
                  backgroundColor: fondoCirculo,
                  borderColor: bordeCirculo,
                  scale: activo ? 1.12 : 1,
                }}
                transition={{ type: "timing", duration: 300 }}
                style={styles.circulo}
              >
                <MotiView
                  key={completado ? "check" : "num"}
                  from={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "timing", duration: 250 }}
                >
                  {completado ? (
                    <Check size={15} color={colorTextoCirculo} />
                  ) : (
                    <Text
                      style={{
                        color: colorTextoCirculo,
                        fontWeight: "800",
                        fontSize: 13,
                      }}
                    >
                      {numero}
                    </Text>
                  )}
                </MotiView>
              </MotiView>
              <Text
                numberOfLines={1}
                style={[
                  styles.etiqueta,
                  {
                    color:
                      completado || activo ? c.text : c.textSecondary,
                    fontWeight: activo ? "800" : "600",
                    textDecorationLine: presionable ? "underline" : "none",
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingVertical: 4,
  },
  paso: {
    alignItems: "center",
    gap: 4,
    minWidth: 76,
  },
  circulo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  etiqueta: {
    fontSize: 11,
    textAlign: "center",
  },
  conector: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    marginTop: 13,
    marginHorizontal: 4,
    overflow: "hidden",
    maxWidth: 120,
  },
  relleno: {
    height: "100%",
    borderRadius: 2,
  },
});
