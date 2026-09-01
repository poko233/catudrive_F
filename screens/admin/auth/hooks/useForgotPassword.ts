// screens/admin/auth/hooks/useForgotPassword.ts

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
| TIPOS
|--------------------------------------------------------------------------
*/

interface ForgotPasswordErrors {
  email?: string;
}

/*
|--------------------------------------------------------------------------
| REGEX
|--------------------------------------------------------------------------
*/

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

export function useForgotPassword() {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    errors,
    setErrors,
  ] =
    useState<ForgotPasswordErrors>(
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
    submitting,
    setSubmitting,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | ABORT CONTROLLER
  |--------------------------------------------------------------------------
  */

  const controllerRef =
    useRef<AbortController | null>(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | EMAIL NORMALIZADO
  |--------------------------------------------------------------------------
  */

  const normalizedEmail =
    useMemo(
      () =>
        email
          .trim()
          .toLowerCase(),
      [
        email,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | VALIDAR
  |--------------------------------------------------------------------------
  */

  const validate =
    (): boolean => {
      const next:
        ForgotPasswordErrors = {};

      if (
        !normalizedEmail
      ) {
        next.email =
          "Ingrese su correo electrónico.";
      } else if (
        !EMAIL_REGEX.test(
          normalizedEmail,
        )
      ) {
        next.email =
          "Ingrese un correo electrónico válido.";
      } else if (
        normalizedEmail.length >
        80
      ) {
        next.email =
          "El correo electrónico no puede superar los 80 caracteres.";
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
  | CAMBIO DE EMAIL
  |--------------------------------------------------------------------------
  */

  const handleEmailChange =
    (
      value: string,
    ) => {
      setEmail(
        value,
      );

      setErrors(
        {},
      );

      setServerError(
        "",
      );

      setSuccessMessage(
        "",
      );
    };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (): Promise<boolean> => {
      if (
        submitting
      ) {
        return false;
      }

      if (
        !validate()
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

      setSuccessMessage(
        "",
      );

      try {
        const response =
          await passwordRecoveryService
            .forgotPassword(
              {
                email:
                  normalizedEmail,
              },

              {
                signal:
                  controller.signal,
              },
            );

        setSuccessMessage(
          response.message,
        );

        return true;
      } catch (
        error
      ) {
        /*
         * Cancelación manual.
         */

        if (
          error instanceof Error &&
          error.name ===
            "AbortError"
        ) {
          return false;
        }

        if (
          isApiError(
            error,
          )
        ) {
          setServerError(
            error.message,
          );

          return false;
        }

        setServerError(
          "No se pudo procesar la solicitud.",
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
  | REINTENTAR
  |--------------------------------------------------------------------------
  */

  const resetState =
    () => {
      controllerRef.current
        ?.abort();

      controllerRef.current =
        null;

      setErrors(
        {},
      );

      setServerError(
        "",
      );

      setSuccessMessage(
        "",
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CAN SUBMIT
  |--------------------------------------------------------------------------
  */

  const canSubmit =
    useMemo(
      () =>
        EMAIL_REGEX.test(
          normalizedEmail,
        ) &&
        normalizedEmail.length <=
          80 &&
        !submitting,
      [
        normalizedEmail,
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
  };
}

export default useForgotPassword;