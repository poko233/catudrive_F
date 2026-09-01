import React, { useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../theme/useTheme";

interface Tab {
  key: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={[styles.wrapper, { borderBottomColor: c.border }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={[
                styles.tab,
                isActive && { borderBottomColor: c.primary, borderBottomWidth: 2 },
              ]}
            >
              <Text
                style={[
                  styles.label,
                  { color: isActive ? c.primary : c.textMuted },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
});
