// screens/admin/modulos/components/DeleteModuloModal.tsx

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  AlertTriangle,
  FileText,
  Link2,
  Trash2,
} from "lucide-react-native";

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  Badge,
} from "@/components/ui/Badge";

import {
  Button,
} from "@/components/ui/Button";

import {
  Divider,
} from "@/components/ui/Divider";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  Modulo,
} from "../types/modulo.types";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

type Props = {
  visible: boolean;

  modulo:
    | Modulo
    | null;

  deleting: boolean;

  onClose: () => void;

  onConfirm:
    () =>
      void |
      Promise<void>;
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function DeleteModuloModal({
  visible,

  modulo,

  deleting,

  onClose,

  onConfirm,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const formularios =
    modulo?.formularios ??
    [];

  const hasFormularios =
    formularios.length >
    0;

  /*
  |--------------------------------------------------------------------------
  | CLOSE
  |--------------------------------------------------------------------------
  */

  const handleClose =
    () => {
      /*
       * Mientras DELETE esté ejecutándose
       * no permitimos cerrar el modal.
       */

      if (
        deleting
      ) {
        return;
      }

      onClose();
    };

  /*
  |--------------------------------------------------------------------------
  | FOOTER
  |--------------------------------------------------------------------------
  */

  const footer =
    (
      <View
        style={
          styles.footer
        }
      >
        <Button
          title="Cancelar"
          variant="secondary"
          disabled={
            deleting
          }
          onPress={
            handleClose
          }
        />

        <Button
          title={
            deleting
              ? "Eliminando módulo"
              : "Sí, eliminar módulo"
          }
          variant="destructive"
          loading={
            deleting
          }
          disabled={
            deleting ||
            !modulo
          }
          onPress={() => {
            void onConfirm();
          }}
        />
      </View>
    );

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
      title="Eliminar módulo"
      onClose={
        handleClose
      }
      closeOnBackdropPress={
        !deleting
      }
      width="95%"
      maxWidth={580}
      footer={
        footer
      }
    >
      {modulo ? (
        <View
          style={
            styles.content
          }
        >
          {/* ================================================= */}
          {/* WARNING */}
          {/* ================================================= */}

          <View
            style={[
              styles.warningIcon,

              {
                backgroundColor:
                  `${c.destructive}14`,
              },
            ]}
          >
            <Trash2
              size={28}
              color={
                c.destructive
              }
            />
          </View>

          <View
            style={
              styles.intro
            }
          >
            <ThemedText
              style={
                styles.question
              }
            >
              ¿Realmente deseas eliminar este módulo?
            </ThemedText>

            <ThemedText
              style={[
                styles.description,

                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              Esta acción eliminará el módulo y sus relaciones asociadas.
            </ThemedText>
          </View>

          {/* ================================================= */}
          {/* MODULE */}
          {/* ================================================= */}

          <View
            style={[
              styles.moduleBox,

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
                styles.moduleIcon,

                {
                  backgroundColor:
                    `${c.destructive}12`,
                },
              ]}
            >
              <Trash2
                size={20}
                color={
                  c.destructive
                }
              />
            </View>

            <View
              style={
                styles.moduleInfo
              }
            >
              <ThemedText
                style={
                  styles.moduleName
                }
              >
                {
                  modulo.modulo
                }
              </ThemedText>

              <ThemedText
                numberOfLines={
                  2
                }
                style={[
                  styles.moduleDescription,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                {modulo.descripcion ||
                  "Sin descripción"}
              </ThemedText>
            </View>

            <Badge
              label={
                `${formularios.length} formulario${
                  formularios.length ===
                  1
                    ? ""
                    : "s"
                }`
              }
              variant={
                hasFormularios
                  ? "warning"
                  : "muted"
              }
            />
          </View>

          <Divider
            spacing={2}
          />

          {/* ================================================= */}
          {/* FORMULARIOS */}
          {/* ================================================= */}

          {hasFormularios ? (
            <View
              style={
                styles.section
              }
            >
              <View
                style={
                  styles.sectionHeader
                }
              >
                <View
                  style={[
                    styles.linkIcon,

                    {
                      backgroundColor:
                        `${c.warning}15`,
                    },
                  ]}
                >
                  <Link2
                    size={18}
                    color={
                      c.warning
                    }
                  />
                </View>

                <View
                  style={
                    styles.sectionHeaderText
                  }
                >
                  <ThemedText
                    style={
                      styles.sectionTitle
                    }
                  >
                    Formularios vinculados
                  </ThemedText>

                  <ThemedText
                    style={[
                      styles.sectionSubtitle,

                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    Los siguientes formularios están relacionados con este módulo.
                  </ThemedText>
                </View>
              </View>

              <ScrollView
                style={
                  styles.formsScroll
                }
                showsVerticalScrollIndicator={
                  false
                }
                nestedScrollEnabled
              >
                <View
                  style={[
                    styles.forms,

                    {
                      borderColor:
                        c.border,
                    },
                  ]}
                >
                  {formularios.map(
                    (
                      formulario,
                      index,
                    ) => (
                      <View
                        key={
                          formulario.id
                        }
                        style={[
                          styles.formRow,

                          index <
                            formularios.length -
                              1 && {
                            borderBottomWidth:
                              1,

                            borderBottomColor:
                              c.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.formIcon,

                            {
                              backgroundColor:
                                c.primarySubtle,
                            },
                          ]}
                        >
                          <FileText
                            size={16}
                            color={
                              c.primary
                            }
                          />
                        </View>

                        <View
                          style={
                            styles.formInfo
                          }
                        >
                          <ThemedText
                            style={
                              styles.formName
                            }
                          >
                            {
                              formulario.formulario
                            }
                          </ThemedText>

                          {!!formulario.ruta && (
                            <ThemedText
                              numberOfLines={
                                1
                              }
                              style={[
                                styles.formRoute,

                                {
                                  color:
                                    c.textMuted,
                                },
                              ]}
                            >
                              {
                                formulario.ruta
                              }
                            </ThemedText>
                          )}
                        </View>
                      </View>
                    ),
                  )}
                </View>
              </ScrollView>
            </View>
          ) : (
            <View
              style={[
                styles.noRelations,

                {
                  backgroundColor:
                    c.backgroundSecondary,

                  borderColor:
                    c.border,
                },
              ]}
            >
              <Link2
                size={18}
                color={
                  c.textMuted
                }
              />

              <ThemedText
                style={[
                  styles.noRelationsText,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Este módulo no tiene formularios vinculados.
              </ThemedText>
            </View>
          )}

          {/* ================================================= */}
          {/* IMPORTANT */}
          {/* ================================================= */}

          <View
            style={[
              styles.important,

              {
                backgroundColor:
                  `${c.warning}10`,

                borderColor:
                  `${c.warning}55`,
              },
            ]}
          >
            <AlertTriangle
              size={20}
              color={
                c.warning
              }
            />

            <View
              style={
                styles.importantText
              }
            >
              <ThemedText
                style={[
                  styles.importantTitle,

                  {
                    color:
                      c.warning,
                  },
                ]}
              >
                Los formularios no serán eliminados
              </ThemedText>

              <ThemedText
                style={[
                  styles.importantDescription,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Solo se eliminarán las conexiones de estos formularios con el módulo, junto con los permisos y relaciones correspondientes. Los formularios seguirán existiendo en el sistema.
              </ThemedText>
            </View>
          </View>

          {/* ================================================= */}
          {/* DELETE LOADING */}
          {/* ================================================= */}

          {deleting ? (
            <View
              style={[
                styles.deleting,

                {
                  backgroundColor:
                    `${c.destructive}0D`,

                  borderColor:
                    `${c.destructive}45`,
                },
              ]}
            >
              <ActivityIndicator
                size="small"
                color={
                  c.destructive
                }
              />

              <View
                style={
                  styles.deletingText
                }
              >
                <ThemedText
                  style={[
                    styles.deletingTitle,

                    {
                      color:
                        c.destructive,
                    },
                  ]}
                >
                  Eliminando módulo...
                </ThemedText>

                <ThemedText
                  style={[
                    styles.deletingDescription,

                    {
                      color:
                        c.textSecondary,
                    },
                  ]}
                >
                  Estamos eliminando el módulo y limpiando sus relaciones. No cierres esta ventana.
                </ThemedText>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </Modal>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    content: {
      gap:
        15,
    },

    /*
    |--------------------------------------------------------------------------
    | INTRO
    |--------------------------------------------------------------------------
    */

    warningIcon: {
      width:
        58,

      height:
        58,

      borderRadius:
        18,

      alignSelf:
        "center",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    intro: {
      alignItems:
        "center",

      gap:
        5,
    },

    question: {
      fontSize:
        18,

      fontWeight:
        "900",

      textAlign:
        "center",
    },

    description: {
      maxWidth:
        450,

      fontSize:
        12,

      lineHeight:
        18,

      textAlign:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | MODULE
    |--------------------------------------------------------------------------
    */

    moduleBox: {
      minHeight:
        72,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        11,

      padding:
        12,

      borderWidth:
        1,

      borderRadius:
        12,
    },

    moduleIcon: {
      width:
        40,

      height:
        40,

      borderRadius:
        11,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    moduleInfo: {
      flex:
        1,

      minWidth:
        0,
    },

    moduleName: {
      fontSize:
        14,

      fontWeight:
        "900",
    },

    moduleDescription: {
      marginTop:
        2,

      fontSize:
        10,

      lineHeight:
        14,
    },

    /*
    |--------------------------------------------------------------------------
    | FORMS
    |--------------------------------------------------------------------------
    */

    section: {
      gap:
        10,
    },

    sectionHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        9,
    },

    linkIcon: {
      width:
        34,

      height:
        34,

      borderRadius:
        9,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    sectionHeaderText: {
      flex:
        1,
    },

    sectionTitle: {
      fontSize:
        13,

      fontWeight:
        "800",
    },

    sectionSubtitle: {
      marginTop:
        1,

      fontSize:
        10,

      lineHeight:
        14,
    },

    formsScroll: {
      maxHeight:
        220,
    },

    forms: {
      borderWidth:
        1,

      borderRadius:
        11,

      overflow:
        "hidden",
    },

    formRow: {
      minHeight:
        54,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,

      paddingHorizontal:
        11,

      paddingVertical:
        8,
    },

    formIcon: {
      width:
        32,

      height:
        32,

      borderRadius:
        8,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    formInfo: {
      flex:
        1,

      minWidth:
        0,
    },

    formName: {
      fontSize:
        12,

      fontWeight:
        "700",
    },

    formRoute: {
      marginTop:
        1,

      fontSize:
        9,
    },

    /*
    |--------------------------------------------------------------------------
    | NO RELATIONS
    |--------------------------------------------------------------------------
    */

    noRelations: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        9,

      padding:
        12,

      borderWidth:
        1,

      borderRadius:
        11,
    },

    noRelationsText: {
      flex:
        1,

      fontSize:
        11,
    },

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    */

    important: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        10,

      padding:
        12,

      borderWidth:
        1,

      borderRadius:
        11,
    },

    importantText: {
      flex:
        1,

      minWidth:
        0,
    },

    importantTitle: {
      fontSize:
        12,

      fontWeight:
        "900",
    },

    importantDescription: {
      marginTop:
        3,

      fontSize:
        10,

      lineHeight:
        15,
    },

    /*
    |--------------------------------------------------------------------------
    | DELETING
    |--------------------------------------------------------------------------
    */

    deleting: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        11,

      padding:
        12,

      borderWidth:
        1,

      borderRadius:
        11,
    },

    deletingText: {
      flex:
        1,
    },

    deletingTitle: {
      fontSize:
        12,

      fontWeight:
        "900",
    },

    deletingDescription: {
      marginTop:
        2,

      fontSize:
        10,

      lineHeight:
        14,
    },

    /*
    |--------------------------------------------------------------------------
    | FOOTER
    |--------------------------------------------------------------------------
    */

    footer: {
      width:
        "100%",

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      justifyContent:
        "flex-end",

      gap:
        10,
    },
  });

export default DeleteModuloModal;