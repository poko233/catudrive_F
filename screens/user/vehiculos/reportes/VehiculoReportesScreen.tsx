import {
  PageHeader,
} from "@/components/ui/PageHeader";

import {
  Button,
} from "@/components/ui/Button";

import {
  AnimatedBlock,
} from "@/components/ui/AnimatedBlock";

import {
  ReportPrintModal,
} from "@/components/ReportPrintModal";

import {
  usePrinterConnection,
} from "@/components/PrinterConnection";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  Car,
  ClipboardList,
  KeyRound,
  Users,
} from "lucide-react-native";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import {
  router,
} from "expo-router";

import Toast from "react-native-toast-message";

import {
  VehiculoReporteCard,
} from "./components/VehiculoReporteCard";

import {
  VehiculoReporteFiltrosModal,
} from "./components/VehiculoReporteFiltrosModal";

import {
  VehiculoReporteImpresion,
} from "./components/VehiculoReporteImpresion";

import {
  vehiculoReporteService,
} from "./services/vehiculo-reporte.service";

import {
  getCategoriasVehiculo,
} from "../services/categoriaVehiculo.service";

import {
  getChoferes,
} from "../../choferes/services/chofer.service";

import {
  AccionReporteVehiculo,
  TipoReporteVehiculo,
  VehiculoReporteFiltros,
} from "./types/vehiculo-reporte.types";

import {
  CategoriaVehiculo,
} from "../types/vehiculo.types";

import {
  Chofer,
} from "../../choferes/types/chofer.types";

import {
  descargarReporteVehiculo,
  nombreReporteVehiculo,
} from "./utils/descargarReporteVehiculo";

import {
  construirTextoReporteVehiculo,
  descripcionFiltrosReporteVehiculo,
  EtiquetasFiltrosVehiculo,
} from "./utils/vehiculo-reporte-print.utils";

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN REPORTES
|--------------------------------------------------------------------------
|
| Espejo de los 4 tipos reales del backend
| (lista, disponibles, asignados, por_propietario).
|
*/

const reportes = [
  {
    tipo:
      "lista" as const,

    icon:
      ClipboardList,

    badge:
      "COMPLETA",

    title:
      "Lista Completa de Vehículos",

    description:
      "Reporte de todos los vehículos registrados, con filtro opcional por estado y categoría.",

    tags: [
      "Todos",
      "Por estado",
    ],
  },

  {
    tipo:
      "disponibles" as const,

    icon:
      Car,

    badge:
      "DISPONIBLES",

    title:
      "Vehículos Disponibles",

    description:
      "Vehículos operativos sin asignación activa, con filtro opcional por categoría.",

    tags: [
      "Operativos",
      "Sin asignación",
    ],
  },

  {
    tipo:
      "asignados" as const,

    icon:
      KeyRound,

    badge:
      "ASIGNADOS",

    title:
      "Vehículos Asignados",

    description:
      "Asignaciones activas de vehículos a choferes, con filtro opcional por chofer.",

    tags: [
      "Asignaciones",
      "Activas",
    ],
  },

  {
    tipo:
      "por_propietario" as const,

    icon:
      Users,

    badge:
      "PROPIETARIOS",

    title:
      "Vehículos por Propietario",

    description:
      "Vehículos agrupados por chofer propietario, con filtro opcional por chofer.",

    tags: [
      "Propietario",
      "Chofer",
    ],
  },
];

/*
|--------------------------------------------------------------------------
| ERROR
|--------------------------------------------------------------------------
*/

function mensajeError(
  error: unknown,
): string {
  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  return "Intenta nuevamente.";
}

/*
|--------------------------------------------------------------------------
| ESPERA
|--------------------------------------------------------------------------
*/

function esperar(
  ms: number,
): Promise<void> {
  return new Promise<void>(
    (
      resolve,
    ) =>
      setTimeout(
        resolve,
        ms,
      ),
  );
}

