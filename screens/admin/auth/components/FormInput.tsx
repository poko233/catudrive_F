import { Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { ThemedText } from "../../../../components/ThemedText";
import { useTheme } from "../../../../theme/useTheme";

interface FormInputProps extends TextInputProps {
  label: string;
  icon?: any;
  error?: string;
  required?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  icon: Icon,
  error,
  required,
  secureTextEntry,
  multiline,
  ...props
}) => {
  const { theme } = useTheme();
  const c = theme.colors;

  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isSecureText = secureTextEntry && !isPasswordVisible;

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.label, { color: c.text }]}>
        {label}{" "}
        {required && (
          <ThemedText style={{ color: c.destructive }}>*</ThemedText>
        )}
      </ThemedText>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: c.background,
            borderColor: error
              ? c.destructive
              : isFocused
                ? c.primary
                : c.border,
          },
          // Si es multilínea, cambiamos la alineación a flex-start y quitamos el height fijo
          multiline && {
            height: "auto",
            minHeight: 50,
            paddingVertical: 4,
            alignItems: "flex-start",
          },
        ]}
      >
        {/* Icono con ajuste de margen para que quede alineado a la primera línea del texto */}
        {Icon && (
          <Icon
            size={20}
            color={isFocused ? c.primary : c.muted}
            style={[styles.icon, multiline && { marginTop: 12 }]}
          />
        )}

        <TextInput
          multiline={multiline}
          style={[
            styles.input,
            { color: c.text },
            Platform.OS === "web" && ({ outlineStyle: "none" } as any),
            // AQUÍ ESTÁ LA MAGIA: padding vertical para que el texto no esté pegado arriba
            multiline && {
              height: "auto",
              paddingVertical: 10,
              textAlignVertical: "top",
            },
          ]}
          placeholderTextColor={c.muted}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          secureTextEntry={isSecureText}
          {...props}
        />

        {secureTextEntry && (
          <Pressable
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
          >
            {isPasswordVisible ? (
              <Eye size={20} color={c.muted} />
            ) : (
              <EyeOff size={20} color={c.muted} />
            )}
          </Pressable>
        )}
      </View>

      {error && (
        <ThemedText style={[styles.errorText, { color: c.destructive }]}>
          {error}
        </ThemedText>
      )}
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
    overflow: "hidden",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    borderWidth: 0,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
