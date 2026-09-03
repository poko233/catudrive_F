import {
  ImageUploadModal,
  ImageUploadResult,
} from "@/components/ImageUploadModal";

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  Button,
} from "@/components/ui/Button";

import {
  Card,
} from "@/components/ui/Card";

import {
  Input,
} from "@/components/ui/Input";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  Select,
  SelectOption,
} from "@/components/ui/Select";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  Image,
  StyleSheet,
  View,
} from "react-native";

import {
  useEffect,
  useState,
} from "react";

import {
  Chofer,
  ChoferForm,
  EstadoChofer,
  FotoChoferArchivo,
} from "../types/chofer.types";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

type Props = {
  visible: boolean;

  chofer?:
    | Chofer
    | null;

  saving: boolean;

  onClose: () => void;

  onSubmit: (
    form:
      ChoferForm,

    chofer?:
      | Chofer
      | null,

    foto?:
      | FotoChoferArchivo
      | null,
  ) => Promise<boolean>;
};

/*
|--------------------------------------------------------------------------
| OPCIONES
|--------------------------------------------------------------------------
*/

const estadoOptions:
  SelectOption<EstadoChofer>[] =
    [
      {
        label:
          "Activo",

        value:
          "ACTIVO",
      },

      {
        label:
          "Inactivo",

        value:
          "INACTIVO",
      },
    ];

const categoriaOptions:
  SelectOption<string>[] =
    [
      {
        label:
          "M - Motocicleta",

        value:
          "M",
      },

      {
        label:
          "P - Particular",

        value:
          "P",
      },

      {
        label:
          "A - Profesional A",

        value:
          "A",
      },

      {
        label:
          "B - Profesional B",

        value:
          "B",
      },

      {
        label:
          "C - Profesional C",

        value:
          "C",
      },
    ];