/*
|--------------------------------------------------------------------------
| IMPRESIÓN WEB EN PESTAÑA NUEVA
|--------------------------------------------------------------------------
|
| Abre el HTML del backend en una ventana nueva e independiente
| del navegador y dispara el diálogo de impresión. La ventana NO
| se cierra sola: el diálogo es independiente y cancelar no la
| cierra; queda abierta para reimprimir. Si el popup es bloqueado,
| cae al método del iframe oculto.
|
*/

async function imprimirHtmlEnIframe(
  html: string,
): Promise<void> {
  const document =
    (globalThis as any)
      .document;

  if (!document) {
    throw new Error(
      "No se pudo abrir el diálogo de impresión.",
    );
  }

  const iframe =
    document.createElement(
      "iframe",
    );

  iframe.style.position =
    "fixed";

  iframe.style.left =
    "-10000px";

  iframe.style.top =
    "0";

  // No usar 0x0: Chrome calcula la maquetación de impresión
  // con el viewport del iframe y terminaba reduciendo el reporte
  // a una miniatura en la esquina superior de la vista previa.
  iframe.style.width =
    "1280px";

  iframe.style.height =
    "900px";

  iframe.style.opacity =
    "0";

  iframe.style.pointerEvents =
    "none";

  iframe.style.border =
    "0";

  document.body.appendChild(
    iframe,
  );

  const frameDocument =
    iframe.contentDocument ??
    iframe.contentWindow?.document;

  const frameWindow =
    iframe.contentWindow;

  if (
    !frameDocument ||
    !frameWindow
  ) {
    iframe.remove();

    throw new Error(
      "No se pudo preparar el documento de impresión.",
    );
  }

  frameDocument.open();
  frameDocument.write(
    html,
  );
  frameDocument.close();

  await esperar(
    450,
  );

  frameWindow.focus();
  frameWindow.print();

  setTimeout(
    () =>
      iframe.remove(),
    1500,
  );
}

/*
|--------------------------------------------------------------------------
| ESPERAR DOCUMENTO DE LA PESTAÑA
|--------------------------------------------------------------------------
*/

function esperarDocumentoListo(
  ventana: any,
  timeoutMs: number,
): Promise<void> {
  return new Promise<void>(
    (
      resolve,
      reject,
    ) => {
      const inicio =
        Date.now();

      const intervalo =
        setInterval(
          () => {
            try {
              if (
                ventana.closed
              ) {
                clearInterval(
                  intervalo,
                );

                reject(
                  new Error(
                    "cerrada",
                  ),
                );

                return;
              }

              if (
                ventana.document
                  ?.readyState ===
                "complete"
              ) {
                clearInterval(
                  intervalo,
                );

                resolve();

                return;
              }
            } catch {
              clearInterval(
                intervalo,
              );

              resolve();

              return;
            }

            if (
              Date.now() -
                inicio >=
              timeoutMs
            ) {
              clearInterval(
                intervalo,
              );

              reject(
                new Error(
                  "timeout",
                ),
              );
            }
          },
          100,
        );
    },
  );
}

