import { configCache, TTL } from "@/cache/configCache";
import { httpClient } from "@/http/httpClient";

import {
  AsignarEncomiendaPayload,
  Encomienda,
  EncomiendaCatalogos,
  EncomiendaMutationResponse,
  EncomiendaPayload,
  EncomiendaResponse,
  EncomiendaQrResponse,
  EncomiendaListFilters,
  EscanearEncomiendaQrPayload,
  EncomiendasResponse,
} from "../types/encomienda.types";

interface ClienteApi {
  id: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  nombre_completo: string;
  ci: string | null;
  telefono: string | null;
}

interface ClientesResponse {
  clientes: ClienteApi[];
}

interface ClienteMutationResponse {
  message: string;
  cliente: ClienteApi;
}

interface BackendEncomiendaPayload {
  id_viaje: number;
  id_remitente: number;
  id_destinatario: number;
  concepto: string | null;
  descuento: number;
  lugar_pago: "Origen" | "Destino";
  estado_pago: "Pendiente" | "Pagado";
  tipo_pago: "Efectivo" | "QR" | "Transferencia" | null;
  detalles: {
    detalle: string;
    cantidad: number;
    precio_unitario: number;
  }[];
}

/*
|--------------------------------------------------------------------------
| CACHE
|--------------------------------------------------------------------------
*/

const CACHE_KEYS = {
  lista: (clave: string) => `encomiendas:list:${clave}`,
};

const clavesListaEnCache = new Set<string>();

function claveLista(filtros: EncomiendaListFilters): string {
  return JSON.stringify({
    buscar: filtros.buscar?.trim() ?? "",
    estado: filtros.estado ?? "",
    page: filtros.page ?? 1,
    per_page: filtros.per_page ?? 15,
  });
}

function invalidarListas(): void {
  const claves = Array.from(clavesListaEnCache).map((clave) =>
    CACHE_KEYS.lista(clave),
  );

  if (claves.length > 0) {
    configCache.invalidate(...claves);
  }

  clavesListaEnCache.clear();
}

/*
|--------------------------------------------------------------------------
| NORMALIZAR NOMBRE
|--------------------------------------------------------------------------
*/

function normalizarTexto(valor: string): string {
  return valor
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase();
}

/*
|--------------------------------------------------------------------------
| DIVIDIR NOMBRE COMPLETO
|--------------------------------------------------------------------------
*/

function dividirNombreCompleto(nombreCompleto: string) {
  const partes = nombreCompleto
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean);

  if (partes.length < 2) {
    throw new Error("Ingrese al menos el nombre y apellido del cliente.");
  }

  if (partes.length === 2) {
    return {
      nombres: partes[0],
      apellido_paterno: partes[1],
      apellido_materno: null,
    };
  }

  if (partes.length === 3) {
    return {
      nombres: partes[0],
      apellido_paterno: partes[1],
      apellido_materno: partes[2],
    };
  }

  return {
    nombres: partes.slice(0, -2).join(" "),
    apellido_paterno: partes[partes.length - 2],
    apellido_materno: partes[partes.length - 1],
  };
}

/*
|--------------------------------------------------------------------------
| BUSCAR O CREAR CLIENTE
|--------------------------------------------------------------------------
*/

async function obtenerOCrearCliente(nombreCompleto: string): Promise<number> {
  const nombre = nombreCompleto.trim().replace(/\s+/g, " ");

  if (!nombre) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  const response = await httpClient.getAuth<ClientesResponse>(
    `/api/clientes?buscar=${encodeURIComponent(nombre)}`,
    "No se pudo buscar el cliente",
  );

  const buscado = normalizarTexto(nombre);

  const existente = response.clientes.find(
    (cliente) => normalizarTexto(cliente.nombre_completo) === buscado,
  );

  if (existente) {
    return existente.id;
  }

  const datos = dividirNombreCompleto(nombre);

  const creado = await httpClient.postAuth<ClienteMutationResponse>(
    "/api/clientes",
    {
      nombres: datos.nombres,
      apellido_paterno: datos.apellido_paterno,
      apellido_materno: datos.apellido_materno,
      ci: null,
      telefono: null,
    },
    "No se pudo registrar el cliente",
  );

  return creado.cliente.id;
}

/*
|--------------------------------------------------------------------------
| PAYLOAD PARA BACKEND
|--------------------------------------------------------------------------
*/

async function construirPayloadBackend(
  payload: EncomiendaPayload,
): Promise<BackendEncomiendaPayload> {
  const idRemitente = await obtenerOCrearCliente(payload.remitente);
  const idDestinatario = await obtenerOCrearCliente(payload.destinatario);

  if (idRemitente === idDestinatario) {
    throw new Error(
      "El remitente y el destinatario deben ser clientes diferentes.",
    );
  }

  const descripcion = payload.descripcion?.trim() ?? "";

  return {
    id_viaje: payload.id_viaje,
    id_remitente: idRemitente,
    id_destinatario: idDestinatario,
    concepto: descripcion || null,
    descuento: 0,
    lugar_pago: "Origen",
    estado_pago: "Pendiente",
    tipo_pago: null,
    detalles: [
      {
        detalle: descripcion || "Encomienda",
        cantidad: payload.cantidad,
        precio_unitario: payload.precio,
      },
    ],
  };
}

