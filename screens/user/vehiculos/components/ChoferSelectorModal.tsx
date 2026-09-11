import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Modal } from "@/components/ui/Modal";
import { SearchBar } from "@/components/ui/SearchBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/theme/useTheme";
import { buscarChoferes, getChoferesActivos } from "../services/chofer.service";
import type { ChoferBusqueda } from "../types/vehiculo.types";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (chofer: ChoferBusqueda | null) => void;
  selectedChoferId?: number | null;
};

/*
|--------------------------------------------------------------------------
| FILA DE CHOFER
|--------------------------------------------------------------------------
|
| Subcomponente con su propio estado pressed y estilos 100%
| estáticos (sin callbacks de Pressable): render determinista
| en Android nativo. Mismo patrón que components/ui/Select.tsx
| (SelectOptionRow).
|
*/

function ChoferRow({
  item,
  isSelected,
  onSelect,
}: {
  item: ChoferBusqueda;
  isSelected: boolean;
  onSelect: (chofer: ChoferBusqueda) => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={() => onSelect(item)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      style={[
        styles.item,
        {
          backgroundColor: isSelected
            ? c.primarySubtle
            : c.backgroundSecondary,
          borderColor: isSelected ? c.primary : c.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <ThemedText style={{ fontWeight: "800" }}>
          {item.nombre_completo}
        </ThemedText>
        <View style={styles.metaRow}>
          {item.ci ? (
            <Badge label={item.ci} variant="muted" size="sm" />
          ) : null}
          {item.carnet_sindical ? (
            <Badge
              label={item.carnet_sindical}
              variant="info"
              size="sm"
            />
          ) : null}
        </View>
      </View>
      {isSelected && (
        <ThemedText style={{ color: c.primary, fontWeight: "900" }}>
          ✓
        </ThemedText>
      )}
    </Pressable>
  );
}

export function ChoferSelectorModal({
  visible,
  onClose,
  onSelect,
  selectedChoferId,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [search, setSearch] = useState("");
  const [choferes, setChoferes] = useState<ChoferBusqueda[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;

    setLoading(true);
    getChoferesActivos()
      .then((data) => {
        setChoferes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const term = search.trim();
      if (!term) {
        getChoferesActivos()
          .then(setChoferes)
          .catch(() => {});
      } else {
        setLoading(true);
        buscarChoferes(term)
          .then((data) => {
            setChoferes(data);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
    }, 350);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [search, visible]);

  const handleSelect = (chofer: ChoferBusqueda) => {
    onSelect(chofer);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      title="Seleccionar propietario"
      onClose={onClose}
      width="90%"
      maxWidth={560}
      footer={
        <View style={styles.footer}>
          <Button title="Cancelar" variant="secondary" onPress={onClose} />
        </View>
      }
    >
      <View style={styles.content}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, CI o carnet sindical..."
        />
        {loading ? (
          <ActivityIndicator color={c.primary} style={{ marginTop: 16 }} />
        ) : choferes.length === 0 ? (
          <ThemedText
            style={{ textAlign: "center", color: c.textSecondary }}
          >
            No se encontraron choferes.
          </ThemedText>
        ) : (
          <View style={styles.lista}>
            {choferes.map((item) => (
              <ChoferRow
                key={String(item.id)}
                item={item}
                isSelected={item.id === selectedChoferId}
                onSelect={handleSelect}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 8,
    flex: 1,
  },
  lista: {
    marginTop: 8,
    gap: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
});
