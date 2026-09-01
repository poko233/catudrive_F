// app/(app)/animations-showcase.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Switch,
  Dimensions,
  Platform,
  Modal,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";
import { MotiView } from "moti"; // ❌ Eliminamos AnimatePresence
import { LinearGradient } from "expo-linear-gradient";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import {
  Canvas,
  LinearGradient as SkiaLinearGradient,
  vec,
  Fill,
  RoundedRect,
  BackdropBlur,
  Circle,
  BlurMask,
  RuntimeShader,
  Skia,
} from "@shopify/react-native-skia";

// ── Módulo de animaciones (solo lo que realmente usamos) ────────────────
import { AnimatedBlock } from "../../components/ui/AnimatedBlock";
import { AnimatedExitBlock } from "../../components/ui/AnimatedExitBlock";
import { PressableAnimated } from "../../components/ui/PressableAnimated";
import { Shimmer } from "../../components/ui/Shimmer";
import {
  haptics,
  useShake,
  usePressAnimation,
  springConfig,
  TIMING_FAST,
  TIMING_MEDIUM,
  TIMING_SLOW,
  modalScale,
  bottomSheet,
  overlayFade,
} from "../../animations";

// ── Tipos ──────────────────────────────────────────────────────────────────
type PresetName =
  | "fadeIn"
  | "scaleIn"
  | "slideInUp"
  | "slideInDown"
  | "slideInLeft"
  | "slideInRight";

type ExitPresetName = "fadeOut" | "scaleOut" | "slideOutUp" | "slideOutDown";

const ENTRANCE_PRESETS: { label: string; preset: PresetName; icon: string }[] =
  [
    { label: "Fade In", preset: "fadeIn", icon: "eye-outline" },
    { label: "Scale In", preset: "scaleIn", icon: "expand-outline" },
    { label: "Slide Up", preset: "slideInUp", icon: "arrow-up-outline" },
    { label: "Slide Down", preset: "slideInDown", icon: "arrow-down-outline" },
    { label: "Slide Left", preset: "slideInLeft", icon: "arrow-back-outline" },
    {
      label: "Slide Right",
      preset: "slideInRight",
      icon: "arrow-forward-outline",
    },
  ];

const EXIT_PRESETS: { label: string; preset: ExitPresetName; icon: string }[] =
  [
    { label: "Fade Out", preset: "fadeOut", icon: "eye-off-outline" },
    { label: "Scale Out", preset: "scaleOut", icon: "contract-outline" },
    { label: "Slide Out Up", preset: "slideOutUp", icon: "arrow-up-outline" },
    {
      label: "Slide Out Down",
      preset: "slideOutDown",
      icon: "arrow-down-outline",
    },
  ];

const STAGGER_ITEMS = [
  { id: 1, label: "Elemento 1", color: "#3B82F6" },
  { id: 2, label: "Elemento 2", color: "#10B981" },
  { id: 3, label: "Elemento 3", color: "#F59E0B" },
  { id: 4, label: "Elemento 4", color: "#EF4444" },
  { id: 5, label: "Elemento 5", color: "#8B5CF6" },
];

// ── Componente de sección ──────────────────────────────────────────────────
interface SectionProps {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
}

function Section({ title, description, icon, children }: SectionProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <AnimatedBlock preset="fadeIn" style={styles.section}>
      <View style={[styles.sectionHeader, { borderBottomColor: c.border }]}>
        <View style={styles.sectionTitleRow}>
          <Ionicons
            name={icon as any}
            size={20}
            color={c.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
        </View>
        <Text style={[styles.sectionDesc, { color: c.textSecondary }]}>
          {description}
        </Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </AnimatedBlock>
  );
}

// ── MODAL DEMO ──────────────────────────────────────────────────────────────
type ModalPreset = "modalScale" | "bottomSheet" | "overlayFade";

