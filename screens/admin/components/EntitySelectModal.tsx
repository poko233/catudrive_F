import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../theme/useTheme";

interface EntitySelectModalProps<T> {
  visible: boolean;
  title: string;
  items: T[];
  selectedId: number | null;
  onClose: () => void;
  onSelect: (item: T) => void;
  getLabel: (item: T) => string;
  getSubtitle?: (item: T) => string | undefined;
  emptyText?: string;
  searchPlaceholder?: string;
}

export function EntitySelectModal<T extends { id: number }>({
  visible,
  title,
  items,
  selectedId,
  onClose,
  onSelect,
  getLabel,
  getSubtitle,
  emptyText = "No hay resultados",
  searchPlaceholder = "Buscar...",
}: EntitySelectModalProps<T>) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (visible) setQuery("");
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const label = getLabel(item).toLowerCase();
      const subtitle = getSubtitle?.(item)?.toLowerCase() ?? "";
      return label.includes(q) || subtitle.includes(q);
    });
  }, [getLabel, getSubtitle, items, query]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.center} pointerEvents="box-none">
        <View style={[styles.card, { backgroundColor: c.card }]}> 
          <View style={[styles.header, { borderBottomColor: c.border }]}> 
            <View>
              <Text style={[styles.title, { color: c.text }]}>{title}</Text>
              <Text style={[styles.sub, { color: c.textSecondary }]}>Selecciona un elemento</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.search, { backgroundColor: c.input, borderColor: c.border }]}> 
            <Ionicons name="search-outline" size={16} color={c.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={c.muted}
              style={[styles.searchInput, { color: c.text }]}
            />
          </View>

          <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
            {filtered.length === 0 ? (
              <View style={styles.empty}>
                <Text style={{ color: c.textSecondary }}>{emptyText}</Text>
              </View>
            ) : (
              filtered.map((item) => {
                const active = selectedId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => onSelect(item)}
                    style={[
                      styles.option,
                      {
                        borderColor: active ? c.primary : c.border,
                        backgroundColor: active ? "rgba(45,159,142,0.12)" : c.backgroundSecondary,
                      },
                    ]}
                  >
                    <View style={styles.optionText}>
                      <Text style={[styles.optionTitle, { color: c.text }]} numberOfLines={1}>
                        {getLabel(item)}
                      </Text>
                      {getSubtitle ? (
                        <Text style={[styles.optionSub, { color: c.textSecondary }]} numberOfLines={2}>
                          {getSubtitle(item)}
                        </Text>
                      ) : null}
                    </View>

                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color={c.primary} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={20} color={c.muted} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 18,
    borderBottomWidth: 1,
  },
  title: { fontSize: 16, fontWeight: "800" },
  sub: { fontSize: 12, marginTop: 4 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    margin: 16,
    marginBottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  list: {
    padding: 16,
    gap: 10,
  },
  empty: {
    paddingVertical: 24,
    alignItems: "center",
  },
  option: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  optionText: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  optionSub: {
    fontSize: 12,
    lineHeight: 16,
  },
});
