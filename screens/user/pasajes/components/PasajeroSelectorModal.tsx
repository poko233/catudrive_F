import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SearchBar } from "@/components/ui/SearchBar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import { UserRound } from "lucide-react-native";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { pasajeroService } from "../services/pasajero.service";
import type { Pasajero } from "../types/pasajes.types";
import { PasajeroFormModal } from "./PasajeroFormModal";

interface Props {
  visible: boolean;
  value: Pasajero | null;
  onClose: () => void;
  onSelect: (pasajero: Pasajero) => void;
}

export function PasajeroSelectorModal({
  visible,
  value,
  onClose,
  onSelect,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Pasajero[]>([]);
  const [loading, setLoading] = useState(false);
  const [nuevo, setNuevo] = useState(false);
  const requestSeq = useRef(0);

  const cargar = useCallback(async (query: string) => {
    const term = query.trim();
    const seq = ++requestSeq.current;

    if (term !== "" && term.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const result = await pasajeroService.buscar(term);

      if (seq === requestSeq.current) {
        setItems(result);
      }
    } catch (error: any) {
      if (seq === requestSeq.current) {
        Toast.show({
          type: "error",
          text1: "No se pudieron cargar pasajeros",
          text2: error?.message,
        });
      }
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      requestSeq.current++;
      setSearch("");
      return;
    }

    const timer =
      setTimeout(
        () => void cargar(search),
        350,
      );

    return () => clearTimeout(timer);
  }, [visible, search, cargar]);

  const emptyMessage =
    search.trim().length > 0 &&
    search.trim().length < 2
      ? "Escribe al menos 2 caracteres para buscar."
      : "No se encontraron pasajeros.";

  return (
    <>
      <Modal
        visible={visible}
        title="Seleccionar pasajero"
        onClose={onClose}
      >
        <View style={styles.body}>
          <View style={styles.top}>
            <View style={styles.search}>
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar por nombre, apellido o CI..."
              />
            </View>

            <Button
              title="+ Nuevo pasajero"
              onPress={() => setNuevo(true)}
            />
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={c.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              keyboardShouldPersistTaps="handled"
            >
              {items.length === 0 ? (
                <ThemedText
                  style={{
                    color: c.textSecondary,
                  }}
                >
                  {emptyMessage}
                </ThemedText>
              ) : (
                items.map((item) => {
                  const nombre =
                    item.nombre_completo ||
                    [
                      item.nombres,
                      item.apellido_paterno,
                      item.apellido_materno,
                    ]
                      .filter(Boolean)
                      .join(" ");

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        onSelect(item);
                        onClose();
                      }}
                      style={[
                        styles.item,
                        {
                          borderColor:
                            value?.id === item.id
                              ? c.primary
                              : c.border,

                          backgroundColor: c.card,
                        },
                      ]}
                    >
                      <UserRound
                        size={20}
                        color={c.primary}
                      />

                      <View style={styles.info}>
                        <ThemedText style={styles.name}>
                          {nombre}
                        </ThemedText>

                        <ThemedText
                          style={{
                            color: c.textSecondary,
                          }}
                        >
                          CI: {item.ci || "—"}
                          {typeof item.viajes_count === "number"
                            ? ` · ${item.viajes_count} viaje${item.viajes_count === 1 ? "" : "s"}`
                            : ""}
                        </ThemedText>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      <PasajeroFormModal
        visible={nuevo}
        onClose={() => setNuevo(false)}
        onCreated={(pasajero) => {
          setNuevo(false);
          onSelect(pasajero);
          onClose();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 12,
  },

  top: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },

  search: {
    flex: 1,
    minWidth: 250,
  },

  list: {
    maxHeight: 430,
  },

  loading: {
    padding: 30,
    alignItems: "center",
  },

  item: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 8,
  },

  info: {
    flex: 1,
  },

  name: {
    fontWeight: "800",
  },
});
