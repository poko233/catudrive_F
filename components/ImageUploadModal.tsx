// components/ImageUploadModal.tsx

import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select, SelectOption } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { useTheme } from "@/theme/useTheme";

import * as ImagePicker from "expo-image-picker";
import {
  FlipType,
  ImageManipulator,
  SaveFormat,
} from "expo-image-manipulator";

import {
  Camera,
  FlipHorizontal2,
  FlipVertical2,
  ImagePlus,
  Images,
  RotateCcw,
  RotateCw,
  Trash2,
  Undo2,
  Upload,
  X,
} from "lucide-react-native";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal as NativeModal,
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

export type ImageOutputFormat = "jpeg" | "png" | "webp";

export type ImageAspectRatio =
  | "original"
  | "1:1"
  | "4:3"
  | "3:4"
  | "16:9"
  | "9:16";

export type ImageResolutionPreset =
  | "original"
  | "1920"
  | "1280"
  | "1024"
  | "800"
  | "512"
  | "custom";

export type ImageSelectionMode = "single" | "multiple";

export interface ImageUploadResult {
  uri: string;
  width: number;
  height: number;
  format: ImageOutputFormat;
  mimeType: string;
  fileName: string;
  fileSize?: number;

  originalUri: string;
  originalWidth: number;
  originalHeight: number;
  originalFileSize?: number;

  quality: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  aspectRatio: ImageAspectRatio;
}

interface ImageUploadModalProps {
  visible: boolean;

  onClose: () => void;

  onSave: (
    result: ImageUploadResult | ImageUploadResult[],
  ) => void | Promise<void>;

  title?: string;

  allowCamera?: boolean;

  maxInputSizeMB?: number;

  maxImages?: number;

  initialSelectionMode?: ImageSelectionMode;

  allowModeChange?: boolean;

  initialFormat?: ImageOutputFormat;

  /**
   * Calidad interna para JPEG/WEBP.
   * No se muestra en la UI.
   */
  initialQuality?: number;

  initialAspectRatio?: ImageAspectRatio;
}

interface ProcessedPreview {
  uri: string;
  width: number;
  height: number;
  fileSize?: number;
  quality: number;
}

interface BuiltImage {
  result: {
    uri: string;
    width: number;
    height: number;
  };

  fileSize?: number;
  quality: number;
  rotation: number;
}

/*
|--------------------------------------------------------------------------
| OPCIONES
|--------------------------------------------------------------------------
*/

const FORMAT_OPTIONS: SelectOption<ImageOutputFormat>[] = [
  {
    label: "WEBP",
    value: "webp",
    description: "Excelente relación entre calidad y peso.",
  },
  {
    label: "JPEG",
    value: "jpeg",
    description: "Ideal para fotografías.",
  },
  {
    label: "PNG",
    value: "png",
    description: "Compatible con transparencia.",
  },
];

const ASPECT_OPTIONS: SelectOption<ImageAspectRatio>[] = [
  {
    label: "Original",
    value: "original",
  },
  {
    label: "Cuadrado 1:1",
    value: "1:1",
  },
  {
    label: "Horizontal 4:3",
    value: "4:3",
  },
  {
    label: "Vertical 3:4",
    value: "3:4",
  },
  {
    label: "Panorámico 16:9",
    value: "16:9",
  },
  {
    label: "Vertical 9:16",
    value: "9:16",
  },
];

const RESOLUTION_OPTIONS: SelectOption<ImageResolutionPreset>[] = [
  {
    label: "Original",
    value: "original",
    description: "Mantener la resolución disponible.",
  },
  {
    label: "1920 px",
    value: "1920",
    description: "Máximo 1920 px en el lado mayor.",
  },
  {
    label: "1280 px",
    value: "1280",
    description: "Ideal para imágenes web grandes.",
  },
  {
    label: "1024 px",
    value: "1024",
  },
  {
    label: "800 px",
    value: "800",
  },
  {
    label: "512 px",
    value: "512",
  },
  {
    label: "Personalizada",
    value: "custom",
  },
];

const SIZE_LIMIT_OPTIONS: SelectOption<string>[] = [
  {
    label: "Sin límite",
    value: "none",
  },
  {
    label: "500 KB",
    value: "0.5",
  },
  {
    label: "1 MB",
    value: "1",
  },
  {
    label: "2 MB",
    value: "2",
  },
  {
    label: "5 MB",
    value: "5",
  },
];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function formatBytes(bytes?: number) {
  if (bytes === undefined || bytes === null) {
    return "Desconocido";
  }

  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function getFormatExtension(format: ImageOutputFormat) {
  return format === "jpeg" ? "jpg" : format;
}

function getMimeType(format: ImageOutputFormat) {
  switch (format) {
    case "jpeg":
      return "image/jpeg";

    case "png":
      return "image/png";

    case "webp":
      return "image/webp";
  }
}

function getSaveFormat(format: ImageOutputFormat) {
  switch (format) {
    case "jpeg":
      return SaveFormat.JPEG;

    case "png":
      return SaveFormat.PNG;

    case "webp":
      return SaveFormat.WEBP;
  }
}

function removeExtension(fileName?: string | null) {
  if (!fileName) {
    return "imagen";
  }

  return fileName.replace(/\.[^/.]+$/, "");
}

function normalizeRotation(rotation: number) {
  let normalized = rotation % 360;

  if (normalized < 0) {
    normalized += 360;
  }

  return normalized;
}

function getAspectValue(
  aspect: ImageAspectRatio,
  width: number,
  height: number,
) {
  if (aspect === "original") {
    if (width <= 0 || height <= 0) {
      return 1;
    }

    return width / height;
  }

  const map: Record<
    Exclude<ImageAspectRatio, "original">,
    number
  > = {
    "1:1": 1,
    "4:3": 4 / 3,
    "3:4": 3 / 4,
    "16:9": 16 / 9,
    "9:16": 9 / 16,
  };

  return map[aspect];
}

function getCenteredCrop(
  width: number,
  height: number,
  targetRatio: number,
) {
  if (width <= 0 || height <= 0) {
    return null;
  }

  const currentRatio = width / height;

  if (Math.abs(currentRatio - targetRatio) < 0.001) {
    return null;
  }

  if (currentRatio > targetRatio) {
    const cropWidth = height * targetRatio;

    return {
      originX: (width - cropWidth) / 2,
      originY: 0,
      width: cropWidth,
      height,
    };
  }

  const cropHeight = width / targetRatio;

  return {
    originX: 0,
    originY: (height - cropHeight) / 2,
    width,
    height: cropHeight,
  };
}

async function getFileSize(uri: string) {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    return blob.size;
  } catch {
    return undefined;
  }
}

/*
|--------------------------------------------------------------------------
| BOTÓN DE CARGA
|--------------------------------------------------------------------------
*/

interface UploadActionButtonProps {
  title: string;

  type?: "primary" | "secondary";

  icon: typeof Upload | typeof Camera;

  disabled?: boolean;

  onPress: () => void;
}

