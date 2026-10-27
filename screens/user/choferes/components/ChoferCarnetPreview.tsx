import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { Chofer } from "../types/chofer.types";
import { CARNET_FONDO_URI } from "../utils/carnetAssets";
import { datosCarnetChofer, type LadoCarnet, type IdentidadCarnet } from "../utils/choferCarnet";

type Props = {
  chofer: Chofer;
  identidad: IdentidadCarnet;
  lado?: LadoCarnet;
  /** Ancho visual del carnet en puntos de React Native. */
  ancho?: number;
};

const RELACION = 85.6 / 54;

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoEtiqueta}>{etiqueta}: </Text>
      <Text style={styles.campoValor}>{valor}</Text>
    </View>
  );
}

/** Anverso y reverso verticales, con los mismos datos que el HTML impreso. */
export function ChoferCarnetPreview({ chofer, identidad, lado = "anverso", ancho = 270 }: Props) {
  const d = datosCarnetChofer(chofer);
  const escala = ancho / 270;
  const esAnverso = lado === "anverso";

  // La vista se disena en un lienzo fijo de 270 x 428 y se escala como
  // bloque; asi Android no comprime las etiquetas al reducir el ancho.
  return (
    <View style={{ width: ancho, height: ancho * RELACION, overflow: "hidden", borderRadius: 13, backgroundColor: "#fff" }}>
      <View style={[styles.lienzo, { transform: [{ scale: escala }], left: (ancho - 270) / 2, top: (ancho * RELACION - 428) / 2 }]}>
        <Image source={{ uri: CARNET_FONDO_URI }} style={styles.fondo} resizeMode="stretch" />
        <View style={styles.contenido}>
          {identidad.logo ? (
            <Image source={{ uri: identidad.logo }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={[styles.logo, styles.sinLogoContenedor]}>
              <Text style={styles.sinLogo}>SIN LOGO</Text>
            </View>
          )}
          <Text numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72} style={styles.asociacion}>
            {identidad.nombre}
          </Text>

          {esAnverso ? (
            <View style={styles.marcoFoto}>
              {chofer.fotoUrl ? (
                <Image source={{ uri: chofer.fotoUrl }} style={styles.foto} resizeMode="cover" />
              ) : (
                <Text style={styles.sinFoto}>SIN FOTO</Text>
              )}
            </View>
          ) : (
            <>
              <Text style={styles.qrTitulo}>ESCANEE PARA{"\n"}VERIFICAR VALIDEZ</Text>
              <View style={styles.marcoQr}>
                {chofer.qrUrl ? (
                  <Image source={{ uri: chofer.qrUrl }} style={styles.qr} resizeMode="contain" />
                ) : (
                  <Text style={styles.sinFoto}>SIN QR</Text>
                )}
              </View>
            </>
          )}

          <View style={[styles.datos, !esAnverso && styles.datosReverso]}>
            <Text style={styles.nombreEtiqueta}>NOMBRE COMPLETO:</Text>
            <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.nombre}>
              {d.nombre}
            </Text>
            <Campo etiqueta="Número de Cédula" valor={d.ci} />
            <Campo etiqueta="ID Sindical" valor={d.sindical} />
            <Campo etiqueta="Categoría" valor={d.categoria} />
            <Campo etiqueta="Licencia" valor={d.licencia} />
            <Campo etiqueta="Vigencia" valor={d.vigencia} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lienzo: { position: "absolute", width: 270, height: 428, backgroundColor: "#fff", overflow: "hidden" },
  fondo: { position: "absolute", width: 270, height: 428 },
  contenido: { flex: 1, alignItems: "center", paddingHorizontal: 13, paddingTop: 10 },
  logo: { width: 65, height: 62 },
  sinLogoContenedor: { alignItems: "center", justifyContent: "center", borderColor: "#d5dde5", borderWidth: 1, borderRadius: 8 },
  sinLogo: { fontSize: 9, color: "#63717a", fontWeight: "700" },
  asociacion: { marginTop: 1, maxWidth: 244, textAlign: "center", fontSize: 10.8, lineHeight: 13, fontWeight: "900", color: "#142039" },
  marcoFoto: { width: 100, height: 125, marginTop: 9, marginBottom: 7, padding: 2, borderWidth: 2, borderColor: "#436b60", borderRadius: 48, overflow: "hidden", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  foto: { width: "100%", height: "100%", borderRadius: 44 },
  sinFoto: { fontSize: 10, color: "#63717a", fontWeight: "700", textAlign: "center" },
  qrTitulo: { marginTop: 12, textAlign: "center", fontSize: 14.5, lineHeight: 17, fontWeight: "900", color: "#080808" },
  marcoQr: { width: 100, height: 100, marginTop: 6, marginBottom: 13, padding: 3, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  qr: { width: "100%", height: "100%" },
  datos: { width: "100%", alignItems: "center" },
  datosReverso: { marginTop: 0 },
  nombreEtiqueta: { fontSize: 13.6, lineHeight: 16, color: "#000", textAlign: "center" },
  nombre: { marginTop: 2, marginBottom: 8, fontSize: 17.5, lineHeight: 19, fontWeight: "900", color: "#111d3a", textAlign: "center", textTransform: "uppercase" },
  campo: { width: "100%", minHeight: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 3, marginBottom: 2 },
  campoEtiqueta: { fontSize: 11.8, lineHeight: 15, color: "#0a0a0a", textAlign: "center" },
  campoValor: { fontSize: 11.8, lineHeight: 15, fontWeight: "900", color: "#0a0a0a", textAlign: "center" },
});
