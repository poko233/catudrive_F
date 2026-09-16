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
  BadgeCheck,
  ClipboardList,
  IdCard,
} from "lucide-react-native";

import {
  useCallback,
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
  ChoferReporteCard,
} from "./components/ChoferReporteCard";

import {
  ChoferReporteFiltrosModal,
} from "./components/ChoferReporteFiltrosModal";

import {
  ChoferReporteImpresion,
} from "./components/ChoferReporteImpresion";

import {
  choferReporteService,
} from "./services/chofer-reporte.service";

import {
  AccionReporteChofer,
  ChoferReporteFiltros,
  TipoReporteChofer,
} from "./types/chofer-reporte.types";

import {
  descargarReporteChofer,
  nombreReporteChofer,
} from "./utils/descargarReporteChofer";

import {
  construirTextoReporteChofer,
  descripcionFiltrosReporteChofer,
} from "./utils/chofer-reporte-print.utils";

const reportes = [
  {
    tipo:
      "lista" as const,

    icon:
      ClipboardList,

    badge:
      "GENERAL",

    title:
      "Lista General de Choferes",

    description:
      "Listado completo de choferes con CI, teléfono, licencia, categoría, carnet sindical y estado.",

    tags: [
      "Choferes",
      "Listado",
    ],
  },

  {
    tipo:
      "activos_inactivos" as const,

    icon:
      BadgeCheck,

    badge:
      "ESTADO",

    title:
      "Choferes Activos e Inactivos",

    description:
      "Reporte separado por estado para consultar choferes activos e inactivos en un mismo documento.",

    tags: [
      "Activos",
      "Inactivos",
    ],
  },

  {
    tipo:
      "carnets_sindicales" as const,

    icon:
      IdCard,

    badge:
      "CARNETS",

    title:
      "Carnets Sindicales",

    description:
      "Listado de carnets sindicales asociados a cada chofer con CI, teléfono y estado.",

    tags: [
      "Carnet sindical",
      "CI",
    ],
  },
];

function mensajeError(
  error:
    unknown,
): string {
  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  return "Intenta nuevamente.";
}

function esperar(
  ms:
    number,
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

async function imprimirHtmlEnIframe(
  html:
    string,
): Promise<void> {
  const document =
    (globalThis as any)
      .document;

  if (
    !document
  ) {
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

function esperarDocumentoListo(
  ventana:
    any,

  timeoutMs:
    number,
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
  html:
    string,
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

  let url:
    string |
    null =
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

  if (
    !url
  ) {
    await imprimirHtmlEnIframe(
      html,
    );

    return;
  }

  const liberarUrl =
    () => {
      if (
        url
      ) {
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
    // Intenta imprimir lo que haya cargado.
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

  setTimeout(
    liberarUrl,
    120000,
  );

  ventana.onafterprint =
    () => {
      liberarUrl();
    };

  try {
    ventana.focus();
    ventana.print();
  } catch (
    error
  ) {
    ventana.onafterprint =
      null;

    throw error;
  }
}

export default function ChoferReportesScreen() {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const {
    width:
      windowWidth,
  } =
    useWindowDimensions();

  const isMobile =
    windowWidth <
    768;

  const {
    print,
  } =
    usePrinterConnection();

  const [
    tipoSeleccionado,
    setTipoSeleccionado,
  ] =
    useState<
      TipoReporteChofer |
      null
    >(
      null,
    );

  const [
    accionSeleccionada,
    setAccionSeleccionada,
  ] =
    useState<
      AccionReporteChofer
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
    filtrosImpresion,
    setFiltrosImpresion,
  ] =
    useState<
      ChoferReporteFiltros
    >(
      {},
    );

  const [
    tipoImpresion,
    setTipoImpresion,
  ] =
    useState<
      TipoReporteChofer |
      null
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

  const abrirReporte =
    (
      tipo:
        TipoReporteChofer,

      accion:
        AccionReporteChofer,
    ) => {
      setAccionSeleccionada(
        accion,
      );

      setTipoSeleccionado(
        tipo,
      );
    };

  const generarReporte =
    async (
      filtros:
        ChoferReporteFiltros,
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
          await choferReporteService
            .descargarPdf(
              tipo,
              filtros,
            );

        await descargarReporteChofer(
          blob,
          nombreReporteChofer(
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
        error:
          unknown
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

  const obtenerHtmlImpresion =
    useCallback(
      async (): Promise<string> => {
        if (
          !tipoImpresion
        ) {
          throw new Error(
            "No existe un reporte seleccionado para imprimir.",
          );
        }

        return choferReporteService
          .obtenerHtml(
            tipoImpresion,
            filtrosImpresion,
          );
      },

      [
        filtrosImpresion,
        tipoImpresion,
      ],
    );

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
          "Reporte de choferes";

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
              construirTextoReporteChofer(
                titulo,
                filtrosImpresion,
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
        tipoImpresion,
      ],
    );

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

  return (
    <View
      style={[
        styles.screen,

        isMobile &&
          styles.screenMobile,

        {
          backgroundColor:
            c.background,
        },
      ]}
    >
      <PageHeader
        title="Reportes de Choferes"

        description="Consulta, impresión y descarga de reportes de choferes: lista general, activos e inactivos y carnets sindicales."

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

        contentContainerStyle={[
          styles.scroll,

          isMobile &&
            styles.scrollMobile,
        ]}
      >
        <View
          style={[
            styles.grid,

            isMobile &&
              styles.gridMobile,
          ]}
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
                <ChoferReporteCard
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

      <ChoferReporteFiltrosModal
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

          headerTitle="Reporte de choferes"

          screenTitle={
            configImpresion.title
          }

          screenSubtitle={
            descripcionFiltrosReporteChofer(
              filtrosImpresion,
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
          <ChoferReporteImpresion
            titulo={
              configImpresion.title
            }

            filtros={
              filtrosImpresion
            }
          />
        </ReportPrintModal>
      ) : null}
    </View>
  );
}

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

    screenMobile: {
      padding:
        12,
    },

    scroll: {
      flexGrow:
        1,

      paddingBottom:
        24,
    },

    scrollMobile: {
      paddingBottom:
        18,
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

      alignItems:
        "stretch",
    },

    gridMobile: {
      flexDirection:
        "column",

      flexWrap:
        "nowrap",

      gap:
        12,
    },

    cardWrapper: {
      width:
        "32%",

      minWidth:
        300,

      flexGrow:
        1,

      flexBasis:
        320,
    },

    cardWrapperMobile: {
      width:
        "100%",

      minWidth:
        0,

      flexBasis:
        "auto",
    },
  });
