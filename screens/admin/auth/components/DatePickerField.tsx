// screens/auth/components/DatePickerField.tsx
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../../theme/useTheme";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const MESES_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

// Convierte una fecha en formato ISO (YYYY-MM-DD) a un objeto Date
// pero lo fuerza a mediodía (12:00) en UTC para que al mostrarlo
// con getDate() etc. no haya desfase por la zona horaria.
function localDateFromIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  // Crear la fecha a las 12:00 UTC (mediodía) para evitar que getHours()
  // lleve a un día anterior por la diferencia de zona horaria
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

// Obtiene la fecha actual en Bolivia como string ISO (YYYY-MM-DD)
function todayInBoliviaIso(): string {
  // Usar el objeto Intl.DateTimeFormat con zona horaria explícita
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

// Formato corto para mostrar: "17 May 2026"
function fmtShort(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const monthIndex = parseInt(m) - 1;
  return `${parseInt(d)} ${MESES_SHORT[monthIndex]} ${y}`;
}

// Convierte año, mes, día a string ISO (YYYY-MM-DD)
function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Fecha mínima permitida (hace 150 años)
function minBirthDateIso(): string {
  const todayIso = todayInBoliviaIso();
  const [year, month, day] = todayIso.split("-").map(Number);
  const minYear = year - 150;
  return `${minYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface DatePickerFieldProps {
  value: string | null;
  onChange: (dateString: string) => void;
  error?: string;
  label: string;
}

// Extrae año, mes, día de una string ISO (YYYY-MM-DD)
function parseIso(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month: month - 1, day };
}

export const DatePickerField = ({
  value,
  onChange,
  error,
  label,
}: DatePickerFieldProps) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);

  // Inicializar desde la string ISO o desde la fecha actual en Bolivia
  const initDate = value ? parseIso(value) : parseIso(todayInBoliviaIso());

  const [viewYear, setViewYear] = useState(initDate.year);
  const [viewMonth, setViewMonth] = useState(initDate.month);
  const [tempDate, setTempDate] = useState<string>(value || "");
  const [showMonthGrid, setShowMonthGrid] = useState(false);
  const [editingYear, setEditingYear] = useState(false);
  const [yearInput, setYearInput] = useState(String(initDate.year));

  const todayIso = todayInBoliviaIso();
  const minDateIso = minBirthDateIso();

  function open() {
    // Inicializar tempDate desde la string ISO
    setTempDate(value || "");

    // Inicializar viewYear y viewMonth desde la string ISO
    const date = value ? parseIso(value) : parseIso(todayInBoliviaIso());
    setViewYear(date.year);
    setViewMonth(date.month);
    setYearInput(String(date.year));

    setShowMonthGrid(false);
    setEditingYear(false);
    setVisible(true);
  }

  function onDayPress(iso: string) {
    if (iso < minDateIso || iso > todayIso) return;
    setTempDate(iso);
    onChange(iso);
    setVisible(false);
  }

  function confirm() {
    if (tempDate) {
      onChange(tempDate);
    }
    setVisible(false);
  }

  function applyYear() {
    const y = parseInt(yearInput);
    const [minY] = minDateIso.split("-").map(Number);
    const [todayY] = todayIso.split("-").map(Number);
    if (!isNaN(y) && y >= minY && y <= todayY) {
      setViewYear(y);
    }
    setEditingYear(false);
  }

  // Calcular días del mes
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const firstDow = firstDayOfMonth.getDay(); // 0 = domingo
  // Convertir a lunes como primer día (0=lunes, 6=domingo)
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const totalCells = 42;
  const days: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - startOffset - daysInMonth).fill(null),
  ];

  function dayStyle(iso: string) {
    const isSelected = iso === tempDate;
    const isToday = iso === todayIso;
    const isOutOfRange = iso < minDateIso || iso > todayIso;
    if (isSelected)
      return {
        bg: theme.colors.primary,
        text: theme.colors.primaryForeground,
        radius: 20,
      };
    if (isToday)
      return { bg: "transparent", text: theme.colors.primary, radius: 20 };
    if (isOutOfRange)
      return {
        bg: "transparent",
        text: theme.colors.muted,
        radius: 8,
        disabled: true,
      };
    return { bg: "transparent", text: theme.colors.text, radius: 8 };
  }

  const selectedDisplay = value ? fmtShort(value) : "";

  return (
    <>
      <TouchableOpacity
        onPress={open}
        className="border rounded-xl bg-background-secondary px-4 py-3"
        style={{
          borderColor: error ? theme.colors.destructive : theme.colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={theme.colors.primary}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: value ? theme.colors.text : theme.colors.muted,
            }}
          >
            {value ? selectedDisplay : label}
          </Text>
        </View>
      </TouchableOpacity>
      {error ? (
        <Text
          style={{
            color: theme.colors.destructive,
            fontSize: 12,
            marginTop: 4,
            marginLeft: 8,
          }}
        >
          {error}
        </Text>
      ) : null}

      <Modal visible={visible} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.colors.card ?? theme.colors.background,
              borderRadius: 24,
              padding: 20,
              width: 350,
              elevation: 12,
            }}
            onPress={() => {}}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: theme.colors.text,
                }}
              >
                Seleccionar fecha
              </Text>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: theme.colors.backgroundSecondary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: theme.colors.muted, fontSize: 13 }}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* Fecha seleccionada */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
                backgroundColor: theme.colors.backgroundSecondary,
                borderRadius: 10,
                padding: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: tempDate ? theme.colors.primary : theme.colors.muted,
                }}
              >
                {tempDate ? fmtShort(tempDate) : "—"}
              </Text>
            </View>

            {/* Navegación mes/año */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  if (viewMonth === 0) {
                    setViewMonth(11);
                    setViewYear((y) => y - 1);
                  } else setViewMonth((m) => m - 1);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: theme.colors.backgroundSecondary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: theme.colors.primary, fontSize: 18 }}>
                  ‹
                </Text>
              </TouchableOpacity>

              <View
                style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
              >
                <TouchableOpacity
                  onPress={() => setShowMonthGrid(!showMonthGrid)}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: theme.colors.text,
                    }}
                  >
                    {MESES[viewMonth]}
                  </Text>
                </TouchableOpacity>
                {editingYear ? (
                  <TextInput
                    value={yearInput}
                    onChangeText={setYearInput}
                    onSubmitEditing={applyYear}
                    onBlur={applyYear}
                    keyboardType="numeric"
                    maxLength={4}
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: theme.colors.text,
                      borderBottomWidth: 1,
                      borderColor: theme.colors.primary,
                      paddingHorizontal: 4,
                      width: 60,
                      textAlign: "center",
                    }}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setEditingYear(true);
                      setYearInput(String(viewYear));
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: theme.colors.text,
                      }}
                    >
                      {viewYear}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (viewMonth === 11) {
                    setViewMonth(0);
                    setViewYear((y) => y + 1);
                  } else setViewMonth((m) => m + 1);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: theme.colors.backgroundSecondary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: theme.colors.primary, fontSize: 18 }}>
                  ›
                </Text>
              </TouchableOpacity>
            </View>

            {/* Grid de meses */}
            {showMonthGrid && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                {MESES.map((mes, idx) => (
                  <TouchableOpacity
                    key={mes}
                    onPress={() => {
                      setViewMonth(idx);
                      setShowMonthGrid(false);
                    }}
                    style={{
                      width: "25%",
                      paddingVertical: 8,
                      alignItems: "center",
                      backgroundColor:
                        idx === viewMonth
                          ? theme.colors.primary
                          : "transparent",
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color:
                          idx === viewMonth
                            ? theme.colors.primaryForeground
                            : theme.colors.text,
                      }}
                    >
                      {MESES_SHORT[idx]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Días de la semana */}
            <View style={{ flexDirection: "row", marginBottom: 4 }}>
              {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((d) => (
                <Text
                  key={d}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: 10,
                    fontWeight: "700",
                    color: theme.colors.muted,
                  }}
                >
                  {d}
                </Text>
              ))}
            </View>

            {/* Grid de días */}
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", minHeight: 216 }}
            >
              {days.map((day, i) => {
                if (!day)
                  return (
                    <View
                      key={`e-${i}`}
                      style={{ width: "14.28%", height: 36 }}
                    />
                  );
                const iso = toIso(viewYear, viewMonth, day);
                const s = dayStyle(iso);
                return (
                  <TouchableOpacity
                    key={iso}
                    onPress={() => onDayPress(iso)}
                    disabled={s.disabled}
                    style={{
                      width: "14.28%",
                      height: 36,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: s.radius,
                        backgroundColor: s.bg,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: s.radius === 20 ? "700" : "400",
                          color: s.text,
                        }}
                      >
                        {day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botones */}
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginTop: 16,
                paddingTop: 14,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
              }}
            >
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: theme.colors.border,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: theme.colors.muted, fontWeight: "600" }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirm}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: tempDate
                    ? theme.colors.primary
                    : theme.colors.border,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: tempDate
                      ? theme.colors.primaryForeground
                      : theme.colors.muted,
                    fontWeight: "700",
                  }}
                >
                  Aplicar
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};
