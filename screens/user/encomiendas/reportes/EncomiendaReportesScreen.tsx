import {
  PageHeader,
} from "@/components/ui/PageHeader";

import {
  Button,
} from "@/components/ui/Button";

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
  useEffect,
  useState,
} from "react";

import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  router,
} from "expo-router";

import {
  EncomiendaReporteCard,
} from "./components/EncomiendaReporteCard";

import {
  EncomiendaReporteFiltrosModal,
} from "./components/EncomiendaReporteFiltrosModal";

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
    ,
    setReporte,
  ] =
    useState<
      EncomiendaReporteResponse | null
    >(
      null,
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
    ) => {
      setReporte(
        null,
      );

      setTipoSeleccionado(
        tipo,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | GENERAR
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

      try {
        setLoading(
          true,
        );

        const response =
          await encomiendaReporteService
            .obtener(
              tipoSeleccionado,
              filtros,
            );

        setReporte(
          response,
        );

        /*
        |--------------------------------------------------------------------------
        | IMPRESIÓN
        |--------------------------------------------------------------------------
        |
        | Aquí conectaremos posteriormente el componente de impresión.
        |
        | response.tipo
        | response.titulo
        | response.total_registros
        | response.items
        | response.resumen_destinos
        | response.total_ingresos
        |
        */

        setTipoSeleccionado(
          null,
        );
      } finally {
        setLoading(
          false,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | TÍTULO MODAL
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

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={[
        styles.screen,

        {
          backgroundColor:
            c.background,
        },
      ]}
    >
      <PageHeader
        title="Reportes de Encomiendas"

        description="Consulta e impresión de reportes relacionados con registro, entregas, destinos e ingresos."

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
          styles.scroll
        }
      >
        <View
          style={
            styles.grid
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

                onPress={() =>
                  abrirReporte(
                    item.tipo,
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
  });
