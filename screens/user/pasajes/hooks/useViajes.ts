// hooks/useViajes.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { getViajes } from "../services/pasajes.service";
import {
  FiltrosViajes,
  PaginacionMeta,
  Viaje,
  ViajesResponse,
} from "../types/pasajes.types";

/*
|--------------------------------------------------------------------------
| FILTROS DE BÚSQUEDA (SIN PAGINACIÓN)
|--------------------------------------------------------------------------
*/

export interface FiltrosBusquedaViajes {
  origen?: string;
  destino?: string;
  fecha?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: string;
  vehiculo_id?: number;
  chofer_id?: number;
}

function normalizarFiltros(filtros?: FiltrosBusquedaViajes): FiltrosViajes {
  if (!filtros) return {};
  const salida: FiltrosViajes = {};
  if (filtros.origen?.trim()) salida.origen = filtros.origen.trim();
  if (filtros.destino?.trim()) salida.destino = filtros.destino.trim();
  if (filtros.fecha?.trim()) salida.fecha = filtros.fecha.trim();
  if (filtros.fecha_desde?.trim())
    salida.fecha_desde = filtros.fecha_desde.trim();
  if (filtros.fecha_hasta?.trim())
    salida.fecha_hasta = filtros.fecha_hasta.trim();
  if (filtros.estado?.trim()) salida.estado = filtros.estado.trim();
  if (filtros.vehiculo_id !== undefined)
    salida.vehiculo_id = filtros.vehiculo_id;
  if (filtros.chofer_id !== undefined) salida.chofer_id = filtros.chofer_id;
  return salida;
}

/*
|--------------------------------------------------------------------------
| FILTROS EFECTIVOS POR FASE
|--------------------------------------------------------------------------
|
| El backend no tiene OR: con texto dual se pagina primero
| SOLO origen (fase 1) y al agotarse SOLO destino (fase 2).
| Nunca ambos params en la misma petición.
|
*/

function filtrosEfectivos(
  base: FiltrosViajes,
  fase: 1 | 2,
  texto: string,
): FiltrosViajes {
  const { origen: _o, destino: _d, ...resto } = base;

  if (!texto) return resto;

  return fase === 1
    ? { ...resto, origen: texto }
    : { ...resto, destino: texto };
}

