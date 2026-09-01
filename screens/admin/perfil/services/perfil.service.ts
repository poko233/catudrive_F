// screens/admin/perfil/services/perfil.service.ts

import {
  httpClient,
} from "@/http/httpClient";

/*
|--------------------------------------------------------------------------
| RESPONSES
|--------------------------------------------------------------------------
*/

export interface PasswordCodeResponse {
  message: string;
}

export interface VerifyPasswordCodeResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

/*
|--------------------------------------------------------------------------
| PAYLOADS
|--------------------------------------------------------------------------
*/

export interface RequestPasswordCodePayload {
  email: string;
}

export interface VerifyPasswordCodePayload {
  email: string;
  code: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;

  new_password: string;

  new_password_confirmation:
    string;
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

export const perfilService = {
  /*
  |--------------------------------------------------------------------------
  | SOLICITAR CÓDIGO
  |--------------------------------------------------------------------------
  */

  requestPasswordCode(
    email: string,
    signal?: AbortSignal,
  ): Promise<PasswordCodeResponse> {
    return httpClient.post<PasswordCodeResponse>(
      "/api/forgot-password",

      {
        email:
          email
            .trim()
            .toLowerCase(),
      },

      "No se pudo enviar el código de verificación.",

      {
        signal,
        timeoutMs:
          30_000,
      },
    );
  },

  /*
  |--------------------------------------------------------------------------
  | VERIFICAR CÓDIGO
  |--------------------------------------------------------------------------
  */

  verifyPasswordCode(
    email: string,
    code: string,
    signal?: AbortSignal,
  ): Promise<VerifyPasswordCodeResponse> {
    return httpClient.post<VerifyPasswordCodeResponse>(
      "/api/verify-reset-code",

      {
        email:
          email
            .trim()
            .toLowerCase(),

        code:
          code.trim(),
      },

      "El código no es válido o ha expirado.",

      {
        signal,
        timeoutMs:
          30_000,
      },
    );
  },

  /*
  |--------------------------------------------------------------------------
  | CAMBIAR CONTRASEÑA
  |--------------------------------------------------------------------------
  */

  resetPassword(
    payload:
      ResetPasswordPayload,
    signal?: AbortSignal,
  ): Promise<ResetPasswordResponse> {
    return httpClient.post<ResetPasswordResponse>(
      "/api/reset-password",

      {
        email:
          payload.email
            .trim()
            .toLowerCase(),

        code:
          payload.code
            .trim(),

        new_password:
          payload.new_password,

        new_password_confirmation:
          payload
            .new_password_confirmation,
      },

      "No se pudo cambiar la contraseña.",

      {
        signal,
        timeoutMs:
          30_000,
      },
    );
  },
};

export default perfilService;