const EMPTY_FORM:
  ChoferForm = {
    carnet_sindical:
      "",

    nombre_completo:
      "",

    carnet_identidad:
      "",

    telefono:
      "",

    numero_licencia:
      "",

    categoria_licencia:
      "B",

    estado:
      "ACTIVO",
  };

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export function ChoferFormModal({
  visible,

  chofer,

  saving,

  onClose,

  onSubmit,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const [
    form,
    setForm,
  ] =
    useState<ChoferForm>(
      EMPTY_FORM,
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    imageModalVisible,
    setImageModalVisible,
  ] =
    useState(false);

  const [
    foto,
    setFoto,
  ] =
    useState<
      FotoChoferArchivo | null
    >(null);

  const [
    fotoPreview,
    setFotoPreview,
  ] =
    useState<
      string | null
    >(null);

  const editing =
    !!chofer;

  /*
  |--------------------------------------------------------------------------
  | CARGAR FORMULARIO
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (!visible) {
        return;
      }

      setForm(
        chofer
          ? {
              carnet_sindical:
                chofer.carnet_sindical ??
                "",

              nombre_completo:
                chofer.nombre_completo ??
                "",

              carnet_identidad:
                chofer.carnet_identidad ??
                "",

              telefono:
                chofer.telefono ??
                "",

              numero_licencia:
                chofer.numero_licencia ??
                "",

              categoria_licencia:
                chofer.categoria_licencia ||
                "B",

              estado:
                chofer.estado ??
                "ACTIVO",
            }
          : EMPTY_FORM,
      );

      setFoto(
        null,
      );

      setFotoPreview(
        chofer?.fotoUrl ??
          null,
      );

      setError(
        "",
      );

      setImageModalVisible(
        false,
      );
    },

    [
      visible,
      chofer,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE FIELD
  |--------------------------------------------------------------------------
  */

  const update = <
    K extends keyof ChoferForm,
  >(
    key: K,

    value:
      ChoferForm[K],
  ) => {
    setForm(
      (
        prev,
      ) => ({
        ...prev,

        [key]:
          value,
      }),
    );

    if (error) {
      setError(
        "",
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDAR
  |--------------------------------------------------------------------------
  */

  const validar =
    (): string | null => {
      if (
        !form.carnet_sindical.trim()
      ) {
        return "El carnet sindical es obligatorio.";
      }

      if (
        !form.nombre_completo.trim()
      ) {
        return "El nombre completo es obligatorio.";
      }

      if (
        !form.carnet_identidad.trim()
      ) {
        return "El carnet de identidad es obligatorio.";
      }

      if (
        !form.telefono.trim()
      ) {
        return "El teléfono es obligatorio.";
      }

      if (
        !form.numero_licencia.trim()
      ) {
        return "El número de licencia es obligatorio.";
      }

      if (
        !String(
          form.categoria_licencia,
        ).trim()
      ) {
        return "La categoría de licencia es obligatoria.";
      }

      return null;
    };

  /*
  |--------------------------------------------------------------------------
  | GUARDAR
  |--------------------------------------------------------------------------
  */

  const guardar =
    async () => {
      const validation =
        validar();

      if (
        validation
      ) {
        setError(
          validation,
        );

        return;
      }

      const ok =
        await onSubmit(
          {
            carnet_sindical:
              form.carnet_sindical
                .trim(),

            nombre_completo:
              form.nombre_completo
                .trim()
                .replace(
                  /\s+/g,
                  " ",
                ),

            carnet_identidad:
              form.carnet_identidad
                .trim(),

            telefono:
              form.telefono
                .trim(),

            numero_licencia:
              form.numero_licencia
                .trim(),

            categoria_licencia:
              String(
                form.categoria_licencia,
              )
                .trim()
                .toUpperCase(),

            estado:
              form.estado,
          },

          chofer,

          foto,
        );

      if (ok) {
        onClose();
      }
    };

  /*
  |--------------------------------------------------------------------------
  | IMAGEN
  |--------------------------------------------------------------------------
  */

  const recibirImagen =
    (
      result:
        | ImageUploadResult
        | ImageUploadResult[],
    ) => {
      const image =
        Array.isArray(
          result,
        )
          ? result[0]
          : result;

      if (!image) {
        return;
      }

      setFoto({
        uri:
          image.uri,

        name:
          image.fileName,

        type:
          image.mimeType,
      });

      setFotoPreview(
        image.uri,
      );

      setImageModalVisible(
        false,
      );
    };

  return (
    <>
      <Modal
        visible={
          visible
        }
        title={
          editing
            ? "Modificar chofer"
            : "Registrar chofer"
        }
        onClose={
          onClose
        }
        closeOnBackdropPress={
          !saving
        }
        width="96%"
        maxWidth={
          760
        }
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
                saving
              }
              onPress={
                onClose
              }
            />

            <Button
              title={
                editing
                  ? "Guardar cambios"
                  : "Registrar chofer"
              }
              loading={
                saving
              }
              disabled={
                saving
              }
              onPress={
                guardar
              }
            />
          </View>
        }
      >
        <View
          style={
            styles.content
          }
        >
          <Card
            style={
              styles.photoCard
            }
          >
            <View
              style={
                styles.photoRow
              }
            >
              <View
                style={[
                  styles.photo,

                  {
                    borderColor:
                      c.border,

                    backgroundColor:
                      c.backgroundSecondary,
                  },
                ]}
              >
                {fotoPreview ? (
                  <Image
                    source={{
                      uri:
                        fotoPreview,
                    }}
                    style={
                      styles.photoImage
                    }
                    resizeMode="cover"
                  />
                ) : (
                  <ThemedText
                    style={{
                      color:
                        c.textSecondary,
                    }}
                  >
                    Sin foto
                  </ThemedText>
                )}
              </View>

              <View
                style={
                  styles.photoCopy
                }
              >
                <ThemedText
                  style={
                    styles.sectionTitle
                  }
                >
                  Fotografía
                </ThemedText>

                <ThemedText
                  style={[
                    styles.helper,

                    {
                      color:
                        c.textSecondary,
                    },
                  ]}
                >
                  La fotografía será procesada utilizando el cargador general de imágenes del sistema.
                </ThemedText>

                <Button
                  title={
                    fotoPreview
                      ? "Cambiar fotografía"
                      : "Seleccionar fotografía"
                  }
                  variant="secondary"
                  disabled={
                    saving
                  }
                  onPress={() =>
                    setImageModalVisible(
                      true,
                    )
                  }
                />
              </View>
            </View>
          </Card>

          <View
            style={
              styles.grid
            }
          >
            <View
              style={
                styles.field
              }
            >
              <Input
                label="Carnet Sindical"
                value={
                  form.carnet_sindical
                }
                onChangeText={(
                  value,
                ) =>
                  update(
                    "carnet_sindical",

                    value,
                  )
                }
                placeholder="Ej. CS-0001"
                editable={
                  !saving
                }
              />
            </View>

            <View
              style={
                styles.field
              }
            >
              <Input
                label="Carnet de Identidad"
                value={
                  form.carnet_identidad
                }
                onChangeText={(
                  value,
                ) =>
                  update(
                    "carnet_identidad",

                    value,
                  )
                }
                placeholder="Ej. 12345678"
                editable={
                  !saving
                }
              />
            </View>
          </View>

          <Input
            label="Nombre Completo"
            value={
              form.nombre_completo
            }
            onChangeText={(
              value,
            ) =>
              update(
                "nombre_completo",

                value,
              )
            }
            placeholder="Nombres y apellidos"
            editable={
              !saving
            }
          />

          <View
            style={
              styles.grid
            }
          >
            <View
              style={
                styles.field
              }
            >
              <Input
                label="Teléfono"
                value={
                  form.telefono
                }
                onChangeText={(
                  value,
                ) =>
                  update(
                    "telefono",

                    value,
                  )
                }
                placeholder="Ej. 70707070"
                editable={
                  !saving
                }
                keyboardType="phone-pad"
              />
            </View>

            <View
              style={
                styles.field
              }
            >
              <Input
                label="Nro. de Licencia"
                value={
                  form.numero_licencia
                }
                onChangeText={(
                  value,
                ) =>
                  update(
                    "numero_licencia",

                    value,
                  )
                }
                placeholder="Número de licencia"
                editable={
                  !saving
                }
              />
            </View>
          </View>

          <View
            style={
              styles.grid
            }
          >
            <View
              style={
                styles.field
              }
            >
              <Select<string>
                label="Categoría de Licencia"
                value={
                  String(
                    form.categoria_licencia,
                  )
                }
                options={
                  categoriaOptions
                }
                onValueChange={(
                  value,
                ) =>
                  update(
                    "categoria_licencia",

                    value,
                  )
                }
                disabled={
                  saving
                }
                modalTitle="Categoría de licencia"
              />
            </View>

            <View
              style={
                styles.field
              }
            >
              <Select<EstadoChofer>
                label="Estado"
                value={
                  form.estado
                }
                options={
                  estadoOptions
                }
                onValueChange={(
                  value,
                ) =>
                  update(
                    "estado",

                    value,
                  )
                }
                disabled={
                  saving
                }
                modalTitle="Estado del chofer"
              />
            </View>
          </View>

          {!!error && (
            <ThemedText
              style={[
                styles.error,

                {
                  color:
                    c.destructive,
                },
              ]}
            >
              {error}
            </ThemedText>
          )}
        </View>
      </Modal>

      <ImageUploadModal
        visible={
          imageModalVisible
        }
        title="Fotografía del chofer"
        onClose={() =>
          setImageModalVisible(
            false,
          )
        }
        onSave={
          recibirImagen
        }
        initialSelectionMode="single"
        allowModeChange={
          false
        }
        maxImages={
          1
        }
        initialFormat="webp"
        initialAspectRatio="3:4"
        allowCamera
      />
    </>
  );
}

const styles =
  StyleSheet.create({
    content: {
      gap: 14,
    },

    photoCard: {
      width: "100%",
    },

    photoRow: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      alignItems:
        "center",

      gap: 14,
    },

    photo: {
      width: 104,

      height: 128,

      borderWidth: 1,

      borderRadius: 14,

      overflow:
        "hidden",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    photoImage: {
      width:
        "100%",

      height:
        "100%",
    },

    photoCopy: {
      flex: 1,

      minWidth: 220,

      gap: 8,
    },

    sectionTitle: {
      fontSize: 15,

      fontWeight:
        "900",
    },

    helper: {
      fontSize: 11,

      lineHeight: 16,
    },

    grid: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap: 12,
    },

    field: {
      flex: 1,

      minWidth: 240,
    },

    error: {
      fontSize: 12,

      fontWeight:
        "700",
    },

    footer: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      justifyContent:
        "flex-end",

      gap: 10,
    },
  });