export function useViajes(
  initialFilters?: FiltrosBusquedaViajes,
  perPage = 15,
) {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginacionMeta | null>(null);
  const [filtros, setFiltros] = useState<FiltrosViajes>(() =>
    normalizarFiltros(initialFilters),
  );
  const [pagina, setPagina] = useState(1);

  const [textoDual, setTextoDual] = useState("");
  const [fase, setFase] = useState<1 | 2>(1);
  const [totalFase1, setTotalFase1] = useState<number | null>(null);
  const [lastPageFase1, setLastPageFase1] = useState<number | null>(null);
  const [fase2Hecha, setFase2Hecha] = useState(false);
  const [hayMas, setHayMas] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | GUARDAS SÍNCRONAS (anti-bucle y anti-spam)
  |--------------------------------------------------------------------------
  |
  | Los states se confirman de forma asíncrona: dos disparos
  | seguidos (scroll + efecto, doble tap) pasarían el mismo
  | guard basado en state y lanzarían fetches duplicados que
  | se invalidan entre sí (spinner eterno). Los refs se
  | confirman en el mismo tick: imposible doble disparo.
  |
  */

  // Evita pisar resultados cuando una petición vieja
  // responde después de una más reciente.
  const secuencia = useRef(0);
  // true mientras HAY un fetch en vuelo (cualquiera).
  const enVueloRef = useRef(false);
  // Fase 2 ya intentada para el texto actual.
  const fase2HechaRef = useRef(false);

  const recalcularHayMas = useCallback(
    (
      metaActual: PaginacionMeta | null,
      faseActual: 1 | 2,
      texto: string,
      fase2: boolean,
    ) => {
      const cur = metaActual?.current_page ?? 1;
      const last = metaActual?.last_page ?? 1;
      setHayMas(cur < last || (faseActual === 1 && !!texto && !fase2));
    },
    [],
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH BASE (retorna respuesta o null si quedó obsoleta)
  |--------------------------------------------------------------------------
  */

  const pedirPagina = useCallback(
    async (
      base: FiltrosViajes,
      paginaActual: number,
      faseFetch: 1 | 2,
      texto: string,
      force = false,
    ): Promise<ViajesResponse | null> => {
      const ticket = ++secuencia.current;

      try {
        const response = await getViajes(
          {
            ...filtrosEfectivos(base, faseFetch, texto),
            per_page: perPage,
            page: paginaActual,
          },
          { force },
        );

        // Respuesta vieja: se ignora.
        if (secuencia.current !== ticket) return null;

        return response;
      } catch (err: any) {
        if (secuencia.current !== ticket) return null;
        throw err;
      }
    },
    [perPage],
  );

  /*
  |--------------------------------------------------------------------------
  | REEMPLAZAR LISTA (carga inicial, filtros, búsqueda)
  |--------------------------------------------------------------------------
  */

  const reemplazar = useCallback(
    async (
      base: FiltrosViajes,
      paginaActual: number,
      faseFetch: 1 | 2,
      texto: string,
      force = false,
    ): Promise<ViajesResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await pedirPagina(
          base,
          paginaActual,
          faseFetch,
          texto,
          force,
        );
        if (!response) return null;
        setViajes(response.data);
        setMeta(response.meta ?? null);
        setPagina(response.meta?.current_page ?? paginaActual);
        setFase(faseFetch);
        recalcularHayMas(
          response.meta ?? null,
          faseFetch,
          texto,
          fase2HechaRef.current,
        );
        return response;
      } catch (err: any) {
        setError(err?.message || "Error al cargar viajes");
        setHayMas(false);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [pedirPagina, recalcularHayMas],
  );

  useEffect(() => {
    void reemplazar(normalizarFiltros(initialFilters), 1, 1, "");
    // Solo al montar: los cambios van por changeFiltros/goToPage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CAMBIAR FILTROS (estado, fecha…) → FASE 1
  |--------------------------------------------------------------------------
  */

  const changeFiltros = useCallback(
    (nuevos?: FiltrosBusquedaViajes) => {
      const normalizados = normalizarFiltros(nuevos);
      // El texto dual lo maneja buscarTexto, no va en base.
      delete normalizados.origen;
      delete normalizados.destino;
      setFiltros(normalizados);
      setPagina(1);
      setFase(1);
      setTotalFase1(null);
      setLastPageFase1(null);
      setFase2Hecha(false);
      fase2HechaRef.current = false;
      void reemplazar(normalizados, 1, 1, textoDual);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reemplazar, textoDual],
  );

  /*
  |--------------------------------------------------------------------------
  | BUSCADOR ÚNICO → FASE 1 (solo origen)
  |--------------------------------------------------------------------------
  |
  | Si la fase 1 termina VACÍA en su última página, se
  | encadena la fase 2 aquí mismo (sin efecto que pueda
  | re-dispararse ni scroll que la pida). Si ambas quedan
  | vacías, recién ahí la lista se considera vacía.
  |
  */

  const buscarTexto = useCallback(
    async (texto: string) => {
      const limpio = texto.trim();
      setTextoDual(limpio);
      setPagina(1);
      setFase(1);
      setTotalFase1(null);
      setLastPageFase1(null);
      setFase2Hecha(false);
      fase2HechaRef.current = false;

      const r1 = await reemplazar(filtros, 1, 1, limpio);

      if (!r1) {
        return;
      }

      const meta1 = r1.meta ?? null;
      const cur1 = meta1?.current_page ?? 1;
      const last1 = meta1?.last_page ?? 1;

      // Fase 1 con datos o con más páginas: el usuario sigue
      // con scroll / "Mostrar más". Sin texto no hay fase 2.
      if (r1.data.length > 0 || cur1 < last1 || !limpio) {
        return;
      }

      fase2HechaRef.current = true;
      setCargandoMas(true);
      try {
        const r2 = await pedirPagina(filtros, 1, 2, limpio);
        if (!r2) return;
        setTotalFase1(meta1?.total_filtrado ?? 0);
        setLastPageFase1(last1);
        setFase(2);
        setFase2Hecha(true);
        setViajes(r2.data);
        setMeta(r2.meta ?? null);
        setPagina(r2.meta?.current_page ?? 1);
        recalcularHayMas(r2.meta ?? null, 2, limpio, true);
      } catch (err: any) {
        fase2HechaRef.current = false;
        setError(err?.message || "Error al cargar viajes");
        recalcularHayMas(meta1, 1, limpio, false);
      } finally {
        setCargandoMas(false);
      }
    },
    [filtros, pedirPagina, reemplazar, recalcularHayMas],
  );

  /*
  |--------------------------------------------------------------------------
  | PAGINADOR (mapea página global → fase, solo dual)
  |--------------------------------------------------------------------------
  */

  const goToPage = useCallback(
    (nuevaPagina: number) => {
      const destino = Math.max(1, Math.floor(nuevaPagina) || 1);

      // Sin dual: paginación clásica de la fase actual.
      if (!textoDual) {
        const ultima = meta?.last_page ?? destino;
        const paginaFinal = Math.min(destino, Math.max(1, ultima));
        if (paginaFinal === pagina) return;
        void reemplazar(filtros, paginaFinal, fase, "");
        return;
      }

      // Dual con fase 1 conocida: 1..last1 → fase 1, resto → fase 2.
      if (lastPageFase1 !== null) {
        if (destino <= lastPageFase1) {
          void reemplazar(filtros, destino, 1, textoDual);
        } else {
          void reemplazar(filtros, destino - lastPageFase1, 2, textoDual);
        }
        return;
      }

      // Dual sin fase 1 conocida: se limita a la fase actual.
      const ultima = meta?.last_page ?? destino;
      const paginaFinal = Math.min(destino, Math.max(1, ultima));
      if (paginaFinal === pagina && fase === 1) return;
      void reemplazar(filtros, paginaFinal, fase, textoDual);
    },
    [
      filtros,
      meta?.last_page,
      pagina,
      textoDual,
      fase,
      lastPageFase1,
      reemplazar,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | TRANSICIÓN FASE 1 → FASE 2 (origen agotado → destino)
  |--------------------------------------------------------------------------
  */

  const transicionarAFase2 = useCallback(async (): Promise<boolean> => {
    // Guard síncrono: ni doble tap ni scroll repetido
    // pueden lanzar dos transiciones a la vez.
    if (enVueloRef.current || fase2HechaRef.current) {
      return false;
    }
    enVueloRef.current = true;
    fase2HechaRef.current = true;
    setCargandoMas(true);

    const ultima = meta?.last_page ?? 1;

    try {
      const response = await pedirPagina(filtros, 1, 2, textoDual);
      if (!response) return false;
      setTotalFase1(meta?.total_filtrado ?? 0);
      setLastPageFase1(ultima);
      setFase(2);
      setFase2Hecha(true);
      setViajes((prev) => {
        const ids = new Set(prev.map((v) => v.id));
        return [...prev, ...response.data.filter((v) => !ids.has(v.id))];
      });
      setMeta(response.meta ?? null);
      setPagina(response.meta?.current_page ?? 1);
      recalcularHayMas(response.meta ?? null, 2, textoDual, true);
      return true;
    } catch {
      // Falla la transición: se libera para reintentar con
      // scroll o botón (sin bucle: nadie la re-dispara solo).
      fase2HechaRef.current = false;
      setFase2Hecha(false);
      return false;
    } finally {
      enVueloRef.current = false;
      setCargandoMas(false);
    }
  }, [meta, filtros, textoDual, pedirPagina, recalcularHayMas]);

  /*
  |--------------------------------------------------------------------------
  | SCROLL INFINITO (append, sin paginación visible)
  |--------------------------------------------------------------------------
  |
  | El backend indica el final con meta.last_page: si la
  | página actual es la última, ya no hay más datos en
  | esa fase. Con dual, al agotar fase 1 se transiciona.
  |
  */

  const cargarMas = useCallback(async () => {
    // Guard síncrono anti-spam de scroll.
    if (enVueloRef.current) {
      return;
    }

    const ultima = meta?.last_page ?? 1;
    const actual = meta?.current_page ?? pagina;

    // Fase 1 agotada con dual: se sigue con destino.
    if (actual >= ultima && fase === 1 && textoDual && !fase2HechaRef.current) {
      await transicionarAFase2();
      return;
    }

    if (actual >= ultima) {
      return;
    }

    enVueloRef.current = true;
    setCargandoMas(true);

    try {
      const response = await pedirPagina(filtros, actual + 1, fase, textoDual);
      if (!response) return;
      setViajes((prev) => {
        const ids = new Set(prev.map((v) => v.id));
        return [...prev, ...response.data.filter((v) => !ids.has(v.id))];
      });
      setMeta(response.meta ?? null);
      setPagina(response.meta?.current_page ?? actual + 1);
      recalcularHayMas(
        response.meta ?? null,
        fase,
        textoDual,
        fase2HechaRef.current,
      );
    } catch {
      // Silencioso: el scroll o el botón reintentan.
    } finally {
      enVueloRef.current = false;
      setCargandoMas(false);
    }
  }, [
    meta,
    pagina,
    filtros,
    fase,
    textoDual,
    pedirPagina,
    recalcularHayMas,
    transicionarAFase2,
  ]);

  /*
  |--------------------------------------------------------------------------
  | TOTAL COMBINADO (fuente del TOTAL fijo)
  |--------------------------------------------------------------------------
  |
  | Fase 1: total del backend. Fase 2: total fase 1 guardado
  | + total fase 2 actual. Sin dual: total del backend.
  |
  */

  const totalCombinado =
    (fase === 2 ? (totalFase1 ?? 0) : 0) + (meta?.total_filtrado ?? 0);

  /*
  |--------------------------------------------------------------------------
  | RECARGAR PÁGINAS CARGADAS (MOBILE SCROLL INFINITO)
  |--------------------------------------------------------------------------
  |
  | En mobile, `viajes` es acumulativo (página 1 + 2 + 3...). Tras una
  | mutación que invalida el caché (crear viaje, cambiar estado), NO
  | podemos llamar `refetch()` porque reemplazaría el array entero con
  | UNA sola página (la actual). Eso borraría todas las anteriores.
  |
  | Este método recarga TODAS las páginas 1..pagina y las concatena,
  | preservando la experiencia de scroll infinito. Usa `pedirPagina`
  | (ya existente) para aprovechar el ticket anti-stale.
  |
  | Si estamos en fase 2 (búsqueda dual agotó fase 1), hacer una
  | recarga coherente página-a-página es complejo (hay dos conjuntos
  | de páginas superpuestos). En ese caso caemos al flujo simple:
  | relanzar la búsqueda desde cero.
  |
  */

  const recargarPaginasCargadas = useCallback(async () => {
    // Fase dual: recarga página-a-página sería ambigua. Relanzar búsqueda.
    if (fase === 2) {
      await buscarTexto(textoDual);
      return;
    }

    // Solo página 1 cargada: caso trivial, delega en reemplazar.
    if (pagina <= 1) {
      await reemplazar(filtros, 1, 1, textoDual);
      return;
    }

    setCargandoMas(true);

    try {
      // 1) Pedir siempre la página 1 primero para saber `last_page` real
      //    tras la mutación (pudo crecer o encogerse).
      const primera = await pedirPagina(filtros, 1, 1, textoDual);
      if (!primera) return;

      const lastPage = primera.meta?.last_page ?? 1;
      const paginasReales = Math.min(pagina, lastPage);

      const acumulado: Viaje[] = [...primera.data];
      let metaFinal = primera.meta ?? null;

      // 2) Pedir secuencialmente 2..paginasReales (secuencial para no
      //    saturar; los guards anti-stale de `pedirPagina` protegen igual).
      for (let p = 2; p <= paginasReales; p++) {
        const resp = await pedirPagina(filtros, p, 1, textoDual);
        if (!resp) return;

        acumulado.push(...resp.data);
        metaFinal = resp.meta ?? null;
      }

      // 3) Reemplazar el array entero con el acumulado fresco.
      setViajes(acumulado);
      setMeta(metaFinal);
      setPagina(paginasReales);

      recalcularHayMas(metaFinal, 1, textoDual, false);
    } catch {
      // Silencioso: la lista previa sigue visible, el usuario puede
      // reintentar (o el próximo scroll/mutación lo hará).
    } finally {
      setCargandoMas(false);
    }
  }, [
    fase,
    pagina,
    filtros,
    textoDual,
    pedirPagina,
    reemplazar,
    recalcularHayMas,
    buscarTexto,
  ]);

  return {
    viajes,
    loading,
    cargandoMas,
    hayMas,
    error,
    meta,
    pagina,
    filtros,
    perPage,
    fase,
    textoDual,
    totalCombinado,
    changeFiltros,
    buscarTexto,
    goToPage,
    cargarMas,
    /**
     * Mobile: recarga TODAS las páginas acumuladas (preserva scroll).
     * Desktop: usar `refetch()` normal.
     */
    recargarPaginasCargadas,
    /**
     * force=true: invalida caché y pega al backend
     * (botón Actualizar). Sin force se sirve el caché.
     */
    refetch: (force = false) => {
      void reemplazar(filtros, pagina, fase, textoDual, force);
    },
  };
}