function ModalDemo() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [visible, setVisible] = useState(false);
  const [preset, setPreset] = useState<ModalPreset>("modalScale");

  const presetMap = { modalScale, bottomSheet, overlayFade };

  const openModal = (p: ModalPreset) => {
    setPreset(p);
    setVisible(true);
    haptics.medium();
  };

  const closeModal = () => {
    setVisible(false);
    haptics.light();
  };

  return (
    <View>
      <View style={styles.modalButtonsRow}>
        {(["modalScale", "bottomSheet", "overlayFade"] as ModalPreset[]).map(
          (p) => (
            <PressableAnimated
              key={p}
              onPress={() => openModal(p)}
              style={[
                styles.modalButton,
                { backgroundColor: c.primary, flex: 1 },
              ]}
            >
              <Text style={styles.modalButtonText}>{p}</Text>
            </PressableAnimated>
          ),
        )}
      </View>

      <Modal
        transparent
        visible={visible}
        onRequestClose={closeModal}
        animationType="none"
      >
        <MotiView
          key="modal-overlay"
          from={overlayFade.from}
          animate={overlayFade.animate}
          exit={overlayFade.exit}
          transition={overlayFade.transition}
          exitTransition={overlayFade.exitTransition}
          style={[styles.modalOverlay, { backgroundColor: c.overlay }]}
        >
          <TouchableOpacity
            style={styles.modalOverlayTouch}
            activeOpacity={1}
            onPress={closeModal}
          >
            <MotiView
              from={presetMap[preset].from}
              animate={presetMap[preset].animate}
              exit={presetMap[preset].exit}
              transition={presetMap[preset].transition}
              exitTransition={presetMap[preset].exitTransition}
              style={[
                styles.modalContent,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: c.text }]}>
                Modal con preset {preset}
              </Text>
              <Text style={[styles.modalDesc, { color: c.textSecondary }]}>
                Esta animación usa el preset `{preset}` del módulo de
                animaciones.
              </Text>
              <PressableAnimated
                onPress={closeModal}
                style={[
                  styles.modalCloseButton,
                  { backgroundColor: c.primary },
                ]}
              >
                <Text style={styles.modalCloseButtonText}>Cerrar</Text>
              </PressableAnimated>
            </MotiView>
          </TouchableOpacity>
        </MotiView>
      </Modal>
    </View>
  );
}

