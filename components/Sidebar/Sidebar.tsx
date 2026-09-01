// components/Sidebar/Sidebar.tsx
import { getIonicon } from "@/screens/admin/modulos/types/modulo.types";
import { Ionicons } from "@expo/vector-icons";
import { Href, usePathname, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useAuth } from "@/store/authStore";
import { useResponsive } from "../../hooks/useResponsive";
import {
  MiFormulario,
  MiModulo,
  useModulesStore,
} from "../../store/modulesStore";
import { useTheme } from "../../theme/useTheme";
import { getTabsForRoles } from "../../utils/roleBasedTabs";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarCompanySelector } from "./SidebarCompanySelector";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ──────────────────────────────────────────────
   MiniTooltip interno (no usa el componente Tooltip)
────────────────────────────────────────────── */
const MiniTooltip: React.FC<{
  text: string;
  children: React.ReactNode;
  position?: "top" | "right" | "bottom" | "left";
  disabled?: boolean; // <-- Nueva propiedad
}> = ({ text, children, position = "right", disabled = false }) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);

  // Si está deshabilitado, renderiza el contenido directamente sin el wrapper ni tooltip
  if (disabled) {
    return <>{children}</>;
  }

  const getPosition = (): any => {
    switch (position) {
      case "top":
        return {
          bottom: "100%",
          left: "50%",
          transform: [{ translateX: "-50%" }],
          marginBottom: 6,
        };
      case "bottom":
        return {
          top: "100%",
          left: "50%",
          transform: [{ translateX: "-50%" }],
          marginTop: 6,
        };
      case "left":
        return {
          right: "100%",
          top: "50%",
          transform: [{ translateY: "-50%" }],
          marginRight: 8,
        };
      case "right":
        return {
          left: "100%",
          top: "50%",
          transform: [{ translateY: "-50%" }],
          marginLeft: 8,
        };
      default:
        return {
          left: "100%",
          top: "50%",
          transform: [{ translateY: "-50%" }],
          marginLeft: 8,
        };
    }
  };

  const hoverHandlers =
    Platform.OS === "web"
      ? {
          onMouseEnter: () => setVisible(true),
          onMouseLeave: () => setVisible(false),
        }
      : {};

  return (
    <View
      style={[
        styles.tooltipContainer,
        { zIndex: visible ? 9999 : 1, elevation: visible ? 8 : 0 },
      ]}
    >
      {visible && (
        <Animated.View
          entering={FadeIn.duration(120)}
          exiting={FadeOut.duration(80)}
          pointerEvents="none"
          style={[
            styles.tooltipBox,
            getPosition(),
            {
              backgroundColor: theme.colors.popover,
              borderColor: theme.colors.border,
              borderWidth: 1,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <Text style={[styles.tooltipText, { color: theme.colors.text }]}>
            {text}
          </Text>
        </Animated.View>
      )}
      <View {...(hoverHandlers as any)}>{children}</View>
    </View>
  );
};

/* ──────────────────────────────────────────────
   Sub-item (Formulario)
────────────────────────────────────────────── */
const FormularioItem: React.FC<{
  formulario: MiFormulario;
  onNavigate?: () => void;
  collapsed: boolean;
}> = ({ formulario, onNavigate, collapsed }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const pathname = usePathname();
  const isActive = formulario.ruta
    ? pathname === formulario.ruta || pathname.startsWith(formulario.ruta + "/")
    : false;
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconName = getIonicon(
    formulario.icono ?? "",
  ) as keyof typeof Ionicons.glyphMap;

  const handlePress = useCallback(() => {
    if (!formulario.ruta) return;
    onNavigate?.();
    router.push(formulario.ruta as Href);
  }, [formulario.ruta, onNavigate, router]);

  // Modo colapsado: círculo con inicial + tooltip
  if (collapsed) {
    return (
      <MiniTooltip text={formulario.nombre} position="right">
        <Pressable
          onPress={handlePress}
          onPressIn={() => (scale.value = withSpring(0.92))}
          onPressOut={() => (scale.value = withSpring(1))}
          style={[
            styles.collapsedCircleItem,
            isActive && { backgroundColor: c.primary + "18" },
          ]}
        >
          <Animated.View style={animStyle}>
            <Text
              style={[
                styles.circleText,
                { color: isActive ? c.primary : c.textSecondary },
              ]}
            >
              {formulario.nombre.charAt(0).toUpperCase()}
            </Text>
          </Animated.View>
        </Pressable>
      </MiniTooltip>
    );
  }

  // Modo extendido: texto + tooltip
  return (
    <MiniTooltip
      text={formulario.nombre}
      position="right"
      disabled={!collapsed}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => (scale.value = withSpring(0.97))}
        onPressOut={() => (scale.value = withSpring(1))}
        style={[
          styles.subItem,
          isActive && { backgroundColor: c.primary + "18" },
        ]}
      >
        <View
          style={[
            styles.subLine,
            { backgroundColor: isActive ? c.primary : c.border },
          ]}
        />
        <Ionicons
          name={iconName}
          size={14}
          color={isActive ? c.primary : c.textSecondary}
        />
        <Text
          style={[
            styles.subLabel,
            {
              color: isActive ? c.primary : c.textSecondary,
              fontWeight: isActive ? "700" : "500",
            },
          ]}
          numberOfLines={1}
        >
          {formulario.nombre}
        </Text>
        {isActive && (
          <View
            style={[styles.activeIndicator, { backgroundColor: c.primary }]}
          />
        )}
      </Pressable>
    </MiniTooltip>
  );
};

/* ──────────────────────────────────────────────
   Módulo item
────────────────────────────────────────────── */
const ModuloItem: React.FC<{
  modulo: MiModulo;
  onNavigate?: () => void;
  collapsed: boolean;
}> = ({ modulo, onNavigate, collapsed }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const pathname = usePathname();

  const hasChildren = modulo.formularios.length > 0;
  const anyChildActive = modulo.formularios.some(
    (f) => f.ruta && (pathname === f.ruta || pathname.startsWith(f.ruta + "/")),
  );
  const [expanded, setExpanded] = useState(anyChildActive);
  const href = `/${(modulo.nombre ?? "").toLowerCase().replace(/\s+/g, "-")}`;
  const isActive =
    !hasChildren && (pathname === href || pathname.startsWith(href + "/"));

  const scale = useSharedValue(1);
  const chevron = useSharedValue(expanded ? 1 : 0);
  const iconName = getIonicon(modulo.icono) as keyof typeof Ionicons.glyphMap;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevron.value * 180}deg` }],
  }));

  const handlePress = useCallback(() => {
    if (hasChildren) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      chevron.value = withTiming(expanded ? 0 : 1, { duration: 200 });
      setExpanded((v) => !v);
    } else {
      onNavigate?.();
      router.push(href as Href);
    }
  }, [hasChildren, expanded, href, onNavigate, router, chevron]);

  const rowActive = isActive || anyChildActive;

  // Modo colapsado: icono del módulo + tooltip, y al hacer clic despliega los formularios
  if (collapsed) {
    return (
      <View>
        <MiniTooltip text={modulo.nombre} position="right">
          <Pressable
            onPress={handlePress}
            onPressIn={() => (scale.value = withSpring(0.92))}
            onPressOut={() => (scale.value = withSpring(1))}
            style={[
              styles.collapsedModuleItem,
              rowActive && { backgroundColor: c.primary + "18" },
            ]}
          >
            <Animated.View style={animStyle}>
              <Ionicons
                name={iconName}
                size={22}
                color={rowActive ? c.primary : c.textSecondary}
              />
            </Animated.View>
          </Pressable>
        </MiniTooltip>

        {/* Cuando está colapsado y se expande, mostramos los formularios */}
        {expanded && hasChildren && (
          <View style={styles.collapsedSubList}>
            {modulo.formularios.map((f) => (
              <FormularioItem
                key={f.id}
                formulario={f}
                onNavigate={onNavigate}
                collapsed={collapsed}
              />
            ))}
          </View>
        )}
      </View>
    );
  }

  // Modo extendido
  return (
    <View>
      <Animated.View style={animStyle}>
        <Pressable
          onPress={handlePress}
          onPressIn={() => (scale.value = withSpring(0.97))}
          onPressOut={() => (scale.value = withSpring(1))}
          style={[
            styles.moduleItem,
            rowActive && !hasChildren && { backgroundColor: c.primary },
            rowActive && hasChildren && { backgroundColor: c.primary + "12" },
          ]}
        >
          <View
            style={[
              styles.moduleIconWrap,
              { backgroundColor: rowActive ? c.primary + "20" : c.input },
            ]}
          >
            <Ionicons
              name={iconName}
              size={18}
              color={rowActive ? c.primary : c.textSecondary}
            />
          </View>
          <Text
            style={[
              styles.moduleLabel,
              {
                color: rowActive && !hasChildren ? c.primaryForeground : c.text,
                fontWeight: rowActive ? "700" : "500",
              },
            ]}
            numberOfLines={1}
          >
            {modulo.nombre}
          </Text>
          {hasChildren && (
            <Animated.View style={chevronStyle}>
              <Ionicons
                name="chevron-down"
                size={14}
                color={anyChildActive ? c.primary : c.muted}
              />
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>

      {hasChildren && expanded && (
        <View style={styles.subList}>
          {modulo.formularios.map((f) => (
            <FormularioItem
              key={f.id}
              formulario={f}
              onNavigate={onNavigate}
              collapsed={collapsed}
            />
          ))}
        </View>
      )}
    </View>
  );
};

/* ──────────────────────────────────────────────
   Sidebar principal
────────────────────────────────────────────── */
interface SidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { modulos, loading, error, fetchModulos } = useModulesStore();
  const { user } = useAuth();
  const { isDesktop } = useResponsive();

  const tabs = getTabsForRoles(user?.roles.map((r) => r.rol) ?? []);
  const homeRoute = tabs.length > 0 ? `/${tabs[0].name}` : "/perfil";

  const sidebarWidth = useSharedValue(collapsed ? 72 : 240);
  useEffect(() => {
    sidebarWidth.value = withTiming(collapsed ? 72 : 240, { duration: 250 });
  }, [collapsed, sidebarWidth]);

  const animatedSidebarStyle = useAnimatedStyle(() => ({
    width: sidebarWidth.value,
  }));

  return (
    <Animated.View
      style={[
        styles.sidebar,
        animatedSidebarStyle,
        {
          backgroundColor: c.card,
          borderRightColor: c.border,
          borderRightWidth: 1,
        },
        !isDesktop && { flex: 1, width: "100%" },
      ]}
    >
      {/* Botón toggle en el lado EXTERNO (fuera del sidebar) */}
      <Pressable
        onPress={onToggleCollapse}
        style={({ pressed }) => [
          styles.toggleButton,
          {
            backgroundColor: pressed ? c.primarySubtle : c.card,
            borderColor: c.border,
          },
        ]}
      >
        {collapsed ? (
          <ChevronRight size={16} color={c.textSecondary} />
        ) : (
          <ChevronLeft size={16} color={c.textSecondary} />
        )}
      </Pressable>

      {/* Selector de empresa */}
      {!collapsed && <SidebarCompanySelector collapsed={collapsed} />}
      {collapsed && (
        <View style={styles.collapsedCompany}>
          <Ionicons name="storefront-outline" size={22} color={c.primary} />
        </View>
      )}

      {/* Header del usuario (solo foto + nombre, sin roles) */}
      <SidebarHeader collapsed={collapsed} />

      {/* Lista de módulos */}
      <ScrollView
        style={{ flex: 1, overflow: "visible" }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={(styles.nav, { overflow: "visible" })}
      >
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={c.primary} />
            {!collapsed && (
              <Text style={[styles.loadingText, { color: c.textSecondary }]}>
                Cargando…
              </Text>
            )}
          </View>
        )}

        {!loading && error && (
          <Pressable
            onPress={() => fetchModulos()}
            style={[
              styles.errorBox,
              { backgroundColor: "#FFF1F2", borderColor: "#FECDD3" },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={16} color="#E11D48" />
            {!collapsed && (
              <Text style={[styles.errorText, { color: "#E11D48" }]}>
                {error}
              </Text>
            )}
            <Ionicons
              name="refresh-outline"
              size={16}
              color="#E11D48"
              style={{ marginLeft: "auto" }}
            />
          </Pressable>
        )}

        {!loading && !error && modulos.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="grid-outline" size={32} color={c.muted} />
            {!collapsed && (
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                Sin módulos
              </Text>
            )}
          </View>
        )}

        {!loading &&
          !error &&
          modulos.map((modulo) => (
            <ModuloItem
              key={modulo.id}
              modulo={modulo}
              onNavigate={onNavigate}
              collapsed={collapsed}
            />
          ))}
      </ScrollView>

      <SidebarFooter collapsed={collapsed} />
    </Animated.View>
  );
};

/* ───────────────── Estilos ───────────────── */
const styles = StyleSheet.create({
  sidebar: {
    overflow: "visible",
    zIndex: 100,
    elevation: 10,
  },
  toggleButton: {
    position: "absolute",
    top: 32,
    right: -17, // <-- Ajustado al nuevo ancho
    zIndex: -1,
    width: 17, // <-- Más delgado
    height: 34, // <-- Más bajo (el doble del ancho para mantener el semicírculo)
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderLeftWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 2,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: -1,
  },
  collapsedCompany: {
    alignItems: "center",
    paddingVertical: 14,
  },
  collapsedModuleItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginVertical: 2,
    borderRadius: 10,
  },
  collapsedCircleItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
    marginVertical: 4,
  },
  collapsedSubList: {
    alignItems: "center",
    gap: 2,
    marginVertical: 4,
  },
  tooltipContainer: {
    position: "relative",
  },
  tooltipBox: {
    position: "absolute",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  circleText: {
    fontSize: 12,
    fontWeight: "800",
  },
  subItemWrapper: {
    alignItems: "flex-start",
    paddingLeft: 34,
    paddingVertical: 5,
  },
  nav: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
  },
  moduleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  moduleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  subList: {
    marginLeft: 0,
    marginTop: 2,
    marginBottom: 4,
    gap: 2,
  },
  subItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  subLine: {
    width: 2,
    height: 12,
    borderRadius: 2,
  },
  subLabel: {
    flex: 1,
    fontSize: 12,
  },
  activeIndicator: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  center: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: { fontSize: 11 },
  emptyText: { fontSize: 12, textAlign: "center" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    margin: 4,
  },
  errorText: { fontSize: 11, flex: 1 },
});
