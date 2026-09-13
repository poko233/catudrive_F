import { Key, User } from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../../../theme/useTheme";
import { getStepTransition } from "../animations/register.animations";
import type { RegisterFormData } from "../types/register.types";
import { FormInput } from "./FormInput";
import { RoleChips } from "./RoleChips";
import { StepHeader } from "./StepHeader";

interface Step1Props {
  form: RegisterFormData;
  errors: Record<string, string>;
  onFieldChange: (field: keyof RegisterFormData, value: any) => void;
  roles: { rol: string; id: number }[];
  rolesLoading: boolean;
  direction: "forward" | "backward";
}

export const Step1CuentaRoles: React.FC<Step1Props> = ({
  form,
  errors,
  onFieldChange,
  roles,
  rolesLoading,
  direction,
}) => {
  const { theme } = useTheme();
  const transition = getStepTransition(direction);

  // Lista de campos para aplicar stagger
  const fields = [
    <FormInput
      key="usuario"
      label="Usuario"
      icon={User}
      value={form.usuario}
      onChangeText={(t) => onFieldChange("usuario", t)}
      error={errors.usuario}
      maxLength={40}
      required
    />,
    <FormInput
      key="password"
      label="Contraseña"
      icon={Key}
      value={form.password}
      onChangeText={(t) => onFieldChange("password", t)}
      secureTextEntry
      error={errors.password}
      required
    />,
    rolesLoading ? (
      <View key="roles-loading" style={{ marginTop: 8 }}>
        <RoleChips roles={[]} selected={[]} onToggle={() => {}} />
      </View>
    ) : (
      <RoleChips
        key="roles"
        roles={roles}
        selected={form.roles}
        onToggle={(roleName) => {
          const newRoles = form.roles.includes(roleName)
            ? form.roles.filter((r) => r !== roleName)
            : [...form.roles, roleName];
          onFieldChange("roles", newRoles);
        }}
        error={errors.roles}
      />
    ),
  ];

  return (
    <MotiView
      from={transition.from}
      animate={transition.animate}
      exit={transition.exit}
      transition={transition.transition}
      exitTransition={transition.exitTransition}
      style={styles.container}
    >
      <StepHeader
        title="Cuenta y Roles"
        description="Configure las credenciales de acceso y los roles del usuario."
      />
      {fields.map((child, index) => (
        <MotiView
          key={child.key || index}
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 200, delay: index * 60 }}
        >
          {child}
        </MotiView>
      ))}
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
