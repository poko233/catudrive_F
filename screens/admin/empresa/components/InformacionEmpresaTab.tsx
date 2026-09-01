// screens/admin/empresa/components/InformacionEmpresaTab.tsx

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Image,
  StyleSheet,
  View,
} from "react-native";

import {
  Building2,
  ImageIcon,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react-native";

import {
  ImageUploadModal,
  ImageUploadResult,
} from "@/components/ImageUploadModal";

import {
  ThemedText,
} from "@/components/ThemedText";

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
  Divider,
} from "@/components/ui/Divider";

import {
  EmptyState,
} from "@/components/ui/EmptyState";

import {
  IconButton,
} from "@/components/ui/IconButton";

import {
  Input,
} from "@/components/ui/Input";

import {
  Skeleton,
} from "@/components/ui/Skeleton";

import {
  useConfirm,
} from "@/hooks/useConfirm";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  Empresa,
  EmpresaFormData,
  EmpresaImageType,
  EmpresaUploadFile,
} from "../types/empresa.types";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

type Props = {
  empresa:
    | Empresa
    | null;

  loading: boolean;

  refreshing: boolean;

  saving: boolean;

  processingImage:
    | EmpresaImageType
    | null;

  onRefresh:
    () =>
      void |
      Promise<void>;

  onSave: (
    form:
      EmpresaFormData,
  ) =>
    Promise<Empresa | null>;

  onUploadImage: (
    tipo:
      EmpresaImageType,

    archivo:
      EmpresaUploadFile,
  ) =>
    Promise<Empresa | null>;

  onDeleteImage: (
    tipo:
      EmpresaImageType,
  ) =>
    Promise<Empresa | null>;
};

/*
|--------------------------------------------------------------------------
| FORM
|--------------------------------------------------------------------------
*/

const EMPTY_FORM:
  EmpresaFormData = {
    empresa:
      "",

    sigla:
      "",

    responsable:
      "",

    email:
      "",

    telefono:
      "",

    celular:
      "",

    direccion:
      "",

    tipo_cambio:
      "",
  };

function empresaToForm(
  empresa:
    Empresa,
): EmpresaFormData {
  return {
    empresa:
      empresa.empresa ||
      "",

    sigla:
      empresa.sigla ||
      "",

    responsable:
      empresa.responsable ||
      "",

    email:
      empresa.email ||
      "",

    telefono:
      empresa.telefono ||
      "",

    celular:
      empresa.celular ||
      "",

    direccion:
      empresa.direccion ||
      "",

    tipo_cambio:
      empresa.tipo_cambio
        ?.toString() ??
      "",
  };
}

/*
|--------------------------------------------------------------------------
| IMÁGENES
|--------------------------------------------------------------------------
*/

type ImageConfig = {
  tipo:
    EmpresaImageType;

  title:
    string;

  description:
    string;

  aspect:
    | "original"
    | "1:1"
    | "4:3"
    | "3:4"
    | "16:9"
    | "9:16";
};

const IMAGE_CONFIGS:
  ImageConfig[] = [
    {
      tipo:
        "logo_cuadrado",

      title:
        "Logo cuadrado",

      description:
        "Logo principal en formato cuadrado.",

      aspect:
        "1:1",
    },

    {
      tipo:
        "icono",

      title:
        "Icono",

      description:
        "Icono utilizado en la interfaz del sistema.",

      aspect:
        "1:1",
    },

    {
      tipo:
        "logo_largo",

      title:
        "Logo horizontal",

      description:
        "Versión horizontal de la identidad institucional.",

      aspect:
        "16:9",
    },

    {
      tipo:
        "banner",

      title:
        "Banner de inicio",

      description:
        "Imagen de fondo utilizada en la pantalla de acceso.",

      aspect:
        "16:9",
    },
  ];