/*
|--------------------------------------------------------------------------
| NORMALIZAR RESPUESTA DEL BACKEND
|--------------------------------------------------------------------------
*/

function normalizarEncomienda(item: any): Encomienda {
  const detalles = Array.isArray(item.detalles) ? item.detalles : [];

  const cantidad = detalles.reduce(
    (total: number, detalle: any) =>
      total + Number(detalle?.cantidad ?? 0),
    0,
  );

  return {
    ...item,

    fecha: item.fecha ?? item.created_at ?? null,

    id_ruta: Number(
      item.id_ruta ??
      item.ruta?.id ??
      item.viaje?.ruta?.id ??
      0,
    ),

    remitente:
      typeof item.remitente === "string"
        ? item.remitente
        : item.remitente?.nombre_completo ?? "",

    destinatario:
      typeof item.destinatario === "string"
        ? item.destinatario
        : item.destinatario?.nombre_completo ?? "",

    origen:
      item.origen ??
      item.ruta?.origen ??
      item.viaje?.ruta?.origen ??
      "",

    destino:
      item.destino ??
      item.ruta?.destino ??
      item.viaje?.ruta?.destino ??
      "",

    ruta:
      item.ruta ??
      item.viaje?.ruta ??
      null,

    descripcion:
      item.descripcion ??
      item.concepto ??
      null,

    cantidad:
      item.cantidad ??
      cantidad,

    precio:
      String(
        item.precio ??
        item.total ??
        "0.00",
      ),

    estado:
      item.estado === "EN_ORIGEN"
        ? "REGISTRADA"
        : item.estado,

    qr_disponible:
      Boolean(item.qr_disponible),

    viaje: item.viaje
      ? {
          ...item.viaje,

          hora_inicio:
            item.viaje.hora_inicio ??
            null,

          ruta:
            item.viaje.ruta ??
            null,

          chofer: item.viaje.chofer
            ? {
                ...item.viaje.chofer,
                ci: item.viaje.chofer.ci ?? null,
                carnet_sindical:
                  item.viaje.chofer.carnet_sindical ?? null,
              }
            : null,

          vehiculo: item.viaje.vehiculo
            ? {
                ...item.viaje.vehiculo,
                tipo: item.viaje.vehiculo.tipo ?? null,
                marca: item.viaje.vehiculo.marca ?? null,
                modelo: item.viaje.vehiculo.modelo ?? null,
                color: item.viaje.vehiculo.color ?? null,
              }
            : null,
        }
      : null,
  } as Encomienda;
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

export const encomiendaService = {
  /*
  |--------------------------------------------------------------------------
  | LISTAR
  |--------------------------------------------------------------------------
  */

  async listar(
    filtros: EncomiendaListFilters = {},
    force = false,
  ): Promise<EncomiendasResponse> {
    if (force) {
      invalidarListas();
    }

    const params = new URLSearchParams();
    const buscar = filtros.buscar?.trim();

    if (buscar) {
      params.append("buscar", buscar);
    }

    if (filtros.estado) {
      params.append("estado", filtros.estado);
    }

    params.append("page", String(filtros.page ?? 1));
    params.append("per_page", String(filtros.per_page ?? 15));

    const query = params.toString();
    const clave = claveLista(filtros);

    clavesListaEnCache.add(clave);

    const response =
      await configCache.remember<EncomiendasResponse>(
        CACHE_KEYS.lista(clave),
        TTL.lista,
        () =>
          httpClient.getAuth<EncomiendasResponse>(
            `/api/encomiendas?${query}`,
            "No se pudieron cargar las encomiendas",
          ),
      );

    return {
      ...response,
      encomiendas: response.encomiendas.map(normalizarEncomienda),
    };
  },

  /*
  |--------------------------------------------------------------------------
  | OBTENER
  |--------------------------------------------------------------------------
  */

  async obtener(id: number): Promise<Encomienda> {
    const response = await httpClient.getAuth<EncomiendaResponse>(
      `/api/encomiendas/${id}`,
      "No se pudo cargar la encomienda",
    );

    return normalizarEncomienda(response.encomienda);
  },

  /*
  |--------------------------------------------------------------------------
  | BUSCAR POR GUÍA
  |--------------------------------------------------------------------------
  */

  async buscarPorGuia(guia: string): Promise<Encomienda> {
    const valor = guia.trim();

    const response = await httpClient.getAuth<EncomiendaResponse>(
      `/api/encomiendas/guia/${encodeURIComponent(valor)}`,
      "No se encontró la encomienda",
    );

    return normalizarEncomienda(response.encomienda);
  },

  /*
  |--------------------------------------------------------------------------
  | CATÁLOGOS
  |--------------------------------------------------------------------------
  */

  async catalogos(): Promise<EncomiendaCatalogos> {
    return httpClient.getAuth<EncomiendaCatalogos>(
      "/api/encomiendas/catalogos",
      "No se pudieron cargar los datos para asignar la encomienda",
    );
  },

  /*
  |--------------------------------------------------------------------------
  | CREAR
  |--------------------------------------------------------------------------
  */

  async crear(
    payload: EncomiendaPayload,
  ): Promise<EncomiendaMutationResponse> {
    const backendPayload = await construirPayloadBackend(payload);

    const response =
      await httpClient.postAuth<EncomiendaMutationResponse>(
        "/api/encomiendas",
        backendPayload,
        "No se pudo registrar la encomienda",
      );

    invalidarListas();

    return {
      ...response,
      encomienda: normalizarEncomienda(response.encomienda),
    };
  },

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR
  |--------------------------------------------------------------------------
  */

  async actualizar(
    id: number,
    payload: EncomiendaPayload,
  ): Promise<EncomiendaMutationResponse> {
    const backendPayload = await construirPayloadBackend(payload);

    const {
      id_viaje: _idViaje,
      ...payloadActualizacion
    } = backendPayload;

    const response =
      await httpClient.putAuth<EncomiendaMutationResponse>(
        `/api/encomiendas/${id}`,
        payloadActualizacion,
        "No se pudo actualizar la encomienda",
      );

    invalidarListas();

    return {
      ...response,
      encomienda: normalizarEncomienda(response.encomienda),
    };
  },

  /*
  |--------------------------------------------------------------------------
  | ASIGNAR
  |--------------------------------------------------------------------------
  */

  async asignar(
    id: number,
    payload: AsignarEncomiendaPayload,
  ): Promise<EncomiendaMutationResponse> {
    const response =
      await httpClient.putAuth<EncomiendaMutationResponse>(
        `/api/encomiendas/${id}/asignar`,
        payload,
        "No se pudo asignar la encomienda",
      );

    invalidarListas();

    return {
      ...response,
      encomienda: normalizarEncomienda(response.encomienda),
    };
  },

  /*
  |--------------------------------------------------------------------------
  | ENTREGAR
  |--------------------------------------------------------------------------
  */

  async entregar(
    id: number,
  ): Promise<EncomiendaMutationResponse> {
    const response =
      await httpClient.putAuth<EncomiendaMutationResponse>(
        `/api/encomiendas/${id}/entregar`,
        {},
        "No se pudo entregar la encomienda",
      );

    invalidarListas();

    return {
      ...response,
      encomienda: normalizarEncomienda(response.encomienda),
    };
  },

  /*
  |--------------------------------------------------------------------------
  | ANULAR
  |--------------------------------------------------------------------------
  */

  async anular(
    id: number,
  ): Promise<EncomiendaMutationResponse> {
    const response =
      await httpClient.putAuth<EncomiendaMutationResponse>(
        `/api/encomiendas/${id}/anular`,
        {},
        "No se pudo anular la encomienda",
      );

    invalidarListas();

    return {
      ...response,
      encomienda: normalizarEncomienda(response.encomienda),
    };
  },

  /*
  |--------------------------------------------------------------------------
  | OBTENER QR
  |--------------------------------------------------------------------------
  */

  async obtenerQr(
    id: number,
  ): Promise<EncomiendaQrResponse> {
    const response =
      await httpClient.getAuth<EncomiendaQrResponse>(
        `/api/encomiendas/${id}/qr`,
        "No se pudo generar el QR de la encomienda",
      );

    return {
      ...response,
      encomienda: normalizarEncomienda(response.encomienda),
    };
  },

  /*
  |--------------------------------------------------------------------------
  | ESCANEAR QR
  |--------------------------------------------------------------------------
  */

  async escanearQr(
    payload: EscanearEncomiendaQrPayload,
  ): Promise<Encomienda> {
    const response =
      await httpClient.postAuth<EncomiendaResponse>(
        "/api/encomiendas/qr/escanear",
        payload,
        "No se pudo consultar el QR de la encomienda",
      );

    return normalizarEncomienda(response.encomienda);
  },

  /*
  |--------------------------------------------------------------------------
  | HTML DE IMPRESIÓN QR
  |--------------------------------------------------------------------------
  */

  async obtenerTicketQrHtml(
    id: number,
    tipo: "etiqueta" | "comprobante" = "etiqueta",
  ): Promise<string> {
    const response = await httpClient._rawFetch(
      `/api/encomiendas/${id}/qr/ticket-html?tipo=${tipo}`,
      "text/html",
      { timeoutMs: 15000 },
    );

    return response.text();
  },

  /*
  |--------------------------------------------------------------------------
  | INVALIDAR CACHE
  |--------------------------------------------------------------------------
  */

  invalidarCache(): void {
    invalidarListas();
  },
};