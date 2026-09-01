// screens/admin/perfil/hooks/useChangePassword.ts

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Toast from "react-native-toast-message";

import {
  useAuth,
} from "@/store/authStore";

import {
  perfilService,
} from "../services/perfil.service";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

export type ChangePasswordPhase =
  | "request"
  | "code"
  | "password"
  | "success";

type Action =
  | "request"
  | "verify"
  | "reset"
  | null;

export type PasswordChecks = {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  noSpaces: boolean;
  matches: boolean;
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  if (
    typeof error ===
      "object" &&
    error !== null &&
    "message" in error &&
    typeof (
      error as {
        message?: unknown;
      }
    ).message ===
      "string"
  ) {
    return (
      error as {
        message: string;
      }
    ).message;
  }

  return fallback;
}

function normalizeEmail(
  email?: string | null,
): string {
  return (
    email
      ?.trim()
      .toLowerCase() ??
    ""
  );
}

function maskEmail(
  email: string,
): string {
  const [
    local,
    domain,
  ] =
    email.split("@");

  if (
    !local ||
    !domain
  ) {
    return email;
  }

  if (
    local.length <=
    2
  ) {
    return `${local[0] ?? "*"}***@${domain}`;
  }

  return `${local.slice(0, 2)}${"*".repeat(
    Math.max(
      3,
      local.length -
        2,
    ),
  )}@${domain}`;
}

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

