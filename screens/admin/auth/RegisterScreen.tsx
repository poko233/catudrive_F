import { LinearGradient } from "expo-linear-gradient";
import { Check, ChevronLeft, ChevronRight } from "lucide-react-native";
import { AnimatePresence } from "moti";
import { MotiPressable } from "moti/interactions";
import React from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ThemedText } from "../../../components/ThemedText";
import { useResponsive } from "../../../hooks/useResponsive";
import { useTheme } from "../../../theme/useTheme";
import { Step1CuentaRoles } from "./components/Step1CuentaRoles";
import { Step2DatosPersonales } from "./components/Step2DatosPersonales";
import { Step3Contacto } from "./components/Step3Contacto";
import { StepIndicator } from "./components/StepIndicator";
import { SuccessView } from "./components/SuccessView";
import { useRegisterWizard } from "./hooks/useRegisterWizard";
import { useRoles } from "./hooks/useRoles";

const STEP_LABELS = ["Cuenta & Roles", "Datos Personales", "Contacto"];
const STEP_DESCRIPTIONS = [
  "Configure las credenciales de acceso y los roles del usuario.",
  "Complete los datos personales y de identificación.",
  "Añada la información de contacto y dirección.",
];

export default function RegisterScreen() {
  const { theme } = useTheme();
  const { isDesktop, isMobile } = useResponsive();
  const wizard = useRegisterWizard();
  const { roles, loading: rolesLoading } = useRoles();

  const {
    step,
    direction,
    form,
    errors,
    updateField,
    goNext,
    goPrev,
    handleSubmit,
    submitting,
    serverError,
    successData,
    resetForm,
    isLastStep,
    isFirstStep,
  } = wizard;

  const renderStepContent = () => {
    if (successData) {
      return (
        <SuccessView userData={successData} onRegisterAnother={resetForm} />
      );
    }

    return (
      <AnimatePresence exitBeforeEnter={true}>
        {step === 0 && (
          <Step1CuentaRoles
            key="step0"
            form={form}
            errors={errors}
            onFieldChange={updateField}
            roles={roles}
            rolesLoading={rolesLoading}
            direction={direction}
          />
        )}
        {step === 1 && (
          <Step2DatosPersonales
            key="step1"
            form={form}
            errors={errors}
            onFieldChange={updateField}
            direction={direction}
          />
        )}
        {step === 2 && (
          <Step3Contacto
            key="step2"
            form={form}
            errors={errors}
            onFieldChange={updateField}
            direction={direction}
          />
        )}
      </AnimatePresence>
    );
  };

  const handleStepPress = (targetStep: number) => {
    if (targetStep === step) return;
    if (targetStep < step) {
      let current = step;
      while (current > targetStep) {
        goPrev();
        current--;
      }
    } else {
      let current = step;
      while (current < targetStep) {
        goNext();
        current++;
      }
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={Platform.OS === "ios" ? 40 : 60}
    >
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={styles.gradient}
      >
        <View style={[styles.mainContainer, isDesktop && styles.desktopRow]}>
          {/* Panel izquierdo */}
          <View
            style={[
              styles.leftPanel,
              { backgroundColor: theme.colors.card },
              isDesktop && { width: "33%", maxWidth: 360 },
            ]}
          >
            <View style={styles.header}>
              <ThemedText
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: 24,
                  fontWeight: "700",
                  marginBottom: 4,
                }}
              >
                Alta de Usuario
              </ThemedText>
              <ThemedText
                style={{ color: theme.colors.textSecondary, fontSize: 14 }}
              >
                Complete el formulario en 3 pasos.
              </ThemedText>
            </View>

            <StepIndicator
              currentStep={step}
              totalSteps={3}
              labels={STEP_LABELS}
              descriptions={STEP_DESCRIPTIONS}
              horizontal={isMobile}
              onStepPress={handleStepPress}
            />
          </View>

          {/* Panel derecho */}
          <View
            style={[
              styles.rightPanel,
              {
                backgroundColor: theme.colors.card,
                overflow: "hidden",
                borderTopColor: theme.colors.border,
              },
              isDesktop && { flex: 1, marginLeft: 16 },
            ]}
          >
            <View style={{ flex: 1, position: "relative" }}>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              >
                <View style={{ flex: 1 }}>{renderStepContent()}</View>
              </ScrollView>

              {!successData && (
                <View
                  style={[
                    styles.navigation,
                    { borderTopColor: theme.colors.border },
                  ]}
                >
                  {!isFirstStep && (
                    <MotiPressable
                      onPress={goPrev}
                      style={[
                        styles.navButton,
                        { backgroundColor: theme.colors.backgroundSecondary },
                      ]}
                    >
                      <ChevronLeft
                        size={18}
                        color={theme.colors.textSecondary}
                      />
                      <ThemedText style={{ color: theme.colors.textSecondary }}>
                        Anterior
                      </ThemedText>
                    </MotiPressable>
                  )}
                  <View style={{ flex: 1 }} />
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    {!isLastStep ? (
                      <MotiPressable
                        key="next"
                        onPress={goNext}
                        style={[
                          styles.navButton,
                          {
                            backgroundColor: theme.colors.primary,
                            minWidth: 120,
                          },
                        ]}
                      >
                        <ThemedText
                          style={{ color: theme.colors.primaryForeground }}
                        >
                          Siguiente
                        </ThemedText>
                        <ChevronRight
                          size={18}
                          color={theme.colors.primaryForeground}
                        />
                      </MotiPressable>
                    ) : (
                      <MotiPressable
                        key="finish"
                        onPress={handleSubmit}
                        style={[
                          styles.navButton,
                          {
                            backgroundColor: theme.colors.primary,
                            opacity: submitting ? 0.7 : 1,
                            minWidth: 120,
                          },
                        ]}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <ThemedText
                            style={{ color: theme.colors.primaryForeground }}
                          >
                            Registrando...
                          </ThemedText>
                        ) : (
                          <>
                            <ThemedText
                              style={{ color: theme.colors.primaryForeground }}
                            >
                              Finalizar
                            </ThemedText>
                            <Check
                              size={18}
                              color={theme.colors.primaryForeground}
                            />
                          </>
                        )}
                      </MotiPressable>
                    )}
                  </View>
                </View>
              )}

              {serverError && (
                <ThemedText
                  style={{
                    color: theme.colors.destructive,
                    textAlign: "center",
                    marginTop: 12,
                  }}
                >
                  {serverError}
                </ThemedText>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  mainContainer: {
    flex: 1,
    padding: 24,
  },
  desktopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  leftPanel: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  rightPanel: {
    borderRadius: 18,
    padding: 16,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderTopWidth: 1,
  },
  header: {
    marginBottom: 24,
  },
  navigation: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: "auto",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 6,
    minWidth: 100,
  },
});
