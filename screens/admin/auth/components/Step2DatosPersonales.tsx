import { IdCard, User } from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { StyleSheet, View } from "react-native";
import { getStepTransition } from "../animations/register.animations";
import { DatePickerField } from "../components/DatePickerField";
import type { RegisterFormData } from "../types/register.types";
import { FormInput } from "./FormInput";
import { FormSelect } from "./FormSelect";
import { GenderRadio } from "./GenderRadio";
import { StepHeader } from "./StepHeader";

const EXPEDIDO_OPTIONS = [
  { label: "La Paz (LPZ)", value: "LPZ" },
  { label: "Cochabamba (CBBA)", value: "CBBA" },
  { label: "Oruro (OR)", value: "OR" },
  { label: "Potosí (PT)", value: "PT" },
  { label: "Tarija (TJ)", value: "TJ" },
  { label: "Santa Cruz (SCZ)", value: "SCZ" },
  { label: "Beni (BN)", value: "BN" },
  { label: "Pando (PD)", value: "PD" },
  { label: "Chuquisaca (CH)", value: "CH" },
  { label: "QR (QR)", value: "QR" },
  { label: "Extranjero (EXT)", value: "EXT" },
];

interface Step2Props {
  form: RegisterFormData;
  errors: Record<string, string>;
  onFieldChange: (field: keyof RegisterFormData, value: any) => void;
  direction: "forward" | "backward";
}

export const Step2DatosPersonales: React.FC<Step2Props> = ({
  form,
  errors,
  onFieldChange,
  direction,
}) => {
  const transition = getStepTransition(direction);

  // Lista de campos con stagger
  const fields = [
    <FormInput
      key="nombres"
      label="Nombres"
      icon={User}
      value={form.nombres}
      onChangeText={(t) => onFieldChange("nombres", t)}
      error={errors.nombres}
      maxLength={40}
      required
    />,
    <View key="apellidos" style={styles.row}>
      <View style={styles.half}>
        <FormInput
          label="Apellido Paterno"
          value={form.apellidoPaterno}
          onChangeText={(t) => onFieldChange("apellidoPaterno", t)}
          error={errors.apellidoPaterno}
          maxLength={50}
          required
        />
      </View>
      <View style={styles.half}>
        <FormInput
          label="Apellido Materno"
          value={form.apellidoMaterno}
          onChangeText={(t) => onFieldChange("apellidoMaterno", t)}
          error={errors.apellidoMaterno}
          maxLength={50}
        />
      </View>
    </View>,
    <View key="ci-exp" style={styles.row}>
      <View style={styles.half}>
        <FormInput
          label="Cédula de Identidad"
          icon={IdCard}
          value={form.ci}
          onChangeText={(t) => onFieldChange("ci", t)}
          error={errors.ci}
          maxLength={12}
          keyboardType="numeric"
          required
        />
      </View>
      <View style={styles.half}>
        <FormSelect
          label="Expedido en"
          value={form.expedido}
          options={EXPEDIDO_OPTIONS}
          onSelect={(val) => onFieldChange("expedido", val)}
          placeholder="Seleccione..."
          error={errors.expedido}
          required
        />
      </View>
    </View>,
    <View key="genero-fecha" style={styles.row}>
      <View style={styles.half}>
        <GenderRadio
          value={form.genero}
          onChange={(val) => onFieldChange("genero", val)}
          error={errors.genero}
        />
      </View>
      <View style={styles.half}>
        <DatePickerField
          label="Fecha de Nacimiento"
          value={form.fecha_nac || null}
          onChange={(isoDate) => onFieldChange("fecha_nac", isoDate)}
          error={errors.fecha_nac}
        />
      </View>
    </View>,
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
        title="Datos Personales"
        description="Complete los datos personales y de identificación."
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
