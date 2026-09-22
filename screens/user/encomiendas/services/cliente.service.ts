import { httpClient } from "@/http/httpClient";
import { Cliente, ClientePayload, ClienteResponse, ClientesResponse } from "../types/encomienda.types";

export const clienteService = {
  async buscar(q = ""): Promise<Cliente[]> {
    const query = q.trim() ? `?buscar=${encodeURIComponent(q.trim())}` : "";
    const response = await httpClient.getAuth<ClientesResponse>(
      `/api/clientes${query}`,
      "No se pudieron cargar los clientes",
    );
    return response.clientes ?? [];
  },

  async crear(payload: ClientePayload): Promise<Cliente> {
    const response = await httpClient.postAuth<ClienteResponse>(
      "/api/clientes",
      payload,
      "No se pudo registrar el cliente",
    );
    return response.cliente;
  },
};
