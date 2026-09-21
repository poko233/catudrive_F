import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Toast from "react-native-toast-message";

import {
  encomiendaService,
} from "../services/encomienda.service";

import {
  AsignarEncomiendaPayload,
  Encomienda,
  EncomiendaCatalogos,
  EncomiendaListFilters,
  EncomiendaPaginationMeta,
  EncomiendaPayload,
  EncomiendaUpdatePayload,
  EncomiendaQrResponse,
  EncomiendaResumen,
} from "../types/encomienda.types";

function errorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

const RESUMEN_VACIO: EncomiendaResumen = {
  total: 0,
  enOrigen: 0,
  enDestino: 0,
  enTransito: 0,
  entregadas: 0,
  anuladas: 0,
  ingresos: 0,
};

export function useEncomiendas(
  perPage = 15,
) {
  const [encomiendas, setEncomiendas] = useState<Encomienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [catalogos, setCatalogos] = useState<EncomiendaCatalogos | null>(null);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [meta, setMeta] = useState<EncomiendaPaginationMeta | null>(null);
  const [resumen, setResumen] = useState<EncomiendaResumen>(RESUMEN_VACIO);
  const [pagina, setPagina] = useState(1);
  const [filtros, setFiltros] = useState<EncomiendaListFilters>({});

  const secuencia = useRef(0);

  const fetchEncomiendas = useCallback(
    async (
      filtrosActuales: EncomiendaListFilters,
      paginaActual: number,
      force = false,
    ) => {
      const ticket = ++secuencia.current;
      setLoading(true);

      try {
        const response = await encomiendaService.listar(
          {
            ...filtrosActuales,
            page: paginaActual,
            per_page: perPage,
          },
          force,
        );

        if (ticket !== secuencia.current) return;

        if (
          response.encomiendas.length === 0 &&
          paginaActual > 1 &&
          response.meta.total > 0
        ) {
          const paginaAnterior = Math.max(
            1,
            Math.min(
              paginaActual - 1,
              response.meta.last_page,
            ),
          );

          const anterior = await encomiendaService.listar(
            {
              ...filtrosActuales,
              page: paginaAnterior,
              per_page: perPage,
            },
            false,
          );

          if (ticket !== secuencia.current) return;

          setEncomiendas(anterior.encomiendas);
          setMeta(anterior.meta);
          setResumen(anterior.resumen);
          setPagina(anterior.meta.current_page);
          return;
        }

        setEncomiendas(response.encomiendas);
        setMeta(response.meta);
        setResumen(response.resumen);
        setPagina(response.meta.current_page);
      } catch (error) {
        if (ticket !== secuencia.current) return;

        Toast.show({
          type: "error",
          text1: "No se pudieron cargar las encomiendas",
          text2: errorMessage(error, "Intenta nuevamente."),
        });
      } finally {
        if (ticket === secuencia.current) {
          setLoading(false);
        }
      }
    },
    [perPage],
  );

  useEffect(() => {
    void fetchEncomiendas(
      {},
      1,
      false,
    );
  }, [fetchEncomiendas]);

  const cambiarFiltros = useCallback(
    (nuevos: EncomiendaListFilters) => {
      const normalizados: EncomiendaListFilters = {};
      const buscar = nuevos.buscar?.trim();

      if (buscar) {
        normalizados.buscar = buscar;
      }

      if (nuevos.estado) {
        normalizados.estado = nuevos.estado;
      }

      setFiltros(normalizados);
      setPagina(1);
      void fetchEncomiendas(normalizados, 1, false);
    },
    [fetchEncomiendas],
  );

  const irAPagina = useCallback(
    (nuevaPagina: number) => {
      const destino = Math.max(1, Math.floor(nuevaPagina) || 1);
      const ultima = meta?.last_page ?? destino;
      const paginaFinal = Math.min(destino, Math.max(1, ultima));

      if (paginaFinal === pagina) return;

      setPagina(paginaFinal);
      void fetchEncomiendas(filtros, paginaFinal, false);
    },
    [fetchEncomiendas, filtros, meta?.last_page, pagina],
  );

  const recargarActual = useCallback(
    async (force = true) => {
      await fetchEncomiendas(
        filtros,
        pagina,
        force,
      );
    },
    [fetchEncomiendas, filtros, pagina],
  );

  const crear = useCallback(
    async (
      payload: EncomiendaPayload,
    ): Promise<boolean> => {
      setSaving(true);

      try {
        const response = await encomiendaService.crear(payload);

        setPagina(1);
        await fetchEncomiendas(filtros, 1, true);

        Toast.show({
          type: "success",
          text1: "Encomienda registrada",
          text2: response.message,
        });

        return true;
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "No se pudo registrar la encomienda",
          text2: errorMessage(error, "Revisa los datos ingresados."),
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fetchEncomiendas, filtros],
  );

  const actualizar = useCallback(
    async (
      encomienda: Encomienda,
      payload: EncomiendaUpdatePayload,
    ): Promise<boolean> => {
      setSaving(true);
      setProcessingId(encomienda.id);

      try {
        const response = await encomiendaService.actualizar(
          encomienda.id,
          payload,
        );

        await recargarActual(true);

        Toast.show({
          type: "success",
          text1: "Encomienda actualizada",
          text2: response.message,
        });

        return true;
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "No se pudo actualizar la encomienda",
          text2: errorMessage(error, "Revisa los datos ingresados."),
        });
        return false;
      } finally {
        setSaving(false);
        setProcessingId(null);
      }
    },
    [recargarActual],
  );

  const cargarCatalogos = useCallback(
    async (): Promise<boolean> => {
      setLoadingCatalogos(true);

      try {
        const data = await encomiendaService.catalogos();
        setCatalogos(data);
        return true;
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "No se pudieron cargar los datos",
          text2: errorMessage(
            error,
            "No fue posible cargar los viajes disponibles.",
          ),
        });
        return false;
      } finally {
        setLoadingCatalogos(false);
      }
    },
    [],
  );

  const asignar = useCallback(
    async (
      encomienda: Encomienda,
      payload: AsignarEncomiendaPayload,
    ): Promise<boolean> => {
      setSaving(true);
      setProcessingId(encomienda.id);

      try {
        const response = await encomiendaService.asignar(
          encomienda.id,
          payload,
        );

        await recargarActual(true);

        Toast.show({
          type: "success",
          text1: "Encomienda asignada",
          text2: response.message,
        });

        return true;
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "No se pudo asignar la encomienda",
          text2: errorMessage(
            error,
            "Revisa la ruta, el vehículo y el chofer.",
          ),
        });
        return false;
      } finally {
        setSaving(false);
        setProcessingId(null);
      }
    },
    [recargarActual],
  );

  const cambiarEstado = useCallback(
    async (encomienda: Encomienda, estado: "EN_TRANSITO" | "EN_DESTINO"): Promise<boolean> => {
      setProcessingId(encomienda.id);
      try {
        const response = await encomiendaService.cambiarEstado(encomienda.id, { estado });
        await recargarActual(true);
        Toast.show({ type: "success", text1: "Estado actualizado", text2: response.message });
        return true;
      } catch (error) {
        Toast.show({ type: "error", text1: "No se pudo cambiar el estado", text2: errorMessage(error, "Intenta nuevamente.") });
        return false;
      } finally {
        setProcessingId(null);
      }
    },
    [recargarActual],
  );

  const entregar = useCallback(
    async (
      encomienda: Encomienda,
    ): Promise<boolean> => {
      setProcessingId(encomienda.id);

      try {
        const response = await encomiendaService.entregar(encomienda.id);
        await recargarActual(true);

        Toast.show({
          type: "success",
          text1: "Encomienda entregada",
          text2: response.message,
        });

        return true;
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "No se pudo entregar la encomienda",
          text2: errorMessage(error, "Intenta nuevamente."),
        });
        return false;
      } finally {
        setProcessingId(null);
      }
    },
    [recargarActual],
  );

  const anular = useCallback(
    async (
      encomienda: Encomienda,
    ): Promise<boolean> => {
      setProcessingId(encomienda.id);

      try {
        const response = await encomiendaService.anular(encomienda.id);
        await recargarActual(true);

        Toast.show({
          type: "success",
          text1: "Encomienda anulada",
          text2: response.message,
        });

        return true;
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "No se pudo anular la encomienda",
          text2: errorMessage(error, "Intenta nuevamente."),
        });
        return false;
      } finally {
        setProcessingId(null);
      }
    },
    [recargarActual],
  );

  const buscarPorGuia = useCallback(
    async (
      guia: string,
    ): Promise<Encomienda | null> => {
      const valor = guia.trim();
      if (!valor) return null;

      try {
        return await encomiendaService.buscarPorGuia(valor);
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Encomienda no encontrada",
          text2: errorMessage(error, "Verifica el número de guía."),
        });
        return null;
      }
    },
    [],
  );

  const obtenerQr = useCallback(
    async (
      encomienda: Encomienda,
    ): Promise<EncomiendaQrResponse | null> => {
      try {
        return await encomiendaService.obtenerQr(encomienda.id);
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "No se pudo cargar el QR",
          text2: errorMessage(error, "Intenta nuevamente."),
        });
        return null;
      }
    },
    [],
  );

  const escanearQr = useCallback(
    async (
      qr: string,
    ): Promise<Encomienda | null> => {
      try {
        return await encomiendaService.escanearQr({ qr });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "QR no válido",
          text2: errorMessage(error, "No se pudo consultar la encomienda."),
        });
        return null;
      }
    },
    [],
  );

  const refresh = useCallback(
    async () => {
      await recargarActual(true);
    },
    [recargarActual],
  );

  return {
    encomiendas,
    loading,
    saving,
    processingId,
    catalogos,
    loadingCatalogos,
    meta,
    pagina,
    perPage,
    resumen,
    filtros,
    cambiarFiltros,
    irAPagina,
    refresh,
    crear,
    actualizar,
    cargarCatalogos,
    asignar,
    cambiarEstado,
    entregar,
    anular,
    buscarPorGuia,
    obtenerQr,
    escanearQr,
  };
}
