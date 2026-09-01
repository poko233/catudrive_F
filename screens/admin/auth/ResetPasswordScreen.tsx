// screens/admin/auth/ResetPasswordScreen.tsx

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
  useLocalSearchParams,
} from "expo-router";

import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react-native";

import React, {
  useMemo,
  useState,
} from "react";

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
  VerificationCodeInput,
} from "./components/VerificationCodeInput";

import {
  useResetPassword,
} from "./hooks/useResetPassword";

/*
|--------------------------------------------------------------------------
| PARAM
|--------------------------------------------------------------------------
*/

function getParam(
  value:
    | string
    | string[]
    | undefined,
): string {
  if (
    Array.isArray(
      value,
    )
  ) {
    return (
      value[0] ??
      ""
    );
  }

  return (
    value ??
    ""
  );
}

/*
|--------------------------------------------------------------------------
| PASSWORD RULE
|--------------------------------------------------------------------------
*/

interface PasswordRuleProps {
  valid: boolean;

  text: string;
}

function PasswordRule({
  valid,
  text,
}: PasswordRuleProps) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  return (
    <View
      style={
        styles.ruleRow
      }
    >
      {valid ? (
        <CheckCircle2
          size={16}
          color={
            c.success
          }
          strokeWidth={2.3}
        />
      ) : (
        <Circle
          size={16}
          color={
            c.textSecondary
          }
          strokeWidth={1.7}
        />
      )}

      <ThemedText
        style={[
          styles.ruleText,

          {
            color:
              valid
                ? c.success
                : c.textSecondary,

            fontWeight:
              valid
                ? "700"
                : "500",
          },
        ]}
      >
        {text}
      </ThemedText>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export default function ResetPasswordScreen() {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  /*
  |--------------------------------------------------------------------------
  | EMAIL
  |--------------------------------------------------------------------------
  */

  const params =
    useLocalSearchParams<{
      email?:
        | string
        | string[];
    }>();

  const initialEmail =
    useMemo(
      () =>
        getParam(
          params.email,
        ),
      [
        params.email,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | PASSWORD VISIBILITY
  |--------------------------------------------------------------------------
  */

  const [
    passwordVisible,
    setPasswordVisible,
  ] =
    useState(false);

  const [
    confirmationVisible,
    setConfirmationVisible,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | HOOK
  |--------------------------------------------------------------------------
  */

  const {
    phase,

    form,

    errors,

    serverError,

    successMessage,

    verifying,

    submitting,

    canVerify,

    canReset,

    handleChange,

    verifyCode,

    resetPassword,

    returnToCode,
  } =
    useResetPassword(
      initialEmail,
    );

  /*
  |--------------------------------------------------------------------------
  | VALIDACIONES VISUALES DE CONTRASEÑA
  |--------------------------------------------------------------------------
  */

  const passwordChecks =
    useMemo(
      () => ({
        /*
         * Mínimo 8 caracteres.
         */
        minLength:
          form.password.length >=
          8,

        /*
         * Al menos una letra.
         */
        hasLetter:
          /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(
            form.password,
          ),

        /*
         * Al menos un número.
         */
        hasNumber:
          /\d/.test(
            form.password,
          ),

        /*
         * Sin espacios.
         *
         * Requerimos además que exista
         * al menos un carácter para no
         * mostrarlo como válido estando vacío.
         */
        noSpaces:
          form.password.length >
            0 &&
          !/\s/.test(
            form.password,
          ),

        /*
         * Confirmación.
         */
        matches:
          form
            .passwordConfirmation
            .length >
            0 &&
          form.password ===
            form.passwordConfirmation,
      }),
      [
        form.password,
        form.passwordConfirmation,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | TODAS LAS REGLAS PRINCIPALES
  |--------------------------------------------------------------------------
  */

  const allPasswordRulesValid =
    passwordChecks.minLength &&
    passwordChecks.hasLetter &&
    passwordChecks.hasNumber &&
    passwordChecks.noSpaces;

  /*
  |--------------------------------------------------------------------------
  | VERIFY
  |--------------------------------------------------------------------------
  */

  const handleVerify =
    async () => {
      Keyboard.dismiss();

      await verifyCode();
    };

  /*
  |--------------------------------------------------------------------------
  | RESET
  |--------------------------------------------------------------------------
  */

  const handleReset =
    async () => {
      Keyboard.dismiss();

      await resetPassword();
    };

  /*
  |--------------------------------------------------------------------------
  | TEXTOS
  |--------------------------------------------------------------------------
  */

  const title =
    phase ===
      "code"
      ? "Verifica tu código"
      : phase ===
          "password"
        ? "Nueva contraseña"
        : "Contraseña actualizada";

  const subtitle =
    phase ===
      "code"
      ? "Ingresa el código de 6 dígitos que enviamos a tu correo."
      : phase ===
          "password"
        ? "Código verificado. Ahora crea una nueva contraseña para tu cuenta."
        : "Tu contraseña fue restablecida correctamente.";

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

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
              {/* ================================================= */}
              {/* ICON */}
              {/* ================================================= */}

              <View
                style={[
                  styles.iconContainer,

                  {
                    backgroundColor:
                      phase ===
                      "success"
                        ? `${c.success}18`
                        : c.primarySubtle,

                    borderColor:
                      phase ===
                      "success"
                        ? `${c.success}40`
                        : `${c.primary}35`,
                  },
                ]}
              >
                {phase ===
                "code" ? (
                  <ShieldCheck
                    size={28}
                    color={
                      c.primary
                    }
                  />
                ) : phase ===
                  "password" ? (
                  <LockKeyhole
                    size={28}
                    color={
                      c.primary
                    }
                  />
                ) : (
                  <CheckCircle2
                    size={30}
                    color={
                      c.success
                    }
                  />
                )}
              </View>

              {/* ================================================= */}
              {/* HEADER */}
              {/* ================================================= */}

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
                  {title}
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
                  {subtitle}
                </ThemedText>
              </View>

              {/* ================================================= */}
              {/* FASE 1 - CÓDIGO */}
              {/* ================================================= */}

              {phase ===
                "code" && (
                <>
                  {/* EMAIL */}

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
                      numberOfLines={
                        1
                      }
                    >
                      {
                        form.email
                      }
                    </ThemedText>
                  </View>

                  {/* ================================================= */}
                  {/* CÓDIGO */}
                  {/* ================================================= */}

                  <View
                    style={
                      styles.codeSection
                    }
                  >
                    <ThemedText
                      style={[
                        styles.codeLabel,

                        {
                          color:
                            c.textSecondary,
                        },
                      ]}
                    >
                      CÓDIGO DE RECUPERACIÓN
                    </ThemedText>

                    <VerificationCodeInput
                      value={
                        form.code
                      }
                      onChangeText={
                        handleChange(
                          "code",
                        )
                      }
                      error={
                        errors.code
                      }
                      disabled={
                        verifying
                      }
                      length={6}
                    />
                  </View>

                  {/* INFO */}

                  <View
                    style={[
                      styles.infoBox,

                      {
                        backgroundColor:
                          c.backgroundSecondary,

                        borderColor:
                          c.border,
                      },
                    ]}
                  >
                    <KeyRound
                      size={18}
                      color={
                        c.textSecondary
                      }
                    />

                    <ThemedText
                      style={[
                        styles.infoText,

                        {
                          color:
                            c.textSecondary,
                        },
                      ]}
                    >
                      El código es válido por unos minutos y solo puede utilizarse una vez.
                    </ThemedText>
                  </View>

                  {/* ERROR BACKEND */}

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

                  {/* VALIDAR */}

                  <SubmitButton
                    title="Validar código"
                    onPress={
                      handleVerify
                    }
                    loading={
                      verifying
                    }
                    disabled={
                      !canVerify
                    }
                  />

                  {/* SOLICITAR NUEVO */}

                  <Button
                    title="Solicitar otro código"
                    variant="secondary"
                    disabled={
                      verifying
                    }
                    onPress={() =>
                      router.replace({
                        pathname:
                          "/forgot-password",

                        params: {
                          email:
                            form.email,
                        },
                      })
                    }
                  />
                </>
              )}

              {/* ================================================= */}
              {/* FASE 2 - PASSWORD */}
              {/* ================================================= */}

              {phase ===
                "password" && (
                <>
                  {/* VERIFIED */}

                  <View
                    style={[
                      styles.verifiedBox,

                      {
                        backgroundColor:
                          `${c.success}12`,

                        borderColor:
                          `${c.success}40`,
                      },
                    ]}
                  >
                    <CheckCircle2
                      size={18}
                      color={
                        c.success
                      }
                    />

                    <ThemedText
                      style={[
                        styles.verifiedText,

                        {
                          color:
                            c.success,
                        },
                      ]}
                    >
                      Código verificado correctamente
                    </ThemedText>
                  </View>

                  {/* ================================================= */}
                  {/* PASSWORD */}
                  {/* ================================================= */}

                  <AuthInput
                    label="NUEVA CONTRASEÑA"
                    value={
                      form.password
                    }
                    onChangeText={
                      handleChange(
                        "password",
                      )
                    }
                    error={
                      errors.password
                    }
                    secureTextEntry
                    autoCapitalize="none"
                    maxLength={128}
                    placeholder="••••••••"
                    passwordVisible={
                      passwordVisible
                    }
                    onTogglePasswordVisibility={() =>
                      setPasswordVisible(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                  />

                  {/* ================================================= */}
                  {/* CONFIRMAR PASSWORD */}
                  {/* ================================================= */}

                  <AuthInput
                    label="CONFIRMAR CONTRASEÑA"
                    value={
                      form.passwordConfirmation
                    }
                    onChangeText={
                      handleChange(
                        "passwordConfirmation",
                      )
                    }
                    error={
                      errors.passwordConfirmation
                    }
                    secureTextEntry
                    autoCapitalize="none"
                    maxLength={128}
                    placeholder="••••••••"
                    passwordVisible={
                      confirmationVisible
                    }
                    onTogglePasswordVisibility={() =>
                      setConfirmationVisible(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    onSubmitEditing={
                      handleReset
                    }
                  />

                  {/* ================================================= */}
                  {/* REGLAS EN TIEMPO REAL */}
                  {/* ================================================= */}

                  <View
                    style={[
                      styles.rules,

                      {
                        backgroundColor:
                          allPasswordRulesValid
                            ? `${c.success}0D`
                            : c.backgroundSecondary,

                        borderColor:
                          allPasswordRulesValid
                            ? `${c.success}55`
                            : c.border,
                      },
                    ]}
                  >
                    <View
                      style={
                        styles.rulesHeader
                      }
                    >
                      {allPasswordRulesValid ? (
                        <CheckCircle2
                          size={17}
                          color={
                            c.success
                          }
                        />
                      ) : (
                        <LockKeyhole
                          size={17}
                          color={
                            c.textSecondary
                          }
                        />
                      )}

                      <ThemedText
                        style={[
                          styles.rulesTitle,

                          {
                            color:
                              allPasswordRulesValid
                                ? c.success
                                : c.text,
                          },
                        ]}
                      >
                        La contraseña debe contener:
                      </ThemedText>
                    </View>

                    {/* MÍNIMO */}

                    <PasswordRule
                      valid={
                        passwordChecks.minLength
                      }
                      text="Mínimo 8 caracteres"
                    />

                    {/* LETRA */}

                    <PasswordRule
                      valid={
                        passwordChecks.hasLetter
                      }
                      text="Al menos una letra"
                    />

                    {/* NÚMERO */}

                    <PasswordRule
                      valid={
                        passwordChecks.hasNumber
                      }
                      text="Al menos un número"
                    />

                    {/* ESPACIOS */}

                    <PasswordRule
                      valid={
                        passwordChecks.noSpaces
                      }
                      text="Sin espacios"
                    />

                    {/* ================================================= */}
                    {/* CONFIRMACIÓN */}
                    {/* ================================================= */}

                    {form
                      .passwordConfirmation
                      .length >
                      0 && (
                      <>
                        <View
                          style={[
                            styles.ruleDivider,

                            {
                              backgroundColor:
                                c.border,
                            },
                          ]}
                        />

                        <PasswordRule
                          valid={
                            passwordChecks.matches
                          }
                          text="Las contraseñas coinciden"
                        />
                      </>
                    )}
                  </View>

                  {/* ERROR BACKEND */}

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

                  {/* CAMBIAR */}

                  <SubmitButton
                    title="Cambiar contraseña"
                    onPress={
                      handleReset
                    }
                    loading={
                      submitting
                    }
                    disabled={
                      !canReset
                    }
                  />

                  {/* VOLVER AL CÓDIGO */}

                  <Button
                    title="Cambiar código"
                    variant="secondary"
                    disabled={
                      submitting
                    }
                    onPress={
                      returnToCode
                    }
                  />
                </>
              )}

              {/* ================================================= */}
              {/* FASE 3 - ÉXITO */}
              {/* ================================================= */}

              {phase ===
                "success" && (
                <>
                  <View
                    style={[
                      styles.successBox,

                      {
                        backgroundColor:
                          `${c.success}12`,

                        borderColor:
                          `${c.success}40`,
                      },
                    ]}
                  >
                    <CheckCircle2
                      size={20}
                      color={
                        c.success
                      }
                    />

                    <ThemedText
                      style={[
                        styles.successText,

                        {
                          color:
                            c.success,
                        },
                      ]}
                    >
                      {
                        successMessage
                      }
                    </ThemedText>
                  </View>

                  <Button
                    title="Iniciar sesión"
                    onPress={() =>
                      router.replace(
                        "/login",
                      )
                    }
                  />
                </>
              )}

              {/* ================================================= */}
              {/* VOLVER LOGIN */}
              {/* ================================================= */}

              {phase !==
                "success" && (
                <Pressable
                  disabled={
                    verifying ||
                    submitting
                  }
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
                        verifying ||
                        submitting
                          ? 0.4
                          : pressed
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
              )}
            </View>
          </GlassCard>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    /*
    |--------------------------------------------------------------------------
    | GENERAL
    |--------------------------------------------------------------------------
    */

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
        500,
    },

    content: {
      width:
        "100%",

      gap:
        18,
    },

    /*
    |--------------------------------------------------------------------------
    | ICON
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

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
      maxWidth:
        390,

      fontSize:
        14,

      lineHeight:
        21,

      textAlign:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | EMAIL
    |--------------------------------------------------------------------------
    */

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
        8,

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

    /*
    |--------------------------------------------------------------------------
    | CODE
    |--------------------------------------------------------------------------
    */

    codeSection: {
      width:
        "100%",

      alignItems:
        "center",

      gap:
        10,

      paddingVertical:
        4,
    },

    codeLabel: {
      fontSize:
        11,

      fontWeight:
        "700",

      letterSpacing:
        0.9,

      textAlign:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | INFO
    |--------------------------------------------------------------------------
    */

    infoBox: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        9,

      borderWidth:
        1,

      borderRadius:
        10,

      padding:
        11,
    },

    infoText: {
      flex:
        1,

      fontSize:
        11,

      lineHeight:
        17,
    },

    /*
    |--------------------------------------------------------------------------
    | VERIFIED
    |--------------------------------------------------------------------------
    */

    verifiedBox: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        8,

      borderWidth:
        1,

      borderRadius:
        10,

      padding:
        11,
    },

    verifiedText: {
      fontSize:
        12,

      fontWeight:
        "700",
    },

    /*
    |--------------------------------------------------------------------------
    | PASSWORD RULES
    |--------------------------------------------------------------------------
    */

    rules: {
      width:
        "100%",

      borderWidth:
        1,

      borderRadius:
        12,

      padding:
        14,

      gap:
        9,
    },

    rulesHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        8,

      marginBottom:
        2,
    },

    rulesTitle: {
      flex:
        1,

      fontSize:
        12,

      fontWeight:
        "700",
    },

    ruleRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        8,

      minHeight:
        18,
    },

    ruleText: {
      flex:
        1,

      fontSize:
        12,

      lineHeight:
        17,
    },

    ruleDivider: {
      width:
        "100%",

      height:
        1,

      marginVertical:
        3,
    },

    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | SUCCESS
    |--------------------------------------------------------------------------
    */

    successBox: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        10,

      borderWidth:
        1,

      borderRadius:
        12,

      padding:
        14,
    },

    successText: {
      flex:
        1,

      fontSize:
        13,

      lineHeight:
        19,
    },

    /*
    |--------------------------------------------------------------------------
    | BACK
    |--------------------------------------------------------------------------
    */

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