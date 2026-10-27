import React, { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import Toast from "react-native-toast-message";

import { ThemedText } from "@/components/ThemedText";
import Visibility from "@/components/Visibility";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { QrState } from "@/components/ui/QrState";
import { useTheme } from "@/theme/useTheme";
import { useEmpresaStore } from "@/store/empresaStore";
import { empresaService } from "@/screens/admin/empresa/services/empresaService";

import type { Chofer } from "../types/chofer.types";
import { datosCarnetChofer, imprimirCarnetChofer, identidadCarnetEmpresa } from "../utils/choferCarnet";
import { ChoferCarnetPreview } from "./ChoferCarnetPreview";

type Props = {
  visible: boolean;
  chofer: Chofer | null;
  qrLoading: boolean;
  onClose: () => void;
  onRegenerarQr: (chofer: Chofer) => Promise<Chofer | null>;
};

export function ChoferCarnetModal({
  visible,
  chofer,
  qrLoading,
  onClose,
  onRegenerarQr,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { width } = useWindowDimensions();
  // La misma fuente que utiliza el branding del sistema: /mi-empresa + empresaStore.
  const empresa = useEmpresaStore((state) => state.empresa);
  const logoUrl = useEmpresaStore((state) => state.logoUrl);
  const iconoUrl = useEmpresaStore((state) => state.iconoUrl);
  const identidad = identidadCarnetEmpresa(empresa, logoUrl, iconoUrl);
  const [cargandoEmpresa, setCargandoEmpresa] = useState(false);
  const [errorEmpresa, setErrorEmpresa] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [printStage, setPrintStage] = useState<"listo" | "imprimiendo">("listo");

  useEffect(() => {
    if (visible) {
      setPrinting(false);
      setPrintStage("listo");
    }
  }, [visible, chofer?.id]);

  // Al abrir el carnet, leer /mi-empresa mediante el servicio existente.
  // Usa el cache del sistema y sincroniza el store si los datos cambiaron.
  useEffect(() => {
    if (!visible) return;
    let activo = true;
    setCargandoEmpresa(true);
    setErrorEmpresa(null);
    void empresaService.getMiEmpresa()
      .catch((error: unknown) => {
        if (activo) setErrorEmpresa(error instanceof Error ? error.message : "No se pudo cargar la empresa.");
      })
      .finally(() => {
        if (activo) setCargandoEmpresa(false);
      });
    return () => { activo = false; };
  }, [visible]);

  if (!chofer) return null;

  const compacto = width < 740;
  const anchoCarnet = Math.min(270, Math.max(210, width - 92));
  const datos = datosCarnetChofer(chofer);

  const cerrar = () => {
    if (!printing && !qrLoading) onClose();
  };

  const imprimir = async () => {
    if (printing || qrLoading || cargandoEmpresa || errorEmpresa || !empresa) return;
    setPrinting(true);
    setPrintStage("imprimiendo");

    try {
      // En web se abre el popup directamente desde el evento de click.
      await imprimirCarnetChofer(chofer, identidad);
      Toast.show({
        type: "info",
        text1: "Carnet preparado para imprimir",
        text2: Platform.OS === "web"
          ? "El diálogo contiene dos páginas: anverso y reverso."
          : "El documento contiene el anverso y el reverso.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "No se pudo imprimir el carnet",
        text2: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    } finally {
      setPrintStage("listo");
      setPrinting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title="Carnet Sindical"
      onClose={cerrar}
      closeOnBackdropPress={!printing && !qrLoading}
      width="96%"
      maxWidth={940}
      footer={
        <View style={styles.footer}>
          <Button title="Cerrar" variant="secondary" disabled={printing || qrLoading} onPress={cerrar} />
          <Visibility action="Ver" selector=".choferes-imprimir">
            <Button
              title={printing ? "Preparando impresión..." : "Imprimir anverso y reverso"}
              loading={printing}
              disabled={printing || qrLoading || cargandoEmpresa || !!errorEmpresa || !empresa}
              onPress={() => void imprimir()}
            />
          </Visibility>
        </View>
      }
    >
      <View style={styles.contenido}>
        <Card style={styles.previewCard}>
          <View style={styles.encabezado}>
            <View style={styles.encabezadoTexto}>
              <ThemedText style={styles.titulo}>Vista previa del carnet sindical</ThemedText>
              <ThemedText style={[styles.descripcion, { color: c.textSecondary }]}>
                Formato vertical ID-1 · 54 × 85,6 mm · dos caras
              </ThemedText>
            </View>
            <Badge label={printStage === "listo" ? "Listo" : "Imprimiendo"} variant={printStage === "listo" ? "success" : "info"} />
          </View>

          <View style={[styles.caras, compacto && styles.carasCompactas]}>
            <View style={styles.cara}>
              <ThemedText style={styles.caraTitulo}>Anverso · Fotografía</ThemedText>
              <ChoferCarnetPreview chofer={chofer} identidad={identidad} lado="anverso" ancho={anchoCarnet} />
            </View>
            <View style={styles.cara}>
              <ThemedText style={styles.caraTitulo}>Reverso · Verificación QR</ThemedText>
              <ChoferCarnetPreview chofer={chofer} identidad={identidad} lado="reverso" ancho={anchoCarnet} />
            </View>
          </View>

          <ThemedText style={[styles.descripcion, { color: c.textSecondary }]}>
            Se imprimirán dos páginas independientes: primero el anverso y después el reverso.
            Para imprimir a doble cara, configura la orientación y el giro en el controlador de tu impresora.
          </ThemedText>
          {cargandoEmpresa && (
            <ThemedText style={[styles.aviso, { color: c.textSecondary }]}>Cargando nombre y logo de la empresa...</ThemedText>
          )}
          {errorEmpresa && (
            <ThemedText style={[styles.aviso, { color: c.textSecondary }]}>No se pudo consultar la empresa: {errorEmpresa}. Vuelve a abrir el carnet para reintentar.</ThemedText>
          )}
          {!cargandoEmpresa && !errorEmpresa && empresa && !identidad.logo && (
            <ThemedText style={[styles.aviso, { color: c.textSecondary }]}>La empresa no tiene logo cuadrado ni icono configurado; se mostrará «SIN LOGO».</ThemedText>
          )}
          {(datos.categoria === "NO REGISTRADA" || datos.vigencia === "NO REGISTRADA") && (
            <ThemedText style={[styles.aviso, { color: c.textSecondary }]}>
              Categoría sindical o vigencia no registrada: esos campos se mostrarán como «NO REGISTRADA» hasta que estén disponibles en los datos del chofer.
            </ThemedText>
          )}
        </Card>

        <Card>
          <View style={styles.identidad}>
            <View style={[styles.foto, { borderColor: c.border, backgroundColor: c.backgroundSecondary }]}>
              {chofer.fotoUrl ? (
                <Image source={{ uri: chofer.fotoUrl }} style={styles.fotoImagen} resizeMode="cover" />
              ) : (
                <ThemedText style={{ color: c.textSecondary }}>Sin foto</ThemedText>
              )}
            </View>
            <View style={styles.datos}>
              <ThemedText style={styles.nombre}>{chofer.nombre_completo}</ThemedText>
              <ThemedText>Carnet sindical: <ThemedText style={styles.negrita}>{chofer.carnet_sindical}</ThemedText></ThemedText>
              <ThemedText>C.I.: <ThemedText style={styles.negrita}>{chofer.carnet_identidad}</ThemedText></ThemedText>
              <ThemedText>Teléfono: <ThemedText style={styles.negrita}>{chofer.telefono || "—"}</ThemedText></ThemedText>
              <ThemedText>Licencia: <ThemedText style={styles.negrita}>{chofer.numero_licencia} · {chofer.categoria_licencia}</ThemedText></ThemedText>
              <View style={styles.badge}><Badge label={chofer.estado} variant={chofer.estado === "ACTIVO" ? "success" : "destructive"} /></View>
            </View>
          </View>
        </Card>

        <Visibility action="Editar" selector=".choferes-qr">
          <QrState
            qrUri={chofer.qrUrl}
            title="QR del carnet sindical"
            subtitle="El mismo QR aparece en el reverso del carnet."
            emptyTitle="Sin código QR"
            emptySubtitle="Genera una credencial QR para este chofer."
            securityText="El código QR utiliza el mismo proceso de cifrado y generación configurado en el sistema."
            actionLabel={chofer.qrUrl ? "Regenerar QR" : "Generar QR"}
            actionLoading={qrLoading}
            actionDisabled={qrLoading || printing}
            onAction={() => void onRegenerarQr(chofer)}
          />
        </Visibility>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenido: { gap: 14 },
  previewCard: { width: "100%", gap: 14 },
  encabezado: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 },
  encabezadoTexto: { flex: 1, minWidth: 180 },
  titulo: { fontSize: 16, fontWeight: "900" },
  descripcion: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  aviso: { fontSize: 11, lineHeight: 17 },
  caras: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-evenly", gap: 22, paddingVertical: 10 },
  carasCompactas: { flexDirection: "column", alignItems: "center" },
  cara: { alignItems: "center", gap: 10 },
  caraTitulo: { fontSize: 13, fontWeight: "800" },
  identidad: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 16 },
  foto: { width: 120, height: 148, borderWidth: 1, borderRadius: 14, overflow: "hidden", justifyContent: "center", alignItems: "center" },
  fotoImagen: { width: "100%", height: "100%" },
  datos: { flex: 1, minWidth: 230, gap: 7 },
  nombre: { fontSize: 20, fontWeight: "900" },
  negrita: { fontWeight: "900" },
  badge: { alignSelf: "flex-start" },
  footer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 10 },
});
