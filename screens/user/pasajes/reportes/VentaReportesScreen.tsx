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
  CalendarDays,
  Car,
  CircleDollarSign,
  ClipboardList,
  MapPin,
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
  VentaReporteCard,
} from "./components/VentaReporteCard";

import {
  VentaReporteFiltrosModal,
} from "./components/VentaReporteFiltrosModal";

import {
  VentaReporteImpresion,
} from "./components/VentaReporteImpresion";

import {
  ventaReporteService,
} from "./services/venta-reporte.service";

import {
  useViajesPlanilla,
} from "./hooks/useViajesPlanilla";

import {
  getRutas,
} from "../../rutas/services/ruta.service";

import {
  getVehiculos,
} from "../../vehiculos/services/vehiculo.service";

import {
  getChoferes,
} from "../../choferes/services/chofer.service";

import {
  AccionReporteVenta,
  SolicitudReporteVenta,
  TipoReporteVenta,
  TipoReporteVentaAnalitico,
  VentaReporteFiltros,
} from "./types/venta-reporte.types";

import {
  Ruta,
} from "../../rutas/types/ruta.types";

import {
  Vehiculo,
} from "../../vehiculos/types/vehiculo.types";

import {
  Chofer,
} from "../../choferes/types/chofer.types";

import {
  descargarReporteVenta,
  nombrePlanillaVenta,
  nombreReporteVenta,
} from "./utils/descargarReporteVenta";

import {
  construirTextoReporteVenta,
  descripcionFiltrosReporteVenta,
  EtiquetasFiltrosVenta,
} from "./utils/venta-reporte-print.utils";

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN REPORTES
|--------------------------------------------------------------------------
|
| Espejo de los 5 tipos analíticos reales del backend más la
| planilla oficial de pasajeros por viaje.
|
*/

