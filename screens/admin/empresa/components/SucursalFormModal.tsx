// screens/admin/empresa/components/SucursalFormModal.tsx

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  Button,
} from "@/components/ui/Button";

import {
  Input,
} from "@/components/ui/Input";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  Switch,
} from "@/components/ui/Switch";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  Sucursal,
  SucursalFormData,
} from "../types/sucursal.types";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface Props {
  visible: boolean;

  onClose: () => void;

  onSubmit: (
    data:
      SucursalFormData,
  ) =>
    Promise<boolean>;

  sucursal?:
    | Sucursal
    | null;

  empresaId: number;

  saving?: boolean;
}

/*
|--------------------------------------------------------------------------
| EMPTY
|--------------------------------------------------------------------------
*/

function emptyForm(
  empresaId: number,
): SucursalFormData {
  return {
    id_empresa:
      empresaId,

    sucursal:
      "",

    responsable:
      "",

    direccion:
      "",

    telefono:
      "",

    celular:
      "",

    email:
      "",

    estado:
      "Activo",
  };
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function SucursalFormModal({
  visible,

  onClose,

  onSubmit,

  sucursal,

  empresaId,

  saving = false,
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
    useState<SucursalFormData>(
      () =>
        emptyForm(
          empresaId,
        ),
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const editing =
    !!sucursal;

  /*
  |--------------------------------------------------------------------------
  | INIT
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (!visible) {
        return;
      }

      setError(
        "",
      );

      if (sucursal) {
        setForm({
          id_empresa:
            sucursal.id_empresa,

          sucursal:
            sucursal.sucursal,

          responsable:
            sucursal.responsable ??
            "",

          direccion:
            sucursal.direccion ??
            "",

          telefono:
            sucursal.telefono ??
            "",

          celular:
            sucursal.celular ??
            "",

          email:
            sucursal.email ??
            "",

          estado:
            sucursal.estado,
        });

        return;
      }

      setForm(
        emptyForm(
          empresaId,
        ),
      );
    },
    [
      visible,
      sucursal,
      empresaId,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | CAN SAVE
  |--------------------------------------------------------------------------
  */

  const canSave =
    useMemo(
      () =>
        form.sucursal
          .trim()
          .length >
          0 &&
        !saving,
      [
        form.sucursal,
        saving,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | SET
  |--------------------------------------------------------------------------
  */

  const setValue =
    <
      K extends keyof SucursalFormData,
    >(
      key: K,

      value:
        SucursalFormData[K],
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

      setError(
        "",
      );
    };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const submit =
    async () => {
      const nombre =
        form.sucursal.trim();

      if (!nombre) {
        setError(
          "El nombre de la sucursal es obligatorio.",
        );

        return;
      }

      const ok =
        await onSubmit({
          ...form,

          sucursal:
            nombre,

          responsable:
            form.responsable
              ?.trim() ??
            "",

          direccion:
            form.direccion
              ?.trim() ??
            "",

          telefono:
            form.telefono
              ?.trim() ??
            "",

          celular:
            form.celular
              ?.trim() ??
            "",

          email:
            form.email
              ?.trim()
              .toLowerCase() ??
            "",
        });

      if (ok) {
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
            editing
              ? "Guardar cambios"
              : "Crear sucursal"
          }
          loading={
            saving
          }
          disabled={
            !canSave
          }
          onPress={() => {
            void submit();
          }}
        />
      </View>
    );

  return (
    <Modal
      visible={
        visible
      }
      title={
        editing
          ? "Editar sucursal"
          : "Nueva sucursal"
      }
      onClose={
        onClose
      }
      closeOnBackdropPress={
        !saving
      }
      width="96%"
      maxWidth={620}
      footer={
        footer
      }
    >
      <ScrollView
        style={
          styles.body
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.content
        }
      >
        <Input
          label="Nombre de la sucursal"
          value={
            form.sucursal
          }
          placeholder="Ej: Matriz"
          error={
            error
          }
          onChangeText={(
            value,
          ) =>
            setValue(
              "sucursal",
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
          placeholder="Nombre del responsable"
          onChangeText={(
            value,
          ) =>
            setValue(
              "responsable",
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
              keyboardType="phone-pad"
              placeholder="4428480"
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
              keyboardType="phone-pad"
              placeholder="61608767"
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
          label="Correo electrónico"
          value={
            form.email ??
            ""
          }
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="correo@ejemplo.com"
          onChangeText={(
            value,
          ) =>
            setValue(
              "email",
              value,
            )
          }
        />

        <Input
          label="Dirección"
          value={
            form.direccion ??
            ""
          }
          placeholder="Calle, número, zona"
          onChangeText={(
            value,
          ) =>
            setValue(
              "direccion",
              value,
            )
          }
        />

        <View
          style={[
            styles.status,

            {
              backgroundColor:
                c.backgroundSecondary,

              borderColor:
                c.border,
            },
          ]}
        >
          <Switch
            label={
              form.estado ===
              "Activo"
                ? "Sucursal activa"
                : "Sucursal inactiva"
            }
            description={
              form.estado ===
              "Activo"
                ? "La sucursal está habilitada."
                : "La sucursal está deshabilitada."
            }
            value={
              form.estado ===
              "Activo"
            }
            onValueChange={(
              value,
            ) =>
              setValue(
                "estado",
                value
                  ? "Activo"
                  : "Inactivo",
              )
            }
          />
        </View>

        <ThemedText
          style={[
            styles.help,

            {
              color:
                c.textSecondary,
            },
          ]}
        >
          Los cambios se reflejan inmediatamente después de guardar.
        </ThemedText>
      </ScrollView>
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
    body: {
      maxHeight:
        620,
    },

    content: {
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
        200,

      minWidth:
        180,
    },

    status: {
      borderWidth:
        1,

      borderRadius:
        12,

      padding:
        12,
    },

    help: {
      fontSize:
        11,

      lineHeight:
        16,
    },

    footer: {
      width:
        "100%",

      flexDirection:
        "row",

      justifyContent:
        "flex-end",

      flexWrap:
        "wrap",

      gap:
        10,
    },
  });

export default SucursalFormModal;