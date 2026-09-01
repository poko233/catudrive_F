// screens/admin/perfil/components/ChangePasswordModal.tsx

import {
  useEffect,
} from "react";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  CheckCircle2,
  Circle,
  KeyRound,
  Mail,
  ShieldCheck,
} from "lucide-react-native";

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  Badge,
} from "@/components/ui/Badge";

import {
  Button,
} from "@/components/ui/Button";

import {
  Card,
} from "@/components/ui/Card";

import {
  Divider,
} from "@/components/ui/Divider";

import {
  Input,
} from "@/components/ui/Input";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  useTheme,
} from "@/theme/useTheme";

/*
|--------------------------------------------------------------------------
| REUTILIZAMOS EL MISMO INPUT DE CÓDIGO DEL LOGIN
|--------------------------------------------------------------------------
*/

import {
  VerificationCodeInput,
} from "../../auth/components/VerificationCodeInput";

import {
  useChangePassword,
} from "../hooks/useChangePassword";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

type Props = {
  visible: boolean;

  onClose: () => void;

  onSuccess:
    () =>
      void |
      Promise<void>;
};

/*
|--------------------------------------------------------------------------
| RULE
|--------------------------------------------------------------------------
*/

function PasswordRule({
  valid,
  label,
}: {
  valid: boolean;
  label: string;
}) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const Icon =
    valid
      ? CheckCircle2
      : Circle;

  return (
    <View
      style={
        styles.rule
      }
    >
      <Icon
        size={16}
        color={
          valid
            ? c.success
            : c.textMuted
        }
      />

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
        {label}
      </ThemedText>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function ChangePasswordModal({
  visible,

  onClose,

  onSuccess,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const {
    maskedEmail,

    phase,

    code,

    newPassword,

    confirmPassword,

    passwordChecks,

    mainPasswordRulesValid,

    action,

    submitting,

    serverError,

    resendSeconds,

    canRequest,

    canVerify,

    canReset,

    setCode,

    setNewPassword,

    setConfirmPassword,

    requestCode,

    resendCode,

    verifyCode,

    resetPassword,

    returnToCode,

    resetFlow,
  } =
    useChangePassword();

  /*
  |--------------------------------------------------------------------------
  | NUEVA APERTURA
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (visible) {
        resetFlow();
      }
    },
    [
      visible,
      resetFlow,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | CLOSE
  |--------------------------------------------------------------------------
  */

  const handleClose =
    () => {
      if (
        submitting
      ) {
        return;
      }

      /*
       * Si la contraseña ya fue cambiada,
       * cerrar debe finalizar también
       * la sesión.
       */

      if (
        phase ===
        "success"
      ) {
        void onSuccess();

        return;
      }

      resetFlow();

      onClose();
    };

  /*
  |--------------------------------------------------------------------------
  | FOOTER
  |--------------------------------------------------------------------------
  */

  const footer =
    (() => {
      /*
      |--------------------------------------------------------------------------
      | REQUEST
      |--------------------------------------------------------------------------
      */

      if (
        phase ===
        "request"
      ) {
        return (
          <View
            style={
              styles.footer
            }
          >
            <Button
              title="Cancelar"
              variant="secondary"
              disabled={
                submitting
              }
              onPress={
                handleClose
              }
            />

            <Button
              title="Enviar código"
              loading={
                action ===
                "request"
              }
              disabled={
                !canRequest
              }
              onPress={() => {
                void requestCode();
              }}
            />
          </View>
        );
      }

      /*
      |--------------------------------------------------------------------------
      | CODE
      |--------------------------------------------------------------------------
      */

      if (
        phase ===
        "code"
      ) {
        return (
          <View
            style={
              styles.footer
            }
          >
            <Button
              title="Cancelar"
              variant="secondary"
              disabled={
                submitting
              }
              onPress={
                handleClose
              }
            />

            <Button
              title="Verificar código"
              loading={
                action ===
                "verify"
              }
              disabled={
                !canVerify
              }
              onPress={() => {
                void verifyCode();
              }}
            />
          </View>
        );
      }

      /*
      |--------------------------------------------------------------------------
      | PASSWORD
      |--------------------------------------------------------------------------
      */

      if (
        phase ===
        "password"
      ) {
        return (
          <View
            style={
              styles.footer
            }
          >
            <Button
              title="Volver"
              variant="secondary"
              disabled={
                submitting
              }
              onPress={
                returnToCode
              }
            />

            <Button
              title="Cambiar contraseña"
              loading={
                action ===
                "reset"
              }
              disabled={
                !canReset
              }
              onPress={() => {
                void resetPassword();
              }}
            />
          </View>
        );
      }

      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      return (
        <View
          style={
            styles.footer
          }
        >
          <Button
            title="Iniciar sesión nuevamente"
            onPress={() => {
              void onSuccess();
            }}
          />
        </View>
      );
    })();

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <Modal
      visible={
        visible
      }
      title="Cambiar contraseña"
      onClose={
        handleClose
      }
      closeOnBackdropPress={
        !submitting &&
        phase !==
          "success"
      }
      width="94%"
      maxWidth={540}
      footer={
        footer
      }
    >
      <View
        style={
          styles.content
        }
      >
        {/* ================================================= */}
        {/* REQUEST */}
        {/* ================================================= */}

        {phase ===
        "request" ? (
          <>
            <View
              style={[
                styles.heroIcon,

                {
                  backgroundColor:
                    c.primarySubtle,
                },
              ]}
            >
              <Mail
                size={27}
                color={
                  c.primary
                }
              />
            </View>

            <View
              style={
                styles.center
              }
            >
              <ThemedText
                style={
                  styles.title
                }
              >
                Verificación por correo
              </ThemedText>

              <ThemedText
                style={[
                  styles.description,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Antes de cambiar tu contraseña enviaremos un código de seguridad a tu correo registrado.
              </ThemedText>
            </View>

            <Card
              style={
                styles.emailCard
              }
            >
              <View
                style={
                  styles.emailRow
                }
              >
                <Mail
                  size={18}
                  color={
                    c.primary
                  }
                />

                <View
                  style={
                    styles.emailCopy
                  }
                >
                  <ThemedText
                    style={[
                      styles.smallLabel,

                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    Código enviado a
                  </ThemedText>

                  <ThemedText
                    style={
                      styles.email
                    }
                  >
                    {maskedEmail ||
                      "Sin correo registrado"}
                  </ThemedText>
                </View>
              </View>
            </Card>

            <View
              style={[
                styles.security,

                {
                  backgroundColor:
                    c.backgroundSecondary,

                  borderColor:
                    c.border,
                },
              ]}
            >
              <ShieldCheck
                size={18}
                color={
                  c.success
                }
              />

              <ThemedText
                style={[
                  styles.securityText,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                El código es temporal y solamente puede utilizarse para verificar este cambio.
              </ThemedText>
            </View>
          </>
        ) : null}

        {/* ================================================= */}
        {/* CODE */}
        {/* ================================================= */}

        {phase ===
        "code" ? (
          <>
            <View
              style={[
                styles.heroIcon,

                {
                  backgroundColor:
                    c.primarySubtle,
                },
              ]}
            >
              <KeyRound
                size={27}
                color={
                  c.primary
                }
              />
            </View>

            <View
              style={
                styles.center
              }
            >
              <ThemedText
                style={
                  styles.title
                }
              >
                Ingresa el código
              </ThemedText>

              <ThemedText
                style={[
                  styles.description,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Escribe los 6 dígitos enviados a {maskedEmail}.
              </ThemedText>
            </View>

            <VerificationCodeInput
              value={
                code
              }
              onChangeText={
                setCode
              }
              length={6}
              disabled={
                submitting
              }
            />

            <View
              style={
                styles.resend
              }
            >
              <ThemedText
                style={{
                  color:
                    c.textSecondary,

                  fontSize:
                    12,
                }}
              >
                ¿No recibiste el código?
              </ThemedText>

              <Button
                title={
                  resendSeconds >
                  0
                    ? `Enviar nuevamente en ${resendSeconds}s`
                    : "Enviar nuevamente"
                }
                variant="secondary"
                disabled={
                  resendSeconds >
                    0 ||
                  submitting
                }
                loading={
                  action ===
                  "request"
                }
                onPress={() => {
                  void resendCode();
                }}
              />
            </View>
          </>
        ) : null}

        {/* ================================================= */}
        {/* PASSWORD */}
        {/* ================================================= */}

        {phase ===
        "password" ? (
          <>
            <View
              style={[
                styles.heroIcon,

                {
                  backgroundColor:
                    c.primarySubtle,
                },
              ]}
            >
              <ShieldCheck
                size={27}
                color={
                  c.primary
                }
              />
            </View>

            <View
              style={
                styles.center
              }
            >
              <ThemedText
                style={
                  styles.title
                }
              >
                Nueva contraseña
              </ThemedText>

              <ThemedText
                style={[
                  styles.description,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                El código fue verificado correctamente. Ahora establece tu nueva contraseña.
              </ThemedText>
            </View>

            <Divider
              spacing={4}
            />

            <Input
              label="Nueva contraseña"
              value={
                newPassword
              }
              onChangeText={
                setNewPassword
              }
              secureTextEntry
              autoCapitalize="none"
              placeholder="••••••••"
            />

            <Input
              label="Repetir nueva contraseña"
              value={
                confirmPassword
              }
              onChangeText={
                setConfirmPassword
              }
              secureTextEntry
              autoCapitalize="none"
              placeholder="••••••••"
            />

            <View
              style={[
                styles.rules,

                {
                  backgroundColor:
                    mainPasswordRulesValid
                      ? `${c.success}10`
                      : c.backgroundSecondary,

                  borderColor:
                    mainPasswordRulesValid
                      ? c.success
                      : c.border,
                },
              ]}
            >
              <View
                style={
                  styles.rulesHeader
                }
              >
                <ThemedText
                  style={
                    styles.rulesTitle
                  }
                >
                  Requisitos
                </ThemedText>

                <Badge
                  label={
                    mainPasswordRulesValid
                      ? "Correcta"
                      : "Pendiente"
                  }
                  variant={
                    mainPasswordRulesValid
                      ? "success"
                      : "muted"
                  }
                />
              </View>

              <PasswordRule
                valid={
                  passwordChecks
                    .minLength
                }
                label="Mínimo 8 caracteres"
              />

              <PasswordRule
                valid={
                  passwordChecks
                    .hasLetter
                }
                label="Al menos una letra"
              />

              <PasswordRule
                valid={
                  passwordChecks
                    .hasNumber
                }
                label="Al menos un número"
              />

              <PasswordRule
                valid={
                  passwordChecks
                    .noSpaces
                }
                label="Sin espacios"
              />

              {confirmPassword
                .length >
              0 ? (
                <PasswordRule
                  valid={
                    passwordChecks
                      .matches
                  }
                  label="Las contraseñas coinciden"
                />
              ) : null}
            </View>
          </>
        ) : null}

        {/* ================================================= */}
        {/* SUCCESS */}
        {/* ================================================= */}

        {phase ===
        "success" ? (
          <>
            <View
              style={[
                styles.successIcon,

                {
                  backgroundColor:
                    `${c.success}18`,
                },
              ]}
            >
              <CheckCircle2
                size={34}
                color={
                  c.success
                }
              />
            </View>

            <View
              style={
                styles.center
              }
            >
              <ThemedText
                style={
                  styles.title
                }
              >
                Contraseña actualizada
              </ThemedText>

              <ThemedText
                style={[
                  styles.description,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Tu contraseña se cambió correctamente. Por seguridad, inicia sesión nuevamente con la nueva contraseña.
              </ThemedText>
            </View>
          </>
        ) : null}

        {/* ================================================= */}
        {/* SERVER ERROR */}
        {/* ================================================= */}

        {!!serverError &&
        phase !==
          "success" ? (
          <View
            style={[
              styles.errorBox,

              {
                backgroundColor:
                  `${c.destructive}10`,

                borderColor:
                  c.destructive,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.error,

                {
                  color:
                    c.destructive,
                },
              ]}
            >
              {serverError}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    content: {
      gap:
        16,
    },

    center: {
      alignItems:
        "center",

      gap:
        5,
    },

    heroIcon: {
      width:
        58,

      height:
        58,

      alignSelf:
        "center",

      borderRadius:
        18,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    successIcon: {
      width:
        70,

      height:
        70,

      alignSelf:
        "center",

      borderRadius:
        22,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    title: {
      fontSize:
        19,

      fontWeight:
        "900",

      textAlign:
        "center",
    },

    description: {
      maxWidth:
        440,

      fontSize:
        12,

      lineHeight:
        18,

      textAlign:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | EMAIL
    |--------------------------------------------------------------------------
    */

    emailCard: {
      gap:
        0,
    },

    emailRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        11,
    },

    emailCopy: {
      flex:
        1,

      minWidth:
        0,
    },

    smallLabel: {
      fontSize:
        10,

      fontWeight:
        "700",

      textTransform:
        "uppercase",
    },

    email: {
      marginTop:
        2,

      fontSize:
        14,

      fontWeight:
        "800",
    },

    /*
    |--------------------------------------------------------------------------
    | SECURITY
    |--------------------------------------------------------------------------
    */

    security: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        9,

      padding:
        11,

      borderWidth:
        1,

      borderRadius:
        11,
    },

    securityText: {
      flex:
        1,

      fontSize:
        11,

      lineHeight:
        16,
    },

    /*
    |--------------------------------------------------------------------------
    | CODE
    |--------------------------------------------------------------------------
    */

    resend: {
      alignItems:
        "center",

      gap:
        8,
    },

    /*
    |--------------------------------------------------------------------------
    | RULES
    |--------------------------------------------------------------------------
    */

    rules: {
      gap:
        8,

      padding:
        12,

      borderWidth:
        1,

      borderRadius:
        12,
    },

    rulesHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        10,

      marginBottom:
        2,
    },

    rulesTitle: {
      fontSize:
        12,

      fontWeight:
        "800",
    },

    rule: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        7,
    },

    ruleText: {
      flex:
        1,

      fontSize:
        11,
    },

    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    errorBox: {
      padding:
        10,

      borderWidth:
        1,

      borderRadius:
        10,
    },

    error: {
      fontSize:
        11,

      lineHeight:
        16,

      textAlign:
        "center",

      fontWeight:
        "600",
    },

    /*
    |--------------------------------------------------------------------------
    | FOOTER
    |--------------------------------------------------------------------------
    */

    footer: {
      width:
        "100%",

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      justifyContent:
        "flex-end",

      gap:
        10,
    },
  });

export default ChangePasswordModal;