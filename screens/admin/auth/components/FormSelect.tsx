import { ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ThemedText } from "../../../../components/ThemedText";
import { useTheme } from "../../../../theme/useTheme";

interface Option {
  label: string;
  value: string;
}

interface FormSelectProps {
  label: string;
  value: string;
  options: Option[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = "Seleccionar...",
  error,
  required,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.label, { color: c.text }]}>
        {label}{" "}
        {required && (
          <ThemedText style={{ color: c.destructive }}>*</ThemedText>
        )}
      </ThemedText>

      <Pressable
        style={[
          styles.inputContainer,
          {
            backgroundColor: c.background,
            borderColor: error ? c.destructive : c.border,
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <ThemedText
          style={{ flex: 1, color: selectedOption ? c.text : c.muted }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </ThemedText>
        <ChevronDown size={20} color={c.muted} />
      </Pressable>

      {error && (
        <ThemedText style={[styles.errorText, { color: c.destructive }]}>
          {error}
        </ThemedText>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
              <ThemedText style={[styles.modalTitle, { color: c.text }]}>
                Seleccionar {label}
              </ThemedText>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {options.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={({ pressed }) => [
                    styles.optionItem,
                    {
                      backgroundColor:
                        value === opt.value
                          ? c.primary + "15"
                          : pressed
                            ? c.backgroundSecondary
                            : "transparent",
                    },
                  ]}
                  onPress={() => {
                    onSelect(opt.value);
                    setModalVisible(false);
                  }}
                >
                  <ThemedText
                    style={{
                      color: value === opt.value ? c.primary : c.text,
                      fontWeight: value === opt.value ? "600" : "400",
                    }}
                  >
                    {opt.label}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "70%",
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    overflow: "hidden",
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  scrollView: {
    paddingVertical: 8,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
});
