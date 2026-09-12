import {
  router,
} from "expo-router";

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  Table,
  TableColumn,
} from "@/components/Table";

import Visibility from "@/components/Visibility";

import {
  Badge,
} from "@/components/ui/Badge";

import {
  Button,
} from "@/components/ui/Button";

import {
  Card,
} from "@/components/ui/Card";

import {
  IconButton,
} from "@/components/ui/IconButton";

import {
  PageHeader,
} from "@/components/ui/PageHeader";

import {
  SearchBar,
} from "@/components/ui/SearchBar";

import {
  Pagination,
  PaginationMeta,
} from "@/components/ui/Pagination";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  CheckCircle2,
  Eye,
  QrCode,
  Package,
  PackageCheck,
  Pencil,
  Send,
  Truck,
  XCircle,
} from "lucide-react-native";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import Toast from "react-native-toast-message";

import {
  printerService,
} from "@/services/printer";

import {
  encomiendaService,
} from "./services/encomienda.service";

import {
  EncomiendaQrScannerModal,
} from "./components/EncomiendaQrScannerModal";

import {
  EncomiendaPrintPreviewModal,
} from "./components/EncomiendaPrintPreviewModal";

import {
  EncomiendaAsignarModal,
} from "./components/EncomiendaAsignarModal";

import {
  EncomiendaDetalleModal,
} from "./components/EncomiendaDetalleModal";

import {
  EncomiendaEntregaModal,
} from "./components/EncomiendaEntregaModal";

import {
  EncomiendaFormModal,
} from "./components/EncomiendaFormModal";

import {
  useEncomiendas,
} from "./hooks/useEncomiendas";

import {
  Encomienda,
  EstadoEncomienda,
} from "./types/encomienda.types";

/*
|--------------------------------------------------------------------------
| FILTRO
|--------------------------------------------------------------------------
*/

type Filtro =
  | "TODAS"
  | "REGISTRADAS"
  | "EN_TRANSITO"
  | "ENTREGADAS"
  | "ANULADAS";

/*
|--------------------------------------------------------------------------
| COLUMNAS
|--------------------------------------------------------------------------
*/

const columns:
  TableColumn[] = [
    {
      key:
        "guia",

      label:
        "Guía",

      flex:
        1,

      align:
        "center",
    },

    {
      key:
        "fecha",

      label:
        "Fecha",

      flex:
        0.9,

      align:
        "center",
    },

    {
      key:
        "remitente",

      label:
        "Remitente",

      flex:
        1.4,

      align:
        "center",
    },

    {
      key:
        "destinatario",

      label:
        "Destinatario",

      flex:
        1.4,

      align:
        "center",
    },

    {
      key:
        "ruta",

      label:
        "Ruta",

      flex:
        1.5,

      align:
        "center",
    },

    {
      key:
        "cantidad",

      label:
        "Cant.",

      flex:
        0.6,

      align:
        "center",
    },

    {
      key:
        "precio",

      label:
        "Precio",

      flex:
        0.85,

      align:
        "center",
    },

    {
      key:
        "estado",

      label:
        "Estado",

      flex:
        0.9,

      align:
        "center",
    },

    {
      key:
        "acciones",

      label:
        "Acciones",

      flex:
        1.35,

      align:
        "center",
    },
  ];

/*
|--------------------------------------------------------------------------
| FECHA
|--------------------------------------------------------------------------
*/

function fecha(
  value:
    string | null,
): string {
  if (!value) {
    return "—";
  }

  const soloFecha =
    value.split(
      "T",
    )[0];

  const [
    year,
    month,
    day,
  ] =
    soloFecha.split(
      "-",
    );

  return year &&
    month &&
    day
    ? `${day}/${month}/${year}`
    : value;
}

/*
|--------------------------------------------------------------------------
| ESTADO LABEL
|--------------------------------------------------------------------------
*/

function estadoLabel(
  estado:
    EstadoEncomienda,
): string {
  switch (
    estado
  ) {
    case "REGISTRADA":
      return "Registrada";

    case "EN_TRANSITO":
      return "En tránsito";

    case "ENTREGADA":
      return "Entregada";

    case "ANULADA":
      return "Anulada";

    default:
      return estado;
  }
}

/*
|--------------------------------------------------------------------------
| ESTADO VARIANT
|--------------------------------------------------------------------------
*/

