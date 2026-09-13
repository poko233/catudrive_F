import { Check } from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "../../../../components/ThemedText";
import { useTheme } from "../../../../theme/useTheme";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
  descriptions?: string[];
  horizontal?: boolean;
  onStepPress?: (step: number) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  labels,
  descriptions,
  horizontal = false,
  onStepPress,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[horizontal ? styles.horizontal : styles.vertical]}>
      {Array.from({ length: totalSteps }).map((_, i) => {
        const isClickable = onStepPress && i !== currentStep;

        return (
          <Pressable
            key={i}
            style={horizontal ? styles.hStepRow : styles.vStepRow}
            onPress={() => isClickable && onStepPress(i)}
            disabled={!isClickable}
          >
            <View style={styles.indicatorColumn}>
              <MotiView
                animate={{
                  backgroundColor:
                    i <= currentStep ? c.primary : c.backgroundSecondary,
                  borderColor: i <= currentStep ? c.primary : c.border,
                }}
                transition={{ type: "timing", duration: 300 }}
                style={[styles.circle, { borderWidth: 2 }]}
              >
                {i < currentStep ? (
                  <Check size={14} color={c.primaryForeground} />
                ) : (
                  <ThemedText
                    style={{
                      color: i === currentStep ? c.primaryForeground : c.muted,
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    {i + 1}
                  </ThemedText>
                )}
              </MotiView>

              {!horizontal && i < totalSteps - 1 && (
                <MotiView
                  animate={{
                    backgroundColor: i < currentStep ? c.primary : c.border,
                  }}
                  style={[styles.line]}
                />
              )}
            </View>

            <View style={styles.textContainer}>
              <ThemedText
                style={[
                  styles.label,
                  {
                    color: i <= currentStep ? c.text : c.muted,
                    fontWeight: i === currentStep ? "700" : "500",
                  },
                ]}
              >
                {labels[i]}
              </ThemedText>

              {!horizontal && descriptions?.[i] && (
                <ThemedText
                  style={{
                    fontSize: 12,
                    color: i <= currentStep ? c.textSecondary : c.muted,
                    marginTop: 2,
                  }}
                >
                  {descriptions[i]}
                </ThemedText>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  vertical: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  vStepRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 70,
  },
  hStepRow: {
    flexDirection: "column",
    alignItems: "center",
    marginHorizontal: 8,
  },
  indicatorColumn: {
    alignItems: "center",
    marginRight: 12,
    width: 32,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: 4,
    zIndex: 1,
  },
  textContainer: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 28,
  },
  label: {
    fontSize: 14,
  },
});
