import { httpClient } from "@/http/httpClient";
import { configCache, TTL } from "@/cache/configCache";
import {
  AsientosResponse,
  ViajesResponse,
  VentaResponse,
  Venta,
  Viaje,
  ViajeEstado,
  PeticionIniciarVenta,
  ConfirmarPasajero,
} from "../types/pasajes.types";

/*
|--------------------------------------------------------------------------
| CACHE
|--------------------------------------------------------------------------
*/

const PASAJES_CACHE = {
  viajes: () => "pasajes:viajes",
  asientos: (idViaje: number) => `pasajes:asientos:${idViaje}`,
  venta: (idVenta: number) => `pasajes:venta:${idVenta}`,
};

/*
|--------------------------------------------------------------------------
| LEER CACHE
|--------------------------------------------------------------------------
*/

export function getViajesCache(): ViajesResponse | null {
  return configCache.get<ViajesResponse>(PASAJES_CACHE.viajes()) ?? null;
}

export function getAsientosCache(idViaje: number): AsientosResponse | null {
  return (
    configCache.get<AsientosResponse>(PASAJES_CACHE.asientos(idViaje)) ?? null
  );
}

export function getVentaCache(idVenta: number): VentaResponse | null {
  return configCache.get<VentaResponse>(PASAJES_CACHE.venta(idVenta)) ?? null;
}

/*
|--------------------------------------------------------------------------
| WRITE THROUGH CACHE
|--------------------------------------------------------------------------
*/

function sincronizarViajeEnCache(viaje: Viaje): void {
  const listado = getViajesCache();
  if (!listado) return;

  const existe = listado.data.some((v) => v.id === viaje.id);
  const data = existe
    ? listado.data.map((v) => (v.id === viaje.id ? viaje : v))
    : [viaje, ...listado.data];

  configCache.set<ViajesResponse>(
    PASAJES_CACHE.viajes(),
    { ...listado, data },
    TTL.lista,
  );
}

function sincronizarVentaEnCache(venta: Venta): void {
  configCache.set<VentaResponse>(
    PASAJES_CACHE.venta(venta.id),
    { data: venta },
    TTL.lista,
  );
}

/*
|--------------------------------------------------------------------------
| INVALIDAR CACHE
|--------------------------------------------------------------------------
*/

export function invalidarCachePasajes(): void {
  configCache.invalidate(PASAJES_CACHE.viajes());
}

export function invalidarCacheAsientos(idViaje: number): void {
  configCache.invalidate(PASAJES_CACHE.asientos(idViaje));
}

export function invalidarCacheVenta(idVenta: number): void {
  configCache.invalidate(PASAJES_CACHE.venta(idVenta));
}

/*
|--------------------------------------------------------------------------
| LISTAR VIAJES
|--------------------------------------------------------------------------
*/

export async function getViajes(filtros?: {
  origen?: string;
  destino?: string;
  fecha?: string;
  estado?: string;
  vehiculo_id?: number;
  chofer_id?: number;
  per_page?: number;
}): Promise<ViajesResponse> {
  const params = new URLSearchParams();
  if (filtros?.origen) params.append("origen", filtros.origen);
  if (filtros?.destino) params.append("destino", filtros.destino);
  if (filtros?.fecha) params.append("fecha", filtros.fecha);
  if (filtros?.estado) params.append("estado", filtros.estado);
  if (filtros?.vehiculo_id)
    params.append("vehiculo_id", String(filtros.vehiculo_id));
  if (filtros?.chofer_id) params.append("chofer_id", String(filtros.chofer_id));
  if (filtros?.per_page) params.append("per_page", String(filtros.per_page));

  const query = params.toString();
  const url = `/api/pasajes/viajes${query ? `?${query}` : ""}`;

  return configCache.remember<ViajesResponse>(
    PASAJES_CACHE.viajes(),
    TTL.lista,
    () => httpClient.getAuth<ViajesResponse>(url, "Error al cargar viajes"),
  );
}

/*
|--------------------------------------------------------------------------
| CREAR VIAJE
|--------------------------------------------------------------------------
*/

export async function crearViaje(idVehiculoChoferRuta: number): Promise<Viaje> {
  const response = await httpClient.postAuth<{ data: Viaje }>(
    "/api/pasajes/viajes",
    { id_vehiculo_chofer_ruta: idVehiculoChoferRuta },
    "Error al crear viaje",
  );
  sincronizarViajeEnCache(response.data);
  return response.data;
}

/*
|--------------------------------------------------------------------------
| CAMBIAR ESTADO DEL VIAJE
|--------------------------------------------------------------------------
*/