function UploadActionButton({
  title,
  type = "primary",
  icon: Icon,
  disabled = false,
  onPress,
}: UploadActionButtonProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const primary = type === "primary";

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.uploadActionButton,
        {
          backgroundColor: primary
            ? c.primary
            : c.backgroundSecondary,

          borderColor: primary
            ? c.primary
            : c.border,

          opacity: disabled
            ? 0.4
            : pressed
              ? 0.78
              : 1,
        },
      ]}
    >
      <Icon
        size={19}
        strokeWidth={2}
        color={
          primary
            ? c.primaryForeground
            : c.text
        }
      />

      <ThemedText
        style={[
          styles.uploadActionText,
          {
            color: primary
              ? c.primaryForeground
              : c.text,
          },
        ]}
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
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.infoItem}>
      <ThemedText
        style={[
          styles.infoLabel,
          {
            color: c.textSecondary,
          },
        ]}
      >
        {label}
      </ThemedText>

      <ThemedText
        numberOfLines={1}
        style={styles.infoValue}
      >
        {value}
      </ThemedText>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export function ImageUploadModal({
  visible,
  onClose,
  onSave,
  title = "Subir imágenes",
  allowCamera = true,
  maxInputSizeMB = 15,
  maxImages = 10,
  initialSelectionMode = "single",
  allowModeChange = true,
  initialFormat = "webp",
  initialQuality = 90,
  initialAspectRatio = "original",
}: ImageUploadModalProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const {
    width,
    height,
  } = useWindowDimensions();

  /*
  |--------------------------------------------------------------------------
  | RESPONSIVE
  |--------------------------------------------------------------------------
  */

  const isCompact = width < 850;

  const bodyMaxHeight = Math.max(
    300,
    Math.min(
      520,
      height - 245,
    ),
  );

  const previewHeight = Math.max(
    210,
    Math.min(
      300,
      height * 0.34,
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
  ] = useState<ImageSelectionMode>(
    initialSelectionMode,
  );

  /*
  |--------------------------------------------------------------------------
  | IMÁGENES
  |--------------------------------------------------------------------------
  */

  const [
    images,
    setImages,
  ] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const image =
    images[activeIndex] ??
    null;

  /*
  |--------------------------------------------------------------------------
  | PREVIEW
  |--------------------------------------------------------------------------
  */

  const [
    processedPreview,
    setProcessedPreview,
  ] = useState<ProcessedPreview | null>(
    null,
  );

  const [
    previewProcessing,
    setPreviewProcessing,
  ] = useState(false);

  const previewRequestRef =
    useRef(0);

  /*
  |--------------------------------------------------------------------------
  | CÁMARA NATIVA
  |--------------------------------------------------------------------------
  */

  const [
    cameraOpening,
    setCameraOpening,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | CÁMARA WEB
  |--------------------------------------------------------------------------
  */

  const [
    webCameraVisible,
    setWebCameraVisible,
  ] = useState(false);

  const [
    webCameraLoading,
    setWebCameraLoading,
  ] = useState(false);

  const [
    webCameraReady,
    setWebCameraReady,
  ] = useState(false);

  /*
   * Se usan any para que el archivo compile también
   * en builds nativos donde los tipos DOM pueden no
   * estar disponibles en tsconfig.
   */
  const webVideoRef =
    useRef<any>(null);

  const webCameraStreamRef =
    useRef<any>(null);

  /*
  |--------------------------------------------------------------------------
  | CONFIGURACIÓN
  |--------------------------------------------------------------------------
  */

  const [
    format,
    setFormat,
  ] = useState<ImageOutputFormat>(
    initialFormat,
  );

  const [
    aspectRatio,
    setAspectRatio,
  ] = useState<ImageAspectRatio>(
    initialAspectRatio,
  );

  const [
    resolution,
    setResolution,
  ] = useState<ImageResolutionPreset>(
    "original",
  );

  const [
    customWidth,
    setCustomWidth,
  ] = useState("");

  const [
    customHeight,
    setCustomHeight,
  ] = useState("");

  const [
    lockRatio,
    setLockRatio,
  ] = useState(true);

  const [
    maxOutputSize,
    setMaxOutputSize,
  ] = useState("none");

  /*
  |--------------------------------------------------------------------------
  | TRANSFORMACIONES
  |--------------------------------------------------------------------------
  */

  const [
    rotation,
    setRotation,
  ] = useState(0);

  const [
    flipHorizontal,
    setFlipHorizontal,
  ] = useState(false);

  const [
    flipVertical,
    setFlipVertical,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | GUARDANDO
  |--------------------------------------------------------------------------
  */

  const [
    processing,
    setProcessing,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | ABRIR MODAL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!visible) {
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
  | RESET DE EDICIÓN
  |--------------------------------------------------------------------------
  */

  const resetEditingForImage =
    useCallback(
      (
        asset:
          ImagePicker.ImagePickerAsset,
      ) => {
        setRotation(0);

        setFlipHorizontal(
          false,
        );

        setFlipVertical(
          false,
        );

        setAspectRatio(
          initialAspectRatio,
        );

        setResolution(
          "original",
        );

        setCustomWidth(
          String(
            asset.width,
          ),
        );

        setCustomHeight(
          String(
            asset.height,
          ),
        );

        setFormat(
          initialFormat,
        );

        setMaxOutputSize(
          "none",
        );

        setLockRatio(
          true,
        );

        setProcessedPreview(
          null,
        );
      },
      [
        initialAspectRatio,
        initialFormat,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CAMBIAR MODO
  |--------------------------------------------------------------------------
  */

  const changeSelectionMode = (
    mode:
      ImageSelectionMode,
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
      image
    ) {
      setImages([
        image,
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
  | DIMENSIONES DESPUÉS DEL CROP
  |--------------------------------------------------------------------------
  */

  const getCroppedDimensions =
    useCallback(
      (
        asset:
          ImagePicker.ImagePickerAsset,
      ) => {
        const ratio =
          getAspectValue(
            aspectRatio,
            asset.width,
            asset.height,
          );

        const crop =
          getCenteredCrop(
            asset.width,
            asset.height,
            ratio,
          );

        let widthValue =
          crop?.width ??
          asset.width;

        let heightValue =
          crop?.height ??
          asset.height;

        const normalized =
          normalizeRotation(
            rotation,
          );

        if (
          normalized === 90 ||
          normalized === 270
        ) {
          [
            widthValue,
            heightValue,
          ] = [
            heightValue,
            widthValue,
          ];
        }

        return {
          width:
            Math.round(
              widthValue,
            ),

          height:
            Math.round(
              heightValue,
            ),
        };
      },
      [
        aspectRatio,
        rotation,
      ],
    );

  const croppedDimensions =
    useMemo(() => {
      if (!image) {
        return {
          width: 0,
          height: 0,
        };
      }

      return getCroppedDimensions(
        image,
      );
    }, [
      image,
      getCroppedDimensions,
    ]);

  /*
  |--------------------------------------------------------------------------
  | DIMENSIONES DE SALIDA
  |--------------------------------------------------------------------------
  */

  const getOutputDimensions =
    useCallback(
      (
        asset:
          ImagePicker.ImagePickerAsset,
      ) => {
        const base =
          getCroppedDimensions(
            asset,
          );

        if (
          resolution ===
          "original"
        ) {
          return base;
        }

        if (
          resolution ===
          "custom"
        ) {
          let widthValue =
            Number(
              customWidth,
            );

          let heightValue =
            Number(
              customHeight,
            );

          if (
            !Number.isFinite(
              widthValue,
            ) ||
            widthValue <= 0
          ) {
            widthValue =
              base.width;
          }

          if (
            !Number.isFinite(
              heightValue,
            ) ||
            heightValue <= 0
          ) {
            heightValue =
              base.height;
          }

          return {
            width:
              Math.round(
                widthValue,
              ),

            height:
              Math.round(
                heightValue,
              ),
          };
        }

        const maxSide =
          Number(
            resolution,
          );

        const longest =
          Math.max(
            base.width,
            base.height,
          );

        /*
         * No se aumenta una imagen
         * si ya es más pequeña.
         */
        if (
          longest <=
          maxSide
        ) {
          return base;
        }

        const scale =
          maxSide /
          longest;

        return {
          width:
            Math.round(
              base.width *
                scale,
            ),

          height:
            Math.round(
              base.height *
                scale,
            ),
        };
      },
      [
        getCroppedDimensions,
        resolution,
        customWidth,
        customHeight,
      ],
    );

  const outputDimensions =
    useMemo(() => {
      if (!image) {
        return {
          width: 0,
          height: 0,
        };
      }

      return getOutputDimensions(
        image,
      );
    }, [
      image,
      getOutputDimensions,
    ]);

  /*
  |--------------------------------------------------------------------------
  | VALIDACIÓN
  |--------------------------------------------------------------------------
  */

  const validateAssets = useCallback(
    (
      assets:
        ImagePicker.ImagePickerAsset[],
    ) => {
      const maxBytes =
        maxInputSizeMB *
        1024 *
        1024;

      const valid =
        assets.filter(
          (
            asset,
          ) =>
            !asset.fileSize ||
            asset.fileSize <=
              maxBytes,
        );

      const rejected =
        assets.length -
        valid.length;

      if (
        rejected > 0
      ) {
        Alert.alert(
          "Imágenes omitidas",
          `${rejected} imagen(es) superaron el máximo permitido de ${maxInputSizeMB} MB.`,
        );
      }

      return valid;
    },
    [
      maxInputSizeMB,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | APLICAR IMÁGENES
  |--------------------------------------------------------------------------
  */

  const applySelectedImages =
    useCallback(
      (
        selected:
          ImagePicker.ImagePickerAsset[],

        append = false,
      ) => {
        const valid =
          validateAssets(
            selected,
          );

        if (
          !valid.length
        ) {
          return;
        }

        /*
        |--------------------------------------------------------------------------
        | UNA IMAGEN
        |--------------------------------------------------------------------------
        */

        if (
          selectionMode ===
          "single"
        ) {
          const first =
            valid[0];

          setImages([
            first,
          ]);

          setActiveIndex(
            0,
          );

          resetEditingForImage(
            first,
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | VARIAS IMÁGENES
        |--------------------------------------------------------------------------
        */

        setImages(
          (
            current,
          ) => {
            const base =
              append
                ? current
                : [];

            const map =
              new Map<
                string,
                ImagePicker.ImagePickerAsset
              >();

            base.forEach(
              (
                asset,
              ) => {
                map.set(
                  asset.uri,
                  asset,
                );
              },
            );

            valid.forEach(
              (
                asset,
              ) => {
                map.set(
                  asset.uri,
                  asset,
                );
              },
            );

            return Array.from(
              map.values(),
            ).slice(
              0,
              maxImages,
            );
          },
        );

        if (
          !append
        ) {
          setActiveIndex(
            0,
          );

          resetEditingForImage(
            valid[0],
          );
        }
      },
      [
        validateAssets,
        selectionMode,
        resetEditingForImage,
        maxImages,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | GALERÍA
  |--------------------------------------------------------------------------
  */

  const pickImages =
    async (
      append = false,
    ) => {
      try {
        if (
          selectionMode ===
            "multiple" &&
          append &&
          images.length >=
            maxImages
        ) {
          Alert.alert(
            "Límite alcanzado",
            `Puedes seleccionar un máximo de ${maxImages} imágenes.`,
          );

          return;
        }

        const remaining =
          Math.max(
            1,
            maxImages -
              (
                append
                  ? images.length
                  : 0
              ),
          );

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: [
                "images",
              ],

              quality: 1,

              allowsEditing:
                false,

              allowsMultipleSelection:
                selectionMode ===
                "multiple",

              selectionLimit:
                selectionMode ===
                "multiple"
                  ? remaining
                  : 1,
            },
          );

        if (
          result.canceled ||
          !result.assets
            ?.length
        ) {
          return;
        }

        applySelectedImages(
          result.assets,
          append,
        );
      } catch (
        error
      ) {
        console.error(
          "Error seleccionando imágenes:",
          error,
        );

        Alert.alert(
          "Error",
          "No se pudo abrir la galería del dispositivo.",
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | ABRIR CONFIGURACIÓN NATIVA
  |--------------------------------------------------------------------------
  */

  const openDeviceSettings =
    async () => {
      try {
        await Linking.openSettings();
      } catch (
        error
      ) {
        console.error(
          "No se pudo abrir configuración:",
          error,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | DETENER CÁMARA WEB
  |--------------------------------------------------------------------------
  */

  const stopWebCamera =
    useCallback(() => {
      const stream =
        webCameraStreamRef.current;

      if (
        stream
      ) {
        try {
          stream
            .getTracks?.()
            ?.forEach(
              (
                track: any,
              ) => {
                try {
                  track.stop?.();
                } catch {
                  // Sin acción.
                }
              },
            );
        } catch {
          // Sin acción.
        }
      }

      webCameraStreamRef.current =
        null;

      if (
        webVideoRef.current
      ) {
        try {
          webVideoRef.current.srcObject =
            null;
        } catch {
          // Sin acción.
        }
      }

      setWebCameraReady(
        false,
      );
    }, []);

  /*
  |--------------------------------------------------------------------------
  | CERRAR CÁMARA WEB
  |--------------------------------------------------------------------------
  */

  const closeWebCamera =
    useCallback(() => {
      stopWebCamera();

      setWebCameraVisible(
        false,
      );

      setWebCameraLoading(
        false,
      );
    }, [
      stopWebCamera,
    ]);

  /*
  |--------------------------------------------------------------------------
  | ABRIR CÁMARA WEB REAL
  |--------------------------------------------------------------------------
  */

  const openWebCamera =
    async () => {
      if (
        Platform.OS !==
        "web"
      ) {
        return;
      }

      const browserNavigator =
        globalThis
          .navigator as any;

      if (
        !browserNavigator ||
        !browserNavigator
          .mediaDevices ||
        !browserNavigator
          .mediaDevices
          .getUserMedia
      ) {
        Alert.alert(
          "Cámara no disponible",
          "Este navegador no permite acceder directamente a la cámara.",
        );

        return;
      }

      /*
       * getUserMedia requiere:
       * - localhost
       * - o HTTPS
       */
      try {
        stopWebCamera();

        setWebCameraLoading(
          true,
        );

        setWebCameraReady(
          false,
        );

        const stream =
          await browserNavigator.mediaDevices.getUserMedia(
            {
              audio: false,

              video: {
                /*
                 * En celular web intenta usar
                 * la cámara trasera.
                 * En laptop usará normalmente
                 * la webcam disponible.
                 */
                facingMode: {
                  ideal:
                    "environment",
                },

                width: {
                  ideal: 1920,
                },

                height: {
                  ideal: 1080,
                },
              },
            },
          );

        webCameraStreamRef.current =
          stream;

        setWebCameraVisible(
          true,
        );
      } catch (
        error
      ) {
        console.error(
          "Error abriendo cámara web:",
          error,
        );

        stopWebCamera();

        Alert.alert(
          "No se pudo abrir la cámara",
          "Comprueba que el dispositivo tenga una cámara, que el navegador tenga permiso para utilizarla y que la página se esté ejecutando en HTTPS o localhost.",
        );
      } finally {
        setWebCameraLoading(
          false,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | ASIGNAR STREAM AL <video>
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      Platform.OS !==
        "web" ||
      !webCameraVisible
    ) {
      return;
    }

    const timer =
      setTimeout(
        async () => {
          const video =
            webVideoRef.current;

          const stream =
            webCameraStreamRef.current;

          if (
            !video ||
            !stream
          ) {
            return;
          }

          try {
            video.srcObject =
              stream;

            await video.play?.();
          } catch (
            error
          ) {
            console.error(
              "Error reproduciendo cámara web:",
              error,
            );
          }
        },
        50,
      );

    return () => {
      clearTimeout(
        timer,
      );
    };
  }, [
    webCameraVisible,
  ]);

  /*
  |--------------------------------------------------------------------------
  | CAPTURAR FOTO WEB
  |--------------------------------------------------------------------------
  */

  const captureWebPhoto =
    async () => {
      if (
        Platform.OS !==
        "web"
      ) {
        return;
      }

      const video =
        webVideoRef.current;

      if (!video) {
        return;
      }

      const videoWidth =
        Number(
          video.videoWidth,
        );

      const videoHeight =
        Number(
          video.videoHeight,
        );

      if (
        videoWidth <= 0 ||
        videoHeight <= 0
      ) {
        Alert.alert(
          "Cámara no lista",
          "Espera un momento a que la cámara termine de iniciar.",
        );

        return;
      }

      try {
        const browserDocument =
          globalThis
            .document as any;

        const browserURL =
          globalThis
            .URL as any;

        const BrowserFile =
          (
            globalThis as any
          ).File;

        if (
          !browserDocument ||
          !browserURL
        ) {
          throw new Error(
            "Las APIs del navegador no están disponibles.",
          );
        }

        /*
        |--------------------------------------------------------------------------
        | CAPTURAR FRAME EN CANVAS
        |--------------------------------------------------------------------------
        */

        const canvas =
          browserDocument.createElement(
            "canvas",
          );

        canvas.width =
          videoWidth;

        canvas.height =
          videoHeight;

        const context =
          canvas.getContext(
            "2d",
          );

        if (!context) {
          throw new Error(
            "No se pudo crear el Canvas.",
          );
        }

        context.drawImage(
          video,
          0,
          0,
          videoWidth,
          videoHeight,
        );

        /*
        |--------------------------------------------------------------------------
        | CANVAS -> BLOB JPEG
        |--------------------------------------------------------------------------
        */

        const blob: any =
          await new Promise(
            (
              resolve,
              reject,
            ) => {
              canvas.toBlob(
                (
                  generatedBlob:
                    any,
                ) => {
                  if (
                    generatedBlob
                  ) {
                    resolve(
                      generatedBlob,
                    );

                    return;
                  }

                  reject(
                    new Error(
                      "No se pudo generar la fotografía.",
                    ),
                  );
                },
                "image/jpeg",
                0.95,
              );
            },
          );

        const timestamp =
          Date.now();

        const fileName =
          `foto-${timestamp}.jpg`;

        const file =
          BrowserFile
            ? new BrowserFile(
                [
                  blob,
                ],
                fileName,
                {
                  type:
                    "image/jpeg",

                  lastModified:
                    timestamp,
                },
              )
            : undefined;

        const uri =
          browserURL.createObjectURL(
            blob,
          );

        /*
        |--------------------------------------------------------------------------
        | CREAR ASSET COMPATIBLE
        |--------------------------------------------------------------------------
        */

        const asset =
          {
            uri,

            width:
              videoWidth,

            height:
              videoHeight,

            fileName,

            fileSize:
              blob.size,

            mimeType:
              "image/jpeg",

            type:
              "image",

            assetId:
              null,

            file,
          } as unknown as ImagePicker.ImagePickerAsset;

        applySelectedImages(
          [
            asset,
          ],
          selectionMode ===
            "multiple",
        );

        closeWebCamera();
      } catch (
        error
      ) {
        console.error(
          "Error capturando fotografía web:",
          error,
        );

        Alert.alert(
          "Error",
          "No se pudo tomar la fotografía.",
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | ABRIR CÁMARA
  |--------------------------------------------------------------------------
  */

  const takePhoto =
    async () => {
      if (
        selectionMode ===
          "multiple" &&
        images.length >=
          maxImages
      ) {
        Alert.alert(
          "Límite alcanzado",
          `Puedes cargar un máximo de ${maxImages} imágenes.`,
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | WEB
      |--------------------------------------------------------------------------
      */

      if (
        Platform.OS ===
        "web"
      ) {
        await openWebCamera();

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | ANDROID / IOS
      |--------------------------------------------------------------------------
      */

      if (
        cameraOpening
      ) {
        return;
      }

      setCameraOpening(
        true,
      );

      try {
        let permission =
          await ImagePicker.getCameraPermissionsAsync();

        if (
          !permission.granted
        ) {
          permission =
            await ImagePicker.requestCameraPermissionsAsync();
        }

        if (
          !permission.granted
        ) {
          if (
            permission.canAskAgain ===
            false
          ) {
            Alert.alert(
              "Permiso de cámara bloqueado",
              "El acceso a la cámara está deshabilitado. Actívalo desde la configuración del dispositivo.",
              [
                {
                  text:
                    "Cancelar",

                  style:
                    "cancel",
                },
                {
                  text:
                    "Abrir configuración",

                  onPress:
                    openDeviceSettings,
                },
              ],
            );

            return;
          }

          Alert.alert(
            "Permiso necesario",
            "Debes permitir el acceso a la cámara para tomar una fotografía.",
          );

          return;
        }

        const result =
          await ImagePicker.launchCameraAsync(
            {
              mediaTypes: [
                "images",
              ],

              allowsEditing:
                false,

              quality: 1,

              exif: false,
            },
          );

        if (
          result.canceled ||
          !result.assets
            ?.length
        ) {
          return;
        }

        applySelectedImages(
          [
            result.assets[0],
          ],
          selectionMode ===
            "multiple",
        );
      } catch (
        error
      ) {
        console.error(
          "Error abriendo cámara:",
          error,
        );

        Alert.alert(
          "No se pudo abrir la cámara",
          "Comprueba los permisos de cámara del dispositivo e inténtalo nuevamente.",
        );
      } finally {
        setCameraOpening(
          false,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | APAGAR CÁMARA AL CERRAR EL MODAL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      visible
    ) {
      return;
    }

    if (
      Platform.OS ===
      "web"
    ) {
      closeWebCamera();
    }
  }, [
    visible,
    closeWebCamera,
  ]);

  /*
  |--------------------------------------------------------------------------
  | APAGAR CÁMARA AL DESMONTAR
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      if (
        Platform.OS ===
        "web"
      ) {
        stopWebCamera();
      }
    };
  }, [
    stopWebCamera,
  ]);

  /*
  |--------------------------------------------------------------------------
  | RESOLUCIÓN PERSONALIZADA
  |--------------------------------------------------------------------------
  */

  const handleCustomWidth =
    (
      value: string,
    ) => {
      const cleaned =
        value.replace(
          /[^0-9]/g,
          "",
        );

      setCustomWidth(
        cleaned,
      );

      if (
        !lockRatio ||
        !cleaned ||
        croppedDimensions.width <=
          0 ||
        croppedDimensions.height <=
          0
      ) {
        return;
      }

      const ratio =
        croppedDimensions.width /
        croppedDimensions.height;

      const widthValue =
        Number(
          cleaned,
        );

      setCustomHeight(
        String(
          Math.round(
            widthValue /
              ratio,
          ),
        ),
      );
    };

  const handleCustomHeight =
    (
      value: string,
    ) => {
      const cleaned =
        value.replace(
          /[^0-9]/g,
          "",
        );

      setCustomHeight(
        cleaned,
      );

      if (
        !lockRatio ||
        !cleaned ||
        croppedDimensions.width <=
          0 ||
        croppedDimensions.height <=
          0
      ) {
        return;
      }

      const ratio =
        croppedDimensions.width /
        croppedDimensions.height;

      const heightValue =
        Number(
          cleaned,
        );

      setCustomWidth(
        String(
          Math.round(
            heightValue *
              ratio,
          ),
        ),
      );
    };

  /*
  |--------------------------------------------------------------------------
  | ROTACIÓN
  |--------------------------------------------------------------------------
  */

  const rotateLeft =
    () => {
      setRotation(
        (
          current,
        ) =>
          normalizeRotation(
            current - 90,
          ),
      );
    };

  const rotateRight =
    () => {
      setRotation(
        (
          current,
        ) =>
          normalizeRotation(
            current + 90,
          ),
      );
    };

  /*
  |--------------------------------------------------------------------------
  | RESET
  |--------------------------------------------------------------------------
  */

  const resetEditing =
    () => {
      if (!image) {
        return;
      }

      resetEditingForImage(
        image,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | ELIMINAR
  |--------------------------------------------------------------------------
  */

  const removeImageAt =
    (
      index: number,
    ) => {
      ++previewRequestRef.current;

      const next =
        images.filter(
          (
            _,
            currentIndex,
          ) =>
            currentIndex !==
            index,
        );

      setImages(
        next,
      );

      setProcessedPreview(
        null,
      );

      if (
        !next.length
      ) {
        setActiveIndex(
          0,
        );

        return;
      }

      if (
        activeIndex >=
        next.length
      ) {
        setActiveIndex(
          next.length - 1,
        );

        return;
      }

      if (
        index <
        activeIndex
      ) {
        setActiveIndex(
          activeIndex - 1,
        );
      }
    };

  const removeActiveImage =
    () => {
      if (!image) {
        return;
      }

      removeImageAt(
        activeIndex,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CONSTRUIR IMAGEN
  |--------------------------------------------------------------------------
  */

  const buildImage =
    useCallback(
      async (
        asset:
          ImagePicker.ImagePickerAsset,

        applyLimit = true,
      ): Promise<BuiltImage | null> => {
        const dimensions =
          getOutputDimensions(
            asset,
          );

        if (
          dimensions.width <=
            0 ||
          dimensions.height <=
            0
        ) {
          return null;
        }

        const context =
          ImageManipulator.manipulate(
            asset.uri,
          );

        /*
        |--------------------------------------------------------------------------
        | CROP
        |--------------------------------------------------------------------------
        */

        if (
          aspectRatio !==
          "original"
        ) {
          const ratio =
            getAspectValue(
              aspectRatio,
              asset.width,
              asset.height,
            );

          const crop =
            getCenteredCrop(
              asset.width,
              asset.height,
              ratio,
            );

          if (crop) {
            context.crop(
              {
                originX:
                  Math.round(
                    crop.originX,
                  ),

                originY:
                  Math.round(
                    crop.originY,
                  ),

                width:
                  Math.round(
                    crop.width,
                  ),

                height:
                  Math.round(
                    crop.height,
                  ),
              },
            );
          }
        }

        /*
        |--------------------------------------------------------------------------
        | ROTACIÓN
        |--------------------------------------------------------------------------
        */

        const normalized =
          normalizeRotation(
            rotation,
          );

        if (
          normalized !== 0
        ) {
          context.rotate(
            normalized,
          );
        }

        /*
        |--------------------------------------------------------------------------
        | FLIPS
        |--------------------------------------------------------------------------
        */

        if (
          flipHorizontal
        ) {
          context.flip(
            FlipType.Horizontal,
          );
        }

        if (
          flipVertical
        ) {
          context.flip(
            FlipType.Vertical,
          );
        }

        /*
        |--------------------------------------------------------------------------
        | RESIZE
        |--------------------------------------------------------------------------
        */

        context.resize(
          {
            width:
              dimensions.width,

            height:
              dimensions.height,
          },
        );

        const rendered =
          await context.renderAsync();

        /*
        |--------------------------------------------------------------------------
        | CALIDAD INTERNA
        |--------------------------------------------------------------------------
        */

        let appliedQuality =
          format ===
          "png"
            ? 1
            : initialQuality /
              100;

        let result =
          await rendered.saveAsync(
            {
              format:
                getSaveFormat(
                  format,
                ),

              compress:
                appliedQuality,
            },
          );

        let finalSize =
          await getFileSize(
            result.uri,
          );

        /*
        |--------------------------------------------------------------------------
        | PESO MÁXIMO
        |--------------------------------------------------------------------------
        */

        if (
          applyLimit &&
          maxOutputSize !==
            "none" &&
          format !==
            "png"
        ) {
          const maxBytes =
            Number(
              maxOutputSize,
            ) *
            1024 *
            1024;

          while (
            finalSize &&
            finalSize >
              maxBytes &&
            appliedQuality >
              0.35
          ) {
            appliedQuality =
              Math.max(
                0.35,
                appliedQuality -
                  0.08,
              );

            result =
              await rendered.saveAsync(
                {
                  format:
                    getSaveFormat(
                      format,
                    ),

                  compress:
                    appliedQuality,
                },
              );

            finalSize =
              await getFileSize(
                result.uri,
              );
          }
        }

        return {
          result,

          fileSize:
            finalSize,

          quality:
            Math.round(
              appliedQuality *
                100,
            ),

          rotation:
            normalized,
        };
      },
      [
        getOutputDimensions,
        aspectRatio,
        rotation,
        flipHorizontal,
        flipVertical,
        format,
        initialQuality,
        maxOutputSize,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | PREVIEW AUTOMÁTICO
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !image ||
      !visible
    ) {
      setProcessedPreview(
        null,
      );

      return;
    }

    const timer =
      setTimeout(
        async () => {
          const requestId =
            ++previewRequestRef.current;

          setPreviewProcessing(
            true,
          );

          try {
            const built =
              await buildImage(
                image,
                true,
              );

            if (
              requestId !==
              previewRequestRef.current
            ) {
              return;
            }

            if (!built) {
              return;
            }

            setProcessedPreview(
              {
                uri:
                  built.result
                    .uri,

                width:
                  built.result
                    .width,

                height:
                  built.result
                    .height,

                fileSize:
                  built.fileSize,

                quality:
                  built.quality,
              },
            );
          } catch (
            error
          ) {
            console.error(
              "Error generando preview:",
              error,
            );
          } finally {
            if (
              requestId ===
              previewRequestRef.current
            ) {
              setPreviewProcessing(
                false,
              );
            }
          }
        },
        200,
      );

    return () => {
      clearTimeout(
        timer,
      );
    };
  }, [
    image,
    visible,
    buildImage,
  ]);

  /*
  |--------------------------------------------------------------------------
  | GUARDAR
  |--------------------------------------------------------------------------
  */

  const processImages =
    async () => {
      if (
        !images.length
      ) {
        Alert.alert(
          "Selecciona imágenes",
          "Debes seleccionar al menos una imagen.",
        );

        return;
      }

      setProcessing(
        true,
      );

      try {
        const results:
          ImageUploadResult[] =
            [];

        for (
          let index = 0;
          index <
          images.length;
          index++
        ) {
          const asset =
            images[index];

          const built =
            await buildImage(
              asset,
              true,
            );

          if (!built) {
            continue;
          }

          const baseName =
            removeExtension(
              asset.fileName,
            ) ||
            `imagen-${index + 1}`;

          results.push(
            {
              uri:
                built.result
                  .uri,

              width:
                built.result
                  .width,

              height:
                built.result
                  .height,

              format,

              mimeType:
                getMimeType(
                  format,
                ),

              fileName:
                `${baseName}.${getFormatExtension(
                  format,
                )}`,

              fileSize:
                built.fileSize,

              originalUri:
                asset.uri,

              originalWidth:
                asset.width,

              originalHeight:
                asset.height,

              originalFileSize:
                asset.fileSize,

              quality:
                built.quality,

              rotation:
                built.rotation,

              flipHorizontal,

              flipVertical,

              aspectRatio,
            },
          );
        }

        if (
          !results.length
        ) {
          throw new Error(
            "No se pudo procesar ninguna imagen.",
          );
        }

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
          "Error procesando imágenes:",
          error,
        );

        Alert.alert(
          "Error",
          "No se pudieron procesar las imágenes.",
        );
      } finally {
        setProcessing(
          false,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | CERRAR
  |--------------------------------------------------------------------------
  */

  const handleClose =
    () => {
      if (
        processing ||
        cameraOpening ||
        webCameraLoading
      ) {
        return;
      }

      closeWebCamera();

      onClose();
    };

  const previewUri =
    processedPreview?.uri ??
    image?.uri;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <Modal
        visible={visible}
        title={title}
        onClose={handleClose}
        closeOnBackdropPress={
          !processing &&
          !cameraOpening &&
          !webCameraVisible &&
          !webCameraLoading
        }
        width="96%"
        maxWidth={1120}
        footer={
          <View
            style={
              styles.footer
            }
          >
            <Button
              title="Cancelar"
              variant="secondary"
              disabled={
                processing ||
                cameraOpening ||
                webCameraLoading
              }
              onPress={
                handleClose
              }
              style={
                styles.footerButton
              }
            />

            <Button
              title={
                selectionMode ===
                "multiple"
                  ? `Guardar ${images.length} imagen${
                      images.length ===
                      1
                        ? ""
                        : "es"
                    }`
                  : "Guardar imagen"
              }
              loading={
                processing
              }
              disabled={
                !images.length ||
                processing ||
                cameraOpening ||
                webCameraLoading
              }
              onPress={
                processImages
              }
              style={
                styles.footerSaveButton
              }
            />
          </View>
        }
      >
        {/* ===================================================== */}
        {/* BARRA SUPERIOR */}
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
          {/* =================================================== */}
          {/* MODO */}
          {/* =================================================== */}

          {allowModeChange ? (
            <View
              style={
                styles.modeButtons
              }
            >
              <Pressable
                onPress={() =>
                  changeSelectionMode(
                    "single",
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.modeButton,
                  {
                    backgroundColor:
                      selectionMode ===
                      "single"
                        ? c.primary
                        : c.card,

                    borderColor:
                      selectionMode ===
                      "single"
                        ? c.primary
                        : c.border,

                    opacity:
                      pressed
                        ? 0.75
                        : 1,
                  },
                ]}
              >
                <ImagePlus
                  size={17}
                  color={
                    selectionMode ===
                    "single"
                      ? c.primaryForeground
                      : c.textSecondary
                  }
                />

                <ThemedText
                  style={{
                    color:
                      selectionMode ===
                      "single"
                        ? c.primaryForeground
                        : c.text,

                    fontWeight:
                      "700",

                    fontSize: 12,
                  }}
                >
                  Una imagen
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() =>
                  changeSelectionMode(
                    "multiple",
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.modeButton,
                  {
                    backgroundColor:
                      selectionMode ===
                      "multiple"
                        ? c.primary
                        : c.card,

                    borderColor:
                      selectionMode ===
                      "multiple"
                        ? c.primary
                        : c.border,

                    opacity:
                      pressed
                        ? 0.75
                        : 1,
                  },
                ]}
              >
                <Images
                  size={17}
                  color={
                    selectionMode ===
                    "multiple"
                      ? c.primaryForeground
                      : c.textSecondary
                  }
                />

                <ThemedText
                  style={{
                    color:
                      selectionMode ===
                      "multiple"
                        ? c.primaryForeground
                        : c.text,

                    fontWeight:
                      "700",

                    fontSize: 12,
                  }}
                >
                  Varias imágenes
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <View />
          )}

          {/* =================================================== */}
          {/* ACCIONES */}
          {/* =================================================== */}

          <View
            style={
              styles.uploadActions
            }
          >
            <UploadActionButton
              icon={
                Upload
              }
              title={
                selectionMode ===
                "multiple"
                  ? images.length
                    ? "Agregar"
                    : "Subir imágenes"
                  : images.length
                    ? "Cambiar"
                    : "Subir imagen"
              }
              disabled={
                processing ||
                cameraOpening ||
                webCameraLoading
              }
              onPress={() =>
                pickImages(
                  selectionMode ===
                    "multiple" &&
                    images.length >
                      0,
                )
              }
            />

            {allowCamera ? (
              <UploadActionButton
                type="secondary"
                icon={
                  Camera
                }
                title={
                  cameraOpening ||
                  webCameraLoading
                    ? "Abriendo..."
                    : "Cámara"
                }
                disabled={
                  processing ||
                  cameraOpening ||
                  webCameraLoading
                }
                onPress={
                  takePhoto
                }
              />
            ) : null}
          </View>
        </View>

        {/* ===================================================== */}
        {/* CONTENIDO */}
        {/* ===================================================== */}

        <ScrollView
          style={{
            maxHeight:
              bodyMaxHeight,
          }}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.layout,
              isCompact &&
                styles.layoutCompact,
            ]}
          >
            {/* ================================================= */}
            {/* IZQUIERDA */}
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
                {!image ? (
                  <View
                    style={[
                      styles.emptyPreview,
                      {
                        minHeight:
                          previewHeight,

                        backgroundColor:
                          c.backgroundSecondary,

                        borderColor:
                          c.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.emptyIcon,
                        {
                          backgroundColor:
                            c.primarySubtle,
                        },
                      ]}
                    >
                      {selectionMode ===
                      "multiple" ? (
                        <Images
                          size={36}
                          color={
                            c.primary
                          }
                        />
                      ) : (
                        <ImagePlus
                          size={36}
                          color={
                            c.primary
                          }
                        />
                      )}
                    </View>

                    <ThemedText
                      style={
                        styles.emptyTitle
                      }
                    >
                      {selectionMode ===
                      "multiple"
                        ? "Selecciona imágenes"
                        : "Selecciona una imagen"}
                    </ThemedText>

                    <ThemedText
                      style={[
                        styles.emptyDescription,
                        {
                          color:
                            c.textSecondary,
                        },
                      ]}
                    >
                      {selectionMode ===
                      "multiple"
                        ? `Puedes seleccionar imágenes o tomar fotografías hasta un máximo de ${maxImages}.`
                        : "Selecciona una imagen existente o abre la cámara del dispositivo."}
                    </ThemedText>

                    <View
                      style={
                        styles.emptyButtons
                      }
                    >
                      <UploadActionButton
                        icon={
                          Upload
                        }
                        title={
                          selectionMode ===
                          "multiple"
                            ? "Seleccionar imágenes"
                            : "Seleccionar imagen"
                        }
                        disabled={
                          cameraOpening ||
                          webCameraLoading
                        }
                        onPress={() =>
                          pickImages(
                            false,
                          )
                        }
                      />

                      {allowCamera ? (
                        <UploadActionButton
                          type="secondary"
                          icon={
                            Camera
                          }
                          title={
                            cameraOpening ||
                            webCameraLoading
                              ? "Abriendo..."
                              : "Abrir cámara"
                          }
                          disabled={
                            cameraOpening ||
                            webCameraLoading
                          }
                          onPress={
                            takePhoto
                          }
                        />
                      ) : null}
                    </View>
                  </View>
                ) : (
                  <>
                    {/* =========================================== */}
                    {/* PREVIEW */}
                    {/* =========================================== */}

                    {/* =========================================== */}
                    {/* INFORMACIÓN DEL PREVIEW */}
                    {/* =========================================== */}

                    <View
                      style={
                        styles.previewMetaRow
                      }
                    >
                      <Badge
                        label={
                          format.toUpperCase()
                        }
                        variant="info"
                      />

                      <Badge
                        label={`${processedPreview?.width ?? outputDimensions.width} × ${
                          processedPreview?.height ??
                          outputDimensions.height
                        }`}
                        variant="muted"
                      />
                    </View>

                    <View
                      style={[
                        styles.previewArea,
                        {
                          height:
                            previewHeight,

                          backgroundColor:
                            c.backgroundSecondary,

                          borderColor:
                            c.border,
                        },
                      ]}
                    >
                      {previewUri ? (
                        <Image
                          source={{
                            uri:
                              previewUri,
                          }}
                          resizeMode="contain"
                          style={
                            styles.previewImage
                          }
                        />
                      ) : null}

                      {previewProcessing ? (
                        <View
                          style={
                            styles.previewLoading
                          }
                        >
                          <ActivityIndicator
                            size="large"
                            color={
                              c.primary
                            }
                          />

                          <ThemedText
                            style={
                              styles.previewLoadingText
                            }
                          >
                            Actualizando...
                          </ThemedText>
                        </View>
                      ) : null}
                    </View>

                    {/* =========================================== */}
                    {/* GALERÍA */}
                    {/* =========================================== */}

                    {selectionMode ===
                      "multiple" &&
                    images.length >
                      0 ? (
                      <View
                        style={
                          styles.gallery
                        }
                      >
                        <View
                          style={
                            styles.galleryHeader
                          }
                        >
                          <ThemedText
                            style={
                              styles.galleryTitle
                            }
                          >
                            Imágenes
                          </ThemedText>

                          <Badge
                            label={`${images.length} / ${maxImages}`}
                            variant={
                              images.length >=
                              maxImages
                                ? "warning"
                                : "info"
                            }
                          />
                        </View>

                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={
                            false
                          }
                          contentContainerStyle={
                            styles.thumbnailList
                          }
                        >
                          {images.map(
                            (
                              asset,
                              index,
                            ) => {
                              const selected =
                                index ===
                                activeIndex;

                              return (
                                <Pressable
                                  key={`${asset.uri}-${index}`}
                                  onPress={() => {
                                    setActiveIndex(
                                      index,
                                    );

                                    setProcessedPreview(
                                      null,
                                    );
                                  }}
                                  style={[
                                    styles.thumbnailItem,
                                    {
                                      borderColor:
                                        selected
                                          ? c.primary
                                          : c.border,
                                    },
                                  ]}
                                >
                                  <Image
                                    source={{
                                      uri:
                                        asset.uri,
                                    }}
                                    resizeMode="cover"
                                    style={
                                      styles.thumbnailImage
                                    }
                                  />

                                  {selected ? (
                                    <View
                                      style={[
                                        styles.thumbnailNumber,
                                        {
                                          backgroundColor:
                                            c.primary,
                                        },
                                      ]}
                                    >
                                      <ThemedText
                                        style={{
                                          color:
                                            c.primaryForeground,

                                          fontSize: 9,

                                          fontWeight:
                                            "800",
                                        }}
                                      >
                                        {index +
                                          1}
                                      </ThemedText>
                                    </View>
                                  ) : null}

                                  <Pressable
                                    onPress={(
                                      event,
                                    ) => {
                                      event.stopPropagation();

                                      removeImageAt(
                                        index,
                                      );
                                    }}
                                    style={[
                                      styles.thumbnailDelete,
                                      {
                                        backgroundColor:
                                          c.destructive,
                                      },
                                    ]}
                                  >
                                    <X
                                      size={12}
                                      strokeWidth={3}
                                      color={
                                        c.destructiveForeground
                                      }
                                    />
                                  </Pressable>
                                </Pressable>
                              );
                            },
                          )}

                          {images.length <
                          maxImages ? (
                            <Pressable
                              onPress={() =>
                                pickImages(
                                  true,
                                )
                              }
                              style={[
                                styles.addThumbnail,
                                {
                                  backgroundColor:
                                    c.backgroundSecondary,

                                  borderColor:
                                    c.border,
                                },
                              ]}
                            >
                              <ImagePlus
                                size={20}
                                color={
                                  c.primary
                                }
                              />

                              <ThemedText
                                style={{
                                  fontSize: 9,
                                  color:
                                    c.textSecondary,
                                }}
                              >
                                Agregar
                              </ThemedText>
                            </Pressable>
                          ) : null}

                          {allowCamera &&
                          images.length <
                            maxImages ? (
                            <Pressable
                              disabled={
                                cameraOpening ||
                                webCameraLoading
                              }
                              onPress={
                                takePhoto
                              }
                              style={[
                                styles.addThumbnail,
                                {
                                  backgroundColor:
                                    c.backgroundSecondary,

                                  borderColor:
                                    c.border,

                                  opacity:
                                    cameraOpening ||
                                    webCameraLoading
                                      ? 0.5
                                      : 1,
                                },
                              ]}
                            >
                              <Camera
                                size={20}
                                color={
                                  c.primary
                                }
                              />

                              <ThemedText
                                style={{
                                  fontSize: 9,
                                  color:
                                    c.textSecondary,
                                }}
                              >
                                Cámara
                              </ThemedText>
                            </Pressable>
                          ) : null}
                        </ScrollView>
                      </View>
                    ) : null}

                    {/* =========================================== */}
                    {/* TOOLBAR */}
                    {/* =========================================== */}

                    <View
                      style={[
                        styles.toolbar,
                        {
                          backgroundColor:
                            c.backgroundSecondary,

                          borderColor:
                            c.border,
                        },
                      ]}
                    >
                      <IconButton
                        icon={
                          RotateCcw
                        }
                        size="sm"
                        variant="secondary"
                        accessibilityLabel="Rotar izquierda"
                        onPress={
                          rotateLeft
                        }
                      />

                      <IconButton
                        icon={
                          RotateCw
                        }
                        size="sm"
                        variant="secondary"
                        accessibilityLabel="Rotar derecha"
                        onPress={
                          rotateRight
                        }
                      />

                      <View
                        style={[
                          styles.toolbarDivider,
                          {
                            backgroundColor:
                              c.border,
                          },
                        ]}
                      />

                      <IconButton
                        icon={
                          FlipHorizontal2
                        }
                        size="sm"
                        variant={
                          flipHorizontal
                            ? "primary"
                            : "secondary"
                        }
                        accessibilityLabel="Voltear horizontal"
                        onPress={() =>
                          setFlipHorizontal(
                            (
                              current,
                            ) =>
                              !current,
                          )
                        }
                      />

                      <IconButton
                        icon={
                          FlipVertical2
                        }
                        size="sm"
                        variant={
                          flipVertical
                            ? "primary"
                            : "secondary"
                        }
                        accessibilityLabel="Voltear vertical"
                        onPress={() =>
                          setFlipVertical(
                            (
                              current,
                            ) =>
                              !current,
                          )
                        }
                      />

                      <View
                        style={[
                          styles.toolbarDivider,
                          {
                            backgroundColor:
                              c.border,
                          },
                        ]}
                      />

                      <IconButton
                        icon={
                          Undo2
                        }
                        size="sm"
                        variant="secondary"
                        accessibilityLabel="Restablecer"
                        onPress={
                          resetEditing
                        }
                      />

                      <IconButton
                        icon={
                          Trash2
                        }
                        size="sm"
                        variant="destructive"
                        accessibilityLabel="Eliminar"
                        onPress={
                          removeActiveImage
                        }
                      />
                    </View>

                    <Divider
                      spacing={7}
                    />

                    <View
                      style={
                        styles.infoGrid
                      }
                    >
                      <InfoItem
                        label="Archivo"
                        value={
                          image.fileName ??
                          "Fotografía"
                        }
                      />

                      <InfoItem
                        label="Original"
                        value={`${image.width} × ${image.height} px`}
                      />

                      <InfoItem
                        label="Peso"
                        value={formatBytes(
                          image.fileSize,
                        )}
                      />

                      <InfoItem
                        label="Origen"
                        value={
                          image.fileName
                            ? "Archivo / cámara"
                            : "Cámara"
                        }
                      />
                    </View>
                  </>
                )}
              </Card>
            </View>

            {/* ================================================= */}
            {/* DERECHA */}
            {/* ================================================= */}

            <View
              style={[
                styles.settingsColumn,
                isCompact &&
                  styles.fullWidth,
              ]}
            >
              <Card
                style={
                  styles.settingsCard
                }
              >
                <View>
                  <ThemedText
                    style={
                      styles.settingsTitle
                    }
                  >
                    Configuración
                  </ThemedText>

                  <ThemedText
                    style={[
                      styles.settingsDescription,
                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    {selectionMode ===
                    "multiple"
                      ? "Los ajustes se aplicarán a todas las imágenes."
                      : "Los cambios se reflejan automáticamente."}
                  </ThemedText>
                </View>

                <Divider
                  spacing={8}
                />

                <Select<ImageOutputFormat>
                  label="Formato"
                  value={
                    format
                  }
                  options={
                    FORMAT_OPTIONS
                  }
                  onValueChange={
                    setFormat
                  }
                  disabled={
                    !image
                  }
                  modalTitle="Formato de salida"
                />

                <Select<ImageAspectRatio>
                  label="Relación de aspecto"
                  value={
                    aspectRatio
                  }
                  options={
                    ASPECT_OPTIONS
                  }
                  onValueChange={
                    setAspectRatio
                  }
                  disabled={
                    !image
                  }
                  helperText={
                    aspectRatio ===
                    "original"
                      ? "Se conserva el encuadre original."
                      : "El recorte se realiza desde el centro."
                  }
                  modalTitle="Relación de aspecto"
                />

                <Select<ImageResolutionPreset>
                  label="Resolución"
                  value={
                    resolution
                  }
                  options={
                    RESOLUTION_OPTIONS
                  }
                  onValueChange={(
                    value,
                  ) => {
                    setResolution(
                      value,
                    );

                    if (
                      value ===
                        "custom" &&
                      image
                    ) {
                      setCustomWidth(
                        String(
                          croppedDimensions.width,
                        ),
                      );

                      setCustomHeight(
                        String(
                          croppedDimensions.height,
                        ),
                      );
                    }
                  }}
                  disabled={
                    !image
                  }
                  modalTitle="Resolución de salida"
                />

                {resolution ===
                "custom" ? (
                  <>
                    <View
                      style={
                        styles.customResolution
                      }
                    >
                      <View
                        style={
                          styles.customInput
                        }
                      >
                        <Input
                          label="Ancho"
                          value={
                            customWidth
                          }
                          placeholder="1920"
                          keyboardType="numeric"
                          onChangeText={
                            handleCustomWidth
                          }
                        />
                      </View>

                      <ThemedText
                        style={[
                          styles.dimensionX,
                          {
                            color:
                              c.textSecondary,
                          },
                        ]}
                      >
                        ×
                      </ThemedText>

                      <View
                        style={
                          styles.customInput
                        }
                      >
                        <Input
                          label="Alto"
                          value={
                            customHeight
                          }
                          placeholder="1080"
                          keyboardType="numeric"
                          onChangeText={
                            handleCustomHeight
                          }
                        />
                      </View>
                    </View>

                    <Switch
                      label="Mantener proporción"
                      value={
                        lockRatio
                      }
                      onValueChange={
                        setLockRatio
                      }
                    />
                  </>
                ) : null}

                <Divider
                  label="Optimización"
                  labelPosition="start"
                  spacing={8}
                />

                <Select<string>
                  label="Peso máximo"
                  value={
                    maxOutputSize
                  }
                  options={
                    SIZE_LIMIT_OPTIONS
                  }
                  onValueChange={
                    setMaxOutputSize
                  }
                  disabled={
                    !image
                  }
                  helperText="WEBP y JPEG se comprimirán automáticamente si es necesario."
                  modalTitle="Peso máximo"
                />

                <Divider
                  label="Resultado"
                  labelPosition="start"
                  spacing={8}
                />

                <View
                  style={[
                    styles.resultBox,
                    {
                      backgroundColor:
                        c.backgroundSecondary,

                      borderColor:
                        c.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.resultIcon,
                      {
                        backgroundColor:
                          c.primarySubtle,
                      },
                    ]}
                  >
                    <Upload
                      size={19}
                      color={
                        c.primary
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.resultContent
                    }
                  >
                    <ThemedText
                      style={
                        styles.resultTitle
                      }
                    >
                      {selectionMode ===
                      "multiple"
                        ? `${images.length} imágenes`
                        : "Imagen de salida"}
                    </ThemedText>

                    {image ? (
                      <>
                        <ThemedText
                          style={[
                            styles.resultText,
                            {
                              color:
                                c.textSecondary,
                            },
                          ]}
                        >
                          {processedPreview?.width ??
                            outputDimensions.width}{" "}
                          ×{" "}
                          {processedPreview?.height ??
                            outputDimensions.height}{" "}
                          px
                        </ThemedText>

                        <ThemedText
                          style={[
                            styles.resultText,
                            {
                              color:
                                c.textSecondary,
                            },
                          ]}
                        >
                          {format.toUpperCase()}
                          {" • "}
                          {formatBytes(
                            processedPreview?.fileSize,
                          )}
                        </ThemedText>
                      </>
                    ) : (
                      <ThemedText
                        style={[
                          styles.resultText,
                          {
                            color:
                              c.textMuted,
                          },
                        ]}
                      >
                        Sin imagen seleccionada.
                      </ThemedText>
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.note,
                    {
                      backgroundColor:
                        c.primarySubtle,

                      borderColor:
                        c.primary,
                    },
                  ]}
                >
                  <Camera
                    size={17}
                    color={
                      c.primary
                    }
                  />

                  <ThemedText
                    style={[
                      styles.noteText,
                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    En Android/iOS se abre la
                    cámara del dispositivo. En
                    Web se abre una cámara en
                    vivo usando la webcam o la
                    cámara disponible del equipo.
                  </ThemedText>
                </View>
              </Card>
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* ===================================================== */}
      {/* CÁMARA WEB REAL */}
      {/* ===================================================== */}

      {Platform.OS ===
      "web" ? (
        <NativeModal
          visible={
            webCameraVisible
          }
          transparent
          animationType="fade"
          onRequestClose={
            closeWebCamera
          }
        >
          <View
            style={
              styles.webCameraBackdrop
            }
          >
            <View
              style={[
                styles.webCameraPanel,
                {
                  backgroundColor:
                    c.card,

                  borderColor:
                    c.border,
                },
              ]}
            >
              {/* HEADER */}

              <View
                style={
                  styles.webCameraHeader
                }
              >
                <View
                  style={
                    styles.webCameraHeaderText
                  }
                >
                  <ThemedText
                    style={
                      styles.webCameraTitle
                    }
                  >
                    Cámara
                  </ThemedText>

                  <ThemedText
                    style={[
                      styles.webCameraSubtitle,
                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    Toma una fotografía usando
                    la cámara del dispositivo.
                  </ThemedText>
                </View>

                <IconButton
                  icon={
                    X
                  }
                  variant="ghost"
                  accessibilityLabel="Cerrar cámara"
                  onPress={
                    closeWebCamera
                  }
                />
              </View>

              {/* VIDEO */}

              <View
                style={[
                  styles.webCameraVideoContainer,
                  {
                    backgroundColor:
                      "#000000",

                    borderColor:
                      c.border,
                  },
                ]}
              >
                {React.createElement(
                  "video" as any,
                  {
                    ref: (
                      element:
                        any,
                    ) => {
                      webVideoRef.current =
                        element;
                    },

                    autoPlay: true,
                    muted: true,
                    playsInline: true,

                    onCanPlay: () => {
                      setWebCameraReady(
                        true,
                      );
                    },

                    style: {
                      width:
                        "100%",

                      height:
                        "100%",

                      objectFit:
                        "cover",

                      display:
                        "block",

                      backgroundColor:
                        "#000000",
                    },
                  },
                )}

                {!webCameraReady ? (
                  <View
                    style={
                      styles.webCameraLoading
                    }
                  >
                    <ActivityIndicator
                      size="large"
                      color="#FFFFFF"
                    />

                    <ThemedText
                      style={
                        styles.webCameraLoadingText
                      }
                    >
                      Iniciando cámara...
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              {/* FOOTER */}

              <View
                style={
                  styles.webCameraFooter
                }
              >
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={
                    closeWebCamera
                  }
                />

                <View
                  style={
                    styles.captureArea
                  }
                >
                  <Pressable
                    disabled={
                      !webCameraReady
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Tomar fotografía"
                    onPress={
                      captureWebPhoto
                    }
                    style={[
                      styles.captureButton,
                      {
                        borderColor:
                          "#FFFFFF",

                        opacity:
                          webCameraReady
                            ? 1
                            : 0.5,
                      },
                    ]}
                  >
                    <View
                      style={
                        styles.captureButtonInner
                      }
                    />
                  </Pressable>

                  <ThemedText
                    style={[
                      styles.captureLabel,
                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    Tomar foto
                  </ThemedText>
                </View>

                <View
                  style={
                    styles.webCameraFooterSpacer
                  }
                />
              </View>
            </View>
          </View>
        </NativeModal>
      ) : null}
    </>
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

    uploadActions: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },

    /*
    |--------------------------------------------------------------------------
    | BOTÓN UPLOAD
    |--------------------------------------------------------------------------
    */

    uploadActionButton: {
      minHeight: 40,
      minWidth: 115,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 8,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderRadius: 9,
    },

    uploadActionText: {
      fontSize: 12,
      fontWeight: "800",
    },

    /*
    |--------------------------------------------------------------------------
    | SCROLL
    |--------------------------------------------------------------------------
    */

    scrollContent: {
      paddingBottom: 4,
    },

    /*
    |--------------------------------------------------------------------------
    | LAYOUT
    |--------------------------------------------------------------------------
    */

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

    previewColumn: {
      width: "52%",
    },

    settingsColumn: {
      width: "48%",
      flexShrink: 1,
    },

    /*
    |--------------------------------------------------------------------------
    | PREVIEW CARD
    |--------------------------------------------------------------------------
    */

    previewCard: {
      width: "100%",
      gap: 11,
    },

    /*
    |--------------------------------------------------------------------------
    | EMPTY
    |--------------------------------------------------------------------------
    */

    emptyPreview: {
      width: "100%",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 8,
      padding: 20,
      borderWidth: 1,
      borderRadius: 12,
    },

    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 18,
      alignItems: "center",
      justifyContent:
        "center",
    },

    emptyTitle: {
      fontSize: 16,
      fontWeight: "800",
      textAlign: "center",
    },

    emptyDescription: {
      maxWidth: 360,
      fontSize: 11,
      lineHeight: 16,
      textAlign: "center",
    },

    emptyButtons: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      flexWrap: "wrap",
      gap: 8,
    },

    /*
    |--------------------------------------------------------------------------
    | PREVIEW
    |--------------------------------------------------------------------------
    */

    previewArea: {
      width: "100%",
      position: "relative",
      overflow: "hidden",
      alignItems: "center",
      justifyContent:
        "center",
      borderWidth: 1,
      borderRadius: 12,
    },

    previewImage: {
      width: "100%",
      height: "100%",
    },

    previewLoading: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.42)",
      alignItems: "center",
      justifyContent:
        "center",
      zIndex: 20,
    },

    previewLoadingText: {
      marginTop: 8,
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },

    previewMetaRow: {
      width: "100%",
      minHeight: 28,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: 6,
      paddingHorizontal: 2,
      marginBottom: 2,
    },

    /*
    |--------------------------------------------------------------------------
    | GALERÍA
    |--------------------------------------------------------------------------
    */

    gallery: {
      width: "100%",
      gap: 7,
    },

    galleryHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    galleryTitle: {
      fontSize: 12,
      fontWeight: "800",
    },

    thumbnailList: {
      alignItems: "center",
      gap: 8,
      paddingRight: 4,
    },

    thumbnailItem: {
      width: 68,
      height: 68,
      position: "relative",
      overflow: "hidden",
      borderWidth: 2,
      borderRadius: 10,
    },

    thumbnailImage: {
      width: "100%",
      height: "100%",
    },

    thumbnailNumber: {
      position: "absolute",
      left: 4,
      bottom: 4,
      width: 19,
      height: 19,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 6,
    },

    thumbnailDelete: {
      position: "absolute",
      top: 3,
      right: 3,
      width: 20,
      height: 20,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 6,
    },

    addThumbnail: {
      width: 68,
      height: 68,
      alignItems: "center",
      justifyContent:
        "center",
      gap: 3,
      borderWidth: 1,
      borderStyle: "dashed",
      borderRadius: 10,
    },

    /*
    |--------------------------------------------------------------------------
    | TOOLBAR
    |--------------------------------------------------------------------------
    */

    toolbar: {
      width: "100%",
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      flexWrap: "wrap",
      gap: 7,
      padding: 7,
      borderWidth: 1,
      borderRadius: 11,
    },

    toolbarDivider: {
      width: 1,
      height: 25,
      marginHorizontal: 2,
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
      minWidth: 125,
      flexGrow: 1,
      gap: 2,
    },

    infoLabel: {
      fontSize: 10,
      fontWeight: "600",
    },

    infoValue: {
      fontSize: 12,
      fontWeight: "700",
    },

    /*
    |--------------------------------------------------------------------------
    | SETTINGS
    |--------------------------------------------------------------------------
    */

    settingsCard: {
      width: "100%",
      gap: 11,
    },

    settingsTitle: {
      fontSize: 16,
      fontWeight: "800",
    },

    settingsDescription: {
      marginTop: 2,
      fontSize: 11,
      lineHeight: 16,
    },

    /*
    |--------------------------------------------------------------------------
    | CUSTOM RESOLUTION
    |--------------------------------------------------------------------------
    */

    customResolution: {
      width: "100%",
      flexDirection: "row",
      alignItems:
        "flex-end",
      gap: 8,
    },

    customInput: {
      flex: 1,
    },

    dimensionX: {
      paddingBottom: 15,
      fontSize: 17,
      fontWeight: "700",
    },

    /*
    |--------------------------------------------------------------------------
    | RESULTADO
    |--------------------------------------------------------------------------
    */

    resultBox: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 11,
      borderWidth: 1,
      borderRadius: 10,
    },

    resultIcon: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 9,
    },

    resultContent: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },

    resultTitle: {
      fontSize: 13,
      fontWeight: "800",
    },

    resultText: {
      fontSize: 11,
      lineHeight: 16,
    },

    /*
    |--------------------------------------------------------------------------
    | NOTE
    |--------------------------------------------------------------------------
    */

    note: {
      width: "100%",
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 8,
      padding: 9,
      borderWidth: 1,
      borderRadius: 9,
    },

    noteText: {
      flex: 1,
      fontSize: 10,
      lineHeight: 15,
    },

    /*
    |--------------------------------------------------------------------------
    | FOOTER PRINCIPAL
    |--------------------------------------------------------------------------
    */

    footer: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "flex-end",
      flexWrap: "wrap",
      gap: 9,
    },

    footerButton: {
      minWidth: 125,
    },

    footerSaveButton: {
      minWidth: 160,
    },

    /*
    |--------------------------------------------------------------------------
    | CÁMARA WEB
    |--------------------------------------------------------------------------
    */

    webCameraBackdrop: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.84)",
      alignItems: "center",
      justifyContent:
        "center",
      padding: 20,
    },

    webCameraPanel: {
      width: "100%",
      maxWidth: 900,
      maxHeight: "95%",
      borderWidth: 1,
      borderRadius: 18,
      overflow: "hidden",
    },

    webCameraHeader: {
      minHeight: 70,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 15,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },

    webCameraHeaderText: {
      flex: 1,
      minWidth: 0,
    },

    webCameraTitle: {
      fontSize: 18,
      fontWeight: "800",
    },

    webCameraSubtitle: {
      marginTop: 2,
      fontSize: 11,
      lineHeight: 16,
    },

    webCameraVideoContainer: {
      width: "100%",
      aspectRatio: 16 / 9,
      position: "relative",
      overflow: "hidden",
      borderTopWidth: 1,
      borderBottomWidth: 1,
    },

    webCameraLoading: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.65)",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 10,
    },

    webCameraLoadingText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
    },

    webCameraFooter: {
      minHeight: 100,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 20,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },

    captureArea: {
      alignItems: "center",
      justifyContent:
        "center",
      gap: 5,
    },

    captureButton: {
      width: 64,
      height: 64,
      alignItems: "center",
      justifyContent:
        "center",
      borderWidth: 4,
      borderRadius: 32,
      backgroundColor:
        "rgba(255,255,255,0.10)",
    },

    captureButtonInner: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor:
        "#FFFFFF",
    },

    captureLabel: {
      fontSize: 10,
      fontWeight: "700",
    },

    webCameraFooterSpacer: {
      width: 90,
    },
  });

export default ImageUploadModal;
