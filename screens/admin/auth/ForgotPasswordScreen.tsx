// screens/admin/auth/ForgotPasswordScreen.tsx

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  Button,
} from "@/components/ui/Button";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  router,
} from "expo-router";

import {
  ArrowLeft,
  CheckCircle2,
  Mail,
} from "lucide-react-native";

import React from "react";

import {
  Keyboard,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  KeyboardAwareScrollView,
} from "react-native-keyboard-aware-scroll-view";

import {
  AuthInput,
} from "./components/AuthInput";

import {
  GlassCard,
} from "./components/GlassCard";

import {
  SubmitButton,
} from "./components/SubmitButton";

import {
  useForgotPassword,
} from "./hooks/useForgotPassword";

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export default function ForgotPasswordScreen() {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const {
    email,

    normalizedEmail,

    errors,

    serverError,

    successMessage,

    submitting,

    canSubmit,

    handleEmailChange,

    handleSubmit,

    resetState,
  } =
    useForgotPassword();

  /*
  |--------------------------------------------------------------------------
  | ENVIAR
  |--------------------------------------------------------------------------
  */

  const submit =
    async () => {
      Keyboard.dismiss();

      await handleSubmit();
    };

  /*
  |--------------------------------------------------------------------------
  | IR A CÓDIGO
  |--------------------------------------------------------------------------
  */

  const goToResetPassword =
    () => {
      router.push({
        pathname:
          "/reset-password",

        params: {
          email:
            normalizedEmail,
        },
      });
    };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={
        styles.scrollContent
      }
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
    >
      <View
        style={[
          styles.screen,

          {
            backgroundColor:
              c.background,
          },
        ]}
      >
        <View
          style={
            styles.container
          }
        >
          <GlassCard>
            <View
              style={
                styles.content
              }
            >
              {/* ICON */}

              <View
                style={[
                  styles.iconContainer,

                  {
                    backgroundColor:
                      successMessage
                        ? `${c.success}18`
                        : c.primarySubtle,

                    borderColor:
                      successMessage
                        ? `${c.success}40`
                        : `${c.primary}35`,
                  },
                ]}
              >
                {successMessage ? (
                  <CheckCircle2
                    size={28}
                    color={
                      c.success
                    }
                  />
                ) : (
                  <Mail
                    size={28}
                    color={
                      c.primary
                    }
                  />
                )}
              </View>

              {/* HEADER */}

              <View
                style={
                  styles.header
                }
              >
                <ThemedText
                  style={
                    styles.title
                  }
                >
                  {successMessage
                    ? "Revisa tu correo"
                    : "Recuperar contraseña"}
                </ThemedText>

                <ThemedText
                  style={[
                    styles.subtitle,

                    {
                      color:
                        c.textSecondary,
                    },
                  ]}
                >
                  {successMessage
                    ? "Si la cuenta existe y está activa, enviamos un código de recuperación al correo indicado."
                    : "Ingresa el correo electrónico asociado a tu cuenta."}
                </ThemedText>
              </View>

              {!successMessage ? (
                <>
                  {/* EMAIL */}

                 <AuthInput
  label="CORREO ELECTRÓNICO"
  value={email}
  onChangeText={handleEmailChange}
  error={errors.email}
  autoCapitalize="none"
  keyboardType="email-address"
  maxLength={80}
  placeholder="correo@ejemplo.com"
  onSubmitEditing={submit}
/>

                  {/* ERROR */}

                  {!!serverError && (
                    <View
                      style={[
                        styles.errorBox,

                        {
                          backgroundColor:
                            `${c.destructive}12`,

                          borderColor:
                            `${c.destructive}40`,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.errorText,

                          {
                            color:
                              c.destructive,
                          },
                        ]}
                      >
                        {
                          serverError
                        }
                      </ThemedText>
                    </View>
                  )}

                  {/* SUBMIT */}

                  <SubmitButton
                    title="Enviar código"
                    onPress={
                      submit
                    }
                    loading={
                      submitting
                    }
                    disabled={
                      !canSubmit
                    }
                  />
                </>
              ) : (
                <>
                  {/* CORREO */}

                  <View
                    style={[
                      styles.emailBox,

                      {
                        backgroundColor:
                          c.backgroundSecondary,

                        borderColor:
                          c.border,
                      },
                    ]}
                  >
                    <Mail
                      size={18}
                      color={
                        c.textSecondary
                      }
                    />

                    <ThemedText
                      style={[
                        styles.emailText,

                        {
                          color:
                            c.text,
                        },
                      ]}
                    >
                      {
                        normalizedEmail
                      }
                    </ThemedText>
                  </View>

                  {/* CONTINUAR */}

                  <Button
                    title="Ingresar código"
                    onPress={
                      goToResetPassword
                    }
                  />

                  {/* REENVIAR */}

                  <Button
                    title="Enviar nuevamente"
                    variant="secondary"
                    onPress={() => {
                      resetState();

                      void handleSubmit();
                    }}
                  />
                </>
              )}

              {/* VOLVER */}

              <Pressable
                onPress={() =>
                  router.replace(
                    "/login",
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.backButton,

                  {
                    opacity:
                      pressed
                        ? 0.55
                        : 1,
                  },
                ]}
              >
                <ArrowLeft
                  size={17}
                  color={
                    c.textSecondary
                  }
                />

                <ThemedText
                  style={[
                    styles.backText,

                    {
                      color:
                        c.textSecondary,
                    },
                  ]}
                >
                  Volver al inicio de sesión
                </ThemedText>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

/*
|--------------------------------------------------------------------------
| ESTILOS
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    scrollContent: {
      flexGrow:
        1,
    },

    screen: {
      flex:
        1,

      minHeight:
        "100%",

      alignItems:
        "center",

      justifyContent:
        "center",

      padding:
        20,
    },

    container: {
      width:
        "100%",

      maxWidth:
        480,
    },

    content: {
      width:
        "100%",

      gap:
        20,
    },

    iconContainer: {
      width:
        58,

      height:
        58,

      borderRadius:
        18,

      borderWidth:
        1,

      alignSelf:
        "center",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    header: {
      alignItems:
        "center",

      gap:
        8,
    },

    title: {
      fontSize:
        27,

      fontWeight:
        "800",

      textAlign:
        "center",
    },

    subtitle: {
      fontSize:
        14,

      lineHeight:
        21,

      textAlign:
        "center",
    },

    errorBox: {
      borderWidth:
        1,

      borderRadius:
        10,

      padding:
        12,
    },

    errorText: {
      fontSize:
        12,

      lineHeight:
        18,

      textAlign:
        "center",
    },

    emailBox: {
      minHeight:
        48,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        9,

      borderWidth:
        1,

      borderRadius:
        12,

      paddingHorizontal:
        14,
    },

    emailText: {
      flexShrink:
        1,

      fontSize:
        13,

      fontWeight:
        "700",
    },

    backButton: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        7,

      paddingVertical:
        6,
    },

    backText: {
      fontSize:
        13,

      fontWeight:
        "600",
    },
  });