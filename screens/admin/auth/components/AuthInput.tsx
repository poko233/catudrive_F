/* eslint-disable react/display-name */
// screens/auth/components/AuthInput.tsx
import { Eye, EyeOff } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../../../theme/useTheme";
import { errorShakeAnimation } from "../animations/auth.animations";

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: (e?: any) => void;
  onFocus?: (e?: any) => void;
  error?: string;
  secureTextEntry?: boolean;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words";
  maxLength?: number;
  icon?: React.ReactNode;
  passwordVisible?: boolean;
  onTogglePasswordVisibility?: () => void;
  rightLabel?: React.ReactNode;
  onSubmitEditing?: () => void; // ← NUEVO
}

export const AuthInput = React.memo(
  ({
    label,
    value,
    onChangeText,
    onBlur,
    onFocus,
    error,
    secureTextEntry = false,
    placeholder,
    keyboardType = "default",
    autoCapitalize = "none",
    maxLength,
    icon,
    passwordVisible,
    onTogglePasswordVisibility,
    rightLabel,
    onSubmitEditing, // ← NUEVO
  }: AuthInputProps) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [internalVisible, setInternalVisible] = useState(false);

    const showPassword =
      passwordVisible !== undefined ? passwordVisible : internalVisible;

    const handleTogglePassword = () => {
      if (onTogglePasswordVisibility) {
        onTogglePasswordVisibility();
      } else {
        setInternalVisible(!internalVisible);
      }
    };

    const borderColorProgress = useSharedValue(0);
    const translateX = useSharedValue(0);

    useEffect(() => {
      if (error) {
        borderColorProgress.value = withTiming(2, { duration: 200 });
        errorShakeAnimation(translateX);
      } else if (isFocused) {
        borderColorProgress.value = withTiming(1, { duration: 200 });
      } else {
        borderColorProgress.value = withTiming(0, { duration: 200 });
      }
    }, [error, isFocused, borderColorProgress, translateX]);

    const handleFocus = useCallback(
      (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus],
    );

    const handleBlur = useCallback(
      (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur],
    );

    const borderStyle = useAnimatedStyle(() => {
      const borderColor = interpolateColor(
        borderColorProgress.value,
        [0, 1, 2],
        [theme.colors.border, theme.colors.primary, theme.colors.destructive],
      );
      return {
        borderColor,
        transform: [{ translateX: translateX.value }],
      };
    });

    const effectiveSecure = secureTextEntry && !showPassword;

    return (
      <View style={{ marginBottom: 0, width: "100%" }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            paddingHorizontal: 4,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: theme.dark ? theme.colors.muted : theme.colors.text,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {label}
          </Text>
          {rightLabel && <View>{rightLabel}</View>}
        </View>

        <Animated.View
          style={[
            borderStyle,
            {
              borderWidth: 1,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              height: 52,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
            },
          ]}
        >
          {icon && <View style={{ marginRight: 12 }}>{icon}</View>}
          <TextInput
            style={{
              flex: 1,
              fontSize: 14,
              color: theme.colors.text,
              borderWidth: 0,
              backgroundColor: "transparent",
              height: "100%",
              // @ts-ignore
              outline: "none",
            }}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={effectiveSecure}
            placeholder={placeholder}
            placeholderTextColor={
              theme.dark ? theme.colors.muted : theme.colors.text
            }
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            maxLength={maxLength}
            onSubmitEditing={onSubmitEditing} // ← NUEVO
            returnKeyType="send" // ← Tecla "Ir" o "Enviar"
          />
          {secureTextEntry && (
            <TouchableOpacity
              onPress={handleTogglePassword}
              style={{ paddingLeft: 12 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
                <EyeOff
                  size={20}
                  color={theme.dark ? theme.colors.muted : theme.colors.text}
                />
              ) : (
                <Eye
                  size={20}
                  color={theme.dark ? theme.colors.muted : theme.colors.text}
                />
              )}
            </TouchableOpacity>
          )}
        </Animated.View>

        {error ? (
          <Text
            style={{
              color: theme.colors.destructive,
              fontSize: 12,
              marginTop: 4,
              marginLeft: 4,
            }}
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);
