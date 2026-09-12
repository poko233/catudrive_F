import {
  PageHeader,
} from "@/components/ui/PageHeader";

import {
  Button,
} from "@/components/ui/Button";

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
  CircleDollarSign,
  Clock3,
  MapPin,
  Package,
  PackageCheck,
} from "lucide-react-native";

import {
  useCallback,
  useEffect,
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
  EncomiendaReporteCard,
} from "./components/EncomiendaReporteCard";

import {
  EncomiendaReporteFiltrosModal,
} from "./components/EncomiendaReporteFiltrosModal";

import {
  EncomiendaReporteImpresion,
} from "./components/EncomiendaReporteImpresion";

import {
  encomiendaReporteService,
} from "./services/encomienda-reporte.service";

import {
  encomiendaService,
} from "../services/encomienda.service";

import {
  EncomiendaCatalogoRuta,
} from "../types/encomienda.types";

import {
  EncomiendaReporteFiltros,
  EncomiendaReporteResponse,
  TipoReporteEncomienda,
} from "./types/encmienda-reporte.types";

import {
  descargarReporteEncomienda,
  nombreReporteEncomienda,
} from "./utils/descargarReporteEncomienda";

import {
  construirTextoReporteEncomienda,
  descripcionFiltrosReporte,
} from "./utils/encomienda-reporte-print.utils";

/*
|--------------------------------------------------------------------------
| ACCIÓN
|--------------------------------------------------------------------------
*/

type AccionReporteEncomienda =
  | "imprimir"
  | "pdf"
  | "csv";

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN REPORTES
|--------------------------------------------------------------------------
*/

