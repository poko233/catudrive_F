// screens/admin/forms/DeleteFormularioModal.tsx

import {
  AlertTriangle,
} from "lucide-react-native";

import {
  StyleSheet,
  View,
} from "react-native";

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
  Modal,
} from "@/components/ui/Modal";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  AdminFormulario,
} from "../types/admin.types";

type Props = {
  visible: boolean;

  formulario:
    | AdminFormulario
    | null;

  deleting: boolean;

  onClose: () => void;

  onConfirm:
    () =>
      void
      | Promise<void>;
};

export function DeleteFormularioModal({
  visible,
  formulario,
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

  if (
    !formulario
  ) {
    return null;
  }

  const modulos =
    formulario.modulos ??
    [];

  return (
    <Modal
      visible={
        visible
      }
      title="Eliminar formulario"
      width="94%"
      maxWidth={560}
      onClose={
        onClose
      }
      closeOnBackdropPress={
        !deleting
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
              deleting
            }
            onPress={
              onClose
            }
          />

          <Button
            title="Eliminar formulario"
            variant="destructive"
            loading={
              deleting
            }
            disabled={
              deleting
            }
            onPress={() => {
              void onConfirm();
            }}
          />
        </View>
      }
    >
      <View
        style={
          styles.content
        }
      >
        {/* ============================================= */}
        {/* ALERTA */}
        {/* ============================================= */}

        <View
          style={[
            styles.warning,

            {
              borderColor:
                c.destructive,

              backgroundColor:
                c.backgroundSecondary,
            },
          ]}
        >
          <View
            style={
              styles.warningIcon
            }
          >
            <AlertTriangle
              size={22}
              color={
                c.destructive
              }
            />
          </View>

          <View
            style={
              styles.warningText
            }
          >
            <ThemedText
              style={[
                styles.warningTitle,

                {
                  color:
                    c.destructive,
                },
              ]}
            >
              Esta acción es permanente
            </ThemedText>

            <ThemedText
              style={[
                styles.warningDescription,

                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              El formulario y sus relaciones de permisos serán eliminados del sistema.
            </ThemedText>
          </View>
        </View>

        {/* ============================================= */}
        {/* FORMULARIO */}
        {/* ============================================= */}

        <View
          style={[
            styles.infoCard,

            {
              borderColor:
                c.border,

              backgroundColor:
                c.backgroundSecondary,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.label,

              {
                color:
                  c.textMuted,
              },
            ]}
          >
            FORMULARIO
          </ThemedText>

          <ThemedText
            style={
              styles.formularioName
            }
          >
            {
              formulario.formulario
            }
          </ThemedText>

          <View
            style={
              styles.meta
            }
          >
            <Badge
              label={
                formulario.estado ??
                "Activo"
              }
              variant={
                formulario.estado ===
                "Activo"
                  ? "success"
                  : "muted"
              }
            />

            {formulario.ruta ? (
              <Badge
                label={
                  formulario.ruta
                }
                variant="info"
              />
            ) : null}
          </View>
        </View>

        {/* ============================================= */}
        {/* MÓDULOS */}
        {/* ============================================= */}

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
            <ThemedText
              style={
                styles.sectionTitle
              }
            >
              Módulos vinculados
            </ThemedText>

            <Badge
              label={
                String(
                  modulos.length,
                )
              }
              variant={
                modulos.length >
                0
                  ? "info"
                  : "muted"
              }
            />
          </View>

          {modulos.length >
          0 ? (
            <View
              style={
                styles.chips
              }
            >
              {modulos.map(
                (
                  modulo,
                ) => (
                  <Badge
                    key={
                      modulo.id
                    }
                    label={
                      modulo.modulo
                    }
                    variant="info"
                  />
                ),
              )}
            </View>
          ) : (
            <ThemedText
              style={[
                styles.empty,

                {
                  color:
                    c.textMuted,
                },
              ]}
            >
              Este formulario no está vinculado a ningún módulo.
            </ThemedText>
          )}
        </View>

        {/* ============================================= */}
        {/* QUÉ SE ELIMINA */}
        {/* ============================================= */}

        <View
          style={[
            styles.details,

            {
              borderColor:
                c.border,
            },
          ]}
        >
          <ThemedText
            style={
              styles.detailsTitle
            }
          >
            Al continuar se eliminará:
          </ThemedText>

          <ThemedText
            style={[
              styles.detail,

              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            • El registro del formulario.
          </ThemedText>

          <ThemedText
            style={[
              styles.detail,

              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            • Sus relaciones con los módulos.
          </ThemedText>

          <ThemedText
            style={[
              styles.detail,

              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            • Los permisos RBAC asociados al formulario.
          </ThemedText>

          <ThemedText
            style={[
              styles.detail,

              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            • Sus reglas de Visibility.
          </ThemedText>

          <ThemedText
            style={[
              styles.modulesSafe,

              {
                color:
                  c.text,
              },
            ]}
          >
            Los módulos vinculados NO serán eliminados.
          </ThemedText>
        </View>
      </View>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    content: {
      gap:
        16,
    },

    warning: {
      borderWidth:
        1,

      borderRadius:
        12,

      padding:
        14,

      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        12,
    },

    warningIcon: {
      width:
        30,

      alignItems:
        "center",

      paddingTop:
        1,
    },

    warningText: {
      flex:
        1,

      minWidth:
        0,

      gap:
        3,
    },

    warningTitle: {
      fontSize:
        13,

      fontWeight:
        "900",
    },

    warningDescription: {
      fontSize:
        11,

      lineHeight:
        17,
    },

    infoCard: {
      borderWidth:
        1,

      borderRadius:
        12,

      padding:
        14,

      gap:
        7,
    },

    label: {
      fontSize:
        9,

      fontWeight:
        "900",

      letterSpacing:
        0.7,
    },

    formularioName: {
      fontSize:
        17,

      fontWeight:
        "900",
    },

    meta: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      alignItems:
        "center",

      gap:
        6,
    },

    section: {
      gap:
        9,
    },

    sectionHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        10,
    },

    sectionTitle: {
      fontSize:
        13,

      fontWeight:
        "900",
    },

    chips: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        6,
    },

    empty: {
      fontSize:
        11,
    },

    details: {
      borderTopWidth:
        1,

      paddingTop:
        14,

      gap:
        5,
    },

    detailsTitle: {
      fontSize:
        12,

      fontWeight:
        "900",

      marginBottom:
        3,
    },

    detail: {
      fontSize:
        11,

      lineHeight:
        17,
    },

    modulesSafe: {
      marginTop:
        7,

      fontSize:
        11,

      fontWeight:
        "800",
    },

    footer: {
      width:
        "100%",

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      alignItems:
        "center",

      justifyContent:
        "flex-end",

      gap:
        8,
    },
  });

export default DeleteFormularioModal;