import {
  Button,
} from "@/components/ui/Button";

import {
  Card,
} from "@/components/ui/Card";

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  usePrinterConnection,
} from "@/components/PrinterConnection";

import {
  StyleSheet,
} from "react-native";

import Toast from "react-native-toast-message";

export function ImprimirDocumentoCartaEjemplo() {
  const {
    print,
  } =
    usePrinterConnection();

  const imprimir =
    async () => {
      try {
        await print({
          type:
            "document",

          paperSize:
            "letter",

          title:
            "Reporte general",

          html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    @page {
      size: Letter;
      margin: 15mm;
    }

    body {
      font-family: Arial, sans-serif;
      color: #111;
    }
  </style>
</head>
<body>
  <h1>CATUDRIVE</h1>
  <h2>Reporte general</h2>
  <p>Documento de ejemplo en papel Carta.</p>
</body>
</html>
          `.trim(),
        });

        Toast.show({
          type:
            "success",
          text1:
            "Documento enviado a impresión",
        });
      } catch (
        error:
          any
      ) {
        /*
         * Si falta una impresora Carta/A4 o la actual es una térmica,
         * PrinterConnectionProvider activa configurationRequired.
         * Si PrinterAutoSetupModal está montado en el layout, se abre solo.
         */

        Toast.show({
          type:
            "error",
          text1:
            "Se necesita otra impresora",
          text2:
            error?.message ??
            "Selecciona una impresora compatible y vuelve a imprimir.",
        });
      }
    };

  return (
    <Card
      style={
        styles.card
      }
    >
      <ThemedText
        style={
          styles.title
        }
      >
        Reporte Carta
      </ThemedText>

      <Button
        title="Imprimir reporte"
        onPress={() =>
          void imprimir()
        }
      />
    </Card>
  );
}

const styles =
  StyleSheet.create({
    card: {
      gap:
        12,
    },

    title: {
      fontSize:
        16,
      fontWeight:
        "800",
    },
  });
