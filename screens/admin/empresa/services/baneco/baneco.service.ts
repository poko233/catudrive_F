// services/baneco/baneco.service.ts

import type {
  BanecoCurrency,
  BanecoQrAnnulResponse,
  BanecoQrGenerateResponse,
  BanecoQrVerifyResponse,
} from "./baneco.types";

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN EXTERNA (SISTEMA PAYQR)
|--------------------------------------------------------------------------
*/

const BANECO_BASE_URL = (
  process.env.EXPO_PUBLIC_BANECO_API_URL ??
  "https://sistemapayqr.metasoft-bolivia.com"
).replace(/\/+$/, "");

async function banecoFetch<T>(
  path: string,
  body: unknown,
  fallbackError: string,
  signal?: AbortSignal,
): Promise<T> {
  try {
    const response = await fetch(`${BANECO_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      // ignore
    }

    if (!response.ok) {
      throw new Error(data?.message || fallbackError);
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(fallbackError);
  }
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

export const banecoService = {
  generateQr: async (
    input: {
      token: string;
      monto: number;
      moneda: BanecoCurrency;
      descripcion?: string;
      branchCode?: string;
      codigoServicio?: string;
    },
    signal?: AbortSignal,
  ): Promise<BanecoQrGenerateResponse> => {
    return banecoFetch<BanecoQrGenerateResponse>(
      "/api/baneco/qr",
      {
        empresa: { token: input.token },
        qr: {
          monto: input.monto,
          moneda: input.moneda,
          descripcion: input.descripcion,
          branchCode: input.branchCode,
          codigoServicio: input.codigoServicio,
        },
      },
      "No se pudo generar el código QR de pago",
      signal,
    );
  },

  verifyQr: async (
    token: string,
    qrId: string,
    signal?: AbortSignal,
  ): Promise<BanecoQrVerifyResponse> => {
    return banecoFetch<BanecoQrVerifyResponse>(
      "/api/baneco/qr/verificar",
      {
        empresa: { token },
        qr: { qr_id: qrId },
      },
      "No se pudo verificar el estado del QR",
      signal,
    );
  },

  annulQr: async (
    token: string,
    qrId: string,
    signal?: AbortSignal,
  ): Promise<BanecoQrAnnulResponse> => {
    return banecoFetch<BanecoQrAnnulResponse>(
      "/api/baneco/qr/anular",
      {
        empresa: { token },
        qr: { qr_id: qrId },
      },
      "No se pudo anular el código QR",
      signal,
    );
  },
};

export default banecoService;

export function isQrPaid(response: BanecoQrVerifyResponse): boolean {
  return response.ok === true && response.estado === 1;
}