async function imprimirHtmlEnNuevaPestana(
  html: string,
): Promise<void> {
  const scope =
    globalThis as any;

  if (
    !scope?.document
  ) {
    throw new Error(
      "No se pudo abrir el diálogo de impresión.",
    );
  }

  // El HTML viaja como documento real (blob:), no con document.write:
  // así la pestaña muestra el reporte y el diálogo imprime esa pestaña.
  let url:
    | string
    | null =
    null;

  try {
    const blob =
      new Blob(
        [
          html,
        ],
        {
          type:
            "text/html;charset=utf-8",
        },
      );

    url =
      URL.createObjectURL(
        blob,
      );
  } catch {
    url =
      null;
  }

  if (!url) {
    await imprimirHtmlEnIframe(
      html,
    );

    return;
  }

  const liberarUrl =
    () => {
      if (url) {
        URL.revokeObjectURL(
          url,
        );

        url =
          null;
      }
    };

  const ventana =
    typeof scope?.open ===
    "function"
      ? scope.open(
          url,
          "_blank",
          "width=1280,height=900",
        )
      : null;

  if (
    !ventana ||
    ventana.closed
  ) {
    liberarUrl();

    await imprimirHtmlEnIframe(
      html,
    );

    return;
  }

  try {
    await esperarDocumentoListo(
      ventana,
      6000,
    );
  } catch {
    // Timeout o cierre: se intenta imprimir lo que haya cargado.
  }

  await esperar(
    400,
  );

  if (
    ventana.closed
  ) {
    liberarUrl();

    throw new Error(
      "La pestaña de impresión fue cerrada antes de imprimir.",
    );
  }

  // Seguridad: liberar la URL aunque la pestaña quede abierta.
  setTimeout(
    liberarUrl,
    120000,
  );

  // La ventana queda abierta a propósito: el diálogo de impresión
  // es independiente (cancelar no cierra nada) y el usuario puede
  // reimprimir con Ctrl/Cmd+P. Solo se libera la URL del blob.
  ventana.onafterprint =
    () => {
      liberarUrl();
    };

  try {
    ventana.focus();
    ventana.print();
  } catch (error) {
    ventana.onafterprint =
      null;

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export default function VehiculoReportesScreen() {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 768;

  const {
    print,
  } =
    usePrinterConnection();

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    tipoSeleccionado,
    setTipoSeleccionado,
  ] =
    useState<
      TipoReporteVehiculo | null
    >(
      null,
    );

  const [
    accionSeleccionada,
    setAccionSeleccionada,
  ] =
    useState<
      AccionReporteVehiculo
    >(
      "imprimir",
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false,
    );

  const [
    categorias,
    setCategorias,
  ] =
    useState<
      CategoriaVehiculo[]
    >(
      [],
    );

  const [
    choferes,
    setChoferes,
  ] =
    useState<
      Chofer[]
    >(
      [],
    );

  const [
    loadingCatalogos,
    setLoadingCatalogos,
  ] =
    useState(
      false,
    );

  const [
    filtrosImpresion,
    setFiltrosImpresion,
  ] =
    useState<
      VehiculoReporteFiltros
    >(
      {},
    );

  const [
    tipoImpresion,
    setTipoImpresion,
  ] =
    useState<
      TipoReporteVehiculo | null
    >(
      null,
    );

  const [
    imprimirVisible,
    setImprimirVisible,
  ] =
    useState(
      false,
    );

  /*
  |--------------------------------------------------------------------------
  | CARGAR CATÁLOGOS (con caché del módulo)
  |--------------------------------------------------------------------------
  |
  | Categorías: getCategoriasVehiculo() — caché "categorias-vehiculo:listado".
  | Choferes: getChoferes() — caché "choferes:listado".
  |
  */

  useEffect(
    () => {
      let activo =
        true;

      const cargarCatalogos =
        async () => {
          try {
            setLoadingCatalogos(
              true,
            );

            const [
              categoriasResponse,
              choferesResponse,
            ] =
              await Promise.all([
                getCategoriasVehiculo(),
                getChoferes(),
              ]);

            if (!activo) {
              return;
            }

            setCategorias(
              categoriasResponse ??
              [],
            );

            setChoferes(
              choferesResponse.choferes ??
              [],
            );
          } catch (
            error: unknown
          ) {
            if (!activo) {
              return;
            }

            Toast.show({
              type:
                "error",

              text1:
                "No se pudieron cargar los catálogos",

              text2:
                mensajeError(
                  error,
                ),
            });
          } finally {
            if (activo) {
              setLoadingCatalogos(
                false,
              );
            }
          }
        };

      void cargarCatalogos();

      return () => {
        activo =
          false;
      };
    },
    [],
  );

  /*
  |--------------------------------------------------------------------------
  | ETIQUETAS (nombres resueltos desde catálogos)
  |--------------------------------------------------------------------------
  */

  const etiquetasImpresion: EtiquetasFiltrosVehiculo =
    useMemo(
      () => ({
        categoriaNombre:
          filtrosImpresion.id_categoria !==
          undefined
            ? (categorias.find(
                (
                  item,
                ) =>
                  item.id ===
                  filtrosImpresion.id_categoria,
              )?.categoria ??
              null)
            : null,

        choferNombre:
          filtrosImpresion.id_chofer !==
          undefined
            ? (choferes.find(
                (
                  item,
                ) =>
                  item.id ===
                  filtrosImpresion.id_chofer,
              )?.nombre_completo ??
              null)
            : null,
      }),

      [
        categorias,
        choferes,
        filtrosImpresion,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | ABRIR REPORTE
  |--------------------------------------------------------------------------
  */

  const abrirReporte =
    (
      tipo:
        TipoReporteVehiculo,

      accion:
        AccionReporteVehiculo,
    ) => {
      setAccionSeleccionada(
        accion,
      );

      setTipoSeleccionado(
        tipo,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | GENERAR / EXPORTAR
  |--------------------------------------------------------------------------
  |
  | Sin endpoint JSON en este módulo: "imprimir" abre directo el
  | modal (el HTML lo pide ReportPrintModal) y "pdf" descarga.
  |
  */

  const generarReporte =
    async (
      filtros:
        VehiculoReporteFiltros,
    ) => {
      if (
        !tipoSeleccionado ||
        loading
      ) {
        return;
      }

      const tipo =
        tipoSeleccionado;

      try {
        setLoading(
          true,
        );

        if (
          accionSeleccionada ===
          "imprimir"
        ) {
          setFiltrosImpresion(
            filtros,
          );

          setTipoImpresion(
            tipo,
          );

          setTipoSeleccionado(
            null,
          );

          setImprimirVisible(
            true,
          );

          return;
        }

        const blob =
          await vehiculoReporteService
            .descargarPdf(
              tipo,
              filtros,
            );

        await descargarReporteVehiculo(
          blob,
          nombreReporteVehiculo(
            tipo,
          ),
        );

        Toast.show({
          type:
            "success",

          text1:
            "Reporte PDF generado",

          text2:
            "El archivo está listo para guardar o compartir.",
        });

        setTipoSeleccionado(
          null,
        );
      } catch (
        error: unknown
      ) {
        Toast.show({
          type:
            "error",

          text1:
            "No se pudo generar el reporte",

          text2:
            mensajeError(
              error,
            ),
        });
      } finally {
        setLoading(
          false,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | HTML PARA IMPRESIÓN
  |--------------------------------------------------------------------------
  */

  const obtenerHtmlImpresion =
    useCallback(
      async (): Promise<string> => {
        if (!tipoImpresion) {
          throw new Error(
            "No existe un reporte seleccionado para imprimir.",
          );
        }

        return vehiculoReporteService
          .obtenerHtml(
            tipoImpresion,
            filtrosImpresion,
          );
      },
      [
        tipoImpresion,
        filtrosImpresion,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | SALIDA REAL DE IMPRESIÓN
  |--------------------------------------------------------------------------
  */

  const imprimirHtmlReal =
    useCallback(
      async (
        html:
          string,
      ): Promise<number> => {
        if (
          !tipoImpresion
        ) {
          throw new Error(
            "No existe información del reporte para imprimir.",
          );
        }

        const config =
          reportes.find(
            (
              item,
            ) =>
              item.tipo ===
              tipoImpresion,
          );

        const titulo =
          config?.title ??
          "Reporte de vehículos";

        const inicio =
          Date.now();

        if (
          Platform.OS ===
          "web"
        ) {
          await imprimirHtmlEnNuevaPestana(
            html,
          );
        } else {
          await print({
            type:
              "document",

            title:
              titulo,

            html,

            text:
              construirTextoReporteVehiculo(
                titulo,
                filtrosImpresion,
                etiquetasImpresion,
              ),

            cutPaper:
              true,
          });
        }

        return Date.now() -
          inicio;
      },
      [
        etiquetasImpresion,
        filtrosImpresion,
        print,
        tipoImpresion,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | TÍTULOS
  |--------------------------------------------------------------------------
  */

  const configSeleccionada =
    reportes.find(
      (
        item,
      ) =>
        item.tipo ===
        tipoSeleccionado,
    );

  const configImpresion =
    reportes.find(
      (
        item,
      ) =>
        item.tipo ===
        tipoImpresion,
    );

  const tituloModal =
    configSeleccionada?.title ??
    "Generar reporte";

  const actionLabel =
    accionSeleccionada ===
    "imprimir"
      ? "Imprimir reporte"
      : "Descargar PDF";

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={[
        styles.screen,
        isMobile && styles.screenMobile,

        {
          backgroundColor:
            c.background,
        },
      ]}
    >
      <PageHeader
        title="Reportes de Vehículos"

        description="Consulta, impresión y descarga de reportes de flota: lista completa, disponibles, asignados y por propietario."

        badge={`${reportes.length} reportes`}

        rightContent={
          <Button
            title="Volver"

            variant="secondary"

            onPress={() =>
              router.back()
            }
          />
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }

        contentContainerStyle={
          [styles.scroll, isMobile && styles.scrollMobile]
        }
      >
        <View
          style={
            [styles.grid, isMobile && styles.gridMobile]
          }
        >
          {reportes.map(
            (
              item,
              index,
            ) => (
              <AnimatedBlock
                key={
                  item.tipo
                }

                preset="slideInUp"

                delay={
                  index *
                  60
                }

                style={[
                  styles.cardWrapper,
                  isMobile &&
                    styles.cardWrapperMobile,
                ]}
              >
                <VehiculoReporteCard
                  icon={
                    item.icon
                  }

                  badge={
                    item.badge
                  }

                  title={
                    item.title
                  }

                  description={
                    item.description
                  }

                  tags={
                    item.tags
                  }

                  onPrint={() =>
                    abrirReporte(
                      item.tipo,
                      "imprimir",
                    )
                  }

                  onPdf={() =>
                    abrirReporte(
                      item.tipo,
                      "pdf",
                    )
                  }
                />
              </AnimatedBlock>
            ),
          )}
        </View>
      </ScrollView>

      <VehiculoReporteFiltrosModal
        visible={
          !!tipoSeleccionado
        }

        tipo={
          tipoSeleccionado
        }

        titulo={
          tituloModal
        }

        loading={
          loading
        }

        categorias={
          categorias
        }

        choferes={
          choferes
        }

        loadingCatalogos={
          loadingCatalogos
        }

        actionLabel={
          actionLabel
        }

        onClose={() => {
          if (
            !loading
          ) {
            setTipoSeleccionado(
              null,
            );
          }
        }}

        onGenerate={
          generarReporte
        }
      />

      {tipoImpresion &&
      configImpresion ? (
        <ReportPrintModal
          visible={
            imprimirVisible
          }

          onClose={() =>
            setImprimirVisible(
              false,
            )
          }

          fetchHtml={
            obtenerHtmlImpresion
          }

          onPrintHtml={
            imprimirHtmlReal
          }

          onComplete={() => {
            Toast.show({
              type:
                "success",

              text1:
                "Reporte enviado a impresión",

              text2:
                configImpresion.title,
            });
          }}

          resetKey={`${tipoImpresion}-${JSON.stringify(
            filtrosImpresion,
          )}`}

          title={
            configImpresion.title
          }

          headerTitle="Reporte de vehículos"

          screenTitle={
            configImpresion.title
          }

          screenSubtitle={
            descripcionFiltrosReporteVehiculo(
              filtrosImpresion,
              etiquetasImpresion,
            )
          }

          paperSize="letter"

          outputHeight={
            760
          }

          printingDuration={
            1900
          }
        >
          <VehiculoReporteImpresion
            titulo={
              configImpresion.title
            }

            filtros={
              filtrosImpresion
            }

            etiquetas={
              etiquetasImpresion
            }
          />
        </ReportPrintModal>
      ) : null}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    screen: {
      flex:
        1,

      width:
        "100%",

      minWidth:
        0,

      padding:
        18,

      gap:
        12,
    },

    scroll: {
      paddingBottom:
        24,
    },

    screenMobile: {
      padding: 12,
    },

    scrollMobile: {
      paddingBottom: 110,
    },

    grid: {
      width:
        "100%",

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        16,
    },

    gridMobile: {
      flexDirection: "column",
      gap: 12,
    },

    cardWrapper: {
      flex:
        1,

      minWidth:
        280,

      maxWidth:
        430,
    },

    cardWrapperMobile: {
      width:
        "100%",

      minWidth:
        0,

      maxWidth:
        "100%",
    },
  });