const reportes = [
  {
    tipo:
      "registradas" as const,

    icon:
      Package,

    badge:
      "REGISTRADAS",

    title:
      "Encomiendas Registradas",

    description:
      "Reporte de encomiendas que actualmente se encuentran en estado registrada.",

    tags: [
      "Registradas",
      "Por fecha",
    ],
  },

  {
    tipo:
      "pendientes" as const,

    icon:
      Clock3,

    badge:
      "PENDIENTES",

    title:
      "Encomiendas Pendientes",

    description:
      "Encomiendas registradas o en tránsito que todavía no fueron entregadas.",

    tags: [
      "Pendientes",
      "Estado",
    ],
  },

  {
    tipo:
      "entregadas" as const,

    icon:
      PackageCheck,

    badge:
      "ENTREGADAS",

    title:
      "Encomiendas Entregadas",

    description:
      "Historial de encomiendas que completaron correctamente el proceso de entrega.",

    tags: [
      "Entregadas",
      "Por fecha",
    ],
  },

  {
    tipo:
      "por_destino" as const,

    icon:
      MapPin,

    badge:
      "DESTINOS",

    title:
      "Encomiendas por Destino",

    description:
      "Reporte detallado y resumen de encomiendas agrupadas según su destino.",

    tags: [
      "Destino",
      "Ruta",
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
      "Ingresos por Encomiendas",

    description:
      "Detalle de importes generados por encomiendas y total acumulado según los filtros aplicados.",

    tags: [
      "Ingresos",
      "Por fecha",
    ],
  },
];

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export default function EncomiendaReportesScreen() {
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
      TipoReporteEncomienda | null
    >(
      null,
    );

  const [
    accionSeleccionada,
    setAccionSeleccionada,
  ] =
    useState<
      AccionReporteEncomienda
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
      EncomiendaCatalogoRuta[]
    >(
      [],
    );

  const [
    loadingRutas,
    setLoadingRutas,
  ] =
    useState(
      false,
    );

  const [
    reporte,
    setReporte,
  ] =
    useState<
      EncomiendaReporteResponse | null
    >(
      null,
    );

  const [
    filtrosImpresion,
    setFiltrosImpresion,
  ] =
    useState<
      EncomiendaReporteFiltros
    >(
      {},
    );

  const [
    tipoImpresion,
    setTipoImpresion,
  ] =
    useState<
      TipoReporteEncomienda | null
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
  | CARGAR RUTAS
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      let activo =
        true;

      const cargarRutas =
        async () => {
          try {
            setLoadingRutas(
              true,
            );

            const response =
              await encomiendaService
                .catalogos();

            if (!activo) {
              return;
            }

            setRutas(
              response.rutas ??
              [],
            );
          } finally {
            if (activo) {
              setLoadingRutas(
                false,
              );
            }
          }
        };

      void cargarRutas();

      return () => {
        activo =
          false;
      };
    },
    [],
  );

  /*
  |--------------------------------------------------------------------------
  | ABRIR REPORTE
  |--------------------------------------------------------------------------
  */

  const abrirReporte =
    (
      tipo:
        TipoReporteEncomienda,

      accion:
        AccionReporteEncomienda,
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
  */

  const generarReporte =
    async (
      filtros:
        EncomiendaReporteFiltros,
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
          const response =
            await encomiendaReporteService
              .obtener(
                tipo,
                filtros,
              );

          setReporte(
            response,
          );

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

        if (
          accionSeleccionada ===
          "pdf"
        ) {
          const blob =
            await encomiendaReporteService
              .descargarPdf(
                tipo,
                filtros,
              );

          await descargarReporteEncomienda(
            blob,
            nombreReporteEncomienda(
              tipo,
              "pdf",
            ),
            "application/pdf",
          );

          Toast.show({
            type:
              "success",

            text1:
              "Reporte PDF generado",

            text2:
              "El archivo está listo para guardar o compartir.",
          });
        } else {
          const blob =
            await encomiendaReporteService
              .descargarCsv(
                tipo,
                filtros,
              );

          await descargarReporteEncomienda(
            blob,
            nombreReporteEncomienda(
              tipo,
              "csv",
            ).replace(/\.csv$/i, ".xlsx"),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          );

          Toast.show({
            type:
              "success",

            text1:
              "Reporte Excel generado",

            text2:
              "El archivo está listo para guardar o compartir.",
          });
        }

        setTipoSeleccionado(
          null,
        );
      } catch (
        error:
          any
      ) {
        Toast.show({
          type:
            "error",

          text1:
            "No se pudo generar el reporte",

          text2:
            error?.message ??
            "Intenta nuevamente.",
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

        return encomiendaReporteService
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
          !reporte ||
          !tipoImpresion
        ) {
          throw new Error(
            "No existe información del reporte para imprimir.",
          );
        }

        const inicio =
          Date.now();

        if (
          Platform.OS ===
          "web"
        ) {
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

          await new Promise<void>(
            (
              resolve,
            ) =>
              setTimeout(
                resolve,
                450,
              ),
          );

          frameWindow.focus();
          frameWindow.print();

          setTimeout(
            () =>
              iframe.remove(),
            1500,
          );
        } else {
          await print({
            type:
              "document",

            title:
              reporte.titulo,

            html,

            text:
              construirTextoReporteEncomienda(
                reporte,
                filtrosImpresion,
                rutas,
              ),

            cutPaper:
              true,
          });
        }

        return Date.now() -
          inicio;
      },
      [
        filtrosImpresion,
        print,
        reporte,
        rutas,
        tipoImpresion,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | TÍTULOS
  |--------------------------------------------------------------------------
  */

  const tituloModal =
    reportes.find(
      (
        item,
      ) =>
        item.tipo ===
        tipoSeleccionado,
    )
      ?.title ??
    "Generar reporte";

  const actionLabel =
    accionSeleccionada ===
    "imprimir"
      ? "Imprimir reporte"
      : accionSeleccionada ===
        "pdf"
        ? "Descargar PDF"
        : "Descargar Excel";

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
        title="Reportes de Encomiendas"

        description="Consulta, impresión y descarga de reportes relacionados con registro, entregas, destinos e ingresos."

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
            ) => (
              <EncomiendaReporteCard
                key={
                  item.tipo
                }

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

                onCsv={() =>
                  abrirReporte(
                    item.tipo,
                    "csv",
                  )
                }
              />
            ),
          )}
        </View>
      </ScrollView>

      <EncomiendaReporteFiltrosModal
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

        loadingRutas={
          loadingRutas
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

      {reporte &&
      tipoImpresion ? (
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
                reporte.titulo,
            });
          }}

          resetKey={`${tipoImpresion}-${JSON.stringify(
            filtrosImpresion,
          )}`}

          title={
            reporte.titulo
          }

          headerTitle="Reporte de encomiendas"

          screenTitle={
            reporte.titulo
          }

          screenSubtitle={
            descripcionFiltrosReporte(
              filtrosImpresion,
              rutas,
            )
          }

          screenTotalLabel={
            reporte.total_ingresos !==
            undefined
              ? "Ingresos"
              : "Registros"
          }

          screenTotalValue={
            reporte.total_ingresos !==
            undefined
              ? `Bs ${reporte.total_ingresos}`
              : String(
                  reporte.total_registros,
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
          <EncomiendaReporteImpresion
            reporte={
              reporte
            }

            filtros={
              filtrosImpresion
            }

            rutas={
              rutas
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
  });
