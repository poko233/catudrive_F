// screens/recursosHumanos/components/UsuarioEditModal.tsx

import DatePickerModal from "@/components/DatePickerModal";
import {
  ImageUploadModal,
  ImageUploadResult,
} from "@/components/ImageUploadModal";
import { ThemedText } from "@/components/ThemedText";
import Visibility from "@/components/Visibility";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ProfilePhotoState } from "@/components/ui/ProfilePhotoState";
import { QrState } from "@/components/ui/QrState";
import {
  Select,
  SelectOption,
} from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Switch } from "@/components/ui/Switch";
import { TabBar } from "@/components/ui/TabBar";
import { useTheme } from "@/theme/useTheme";

import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  useEffect,
  useState,
} from "react";

import Toast from "react-native-toast-message";

import {
  FotoUsuarioArchivo,
  UsuarioFormRRHH,
  UsuarioRRHH,
} from "../types/recursosHumanos.types";

type TabKey =
  | "datos"
  | "media";

type Props = {
  visible: boolean;
  usuario: UsuarioRRHH | null;
  guardando: boolean;
  cargandoDetalle?: boolean;

  onClose: () => void;

  onSave: (
    id: number,
    form: UsuarioFormRRHH,
  ) => Promise<UsuarioRRHH | null>;

  onFotoActualizada?: (
    id: number,
    archivo: FotoUsuarioArchivo,
  ) => Promise<void> | void;
};

const EMPTY_FORM: UsuarioFormRRHH = {
  usuario: "",
  ci: "",
  nombres: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  genero: "MASCULINO",
  fecha_nac: "",
  email: "",
  telefono: "",
  celular: "",
  direccion: "",
  expedido: "CBBA",
  estado: "ACTIVO",
};

const tabs = [
  {
    key: "datos",
    label: "Datos",
  },
  {
    key: "media",
    label: "QR y foto",
  },
];

const generos: SelectOption<
  UsuarioFormRRHH["genero"]
>[] = [
  {
    label: "Masculino",
    value: "MASCULINO",
  },
  {
    label: "Femenino",
    value: "FEMENINO",
  },
];

const expedidos: SelectOption<string>[] = [
  "LPZ",
  "CBBA",
  "OR",
  "PT",
  "TJ",
  "SCZ",
  "BN",
  "PD",
  "CH",
  "QR",
  "EXT",
].map((value) => ({
  label: value,
  value,
}));

const textoFields = [
  ["usuario", "Usuario"],
  ["ci", "CI"],
  ["nombres", "Nombres"],
  [
    "apellidoPaterno",
    "Apellido paterno",
  ],
  [
    "apellidoMaterno",
    "Apellido materno",
  ],
  [
    "email",
    "Correo electrónico",
  ],
  ["telefono", "Teléfono"],
  ["celular", "Celular"],
  ["direccion", "Dirección"],
] as const;

function usuarioAForm(
  usuario: UsuarioRRHH,
): UsuarioFormRRHH {
  return {
    ...EMPTY_FORM,

    usuario:
      usuario.usuario || "",

    ci:
      usuario.ci || "",

    nombres:
      usuario.nombres || "",

    apellidoPaterno:
      usuario.apellidoPaterno || "",

    apellidoMaterno:
      usuario.apellidoMaterno || "",

    genero:
      usuario.genero === "FEMENINO" ||
      usuario.genero === "MASCULINO"
        ? usuario.genero
        : "MASCULINO",

    fecha_nac:
      usuario.fecha_nac
        ? String(
            usuario.fecha_nac,
          ).slice(0, 10)
        : "",

    email:
      usuario.email || "",

    telefono:
      usuario.telefono || "",

    celular:
      usuario.celular || "",

    direccion:
      usuario.direccion || "",

    expedido:
      usuario.expedido || "CBBA",

    estado:
      usuario.estado === "INACTIVO"
        ? "INACTIVO"
        : "ACTIVO",
  };
}

const nombreCompleto = (
  usuario: UsuarioRRHH | null,
) =>
  usuario
    ? [
        usuario.nombres,
        usuario.apellidoPaterno,
        usuario.apellidoMaterno,
      ]
        .filter(Boolean)
        .join(" ")
    : "Usuario";

const hoy = () =>
  new Date()
    .toISOString()
    .slice(0, 10);

