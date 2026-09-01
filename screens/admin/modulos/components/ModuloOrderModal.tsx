import {
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react-native";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  IconButton,
} from "@/components/ui/IconButton";

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

  modulos:
    Modulo[];

  saving: boolean;

  onClose: () => void;

  onSave: (
    ids:
      number[],
  ) =>
    Promise<boolean>;
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function ModuloOrderModal({
  visible,
  modulos,
  saving,
  onClose,
  onSave,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const [
    items,
    setItems,
  ] =
    useState<
      Modulo[]
    >(
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | ORDEN ORIGINAL
  |--------------------------------------------------------------------------
  */

  const originalIds =
    useMemo(
      () =>
        [...modulos]
          .sort(
            (
              a,
              b,
            ) =>
              Number(
                a.orden ??
                  0,
              ) -
              Number(
                b.orden ??
                  0,
              ),
          )
          .map(
            (
              item,
            ) =>
              item.id,
          ),
      [
        modulos,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | INIT
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !visible
      ) {
        return;
      }

      setItems(
        [...modulos]
          .sort(
            (
              a,
              b,
            ) =>
              Number(
                a.orden ??
                  0,
              ) -
              Number(
                b.orden ??
                  0,
              ),
          )
          .map(
            (
              item,
              index,
            ) => ({
              ...item,

              orden:
                index +
                1,
            }),
          ),
      );
    },
    [
      visible,
      modulos,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | ACTUAL IDS
  |--------------------------------------------------------------------------
  */

  const currentIds =
    useMemo(
      () =>
        items.map(
          (
            item,
          ) =>
            item.id,
        ),
      [
        items,
      ],
    );

  const changed =
    JSON.stringify(
      originalIds,
    ) !==
    JSON.stringify(
      currentIds,
    );

  /*
  |--------------------------------------------------------------------------
  | MOVE
  |--------------------------------------------------------------------------
  */

  const move =
    (
      index: number,
      direction:
        -1 | 1,
    ) => {
      if (
        saving
      ) {
        return;
      }

      const target =
        index +
        direction;

      if (
        target <
          0 ||
        target >=
          items.length
      ) {
        return;
      }

      setItems(
        (
          current,
        ) => {
          const next =
            [
              ...current,
            ];

          [
            next[index],
            next[target],
          ] = [
            next[target],
            next[index],
          ];

          return next.map(
            (
              item,
              newIndex,
            ) => ({
              ...item,

              orden:
                newIndex +
                1,
            }),
          );
        },
      );
    };

  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  const handleSave =
    async () => {
      if (
        !changed ||
        saving
      ) {
        return;
      }

      const ok =
        await onSave(
          currentIds,
        );

      if (
        ok
      ) {
        onClose();
      }
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
            saving
          }
          onPress={
            onClose
          }
        />

        <Button
          title={
            changed
              ? "Guardar orden"
              : "Sin cambios"
          }
          loading={
            saving
          }
          disabled={
            saving ||
            !changed
          }
          onPress={() => {
            void handleSave();
          }}
        />
      </View>
    );

  return (
    <Modal
      visible={
        visible
      }
      title="Ordenar Sidebar"
      width="94%"
      maxWidth={560}
      onClose={
        onClose
      }
      closeOnBackdropPress={
        !saving
      }
      footer={
        footer
      }
    >
      <View
        style={
          styles.content
        }
      >
        <ThemedText
          style={[
            styles.description,

            {
              color:
                c.textSecondary,
            },
          ]}
        >
          Define el orden global en que los módulos aparecerán en el menú lateral.
        </ThemedText>

        <View
          style={
            styles.list
          }
        >
          {items.map(
            (
              modulo,
              index,
            ) => (
              <View
                key={
                  modulo.id
                }
                style={[
                  styles.row,

                  {
                    backgroundColor:
                      c.backgroundSecondary,

                    borderColor:
                      c.border,
                  },
                ]}
              >
                <View
                  style={
                    styles.dragIcon
                  }
                >
                  <GripVertical
                    size={18}
                    color={
                      c.textMuted
                    }
                  />
                </View>

                <Badge
                  label={
                    String(
                      index +
                        1,
                    )
                  }
                  variant="info"
                />

                <View
                  style={
                    styles.info
                  }
                >
                  <ThemedText
                    numberOfLines={
                      1
                    }
                    style={
                      styles.name
                    }
                  >
                    {
                      modulo.modulo
                    }
                  </ThemedText>

                  <ThemedText
                    numberOfLines={
                      1
                    }
                    style={[
                      styles.secondary,

                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    {modulo.estado ??
                      "Activo"}
                  </ThemedText>
                </View>

                <View
                  style={
                    styles.actions
                  }
                >
                  <IconButton
                    icon={
                      ChevronUp
                    }
                    size="sm"
                    variant="secondary"
                    disabled={
                      saving ||
                      index ===
                        0
                    }
                    accessibilityLabel={`Subir ${modulo.modulo}`}
                    onPress={() =>
                      move(
                        index,
                        -1,
                      )
                    }
                  />

                  <IconButton
                    icon={
                      ChevronDown
                    }
                    size="sm"
                    variant="secondary"
                    disabled={
                      saving ||
                      index ===
                        items.length -
                          1
                    }
                    accessibilityLabel={`Bajar ${modulo.modulo}`}
                    onPress={() =>
                      move(
                        index,
                        1,
                      )
                    }
                  />
                </View>
              </View>
            ),
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    content: {
      gap:
        14,
    },

    description: {
      fontSize:
        12,

      lineHeight:
        18,
    },

    list: {
      gap:
        7,
    },

    row: {
      minHeight:
        58,

      borderWidth:
        1,

      borderRadius:
        11,

      paddingHorizontal:
        10,

      paddingVertical:
        7,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        9,
    },

    dragIcon: {
      width:
        22,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    info: {
      flex:
        1,

      minWidth:
        0,
    },

    name: {
      fontSize:
        13,

      fontWeight:
        "800",
    },

    secondary: {
      marginTop:
        1,

      fontSize:
        10,
    },

    actions: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        5,
    },

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
        8,
    },
  });

export default ModuloOrderModal;