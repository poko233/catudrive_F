// screens/admin/auth/LoginScreen.tsx

import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import {
  AnimatePresence,
  MotiView,
} from "moti";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  GestureHandlerRootView,
} from "react-native-gesture-handler";

import {
  KeyboardAwareScrollView,
} from "react-native-keyboard-aware-scroll-view";

import {
  useSharedValue,
} from "react-native-reanimated";

import {
  ThemedText,
} from "../../../components/ThemedText";

import {
  useTheme,
} from "../../../theme/useTheme";

import {
  AuthInput,
} from "./components/AuthInput";

import {
  GlassCard,
} from "./components/GlassCard";

import {
  Mascot,
} from "./components/Mascot";

import {
  SubmitButton,
} from "./components/SubmitButton";

import {
  useLoginForm,
} from "./hooks/useLoginForm";

/*
|--------------------------------------------------------------------------
| URL
|--------------------------------------------------------------------------
*/

const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  ""
).replace(
  /\/+$/,
  "",
);

const EMPRESA_BANNER_URL =
  `${API_URL}/empresa/empresa_1_baner_inicio.webp`;

/*
|--------------------------------------------------------------------------
| BACKGROUND
|--------------------------------------------------------------------------
*/

function LoginBackground() {
  const {
    theme,
  } =
    useTheme();

  const [
    imageFailed,
    setImageFailed,
  ] =
    useState(false);

  const overlayColors =
    theme.dark
      ? ([
          "rgba(0,0,0,0.5)",
          "rgba(0,0,0,0.8)",
        ] as const)
      : ([
          "rgba(0,0,0,0.35)",
          "rgba(0,0,0,0.65)",
        ] as const);

  return (
    <View
      style={
        StyleSheet.absoluteFill
      }
      pointerEvents="none"
    >
      {imageFailed && (
        <View
          style={
            StyleSheet.absoluteFill
          }
        >
          <View
            style={[
              styles.blob,
              styles.blobTop,

              {
                backgroundColor:
                  theme.colors.primary,

                opacity:
                  0.3,
              },
            ]}
          />

          <View
            style={[
              styles.blob,
              styles.blobBottom,

              {
                backgroundColor:
                  theme.colors.info,

                opacity:
                  0.3,
              },
            ]}
          />
        </View>
      )}

      <AnimatePresence>
        {!imageFailed && (
          <MotiView
            key="login-banner"
            from={{
              opacity:
                0,

              scale:
                1.08,
            }}
            animate={{
              opacity:
                1,

              scale:
                1,
            }}
            exit={{
              opacity:
                0,

              scale:
                1.02,
            }}
            transition={{
              type:
                "timing",

              duration:
                500,
            }}
            style={
              StyleSheet.absoluteFill
            }
          >
            <Image
              source={{
                uri:
                  EMPRESA_BANNER_URL,
              }}
              style={
                StyleSheet.absoluteFill
              }
              contentFit="cover"
              transition={
                400
              }
              cachePolicy="memory-disk"
              onError={() =>
                setImageFailed(
                  true,
                )
              }
              onLoad={() =>
                setImageFailed(
                  false,
                )
              }
            />

            <LinearGradient
              colors={
                overlayColors
              }
              style={
                StyleSheet.absoluteFill
              }
            />
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export default function LoginScreen() {
  const {
    theme,
  } =
    useTheme();

  const {
    form,

    errors,

    handleChange,

    handleBlur,

    handleSubmit,

    submitting,

    serverError,

    canSubmit,
  } =
    useLoginForm();

  /*
  |--------------------------------------------------------------------------
  | MASCOTA
  |--------------------------------------------------------------------------
  */

  const usernameFocused =
    useSharedValue(
      false,
    );

  const passwordFocused =
    useSharedValue(
      false,
    );

  const [
    isPasswordVisible,
    setIsPasswordVisible,
  ] =
    useState(false);

  const eyeOffsetX =
    useSharedValue(
      0,
    );

  const eyeOffsetY =
    useSharedValue(
      0,
    );

  const mascotRef =
    useRef<View>(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | EYES
  |--------------------------------------------------------------------------
  */

  const updateEyeOffset = (
    pageX: number,
    pageY: number,
  ) => {
    if (
      !mascotRef.current
    ) {
      return;
    }

    mascotRef.current
      .measureInWindow(
        (
          x,
          y,
          width,
          height,
        ) => {
          const centerX =
            x +
            width / 2;

          const centerY =
            y +
            height / 2;

          const moveX =
            (
              pageX -
              centerX
            ) / 12;

          const moveY =
            (
              pageY -
              centerY
            ) / 12;

          eyeOffsetX.value =
            Math.min(
              Math.max(
                moveX,
                -21,
              ),
              21,
            );

          eyeOffsetY.value =
            Math.min(
              Math.max(
                moveY,
                -19,
              ),
              19,
            );
        },
      );
  };

  /*
  |--------------------------------------------------------------------------
  | WEB MOUSE
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        Platform.OS !==
        "web"
      ) {
        return;
      }

      const handleMouseMove =
        (
          event:
            MouseEvent,
        ) => {
          updateEyeOffset(
            event.clientX,
            event.clientY,
          );
        };

      window.addEventListener(
        "mousemove",
        handleMouseMove,
      );

      return () => {
        window.removeEventListener(
          "mousemove",
          handleMouseMove,
        );
      };
    },
    [],
  );

  /*
  |--------------------------------------------------------------------------
  | MOBILE TOUCH
  |--------------------------------------------------------------------------
  */

  const panResponder =
    useMemo(
      () =>
        Platform.OS !==
        "web"
          ? PanResponder.create(
              {
                onStartShouldSetPanResponder:
                  () =>
                    true,

                onMoveShouldSetPanResponder:
                  () =>
                    true,

                onPanResponderMove:
                  (
                    event,
                  ) => {
                    updateEyeOffset(
                      event
                        .nativeEvent
                        .pageX,

                      event
                        .nativeEvent
                        .pageY,
                    );
                  },

                onPanResponderRelease:
                  () => {
                    eyeOffsetX.value =
                      0;

                    eyeOffsetY.value =
                      0;
                  },
              },
            )
          : {
              panHandlers:
                {},
            },
      [
        eyeOffsetX,
        eyeOffsetY,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <GestureHandlerRootView
      style={{
        flex:
          1,
      }}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow:
            1,
        }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={
          Platform.OS ===
          "ios"
            ? 40
            : 60
        }
      >
        <View
          className="flex-1 justify-center items-center px-4"
          style={{
            backgroundColor:
              theme.colors
                .background,
          }}
          {...panResponder.panHandlers}
        >
          <LoginBackground />

          {/* MASCOT */}

          <View
            ref={
              mascotRef
            }
            style={
              styles.mascotWrapper
            }
          >
            <Mascot
              isPasswordVisible={
                isPasswordVisible
              }
              usernameFocused={
                usernameFocused
              }
              passwordFocused={
                passwordFocused
              }
              eyeOffsetX={
                eyeOffsetX
              }
              eyeOffsetY={
                eyeOffsetY
              }
            />
          </View>

          {/* CARD */}

          <GlassCard>
            <View className="w-full max-w-md flex flex-col gap-8">
              {/* HEADER */}

              <View
                style={{
                  alignItems:
                    "center",
                }}
              >
                <ThemedText
                  style={[
                    styles.title,

                    {
                      color:
                        theme.colors
                          .text,
                    },
                  ]}
                >
                  Bienvenido de nuevo
                </ThemedText>

                <ThemedText
                  style={[
                    styles.subtitle,

                    {
                      color:
                        theme.colors
                          .text,
                    },
                  ]}
                >
                  Ingresa tus credenciales para acceder
                </ThemedText>
              </View>

              {/* FORM */}

              <View className="flex flex-col gap-6">
                <AuthInput
                  label="USUARIO"
                  value={
                    form.usuario
                  }
                  onChangeText={
                    handleChange(
                      "usuario",
                    )
                  }
                  onBlur={() => {
                    handleBlur(
                      "usuario",
                    )();

                    usernameFocused.value =
                      false;
                  }}
                  onFocus={() => {
                    usernameFocused.value =
                      true;
                  }}
                  error={
                    errors.usuario
                  }
                  autoCapitalize="none"
                  maxLength={
                    40
                  }
                  placeholder="Usuario, CI o correo"
                  onSubmitEditing={
                    handleSubmit
                  }
                />

                <AuthInput
                  label="CONTRASEÑA"
                  value={
                    form.password
                  }
                  onChangeText={
                    handleChange(
                      "password",
                    )
                  }
                  onBlur={() => {
                    handleBlur(
                      "password",
                    )();

                    passwordFocused.value =
                      false;
                  }}
                  onFocus={() => {
                    passwordFocused.value =
                      true;
                  }}
                  error={
                    errors.password
                  }
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="••••••••"
                  passwordVisible={
                    isPasswordVisible
                  }
                  onTogglePasswordVisibility={() =>
                    setIsPasswordVisible(
                      (
                        current,
                      ) =>
                        !current,
                    )
                  }
                  onSubmitEditing={
                    handleSubmit
                  }
                />

                {/* FORGOT */}

                <Pressable
                  onPress={() =>
                    router.push(
                      "/forgot-password",
                    )
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.forgotPassword,

                    {
                      opacity:
                        pressed
                          ? 0.6
                          : 1,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.forgotPasswordText,

                      {
                        color:
                          theme.colors
                            .primary,
                      },
                    ]}
                  >
                    ¿Olvidaste tu contraseña?
                  </ThemedText>
                </Pressable>

                {/* ERROR */}

                {!!serverError && (
                  <ThemedText
                    style={{
                      color:
                        theme.colors
                          .destructive,

                      fontSize:
                        13,

                      textAlign:
                        "center",
                    }}
                  >
                    {
                      serverError
                    }
                  </ThemedText>
                )}

                {/* SUBMIT */}

                <SubmitButton
                  title="Iniciar Sesión"
                  onPress={
                    handleSubmit
                  }
                  loading={
                    submitting
                  }
                  disabled={
                    !canSubmit
                  }
                />
              </View>
            </View>
          </GlassCard>
        </View>
      </KeyboardAwareScrollView>
    </GestureHandlerRootView>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    mascotWrapper: {
      width:
        256,

      height:
        256,

      alignSelf:
        "center",

      marginBottom:
        -20,

      zIndex:
        10,

      overflow:
        "visible",

      justifyContent:
        "flex-end",

      alignItems:
        "center",
    },

    title: {
      fontSize:
        32,

      fontWeight:
        "600",

      letterSpacing:
        -0.5,

      textAlign:
        "center",

      marginBottom:
        8,
    },

    subtitle: {
      fontSize:
        16,

      textAlign:
        "center",
    },

    forgotPassword: {
      alignSelf:
        "flex-end",

      marginTop:
        -8,
    },

    forgotPasswordText: {
      fontSize:
        13,

      fontWeight:
        "700",
    },

    blob: {
      position:
        "absolute",

      borderRadius:
        999,
    },

    blobTop: {
      top:
        "20%",

      left:
        "-10%",

      width:
        200,

      height:
        200,
    },

    blobBottom: {
      bottom:
        "10%",

      right:
        "-10%",

      width:
        250,

      height:
        250,
    },
  });