export function useChangePassword() {
  const {
    user,
  } =
    useAuth();

  /*
  |--------------------------------------------------------------------------
  | EMAIL
  |--------------------------------------------------------------------------
  */

  const email =
    normalizeEmail(
      user?.email,
    );

  const maskedEmail =
    useMemo(
      () =>
        maskEmail(
          email,
        ),
      [
        email,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    phase,
    setPhase,
  ] =
    useState<ChangePasswordPhase>(
      "request",
    );

  const [
    code,
    setCodeState,
  ] =
    useState("");

  const [
    newPassword,
    setNewPasswordState,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPasswordState,
  ] =
    useState("");

  const [
    action,
    setAction,
  ] =
    useState<Action>(
      null,
    );

  const [
    serverError,
    setServerError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    resendSeconds,
    setResendSeconds,
  ] =
    useState(0);

  /*
  |--------------------------------------------------------------------------
  | ABORT
  |--------------------------------------------------------------------------
  */

  const abortRef =
    useRef<AbortController | null>(
      null,
    );

  const createController =
    useCallback(
      () => {
        abortRef.current
          ?.abort();

        const controller =
          new AbortController();

        abortRef.current =
          controller;

        return controller;
      },
      [],
    );

  useEffect(
    () => {
      return () => {
        abortRef.current
          ?.abort();
      };
    },
    [],
  );

  /*
  |--------------------------------------------------------------------------
  | RESEND TIMER
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        resendSeconds <=
        0
      ) {
        return;
      }

      const timer =
        setTimeout(
          () => {
            setResendSeconds(
              (
                current,
              ) =>
                Math.max(
                  0,
                  current -
                    1,
                ),
            );
          },
          1000,
        );

      return () =>
        clearTimeout(
          timer,
        );
    },
    [
      resendSeconds,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | PASSWORD CHECKS
  |--------------------------------------------------------------------------
  */

  const passwordChecks =
    useMemo<PasswordChecks>(
      () => ({
        minLength:
          newPassword
            .length >=
          8,

        hasLetter:
          /[A-Za-z]/.test(
            newPassword,
          ),

        hasNumber:
          /\d/.test(
            newPassword,
          ),

        noSpaces:
          newPassword
            .length >
            0 &&
          !/\s/.test(
            newPassword,
          ),

        matches:
          confirmPassword
            .length >
            0 &&
          newPassword ===
            confirmPassword,
      }),
      [
        newPassword,
        confirmPassword,
      ],
    );

  const mainPasswordRulesValid =
    passwordChecks
      .minLength &&
    passwordChecks
      .hasLetter &&
    passwordChecks
      .hasNumber &&
    passwordChecks
      .noSpaces;

  /*
  |--------------------------------------------------------------------------
  | SETTERS
  |--------------------------------------------------------------------------
  */

  const setCode =
    useCallback(
      (
        value:
          string,
      ) => {
        const digits =
          value
            .replace(
              /\D/g,
              "",
            )
            .slice(
              0,
              6,
            );

        setCodeState(
          digits,
        );

        setServerError(
          null,
        );
      },
      [],
    );

  const setNewPassword =
    useCallback(
      (
        value:
          string,
      ) => {
        setNewPasswordState(
          value,
        );

        setServerError(
          null,
        );
      },
      [],
    );

  const setConfirmPassword =
    useCallback(
      (
        value:
          string,
      ) => {
        setConfirmPasswordState(
          value,
        );

        setServerError(
          null,
        );
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | SOLICITAR CÓDIGO
  |--------------------------------------------------------------------------
  */

  const requestCode =
    useCallback(
      async (): Promise<boolean> => {
        if (
          action !==
          null
        ) {
          return false;
        }

        if (!email) {
          const message =
            "Tu cuenta no tiene un correo electrónico registrado.";

          setServerError(
            message,
          );

          Toast.show({
            type:
              "error",

            text1:
              "Correo no disponible",

            text2:
              message,
          });

          return false;
        }

        try {
          setAction(
            "request",
          );

          setServerError(
            null,
          );

          const controller =
            createController();

          const response =
            await perfilService
              .requestPasswordCode(
                email,
                controller.signal,
              );

          setCodeState(
            "",
          );

          setPhase(
            "code",
          );

          /*
           * Coincide con el cooldown
           * configurado para recuperación.
           */

          setResendSeconds(
            60,
          );

          Toast.show({
            type:
              "success",

            text1:
              "Código enviado",

            text2:
              response.message ||
              "Revisa tu correo electrónico.",
          });

          return true;
        } catch (
          error: unknown
        ) {
          const message =
            getErrorMessage(
              error,
              "No se pudo enviar el código.",
            );

          setServerError(
            message,
          );

          Toast.show({
            type:
              "error",

            text1:
              "No se pudo enviar el código",

            text2:
              message,
          });

          return false;
        } finally {
          setAction(
            null,
          );
        }
      },
      [
        action,
        email,
        createController,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | REENVIAR
  |--------------------------------------------------------------------------
  */

  const resendCode =
    useCallback(
      async () => {
        if (
          resendSeconds >
          0 ||
          action !==
            null
        ) {
          return;
        }

        await requestCode();
      },
      [
        resendSeconds,
        action,
        requestCode,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | VERIFICAR
  |--------------------------------------------------------------------------
  */

  const verifyCode =
    useCallback(
      async (): Promise<boolean> => {
        if (
          action !==
          null
        ) {
          return false;
        }

        if (
          !/^\d{6}$/.test(
            code,
          )
        ) {
          setServerError(
            "Ingresa el código de 6 dígitos.",
          );

          return false;
        }

        try {
          setAction(
            "verify",
          );

          setServerError(
            null,
          );

          const controller =
            createController();

          const response =
            await perfilService
              .verifyPasswordCode(
                email,
                code,
                controller.signal,
              );

          setPhase(
            "password",
          );

          Toast.show({
            type:
              "success",

            text1:
              "Código verificado",

            text2:
              response.message ||
              "Ahora puedes establecer tu nueva contraseña.",
          });

          return true;
        } catch (
          error: unknown
        ) {
          const message =
            getErrorMessage(
              error,
              "El código no es válido o ha expirado.",
            );

          setServerError(
            message,
          );

          Toast.show({
            type:
              "error",

            text1:
              "Código no válido",

            text2:
              message,
          });

          return false;
        } finally {
          setAction(
            null,
          );
        }
      },
      [
        action,
        code,
        email,
        createController,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CAMBIAR CONTRASEÑA
  |--------------------------------------------------------------------------
  */

  const resetPassword =
    useCallback(
      async (): Promise<boolean> => {
        if (
          action !==
            null
        ) {
          return false;
        }

        if (
          !mainPasswordRulesValid
        ) {
          setServerError(
            "La contraseña no cumple todos los requisitos.",
          );

          return false;
        }

        if (
          !passwordChecks
            .matches
        ) {
          setServerError(
            "Las contraseñas no coinciden.",
          );

          return false;
        }

        try {
          setAction(
            "reset",
          );

          setServerError(
            null,
          );

          const controller =
            createController();

          await perfilService
            .resetPassword(
              {
                email,

                code,

                new_password:
                  newPassword,

                new_password_confirmation:
                  confirmPassword,
              },

              controller.signal,
            );

          /*
          |--------------------------------------------------------------------------
          | LIMPIAR DATOS SENSIBLES
          |--------------------------------------------------------------------------
          */

          setCodeState(
            "",
          );

          setNewPasswordState(
            "",
          );

          setConfirmPasswordState(
            "",
          );

          setResendSeconds(
            0,
          );

          setPhase(
            "success",
          );

          Toast.show({
            type:
              "success",

            text1:
              "Contraseña actualizada",

            text2:
              "Por seguridad debes iniciar sesión nuevamente.",
          });

          return true;
        } catch (
          error: unknown
        ) {
          const message =
            getErrorMessage(
              error,
              "No se pudo cambiar la contraseña.",
            );

          setServerError(
            message,
          );

          Toast.show({
            type:
              "error",

            text1:
              "No se pudo cambiar la contraseña",

            text2:
              message,
          });

          return false;
        } finally {
          setAction(
            null,
          );
        }
      },
      [
        action,
        email,
        code,
        newPassword,
        confirmPassword,
        mainPasswordRulesValid,
        passwordChecks.matches,
        createController,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | VOLVER
  |--------------------------------------------------------------------------
  */

  const returnToCode =
    useCallback(
      () => {
        setNewPasswordState(
          "",
        );

        setConfirmPasswordState(
          "",
        );

        setServerError(
          null,
        );

        setPhase(
          "code",
        );
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | RESET FLOW
  |--------------------------------------------------------------------------
  */

  const resetFlow =
    useCallback(
      () => {
        abortRef.current
          ?.abort();

        abortRef.current =
          null;

        setPhase(
          "request",
        );

        setCodeState(
          "",
        );

        setNewPasswordState(
          "",
        );

        setConfirmPasswordState(
          "",
        );

        setAction(
          null,
        );

        setServerError(
          null,
        );

        setResendSeconds(
          0,
        );
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | FLAGS
  |--------------------------------------------------------------------------
  */

  const submitting =
    action !==
    null;

  const canRequest =
    !!email &&
    !submitting;

  const canVerify =
    /^\d{6}$/.test(
      code,
    ) &&
    !submitting;

  const canReset =
    mainPasswordRulesValid &&
    passwordChecks
      .matches &&
    !submitting;

  return {
    email,

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
  };
}

export default useChangePassword;