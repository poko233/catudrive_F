// screens/admin/auth/hooks/useResetPassword.ts

import {
  isApiError,
} from "@/http/ApiError";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  passwordRecoveryService,
} from "../services/passwordRecovery.service";

/*
|--------------------------------------------------------------------------
| FASES
|--------------------------------------------------------------------------
*/

export type ResetPasswordPhase =
  | "code"
  | "password"
  | "success";

/*
|--------------------------------------------------------------------------
| FORM
|--------------------------------------------------------------------------
*/

interface ResetPasswordForm {
  email: string;

  code: string;

  password: string;

  passwordConfirmation: string;
}

/*
|--------------------------------------------------------------------------
| ERRORS
|--------------------------------------------------------------------------
*/

interface ResetPasswordErrors {
  email?: string;

  code?: string;

  password?: string;

  passwordConfirmation?: string;
}

/*
|--------------------------------------------------------------------------
| REGEX
|--------------------------------------------------------------------------
*/

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HAS_LETTER =
  /[A-Za-zÁÉÍÓÚáéíóúÑñ]/;

const HAS_NUMBER =
  /\d/;

const HAS_SPACE =
  /\s/;

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

export function useResetPassword(
  initialEmail = "",
) {
  /*
  |--------------------------------------------------------------------------
  | FASE
  |--------------------------------------------------------------------------
  */

  const [
    phase,
    setPhase,
  ] =
    useState<ResetPasswordPhase>(
      "code",
    );

  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */

  const [
    form,
    setForm,
  ] =
    useState<ResetPasswordForm>({
      email:
        initialEmail,

      code:
        "",

      password:
        "",

      passwordConfirmation:
        "",
    });

  const [
    errors,
    setErrors,
  ] =
    useState<ResetPasswordErrors>(
      {},
    );

  const [
    serverError,
    setServerError,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  const [
    verifying,
    setVerifying,
  ] =
    useState(false);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | ABORT
  |--------------------------------------------------------------------------
  */

  const controllerRef =
    useRef<AbortController | null>(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | EMAIL INICIAL
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !initialEmail
      ) {
        return;
      }

      setForm(
        (
          current,
        ) => ({
          ...current,

          email:
            initialEmail,
        }),
      );
    },
    [
      initialEmail,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange =
    (
      field:
        keyof ResetPasswordForm,
    ) =>
    (
      value: string,
    ) => {
      let nextValue =
        value;

      /*
       * Código:
       * solo números y máximo 6.
       */

      if (
        field ===
        "code"
      ) {
        nextValue =
          value
            .replace(
              /\D/g,
              "",
            )
            .slice(
              0,
              6,
            );
      }

      setForm(
        (
          current,
        ) => ({
          ...current,

          [field]:
            nextValue,
        }),
      );

      setErrors(
        (
          current,
        ) => ({
          ...current,

          [field]:
            undefined,
        }),
      );

      setServerError(
        "",
      );
    };

  /*
  |--------------------------------------------------------------------------
  | VALIDAR FASE CÓDIGO
  |--------------------------------------------------------------------------
  */

  const validateCodePhase =
    (): boolean => {
      const next:
        ResetPasswordErrors = {};

      const email =
        form.email
          .trim()
          .toLowerCase();

      const code =
        form.code
          .trim();

      if (!email) {
        next.email =
          "Ingrese su correo electrónico.";
      } else if (
        !EMAIL_REGEX.test(
          email,
        )
      ) {
        next.email =
          "Ingrese un correo electrónico válido.";
      }

      if (!code) {
        next.code =
          "Ingrese el código recibido por correo.";
      } else if (
        !/^\d{6}$/.test(
          code,
        )
      ) {
        next.code =
          "El código debe tener exactamente 6 dígitos.";
      }

      setErrors(
        next,
      );

      return (
        Object.keys(
          next,
        ).length === 0
      );
    };

  /*
  |--------------------------------------------------------------------------
  | VERIFICAR CÓDIGO
  |--------------------------------------------------------------------------
  */

  const verifyCode =
    async (): Promise<boolean> => {
      if (
        verifying ||
        !validateCodePhase()
      ) {
        return false;
      }

      controllerRef.current
        ?.abort();

      const controller =
        new AbortController();

      controllerRef.current =
        controller;

      setVerifying(
        true,
      );

      setServerError(
        "",
      );

      try {
        await passwordRecoveryService
          .verifyResetCode(
            {
              email:
                form.email
                  .trim()
                  .toLowerCase(),

              code:
                form.code
                  .trim(),
            },

            {
              signal:
                controller.signal,
            },
          );

        /*
         * Recién ahora habilitamos
         * la fase de contraseña.
         */

        setPhase(
          "password",
        );

        return true;
      } catch (
        error
      ) {
        if (
          error instanceof Error &&
          error.name ===
            "AbortError"
        ) {
          return false;
        }

        setServerError(
          isApiError(
            error,
          )
            ? error.message
            : "No se pudo validar el código.",
        );

        return false;
      } finally {
        if (
          controllerRef.current ===
          controller
        ) {
          controllerRef.current =
            null;
        }

        setVerifying(
          false,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | VALIDAR PASSWORD
  |--------------------------------------------------------------------------
  */

  const validatePasswordPhase =
    (): boolean => {
      const next:
        ResetPasswordErrors = {};

      if (
        !form.password
      ) {
        next.password =
          "Ingrese una nueva contraseña.";
      } else if (
        form.password.length <
        8
      ) {
        next.password =
          "La contraseña debe tener al menos 8 caracteres.";
      } else if (
        form.password.length >
        128
      ) {
        next.password =
          "La contraseña no puede superar los 128 caracteres.";
      } else if (
        HAS_SPACE.test(
          form.password,
        )
      ) {
        next.password =
          "La contraseña no puede contener espacios.";
      } else if (
        !HAS_LETTER.test(
          form.password,
        )
      ) {
        next.password =
          "La contraseña debe contener al menos una letra.";
      } else if (
        !HAS_NUMBER.test(
          form.password,
        )
      ) {
        next.password =
          "La contraseña debe contener al menos un número.";
      }

      if (
        !form.passwordConfirmation
      ) {
        next.passwordConfirmation =
          "Confirme la nueva contraseña.";
      } else if (
        form.password !==
        form.passwordConfirmation
      ) {
        next.passwordConfirmation =
          "Las contraseñas no coinciden.";
      }

      setErrors(
        next,
      );

      return (
        Object.keys(
          next,
        ).length === 0
      );
    };

  /*
  |--------------------------------------------------------------------------
  | RESTABLECER PASSWORD
  |--------------------------------------------------------------------------
  */

  const resetPassword =
    async (): Promise<boolean> => {
      if (
        submitting ||
        phase !==
          "password"
      ) {
        return false;
      }

      if (
        !validatePasswordPhase()
      ) {
        return false;
      }

      controllerRef.current
        ?.abort();

      const controller =
        new AbortController();

      controllerRef.current =
        controller;

      setSubmitting(
        true,
      );

      setServerError(
        "",
      );

      try {
        const response =
          await passwordRecoveryService
            .resetPassword(
              {
                email:
                  form.email
                    .trim()
                    .toLowerCase(),

                code:
                  form.code
                    .trim(),

                new_password:
                  form.password,

                new_password_confirmation:
                  form.passwordConfirmation,
              },

              {
                signal:
                  controller.signal,
              },
            );

        /*
         * Limpiamos datos sensibles.
         */

        setForm(
          (
            current,
          ) => ({
            ...current,

            code:
              "",

            password:
              "",

            passwordConfirmation:
              "",
          }),
        );

        setSuccessMessage(
          response.message,
        );

        setPhase(
          "success",
        );

        return true;
      } catch (
        error
      ) {
        if (
          error instanceof Error &&
          error.name ===
            "AbortError"
        ) {
          return false;
        }

        setServerError(
          isApiError(
            error,
          )
            ? error.message
            : "No se pudo restablecer la contraseña.",
        );

        return false;
      } finally {
        if (
          controllerRef.current ===
          controller
        ) {
          controllerRef.current =
            null;
        }

        setSubmitting(
          false,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | VOLVER AL CÓDIGO
  |--------------------------------------------------------------------------
  */

  const returnToCode =
    () => {
      setPhase(
        "code",
      );

      setForm(
        (
          current,
        ) => ({
          ...current,

          password:
            "",

          passwordConfirmation:
            "",
        }),
      );

      setErrors(
        {},
      );

      setServerError(
        "",
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CAN VERIFY
  |--------------------------------------------------------------------------
  */

  const canVerify =
    useMemo(
      () =>
        EMAIL_REGEX.test(
          form.email
            .trim(),
        ) &&
        /^\d{6}$/.test(
          form.code,
        ) &&
        !verifying,
      [
        form.email,
        form.code,
        verifying,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CAN RESET
  |--------------------------------------------------------------------------
  */

  const canReset =
    useMemo(
      () =>
        phase ===
          "password" &&
        form.password.length >=
          8 &&
        form.password.length <=
          128 &&
        !HAS_SPACE.test(
          form.password,
        ) &&
        HAS_LETTER.test(
          form.password,
        ) &&
        HAS_NUMBER.test(
          form.password,
        ) &&
        form.password ===
          form.passwordConfirmation &&
        !submitting,
      [
        phase,
        form.password,
        form.passwordConfirmation,
        submitting,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CLEANUP
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      return () => {
        controllerRef.current
          ?.abort();
      };
    },
    [],
  );

  return {
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
  };
}

export default useResetPassword;