export default function UsuarioEditModal({
  visible,
  usuario,
  guardando,
  cargandoDetalle = false,
  onClose,
  onSave,
  onFotoActualizada,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [tab, setTab] =
    useState<TabKey>("datos");

  const [form, setForm] =
    useState<UsuarioFormRRHH>(
      EMPTY_FORM,
    );

  const [dateOpen, setDateOpen] =
    useState(false);

  const [imageOpen, setImageOpen] =
    useState(false);

  const [
    subiendoFoto,
    setSubiendoFoto,
  ] = useState(false);

  useEffect(() => {
    if (!usuario) {
      return;
    }

    setTab("datos");

    setForm(
      usuarioAForm(usuario),
    );
  }, [usuario]);

  const setValue = <
    K extends keyof UsuarioFormRRHH,
  >(
    key: K,
    value: UsuarioFormRRHH[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const guardar = async () => {
    if (
      !usuario ||
      guardando
    ) {
      return;
    }

    const actualizado =
      await onSave(
        usuario.id,
        form,
      );

    if (actualizado) {
      onClose();
    }
  };

  const abrirUrl = async (
    url?: string | null,
  ) => {
    if (!url) {
      return;
    }

    if (
      Platform.OS === "web"
    ) {
      (
        globalThis as any
      ).window?.open(
        url,
        "_blank",
        "noopener,noreferrer",
      );

      return;
    }

    if (
      await Linking.canOpenURL(
        url,
      )
    ) {
      await Linking.openURL(
        url,
      );
    }
  };

  const guardarFoto = async (
    result:
      | ImageUploadResult
      | ImageUploadResult[],
  ) => {
    if (
      !usuario ||
      !onFotoActualizada
    ) {
      return;
    }

    const image =
      Array.isArray(result)
        ? result[0]
        : result;

    if (!image) {
      return;
    }

    setSubiendoFoto(true);

    try {
      await onFotoActualizada(
        usuario.id,
        {
          uri: image.uri,
          name: image.fileName,
          type: image.mimeType,
        },
      );

      setImageOpen(false);

      Toast.show({
        type: "success",
        text1: "Foto actualizada",
      });
    } catch (error) {
      console.error(
        "Error actualizando foto:",
        error,
      );

      Toast.show({
        type: "error",
        text1:
          "No se pudo actualizar la foto",
      });
    } finally {
      setSubiendoFoto(false);
    }
  };

  const footer = (
    <View style={styles.footer}>
      <Button
        title="Cancelar"
        variant="secondary"
        onPress={onClose}
        disabled={
          guardando ||
          subiendoFoto
        }
      />

      {tab === "datos" ? (
        <Visibility
          action="Editar"
          selector=".rrhh-guardar-usuario"
        >
          <Button
            title="Guardar cambios"
            loading={guardando}
            disabled={
              guardando ||
              subiendoFoto
            }
            onPress={guardar}
          />
        </Visibility>
      ) : null}
    </View>
  );

  return (
    <>
      <Modal
        visible={visible}
        title={nombreCompleto(
          usuario,
        )}
        onClose={onClose}
        closeOnBackdropPress={
          !guardando &&
          !subiendoFoto
        }
        width="96%"
        maxWidth={980}
        footer={footer}
      >
        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.content
          }
        >
          <View style={styles.meta}>
            {usuario?.roles?.map(
              (rol) => (
                <Badge
                  key={
                    rol.idRol ??
                    rol.id ??
                    rol.rol
                  }
                  label={rol.rol}
                  variant="info"
                />
              ),
            )}

            <Badge
              label={form.estado}
              variant={
                form.estado ===
                "ACTIVO"
                  ? "success"
                  : "destructive"
              }
            />
          </View>

          <TabBar
            tabs={tabs}
            activeTab={tab}
            onTabChange={(
              value,
            ) =>
              setTab(
                value as TabKey,
              )
            }
          />

          {cargandoDetalle ? (
            <Card
              style={
                styles.loading
              }
            >
              <Skeleton
                width="100%"
                height={46}
              />

              <Skeleton
                width="100%"
                height={46}
              />

              <Skeleton
                width="70%"
                height={46}
              />
            </Card>
          ) : tab === "datos" ? (
            <Visibility
              action="Editar"
              selector=".rrhh-datos-usuario"
            >
              <Card>
                <View
                  style={
                    styles.grid
                  }
                >
                  {textoFields.map(
                    ([
                      key,
                      label,
                    ]) => (
                      <View
                        key={key}
                        style={[
                          styles.field,

                          key ===
                            "direccion" &&
                            styles.wide,
                        ]}
                      >
                        <Input
                          label={label}
                          value={
                            form[key]
                          }
                          autoCapitalize={
                            key ===
                            "email"
                              ? "none"
                              : "sentences"
                          }
                          keyboardType={
                            key ===
                            "email"
                              ? "email-address"
                              : key ===
                                      "telefono" ||
                                    key ===
                                      "celular"
                                ? "phone-pad"
                                : "default"
                          }
                          onChangeText={(
                            value,
                          ) =>
                            setValue(
                              key,
                              value,
                            )
                          }
                        />
                      </View>
                    ),
                  )}

                  <View
                    style={
                      styles.field
                    }
                  >
                    <Select<
                      UsuarioFormRRHH["genero"]
                    >
                      label="Género"
                      value={
                        form.genero
                      }
                      options={
                        generos
                      }
                      onValueChange={(
                        value,
                      ) =>
                        setValue(
                          "genero",
                          value,
                        )
                      }
                      modalTitle="Género"
                    />
                  </View>

                  <View
                    style={
                      styles.field
                    }
                  >
                    <Select<string>
                      label="Expedido"
                      value={
                        form.expedido
                      }
                      options={
                        expedidos
                      }
                      onValueChange={(
                        value,
                      ) =>
                        setValue(
                          "expedido",
                          value,
                        )
                      }
                      modalTitle="Expedido"
                    />
                  </View>

                  <View
                    style={
                      styles.field
                    }
                  >
                    <ThemedText
                      style={
                        styles.label
                      }
                    >
                      Fecha de
                      nacimiento
                    </ThemedText>

                    <Button
                      title={
                        form.fecha_nac ||
                        "Seleccionar fecha"
                      }
                      variant="secondary"
                      onPress={() =>
                        setDateOpen(
                          true,
                        )
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.field
                    }
                  >
                    <Switch
                      label="Usuario activo"
                      value={
                        form.estado ===
                        "ACTIVO"
                      }
                      onValueChange={(
                        value,
                      ) =>
                        setValue(
                          "estado",
                          value
                            ? "ACTIVO"
                            : "INACTIVO",
                        )
                      }
                    />
                  </View>
                </View>
              </Card>
            </Visibility>
          ) : (
            <Visibility
              action="Ver"
              selector=".rrhh-media"
            >
              <View
                style={
                  styles.media
                }
              >
                <Visibility
                  action="Ver"
                  selector=".rrhh-qr"
                  style={
                    styles.mediaItem
                  }
                >
                  <QrState
                    qrUri={
                      usuario?.qrUrl
                    }
                    title="Código QR"
                    subtitle="Credencial digital asociada al usuario."
                    emptyTitle="Sin código QR"
                    emptySubtitle="Este usuario todavía no tiene un código QR registrado."
                    showSecurityMessage
                    actionLabel="Abrir QR"
                    onAction={
                      usuario?.qrUrl
                        ? () =>
                            abrirUrl(
                              usuario.qrUrl,
                            )
                        : undefined
                    }
                  />
                </Visibility>

                <Visibility
                  action="Ver"
                  selector=".rrhh-foto"
                  style={
                    styles.mediaItem
                  }
                >
                  <ProfilePhotoState
                    photoUrl={
                      usuario?.fotoUrl
                    }
                    title="Foto de perfil"
                    subtitle="Fotografía registrada del usuario."
                    emptyTitle="Sin foto de perfil"
                    emptySubtitle="Este usuario todavía no tiene una fotografía registrada."
                  />

                  <Visibility
                    action="Editar"
                    selector=".rrhh-cambiar-foto"
                  >
                    <Button
                      title={
                        usuario?.fotoUrl
                          ? "Cambiar fotografía"
                          : "Agregar fotografía"
                      }
                      loading={
                        subiendoFoto
                      }
                      disabled={
                        subiendoFoto
                      }
                      onPress={() =>
                        setImageOpen(
                          true,
                        )
                      }
                    />
                  </Visibility>
                </Visibility>
              </View>
            </Visibility>
          )}
        </ScrollView>
      </Modal>

      <DatePickerModal
        visible={dateOpen}
        mode="single"
        title="Fecha de nacimiento"
        initialDate={
          form.fecha_nac ||
          undefined
        }
        minDate="1900-01-01"
        maxDate={hoy()}
        onClose={() =>
          setDateOpen(false)
        }
        onApply={(
          result,
        ) => {
          if (
            result.type ===
            "single"
          ) {
            setValue(
              "fecha_nac",
              result.date,
            );
          }
        }}
      />

      <ImageUploadModal
        visible={imageOpen}
        title="Foto del usuario"
        allowCamera
        maxImages={1}
        initialSelectionMode="single"
        allowModeChange={false}
        initialAspectRatio="1:1"
        initialFormat="webp"
        onClose={() =>
          setImageOpen(false)
        }
        onSave={
          guardarFoto
        }
      />
    </>
  );
}

const styles =
  StyleSheet.create({
    body: {
      maxHeight: 650,
    },

    content: {
      gap: 14,
    },

    meta: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },

    loading: {
      gap: 10,
    },

    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },

    field: {
      flexGrow: 1,
      flexBasis: 250,
      minWidth: 220,
      gap: 6,
    },

    wide: {
      flexBasis: 500,
    },

    label: {
      fontSize: 12,
      fontWeight: "700",
    },

    media: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },

    mediaItem: {
      flexGrow: 1,
      flexBasis: 320,
      minWidth: 280,
      gap: 10,
    },

    footer: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent:
        "flex-end",
      gap: 10,
    },
  });