// ── EXIT ANIMATIONS (sin AnimatePresence, Reanimated maneja la salida) ────
function ExitDemo() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [visible, setVisible] = useState(true);
  const [preset, setPreset] = useState<ExitPresetName>("fadeOut");
  const [duration, setDuration] = useState(TIMING_MEDIUM);
  const [delay, setDelay] = useState(0);

  return (
    <View>
      <View style={styles.exitControls}>
        <View style={styles.exitPresetRow}>
          {EXIT_PRESETS.map((p) => (
            <PressableAnimated
              key={p.preset}
              onPress={() => setPreset(p.preset)}
              style={[
                styles.exitPresetButton,
                {
                  backgroundColor:
                    preset === p.preset ? c.primary : c.backgroundSecondary,
                  borderColor: c.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.exitPresetText,
                  { color: preset === p.preset ? "#fff" : c.text },
                ]}
              >
                {p.label}
              </Text>
            </PressableAnimated>
          ))}
        </View>
        <View style={styles.exitDurationRow}>
          <Text style={[styles.exitDurationLabel, { color: c.text }]}>
            Duración:
          </Text>
          <PressableAnimated
            onPress={() => setDuration(TIMING_FAST)}
            style={[
              styles.exitDurationButton,
              {
                backgroundColor:
                  duration === TIMING_FAST ? c.primary : c.backgroundSecondary,
                borderColor: c.border,
              },
            ]}
          >
            <Text style={{ color: duration === TIMING_FAST ? "#fff" : c.text }}>
              Rápido
            </Text>
          </PressableAnimated>
          <PressableAnimated
            onPress={() => setDuration(TIMING_MEDIUM)}
            style={[
              styles.exitDurationButton,
              {
                backgroundColor:
                  duration === TIMING_MEDIUM
                    ? c.primary
                    : c.backgroundSecondary,
                borderColor: c.border,
              },
            ]}
          >
            <Text
              style={{ color: duration === TIMING_MEDIUM ? "#fff" : c.text }}
            >
              Medio
            </Text>
          </PressableAnimated>
          <PressableAnimated
            onPress={() => setDuration(TIMING_SLOW)}
            style={[
              styles.exitDurationButton,
              {
                backgroundColor:
                  duration === TIMING_SLOW ? c.primary : c.backgroundSecondary,
                borderColor: c.border,
              },
            ]}
          >
            <Text style={{ color: duration === TIMING_SLOW ? "#fff" : c.text }}>
              Lento
            </Text>
          </PressableAnimated>
        </View>
        <View style={styles.exitDelayRow}>
          <Text style={[styles.exitDurationLabel, { color: c.text }]}>
            Delay (ms):
          </Text>
          <TextInput
            style={[
              styles.exitDelayInput,
              {
                color: c.text,
                backgroundColor: c.input,
                borderColor: c.border,
              },
            ]}
            value={String(delay)}
            onChangeText={(t) => setDelay(Number(t) || 0)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      </View>

      <PressableAnimated
        onPress={() => setVisible(!visible)}
        style={[
          styles.toggleButton,
          { backgroundColor: c.primary, marginVertical: 12 },
        ]}
      >
        <Text style={styles.toggleButtonText}>
          {visible ? "Ocultar (salida)" : "Mostrar (entrada)"}
        </Text>
      </PressableAnimated>

      {/* ✅ Sin AnimatePresence, Reanimated se encarga de la salida */}
      {visible && (
        <AnimatedExitBlock
          preset={preset}
          duration={duration}
          delay={delay}
          style={[
            styles.exitCard,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <Text style={[styles.exitTitle, { color: c.text }]}>
            Salida con {preset}
          </Text>
          <Text style={[styles.exitDesc, { color: c.textSecondary }]}>
            Duración: {duration}ms | Delay: {delay}ms
          </Text>
        </AnimatedExitBlock>
      )}
    </View>
  );
}

// ── LAYOUT TRANSITIONS ────────────────────────────────────────────────────
function LayoutDemo() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [expanded, setExpanded] = useState(false);

  return (
    <View>
      <PressableAnimated
        onPress={() => setExpanded(!expanded)}
        style={[
          styles.layoutToggle,
          { backgroundColor: c.primary, borderColor: c.border },
        ]}
      >
        <Text style={styles.toggleButtonText}>
          {expanded ? "Contraer" : "Expandir"}
        </Text>
      </PressableAnimated>

      <MotiView
        animate={{
          height: expanded ? 150 : 50,
          opacity: expanded ? 1 : 0.6,
        }}
        transition={{ type: "spring", ...springConfig.gentle }}
        style={[
          styles.layoutCard,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <View style={styles.layoutContent}>
          <Ionicons
            name={expanded ? "arrow-up" : "arrow-down"}
            size={24}
            color={c.primary}
          />
          <Text style={[styles.layoutText, { color: c.text }]}>
            {expanded
              ? "¡Contenido expandido! Puedes poner lo que quieras aquí."
              : "Toca para expandir"}
          </Text>
        </View>
      </MotiView>
    </View>
  );
}

// ── GESTURES ────────────────────────────────────────────────────────────────
function GestureDemo() {
  const { theme } = useTheme();
  const c = theme.colors;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.gestureBox,
            { backgroundColor: c.primary },
            animatedStyle,
          ]}
        >
          <Text style={styles.gestureText}>Arrástrame</Text>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

// ── SKIA DEMO ──────────────────────────────────────────────────────────────
function NativeSkiaDemo() {
  const { theme } = useTheme();
  const c = theme.colors;
  const progress = useSharedValue(0);
  const { width } = Dimensions.get("window");

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.cubic) }),
      -1,
      true,
    );
  }, [progress]); // ✅ Agregada dependencia 'progress'

  const hasRuntimeEffect = typeof Skia.RuntimeEffect !== "undefined";

  let shaderSource = null;
  if (hasRuntimeEffect) {
    try {
      shaderSource = Skia.RuntimeEffect.Make(`
        uniform float2 iResolution;
        uniform float iTime;
        float4 main(float2 pos) {
          float2 uv = pos / iResolution;
          float wave = sin(uv.x * 10.0 + iTime * 2.0) * 0.5 + 0.5;
          return float4(uv.x * 0.4, uv.y * 0.6, wave, 1.0);
        }
      `);
    } catch (e) {
      console.warn("No se pudo crear el RuntimeEffect:", e);
    }
  }

  const uniforms = useDerivedValue(() => ({
    iResolution: vec(width, 200),
    iTime: progress.value * 4,
  }));

  return (
    <View style={styles.skiaContainer}>
      <View style={styles.skiaCanvasWrapper}>
        <Canvas style={styles.skiaCanvas}>
          <Fill>
            <SkiaLinearGradient
              start={vec(0, 0)}
              end={vec(width, 200)}
              colors={[c.primary, c.secondary]}
            />
          </Fill>
        </Canvas>
      </View>

      <View style={styles.glassCardContainer}>
        <Canvas style={styles.glassCanvas}>
          <BackdropBlur
            blur={20}
            clip={{ x: 0, y: 0, width: 300, height: 120 }}
          >
            <RoundedRect
              x={0}
              y={0}
              width={300}
              height={120}
              r={16}
              color="rgba(255,255,255,0.12)"
            />
          </BackdropBlur>
        </Canvas>
        <View style={styles.glassContent}>
          <Text style={[styles.glassTitle, { color: c.text }]}>
            Glassmorphism
          </Text>
          <Text style={[styles.glassDesc, { color: c.textSecondary }]}>
            Efecto de cristal con Skia
          </Text>
        </View>
      </View>

      <View style={styles.glowContainer}>
        <Canvas style={styles.glowCanvas}>
          <Circle cx={40} cy={40} r={30} color={c.primary}>
            <BlurMask blur={15} style="outer" />
          </Circle>
        </Canvas>
      </View>

      {hasRuntimeEffect && shaderSource ? (
        <View style={styles.shaderContainer}>
          <Text style={[styles.shaderLabel, { color: c.textSecondary }]}>
            Shader personalizado (onda)
          </Text>
          <Canvas style={styles.shaderCanvas}>
            <Fill>
              <RuntimeShader source={shaderSource} uniforms={uniforms} />
            </Fill>
          </Canvas>
        </View>
      ) : (
        <View
          style={[
            styles.shaderContainer,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            ⚠️ Shader no disponible en esta plataforma
          </Text>
        </View>
      )}
    </View>
  );
}

function SkiaFallbackDemo() {
  const { theme } = useTheme();
  const c = theme.colors;
  const isWeb = Platform.OS === "web";

  if (isWeb) {
    return (
      <View style={styles.skiaContainer}>
        <View style={styles.gradientWeb}>
          <LinearGradient
            colors={[c.primary, c.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </View>
        <View style={styles.glassWebContainer}>
          <View
            style={[
              styles.glassWeb,
              { backgroundColor: "rgba(255,255,255,0.1)" },
            ]}
          >
            <Text style={[styles.glassTitle, { color: c.text }]}>
              Glassmorphism (Web)
            </Text>
            <Text style={[styles.glassDesc, { color: c.textSecondary }]}>
              Usando backdrop-filter: blur(20px)
            </Text>
          </View>
        </View>
        <View style={styles.glowWebContainer}>
          <View
            style={[
              styles.glowWeb,
              { backgroundColor: c.primary, shadowColor: c.primary },
            ]}
          />
        </View>
      </View>
    );
  }

  return <NativeSkiaDemo />;
}

// ── SCROLL-DRIVEN ──────────────────────────────────────────────────────────
function ScrollDemo() {
  const { theme } = useTheme();
  const c = theme.colors;
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0],
      Extrapolate.CLAMP,
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -30],
      Extrapolate.CLAMP,
    );
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={styles.scrollDemoContainer}>
      <Animated.View
        style={[
          styles.scrollHeader,
          { backgroundColor: c.card, borderBottomColor: c.border },
          headerStyle,
        ]}
      >
        <Text style={[styles.scrollHeaderTitle, { color: c.text }]}>
          Header con scroll
        </Text>
        <Text style={[styles.scrollHeaderSub, { color: c.textSecondary }]}>
          Se desvanece al hacer scroll
        </Text>
      </Animated.View>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollDemoScroll}
        contentContainerStyle={styles.scrollDemoContent}
        showsVerticalScrollIndicator={false}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.scrollDemoItem,
              { backgroundColor: c.backgroundSecondary, borderColor: c.border },
            ]}
          >
            <Text style={{ color: c.text }}>Elemento {i + 1}</Text>
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

