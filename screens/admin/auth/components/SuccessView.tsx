import * as FileSystem from "expo-file-system";
import { shareAsync } from "expo-sharing";
import { CheckCircle, Download, UserPlus } from "lucide-react-native";
import { MotiView } from "moti";
import { MotiPressable } from "moti/interactions";
import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { ThemedText } from "../../../../components/ThemedText";
import { useTheme } from "../../../../theme/useTheme";

interface SuccessViewProps {
  userData: {
    id: number;
    usuario: string;
    ci: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno?: string | null;
    genero: string;
    fecha_nac: string;
    email: string | null;
    telefono: string | null;
    celular: string | null;
    direccion: string | null;
    expedido: string | null;
    estado: string;
    codigo_qr: string | null;
    roles: string[];
    created_at?: string;
    updated_at?: string;
  };
  onRegisterAnother: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  userData,
  onRegisterAnother,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;

  const fullName =
    `${userData.nombres} ${userData.apellidoPaterno} ${userData.apellidoMaterno ?? ""}`.trim();

  // Función para descargar SOLO el código QR
  const handleDownloadQR = async () => {
    if (!userData.codigo_qr) {
      alert("No hay código QR disponible para descargar.");
      return;
    }

    const qrData = userData.codigo_qr;
    const fileName = `qr_${userData.usuario}.png`;

    // Web: Simula un clic en un enlace de descarga
    if (Platform.OS === "web") {
      const link = document.createElement("a");
      link.href = qrData; // La URL base64 completa
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    try {
      const base64String = qrData.split(",")[1];

      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, base64String, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await shareAsync(fileUri, {
        mimeType: "image/png",
        dialogTitle: "Descargar código QR",
      });
    } catch (error) {
      console.error("Error al descargar el QR:", error);
      alert("Hubo un error al descargar la imagen del QR.");
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={styles.container}
    >
      <CheckCircle size={64} color={c.primary} style={{ marginBottom: 16 }} />
      <ThemedText
        style={{
          color: c.textSecondary,
          fontSize: 24,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        ¡Usuario Registrado Exitosamente!
      </ThemedText>
      <ThemedText
        style={{
          color: c.textSecondary,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        Se han generado las credenciales y el acceso único para el nuevo
        usuario.
      </ThemedText>

      {/* Tarjeta de Resumen con Toda la Información */}
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: c.backgroundSecondary, borderColor: c.border },
        ]}
      >
        {/* Sección 1: Datos Personales */}
        <View style={styles.section}>
          <ThemedText
            style={[
              styles.sectionTitle,
              { color: c.primary, borderBottomColor: c.border },
            ]}
          >
            Datos Personales
          </ThemedText>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
              ID:
            </Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {userData.id}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
              Usuario:
            </Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {userData.usuario}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
              CI:
            </Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {userData.ci}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
              Expedido:
            </Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {userData.expedido || "N/A"}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
              Nombre:
            </Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {fullName}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
              Género:
            </Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {userData.genero}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
              Fecha Nac.:
            </Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {userData.fecha_nac}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
              Estado:
            </Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {userData.estado}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
              Roles:
            </Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {userData.roles.join(", ")}
            </Text>
          </View>
        </View>

        {/* Sección 2: Contacto */}
        <View style={styles.section}>
          <ThemedText
            style={[
              styles.sectionTitle,
              { color: c.primary, borderBottomColor: c.border },
            ]}
          >
            Contacto
          </ThemedText>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
              Email:
            </Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {userData.email || "N/A"}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
              Teléfono:
            </Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {userData.telefono || "N/A"}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
              Celular:
            </Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {userData.celular || "N/A"}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>
              Dirección:
            </Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {userData.direccion || "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* Código QR */}
      {userData.codigo_qr ? (
        <View style={styles.qrContainer}>
          <Image
            source={{ uri: userData.codigo_qr }}
            style={styles.qrImage}
            resizeMode="contain"
          />
        </View>
      ) : (
        <ThemedText style={{ color: c.warning, marginVertical: 16 }}>
          No se pudo generar el código QR automáticamente.
        </ThemedText>
      )}

      {/* Acciones */}
      <View style={styles.actions}>
        <MotiPressable
          style={[styles.actionBtn, { backgroundColor: c.backgroundTertiary }]}
          onPress={handleDownloadQR}
        >
          <Download size={16} color={c.text} />
          <Text style={{ color: c.text, marginLeft: 6 }}>Descargar</Text>
        </MotiPressable>

        {/* Botón Registrar Otro */}
        <MotiPressable
          style={[styles.actionBtn, { backgroundColor: c.primary }]}
          onPress={onRegisterAnother}
        >
          <UserPlus size={16} color={c.primaryForeground} />
          <Text style={{ color: c.primaryForeground, marginLeft: 6 }}>
            Registrar Otro
          </Text>
        </MotiPressable>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  summaryCard: {
    width: "100%",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    borderBottomWidth: 1,
    paddingBottom: 6,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontWeight: "600", fontSize: 13 },
  qrContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrImage: { width: 140, height: 140 },
  actions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
});