function imageUrl(
  empresa:
    Empresa,

  tipo:
    EmpresaImageType,
): string | null {
  switch (tipo) {
    case "logo_cuadrado":
      return (
        empresa.logos
          ?.cuadrado ??
        null
      );

    case "logo_largo":
      return (
        empresa.logos
          ?.largo ??
        null
      );

    case "icono":
      return (
        empresa.logos
          ?.icono ??
        null
      );

    case "banner":
      return (
        empresa.logos
          ?.baner ??
        null
      );
  }
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function InformacionEmpresaTab({
  empresa,

  loading,

  refreshing,

  saving,

  processingImage,

  onRefresh,

  onSave,

  onUploadImage,

  onDeleteImage,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const confirm =
    useConfirm();

  const [
    editMode,
    setEditMode,
  ] =
    useState(false);

  const [
    form,
    setForm,
  ] =
    useState<EmpresaFormData>(
      EMPTY_FORM,
    );

  const [
    uploadType,
    setUploadType,
  ] =
    useState<EmpresaImageType | null>(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | SINCRONIZAR FORM
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (!empresa) {
        return;
      }

      setForm(
        empresaToForm(
          empresa,
        ),
      );
    },
    [
      empresa,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | CONFIG IMAGEN ACTUAL
  |--------------------------------------------------------------------------
  */

  const currentImageConfig =
    useMemo(
      () =>
        IMAGE_CONFIGS.find(
          (
            config,
          ) =>
            config.tipo ===
            uploadType,
        ) ??
        null,
      [
        uploadType,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CAMBIO
  |--------------------------------------------------------------------------
  */

  const setValue =
    (
      key:
        keyof EmpresaFormData,

      value:
        string,
    ) => {
      setForm(
        (
          current,
        ) => ({
          ...current,

          [key]:
            value,
        }),
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CANCELAR
  |--------------------------------------------------------------------------
  */

  const cancelarEdicion =
    () => {
      if (empresa) {
        setForm(
          empresaToForm(
            empresa,
          ),
        );
      }

      setEditMode(
        false,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | GUARDAR
  |--------------------------------------------------------------------------
  */

  const guardar =
    async () => {
      if (
        !form.empresa
          .trim()
      ) {
        return;
      }

      const updated =
        await onSave({
          ...form,

          empresa:
            form.empresa
              .trim(),

          sigla:
            form.sigla
              ?.trim() ??
            "",

          responsable:
            form.responsable
              ?.trim() ??
            "",

          email:
            form.email
              ?.trim()
              .toLowerCase() ??
            "",

          telefono:
            form.telefono
              ?.trim() ??
            "",

          celular:
            form.celular
              ?.trim() ??
            "",

          direccion:
            form.direccion
              ?.trim() ??
            "",

          tipo_cambio:
            form.tipo_cambio,
        });

      if (updated) {
        setEditMode(
          false,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | UPLOAD
  |--------------------------------------------------------------------------
  */

  const guardarImagen =
    async (
      result:
        | ImageUploadResult
        | ImageUploadResult[],
    ) => {
      if (!uploadType) {
        return;
      }

      const image =
        Array.isArray(
          result,
        )
          ? result[0]
          : result;

      if (!image) {
        return;
      }

      const updated =
        await onUploadImage(
          uploadType,

          {
            uri:
              image.uri,

            name:
              image.fileName,

            type:
              image.mimeType,
          },
        );

      if (updated) {
        setUploadType(
          null,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | DELETE IMAGE
  |--------------------------------------------------------------------------
  */

  const eliminarImagen =
    async (
      config:
        ImageConfig,
    ) => {
      const ok =
        await confirm({
          title:
            "Eliminar imagen",

          message:
            `¿Seguro que quieres eliminar "${config.title}"?`,

          variant:
            "danger",

          confirmText:
            "Eliminar",
        });

      if (!ok) {
        return;
      }

      await onDeleteImage(
        config.tipo,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    loading &&
    !empresa
  ) {
    return (
      <View
        style={
          styles.loadingGrid
        }
      >
        <Card
          style={
            styles.loadingCard
          }
        >
          <Skeleton
            width="45%"
            height={24}
          />

          <Skeleton
            width="100%"
            height={160}
          />

          <Skeleton
            width="100%"
            height={160}
          />
        </Card>

        <Card
          style={
            styles.loadingCard
          }
        >
          <Skeleton
            width="38%"
            height={24}
          />

          <Skeleton
            width="100%"
            height={46}
          />

          <Skeleton
            width="100%"
            height={46}
          />

          <Skeleton
            width="100%"
            height={46}
          />
        </Card>
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | EMPTY
  |--------------------------------------------------------------------------
  */

  if (!empresa) {
    return (
      <Card>
        <EmptyState
          icon="business-outline"
          title="No se encontró la empresa"
          subtitle="No existe información institucional disponible."
        />

        <View
          style={
            styles.emptyAction
          }
        >
          <Button
            title="Volver a intentar"
            loading={
              refreshing
            }
            onPress={() => {
              void onRefresh();
            }}
          />
        </View>
      </Card>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <View
        style={
          styles.layout
        }
      >
        {/* ================================================= */}
        {/* IDENTIDAD VISUAL */}
        {/* ================================================= */}

        <Visibility
          action="Ver"
          selector=".empresa-imagenes"
          style={
            styles.column
          }
        >
          <Card>
            <View
              style={
                styles.sectionHeader
              }
            >
              <View
                style={
                  styles.sectionCopy
                }
              >
                <ThemedText
                  style={
                    styles.sectionTitle
                  }
                >
                  Identidad visual
                </ThemedText>

                <ThemedText
                  style={[
                    styles.sectionDescription,

                    {
                      color:
                        c.textSecondary,
                    },
                  ]}
                >
                  Logos e imágenes utilizadas por el sistema.
                </ThemedText>
              </View>

              <Badge
                label="4 recursos"
                variant="muted"
              />
            </View>

            <Divider
              spacing={8}
            />

            <View
              style={
                styles.imagesGrid
              }
            >
              {IMAGE_CONFIGS.map(
                (
                  config,
                ) => {
                  const uri =
                    imageUrl(
                      empresa,
                      config.tipo,
                    );

                  const processing =
                    processingImage ===
                    config.tipo;

                  return (
                    <Card
                      key={
                        config.tipo
                      }
                      style={
                        styles.imageCard
                      }
                    >
                      <View
                        style={
                          styles.imageCardHeader
                        }
                      >
                        <View
                          style={
                            styles.imageCardCopy
                          }
                        >
                          <ThemedText
                            style={
                              styles.imageTitle
                            }
                          >
                            {
                              config.title
                            }
                          </ThemedText>

                          <ThemedText
                            style={[
                              styles.imageDescription,

                              {
                                color:
                                  c.textSecondary,
                              },
                            ]}
                          >
                            {
                              config.description
                            }
                          </ThemedText>
                        </View>

                        <Badge
                          label={
                            uri
                              ? "Configurada"
                              : "Sin imagen"
                          }
                          variant={
                            uri
                              ? "success"
                              : "muted"
                          }
                        />
                      </View>

                      <View
                        style={[
                          styles.preview,

                          {
                            backgroundColor:
                              c.backgroundSecondary,

                            borderColor:
                              c.border,
                          },
                        ]}
                      >
                        {uri ? (
                          <Image
                            source={{
                              uri,
                            }}
                            style={
                              styles.previewImage
                            }
                            resizeMode="contain"
                          />
                        ) : (
                          <View
                            style={
                              styles.previewEmpty
                            }
                          >
                            <ImageIcon
                              size={30}
                              color={
                                c.textMuted
                              }
                            />

                            <ThemedText
                              style={{
                                color:
                                  c.textSecondary,

                                fontSize:
                                  12,
                              }}
                            >
                              Sin imagen
                            </ThemedText>
                          </View>
                        )}
                      </View>

                      <Visibility
                        action="Editar"
                        selector={`.empresa-imagen-${config.tipo}`}
                      >
                        <View
                          style={
                            styles.imageActions
                          }
                        >
                          <Button
                            title={
                              uri
                                ? "Cambiar"
                                : "Subir imagen"
                            }
                            variant="secondary"
                            loading={
                              processing
                            }
                            disabled={
                              !!processingImage
                            }
                            onPress={() =>
                              setUploadType(
                                config.tipo,
                              )
                            }
                            style={
                              styles.imageAction
                            }
                          />

                          {uri ? (
                            <IconButton
                              icon={
                                Trash2
                              }
                              variant="destructive"
                              disabled={
                                !!processingImage
                              }
                              accessibilityLabel={`Eliminar ${config.title}`}
                              onPress={() => {
                                void eliminarImagen(
                                  config,
                                );
                              }}
                            />
                          ) : null}
                        </View>
                      </Visibility>
                    </Card>
                  );
                },
              )}
            </View>
          </Card>
        </Visibility>

        {/* ================================================= */}
        {/* INFORMACIÓN */}
        {/* ================================================= */}

        <Visibility
          action="Ver"
          selector=".empresa-datos"
          style={
            styles.column
          }
        >
          <Card>
            <View
              style={
                styles.sectionHeader
              }
            >
              <View
                style={
                  styles.sectionCopy
                }
              >
                <ThemedText
                  style={
                    styles.sectionTitle
                  }
                >
                  Información institucional
                </ThemedText>

                <ThemedText
                  style={[
                    styles.sectionDescription,

                    {
                      color:
                        c.textSecondary,
                    },
                  ]}
                >
                  Datos generales y de contacto de la empresa.
                </ThemedText>
              </View>

              <View
                style={
                  styles.headerActions
                }
              >
                <IconButton
                  icon={
                    RefreshCw
                  }
                  variant="secondary"
                  disabled={
                    refreshing ||
                    saving
                  }
                  accessibilityLabel="Actualizar información"
                  onPress={() => {
                    void onRefresh();
                  }}
                />

                {!editMode ? (
                  <Visibility
                    action="Editar"
                    selector=".empresa-editar"
                  >
                    <IconButton
                      icon={
                        Pencil
                      }
                      variant="secondary"
                      accessibilityLabel="Editar empresa"
                      onPress={() =>
                        setEditMode(
                          true,
                        )
                      }
                    />
                  </Visibility>
                ) : null}
              </View>
            </View>

            <Divider
              spacing={8}
            />

            <View
              style={
                styles.companyBadge
              }
            >
              <View
                style={[
                  styles.companyIcon,

                  {
                    backgroundColor:
                      c.primarySubtle,
                  },
                ]}
              >
                <Building2
                  size={22}
                  color={
                    c.primary
                  }
                />
              </View>

              <View
                style={
                  styles.companyCopy
                }
              >
                <ThemedText
                  style={
                    styles.companyName
                  }
                >
                  {
                    empresa.empresa
                  }
                </ThemedText>

                <ThemedText
                  style={{
                    color:
                      c.textSecondary,

                    fontSize:
                      12,
                  }}
                >
                  {empresa.sigla ||
                    "Sin sigla"}
                </ThemedText>
              </View>

              <Badge
                label={
                  empresa.estado
                }
                variant={
                  empresa.estado ===
                  "Activo"
                    ? "success"
                    : "muted"
                }
                dot
              />
            </View>

            <Divider
              label="Datos"
              labelPosition="start"
              spacing={10}
            />

            <View
              style={
                styles.form
              }
            >
              <Input
                label="Empresa"
                value={
                  form.empresa
                }
                editable={
                  editMode
                }
                maxLength={100}
                onChangeText={(
                  value,
                ) =>
                  setValue(
                    "empresa",
                    value,
                  )
                }
              />

              <Input
                label="Sigla"
                value={
                  form.sigla ??
                  ""
                }
                editable={
                  editMode
                }
                onChangeText={(
                  value,
                ) =>
                  setValue(
                    "sigla",
                    value,
                  )
                }
              />

              <Input
                label="Responsable"
                value={
                  form.responsable ??
                  ""
                }
                editable={
                  editMode
                }
                maxLength={80}
                onChangeText={(
                  value,
                ) =>
                  setValue(
                    "responsable",
                    value,
                  )
                }
              />

              <Input
                label="Correo electrónico"
                value={
                  form.email ??
                  ""
                }
                editable={
                  editMode
                }
                keyboardType="email-address"
                autoCapitalize="none"
                maxLength={80}
                onChangeText={(
                  value,
                ) =>
                  setValue(
                    "email",
                    value,
                  )
                }
              />

              <View
                style={
                  styles.row
                }
              >
                <View
                  style={
                    styles.rowItem
                  }
                >
                  <Input
                    label="Teléfono"
                    value={
                      form.telefono ??
                      ""
                    }
                    editable={
                      editMode
                    }
                    keyboardType="phone-pad"
                    maxLength={11}
                    onChangeText={(
                      value,
                    ) =>
                      setValue(
                        "telefono",
                        value,
                      )
                    }
                  />
                </View>

                <View
                  style={
                    styles.rowItem
                  }
                >
                  <Input
                    label="Celular"
                    value={
                      form.celular ??
                      ""
                    }
                    editable={
                      editMode
                    }
                    keyboardType="phone-pad"
                    maxLength={11}
                    onChangeText={(
                      value,
                    ) =>
                      setValue(
                        "celular",
                        value,
                      )
                    }
                  />
                </View>
              </View>

              <Input
                label="Dirección"
                value={
                  form.direccion ??
                  ""
                }
                editable={
                  editMode
                }
                onChangeText={(
                  value,
                ) =>
                  setValue(
                    "direccion",
                    value,
                  )
                }
              />

              <Input
                label="Tipo de cambio"
                value={
                  String(
                    form.tipo_cambio ??
                    "",
                  )
                }
                editable={
                  editMode
                }
                keyboardType="decimal-pad"
                onChangeText={(
                  value,
                ) =>
                  setValue(
                    "tipo_cambio",
                    value,
                  )
                }
              />

              {editMode ? (
                <Visibility
                  action="Editar"
                  selector=".empresa-guardar"
                >
                  <View
                    style={
                      styles.formActions
                    }
                  >
                    <Button
                      title="Cancelar"
                      variant="secondary"
                      disabled={
                        saving
                      }
                      onPress={
                        cancelarEdicion
                      }
                    />

                    <Button
                      title="Guardar cambios"
                      loading={
                        saving
                      }
                      disabled={
                        saving ||
                        !form.empresa
                          .trim()
                      }
                      onPress={() => {
                        void guardar();
                      }}
                    />
                  </View>
                </Visibility>
              ) : null}
            </View>
          </Card>
        </Visibility>
      </View>

      {/* ================================================= */}
      {/* IMAGE UPLOAD GENERAL */}
      {/* ================================================= */}

      <ImageUploadModal
        visible={
          !!uploadType
        }
        title={
          currentImageConfig
            ? `Subir ${currentImageConfig.title}`
            : "Subir imagen"
        }
        maxInputSizeMB={5}
        maxImages={1}
        initialSelectionMode="single"
        allowModeChange={false}
        initialAspectRatio={
          currentImageConfig
            ?.aspect ??
          "original"
        }
        initialFormat="webp"
        initialQuality={90}
        onClose={() =>
          setUploadType(
            null,
          )
        }
        onSave={
          guardarImagen
        }
      />
    </>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    layout: {
      width:
        "100%",

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        16,
    },

    column: {
      flexGrow:
        1,

      flexBasis:
        520,

      minWidth:
        320,
    },

    sectionHeader: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      justifyContent:
        "space-between",

      flexWrap:
        "wrap",

      gap:
        12,
    },

    sectionCopy: {
      flex:
        1,

      minWidth:
        220,
    },

    sectionTitle: {
      fontSize:
        19,

      fontWeight:
        "900",
    },

    sectionDescription: {
      marginTop:
        3,

      fontSize:
        12,

      lineHeight:
        17,
    },

    headerActions: {
      flexDirection:
        "row",

      gap:
        8,
    },

    /*
    |--------------------------------------------------------------------------
    | COMPANY
    |--------------------------------------------------------------------------
    */

    companyBadge: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        12,
    },

    companyIcon: {
      width:
        44,

      height:
        44,

      borderRadius:
        13,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    companyCopy: {
      flex:
        1,

      minWidth:
        0,
    },

    companyName: {
      fontSize:
        15,

      fontWeight:
        "800",
    },

    /*
    |--------------------------------------------------------------------------
    | IMAGES
    |--------------------------------------------------------------------------
    */

    imagesGrid: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        12,
    },

    imageCard: {
      flexGrow:
        1,

      flexBasis:
        220,

      minWidth:
        210,

      gap:
        12,
    },

    imageCardHeader: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      justifyContent:
        "space-between",

      gap:
        8,
    },

    imageCardCopy: {
      flex:
        1,

      minWidth:
        0,
    },

    imageTitle: {
      fontSize:
        13,

      fontWeight:
        "800",
    },

    imageDescription: {
      marginTop:
        2,

      fontSize:
        10,

      lineHeight:
        14,
    },

    preview: {
      height:
        145,

      borderWidth:
        1,

      borderRadius:
        12,

      overflow:
        "hidden",
    },

    previewImage: {
      width:
        "100%",

      height:
        "100%",
    },

    previewEmpty: {
      flex:
        1,

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        7,
    },

    imageActions: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        8,
    },

    imageAction: {
      flex:
        1,
    },

    /*
    |--------------------------------------------------------------------------
    | FORM
    |--------------------------------------------------------------------------
    */

    form: {
      gap:
        14,
    },

    row: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        12,
    },

    rowItem: {
      flexGrow:
        1,

      flexBasis:
        180,

      minWidth:
        160,
    },

    formActions: {
      flexDirection:
        "row",

      justifyContent:
        "flex-end",

      flexWrap:
        "wrap",

      gap:
        10,

      paddingTop:
        4,
    },

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    loadingGrid: {
      width:
        "100%",

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        16,
    },

    loadingCard: {
      flexGrow:
        1,

      flexBasis:
        480,

      minWidth:
        320,

      gap:
        12,
    },

    emptyAction: {
      marginTop:
        14,

      alignItems:
        "center",
    },
  });

export default InformacionEmpresaTab;