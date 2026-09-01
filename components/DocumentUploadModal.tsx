// components/DocumentUploadModal.tsx

import { ThemedText } from "@/components/ThemedText";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import {
  Select,
  SelectOption,
} from "@/components/ui/Select";

import { useTheme } from "@/theme/useTheme";

import * as DocumentPicker from "expo-document-picker";

import {
  ExternalLink,
  File,
  FileArchive,
  FileCode2,
  FilePlus2,
  FileSpreadsheet,
  Files,
  FileText,
  FolderOpen,
  Info,
  Plus,
  Trash2,
  Upload,
} from "lucide-react-native";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

export type DocumentSelectionMode =
  | "single"
  | "multiple";

export interface DocumentUploadResult {
  asset: DocumentPicker.DocumentPickerAsset;

  uri: string;

  fileName: string;

  originalFileName: string;

  extension: string;

  originalExtension: string;

  mimeType: string;

  fileSize?: number;

  order: number;

  converted: boolean;
}

/*
|--------------------------------------------------------------------------
| ITEM INTERNO
|--------------------------------------------------------------------------
*/

interface DocumentItem {
  id: string;

  asset: DocumentPicker.DocumentPickerAsset;

  outputExtension: string;
}

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface DocumentUploadModalProps {
  visible: boolean;

  onClose: () => void;

  onSave: (
    result:
      | DocumentUploadResult
      | DocumentUploadResult[],
  ) => void | Promise<void>;

  title?: string;

  initialSelectionMode?: DocumentSelectionMode;

  allowModeChange?: boolean;

  maxFiles?: number;

  maxFileSizeMB?: number;

  maxTotalSizeMB?: number;

  acceptedExtensions?: string[];

  acceptedMimeTypes?: string[];
}

/*
|--------------------------------------------------------------------------
| EXTENSIONES
|--------------------------------------------------------------------------
*/

const DEFAULT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
  "txt",
  "md",
  "json",
  "zip",
];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function formatBytes(
  bytes?: number,
) {
  if (
    bytes === undefined ||
    bytes === null
  ) {
    return "Desconocido";
  }

  if (bytes === 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const index =
    Math.min(
      Math.floor(
        Math.log(bytes) /
          Math.log(1024),
      ),
      units.length - 1,
    );

  const value =
    bytes /
    Math.pow(
      1024,
      index,
    );

  return `${value.toFixed(
    index === 0
      ? 0
      : 2,
  )} ${units[index]}`;
}

/*
|--------------------------------------------------------------------------
| EXTENSIÓN
|--------------------------------------------------------------------------
*/

function getExtension(
  fileName?: string | null,
) {
  if (!fileName) {
    return "";
  }

  const pieces =
    fileName.split(".");

  if (
    pieces.length <= 1
  ) {
    return "";
  }

  return (
    pieces.pop() ??
    ""
  ).toLowerCase();
}

/*
|--------------------------------------------------------------------------
| NOMBRE SIN EXTENSIÓN
|--------------------------------------------------------------------------
*/

function removeExtension(
  fileName?: string | null,
) {
  if (!fileName) {
    return "documento";
  }

  return fileName.replace(
    /\.[^/.]+$/,
    "",
  );
}

/*
|--------------------------------------------------------------------------
| MIME
|--------------------------------------------------------------------------
*/

function getMimeFallback(
  extension: string,
) {
  switch (
    extension.toLowerCase()
  ) {
    case "pdf":
      return "application/pdf";

    case "doc":
      return "application/msword";

    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    case "xls":
      return "application/vnd.ms-excel";

    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    case "csv":
      return "text/csv";

    case "txt":
      return "text/plain";

    case "md":
      return "text/markdown";

    case "json":
      return "application/json";

    case "zip":
      return "application/zip";

    default:
      return "application/octet-stream";
  }
}

/*
|--------------------------------------------------------------------------
| ID
|--------------------------------------------------------------------------
*/

function createDocumentId(
  asset: DocumentPicker.DocumentPickerAsset,
) {
  return [
    asset.name,
    asset.size ?? 0,
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2),
  ].join("-");
}

/*
|--------------------------------------------------------------------------
| DUPLICADO
|--------------------------------------------------------------------------
*/

function createDuplicateKey(
  asset: DocumentPicker.DocumentPickerAsset,
) {
  return `${asset.name.toLowerCase()}-${asset.size ?? 0}`;
}

/*
|--------------------------------------------------------------------------
| ICONO
|--------------------------------------------------------------------------
*/

function getDocumentIcon(
  extension: string,
) {
  switch (
    extension.toLowerCase()
  ) {
    case "pdf":
    case "doc":
    case "docx":
    case "txt":
    case "md":
      return FileText;

    case "xls":
    case "xlsx":
    case "csv":
      return FileSpreadsheet;

    case "zip":
    case "rar":
    case "7z":
      return FileArchive;

    case "json":
    case "xml":
    case "js":
    case "ts":
    case "tsx":
    case "html":
    case "css":
      return FileCode2;

    default:
      return File;
  }
}

/*
|--------------------------------------------------------------------------
| PREVIEW
|--------------------------------------------------------------------------
*/

function isPdf(
  extension: string,
) {
  return (
    extension.toLowerCase() ===
    "pdf"
  );
}

function isTextPreviewable(
  extension: string,
) {
  return [
    "txt",
    "md",
    "csv",
    "json",
  ].includes(
    extension.toLowerCase(),
  );
}

/*
|--------------------------------------------------------------------------
| CONVERSIONES SEGURAS
|--------------------------------------------------------------------------
|
| No se hace DOCX -> PDF ni XLSX -> CSV automáticamente.
|
| Esas conversiones pueden modificar:
| - formato
| - fórmulas
| - imágenes
| - estilos
| - saltos de página
| - fuentes
|
| TXT <-> MD no modifica los bytes del contenido.
|--------------------------------------------------------------------------
*/

function getCompatibleFormats(
  extension: string,
): SelectOption<string>[] {
  const normalized =
    extension.toLowerCase();

  const original: SelectOption<string> =
    {
      label: `${normalized.toUpperCase()} — Original`,
      value: normalized,

      description:
        "Conservar el formato original.",
    };

  if (
    normalized === "txt"
  ) {
    return [
      original,

      {
        label: "MD — Markdown",
        value: "md",

        description:
          "Conversión compatible sin modificar el contenido de texto.",
      },
    ];
  }

  if (
    normalized === "md"
  ) {
    return [
      original,

      {
        label: "TXT — Texto plano",
        value: "txt",

        description:
          "Conversión compatible sin modificar el contenido.",
      },
    ];
  }

  return [
    original,
  ];
}