export async function cambiarEstadoViaje(
  id: number,
  estado: ViajeEstado,
): Promise<Viaje> {
  const response = await httpClient.putAuth<{ data: Viaje }>(
    `/api/pasajes/viajes/${id}/estado`,
    { estado },
    "Error al cambiar estado del viaje",
  );
  sincronizarViajeEnCache(response.data);
  return response.data;
}

/*
|--------------------------------------------------------------------------
| OBTENER ASIENTOS
|--------------------------------------------------------------------------
*/

export async function getAsientos(idViaje: number): Promise<AsientosResponse> {
  return configCache.remember<AsientosResponse>(
    PASAJES_CACHE.asientos(idViaje),
    TTL.lista,
    () =>
      httpClient.getAuth<AsientosResponse>(
        `/api/pasajes/viajes/${idViaje}/asientos`,
        "Error al cargar asientos",
      ),
  );
}

/*
|--------------------------------------------------------------------------
| INICIAR VENTA
|--------------------------------------------------------------------------
*/

export async function iniciarVenta(
  payload: PeticionIniciarVenta,
): Promise<VentaResponse> {
  const response = await httpClient.postAuth<VentaResponse>(
    "/api/pasajes/ventas/iniciar",
    payload,
    "Error al iniciar venta",
  );
  // Al reservar asientos, la disponibilidad cambia, invalidamos el cache del mapa de asientos
  invalidarCacheAsientos(payload.id_viaje);
  sincronizarVentaEnCache(response.data);
  return response;
}

/*
|--------------------------------------------------------------------------
| CONFIRMAR VENTA
|--------------------------------------------------------------------------
*/

export async function confirmarVenta(
  ventaId: number,
  formaPago: string,
  pasajeros: ConfirmarPasajero[],
): Promise<VentaResponse> {
  const response = await httpClient.putAuth<VentaResponse>(
    `/api/pasajes/ventas/${ventaId}/confirmar`,
    { forma_pago: formaPago, pasajeros },
    "Error al confirmar venta",
  );
  sincronizarVentaEnCache(response.data);
  return response;
}

/*
|--------------------------------------------------------------------------
| OBTENER VENTA POR ID
|--------------------------------------------------------------------------
*/

export async function getVenta(ventaId: number): Promise<VentaResponse> {
  return configCache.remember<VentaResponse>(
    PASAJES_CACHE.venta(ventaId),
    TTL.lista,
    () =>
      httpClient.getAuth<VentaResponse>(
        `/api/pasajes/ventas/${ventaId}`,
        "Error al cargar la venta",
      ),
  );
}

/*
|--------------------------------------------------------------------------
| CANCELAR VENTA
|--------------------------------------------------------------------------
*/

export async function cancelarVenta(
  ventaId: number,
): Promise<{ success: boolean; message: string }> {
  const response = await httpClient.postAuth<{
    success: boolean;
    message: string;
  }>(`/api/pasajes/ventas/${ventaId}/cancelar`, {}, "Error al cancelar venta");
  invalidarCacheVenta(ventaId);
  return response;
}

/*
|--------------------------------------------------------------------------
| ANULAR VENTA
|--------------------------------------------------------------------------
*/

export async function anularVenta(
  ventaId: number,
): Promise<{ success: boolean; message: string }> {
  const response = await httpClient.postAuth<{
    success: boolean;
    message: string;
  }>(`/api/pasajes/ventas/${ventaId}/anular`, {}, "Error al anular venta");
  invalidarCacheVenta(ventaId);
  return response;
}

/*
|--------------------------------------------------------------------------
| ELIMINAR DETALLE
|--------------------------------------------------------------------------
*/

export async function eliminarDetalle(
  detalleId: number,
): Promise<{ success: boolean; message: string }> {
  return httpClient.deleteAuth<{ success: boolean; message: string }>(
    `/api/pasajes/detalles/${detalleId}`,
    "Error al eliminar detalle",
  );
}

/*
|--------------------------------------------------------------------------
| CAMBIAR ASIENTO
|--------------------------------------------------------------------------
*/

export async function cambiarAsiento(
  detalleId: number,
  nuevoIdAsiento: number,
): Promise<{ success: boolean; data: Venta }> {
  const response = await httpClient.putAuth<{ success: boolean; data: Venta }>(
    `/api/pasajes/detalles/${detalleId}/cambiar-asiento`,
    { nuevo_id_asiento: nuevoIdAsiento },
    "Error al cambiar asiento",
  );
  sincronizarVentaEnCache(response.data);
  return response;
}

/*
|--------------------------------------------------------------------------
| DESCARGAR PDF
|--------------------------------------------------------------------------
*/

export async function descargarPdf(ventaId: number): Promise<Blob> {
  const response = await httpClient._rawFetch(
    `/api/pasajes/ventas/${ventaId}/pdf`,
    "application/pdf",
    { timeoutMs: 60000 },
  );
  return response.blob();
}
