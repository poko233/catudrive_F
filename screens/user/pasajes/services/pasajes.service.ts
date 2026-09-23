import { httpClient } from "@/http/httpClient";
import { configCache, TTL } from "@/cache/configCache";
import { normalizarPisosNumeracion } from "../utils/asientoPiso";
import {
  AsientosResponse,
  ViajesResponse,
  VentaResponse,
  Venta,
  Viaje,
  ViajeEstado,
  PeticionIniciarVenta,
  ConfirmarPasajero,
  FiltrosViajes,
} from "../types/pasajes.types";

/*
|--------------------------------------------------------------------------
| CACHE
|--------------------------------------------------------------------------
*/

const PASAJES_CACHE = {
  viajes: () => "pasajes:viajes",
  viajesPagina: (clave: string) => `pasajes:viajes:${clave}`,
  asientos: (idViaje: number) => `pasajes:asientos:${idViaje}`,
  venta: (idVenta: number) => `pasajes:venta:${idVenta}`,
};

/*
|--------------------------------------------------------------------------
| CLAVES DE PÁGINAS DE VIAJES EN CACHE
|--------------------------------------------------------------------------
|
| Cada combinación filtros+página+per_page tiene su propia
| entrada (página 1, 2, ... se acumulan en cache).
|
| Se registran para poder invalidarlas todas juntas
| cuando un viaje se crea o cambia de estado.
|
*/

const clavesViajesEnCache = new Set<string>();

function registrarClaveViajes(clave: string): void {
  clavesViajesEnCache.add(clave);
}

function claveFiltrosViajes(filtros: FiltrosViajes): string {
  const partes = [
    filtros.origen?.trim() ?? "",
    filtros.destino?.trim() ?? "",
    filtros.fecha?.trim() ?? "",
    filtros.estado?.trim() ?? "",
    filtros.vehiculo_id !== undefined ? String(filtros.vehiculo_id) : "",
    filtros.chofer_id !== undefined ? String(filtros.chofer_id) : "",
    filtros.per_page !== undefined ? String(filtros.per_page) : "",
    filtros.page !== undefined ? String(filtros.page) : "",
  ];
  return partes.join("|").toLowerCase();
}

/*
|--------------------------------------------------------------------------
| LEER CACHE
|--------------------------------------------------------------------------
*/

export function getViajesCache(): ViajesResponse | null {
  return configCache.get<ViajesResponse>(PASAJES_CACHE.viajes()) ?? null;
}

export function getViajesPaginaCache(
  filtros: FiltrosViajes,
): ViajesResponse | null {
  return (
    configCache.get<ViajesResponse>(
      PASAJES_CACHE.viajesPagina(claveFiltrosViajes(filtros)),
    ) ?? null
  );
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
  // Invalida la entrada legacy y TODAS las páginas/filtros
  // cacheados (página 1, 2, ...) para forzar refetch fresco.
  const claves = [PASAJES_CACHE.viajes()];
  for (const clave of clavesViajesEnCache) {
    claves.push(PASAJES_CACHE.viajesPagina(clave));
  }
  clavesViajesEnCache.clear();
  configCache.invalidate(...claves);
}

export function invalidarCacheAsientos(idViaje: number): void {
  configCache.invalidate(PASAJES_CACHE.asientos(idViaje));
}

export function invalidarCacheVenta(idVenta: number): void {
  configCache.invalidate(PASAJES_CACHE.venta(idVenta));
}

/*
|--------------------------------------------------------------------------
| LISTAR VIAJES (BÚSQUEDA MULTIPARAMÉTRICA + PAGINACIÓN SERVIDOR)
|--------------------------------------------------------------------------
|
| Cada combinación filtros+página+per_page tiene su propia
| entrada de cache: la página 1, 2, ... se acumulan y al
| volver a una página ya pedida no se repite la petición.
|
*/

