import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../theme/useTheme";

export type AdminTabKey =
  | "permisos"
  | "roles"
  | "modulos"
  | "formularios"
  | "formularioModulo"
  | "moduloRol"
  | "empresa";

interface AdminTab {
  key: AdminTabKey;
  label: string;
}

interface AdminTabBarProps {
  tabs: AdminTab[];
  activeTab: AdminTabKey;
  onChangeTab: (tab: AdminTabKey) => void;
}

export function AdminTabBar({ tabs, activeTab, onChangeTab }: AdminTabBarProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.container, { borderBottomColor: c.border, backgroundColor: c.card }]}> 
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChangeTab(tab.key)}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? c.primary : c.secondary,
                  borderColor: active ? c.primary : c.border,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? c.primaryForeground : c.text,
                  fontWeight: active ? "700" : "600",
                }}
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
  container: {
    borderBottomWidth: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  tab: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