function estadoVariant(
  estado:
    EstadoEncomienda,
):
  | "info"
  | "warning"
  | "success"
  | "destructive" {
  switch (
    estado
  ) {
    case "REGISTRADA":
      return "info";

    case "EN_TRANSITO":
      return "warning";

    case "ENTREGADA":
      return "success";

    case "ANULADA":
      return "destructive";
  }
}

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export default function EncomiendasScreen() {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 768;

  const {
    encomiendas,

    loading,

    saving,

    processingId,

    catalogos,

    loadingCatalogos,

    meta,

    perPage,

    resumen,

    cambiarFiltros,

    irAPagina,

    refresh,

    crear,

    actualizar,

    cargarCatalogos,

    asignar,

    entregar,

    anular,

    escanearQr,
  } =
    useEncomiendas();

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    filtro,
    setFiltro,
  ] =
    useState<Filtro>(
      "REGISTRADAS",
    );

  const [
    formVisible,
    setFormVisible,
  ] =
    useState(
      false,
    );

  const [
    editing,
    setEditing,
  ] =
    useState<
      Encomienda | null
    >(
      null,
    );

  const [
    detalle,
    setDetalle,
  ] =
    useState<
      Encomienda | null
    >(
      null,
    );

  const [
    asignarItem,
    setAsignarItem,
  ] =
    useState<
      Encomienda | null
    >(
      null,
    );

  const [
    entregarItem,
    setEntregarItem,
  ] =
    useState<
      Encomienda | null
    >(
      null,
    );

  const [printingQr, setPrintingQr] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerItem, setScannerItem] = useState<Encomienda | null>(null);
  const [scanningQr, setScanningQr] = useState(false);
  const [printPreviewVisible, setPrintPreviewVisible] = useState(false);
  const [printPreviewHtml, setPrintPreviewHtml] = useState("");
  const [printPreviewTitle, setPrintPreviewTitle] = useState("Imprimir encomienda");
  const [printPreviewLoading, setPrintPreviewLoading] = useState(false);
  const [generatingQr, setGeneratingQr] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | FILTROS + BÚSQUEDA PAGINADOS EN BACKEND
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const estado =
      filtro === "REGISTRADAS"
        ? "REGISTRADA"
        : filtro === "EN_TRANSITO"
          ? "EN_TRANSITO"
          : filtro === "ENTREGADAS"
            ? "ENTREGADA"
            : filtro === "ANULADAS"
              ? "ANULADA"
              : undefined;

    const timeout = setTimeout(() => {
      cambiarFiltros({
        buscar: search,
        estado,
      });
    }, 300);

    return () =>
      clearTimeout(timeout);
  }, [
    cambiarFiltros,
    filtro,
    search,
  ]);

  const paginationMeta: PaginationMeta = {
    total: meta?.total ?? 0,
    page: meta?.current_page ?? 1,
    perPage: meta?.per_page ?? perPage,
  };

  /*
  |--------------------------------------------------------------------------
  | CREAR
  |--------------------------------------------------------------------------
  */

  const abrirCrear =
    () => {
      setEditing(
        null,
      );

      setFormVisible(
        true,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | EDITAR
  |--------------------------------------------------------------------------
  */

  const abrirEditar =
    (
      item:
        Encomienda,
    ) => {
      setEditing(
        item,
      );

      setFormVisible(
        true,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CERRAR FORM
  |--------------------------------------------------------------------------
  */

  const cerrarForm =
    () => {
      if (saving) {
        return;
      }

      setFormVisible(
        false,
      );

      setEditing(
        null,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | ANULAR
  |--------------------------------------------------------------------------
  */

  const confirmarAnulacion =
    async (
      item:
        Encomienda,
    ) => {
      if (
        processingId !==
        null
      ) {
        return;
      }

      await anular(
        item,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | QR / IMPRESIÓN / ESCÁNER
  |--------------------------------------------------------------------------
  */

  const abrirVistaPreviaImpresion = useCallback((html: string, title: string) => {
    setPrintPreviewHtml(html);
    setPrintPreviewTitle(title);
    setPrintPreviewVisible(true);
  }, []);

  const imprimirHtmlReal = useCallback(async (html: string): Promise<void> => {
    await printerService.print(printerService.getSystemPrinter(), {
      type: "receipt",
      title: "Encomienda",
      html,
    });
  }, []);

  const abrirQr = useCallback(async (item: Encomienda) => {
    setGeneratingQr(true);
    setPrintPreviewVisible(false);
    setPrintPreviewHtml("");
    setPrintPreviewLoading(false);

    try {
      const html = await encomiendaService.obtenerTicketQrHtml(item.id, "etiqueta");
      setPrintPreviewTitle(`Etiqueta QR - ${item.guia ?? "Encomienda"}`);
      setPrintPreviewHtml(html);
      setPrintPreviewVisible(true);
    } catch (error: any) {
      Toast.show({ type: "error", text1: "No se pudo generar el QR", text2: error?.message || "Intenta nuevamente." });
    } finally {
      setGeneratingQr(false);
    }
  }, []);

  const procesarEscaneo = useCallback(async (value: string) => {
    setScanningQr(true);
    const item = await escanearQr(value);
    setScannerItem(item);
    setScanningQr(false);
  }, [escanearQr]);

  const imprimirDetalleEscaneado = useCallback(async () => {
    if (!scannerItem) return;

    setPrintingQr(true);
    try {
      const html = await encomiendaService.obtenerTicketQrHtml(scannerItem.id, "comprobante");

      if (Platform.OS === "web") {
        abrirVistaPreviaImpresion(html, `Detalle de encomienda - ${scannerItem.guia ?? "Encomienda"}`);
        return;
      }

      await imprimirHtmlReal(html);
    } catch (error: any) {
      Toast.show({ type: "error", text1: "No se pudo preparar la impresión", text2: error?.message || "Intenta nuevamente." });
    } finally {
      setPrintingQr(false);
    }
  }, [abrirVistaPreviaImpresion, imprimirHtmlReal, scannerItem]);

  /*
  |--------------------------------------------------------------------------
  | ACCIONES REUTILIZABLES
  |--------------------------------------------------------------------------
  */

  const renderAcciones = (item: Encomienda, mobile = false) => (
    <View style={[styles.actions, mobile && styles.mobileActions]}>
      <Visibility action="Ver" selector=".encomiendas-ver">
        <IconButton icon={Eye} size="sm" variant="secondary" accessibilityLabel="Ver encomienda" onPress={() => setDetalle(item)} />
      </Visibility>

      {item.qr_disponible ? (
        <Visibility action="Ver" selector=".encomiendas-qr">
          <IconButton icon={QrCode} size="sm" variant="secondary" accessibilityLabel="Ver QR de encomienda" disabled={saving || processingId !== null} onPress={() => void abrirQr(item)} />
        </Visibility>
      ) : null}

      {item.estado === "REGISTRADA" ? (
        <>
          <Visibility action="Editar" selector=".encomiendas-editar">
            <IconButton icon={Pencil} size="sm" variant="secondary" accessibilityLabel="Editar encomienda" disabled={saving || processingId !== null} onPress={() => abrirEditar(item)} />
          </Visibility>
          <Visibility action="Editar" selector=".encomiendas-asignar">
            <IconButton icon={Send} size="sm" variant="secondary" accessibilityLabel="Asignar encomienda" disabled={saving || processingId !== null} onPress={() => setAsignarItem(item)} />
          </Visibility>
          <Visibility action="Editar" selector=".encomiendas-anular">
            <IconButton icon={XCircle} size="sm" variant="destructive" accessibilityLabel="Anular encomienda" loading={processingId === item.id} disabled={saving} onPress={() => void confirmarAnulacion(item)} />
          </Visibility>
        </>
      ) : null}

      {item.estado === "EN_TRANSITO" ? (
        <Visibility action="Editar" selector=".encomiendas-entregar">
          <IconButton icon={CheckCircle2} size="sm" variant="secondary" accessibilityLabel="Entregar encomienda" disabled={saving || processingId !== null} onPress={() => setEntregarItem(item)} />
        </Visibility>
      ) : null}
    </View>
  );

  const filtrosResumen = [
    { key: "TODAS" as Filtro, label: "Todas", value: resumen.total, icon: Package, color: c.primary },
    { key: "REGISTRADAS" as Filtro, label: "Registradas", value: resumen.registradas, icon: Package, color: c.primary },
    { key: "EN_TRANSITO" as Filtro, label: "En tránsito", value: resumen.enTransito, icon: Truck, color: c.warning },
    { key: "ENTREGADAS" as Filtro, label: "Entregadas", value: resumen.entregadas, icon: PackageCheck, color: c.success },
    { key: "ANULADAS" as Filtro, label: "Anuladas", value: resumen.anuladas, icon: XCircle, color: c.textSecondary },
  ];

  const headerActions = (
    <View style={[styles.headerActions, isMobile && styles.headerActionsMobile]}>
      <Visibility action="Crear" selector=".encomiendas-crear">
        <Button title="Nueva encomienda" style={isMobile ? styles.headerButtonMobile : undefined} disabled={saving || processingId !== null} onPress={abrirCrear} />
      </Visibility>
      <Visibility action="Ver" selector=".encomiendas-escanear-qr">
        <Button title="Escanear QR" variant="secondary" style={isMobile ? styles.headerButtonMobile : undefined} disabled={saving || processingId !== null} onPress={() => { setScannerItem(null); setScannerVisible(true); }} />
      </Visibility>
      <Button title="Reportes" variant="secondary" style={isMobile ? styles.headerButtonMobile : undefined} disabled={saving || processingId !== null} onPress={() => router.push("/encomiendas-reportes")} />
      <Visibility action="Ver" selector=".encomiendas-refrescar">
        <Button title="Actualizar" variant="secondary" style={isMobile ? styles.headerButtonMobile : undefined} loading={loading} disabled={saving || processingId !== null} onPress={() => void refresh()} />
      </Visibility>
    </View>
  );

  const resumenDesktop = (
    <View style={styles.summary}>
      {filtrosResumen.map((item) => {
        const Icon = item.icon;
        const activo = filtro === item.key;
        return (
          <Pressable key={item.key} style={styles.summaryPressable} onPress={() => setFiltro(item.key)}>
            <Card style={[styles.summaryCard, activo ? { borderColor: c.primary, borderWidth: 2 } : null]}>
              <Icon size={20} color={item.color} />
              <View>
                <ThemedText style={styles.summaryValue}>{item.value}</ThemedText>
                <ThemedText>{item.label}</ThemedText>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );

  const resumenMobile = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileFiltersContent} style={styles.mobileFilters}>
      {filtrosResumen.map((item) => {
        const Icon = item.icon;
        const activo = filtro === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => setFiltro(item.key)}
            style={[
              styles.mobileFilterChip,
              { backgroundColor: activo ? c.primary : c.card, borderColor: activo ? c.primary : c.border },
            ]}
          >
            <Icon size={16} color={activo ? c.primaryForeground : item.color} />
            <ThemedText style={[styles.mobileFilterValue, activo ? { color: c.primaryForeground } : null]}>{item.value}</ThemedText>
            <ThemedText style={[styles.mobileFilterLabel, activo ? { color: c.primaryForeground } : { color: c.textSecondary }]}>{item.label}</ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const listaMobile = (
    <View style={styles.mobileList}>
      {loading && encomiendas.length === 0 ? (
        <View style={styles.mobileLoading}><ActivityIndicator color={c.primary} /><ThemedText style={{ color: c.textSecondary }}>Cargando encomiendas...</ThemedText></View>
      ) : encomiendas.length === 0 ? (
        <Card style={styles.mobileEmpty}>
          <Package size={28} color={c.textSecondary} />
          <ThemedText style={styles.mobileEmptyTitle}>Sin encomiendas</ThemedText>
          <ThemedText style={[styles.mobileEmptyText, { color: c.textSecondary }]}>No hay registros para este filtro o búsqueda.</ThemedText>
        </Card>
      ) : (
        encomiendas.map((item) => (
          <Card key={item.id} style={styles.mobileCard}>
            <View style={styles.mobileCardHeader}>
              <View style={styles.mobileCardTitleWrap}>
                <ThemedText style={styles.mobileGuide}>{item.guia ?? "Sin guía"}</ThemedText>
                <ThemedText style={[styles.mobileDate, { color: c.textSecondary }]}>{fecha(item.fecha)}</ThemedText>
              </View>
              <Badge label={estadoLabel(item.estado)} variant={estadoVariant(item.estado)} />
            </View>

            <View style={[styles.mobileRoute, { backgroundColor: c.backgroundSecondary ?? c.background }]}>
              <Truck size={16} color={c.primary} />
              <ThemedText numberOfLines={2} style={styles.mobileRouteText}>{item.origen} → {item.destino}</ThemedText>
            </View>

            <View style={styles.mobilePeople}>
              <View style={styles.mobilePersonBlock}>
                <ThemedText style={[styles.mobileLabel, { color: c.textSecondary }]}>Remitente</ThemedText>
                <ThemedText numberOfLines={1} style={styles.mobilePerson}>{item.remitente}</ThemedText>
              </View>
              <View style={styles.mobilePersonBlock}>
                <ThemedText style={[styles.mobileLabel, { color: c.textSecondary }]}>Destinatario</ThemedText>
                <ThemedText numberOfLines={1} style={styles.mobilePerson}>{item.destinatario}</ThemedText>
              </View>
            </View>

            <View style={[styles.mobileMetaRow, { borderTopColor: c.border }]}>
              <View><ThemedText style={[styles.mobileLabel, { color: c.textSecondary }]}>Cantidad</ThemedText><ThemedText style={styles.mobileMetaValue}>{item.cantidad}</ThemedText></View>
              <View style={styles.mobilePriceBlock}><ThemedText style={[styles.mobileLabel, { color: c.textSecondary }]}>Precio</ThemedText><ThemedText style={[styles.mobileMetaValue, { color: c.primary }]}>Bs {Number(item.precio).toFixed(2)}</ThemedText></View>
              {renderAcciones(item, true)}
            </View>
          </Card>
        ))
      )}
    </View>
  );

  const tableDesktop = (
    <View style={styles.tableContainer}>
      <Table<Encomienda>
        data={encomiendas}
        columns={columns}
        loading={loading}
        keyExtractor={(item) => item.id.toString()}
        renderCell={(item, column) => {
          switch (column.key) {
            case "guia": return <ThemedText style={styles.bold}>{item.guia ?? "—"}</ThemedText>;
            case "fecha": return <ThemedText style={styles.cellText}>{fecha(item.fecha)}</ThemedText>;
            case "remitente": return <ThemedText numberOfLines={2} style={styles.cellText}>{item.remitente}</ThemedText>;
            case "destinatario": return <ThemedText numberOfLines={2} style={styles.cellText}>{item.destinatario}</ThemedText>;
            case "ruta": return <View style={styles.infoCell}><ThemedText style={styles.bold}>{item.origen}</ThemedText><ThemedText style={[styles.secondary, { color: c.textSecondary }]}>→ {item.destino}</ThemedText></View>;
            case "cantidad": return <ThemedText style={styles.cellText}>{item.cantidad}</ThemedText>;
            case "precio": return <ThemedText style={styles.cellText}>Bs {Number(item.precio).toFixed(2)}</ThemedText>;
            case "estado": return <Badge label={estadoLabel(item.estado)} variant={estadoVariant(item.estado)} />;
            case "acciones": return renderAcciones(item);
            default: return null;
          }
        }}
      />
    </View>
  );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <View style={[styles.screen, isMobile && styles.screenMobile, { backgroundColor: c.background }]}>
      {generatingQr ? (
        <View style={styles.qrGeneratingOverlay} pointerEvents="auto">
          <View style={[styles.qrGeneratingCard, isMobile && styles.qrGeneratingCardMobile, { backgroundColor: c.card, borderColor: c.border }]}>
            <ActivityIndicator size="large" color={c.primary} />
            <ThemedText style={styles.qrGeneratingTitle}>Generando QR...</ThemedText>
            <ThemedText style={[styles.qrGeneratingText, { color: c.textSecondary }]}>Preparando la etiqueta de la encomienda.</ThemedText>
          </View>
        </View>
      ) : null}

      {isMobile ? (
        <ScrollView
          style={styles.mobileScroll}
          contentContainerStyle={styles.mobileContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <PageHeader
            title="Encomiendas"
            description="Gestiona, asigna y entrega encomiendas."
            badge={`${paginationMeta.total} registros`}
            breakpoint={768}
            rightContent={headerActions}
          />

          {resumenMobile}

          <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar guía, persona o ruta..." />

          {listaMobile}

          <Pagination meta={paginationMeta} onPageChange={irAPagina} itemLabel="encomiendas" maxVisiblePages={3} />
        </ScrollView>
      ) : (
        <>
          <PageHeader
            title="Encomiendas"
            description="Registro, seguimiento, asignación y entrega de encomiendas."
            badge={`${paginationMeta.total} registros`}
            rightContent={headerActions}
          />

          {resumenDesktop}

          <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar por guía, remitente, destinatario, ruta..." />

          {tableDesktop}

          <Pagination meta={paginationMeta} onPageChange={irAPagina} itemLabel="encomiendas" />
        </>
      )}

      <EncomiendaQrScannerModal
        visible={scannerVisible}
        encomienda={scannerItem}
        loading={scanningQr}
        printing={printingQr}
        onClose={() => { if (!printingQr) { setScannerVisible(false); setScannerItem(null); } }}
        onScan={procesarEscaneo}
        onReset={() => setScannerItem(null)}
        onPrint={() => void imprimirDetalleEscaneado()}
        onMarkArrival={(item) => { setScannerVisible(false); setScannerItem(null); setEntregarItem(item); }}
      />

      <EncomiendaPrintPreviewModal
        visible={printPreviewVisible}
        title={printPreviewTitle}
        html={printPreviewHtml}
        loading={printPreviewLoading}
        onClose={() => { if (!printPreviewLoading) { setPrintPreviewVisible(false); setPrintPreviewHtml(""); } }}
      />

      <EncomiendaFormModal
        visible={formVisible}
        encomienda={editing}
        catalogos={catalogos}
        loadingCatalogos={loadingCatalogos}
        saving={saving}
        onClose={cerrarForm}
        onLoadCatalogos={cargarCatalogos}
        onCreate={crear}
        onUpdate={actualizar}
      />

      <EncomiendaDetalleModal visible={!!detalle} encomienda={detalle} onClose={() => setDetalle(null)} />

      <EncomiendaAsignarModal
        visible={!!asignarItem}
        encomienda={asignarItem}
        catalogos={catalogos}
        loadingCatalogos={loadingCatalogos}
        saving={saving}
        onClose={() => { if (!saving) setAsignarItem(null); }}
        onLoadCatalogos={cargarCatalogos}
        onConfirm={asignar}
      />

      <EncomiendaEntregaModal
        visible={!!entregarItem}
        encomienda={entregarItem}
        loading={entregarItem ? processingId === entregarItem.id : false}
        onClose={() => { if (processingId === null) setEntregarItem(null); }}
        onConfirm={entregar}
      />
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    padding: 18,
    gap: 12,
  },
  screenMobile: {
    padding: 0,
    gap: 0,
  },
  mobileScroll: {
    flex: 1,
    width: "100%",
  },
  mobileContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 110,
    gap: 12,
  },
  headerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  headerActionsMobile: {
    width: "100%",
  },
  headerButtonMobile: {
    flexGrow: 1,
    flexBasis: "46%",
    minWidth: 130,
    paddingHorizontal: 12,
  },
  summary: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryPressable: {
    flex: 1,
    minWidth: 160,
  },
  summaryCard: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "900",
  },
  mobileFilters: {
    width: "100%",
  },
  mobileFiltersContent: {
    gap: 8,
    paddingRight: 4,
  },
  mobileFilterChip: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mobileFilterValue: {
    fontSize: 15,
    fontWeight: "900",
  },
  mobileFilterLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  tableContainer: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    overflow: "hidden",
  },
  mobileList: {
    width: "100%",
    gap: 10,
  },
  mobileCard: {
    width: "100%",
    gap: 12,
    padding: 14,
  },
  mobileCardHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  mobileCardTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  mobileGuide: {
    fontSize: 16,
    fontWeight: "900",
  },
  mobileDate: {
    fontSize: 11,
  },
  mobileRoute: {
    width: "100%",
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mobileRouteText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "800",
  },
  mobilePeople: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  mobilePersonBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  mobileLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  mobilePerson: {
    fontSize: 13,
    fontWeight: "700",
  },
  mobileMetaRow: {
    width: "100%",
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  mobileMetaValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "900",
  },
  mobilePriceBlock: {
    minWidth: 82,
  },
  mobileLoading: {
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  mobileEmpty: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  mobileEmptyTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  mobileEmptyText: {
    maxWidth: 280,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
  },
  cellText: {
    width: "100%",
    textAlign: "center",
    fontSize: 12,
  },
  infoCell: {
    width: "100%",
    minWidth: 0,
    alignItems: "center",
    gap: 2,
  },
  bold: {
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
  },
  secondary: {
    width: "100%",
    textAlign: "center",
    fontSize: 10,
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  mobileActions: {
    width: "auto",
    flex: 1,
    justifyContent: "flex-end",
    gap: 6,
  },
  qrGeneratingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  qrGeneratingCard: {
    minWidth: 260,
    maxWidth: 340,
    paddingHorizontal: 26,
    paddingVertical: 22,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  qrGeneratingCardMobile: {
    minWidth: 0,
    width: "86%",
    maxWidth: 340,
  },
  qrGeneratingTitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "900",
  },
  qrGeneratingText: {
    fontSize: 12,
    textAlign: "center",
  },
});