const reportes = [
  {
    tipo:
      "vendidos_por_fecha" as const,

    icon:
      CalendarDays,

    badge:
      "POR FECHA",

    title:
      "Pasajes Vendidos por Fecha",

    description:
      "Ventas agrupadas por día con totales de ventas, asientos e ingresos.",

    tags: [
      "Por fecha",
      "Ingresos",
    ],
  },

  {
    tipo:
      "por_ruta" as const,

    icon:
      MapPin,

    badge:
      "POR RUTA",

    title:
      "Ventas por Ruta",

    description:
      "Ventas agrupadas por ruta con filtro opcional por ruta específica.",

    tags: [
      "Ruta",
      "Destino",
    ],
  },

  {
    tipo:
      "por_vehiculo" as const,

    icon:
      Car,

    badge:
      "POR VEHÍCULO",

    title:
      "Ventas por Vehículo",

    description:
      "Ventas agrupadas por vehículo con filtro opcional por placa.",

    tags: [
      "Vehículo",
      "Placa",
    ],
  },

  {
    tipo:
      "por_chofer" as const,

    icon:
      Users,

    badge:
      "POR CHOFER",

    title:
      "Ventas por Chofer",

    description:
      "Ventas agrupadas por chofer con filtro opcional por chofer.",

    tags: [
      "Chofer",
      "Asignación",
    ],
  },

  {
    tipo:
      "ingresos" as const,

    icon:
      CircleDollarSign,

    badge:
      "INGRESOS",

    title:
      "Ingresos por Ventas",

    description:
      "Ingresos agrupados por forma de pago con filtro opcional.",

    tags: [
      "Ingresos",
      "Forma de pago",
    ],
  },

  {
    tipo:
      "planilla" as const,

    icon:
      ClipboardList,

    badge:
      "PLANILLA",

    title:
      "Planilla de Pasajeros por Viaje",

    description:
      "Planilla oficial con los pasajeros (venta Pagada) de un viaje específico.",

    tags: [
      "Viaje",
      "Pasajeros",
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

export default function VentaReportesScreen() {
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
      TipoReporteVenta | null
    >(
      null,
    );

  const [
    accionSeleccionada,
    setAccionSeleccionada,
  ] =
    useState<
      AccionReporteVenta
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
    rutas,
    setRutas,
  ] =
    useState<
      Ruta[]
    >(
      [],
    );

  const [
    vehiculos,
    setVehiculos,
  ] =
    useState<
      Vehiculo[]
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

  const {
    viajes,
    loading:
      loadingViajes,
    loadingMore:
      loadingMasViajes,
    allLoaded:
      finViajes,
    error:
      errorViajes,
    cargarInicial:
      cargarViajesPlanilla,
    cargarMas:
      cargarMasViajes,
  } =
    useViajesPlanilla();

  const [
    filtrosImpresion,
    setFiltrosImpresion,
  ] =
    useState<
      VentaReporteFiltros
    >(
      {},
    );

  const [
    idViajeImpresion,
    setIdViajeImpresion,
  ] =
    useState<
      number | null
    >(
      null,
    );

  const [
    tipoImpresion,
    setTipoImpresion,
  ] =
    useState<
      TipoReporteVenta | null
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
  | Rutas: getRutas() — caché central CK.rutas().
  | Vehículos: getVehiculos() — caché "vehiculos:listado".
  | Choferes: getChoferes() — caché "choferes:listado".
  | Viajes: useViajesPlanilla() — getViajes({estado,page,per_page:15})
  |   con caché por filtros+página del servicio de pasajes. Fases:
  |   "En curso" primero, "Vendiendo" al hacer scroll, nunca
  |   "Finalizado"/"Cancelado". El backend ya aplica el aislamiento
  |   por rol, así que el selector solo ofrece viajes imprimibles.
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
              rutasResponse,
              vehiculosResponse,
              choferesResponse,
            ] =
              await Promise.all([
                getRutas(),
                getVehiculos(),
                getChoferes(),
              ]);

            if (!activo) {
              return;
            }

            setRutas(
              rutasResponse ??
              [],
            );

            setVehiculos(
              vehiculosResponse ??
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
  | VIAJES PARA LA PLANILLA (carga inicial + toast de error)
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      void cargarViajesPlanilla();
    },
    [
      cargarViajesPlanilla,
    ],
  );

  useEffect(
    () => {
      if (
        !errorViajes
      ) {
        return;
      }

      Toast.show({
        type:
          "error",

        text1:
          "No se pudieron cargar los viajes",

        text2:
          errorViajes,
      });
    },
    [
      errorViajes,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | ETIQUETAS (nombres resueltos desde catálogos)
  |--------------------------------------------------------------------------
  */

  const etiquetasImpresion: EtiquetasFiltrosVenta =
    useMemo(
      () => {
        const ruta =
          filtrosImpresion.id_ruta !==
          undefined
            ? rutas.find(
                (
                  item,
                ) =>
                  item.id ===
                  filtrosImpresion.id_ruta,
              )
            : undefined;

        const vehiculo =
          filtrosImpresion.id_vehiculo !==
          undefined
            ? vehiculos.find(
                (
                  item,
                ) =>
                  item.id ===
                  filtrosImpresion.id_vehiculo,
              )
            : undefined;

        const chofer =
          filtrosImpresion.id_chofer !==
          undefined
            ? choferes.find(
                (
                  item,
                ) =>
                  item.id ===
                  filtrosImpresion.id_chofer,
              )
            : undefined;

        return {
          rutaNombre:
            ruta
              ? `${ruta.origen} → ${ruta.destino}`
              : null,

          vehiculoNombre:
            vehiculo
              ? `${vehiculo.placa} · ${vehiculo.marca} ${vehiculo.modelo}`
              : null,

          choferNombre:
            chofer?.nombre_completo ??
            null,
        };
      },

      [
        choferes,
        filtrosImpresion,
        rutas,
        vehiculos,
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
        TipoReporteVenta,

      accion:
        AccionReporteVenta,
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
      solicitud:
        SolicitudReporteVenta,
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

        const esPlanilla =
          tipo ===
          "planilla";

        if (
          accionSeleccionada ===
          "imprimir"
        ) {
          setFiltrosImpresion(
            solicitud.filtros,
          );

          setIdViajeImpresion(
            esPlanilla
              ? (solicitud.idViaje ??
                null)
              : null,
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

        if (
          esPlanilla
        ) {
          const blob =
            await ventaReporteService
              .descargarPdfPlanilla(
                solicitud.idViaje as number,
              );

          await descargarReporteVenta(
            blob,
            nombrePlanillaVenta(
              solicitud.idViaje as number,
            ),
          );
        } else {
          const blob =
            await ventaReporteService
              .descargarPdf(
                tipo as TipoReporteVentaAnalitico,
                solicitud.filtros,
              );

          await descargarReporteVenta(
            blob,
            nombreReporteVenta(
              tipo as TipoReporteVentaAnalitico,
            ),
          );
        }

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

        if (
          tipoImpresion ===
          "planilla"
        ) {
          if (
            !idViajeImpresion
          ) {
            throw new Error(
              "No existe un viaje seleccionado para imprimir.",
            );
          }

          return ventaReporteService
            .obtenerHtmlPlanilla(
              idViajeImpresion,
            );
        }

        return ventaReporteService
          .obtenerHtml(
            tipoImpresion,
            filtrosImpresion,
          );
      },
      [
        filtrosImpresion,
        idViajeImpresion,
        tipoImpresion,
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
          "Reporte de ventas";

        const esPlanilla =
          tipoImpresion ===
          "planilla";

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
              construirTextoReporteVenta(
                titulo,
                filtrosImpresion,
                etiquetasImpresion,
                esPlanilla,
                idViajeImpresion ??
                  undefined,
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
        idViajeImpresion,
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

  const esPlanillaImpresion =
    tipoImpresion ===
    "planilla";

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
        title="Reportes de Ventas"

        description="Consulta, impresión y descarga de reportes de pasajes: vendidos por fecha, por ruta, vehículo, chofer, ingresos y planilla por viaje."

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
                <VentaReporteCard
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

      <VentaReporteFiltrosModal
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

        rutas={
          rutas
        }

        vehiculos={
          vehiculos
        }

        choferes={
          choferes
        }

        loadingCatalogos={
          loadingCatalogos
        }

        viajes={
          viajes
        }

        loadingViajes={
          loadingViajes
        }

        loadingMasViajes={
          loadingMasViajes
        }

        finViajes={
          finViajes
        }

        onCargarMasViajes={
          cargarMasViajes
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

          resetKey={`${tipoImpresion}-${idViajeImpresion ?? ""}-${JSON.stringify(
            filtrosImpresion,
          )}`}

          title={
            configImpresion.title
          }

          headerTitle="Reporte de ventas"

          screenTitle={
            configImpresion.title
          }

          screenSubtitle={
            descripcionFiltrosReporteVenta(
              filtrosImpresion,
              etiquetasImpresion,
              esPlanillaImpresion,
              idViajeImpresion ??
                undefined,
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
          <VentaReporteImpresion
            titulo={
              configImpresion.title
            }

            filtros={
              filtrosImpresion
            }

            etiquetas={
              etiquetasImpresion
            }

            esPlanilla={
              esPlanillaImpresion
            }

            idViaje={
              idViajeImpresion ??
              undefined
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
