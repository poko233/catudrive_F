import React, {
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";

import { useTheme } from "@/theme/useTheme";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PressableAnimated } from "@/components/ui/PressableAnimated";

import {
  ChevronDown,
  ChevronUp,
  Copy,
  UserRound,
} from "lucide-react-native";

import { DatosPasajero } from "../store/pasajesStore";
import type { Pasajero } from "../types/pasajes.types";
import { PasajeroSelectorModal } from "./PasajeroSelectorModal";

interface Props {
  titulo: string;
  asientoLabel: string;
  datos: DatosPasajero;

  onChange: (
    campo: keyof DatosPasajero,
    valor: string | number | null,
  ) => void;

  esPrincipal?: boolean;
  precio: number;
  onPrecioChange: (precio: number) => void;
  onTodosIguales: (precio: number) => void;

  onCopiarCampo?: (
    campo: keyof DatosPasajero,
    valor: string,
  ) => void;

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
  const [selectorVisible, setSelectorVisible] = useState(false);

  const datosSeguros =
    datos ?? {
      id_pasajero: null,
      nombres: "",
      apellido_paterno: "",
      apellido_materno: "",
      ci: "",
    };

  const pasajeroSeleccionado =
    useMemo<Pasajero | null>(
      () => {
        if (!datosSeguros.id_pasajero) {
          return null;
        }

        const nombreCompleto =
          [
            datosSeguros.nombres,
            datosSeguros.apellido_paterno,
            datosSeguros.apellido_materno,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();

        return {
          id: datosSeguros.id_pasajero,
          nombres: datosSeguros.nombres,
          apellido_paterno: datosSeguros.apellido_paterno,
          apellido_materno: datosSeguros.apellido_materno || null,
          ci: datosSeguros.ci || null,
          nombre_completo: nombreCompleto,
        };
      },
      [
        datosSeguros.id_pasajero,
        datosSeguros.nombres,
        datosSeguros.apellido_paterno,
        datosSeguros.apellido_materno,
        datosSeguros.ci,
      ],
    );

  const seleccionarPasajero = (pasajero: Pasajero) => {
    onChange("id_pasajero", pasajero.id);
    onChange("nombres", pasajero.nombres ?? "");
    onChange(
      "apellido_paterno",
      pasajero.apellido_paterno ?? "",
    );
    onChange(
      "apellido_materno",
      pasajero.apellido_materno ?? "",
    );
    onChange("ci", pasajero.ci ?? "");
  };

  const cambiarCampo = (
    campo: keyof DatosPasajero,
    valor: string,
  ) => {
    if (
      campo !== "id_pasajero" &&
      datosSeguros.id_pasajero !== null
    ) {
      onChange("id_pasajero", null);
    }

    onChange(campo, valor);
  };

  const renderCampoConCopiar = (
    campo: keyof DatosPasajero,
    label: string,
    placeholder: string,
    keyboardType?: "default" | "numeric",
  ) => {
    if (campo === "id_pasajero") {
      return null;
    }

    const valor =
      String(
        datosSeguros[campo] ?? "",
      );

    return (
      <View style={styles.campoRow}>
        <View style={styles.campoInput}>
          <Input
            label={label}
            value={valor}
            onChangeText={(v) =>
              cambiarCampo(
                campo,
                v,
              )
            }
            placeholder={placeholder}
            keyboardType={keyboardType}
          />
        </View>

        <PressableAnimated
          onPress={() =>
            onCopiarCampo?.(
              campo,
              valor,
            )
          }
          style={[
            styles.copiarBtn,
            {
              backgroundColor: c.primary,
              borderColor: c.primary,
            },
          ]}
          accessibilityLabel={`Copiar ${label} a todos`}
        >
          <Copy
            size={16}
            color={c.primaryForeground}
          />
        </PressableAnimated>
      </View>
    );
  };

  return (
    <>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text
              style={{
                color: c.text,
                fontSize: 16,
                fontWeight: "800",
              }}
            >
              {titulo}
            </Text>

            <Text
              style={{
                color: c.textSecondary,
                fontSize: 12,
              }}
            >
              {asientoLabel}
            </Text>
          </View>

          <View style={styles.badges}>
            {datosSeguros.id_pasajero ? (
              <Badge
                label="Registrado"
                variant="success"
              />
            ) : null}

            {esPrincipal ? (
              <Badge
                label="Principal"
                variant="info"
              />
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={() => setSelectorVisible(true)}
          style={[
            styles.selector,
            {
              borderColor:
                datosSeguros.id_pasajero
                  ? c.primary
                  : c.inputBorder,
              backgroundColor: c.input,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Buscar pasajero registrado"
        >
          <View style={styles.selectorLeft}>
            <UserRound
              size={18}
              color={c.primary}
            />

            <View style={styles.selectorText}>
              <Text
                style={{
                  color:
                    datosSeguros.id_pasajero
                      ? c.text
                      : c.textSecondary,
                  fontWeight: "700",
                }}
                numberOfLines={1}
              >
                {datosSeguros.id_pasajero
                  ? [
                      datosSeguros.nombres,
                      datosSeguros.apellido_paterno,
                      datosSeguros.apellido_materno,
                    ]
                      .filter(Boolean)
                      .join(" ")
                  : "Buscar pasajero registrado..."}
              </Text>

              {datosSeguros.id_pasajero ? (
                <Text
                  style={{
                    color: c.textSecondary,
                    fontSize: 11,
                  }}
                >
                  CI: {datosSeguros.ci || "—"}
                </Text>
              ) : null}
            </View>
          </View>

          <Text
            style={{
              color: c.primary,
              fontSize: 20,
              fontWeight: "900",
            }}
          >
            +
          </Text>
        </Pressable>

        <View style={styles.grid}>
          {renderCampoConCopiar(
            "nombres",
            "Nombres",
            "Ej: Juan, David, FLIA.",
          )}

          {renderCampoConCopiar(
            "apellido_paterno",
            "Primer Apellido",
            "Ej: Pérez",
          )}

          <Pressable
            onPress={() =>
              setMostrarAvanzado((v) => !v)
            }
            style={[
              styles.avanzadoToggle,
              {
                borderColor: c.inputBorder,
                backgroundColor: c.input,
              },
            ]}
            accessibilityLabel="Mostrar datos avanzados"
          >
            <Text
              style={{
                color: c.textSecondary,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              Avanzado
            </Text>

            {mostrarAvanzado ? (
              <ChevronUp
                size={16}
                color={c.textSecondary}
              />
            ) : (
              <ChevronDown
                size={16}
                color={c.textSecondary}
              />
            )}
          </Pressable>

          {mostrarAvanzado ? (
            <View style={styles.grid}>
              {renderCampoConCopiar(
                "apellido_materno",
                "Segundo Apellido",
                "Ej: Flores",
              )}

              {renderCampoConCopiar(
                "ci",
                "CI",
                "Ej: 1234567",
                "numeric",
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.precioContainer}>
          <Text
            style={{
              color: c.text,
              fontWeight: "700",
            }}
          >
            Precio del pasaje
          </Text>

          <View style={styles.precioRow}>
            <View style={styles.precioInput}>
              <Text
                style={{
                  color: c.text,
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                Bs.
              </Text>

              <View style={styles.precioField}>
                <Input
                  value={String(precio)}
                  onChangeText={(v) => {
                    const numero = parseFloat(v);

                    if (!isNaN(numero)) {
                      onPrecioChange(numero);
                    }
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <PressableAnimated
              onPress={() =>
                onTodosIguales(precio)
              }
              style={[
                styles.aplicarBtn,
                {
                  backgroundColor: c.primary,
                  borderColor: c.primary,
                },
              ]}
              accessibilityLabel="Aplicar a todos"
            >
              <Copy
                size={16}
                color={c.primaryForeground}
              />
            </PressableAnimated>
          </View>
        </View>

        {error ? (
          <Text
            style={{
              color: c.destructive,
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            {error}
          </Text>
        ) : null}
      </Card>

      <PasajeroSelectorModal
        visible={selectorVisible}
        value={pasajeroSeleccionado}
        onClose={() => setSelectorVisible(false)}
        onSelect={seleccionarPasajero}
      />
    </>
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
    gap: 8,
  },

  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  selector: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  selectorLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  selectorText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
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
