// services/baneco/baneco.types.ts

/*
|--------------------------------------------------------------------------
| TIPOS BANECO — API QR
|--------------------------------------------------------------------------
|
| Solo se modelan los 3 endpoints usados en la app:
|   1. POST /api/baneco/qr            → generar
|   2. POST /api/baneco/qr/verificar → verificar
|   3. POST /api/baneco/qr/anular    → anular
|
| El listado de pagos por fecha (POST /api/baneco/qr/pago)
| NO se expone aquí: no lo necesita el flujo de venta.
|
*/

export type BanecoCurrency = "BOB" | "USD";

export interface BanecoEmpresaAuth {
  token: string;
}

/* -------------------------------------------------------------------------- */
/* 1. GENERAR                                                                */
/* -------------------------------------------------------------------------- */

export interface BanecoQrGenerateRequest {
  empresa: BanecoEmpresaAuth;

  qr: {
    monto: number;
    moneda: BanecoCurrency;
    descripcion?: string;
    branchCode?: string;
    codigoServicio?: string;
  };
}

export interface BanecoQrGenerateResponse {
  ok: boolean;
  qr_id: string;
  transaction_id: string;
  qr_image: string; // "data:image/png;base64,..."
}

/* -------------------------------------------------------------------------- */
/* 2. VERIFICAR                                                               */
/* -------------------------------------------------------------------------- */

export interface BanecoQrVerifyRequest {
  empresa: BanecoEmpresaAuth;
  qr: { qr_id: string };
}

export interface BanecoQrVerifyResponse {
  ok: boolean;
  qr_id: string;

  /**
   * 1 = pagado. Cualquier otro valor = pendiente / anulado.
   * El backend Baneco usa `1` como "PAGADO".
   */
  estado: number;

  fechaPago?: string;
  payment?: Record<string, unknown>;
}

/* -------------------------------------------------------------------------- */
/* 3. ANULAR                                                                  */
/* -------------------------------------------------------------------------- */

export interface BanecoQrAnnulRequest {
  empresa: BanecoEmpresaAuth;
  qr: { qr_id: string };
}

export interface BanecoQrAnnulResponse {
  ok: boolean;
  qr_id: string;
  message: string;
  responseCode: number;
}
