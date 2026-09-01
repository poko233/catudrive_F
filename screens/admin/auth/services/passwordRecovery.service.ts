// screens/admin/auth/services/passwordRecovery.service.ts

import {
  httpClient,
  HttpRequestConfig,
} from "@/http/httpClient";

/*
|--------------------------------------------------------------------------
| RESPUESTAS
|--------------------------------------------------------------------------
*/

export interface ForgotPasswordResponse {
  message: string;
}

export interface VerifyResetCodeResponse {
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

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetCodePayload {
  email: string;

  code: string;
}

export interface ResetPasswordPayload {
  email: string;

  code: string;

  new_password: string;

  new_password_confirmation: string;
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

export const passwordRecoveryService = {
  /*
  |--------------------------------------------------------------------------
  | SOLICITAR CÓDIGO
  |--------------------------------------------------------------------------
  */

  forgotPassword(
    payload: ForgotPasswordPayload,
    config: HttpRequestConfig = {},
  ): Promise<ForgotPasswordResponse> {
    return httpClient.post<ForgotPasswordResponse>(
      "/api/forgot-password",

      payload,

      "No se pudo solicitar la recuperación de contraseña.",

      {
        timeoutMs:
          30_000,

        ...config,
      },
    );
  },

  /*
  |--------------------------------------------------------------------------
  | VALIDAR CÓDIGO
  |--------------------------------------------------------------------------
  */

  verifyResetCode(
    payload: VerifyResetCodePayload,
    config: HttpRequestConfig = {},
  ): Promise<VerifyResetCodeResponse> {
    return httpClient.post<VerifyResetCodeResponse>(
      "/api/verify-reset-code",

      payload,

      "No se pudo validar el código.",

      {
        timeoutMs:
          30_000,

        ...config,
      },
    );
  },

  /*
  |--------------------------------------------------------------------------
  | CAMBIAR CONTRASEÑA
  |--------------------------------------------------------------------------
  */

  resetPassword(
    payload: ResetPasswordPayload,
    config: HttpRequestConfig = {},
  ): Promise<ResetPasswordResponse> {
    return httpClient.post<ResetPasswordResponse>(
      "/api/reset-password",

      payload,

      "No se pudo restablecer la contraseña.",

      {
        timeoutMs:
          30_000,

        ...config,
      },
    );
  },
};

export default passwordRecoveryService;