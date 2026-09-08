// components/ui/SelectRich.tsx
// Selector enriquecado: cada opción muestra un título, subtítulo, icono,
// badge y una lista de pares clave/valor en formato de grilla.
// No modifica components/ui/Select.tsx; es un componente complementario
// reutilizable por cualquier desarrollador.

import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { SearchBar } from "@/components/ui/SearchBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTheme } from "@/theme/useTheme";
import { Check, ChevronDown, Search, Tags, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

export type RichSelectValue = string | number;

export interface RichSelectField {
  label: string;
  value: string | number | null;
  accent?: boolean;
}

export interface RichSelectOption<T extends RichSelectValue = RichSelectValue> {
  value: T;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  iconColor?: string;
  badge?: { label: string; variant: BadgeVariant };
  fields: RichSelectField[];
  disabled?: boolean;
}

interface RichSelectProps<T extends RichSelectValue = RichSelectValue> {
  label?: string;
  value?: T;
  options: RichSelectOption<T>[];
  onValueChange: (value: T) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  modalTitle?: string;
  emptyText?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}

/*
|--------------------------------------------------------------------------
| SELECT RICH
|--------------------------------------------------------------------------
*/

export function SelectRich<T extends RichSelectValue = RichSelectValue>({
  label,
  value,
  options,
  onValueChange,
  placeholder = "Seleccione una opción",
  searchable = false,
  searchPlaceholder = "Buscar...",
  modalTitle = "Seleccione una opción",
  emptyText = "No existen opciones disponibles.",
  error,
  disabled = false,
  loading = false,
  accessibilityLabel,
}: RichSelectProps<T>) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return options;

    return options.filter((option) => {
      const titleMatch = option.title.toLowerCase().includes(normalized);
      const subtitleMatch =
        option.subtitle?.toLowerCase().includes(normalized) ?? false;
      const fieldMatch = option.fields.some(
        (f) =>
          (f.value !== null &&
            String(f.value).toLowerCase().includes(normalized)) ||
          f.label.toLowerCase().includes(normalized),
      );
      return titleMatch || subtitleMatch || fieldMatch;
    });
  }, [options, search]);

  const handleOpen = () => {
    if (disabled || loading) return;
    setSearch("");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSearch("");
  };

  const handleSelect = (option: RichSelectOption<T>) => {
    if (option.disabled) return;
    onValueChange(option.value);
    handleClose();
  };

  const borderColor = error ? c.destructive : open ? c.primary : c.inputBorder;

  return (
    <View style={styles.wrapper}>
      {/* LABEL */}
      {label ? (
        <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      ) : null}

      {/* TRIGGER */}
      <Pressable
        onPress={handleOpen}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
        accessibilityState={{ disabled: disabled || loading, expanded: open }}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: c.input,
            borderColor,
            opacity: disabled ? 0.55 : pressed ? 0.85 : 1,
          },
        ]}
      >
        {selectedOption?.icon ? (
          <View
            style={[
              styles.triggerIcon,
              {
                backgroundColor: selectedOption.iconColor ?? c.primarySubtle,
              },
            ]}
          >
            <selectedOption.icon
              size={18}
              color={selectedOption.iconColor ?? c.primary}
              strokeWidth={2.2}
            />
          </View>
        ) : (
          <View
            style={[
              styles.triggerIcon,
              { backgroundColor: c.backgroundSecondary },
            ]}
          >
            <Tags size={16} color={c.textSecondary} strokeWidth={2} />
          </View>
        )}

        <View style={styles.triggerText}>
          {loading && !value ? (
            <Skeleton width="70%" height={14} />
          ) : (
            <>
              <View style={styles.triggerTitleRow}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.valueText,
                    { color: selectedOption ? c.text : c.textMuted },
                  ]}
                >
                  {selectedOption ? selectedOption.title : placeholder}
                </Text>
              </View>
              {selectedOption?.subtitle ? (
                <Text
                  numberOfLines={1}
                  style={[styles.selectedSubtitle, { color: c.textSecondary }]}
                >
                  {selectedOption.subtitle}
                </Text>
              ) : null}
            </>
          )}
        </View>

        {/* 👇 NUEVA UBICACIÓN DEL BADGE 👇 */}
        {selectedOption?.badge ? (
          <Badge
            label={selectedOption.badge.label}
            variant={selectedOption.badge.variant}
            style={{ alignSelf: "center" }}
          />
        ) : null}

        {/* Contenedor de la flecha */}
        <View
          style={[
            styles.chevronContainer,
            { backgroundColor: open ? c.primarySubtle : c.backgroundSecondary },
          ]}
        >
          <ChevronDown
            size={18}
            color={open ? c.primary : c.textSecondary}
            strokeWidth={2}
          />
        </View>
      </Pressable>

      {/* ERROR */}
      {error ? (
        <Text style={[styles.helper, { color: c.destructive }]}>{error}</Text>
      ) : null}

      {/* MODAL */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={[StyleSheet.absoluteFill, styles.backdrop]}
            onPress={handleClose}
            accessibilityLabel="Cerrar selector"
          />

          <View
            style={[
              styles.panel,
              { backgroundColor: c.popover, borderColor: c.border },
            ]}
          >
            {/* HEADER */}
            <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
              <View style={styles.modalHeaderText}>
                <Text style={[styles.modalTitle, { color: c.text }]}>
                  {modalTitle}
                </Text>
                <Text
                  style={[styles.modalSubtitle, { color: c.textSecondary }]}
                >
                  {options.length}{" "}
                  {options.length === 1 ? "opción" : "opciones"}
                </Text>
              </View>
              <Pressable
                onPress={handleClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                style={({ pressed }) => [
                  styles.closeButton,
                  {
                    backgroundColor: c.backgroundSecondary,
                    opacity: pressed ? 0.65 : 1,
                  },
                ]}
              >
                <X size={18} color={c.textSecondary} />
              </Pressable>
            </View>

            {/* SEARCH */}
            {searchable ? (
              <View style={styles.searchWrapper}>
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  placeholder={searchPlaceholder}
                />
              </View>
            ) : null}

            {/* LISTA */}
            <ScrollView
              style={styles.optionsList}
              contentContainerStyle={styles.optionsContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const selected = option.value === value;
                  const isLast = index === filteredOptions.length - 1;

                  return (
                    <Pressable
                      key={String(option.value)}
                      disabled={option.disabled}
                      onPress={() => handleSelect(option)}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected,
                        disabled: option.disabled,
                      }}
                      style={({ pressed }) => [
                        styles.option,
                        {
                          backgroundColor: selected
                            ? c.primarySubtle
                            : pressed
                              ? c.input
                              : c.backgroundSecondary,
                          borderColor: selected ? c.primary : c.border,
                          opacity: option.disabled ? 0.45 : 1,
                          marginBottom: isLast ? 0 : 10,
                        },
                      ]}
                    >
                      {/* ACENTO IZQUIERDO */}
                      <View
                        style={[
                          styles.optionAccent,
                          {
                            backgroundColor: selected
                              ? c.primary
                              : "transparent",
                          },
                        ]}
                      />

                      {/* ICONO */}
                      <View
                        style={[
                          styles.optionIcon,
                          {
                            backgroundColor:
                              option.iconColor ?? c.primarySubtle,
                          },
                        ]}
                      >
                        {option.icon ? (
                          <option.icon
                            size={20}
                            color={option.iconColor ?? c.primary}
                            strokeWidth={2.2}
                          />
                        ) : (
                          <Tags size={18} color={c.primary} strokeWidth={2} />
                        )}
                      </View>

                      {/* CONTENIDO */}
                      <View style={styles.optionBody}>
                        <View style={styles.optionHeader}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.optionTitle,
                              { color: selected ? c.primary : c.text },
                            ]}
                          >
                            {option.title}
                          </Text>
                          {option.badge ? (
                            <Badge
                              label={option.badge.label}
                              variant={option.badge.variant}
                              style={{ alignSelf: "center" }}
                            />
                          ) : null}
                        </View>

                        {option.subtitle ? (
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.optionSubtitle,
                              { color: c.textSecondary },
                            ]}
                          >
                            {option.subtitle}
                          </Text>
                        ) : null}

                        {/* GRILLA CLAVE/VALOR */}
                        {option.fields.length > 0 ? (
                          <View style={styles.fieldsGrid}>
                            {option.fields.map((field, idx) => (
                              <View
                                key={`${field.label}-${idx}`}
                                style={styles.fieldCell}
                              >
                                <Text
                                  style={[
                                    styles.fieldLabel,
                                    { color: c.textMuted },
                                  ]}
                                >
                                  {field.label}
                                </Text>
                                <Text
                                  numberOfLines={1}
                                  style={[
                                    styles.fieldValue,
                                    {
                                      color: field.accent
                                        ? c.primary
                                        : c.textSecondary,
                                    },
                                  ]}
                                >
                                  {field.value ?? "—"}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>

                      {/* CHECK */}
                      {selected ? (
                        <View
                          style={[
                            styles.checkContainer,
                            { backgroundColor: c.primary },
                          ]}
                        >
                          <Check
                            size={15}
                            strokeWidth={2.5}
                            color={c.primaryForeground}
                          />
                        </View>
                      ) : (
                        <View style={styles.checkPlaceholder} />
                      )}
                    </Pressable>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <View
                    style={[
                      styles.emptyIcon,
                      { backgroundColor: c.backgroundSecondary },
                    ]}
                  >
                    <Search size={24} color={c.textMuted} />
                  </View>
                  <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                    {emptyText}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| ESTILOS
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  wrapper: { width: "100%" },

  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },

  trigger: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 8,
    gap: 10,
  },

  triggerIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  triggerText: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  triggerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  valueText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "600",
  },

  selectedSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },

  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  helper: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },

  modalRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.52)",
  },

  panel: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "82%",
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
    elevation: 20,
  },

  modalHeader: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    gap: 12,
  },

  modalHeaderText: { flex: 1 },

  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  searchWrapper: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  optionsList: { maxHeight: 420 },

  optionsContent: { padding: 16 },

  option: {
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 12,
    gap: 12,
    overflow: "hidden",
  },

  optionAccent: {
    position: "absolute",
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 999,
  },

  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },

  optionBody: {
    flex: 1,
    minWidth: 0,
  },

  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  optionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },

  optionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  fieldsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
    marginTop: 8,
  },

  fieldCell: {
    width: "50%",
    paddingRight: 8,
    marginBottom: 5,
  },

  fieldLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  fieldValue: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 1,
  },

  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },

  checkPlaceholder: {
    width: 28,
    height: 28,
    flexShrink: 0,
  },

  emptyContainer: {
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
  },

  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
});
