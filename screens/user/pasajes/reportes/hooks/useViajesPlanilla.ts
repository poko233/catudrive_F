import {
  useCallback,
  useRef,
  useState,
} from "react";

import {
  getViajes,
} from "../../services/pasajes.service";

import {
  Viaje,
} from "../../types/pasajes.types";

/*
|--------------------------------------------------------------------------
| FASES
|--------------------------------------------------------------------------
|
| Solo estados imprimibles: primero "En curso" (viajando), después
| "Vendiendo". "Finalizado"/"Cancelado" nunca se piden.
|
*/

const FASES_ESTADO = [
  "En curso",
  "Vendiendo",
] as const;

const ULTIMA_FASE =
  FASES_ESTADO.length -
  1;

const POR_PAGINA = 15;

interface PaginaResultado {
  nuevos:
    Viaje[];

  esUltima:
    boolean;
}

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
|
| Reutiliza getViajes() del servicio de pasajes: cada combinación
| estado+página+per_page ya tiene su propia entrada en configCache,
| así que no se crean claves nuevas y el backend aplica solo el
| aislamiento por rol (el chofer recibe solo sus viajes).
|
*/

export function useViajesPlanilla() {
  const [
    viajes,
    setViajes,
  ] =
    useState<
      Viaje[]
    >(
      [],
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false,
    );

  const [
    loadingMore,
    setLoadingMore,
  ] =
    useState(
      false,
    );

  const [
    allLoaded,
    setAllLoaded,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null,
    );

  const faseRef =
    useRef(0);

  const paginaRef =
    useRef(1);

  const faseAgotadaRef =
    useRef(false);

  const idsRef =
    useRef<
      Set<number>
    >(
      new Set<number>(),
    );

  const ticketRef =
    useRef(0);

  const ocupadoRef =
    useRef(false);

  const espejoRef =
    useRef({
      loading:
        false,

      loadingMore:
        false,

      allLoaded:
        false,
    });

  espejoRef.current = {
    loading,
    loadingMore,
    allLoaded,
  };

  /*
  |--------------------------------------------------------------------------
  | PEDIR PÁGINA (con deduplicación por id)
  |--------------------------------------------------------------------------
  */

  const pedir =
    useCallback(
      async (
        fase:
          number,

        pagina:
          number,
      ): Promise<PaginaResultado> => {
        const response =
          await getViajes({
            estado:
              FASES_ESTADO[
                fase
              ],

            per_page:
              POR_PAGINA,

            page:
              pagina,
          });

        const nuevos = (
          response.data ??
          []
        ).filter(
          (
            viaje,
          ) => {
            if (
              idsRef.current.has(
                viaje.id,
              )
            ) {
              return false;
            }

            idsRef.current.add(
              viaje.id,
            );

            return true;
          },
        );

        const ultimaPagina =
          response.meta
            ?.last_page ??
          pagina;

        return {
          nuevos,

          esUltima:
            pagina >=
            ultimaPagina,
        };
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | AVANZAR (páginas y fases)
  |--------------------------------------------------------------------------
  |
  | Si una fase se agota con contenido corto (< 1 página), encadena
  | la siguiente fase de inmediato para que siempre haya qué
  | desplazar; con contenido largo, el scroll dispara cargarMas().
  |
  */

  const avanzar =
    useCallback(
      async (
        ticket:
          number,
      ): Promise<void> => {
        let fase =
          faseRef.current;

        let pagina =
          paginaRef.current;

        if (
          faseAgotadaRef.current
        ) {
          fase +=
            1;

          pagina =
            1;

          faseAgotadaRef.current =
            false;
        }

        for (;;) {
          const {
            nuevos,
            esUltima,
          } =
            await pedir(
              fase,
              pagina,
            );

          if (
            ticketRef.current !==
            ticket
          ) {
            return;
          }

          if (
            nuevos.length >
            0
          ) {
            setViajes(
              (
                prev,
              ) => [
                ...prev,
                ...nuevos,
              ],
            );
          }

          if (
            !esUltima
          ) {
            faseRef.current =
              fase;

            paginaRef.current =
              pagina +
              1;

            return;
          }

          if (
            fase <
              ULTIMA_FASE &&
            idsRef.current
              .size <
              POR_PAGINA
          ) {
            fase +=
              1;

            pagina =
              1;

            continue;
          }

          if (
            fase >=
            ULTIMA_FASE
          ) {
            setAllLoaded(
              true,
            );
          } else {
            faseRef.current =
              fase;

            paginaRef.current =
              pagina;

            faseAgotadaRef.current =
              true;
          }

          return;
        }
      },
      [
        pedir,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CARGA INICIAL
  |--------------------------------------------------------------------------
  */

  const cargarInicial =
    useCallback(
      async () => {
        const ticket =
          ++ticketRef.current;

        faseRef.current =
          0;

        paginaRef.current =
          1;

        faseAgotadaRef.current =
          false;

        idsRef.current =
          new Set<number>();

        setViajes(
          [],
        );

        setAllLoaded(
          false,
        );

        setError(
          null,
        );

        setLoading(
          true,
        );

        try {
          await avanzar(
            ticket,
          );
        } catch (
          err: unknown
        ) {
          if (
            ticketRef.current !==
            ticket
          ) {
            return;
          }

          setError(
            err instanceof
            Error
              ? err.message
              : "No se pudieron cargar los viajes.",
          );
        } finally {
          if (
            ticketRef.current ===
            ticket
          ) {
            setLoading(
              false,
            );
          }
        }
      },
      [
        avanzar,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CARGAR MÁS (scroll al final)
  |--------------------------------------------------------------------------
  */

  const cargarMas =
    useCallback(
      async () => {
        const estado =
          espejoRef.current;

        if (
          estado.loading ||
          estado.loadingMore ||
          estado.allLoaded
        ) {
          return;
        }

        if (
          ocupadoRef.current
        ) {
          return;
        }

        ocupadoRef.current =
          true;

        setLoadingMore(
          true,
        );

        const ticket =
          ticketRef.current;

        try {
          await avanzar(
            ticket,
          );
        } catch {
          // Silencioso en scroll: se reintenta al volver al final.
        } finally {
          ocupadoRef.current =
            false;

          if (
            ticketRef.current ===
            ticket
          ) {
            setLoadingMore(
              false,
            );
          }
        }
      },
      [
        avanzar,
      ],
    );

  return {
    viajes,
    loading,
    loadingMore,
    allLoaded,
    error,
    cargarInicial,
    cargarMas,
  };
}