// ── COMBINACIÓN ENTRADA + SALIDA (sin AnimatePresence) ────────────────────
function CombinedDemo() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [visible, setVisible] = useState(true);

  return (
    <View>
      <PressableAnimated
        onPress={() => setVisible(!visible)}
        style={[
          styles.toggleButton,
          { backgroundColor: c.primary, marginBottom: 12 },
        ]}
      >
        <Text style={styles.toggleButtonText}>
          {visible ? "Ocultar" : "Mostrar"}
        </Text>
      </PressableAnimated>

      {/* ✅ Sin AnimatePresence */}
      {visible && (
        <AnimatedBlock
          preset="slideInUp"
          duration={TIMING_MEDIUM}
          style={{ width: "100%" }}
        >
          <AnimatedExitBlock
            preset="slideOutDown"
            duration={TIMING_MEDIUM}
            style={[
              styles.combinedCard,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <Text style={[styles.combinedTitle, { color: c.text }]}>
              Entrada + Salida
            </Text>
            <Text style={[styles.combinedDesc, { color: c.textSecondary }]}>
              Entra con slideInUp y sale con slideOutDown
            </Text>
          </AnimatedExitBlock>
        </AnimatedBlock>
      )}
    </View>
  );
}

// ── PANTALLA PRINCIPAL ─────────────────────────────────────────────────────
export default function AnimationsShowcaseScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [staggerVisible, setStaggerVisible] = useState(false);
  const [shakeInput, setShakeInput] = useState("");
  const [loadingDemo, setLoadingDemo] = useState(true);
  const [pressCount, setPressCount] = useState(0);

  const { animatedStyle: shakeStyle, triggerShake } = useShake();
  const {
    animatedStyle: manualPressStyle,
    onPressIn,
    onPressOut,
  } = usePressAnimation(0.95);

  const handlePressCount = useCallback(() => {
    setPressCount((prev) => prev + 1);
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: c.card, borderBottomColor: c.border },
        ]}
      >
        <Ionicons name="sparkles-outline" size={24} color={c.primary} />
        <Text style={[styles.headerTitle, { color: c.text }]}>
          Catálogo de Animaciones
        </Text>
        <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>
          Explora todas las posibilidades del sistema de animaciones
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. ENTRADAS BÁSICAS */}
        <Section
          title="Entradas (AnimatedBlock)"
          description="Presets estándar con duración por defecto (300ms)."
          icon="enter-outline"
        >
          {ENTRANCE_PRESETS.map((item) => (
            <AnimatedBlock
              key={item.preset}
              preset={item.preset}
              delay={0}
              style={[styles.demoBlock, { borderColor: c.border }]}
            >
              <Ionicons
                name={item.icon as any}
                size={18}
                color={c.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.demoBlockText, { color: c.text }]}>
                {item.label}
              </Text>
            </AnimatedBlock>
          ))}
        </Section>

        {/* 2. ENTRADAS CON DURACIÓN PERSONALIZADA */}
        <Section
          title="Entradas con Duración"
          description="AnimatedBlock acepta 'duration' para sobrescribir la velocidad."
          icon="speedometer-outline"
        >
          <View style={styles.durationGrid}>
            <AnimatedBlock
              preset="fadeIn"
              duration={TIMING_FAST}
              style={[styles.demoBlock, { borderColor: c.border }]}
            >
              <Text style={[styles.demoBlockText, { color: c.text }]}>
                Rápido ({TIMING_FAST}ms)
              </Text>
            </AnimatedBlock>
            <AnimatedBlock
              preset="scaleIn"
              duration={TIMING_MEDIUM}
              style={[styles.demoBlock, { borderColor: c.border }]}
            >
              <Text style={[styles.demoBlockText, { color: c.text }]}>
                Medio ({TIMING_MEDIUM}ms)
              </Text>
            </AnimatedBlock>
            <AnimatedBlock
              preset="slideInUp"
              duration={TIMING_SLOW}
              style={[styles.demoBlock, { borderColor: c.border }]}
            >
              <Text style={[styles.demoBlockText, { color: c.text }]}>
                Lento ({TIMING_SLOW}ms)
              </Text>
            </AnimatedBlock>
          </View>
        </Section>

        {/* 3. ENTRADAS CON TRANSICIÓN CUSTOM */}
        <Section
          title="Transiciones Custom"
          description="Pasa una transición personalizada (ej. spring con parámetros)."
          icon="options-outline"
        >
          <AnimatedBlock
            preset="scaleIn"
            transition={{
              type: "spring",
              damping: 12,
              stiffness: 120,
              mass: 0.8,
            }}
            style={[styles.demoBlock, { borderColor: c.border }]}
          >
            <Ionicons
              name="cog-outline"
              size={18}
              color={c.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.demoBlockText, { color: c.text }]}>
              Spring custom (damping 12, stiffness 120)
            </Text>
          </AnimatedBlock>
          <AnimatedBlock
            preset="slideInUp"
            transition={{
              type: "timing",
              duration: 600,
              easing: Easing.out(Easing.exp),
            }}
            style={[styles.demoBlock, { borderColor: c.border, marginTop: 6 }]}
          >
            <Ionicons
              name="timer-outline"
              size={18}
              color={c.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.demoBlockText, { color: c.text }]}>
              Timing con easing exp
            </Text>
          </AnimatedBlock>
        </Section>

        {/* 4. STAGGER */}
        <Section
          title="Stagger (Entrada en cascada)"
          description="Usa delay con el índice para crear cascadas. También puedes cambiar la duración."
          icon="list-outline"
        >
          <PressableAnimated
            onPress={() => setStaggerVisible(!staggerVisible)}
            style={[
              styles.toggleButton,
              { backgroundColor: c.primary, marginBottom: 12 },
            ]}
          >
            <Text style={styles.toggleButtonText}>
              {staggerVisible ? "Ocultar lista" : "Mostrar lista"}
            </Text>
          </PressableAnimated>

          {staggerVisible &&
            STAGGER_ITEMS.map((item, i) => (
              <AnimatedBlock
                key={item.id}
                preset="slideInLeft"
                delay={i * 80}
                duration={TIMING_MEDIUM}
                style={[
                  styles.staggerItem,
                  {
                    backgroundColor: item.color + "20",
                    borderColor: item.color + "40",
                  },
                ]}
              >
                <View
                  style={[styles.staggerDot, { backgroundColor: item.color }]}
                />
                <Text style={[styles.staggerText, { color: c.text }]}>
                  {item.label} (delay {i * 80}ms)
                </Text>
              </AnimatedBlock>
            ))}
        </Section>

        {/* 5. SALIDAS (AnimatedExitBlock) */}
        <Section
          title="Salidas (AnimatedExitBlock)"
          description="Presets de salida con control total de duración y delay."
          icon="exit-outline"
        >
          <ExitDemo />
        </Section>

        {/* 6. COMBINACIÓN ENTRADA + SALIDA */}
        <Section
          title="Combinación Entrada + Salida"
          description="Anida AnimatedBlock y AnimatedExitBlock para transiciones completas."
          icon="repeat-outline"
        >
          <CombinedDemo />
        </Section>

        {/* 7. BOTONES */}
        <Section
          title="Botones (PressableAnimated)"
          description="Botón con escala y feedback háptico. La duración del press es configurable."
          icon="hand-left-outline"
        >
          <PressableAnimated
            onPress={handlePressCount}
            pressedDuration={TIMING_FAST}
            style={[styles.pressDemoButton, { backgroundColor: c.primary }]}
          >
            <Text style={styles.pressDemoButtonText}>
              Pulsado {pressCount} veces (rápido)
            </Text>
          </PressableAnimated>

          <PressableAnimated
            onPress={handlePressCount}
            pressedDuration={TIMING_SLOW}
            style={[
              styles.pressDemoButton,
              { backgroundColor: c.info, marginTop: 8 },
            ]}
          >
            <Text style={styles.pressDemoButtonText}>
              Pulsado {pressCount} veces (lento)
            </Text>
          </PressableAnimated>

          <PressableAnimated
            disabled
            style={[
              styles.pressDemoButton,
              { backgroundColor: c.muted, marginTop: 8 },
            ]}
          >
            <Text style={styles.pressDemoButtonText}>Deshabilitado</Text>
          </PressableAnimated>
        </Section>

        {/* 8. SHAKE */}
        <Section
          title="Shake (Error)"
          description="Efecto de vibración horizontal para inputs."
          icon="alert-circle-outline"
        >
          <Animated.View style={[styles.shakeWrapper, shakeStyle]}>
            <TextInput
              style={[
                styles.shakeInput,
                {
                  color: c.text,
                  backgroundColor: c.input,
                  borderColor: c.border,
                },
              ]}
              value={shakeInput}
              onChangeText={setShakeInput}
              placeholder="Escribe algo..."
              placeholderTextColor={c.muted}
            />
          </Animated.View>
          <PressableAnimated
            onPress={() => {
              triggerShake();
              haptics.error();
            }}
            style={[styles.shakeButton, { backgroundColor: c.destructive }]}
          >
            <Text style={styles.shakeButtonText}>Validar (siempre falla)</Text>
          </PressableAnimated>
        </Section>

        {/* 9. HAPTICS */}
        <Section
          title="Haptics (Vibración)"
          description="Retroalimentación táctil. En web no hace nada."
          icon="pulse-outline"
        >
          <View style={styles.hapticsRow}>
            <PressableAnimated
              onPress={() => haptics.light()}
              style={[styles.hapticsButton, { backgroundColor: c.success }]}
            >
              <Text style={styles.hapticsButtonText}>Light</Text>
            </PressableAnimated>
            <PressableAnimated
              onPress={() => haptics.medium()}
              style={[styles.hapticsButton, { backgroundColor: c.warning }]}
            >
              <Text style={styles.hapticsButtonText}>Medium</Text>
            </PressableAnimated>
            <PressableAnimated
              onPress={() => haptics.heavy()}
              style={[styles.hapticsButton, { backgroundColor: c.destructive }]}
            >
              <Text style={styles.hapticsButtonText}>Heavy</Text>
            </PressableAnimated>
          </View>
          <View style={styles.hapticsRow}>
            <PressableAnimated
              onPress={() => haptics.success()}
              style={[styles.hapticsButton, { backgroundColor: c.info }]}
            >
              <Text style={styles.hapticsButtonText}>Success</Text>
            </PressableAnimated>
            <PressableAnimated
              onPress={() => haptics.warning()}
              style={[styles.hapticsButton, { backgroundColor: c.warning }]}
            >
              <Text style={styles.hapticsButtonText}>Warning</Text>
            </PressableAnimated>
            <PressableAnimated
              onPress={() => haptics.selection()}
              style={[styles.hapticsButton, { backgroundColor: c.primary }]}
            >
              <Text style={styles.hapticsButtonText}>Selection</Text>
            </PressableAnimated>
          </View>
        </Section>

        {/* 10. SHIMMER */}
        <Section
          title="Shimmer (Esqueletos de carga)"
          description="Placeholders animados mientras se cargan."
          icon="hourglass-outline"
        >
          <View style={styles.shimmerControls}>
            <Text style={[styles.shimmerLabel, { color: c.text }]}>
              Modo carga: {loadingDemo ? "ON" : "OFF"}
            </Text>
            <Switch
              value={loadingDemo}
              onValueChange={setLoadingDemo}
              trackColor={{ false: c.border, true: c.primary + "60" }}
              thumbColor={loadingDemo ? c.primary : c.muted}
            />
          </View>

          <Shimmer loading={loadingDemo} width="100%" height={20}>
            <Text style={[styles.shimmerContentText, { color: c.text }]}>
              📧 usuario@ejemplo.com
            </Text>
          </Shimmer>
          <Shimmer loading={loadingDemo} width="80%" height={20}>
            <Text style={[styles.shimmerContentText, { color: c.text }]}>
              👤 Juan Pérez González
            </Text>
          </Shimmer>
          <Shimmer loading={loadingDemo} width="60%" height={20}>
            <Text style={[styles.shimmerContentText, { color: c.text }]}>
              📱 +591 77777777
            </Text>
          </Shimmer>
          <Shimmer loading={loadingDemo} width="100%" height={100} radius={12}>
            <View
              style={[
                styles.shimmerCard,
                {
                  backgroundColor: c.primarySubtle,
                  borderColor: c.primary + "30",
                },
              ]}
            >
              <Text style={[styles.shimmerCardText, { color: c.primary }]}>
                Tarjeta de ejemplo
              </Text>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                Contenido real cuando loading=false
              </Text>
            </View>
          </Shimmer>
        </Section>

        {/* 11. LAYOUT TRANSITIONS */}
        <Section
          title="Transiciones de Layout"
          description="Cambia el tamaño o posición con una animación suave."
          icon="resize-outline"
        >
          <LayoutDemo />
        </Section>

        {/* 12. GESTOS */}
        <Section
          title="Gestos (Arrastrar)"
          description="Usa Gesture.Pan() + Reanimated."
          icon="move-outline"
        >
          <GestureDemo />
        </Section>

        {/* 13. MODALES CON PRESETS */}
        <Section
          title="Presets para Modales"
          description="Combina overlayFade con los presets de entrada. Overlay 100% funcional en web."
          icon="copy-outline"
        >
          <Text style={[styles.codeText, { color: c.textSecondary }]}>
            {`import { modalScale } from "@/animations";`}
          </Text>
          <View style={styles.presetsRow}>
            <View
              style={[
                styles.presetBadge,
                {
                  backgroundColor: c.primary + "18",
                  borderColor: c.primary + "40",
                },
              ]}
            >
              <Text style={[styles.presetBadgeText, { color: c.primary }]}>
                modalScale
              </Text>
            </View>
            <View
              style={[
                styles.presetBadge,
                { backgroundColor: c.info + "18", borderColor: c.info + "40" },
              ]}
            >
              <Text style={[styles.presetBadgeText, { color: c.info }]}>
                bottomSheet
              </Text>
            </View>
            <View
              style={[
                styles.presetBadge,
                {
                  backgroundColor: c.success + "18",
                  borderColor: c.success + "40",
                },
              ]}
            >
              <Text style={[styles.presetBadgeText, { color: c.success }]}>
                overlayFade
              </Text>
            </View>
          </View>
          <ModalDemo />
        </Section>

        {/* 14. SKIA */}
        <Section
          title="Skia: Efectos GPU"
          description="Gradientes, glassmorphism y glow. Fallback CSS para web."
          icon="color-wand-outline"
        >
          <SkiaFallbackDemo />
        </Section>

        {/* 15. SCROLL-DRIVEN */}
        <Section
          title="Scroll-Driven"
          description="Animaciones que reaccionan al scroll."
          icon="move-outline"
        >
          <ScrollDemo />
        </Section>

        {/* 16. CONFIGURACIONES */}
        <Section
          title="Configuraciones (Springs & Timings)"
          description="Constantes reutilizables."
          icon="options-outline"
        >
          <Text style={[styles.configTitle, { color: c.text }]}>Springs:</Text>
          {/* ✅ Cambiado Array<...> a (keyof typeof springConfig)[] para lint */}
          {(Object.keys(springConfig) as (keyof typeof springConfig)[]).map(
            (key) => (
              <View
                key={key}
                style={[
                  styles.configRow,
                  {
                    backgroundColor: c.backgroundSecondary,
                    borderColor: c.border,
                  },
                ]}
              >
                <Text style={[styles.configKey, { color: c.primary }]}>
                  {key}
                </Text>
                <Text style={[styles.configValue, { color: c.textSecondary }]}>
                  damping: {springConfig[key].damping} | stiffness:{" "}
                  {springConfig[key].stiffness}
                </Text>
              </View>
            ),
          )}
          <Text style={[styles.configTitle, { color: c.text, marginTop: 12 }]}>
            Timings (duraciones globales):
          </Text>
          <Text style={[styles.configValue, { color: c.textSecondary }]}>
            FAST: {TIMING_FAST}ms | MEDIUM: {TIMING_MEDIUM}ms | SLOW:{" "}
            {TIMING_SLOW}ms
          </Text>
        </Section>

        {/* 17. HOOKS AVANZADOS */}
        <Section
          title="Hooks (usePressAnimation / useShake)"
          description="Hooks de Reanimated puro."
          icon="code-slash-outline"
        >
          <Text style={[styles.hookLabel, { color: c.textSecondary }]}>
            usePressAnimation:
          </Text>
          <Animated.View
            style={[
              styles.hookPressDemo,
              { backgroundColor: c.primary },
              manualPressStyle,
            ]}
          >
            <TouchableOpacity
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              activeOpacity={1}
              style={styles.hookPressInner}
            >
              <Text style={styles.hookPressText}>Mantén presionado</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text
            style={[
              styles.hookLabel,
              { color: c.textSecondary, marginTop: 12 },
            ]}
          >
            useShake:
          </Text>
          <Text style={[styles.hookNote, { color: c.muted }]}>
            {`const { animatedStyle, triggerShake } = useShake();`}
          </Text>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── ESTILOS ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", marginTop: 4 },
  headerSubtitle: { fontSize: 13, marginTop: 4, textAlign: "center" },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, gap: 16, paddingBottom: 40 },

  // ── Secciones ──────────────────────────────────────────────────────────
  section: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
    overflow: "hidden",
  },
  sectionHeader: {
    padding: 14,
    borderBottomWidth: 1,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  sectionDesc: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  sectionContent: { padding: 12, gap: 8 },

  // ── Entradas ───────────────────────────────────────────────────────────
  demoBlock: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  demoBlockText: { fontSize: 14, fontWeight: "600" },
  durationGrid: { gap: 6 },

  // ── Stagger ────────────────────────────────────────────────────────────
  toggleButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  staggerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  staggerDot: { width: 10, height: 10, borderRadius: 5 },
  staggerText: { fontSize: 14, fontWeight: "600" },

  // ── Salidas ─────────────────────────────────────────────────────────────
  exitControls: { gap: 8, marginBottom: 8 },
  exitPresetRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  exitPresetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  exitPresetText: { fontSize: 12, fontWeight: "600" },
  exitDurationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  exitDurationLabel: { fontSize: 13, fontWeight: "600" },
  exitDurationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  exitDelayRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  exitDelayInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 60,
    fontSize: 13,
  },
  exitCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  exitTitle: { fontSize: 16, fontWeight: "700" },
  exitDesc: { fontSize: 13, marginTop: 4 },

  // ── Combinación ────────────────────────────────────────────────────────
  combinedCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: "100%",
  },
  combinedTitle: { fontSize: 16, fontWeight: "700" },
  combinedDesc: { fontSize: 13, marginTop: 4 },

  // ── Botones ────────────────────────────────────────────────────────────
  pressDemoButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  pressDemoButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // ── Shake ──────────────────────────────────────────────────────────────
  shakeWrapper: { width: "100%" },
  shakeInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  shakeButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  shakeButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // ── Haptics ────────────────────────────────────────────────────────────
  hapticsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  hapticsButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  hapticsButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // ── Shimmer ────────────────────────────────────────────────────────────
  shimmerControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  shimmerLabel: { fontSize: 14, fontWeight: "600" },
  shimmerContentText: { fontSize: 14, fontWeight: "500" },
  shimmerCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  shimmerCardText: { fontSize: 14, fontWeight: "700" },

  // ── Layout ─────────────────────────────────────────────────────────────
  layoutToggle: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 8,
  },
  layoutCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    padding: 16,
    justifyContent: "center",
  },
  layoutContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  layoutText: { fontSize: 14, fontWeight: "600", flex: 1 },

  // ── Gesture ─────────────────────────────────────────────────────────────
  gestureBox: {
    width: 100,
    height: 100,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  gestureText: { color: "#fff", fontWeight: "700" },

  // ── Modales ─────────────────────────────────────────────────────────────
  modalButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  modalButton: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  modalButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modalOverlayTouch: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  modalDesc: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  modalCloseButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCloseButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // ── SKIA ───────────────────────────────────────────────────────────────
  skiaContainer: { gap: 12 },
  gradientWeb: { height: 100, borderRadius: 12, overflow: "hidden" },
  glassWebContainer: {
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  glassWeb: {
    padding: 16,
    borderRadius: 16,
    backdropFilter: "blur(20px)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    width: "90%",
    alignItems: "center",
  },
  glassTitle: { fontSize: 18, fontWeight: "800" },
  glassDesc: { fontSize: 13, marginTop: 4 },
  glowWebContainer: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  glowWeb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 10,
  },
  skiaCanvasWrapper: {
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
  },
  skiaCanvas: { flex: 1 },
  glassCardContainer: {
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  glassCanvas: { flex: 1 },
  glassContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  glowContainer: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  glowCanvas: { width: 80, height: 80 },
  shaderContainer: {
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
  },
  shaderLabel: { fontSize: 12, marginBottom: 4 },
  shaderCanvas: { flex: 1 },

  // ── SCROLL ──────────────────────────────────────────────────────────────
  scrollDemoContainer: { height: 200, position: "relative" },
  scrollHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  scrollHeaderTitle: { fontSize: 16, fontWeight: "800" },
  scrollHeaderSub: { fontSize: 12 },
  scrollDemoScroll: { flex: 1, marginTop: 60 },
  scrollDemoContent: { padding: 4, gap: 8 },
  scrollDemoItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },

  // ── PRESETS / CODE ──────────────────────────────────────────────────────
  codeText: {
    fontSize: 12,
    fontFamily: "monospace",
    lineHeight: 18,
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  presetsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  presetBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  presetBadgeText: { fontSize: 13, fontWeight: "700" },

  // ── CONFIGS ────────────────────────────────────────────────────────────
  configTitle: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  configRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  configKey: { fontSize: 13, fontWeight: "800", minWidth: 60 },
  configValue: { fontSize: 12, flex: 1 },

  // ── HOOKS ──────────────────────────────────────────────────────────────
  hookLabel: { fontSize: 13, fontWeight: "600" },
  hookPressDemo: {
    borderRadius: 12,
    overflow: "hidden",
  },
  hookPressInner: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  hookPressText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  hookNote: {
    fontSize: 12,
    fontFamily: "monospace",
    lineHeight: 18,
  },
});
