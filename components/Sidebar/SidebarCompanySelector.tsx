// components/Sidebar/SidebarCompanySelector.tsx
import { Store } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useAuth } from "@/store/authStore";
import { useTheme } from "../../theme/useTheme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const SidebarCompanySelector: React.FC<{ collapsed?: boolean }> = ({
  collapsed = false,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { user, sucursalId, changeSucursal } = useAuth();
  const [sucursalExpanded, setSucursalExpanded] = useState(false);

  const sucursales = useMemo(() => user?.sucursales ?? [], [user?.sucursales]);
  const showSucursalSelector = sucursales.length > 1;
  const sucursalesDisponibles = sucursales.filter((s) => s.id !== sucursalId);
  const sucursalLabel =
    sucursales.find((s) => s.id === sucursalId)?.sucursal ?? "—";

  const toggleSucursal = useCallback(() => {
    if (!showSucursalSelector) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSucursalExpanded((v) => !v);
  }, [showSucursalSelector]);

  const handleSelectSucursal = useCallback(
    (id: number) => {
      setSucursalExpanded(false);
      changeSucursal(id);
    },
    [changeSucursal],
  );

  const sucursalAnimStyle = useAnimatedStyle(() => ({
    maxHeight: withTiming(sucursalExpanded ? 300 : 0, { duration: 200 }),
    opacity: withTiming(sucursalExpanded ? 1 : 0, { duration: 150 }),
  }));

  if (collapsed) {
    return (
      <Pressable
        onPress={toggleSucursal}
        disabled={!showSucursalSelector}
        style={styles.collapsedContainer}
      >
        <Store size={22} color={c.primary} strokeWidth={2.5} />
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { zIndex: sucursalExpanded ? 999 : 1 }]}>
      <View style={[styles.cardWrapper, { zIndex: 1 }]}>
        <Pressable
          onPress={toggleSucursal}
          disabled={!showSucursalSelector}
          style={({ pressed, hovered }) => [
            styles.cardBtn,
            {
              backgroundColor:
                pressed || hovered ? c.cardHover || "rgba(0,0,0,0.02)" : c.card,
              borderColor: c.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconBox,
              { backgroundColor: (c.primary as string) + "15" },
            ]}
          >
            <Store size={16} color={c.primary} strokeWidth={2.5} />
          </View>
          <View style={styles.textCol}>
            <Text style={[styles.labelText, { color: c.textSecondary }]}>
              SUCURSAL
            </Text>
            <Text
              style={[styles.valueText, { color: c.text }]}
              numberOfLines={1}
            >
              {sucursalLabel}
            </Text>
          </View>
          {showSucursalSelector && (
            <Store
              size={14}
              color={c.textSecondary}
              style={{
                transform: [{ rotate: sucursalExpanded ? "180deg" : "0deg" }],
              }}
            />
          )}
        </Pressable>

        {showSucursalSelector && (
          <Animated.View
            style={[
              styles.dropdownList,
              sucursalAnimStyle,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <View style={styles.dropdownInner}>
              {sucursalesDisponibles.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => handleSelectSucursal(s.id)}
                  style={({ pressed, hovered }) => [
                    styles.dropdownItem,
                    {
                      backgroundColor:
                        pressed || hovered
                          ? c.cardHover || "rgba(0,0,0,0.04)"
                          : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[styles.dropdownItemText, { color: c.text }]}
                    numberOfLines={1}
                  >
                    {s.sucursal}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  collapsedContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cardWrapper: {
    position: "relative",
  },
  cardBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    ...(Platform.OS === "web" ? { transition: "all 0.2s ease" } : {}),
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    justifyContent: "center",
    gap: 1,
  },
  labelText: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  valueText: {
    fontSize: 12,
    fontWeight: "800",
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    overflow: "hidden",
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownInner: {
    padding: 5,
  },
  dropdownItem: {
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 6,
    ...(Platform.OS === "web"
      ? { transition: "background-color 0.2s ease" }
      : {}),
  },
  dropdownItemText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