export async function getViajes(
  filtros: FiltrosViajes = {},
  options: { force?: boolean } = {},
): Promise<ViajesResponse> {
  const params = new URLSearchParams();
  const origen = filtros.origen?.trim();
  const destino = filtros.destino?.trim();
  const fecha = filtros.fecha?.trim();
  const estado = filtros.estado?.trim();
  if (origen) params.append("origen", origen);
  if (destino) params.append("destino", destino);
  if (fecha) params.append("fecha", fecha);
  if (estado) params.append("estado", estado);
  if (filtros.vehiculo_id !== undefined)
    params.append("vehiculo_id", String(filtros.vehiculo_id));
  if (filtros.chofer_id !== undefined)
    params.append("chofer_id", String(filtros.chofer_id));
  if (filtros.per_page !== undefined)
    params.append("per_page", String(filtros.per_page));
  if (filtros.page !== undefined) params.append("page", String(filtros.page));

  const query = params.toString();
  const url = `/api/pasajes/viajes${query ? `?${query}` : ""}`;
  const clave = claveFiltrosViajes(filtros);
  registrarClaveViajes(clave);

  // force: invalida la entrada para pegar al backend
  // (botón Actualizar). Sin force se sirve el caché.
  if (options.force) {
    configCache.invalidate(PASAJES_CACHE.viajesPagina(clave));
  }

  return configCache.remember<ViajesResponse>(
    PASAJES_CACHE.viajesPagina(clave),
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
  // El nuevo viaje altera totales y páginas: se invalidan todas
  // las páginas/filtros cacheados y la pantalla hace refetch.
  invalidarCachePasajes();
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
  // El viaje puede salir/entrar de la lista filtrada por estado:
  // se invalidan todas las páginas/filtros y la pantalla refetch.
  invalidarCachePasajes();
  return response.data;
}

/*
|--------------------------------------------------------------------------
| OBTENER ASIENTOS
|--------------------------------------------------------------------------
*/

export async function getAsientos(
  idViaje: number,
  options: { force?: boolean } = {},
): Promise<AsientosResponse> {
  if (options.force) {
    invalidarCacheAsientos(idViaje);
  }

  const response = await configCache.remember<AsientosResponse>(
    PASAJES_CACHE.asientos(idViaje),
    TTL.lista,
    () =>
      httpClient.getAuth<AsientosResponse>(
        `/api/pasajes/viajes/${idViaje}/asientos`,
        "Error al cargar asientos",
      ),
  );

  /*
  |--------------------------------------------------------------------------
  | NUMERACIÓN COMO EL MODAL DE VEHÍCULO
  |--------------------------------------------------------------------------
  |
  | El backend numera todas las celdas (los no-pasajeros
  | consumen números y se ven saltos 7→10). Se reenumera
  | pasajeros 1..N fila-major, igual que el modal.
  |
  */

  return {
    ...response,
    data: normalizarPisosNumeracion(response.data ?? []),
  };
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

/*
|--------------------------------------------------------------------------
| IMPRIMIR TICKET HTML
|--------------------------------------------------------------------------
|
| El endpoint devuelve HTML con estilos para impresora térmica 58mm
| y ejecuta window.print() automáticamente.
|
| Para usarlo en web, hacemos fetch con el token y luego abrimos
| una ventana con el HTML recibido.
|
*/

export async function obtenerTicketHtml(ventaId: number): Promise<string> {
  const response = await httpClient._rawFetch(
    `/api/pasajes/ventas/${ventaId}/ticket-html`,
    "text/html",
    { timeoutMs: 15000 },
  );
  return response.text();
}
export interface ProximaHoraViaje {
  id_ruta: number;

  fecha: string;

  hora: string;

  fecha_hora: string;

  intervalo_minutos: number;
}

/*
|--------------------------------------------------------------------------
| PRÓXIMA HORA DISPONIBLE PARA UNA RUTA
|--------------------------------------------------------------------------
*/

export async function getProximaHoraViaje(
  idRuta: number,
): Promise<ProximaHoraViaje> {
  const response =
    await httpClient.getAuth<{
      data:
        ProximaHoraViaje;
    }>(
      `/api/pasajes/viajes/proxima-hora/${idRuta}`,

      "No se pudo calcular la próxima hora del viaje.",
    );

  return response.data;
}

/*
|--------------------------------------------------------------------------
| CREAR VIAJE + RELACIÓN
|--------------------------------------------------------------------------
*/

export async function crearViajeProgramado(
  payload: {
    id_asignacion_vehiculo_chofer:
      number;

    id_ruta:
      number;
  },
): Promise<Viaje> {
  const response =
    await httpClient.postAuth<{
      data:
        Viaje;
    }>(
      "/api/pasajes/viajes",

      payload,

      "Error al crear viaje",
    );

  invalidarCachePasajes();

  return response.data;
}