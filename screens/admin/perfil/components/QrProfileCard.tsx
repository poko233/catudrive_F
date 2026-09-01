// screens/admin/perfil/components/QrProfileCard.tsx

import React, {
  useState,
} from "react";

import {
  Platform,
} from "react-native";

import * as FileSystemNS from "expo-file-system";

import * as Sharing from "expo-sharing";

import Toast from "react-native-toast-message";

import {
  QrState,
} from "@/components/ui/QrState";

import {
  usePerfilData,
} from "../hooks/usePerfilData";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function isRemoteUrl(
  value: string,
): boolean {
  return /^https?:\/\//i.test(
    value,
  );
}

function getBase64(
  value: string,
): string {
  if (
    value.includes(",")
  ) {
    return (
      value.split(
        ",",
      )[1] ?? ""
    );
  }

  return value;
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export const QrProfileCard =
  () => {
    const {
      codigoQr,
    } =
      usePerfilData();

    const [
      downloading,
      setDownloading,
    ] =
      useState(false);

    /*
    |--------------------------------------------------------------------------
    | DOWNLOAD
    |--------------------------------------------------------------------------
    */

    const handleDownload =
      async () => {
        if (
          !codigoQr ||
          downloading
        ) {
          return;
        }

        setDownloading(
          true,
        );

        try {
          /*
          |--------------------------------------------------------------------------
          | WEB
          |--------------------------------------------------------------------------
          */

          if (
            Platform.OS ===
            "web"
          ) {
            const document =
              (
                globalThis as any
              ).document;

            if (!document) {
              throw new Error(
                "Descarga no disponible.",
              );
            }

            const link =
              document
                .createElement(
                  "a",
                );

            link.href =
              codigoQr;

            link.download =
              "qr_identidad.png";

            link.target =
              "_blank";

            link.rel =
              "noopener noreferrer";

            document.body
              .appendChild(
                link,
              );

            link.click();

            document.body
              .removeChild(
                link,
              );

            return;
          }

          /*
          |--------------------------------------------------------------------------
          | MOBILE
          |--------------------------------------------------------------------------
          */

          const FileSystem =
            FileSystemNS as any;

          const fileUri =
            `${FileSystem.cacheDirectory}qr_identidad.png`;

          /*
          |--------------------------------------------------------------------------
          | URL REMOTA
          |--------------------------------------------------------------------------
          */

          if (
            isRemoteUrl(
              codigoQr,
            )
          ) {
            await FileSystem
              .downloadAsync(
                codigoQr,
                fileUri,
              );
          } else {
            /*
            |--------------------------------------------------------------------------
            | BASE64
            |--------------------------------------------------------------------------
            */

            await FileSystem
              .writeAsStringAsync(
                fileUri,

                getBase64(
                  codigoQr,
                ),

                {
                  encoding:
                    FileSystem
                      .EncodingType
                      .Base64,
                },
              );
          }

          /*
          |--------------------------------------------------------------------------
          | SHARE
          |--------------------------------------------------------------------------
          */

          if (
            await Sharing
              .isAvailableAsync()
          ) {
            await Sharing
              .shareAsync(
                fileUri,

                {
                  mimeType:
                    "image/png",

                  dialogTitle:
                    "Guardar credencial digital",

                  UTI:
                    "public.png",
                },
              );

            return;
          }

          Toast.show({
            type:
              "info",

            text1:
              "Credencial guardada",

            text2:
              fileUri,
          });
        } catch (
          error
        ) {
          console.error(
            error,
          );

          Toast.show({
            type:
              "error",

            text1:
              "No se pudo descargar la credencial",

            text2:
              "Intenta nuevamente.",
          });
        } finally {
          setDownloading(
            false,
          );
        }
      };

    return (
      <QrState
        qrUri={
          codigoQr
        }
        title="Credencial digital"
        subtitle="Identificación digital asociada a tu cuenta."
        securityText="Usa esta credencial únicamente para los accesos autorizados."
        emptyTitle="Sin credencial digital"
        emptySubtitle="Tu cuenta todavía no tiene un código QR registrado."
        actionLabel="Descargar credencial"
        actionLoading={
          downloading
        }
        onAction={
          handleDownload
        }
      />
    );
  };

export default QrProfileCard;