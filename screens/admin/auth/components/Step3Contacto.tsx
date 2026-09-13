import { Home, Mail, Phone, Smartphone } from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { StyleSheet, View } from "react-native";
import { getStepTransition } from "../animations/register.animations";
import type { RegisterFormData } from "../types/register.types";
import { FormInput } from "./FormInput";
import { StepHeader } from "./StepHeader";

interface Step3Props {
  form: RegisterFormData;
  errors: Record<string, string>;
  onFieldChange: (field: keyof RegisterFormData, value: any) => void;
  direction: "forward" | "backward";
}

export const Step3Contacto: React.FC<Step3Props> = ({
  form,
  errors,
  onFieldChange,
  direction,
}) => {
  const transition = getStepTransition(direction);

  const fields = [
    <FormInput
      key="email"
      label="Correo Electrónico"
      icon={Mail}
      value={form.email}
      onChangeText={(t) => onFieldChange("email", t)}
      error={errors.email}
      keyboardType="email-address"
      maxLength={80}
    />,
    <View key="telefonos" style={styles.row}>
      <View style={styles.half}>
        <FormInput
          label="Teléfono Fijo"
          icon={Phone}
          value={form.telefono}
          onChangeText={(t) => onFieldChange("telefono", t)}
          error={errors.telefono}
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>
      <View style={styles.half}>
        <FormInput
          label="Celular"
          icon={Smartphone}
          value={form.celular}
          onChangeText={(t) => onFieldChange("celular", t)}
          error={errors.celular}
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>
    </View>,
    <FormInput
      key="direccion"
      label="Dirección Domiciliaria"
      icon={Home}
      value={form.direccion}
      onChangeText={(t) => onFieldChange("direccion", t)}
      error={errors.direccion}
      multiline
      maxLength={50}
    />,
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
        title="Contacto"
        description="Añada la información de contacto y dirección."
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
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
});