/*
|--------------------------------------------------------------------------
| OBTENER FILE WEB
|--------------------------------------------------------------------------
*/

function getWebFile(
  asset: DocumentPicker.DocumentPickerAsset,
): File | null {
  if (
    Platform.OS !== "web"
  ) {
    return null;
  }

  const assetWithFile =
    asset as DocumentPicker.DocumentPickerAsset & {
      file?: File;
    };

  return (
    assetWithFile.file ??
    null
  );
}

/*
|--------------------------------------------------------------------------
| URL DE PREVIEW
|--------------------------------------------------------------------------
*/

function getPreviewUrl(
  asset: DocumentPicker.DocumentPickerAsset,
) {
  if (
    Platform.OS !== "web"
  ) {
    return asset.uri;
  }

  const file =
    getWebFile(
      asset,
    );

  if (
    file &&
    typeof URL !==
      "undefined" &&
    typeof URL.createObjectURL ===
      "function"
  ) {
    return URL.createObjectURL(
      file,
    );
  }

  return asset.uri;
}

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export function DocumentUploadModal({
  visible,

  onClose,

  onSave,

  title = "Subir documentos",

  initialSelectionMode =
    "single",

  allowModeChange = true,

  maxFiles = 10,

  maxFileSizeMB = 15,

  maxTotalSizeMB = 50,

  acceptedExtensions =
    DEFAULT_EXTENSIONS,

  acceptedMimeTypes = [
    "*/*",
  ],
}: DocumentUploadModalProps) {
  const { theme } =
    useTheme();

  const c =
    theme.colors;

  const {
    width,
    height,
  } =
    useWindowDimensions();

  /*
  |--------------------------------------------------------------------------
  | RESPONSIVE
  |--------------------------------------------------------------------------
  */

  const isCompact =
    width < 900;

  const bodyMaxHeight =
    Math.max(
      340,

      Math.min(
        620,

        height - 230,
      ),
    );

  /*
  |--------------------------------------------------------------------------
  | MODO
  |--------------------------------------------------------------------------
  */

  const [
    selectionMode,
    setSelectionMode,
  ] =
    useState<DocumentSelectionMode>(
      initialSelectionMode,
    );

  /*
  |--------------------------------------------------------------------------
  | DOCUMENTOS
  |--------------------------------------------------------------------------
  */

  const [
    documents,
    setDocuments,
  ] =
    useState<DocumentItem[]>(
      [],
    );

  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(0);

  /*
  |--------------------------------------------------------------------------
  | PREVIEW TEXT
  |--------------------------------------------------------------------------
  */

  const [
    textPreview,
    setTextPreview,
  ] =
    useState("");

  const [
    previewLoading,
    setPreviewLoading,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | DRAG
  |--------------------------------------------------------------------------
  */

  const [
    dragActive,
    setDragActive,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | GUARDANDO
  |--------------------------------------------------------------------------
  */

  const [
    processing,
    setProcessing,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | ACTIVO
  |--------------------------------------------------------------------------
  */

  const activeDocument =
    documents[
      activeIndex
    ] ??
    null;

  const activeExtension =
    activeDocument
      ? getExtension(
          activeDocument
            .asset
            .name,
        )
      : "";

  /*
  |--------------------------------------------------------------------------
  | FORMAT OPTIONS
  |--------------------------------------------------------------------------
  */

  const outputFormatOptions =
    useMemo(
      () =>
        activeDocument
          ? getCompatibleFormats(
              activeExtension,
            )
          : [],

      [
        activeDocument,
        activeExtension,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | EXTENSIONES NORMALIZADAS
  |--------------------------------------------------------------------------
  */

  const normalizedExtensions =
    useMemo(
      () =>
        acceptedExtensions.map(
          (
            extension,
          ) =>
            extension
              .replace(
                /^\./,
                "",
              )
              .toLowerCase(),
        ),

      [
        acceptedExtensions,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | PESO TOTAL
  |--------------------------------------------------------------------------
  */

  const totalSize =
    useMemo(
      () =>
        documents.reduce(
          (
            total,
            document,
          ) =>
            total +
            (
              document
                .asset
                .size ??
              0
            ),

          0,
        ),

      [
        documents,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | ABRIR
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !visible
    ) {
      return;
    }

    setSelectionMode(
      initialSelectionMode,
    );
  }, [
    visible,
    initialSelectionMode,
  ]);

  /*
  |--------------------------------------------------------------------------
  | ÍNDICE SEGURO
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !documents.length
    ) {
      setActiveIndex(
        0,
      );

      return;
    }

    if (
      activeIndex >=
      documents.length
    ) {
      setActiveIndex(
        documents.length -
          1,
      );
    }
  }, [
    documents,
    activeIndex,
  ]);

  /*
  |--------------------------------------------------------------------------
  | PREVIEW DE TEXTO
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled =
      false;

    const load =
      async () => {
        setTextPreview(
          "",
        );

        if (
          !activeDocument ||
          !isTextPreviewable(
            activeExtension,
          )
        ) {
          return;
        }

        setPreviewLoading(
          true,
        );

        try {
          let content =
            "";

          /*
          |--------------------------------------------------------------------------
          | WEB
          |--------------------------------------------------------------------------
          */

          if (
            Platform.OS ===
            "web"
          ) {
            const file =
              getWebFile(
                activeDocument.asset,
              );

            if (file) {
              content =
                await file.text();
            } else {
              const response =
                await fetch(
                  activeDocument
                    .asset
                    .uri,
                );

              content =
                await response.text();
            }
          } else {
            /*
             * En móvil intentamos leer
             * mediante fetch del URI local.
             */

            const response =
              await fetch(
                activeDocument
                  .asset
                  .uri,
              );

            content =
              await response.text();
          }

          if (
            cancelled
          ) {
            return;
          }

          /*
           * Evitamos cargar archivos gigantes
           * enteros en la UI.
           */
          setTextPreview(
            content.slice(
              0,
              15000,
            ),
          );
        } catch (
          error
        ) {
          console.error(
            "No se pudo generar la vista previa:",
            error,
          );

          if (
            !cancelled
          ) {
            setTextPreview(
              "",
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setPreviewLoading(
              false,
            );
          }
        }
      };

    load();

    return () => {
      cancelled =
        true;
    };
  }, [
    activeDocument,
    activeExtension,
  ]);

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR FORMATO
  |--------------------------------------------------------------------------
  */

  const setActiveOutputFormat =
    (
      extension: string,
    ) => {
      if (
        !activeDocument
      ) {
        return;
      }

      setDocuments(
        (
          current,
        ) =>
          current.map(
            (
              document,
              index,
            ) =>
              index ===
              activeIndex
                ? {
                    ...document,

                    outputExtension:
                      extension,
                  }
                : document,
          ),
      );
    };

  /*
  |--------------------------------------------------------------------------
  | VALIDAR
  |--------------------------------------------------------------------------
  */

  const validateAsset =
    (
      asset: DocumentPicker.DocumentPickerAsset,
    ) => {
      const extension =
        getExtension(
          asset.name,
        );

      if (
        normalizedExtensions
          .length >
          0 &&
        !normalizedExtensions.includes(
          extension,
        )
      ) {
        return {
          valid: false,

          reason:
            `"${asset.name}" tiene un formato no permitido.`,
        };
      }

      const maxBytes =
        maxFileSizeMB *
        1024 *
        1024;

      if (
        asset.size &&
        asset.size >
          maxBytes
      ) {
        return {
          valid: false,

          reason:
            `"${asset.name}" supera ${maxFileSizeMB} MB.`,
        };
      }

      return {
        valid: true,

        reason: "",
      };
    };

  /*
  |--------------------------------------------------------------------------
  | ASSET -> ITEM
  |--------------------------------------------------------------------------
  */

  const assetToItem =
    (
      asset: DocumentPicker.DocumentPickerAsset,
    ): DocumentItem => {
      const extension =
        getExtension(
          asset.name,
        );

      return {
        id:
          createDocumentId(
            asset,
          ),

        asset,

        outputExtension:
          extension,
      };
    };

  /*
  |--------------------------------------------------------------------------
  | APLICAR
  |--------------------------------------------------------------------------
  */

  const applyAssets =
    (
      assets:
        DocumentPicker.DocumentPickerAsset[],

      append = false,
    ) => {
      if (
        !assets.length
      ) {
        return;
      }

      const rejected:
        string[] = [];

      const valid =
        assets.filter(
          (
            asset,
          ) => {
            const result =
              validateAsset(
                asset,
              );

            if (
              !result.valid
            ) {
              rejected.push(
                result.reason,
              );
            }

            return result.valid;
          },
        );

      if (
        rejected.length
      ) {
        Alert.alert(
          "Archivos omitidos",

          rejected
            .slice(
              0,
              4,
            )
            .join(
              "\n",
            ),
        );
      }

      if (
        !valid.length
      ) {
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | SINGLE
      |--------------------------------------------------------------------------
      */

      if (
        selectionMode ===
        "single"
      ) {
        setDocuments([
          assetToItem(
            valid[0],
          ),
        ]);

        setActiveIndex(
          0,
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | MULTIPLE
      |--------------------------------------------------------------------------
      */

      setDocuments(
        (
          current,
        ) => {
          const base =
            append
              ? current
              : [];

          const existing =
            new Set(
              base.map(
                (
                  document,
                ) =>
                  createDuplicateKey(
                    document.asset,
                  ),
              ),
            );

          const maxTotalBytes =
            maxTotalSizeMB *
            1024 *
            1024;

          let runningSize =
            base.reduce(
              (
                total,
                item,
              ) =>
                total +
                (
                  item.asset
                    .size ??
                  0
                ),

              0,
            );

          const next = [
            ...base,
          ];

          for (
            const asset of
            valid
          ) {
            if (
              next.length >=
              maxFiles
            ) {
              break;
            }

            const key =
              createDuplicateKey(
                asset,
              );

            if (
              existing.has(
                key,
              )
            ) {
              continue;
            }

            const assetSize =
              asset.size ??
              0;

            if (
              runningSize +
                assetSize >
              maxTotalBytes
            ) {
              continue;
            }

            next.push(
              assetToItem(
                asset,
              ),
            );

            existing.add(
              key,
            );

            runningSize +=
              assetSize;
          }

          return next;
        },
      );

      if (
        !append
      ) {
        setActiveIndex(
          0,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | PICK
  |--------------------------------------------------------------------------
  */

  const pickDocuments =
    async (
      append = false,
    ) => {
      try {
        if (
          selectionMode ===
            "multiple" &&
          append &&
          documents.length >=
            maxFiles
        ) {
          Alert.alert(
            "Límite alcanzado",

            `Puedes seleccionar un máximo de ${maxFiles} documentos.`,
          );

          return;
        }

        const result =
          await DocumentPicker.getDocumentAsync(
            {
              type:
                acceptedMimeTypes.length
                  ? acceptedMimeTypes
                  : "*/*",

              multiple:
                selectionMode ===
                "multiple",

              copyToCacheDirectory:
                true,
            },
          );

        if (
          result.canceled ||
          !result.assets
            ?.length
        ) {
          return;
        }

        applyAssets(
          selectionMode ===
            "single"
            ? [
                result
                  .assets[0],
              ]
            : result.assets,

          append,
        );
      } catch (
        error
      ) {
        console.error(
          error,
        );

        Alert.alert(
          "Error",

          "No se pudieron seleccionar los documentos.",
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | DROP WEB
  |--------------------------------------------------------------------------
  */

  const handleDrop =
    (
      event: any,
    ) => {
      event.preventDefault?.();

      event.stopPropagation?.();

      setDragActive(
        false,
      );

      if (
        Platform.OS !==
        "web"
      ) {
        return;
      }

      const fileList =
        Array.from(
          event.dataTransfer
            ?.files ??
            [],
        ) as File[];

      if (
        !fileList.length
      ) {
        return;
      }

      const limit =
        selectionMode ===
        "single"
          ? 1
          : Math.max(
              0,

              maxFiles -
                documents.length,
            );

      const assets =
        fileList
          .slice(
            0,
            limit,
          )
          .map(
            (
              file,
            ) => {
              const uri =
                URL.createObjectURL(
                  file,
                );

              return {
                uri,

                name:
                  file.name,

                size:
                  file.size,

                mimeType:
                  file.type ||
                  undefined,

                file,
              } as unknown as DocumentPicker.DocumentPickerAsset;
            },
          );

      applyAssets(
        assets,

        selectionMode ===
          "multiple" &&
          documents.length >
            0,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | MODO
  |--------------------------------------------------------------------------
  */

  const changeSelectionMode =
    (
      mode:
        DocumentSelectionMode,
    ) => {
      if (
        mode ===
        selectionMode
      ) {
        return;
      }

      if (
        mode ===
          "single" &&
        activeDocument
      ) {
        setDocuments([
          activeDocument,
        ]);

        setActiveIndex(
          0,
        );
      }

      setSelectionMode(
        mode,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | ELIMINAR
  |--------------------------------------------------------------------------
  */

  const removeDocument =
    (
      index: number,
    ) => {
      const next =
        documents.filter(
          (
            _,
            currentIndex,
          ) =>
            currentIndex !==
            index,
        );

      setDocuments(
        next,
      );

      if (
        !next.length
      ) {
        setActiveIndex(
          0,
        );

        return;
      }

      setActiveIndex(
        Math.min(
          activeIndex,

          next.length - 1,
        ),
      );
    };

  /*
  |--------------------------------------------------------------------------
  | ABRIR
  |--------------------------------------------------------------------------
  */

  const openDocument =
    async () => {
      if (
        !activeDocument
      ) {
        return;
      }

      try {
        const url =
          getPreviewUrl(
            activeDocument.asset,
          );

        /*
        |--------------------------------------------------------------------------
        | WEB
        |--------------------------------------------------------------------------
        */

        if (
          Platform.OS ===
          "web"
        ) {
          if (
            typeof window !==
            "undefined"
          ) {
            window.open(
              url,
              "_blank",
              "noopener,noreferrer",
            );
          }

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | MOBILE
        |--------------------------------------------------------------------------
        */

        const supported =
          await Linking.canOpenURL(
            url,
          );

        if (
          supported
        ) {
          await Linking.openURL(
            url,
          );

          return;
        }

        Alert.alert(
          "No se puede abrir",

          "No existe una aplicación compatible para abrir este documento.",
        );
      } catch (
        error
      ) {
        console.error(
          error,
        );

        Alert.alert(
          "Error",

          "No se pudo abrir el documento.",
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | GUARDAR
  |--------------------------------------------------------------------------
  */

  const handleSave =
    async () => {
      if (
        !documents.length
      ) {
        Alert.alert(
          "Selecciona documentos",

          "Debes seleccionar al menos un documento.",
        );

        return;
      }

      setProcessing(
        true,
      );

      try {
        const results =
          documents.map(
            (
              document,
              index,
            ): DocumentUploadResult => {
              const originalExtension =
                getExtension(
                  document
                    .asset
                    .name,
                );

              const outputExtension =
                document.outputExtension;

              const converted =
                originalExtension !==
                outputExtension;

              /*
               * TXT <-> MD conserva exactamente
               * el contenido original.
               *
               * No alteramos bytes.
               */
              const baseName =
                removeExtension(
                  document
                    .asset
                    .name,
                );

              return {
                asset:
                  document.asset,

                uri:
                  document
                    .asset
                    .uri,

                originalFileName:
                  document
                    .asset
                    .name,

                fileName:
                  `${baseName}.${outputExtension}`,

                extension:
                  outputExtension,

                originalExtension,

                mimeType:
                  getMimeFallback(
                    outputExtension,
                  ),

                fileSize:
                  document
                    .asset
                    .size,

                order:
                  index + 1,

                converted,
              };
            },
          );

        if (
          selectionMode ===
          "single"
        ) {
          await onSave(
            results[0],
          );
        } else {
          await onSave(
            results,
          );
        }

        onClose();
      } catch (
        error
      ) {
        console.error(
          error,
        );

        Alert.alert(
          "Error",

          "No se pudieron preparar los documentos.",
        );
      } finally {
        setProcessing(
          false,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | CLOSE
  |--------------------------------------------------------------------------
  */

  const handleClose =
    () => {
      if (
        processing
      ) {
        return;
      }

      onClose();
    };

  /*
  |--------------------------------------------------------------------------
  | PREVIEW URL
  |--------------------------------------------------------------------------
  */

  const previewUrl =
    useMemo(
      () =>
        activeDocument
          ? getPreviewUrl(
              activeDocument.asset,
            )
          : null,

      [
        activeDocument,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | DROP COMPONENT
  |--------------------------------------------------------------------------
  */

  const DropView =
    View as React.ComponentType<any>;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <Modal
      visible={
        visible
      }
      title={
        title
      }
      onClose={
        handleClose
      }
      closeOnBackdropPress={
        !processing
      }
      width="96%"
      maxWidth={
        1180
      }
      footer={
        <View
          style={
            styles.footer
          }
        >
          <View
            style={
              styles.footerSummary
            }
          >
            <ThemedText
              style={{
                color:
                  c.textSecondary,

                fontSize: 12,
              }}
            >
              {
                documents.length
              }{" "}
              documento
              {documents.length ===
              1
                ? ""
                : "s"}
              {" • "}
              {formatBytes(
                totalSize,
              )}
            </ThemedText>
          </View>

          <View
            style={
              styles.footerActions
            }
          >
            <Button
              title="Cancelar"
              variant="secondary"
              disabled={
                processing
              }
              onPress={
                handleClose
              }
            />

            <Button
              title={
                selectionMode ===
                "multiple"
                  ? `Guardar ${documents.length} documentos`
                  : "Guardar documento"
              }
              loading={
                processing
              }
              disabled={
                !documents.length ||
                processing
              }
              onPress={
                handleSave
              }
            />
          </View>
        </View>
      }
    >
      {/* ===================================================== */}
      {/* TOP */}
      {/* ===================================================== */}

      <View
        style={[
          styles.topBar,

          {
            backgroundColor:
              c.backgroundSecondary,

            borderColor:
              c.border,
          },
        ]}
      >
        {allowModeChange ? (
          <View
            style={
              styles.modeButtons
            }
          >
            <ModeButton
              active={
                selectionMode ===
                "single"
              }
              title="Un documento"
              icon={
                FilePlus2
              }
              onPress={() =>
                changeSelectionMode(
                  "single",
                )
              }
            />

            <ModeButton
              active={
                selectionMode ===
                "multiple"
              }
              title="Varios documentos"
              icon={
                Files
              }
              onPress={() =>
                changeSelectionMode(
                  "multiple",
                )
              }
            />
          </View>
        ) : (
          <View />
        )}

        <Button
          title={
            selectionMode ===
            "multiple"
              ? documents.length
                ? "Agregar documentos"
                : "Seleccionar documentos"
              : documents.length
                ? "Cambiar documento"
                : "Seleccionar documento"
          }
          onPress={() =>
            pickDocuments(
              selectionMode ===
                "multiple" &&
                documents.length >
                  0,
            )
          }
        />
      </View>

      {/* ===================================================== */}
      {/* BODY */}
      {/* ===================================================== */}

      <ScrollView
        style={{
          maxHeight:
            bodyMaxHeight,
        }}
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <View
          style={[
            styles.layout,

            isCompact &&
              styles.layoutCompact,
          ]}
        >
          {/* ================================================= */}
          {/* LISTA */}
          {/* ================================================= */}

          <View
            style={[
              styles.documentsColumn,

              isCompact &&
                styles.fullWidth,
            ]}
          >
            <Card
              style={
                styles.documentsCard
              }
            >
              <View
                style={
                  styles.listHeader
                }
              >
                <View>
                  <ThemedText
                    style={
                      styles.listTitle
                    }
                  >
                    Documentos
                  </ThemedText>

                  <ThemedText
                    style={[
                      styles.listDescription,

                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    {documents.length
                      ? "Selecciona uno para visualizarlo."
                      : "Selecciona o arrastra archivos."}
                  </ThemedText>
                </View>

                <Badge
                  label={`${documents.length} / ${
                    selectionMode ===
                    "multiple"
                      ? maxFiles
                      : 1
                  }`}
                  variant="info"
                />
              </View>

              {/* ============================================= */}
              {/* EMPTY / DROP */}
              {/* ============================================= */}

              {!documents.length ? (
                <DropView
                  onDragEnter={
                    Platform.OS ===
                    "web"
                      ? (
                          event: any,
                        ) => {
                          event.preventDefault?.();

                          setDragActive(
                            true,
                          );
                        }
                      : undefined
                  }
                  onDragOver={
                    Platform.OS ===
                    "web"
                      ? (
                          event: any,
                        ) => {
                          event.preventDefault?.();

                          setDragActive(
                            true,
                          );
                        }
                      : undefined
                  }
                  onDragLeave={
                    Platform.OS ===
                    "web"
                      ? (
                          event: any,
                        ) => {
                          event.preventDefault?.();

                          setDragActive(
                            false,
                          );
                        }
                      : undefined
                  }
                  onDrop={
                    Platform.OS ===
                    "web"
                      ? handleDrop
                      : undefined
                  }
                  style={[
                    styles.dropZone,

                    {
                      backgroundColor:
                        dragActive
                          ? c.primarySubtle
                          : c.backgroundSecondary,

                      borderColor:
                        dragActive
                          ? c.primary
                          : c.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.dropIcon,

                      {
                        backgroundColor:
                          c.primarySubtle,
                      },
                    ]}
                  >
                    <Upload
                      size={34}
                      color={
                        c.primary
                      }
                    />
                  </View>

                  <ThemedText
                    style={
                      styles.dropTitle
                    }
                  >
                    {selectionMode ===
                    "multiple"
                      ? "Selecciona documentos"
                      : "Selecciona un documento"}
                  </ThemedText>

                  <ThemedText
                    style={[
                      styles.dropDescription,

                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    {Platform.OS ===
                    "web"
                      ? "Puedes arrastrar los archivos aquí."
                      : "Selecciona un archivo desde tu dispositivo."}
                  </ThemedText>

                  <Button
                    title={
                      selectionMode ===
                      "multiple"
                        ? "Seleccionar documentos"
                        : "Seleccionar documento"
                    }
                    onPress={() =>
                      pickDocuments(
                        false,
                      )
                    }
                  />

                  <ThemedText
                    style={[
                      styles.dropLimits,

                      {
                        color:
                          c.textMuted,
                      },
                    ]}
                  >
                    {normalizedExtensions
                      .map(
                        (
                          extension,
                        ) =>
                          extension.toUpperCase(),
                      )
                      .join(
                        " • ",
                      )}
                  </ThemedText>

                  <ThemedText
                    style={[
                      styles.dropLimits,

                      {
                        color:
                          c.textMuted,
                      },
                    ]}
                  >
                    Máximo{" "}
                    {
                      maxFileSizeMB
                    }{" "}
                    MB por archivo
                  </ThemedText>
                </DropView>
              ) : (
                <View
                  style={
                    styles.documentList
                  }
                >
                  {documents.map(
                    (
                      document,
                      index,
                    ) => {
                      const extension =
                        getExtension(
                          document
                            .asset
                            .name,
                        );

                      const Icon =
                        getDocumentIcon(
                          extension,
                        );

                      const selected =
                        index ===
                        activeIndex;

                      return (
                        <Pressable
                          key={
                            document.id
                          }
                          onPress={() =>
                            setActiveIndex(
                              index,
                            )
                          }
                          style={({
                            pressed,
                          }) => [
                            styles.documentItem,

                            {
                              backgroundColor:
                                selected
                                  ? c.primarySubtle
                                  : c.backgroundSecondary,

                              borderColor:
                                selected
                                  ? c.primary
                                  : c.border,

                              opacity:
                                pressed
                                  ? 0.8
                                  : 1,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.fileIcon,

                              {
                                backgroundColor:
                                  selected
                                    ? c.primary
                                    : c.card,
                              },
                            ]}
                          >
                            <Icon
                              size={23}
                              color={
                                selected
                                  ? c.primaryForeground
                                  : c.primary
                              }
                            />
                          </View>

                          <View
                            style={
                              styles.fileInfo
                            }
                          >
                            <ThemedText
                              numberOfLines={
                                1
                              }
                              style={
                                styles.fileName
                              }
                            >
                              {
                                document
                                  .asset
                                  .name
                              }
                            </ThemedText>

                            <View
                              style={
                                styles.fileMeta
                              }
                            >
                              <Badge
                                label={
                                  extension.toUpperCase() ||
                                  "FILE"
                                }
                                variant="info"
                              />

                              <ThemedText
                                style={{
                                  color:
                                    c.textSecondary,

                                  fontSize: 11,
                                }}
                              >
                                {formatBytes(
                                  document
                                    .asset
                                    .size,
                                )}
                              </ThemedText>
                            </View>
                          </View>

                          <IconButton
                            icon={
                              Trash2
                            }
                            variant="destructive"
                            accessibilityLabel="Eliminar documento"
                            onPress={() =>
                              removeDocument(
                                index,
                              )
                            }
                          />
                        </Pressable>
                      );
                    },
                  )}

                  {selectionMode ===
                    "multiple" &&
                  documents.length <
                    maxFiles ? (
                    <Pressable
                      onPress={() =>
                        pickDocuments(
                          true,
                        )
                      }
                      style={[
                        styles.addDocument,

                        {
                          borderColor:
                            c.border,

                          backgroundColor:
                            c.backgroundSecondary,
                        },
                      ]}
                    >
                      <Plus
                        size={18}
                        color={
                          c.primary
                        }
                      />

                      <ThemedText
                        style={{
                          color:
                            c.primary,

                          fontWeight:
                            "700",

                          fontSize: 12,
                        }}
                      >
                        Agregar documento
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>
              )}
            </Card>
          </View>

          {/* ================================================= */}
          {/* PREVIEW */}
          {/* ================================================= */}

          <View
            style={[
              styles.previewColumn,

              isCompact &&
                styles.fullWidth,
            ]}
          >
            <Card
              style={
                styles.previewCard
              }
            >
              <View
                style={
                  styles.previewHeader
                }
              >
                <View>
                  <ThemedText
                    style={
                      styles.previewTitle
                    }
                  >
                    Vista previa
                  </ThemedText>

                  <ThemedText
                    style={[
                      styles.previewDescription,

                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    {activeDocument
                      ? activeDocument
                          .asset
                          .name
                      : "Selecciona un documento."}
                  </ThemedText>
                </View>

                {activeDocument ? (
                  <Pressable
                    onPress={
                      openDocument
                    }
                    style={[
                      styles.openButton,

                      {
                        backgroundColor:
                          c.backgroundSecondary,

                        borderColor:
                          c.border,
                      },
                    ]}
                  >
                    <ExternalLink
                      size={17}
                      color={
                        c.primary
                      }
                    />

                    <ThemedText
                      style={{
                        color:
                          c.primary,

                        fontWeight:
                          "700",

                        fontSize: 11,
                      }}
                    >
                      {Platform.OS ===
                      "web"
                        ? "Abrir en otra pestaña"
                        : "Abrir documento"}
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>

              <Divider />

              {!activeDocument ? (
                <View
                  style={
                    styles.previewEmpty
                  }
                >
                  <View
                    style={[
                      styles.previewEmptyIcon,

                      {
                        backgroundColor:
                          c.primarySubtle,
                      },
                    ]}
                  >
                    <FolderOpen
                      size={34}
                      color={
                        c.primary
                      }
                    />
                  </View>

                  <ThemedText
                    style={
                      styles.previewEmptyTitle
                    }
                  >
                    Sin documento
                  </ThemedText>

                  <ThemedText
                    style={[
                      styles.previewEmptyDescription,

                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    Selecciona un archivo
                    para visualizarlo.
                  </ThemedText>
                </View>
              ) : (
                <>
                  {/* ========================================= */}
                  {/* PDF */}
                  {/* ========================================= */}

                  {isPdf(
                    activeExtension,
                  ) &&
                  Platform.OS ===
                    "web" &&
                  previewUrl ? (
                    <View
                      style={[
                        styles.pdfPreview,

                        {
                          borderColor:
                            c.border,

                          backgroundColor:
                            c.backgroundSecondary,
                        },
                      ]}
                    >
                      {React.createElement(
                        "iframe" as any,

                        {
                          src:
                            previewUrl,

                          title:
                            activeDocument
                              .asset
                              .name,

                          style: {
                            width:
                              "100%",

                            height:
                              "100%",

                            border:
                              "none",

                            borderRadius:
                              "10px",

                            background:
                              "white",
                          },
                        },
                      )}
                    </View>
                  ) : null}

                  {/* ========================================= */}
                  {/* TEXTO */}
                  {/* ========================================= */}

                  {isTextPreviewable(
                    activeExtension,
                  ) ? (
                    <View
                      style={[
                        styles.textPreview,

                        {
                          backgroundColor:
                            c.backgroundSecondary,

                          borderColor:
                            c.border,
                        },
                      ]}
                    >
                      <ScrollView
                        nestedScrollEnabled
                        showsVerticalScrollIndicator
                      >
                        <ThemedText
                          selectable
                          style={[
                            styles.textPreviewContent,

                            {
                              color:
                                c.textSecondary,
                            },
                          ]}
                        >
                          {previewLoading
                            ? "Cargando vista previa..."
                            : textPreview ||
                              "No se pudo leer el contenido."}
                        </ThemedText>
                      </ScrollView>
                    </View>
                  ) : null}

                  {/* ========================================= */}
                  {/* SIN PREVIEW NATIVO */}
                  {/* ========================================= */}

                  {!isPdf(
                    activeExtension,
                  ) &&
                  !isTextPreviewable(
                    activeExtension,
                  ) ? (
                    <View
                      style={[
                        styles.unsupportedPreview,

                        {
                          backgroundColor:
                            c.backgroundSecondary,

                          borderColor:
                            c.border,
                        },
                      ]}
                    >
                      {(() => {
                        const Icon =
                          getDocumentIcon(
                            activeExtension,
                          );

                        return (
                          <View
                            style={[
                              styles.unsupportedIcon,

                              {
                                backgroundColor:
                                  c.primarySubtle,
                              },
                            ]}
                          >
                            <Icon
                              size={38}
                              color={
                                c.primary
                              }
                            />
                          </View>
                        );
                      })()}

                      <ThemedText
                        style={
                          styles.unsupportedTitle
                        }
                      >
                        Vista previa no
                        disponible
                      </ThemedText>

                      <ThemedText
                        style={[
                          styles.unsupportedDescription,

                          {
                            color:
                              c.textSecondary,
                          },
                        ]}
                      >
                        Los archivos{" "}
                        {
                          activeExtension.toUpperCase()
                        }{" "}
                        no pueden
                        previsualizarse de
                        forma fiable
                        directamente dentro
                        del navegador.
                      </ThemedText>

                      <Button
                        title={
                          Platform.OS ===
                          "web"
                            ? "Abrir en otra pestaña"
                            : "Abrir documento"
                        }
                        variant="secondary"
                        onPress={
                          openDocument
                        }
                      />
                    </View>
                  ) : null}

                  {/* ========================================= */}
                  {/* FORMATO */}
                  {/* ========================================= */}

                  <Divider
                    label="Formato"
                    labelPosition="start"
                  />

                  <Select<string>
                    label="Formato de salida"
                    value={
                      activeDocument.outputExtension
                    }
                    options={
                      outputFormatOptions
                    }
                    onValueChange={
                      setActiveOutputFormat
                    }
                    modalTitle="Formato del documento"
                  />

                  {outputFormatOptions.length <=
                  1 ? (
                    <View
                      style={[
                        styles.formatNotice,

                        {
                          backgroundColor:
                            c.backgroundSecondary,

                          borderColor:
                            c.border,
                        },
                      ]}
                    >
                      <Info
                        size={17}
                        color={
                          c.info
                        }
                      />

                      <ThemedText
                        style={[
                          styles.formatNoticeText,

                          {
                            color:
                              c.textSecondary,
                          },
                        ]}
                      >
                        No hay otra
                        conversión que
                        podamos garantizar
                        sin modificar el
                        contenido o formato
                        de este archivo.
                      </ThemedText>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.formatNotice,

                        {
                          backgroundColor:
                            c.primarySubtle,

                          borderColor:
                            c.primary,
                        },
                      ]}
                    >
                      <Info
                        size={17}
                        color={
                          c.primary
                        }
                      />

                      <ThemedText
                        style={[
                          styles.formatNoticeText,

                          {
                            color:
                              c.textSecondary,
                          },
                        ]}
                      >
                        Esta conversión
                        conserva el contenido
                        textual original.
                      </ThemedText>
                    </View>
                  )}

                  {/* ========================================= */}
                  {/* INFO */}
                  {/* ========================================= */}

                  <Divider
                    label="Información"
                    labelPosition="start"
                  />

                  <View
                    style={
                      styles.infoGrid
                    }
                  >
                    <InfoItem
                      label="Archivo"
                      value={
                        activeDocument
                          .asset
                          .name
                      }
                    />

                    <InfoItem
                      label="Formato"
                      value={
                        activeExtension.toUpperCase()
                      }
                    />

                    <InfoItem
                      label="Peso"
                      value={formatBytes(
                        activeDocument
                          .asset
                          .size,
                      )}
                    />

                    <InfoItem
                      label="MIME"
                      value={
                        activeDocument
                          .asset
                          .mimeType ??
                        getMimeFallback(
                          activeExtension,
                        )
                      }
                    />
                  </View>
                </>
              )}
            </Card>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}

/*
|--------------------------------------------------------------------------
| MODE BUTTON
|--------------------------------------------------------------------------
*/

function ModeButton({
  active,

  title,

  icon: Icon,

  onPress,
}: {
  active: boolean;

  title: string;

  icon:
    typeof Files;

  onPress: () => void;
}) {
  const { theme } =
    useTheme();

  const c =
    theme.colors;

  return (
    <Pressable
      onPress={
        onPress
      }
      style={({
        pressed,
      }) => [
        styles.modeButton,

        {
          backgroundColor:
            active
              ? c.primary
              : c.card,

          borderColor:
            active
              ? c.primary
              : c.border,

          opacity:
            pressed
              ? 0.75
              : 1,
        },
      ]}
    >
      <Icon
        size={17}
        color={
          active
            ? c.primaryForeground
            : c.textSecondary
        }
      />

      <ThemedText
        style={{
          color:
            active
              ? c.primaryForeground
              : c.text,

          fontWeight:
            "700",

          fontSize: 12,
        }}
      >
        {title}
      </ThemedText>
    </Pressable>
  );
}

/*
|--------------------------------------------------------------------------
| INFO ITEM
|--------------------------------------------------------------------------
*/

function InfoItem({
  label,

  value,
}: {
  label: string;

  value: string;
}) {
  const { theme } =
    useTheme();

  const c =
    theme.colors;

  return (
    <View
      style={
        styles.infoItem
      }
    >
      <ThemedText
        style={[
          styles.infoLabel,

          {
            color:
              c.textSecondary,
          },
        ]}
      >
        {label}
      </ThemedText>

      <ThemedText
        numberOfLines={1}
        style={
          styles.infoValue
        }
      >
        {value}
      </ThemedText>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| ESTILOS
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    /*
    |--------------------------------------------------------------------------
    | TOP BAR
    |--------------------------------------------------------------------------
    */

    topBar: {
      width: "100%",

      minHeight: 58,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      flexWrap: "wrap",

      gap: 10,

      padding: 10,

      marginBottom: 12,

      borderWidth: 1,

      borderRadius: 12,
    },

    modeButtons: {
      flexDirection: "row",

      alignItems: "center",

      flexWrap: "wrap",

      gap: 6,
    },

    modeButton: {
      minHeight: 38,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "center",

      gap: 7,

      paddingHorizontal: 13,

      borderWidth: 1,

      borderRadius: 9,
    },

    /*
    |--------------------------------------------------------------------------
    | BODY
    |--------------------------------------------------------------------------
    */

    scrollContent: {
      paddingBottom: 5,
    },

    layout: {
      width: "100%",

      flexDirection: "row",

      alignItems:
        "flex-start",

      gap: 14,
    },

    layoutCompact: {
      flexDirection:
        "column",
    },

    fullWidth: {
      width: "100%",
    },

    documentsColumn: {
      width: "44%",
    },

    previewColumn: {
      width: "56%",

      flexShrink: 1,
    },

    /*
    |--------------------------------------------------------------------------
    | DOCUMENTOS
    |--------------------------------------------------------------------------
    */

    documentsCard: {
      width: "100%",

      gap: 12,
    },

    listHeader: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      gap: 12,
    },

    listTitle: {
      fontSize: 16,

      fontWeight:
        "800",
    },

    listDescription: {
      marginTop: 2,

      fontSize: 11,
    },

    /*
    |--------------------------------------------------------------------------
    | DROP
    |--------------------------------------------------------------------------
    */

    dropZone: {
      width: "100%",

      minHeight: 360,

      alignItems: "center",

      justifyContent:
        "center",

      gap: 10,

      padding: 25,

      borderWidth: 1.5,

      borderStyle:
        "dashed",

      borderRadius: 14,
    },

    dropIcon: {
      width: 70,

      height: 70,

      borderRadius: 20,

      alignItems: "center",

      justifyContent:
        "center",
    },

    dropTitle: {
      fontSize: 17,

      fontWeight:
        "800",

      textAlign:
        "center",
    },

    dropDescription: {
      maxWidth: 340,

      fontSize: 12,

      lineHeight: 18,

      textAlign:
        "center",
    },

    dropLimits: {
      fontSize: 10,

      textAlign:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | LIST
    |--------------------------------------------------------------------------
    */

    documentList: {
      width: "100%",

      gap: 8,
    },

    documentItem: {
      width: "100%",

      minHeight: 68,

      flexDirection: "row",

      alignItems: "center",

      gap: 10,

      padding: 9,

      borderWidth: 1,

      borderRadius: 11,
    },

    fileIcon: {
      width: 42,

      height: 42,

      alignItems: "center",

      justifyContent:
        "center",

      borderRadius: 10,
    },

    fileInfo: {
      flex: 1,

      minWidth: 0,

      gap: 5,
    },

    fileName: {
      fontSize: 12,

      fontWeight:
        "800",
    },

    fileMeta: {
      flexDirection: "row",

      alignItems: "center",

      gap: 6,
    },

    addDocument: {
      minHeight: 46,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "center",

      gap: 8,

      borderWidth: 1,

      borderStyle:
        "dashed",

      borderRadius: 10,
    },

    /*
    |--------------------------------------------------------------------------
    | PREVIEW
    |--------------------------------------------------------------------------
    */

    previewCard: {
      width: "100%",

      gap: 11,
    },

    previewHeader: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      flexWrap: "wrap",

      gap: 10,
    },

    previewTitle: {
      fontSize: 16,

      fontWeight:
        "800",
    },

    previewDescription: {
      maxWidth: 360,

      marginTop: 2,

      fontSize: 11,
    },

    openButton: {
      minHeight: 38,

      flexDirection: "row",

      alignItems: "center",

      gap: 7,

      paddingHorizontal: 11,

      borderWidth: 1,

      borderRadius: 9,
    },

    /*
    |--------------------------------------------------------------------------
    | EMPTY PREVIEW
    |--------------------------------------------------------------------------
    */

    previewEmpty: {
      minHeight: 330,

      alignItems: "center",

      justifyContent:
        "center",

      gap: 8,
    },

    previewEmptyIcon: {
      width: 68,

      height: 68,

      borderRadius: 19,

      alignItems: "center",

      justifyContent:
        "center",
    },

    previewEmptyTitle: {
      fontSize: 16,

      fontWeight:
        "800",
    },

    previewEmptyDescription: {
      fontSize: 11,
    },

    /*
    |--------------------------------------------------------------------------
    | PDF
    |--------------------------------------------------------------------------
    */

    pdfPreview: {
      width: "100%",

      height: 360,

      overflow:
        "hidden",

      borderWidth: 1,

      borderRadius: 11,
    },

    /*
    |--------------------------------------------------------------------------
    | TEXT
    |--------------------------------------------------------------------------
    */

    textPreview: {
      width: "100%",

      height: 320,

      overflow:
        "hidden",

      padding: 12,

      borderWidth: 1,

      borderRadius: 11,
    },

    textPreviewContent: {
      fontSize: 11,

      lineHeight: 18,

      fontFamily:
        Platform.OS ===
        "web"
          ? "monospace"
          : undefined,
    },

    /*
    |--------------------------------------------------------------------------
    | UNSUPPORTED
    |--------------------------------------------------------------------------
    */

    unsupportedPreview: {
      minHeight: 300,

      alignItems: "center",

      justifyContent:
        "center",

      gap: 10,

      padding: 24,

      borderWidth: 1,

      borderRadius: 11,
    },

    unsupportedIcon: {
      width: 72,

      height: 72,

      borderRadius: 20,

      alignItems: "center",

      justifyContent:
        "center",
    },

    unsupportedTitle: {
      fontSize: 15,

      fontWeight:
        "800",
    },

    unsupportedDescription: {
      maxWidth: 360,

      textAlign:
        "center",

      fontSize: 11,

      lineHeight: 17,
    },

    /*
    |--------------------------------------------------------------------------
    | FORMAT
    |--------------------------------------------------------------------------
    */

    formatNotice: {
      width: "100%",

      flexDirection: "row",

      alignItems:
        "flex-start",

      gap: 8,

      padding: 9,

      borderWidth: 1,

      borderRadius: 9,
    },

    formatNoticeText: {
      flex: 1,

      fontSize: 10,

      lineHeight: 15,
    },

    /*
    |--------------------------------------------------------------------------
    | INFO
    |--------------------------------------------------------------------------
    */

    infoGrid: {
      width: "100%",

      flexDirection: "row",

      flexWrap: "wrap",

      rowGap: 12,

      columnGap: 16,
    },

    infoItem: {
      width: "45%",

      minWidth: 130,

      flexGrow: 1,

      gap: 3,
    },

    infoLabel: {
      fontSize: 10,

      fontWeight:
        "600",
    },

    infoValue: {
      fontSize: 11,

      fontWeight:
        "700",
    },

    /*
    |--------------------------------------------------------------------------
    | FOOTER
    |--------------------------------------------------------------------------
    */

    footer: {
      width: "100%",

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      flexWrap: "wrap",

      gap: 10,
    },

    footerSummary: {
      flex: 1,

      minWidth: 150,
    },

    footerActions: {
      flexDirection: "row",

      alignItems: "center",

      flexWrap: "wrap",

      gap: 9,
    },
  });

export default DocumentUploadModal;