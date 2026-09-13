import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../../../../components/ThemedText";
import { useTheme } from "../../../../theme/useTheme";

interface StepHeaderProps {
  title: string;
  description: string;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  title,
  description,
}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <ThemedText
        style={{ fontSize: 20, fontWeight: "700", color: theme.colors.text }}
      >
        {title}
      </ThemedText>
      <ThemedText
        style={{
          fontSize: 14,
          color: theme.colors.textSecondary,
          marginTop: 4,
        }}
      >
        {description}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
});
