// app/+not-found.tsx
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  DimensionValue,
  Image,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  Easing,
  FadeIn,
  SlideInDown,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, G, LinearGradient, Path, Stop } from "react-native-svg";
import logoImg from "../assets/images/logo_texto.png";
import { useResponsive } from "../hooks/useResponsive";
import { SubmitButton } from "../screens/admin/auth/components/SubmitButton";
import { useTheme } from "../theme/useTheme";

/* ─── Helpers ─── */
function parseDimensionValue(
  value: DimensionValue,
  parentSize: number,
): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.endsWith("%")) {
    return (parseFloat(value) / 100) * parentSize;
  }
  return 0;
}

/* ─── Colores del SVG 404 ─── */
interface NotFoundSvgColors {
  signBgStart: string;
  signBgEnd: string;
  shadowGradient1: string;
  shadowGradient2: string;
  digitGradientStart: string;
  digitGradientEnd: string;
  signInnerBgStart: string;
  signInnerBgEnd: string;
  personFill: string;
  textColor: string;
}

function buildNotFoundSvgColors(
  themeName: string,
  theme: any,
): NotFoundSvgColors {
  if (themeName === "premium") {
    return {
      signBgStart: theme.colors.secondary || "#4A0810",
      signBgEnd: theme.colors.secondaryHover || "#660B16",
      shadowGradient1: theme.colors.muted,
      shadowGradient2: theme.colors.muted + "40",
      digitGradientStart: theme.colors.text,
      digitGradientEnd: theme.colors.textSecondary,
      signInnerBgStart: theme.colors.card,
      signInnerBgEnd: theme.colors.cardHover || theme.colors.card,
      personFill: theme.colors.primary,
      textColor: theme.colors.textSecondary,
    };
  } else if (themeName === "dark") {
    return {
      signBgStart: "#334155",
      signBgEnd: "#1E293B",
      shadowGradient1: theme.colors.muted,
      shadowGradient2: theme.colors.muted + "40",
      digitGradientStart: theme.colors.text,
      digitGradientEnd: theme.colors.textSecondary,
      signInnerBgStart: "#0F172A",
      signInnerBgEnd: "#1E293B",
      personFill: theme.colors.primary,
      textColor: "#94A3B8",
    };
  } else {
    return {
      signBgStart: "#E5E7EB",
      signBgEnd: "#9CA3AF",
      shadowGradient1: theme.colors.muted,
      shadowGradient2: theme.colors.muted + "40",
      digitGradientStart: theme.colors.text,
      digitGradientEnd: theme.colors.textSecondary,
      signInnerBgStart: "#FFFFFF",
      signInnerBgEnd: "#F3F4F6",
      personFill: theme.colors.primary,
      textColor: "#4B5563",
    };
  }
}

/* ─── SVG del error 404 (gradientes duplicados) ─── */
const NotFoundSvg = ({
  colors,
  maxWidth = 500,
}: {
  colors: NotFoundSvgColors;
  maxWidth?: number;
}) => {
  const { width } = useWindowDimensions();
  const svgWidth = Math.min(width * 1, maxWidth);
  const svgHeight = svgWidth * 0.65;

  return (
    <Svg width={svgWidth} height={svgHeight} viewBox="0 0 1000 1000">
      <Defs>
        <LinearGradient
          id="shadowGrad1"
          x1="283.81"
          x2="489"
          y1="608.79"
          y2="520.72"
          gradientTransform="matrix(1 0 1.966 .63 -1309.47 246.23)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.shadowGradient1} stopOpacity="1" />
          <Stop
            offset="1"
            stopColor={colors.shadowGradient2}
            stopOpacity=".1"
          />
        </LinearGradient>
        <LinearGradient
          id="shadowGrad2"
          x1="546.28"
          x2="736.45"
          y1="584.16"
          y2="502.53"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.shadowGradient1} stopOpacity="1" />
          <Stop
            offset="1"
            stopColor={colors.shadowGradient2}
            stopOpacity=".1"
          />
        </LinearGradient>
        <LinearGradient
          id="shadowGrad3"
          x1="789.29"
          x2="994.81"
          y1="608.97"
          y2="520.75"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.shadowGradient1} stopOpacity="1" />
          <Stop
            offset="1"
            stopColor={colors.shadowGradient2}
            stopOpacity=".1"
          />
        </LinearGradient>
        <LinearGradient
          id="shadowGrad4"
          x1="2721.78"
          x2="2752.21"
          y1="-4283.15"
          y2="-4307.63"
          gradientTransform="matrix(.62788 -.69954 .78195 .70075 2175.83 5624.79)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop
            offset="0"
            stopColor={colors.shadowGradient1}
            stopOpacity=".8"
          />
          <Stop
            offset="1"
            stopColor={colors.shadowGradient2}
            stopOpacity=".2"
          />
        </LinearGradient>
        <LinearGradient
          id="digitGrad1"
          x1="276.24"
          x2="276.24"
          y1="304.47"
          y2="631.18"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.digitGradientStart} />
          <Stop offset="1" stopColor={colors.digitGradientEnd} />
        </LinearGradient>
        <LinearGradient
          id="digitGrad2"
          x1="528.37"
          x2="528.37"
          y2="636.73"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.digitGradientStart} />
          <Stop offset="1" stopColor={colors.digitGradientEnd} />
        </LinearGradient>
        <LinearGradient
          id="digitGrad3"
          x1="781.84"
          x2="781.84"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.digitGradientStart} />
          <Stop offset="1" stopColor={colors.digitGradientEnd} />
        </LinearGradient>
        <LinearGradient
          id="signBgGrad"
          x1="299.24"
          x2="299.24"
          y1="304.47"
          y2="631.18"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.signBgStart} />
          <Stop offset="1" stopColor={colors.signBgEnd} />
        </LinearGradient>
        <LinearGradient
          id="signBgGrad2"
          x1="551.37"
          x2="551.37"
          y2="636.73"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.signBgStart} />
          <Stop offset="1" stopColor={colors.signBgEnd} />
        </LinearGradient>
        <LinearGradient
          id="signBgGrad3"
          x1="804.84"
          x2="804.84"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.signBgStart} />
          <Stop offset="1" stopColor={colors.signBgEnd} />
        </LinearGradient>
        <LinearGradient
          id="signInnerGrad"
          x1="488.41"
          x2="587.35"
          y1="543.03"
          y2="641.97"
          gradientUnits="userSpaceOnUse"
        >
          <Stop
            offset="0"
            stopColor={colors.signInnerBgStart}
            stopOpacity="0"
          />
          <Stop
            offset=".48"
            stopColor={colors.signInnerBgEnd}
            stopOpacity=".96"
          />
          <Stop offset="1" stopColor={colors.signInnerBgEnd} />
        </LinearGradient>
        <LinearGradient
          id="signInnerGrad2"
          x1="2904.08"
          x2="2739.62"
          y1="-4393.55"
          y2="-4261.24"
          gradientTransform="matrix(.64766 -.69501 .7602 .69504 2037.14 5595.5)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.signBgStart} />
          <Stop offset="1" stopColor={colors.signBgEnd} />
        </LinearGradient>
        <LinearGradient
          id="personGrad"
          x1="2784.8"
          x2="2784.8"
          y1="-4185.62"
          y2="-4409.48"
          gradientTransform="matrix(.64766 -.69501 .7602 .69504 2037.14 5595.5)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.personFill} />
          <Stop offset="1" stopColor={colors.personFill} />
        </LinearGradient>
        <LinearGradient
          id="innerShadow"
          x1="1489.8"
          x2="1348.04"
          y1="-5836.39"
          y2="-5694.63"
          gradientTransform="matrix(.51121 -.54878 .59795 .54646 3280.71 4519.23)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.digitGradientStart} />
          <Stop offset="1" stopColor={colors.digitGradientEnd} />
        </LinearGradient>
      </Defs>

      {/* Sombras */}
      <G>
        <Path
          d="M294.73,630.57l-49.88-15.99c-1.18-.38-3.28-.68-4.7-.68H112.13c-1.42,0-3.53-.31-4.7-.68l-42.36-13.58c-.43-.14-.69-.27-.75-.38l-29.42-54.31c-.1-.19.35-.3,1.2-.3h48.45c1.42,0,3.53.31,4.7.68l166.4,53.36c1.18.38,3.28.68,4.7.68h35.25c1.42,0,3.53.31,4.7.68l41.07,13.17c1.18.38.98.68-.45.68h-35.25c-1.42,0-1.62.31-.45.68l49.88,15.99c1.18.38.98.68-.45.68h-55.22c-1.42,0-3.53-.31-4.7-.68ZM195.27,598.68l-82.83-26.56c-2.1-.67-6.22-.94-5.9-.38l15.44,26.56c.26.45,3.39,1.06,5.45,1.06h67.39c1.42,0,1.62-.31.45-.68Z"
          fill="url(#shadowGrad1)"
        />
        <Path
          d="M262.68,544.64c31.52,0,65.45,2.98,101.8,8.94,43.18,7.06,90.27,18.77,141.29,35.13,50.89,16.32,76.81,28.05,77.77,35.19.74,5.88-14.65,8.83-46.16,8.83s-67.25-3.23-106.76-9.68c-39.51-6.45-85.07-17.96-136.7-34.51-50.65-16.24-76.44-27.93-77.4-35.07-.74-5.88,14.65-8.83,46.16-8.83ZM305.43,558.35c-7.55,0-12.29.64-14.23,1.91-1.94,1.28.59,3.56,7.62,6.86,9.04,4.28,29.35,11.47,60.91,21.59,31.56,10.12,55.17,17.07,70.82,20.86,15.65,3.79,28.36,6.31,38.12,7.56,9.76,1.26,18.41,1.88,25.96,1.88s12.29-.64,14.23-1.91c1.94-1.27-.6-3.56-7.62-6.86-8.92-4.24-29.16-11.42-60.72-21.54-31.56-10.12-55.17-17.07-70.82-20.86-15.65-3.79-28.39-6.32-38.21-7.59-9.82-1.27-18.5-1.91-26.05-1.91Z"
          fill="url(#shadowGrad2)"
        />
        <Path
          d="M801.34,630.9l-51.9-16.64c-.62-.2-1.72-.36-2.46-.36h-130.47c-.75,0-1.85-.16-2.46-.36l-43.68-14.01c-.22-.07-.36-.14-.39-.2l-29.54-54.53c-.05-.1.18-.16.63-.16h50.32c.75,0,1.85.16,2.46.36l168.42,54.01c.62.2,1.72.36,2.46.36h37.7c.75,0,1.85.16,2.46.36l43.09,13.82c.62.2.51.36-.23.36h-37.7c-.75,0-.85.16-.23.36l51.9,16.64c.62.2.51.36-.23.36h-57.67c-.75,0-1.85-.16-2.46-.36ZM701.88,599.01l-87.16-27.95c-1.1-.35-3.26-.49-3.09-.2l16.25,27.95c.14.24,1.78.56,2.86.56h70.91c.75,0,.85-.16.23-.36Z"
          fill="url(#shadowGrad3)"
        />
        <Path
          d="M678.5,696.32h-220.6c-2.81,0-5.32-1.16-7.19-2.95-1.51-1.45-66.69-37.87-66.69-37.87-3.48-4.91,9.52-4.19,23.52-2.19l277.33,28.63c4.67,6.22,1.06,14.37-6.36,14.37Z"
          fill="url(#shadowGrad4)"
        />
      </G>

      {/* Dígitos 404 */}
      <G>
        <Path
          d="M390.63,510.88h-35.25c-1.42,0-2.57-1.15-2.57-2.57v-201.27c0-1.42-1.15-2.57-2.57-2.57h-48.45c-.85,0-1.65.42-2.12,1.12l-139.94,204.86c-.29.43-.45.93-.45,1.45v51.23c0,1.42,1.15,2.57,2.57,2.57h128.02c1.42,0,2.57,1.15,2.57,2.57v60.33c0,1.42,1.15,2.57,2.57,2.57h55.22c1.42,0,2.57-1.15,2.57-2.57v-60.33c0-1.42,1.15-2.57,2.57-2.57h35.25c1.42,0,2.57-1.15,2.57-2.57v-49.67c0-1.42-1.15-2.57-2.57-2.57ZM292.44,508.31c0,1.42-1.15,2.57-2.57,2.57h-67.39c-2.06,0-3.29-2.3-2.14-4.01l67.39-100.19c1.42-2.11,4.71-1.1,4.71,1.44v100.19Z"
          fill="url(#digitGrad1)"
        />
        <Path
          d="M553.88,307.27v-2.8h-28.09v.03c-30.28.59-53.98,11.68-71.1,33.26-21.31,26.93-31.96,71.02-31.96,132.28s9.69,105.84,29.08,130.17c19.38,24.34,44.91,36.51,76.57,36.51.34,0,.67,0,1-.01h0s24.5.01,24.5.01v-2.77c19.58-4.55,35.65-14.72,48.18-30.52,21.31-26.93,31.96-71.17,31.96-132.73s-10.58-105.87-31.74-132.5c-12.64-16.02-28.78-26.32-48.41-30.93ZM562.33,551.94c-3.26,12.43-7.84,21.05-13.76,25.86-5.92,4.81-12.65,7.21-20.2,7.21s-14.24-2.37-20.09-7.1c-5.85-4.73-10.69-14.24-14.54-28.52-3.85-14.28-5.77-40.51-5.77-78.68s2.14-65.33,6.44-81.46c3.25-12.43,7.84-21.05,13.76-25.86,5.92-4.81,12.65-7.21,20.2-7.21s14.24,2.41,20.09,7.21c5.84,4.81,10.69,14.35,14.54,28.63,3.85,14.28,5.77,40.51,5.77,78.68s-2.15,65.25-6.44,81.23Z"
          fill="url(#digitGrad2)"
        />
        <Path
          d="M897.46,510.88h-37.7c-.75,0-1.35-.6-1.35-1.35v-203.71c0-.75-.6-1.35-1.35-1.35h-50.32c-.45,0-.86.22-1.11.59l-140.52,205.7c-.15.22-.24.49-.24.76v52.83c0,.75.6,1.35,1.35,1.35h130.47c.75,0,1.35.6,1.35,1.35v62.78c0,.75.6,1.35,1.35,1.35h57.67c.75,0,1.35-.6,1.35-1.35v-62.78c0-.75.6-1.35,1.35-1.35h37.7c.75,0,1.35-.6,1.35-1.35v-52.12c0-.75-.6-1.35-1.35-1.35ZM798.04,509.53c0,.75-.6,1.35-1.35,1.35h-70.91c-1.08,0-1.72-1.21-1.12-2.1l70.91-105.42c.74-1.11,2.47-.58,2.47.75v105.42Z"
          fill="url(#digitGrad3)"
        />
        <Path
          d="M315.44,628.61v-60.33c0-1.42-1.15-2.57-2.57-2.57h-128.02c-1.42,0-2.57-1.15-2.57-2.57v-51.23c0-.52.16-1.02.45-1.45l139.94-204.86c.48-.7,1.27-1.12,2.12-1.12h48.45c1.42,0,2.57,1.15,2.57,2.57v201.27c0,1.42,1.15,2.57,2.57,2.57h35.25c1.42,0,2.57,1.15,2.57,2.57v49.67c0,1.42-1.15,2.57-2.57,2.57h-35.25c-1.42,0-2.57,1.15-2.57,2.57v60.33c0,1.42-1.15,2.57-2.57,2.57h-55.22c-1.42,0-2.57-1.15-2.57-2.57ZM315.44,508.31v-100.19c0-2.54-3.29-3.54-4.71-1.44l-67.39,100.19c-1.15,1.71.08,4.01,2.14,4.01h67.39c1.42,0,2.57-1.15,2.57-2.57Z"
          fill="url(#signBgGrad)"
        />
        <Path
          d="M551.37,304.47c31.52,0,56.15,11.25,73.91,33.74,21.16,26.63,31.74,70.8,31.74,132.5s-10.65,105.8-31.96,132.73c-17.61,22.19-42.17,33.29-73.69,33.29s-57.19-12.17-76.57-36.51c-19.39-24.34-29.08-67.73-29.08-130.17s10.65-105.35,31.96-132.28c17.61-22.19,42.17-33.29,73.69-33.29ZM551.37,356.18c-7.55,0-14.28,2.41-20.2,7.21-5.92,4.81-10.51,13.43-13.76,25.86-4.29,16.13-6.44,43.28-6.44,81.46s1.92,64.4,5.77,78.68c3.85,14.28,8.69,23.79,14.54,28.52,5.84,4.74,12.54,7.1,20.09,7.1s14.28-2.4,20.2-7.21c5.92-4.81,10.5-13.43,13.76-25.86,4.29-15.98,6.44-43.06,6.44-81.23s-1.92-64.4-5.77-78.68c-3.85-14.28-8.69-23.82-14.54-28.63-5.85-4.81-12.54-7.21-20.09-7.21Z"
          fill="url(#signBgGrad2)"
        />
        <Path
          d="M821.04,629.83v-62.78c0-.75-.6-1.35-1.35-1.35h-130.47c-.75,0-1.35-.6-1.35-1.35v-52.83c0-.27.08-.54.24-.76l140.52-205.7c.25-.37.67-.59,1.11-.59h50.32c.75,0,1.35.6,1.35,1.35v203.71c0,.75.6,1.35,1.35,1.35h37.7c.75,0,1.35.6,1.35,1.35v52.12c0,.75-.6,1.35-1.35,1.35h-37.7c-.75,0-1.35.6-1.35,1.35v62.78c0,.75-.6,1.35-1.35,1.35h-57.67c-.75,0-1.35-.6-1.35-1.35ZM821.04,509.53v-105.42c0-1.33-1.73-1.86-2.47-.75l-70.91,105.42c-.6.9.04,2.1,1.12,2.1h70.91c.75,0,1.35-.6,1.35-1.35Z"
          fill="url(#signBgGrad3)"
        />
        <Path
          d="M616.11,613.21c-16.67,15.68-38.24,23.52-64.74,23.52-31.66,0-57.19-12.17-76.57-36.51-.47-.58-.93-1.18-1.38-1.79l39-79.41c.96,13.11,2.4,23.23,4.33,30.37,3.85,14.28,8.69,23.79,14.54,28.52,5.84,4.74,12.54,7.1,20.08,7.1s14.28-2.4,20.2-7.21c3.76-3.05,6.98-7.64,9.66-13.76l34.88,49.17Z"
          fill="url(#signInnerGrad)"
        />
      </G>

      {/* Letrero con persona */}
      <G>
        <Path
          d="M674.5,696.32h-216.6c-7.43,0-12.58-8.1-9.09-14.28l93.76-179.36c3.23-5.72,11.7-5.72,15.86,0l122.85,179.36c4.5,6.18.65,14.28-6.77,14.28Z"
          fill="url(#signInnerGrad2)"
        />
        <Path
          d="M678.5,696.32h-216.6c-7.43,0-12.58-8.1-9.09-14.28l93.76-179.36c3.23-5.72,11.7-5.72,15.86,0l122.85,179.36c4.5,6.18.65,14.28-6.77,14.28Z"
          fill="url(#personGrad)"
        />
        <Path
          d="M651.26,679.01h-164.93c-5.8,0-9.83-6.33-7.1-11.15l71.1-140.08c2.53-4.47,9.14-4.47,12.39,0l93.83,140.08c3.51,4.83.51,11.15-5.29,11.15Z"
          fill="url(#innerShadow)"
        />
        <G>
          <Path
            d="M574.26 650.33c.37 4.55-3.07 8.23-7.67 8.23s-8.64-3.69-9.01-8.23 3.07-8.23 7.67-8.23 8.64 3.69 9.01 8.23ZM568.68 630.34h-8.76c-.87 0-1.63-.7-1.7-1.55l-6.78-54.52c-.07-.86.58-1.55 1.45-1.55h13.49c.87 0 1.63.7 1.7 1.55l2.06 54.52c.07.86-.58 1.55-1.45 1.55Z"
            fill={colors.textColor}
          />
        </G>
      </G>
    </Svg>
  );
};

/* ─── Partícula flotante ─── */
const FloatingShape = ({
  size,
  top,
  left,
  color,
  delayMs,
  durationMs,
  amplitudeX = 35,
  amplitudeY = 60,
  rotateAmplitude = 15,
  mouseX,
  mouseY,
}: {
  size: number;
  top: DimensionValue;
  left: DimensionValue;
  color: string;
  delayMs: number;
  durationMs: number;
  amplitudeX?: number;
  amplitudeY?: number;
  rotateAmplitude?: number;
  mouseX: SharedValue<number>;
  mouseY: SharedValue<number>;
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const absX = useMemo(
    () => parseDimensionValue(left, windowWidth),
    [left, windowWidth],
  );
  const absY = useMemo(
    () => parseDimensionValue(top, windowHeight),
    [top, windowHeight],
  );

  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);
  const repulsionX = useSharedValue(0);
  const repulsionY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delayMs, withTiming(0.75, { duration: 1200 }));

    translateY.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(-amplitudeY, {
          duration: durationMs,
          easing: Easing.bezier(0.42, 0.0, 0.58, 1.0),
        }),
        -1,
        true,
      ),
    );

    translateX.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(amplitudeX, {
          duration: durationMs * 1.2,
          easing: Easing.bezier(0.42, 0.0, 0.58, 1.0),
        }),
        -1,
        true,
      ),
    );

    scale.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(1.25, {
          duration: durationMs * 0.7,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );

    rotate.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(rotateAmplitude, {
          duration: durationMs * 0.9,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );
  }, []);

  useAnimatedReaction(
    () => ({ mx: mouseX.value, my: mouseY.value }),
    ({ mx, my }) => {
      if (mx <= 0 || my <= 0) {
        repulsionX.value = withSpring(0, { damping: 10, stiffness: 80 });
        repulsionY.value = withSpring(0, { damping: 10, stiffness: 80 });
        return;
      }
      const dx = mx - absX;
      const dy = my - absY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const threshold = 180;
      if (dist < threshold) {
        const force = (1 - dist / threshold) * 140;
        const angle = Math.atan2(dy, dx);
        repulsionX.value = withSpring(-Math.cos(angle) * force, {
          damping: 8,
          stiffness: 80,
        });
        repulsionY.value = withSpring(-Math.sin(angle) * force, {
          damping: 8,
          stiffness: 80,
        });
      } else {
        repulsionX.value = withSpring(0, { damping: 8, stiffness: 80 });
        repulsionY.value = withSpring(0, { damping: 8, stiffness: 80 });
      }
    },
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value + repulsionY.value },
      { translateX: translateX.value + repulsionX.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
};

/* ─── Pantalla 404 (texto más grande) ─── */
export default function NotFoundScreen() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const { isMobile, isDesktop } = useResponsive();

  const mouseX = useSharedValue(-1000);
  const mouseY = useSharedValue(-1000);

  const handleMouseMove = useCallback(
    (e: any) => {
      mouseX.value = e.nativeEvent.pageX;
      mouseY.value = e.nativeEvent.pageY;
    },
    [mouseX, mouseY],
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.value = -1000;
    mouseY.value = -1000;
  }, [mouseX, mouseY]);

  const particles = useMemo(() => {
    const list: Array<{
      size: number;
      top: DimensionValue;
      left: DimensionValue;
      color: string;
      delayMs: number;
      durationMs: number;
      amplitudeX: number;
      amplitudeY: number;
      rotateAmplitude?: number;
    }> = [];

    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    };

    const cols = 10;
    const rows = 5;
    const cellW = 100 / cols;
    const cellH = 100 / rows;

    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const seed = i * 7 + 13;

        const jitterX = (pseudoRandom(seed) - 0.5) * cellW * 0.7;
        const jitterY = (pseudoRandom(seed + 1) - 0.5) * cellH * 0.7;

        const leftPercent = col * cellW + cellW / 2 + jitterX;
        const topPercent = row * cellH + cellH / 2 + jitterY;

        const size = Math.floor(pseudoRandom(seed + 2) * 84) + 16;

        const alphaHex = Math.floor(pseudoRandom(seed + 3) * 9 + 7) * 2;
        const color =
          theme.colors.primary + alphaHex.toString(16).padStart(2, "0");

        const delayMs = Math.floor(pseudoRandom(seed + 4) * 600);
        const durationMs = Math.floor(pseudoRandom(seed + 5) * 1500) + 1500;

        const amplitudeX = (pseudoRandom(seed + 6) - 0.5) * 120;
        const amplitudeY = (pseudoRandom(seed + 7) - 0.5) * 160;
        const rotateAmp = pseudoRandom(seed + 8) * 40;

        list.push({
          size,
          top: `${topPercent}%` as DimensionValue,
          left: `${leftPercent}%` as DimensionValue,
          color,
          delayMs,
          durationMs,
          amplitudeX,
          amplitudeY,
          rotateAmplitude: rotateAmp > 1 ? rotateAmp : undefined,
        });

        i++;
      }
    }
    return list;
  }, [theme.colors.primary]);

  const svgColors = useMemo(
    () => buildNotFoundSvgColors(theme.name, theme),
    [theme],
  );

  const ViewWithMouse = View as any;
  const svgMaxWidth = isDesktop ? width * 0.7 : width * 0.9;

  return (
    <ViewWithMouse
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* 50 partículas */}
      {particles.map((p, i) => (
        <FloatingShape
          key={i}
          size={p.size}
          top={p.top}
          left={p.left}
          color={p.color}
          delayMs={p.delayMs}
          durationMs={p.durationMs}
          amplitudeX={p.amplitudeX}
          amplitudeY={p.amplitudeY}
          rotateAmplitude={p.rotateAmplitude}
          mouseX={mouseX}
          mouseY={mouseY}
        />
      ))}

      {/* Contenedor principal */}
      <View
        style={{
          width: "100%",
          flexDirection: isDesktop ? "row" : "column",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: isDesktop ? 48 : 24,
          paddingVertical: isDesktop ? 32 : 16,
        }}
      >
        {/* SVG (arriba en móvil, izquierda en escritorio) */}
        <Animated.View
          entering={FadeIn.duration(600).springify()}
          style={{
            flex: isDesktop ? 1 : undefined,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: isDesktop ? 0 : 24,
          }}
        >
          <NotFoundSvg colors={svgColors} maxWidth={svgMaxWidth} />
        </Animated.View>

        {/* Bloque de texto (abajo en móvil, derecha en escritorio) */}
        <Animated.View
          entering={FadeIn.duration(600).springify()}
          style={{
            flex: isDesktop ? 1 : undefined,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: isMobile ? width * 0.5 : Math.min(width * 0.3, 220),
              height: isMobile ? 70 : 80, // logo ligeramente más alto
              marginBottom: isMobile ? 8 : 16,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={logoImg}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </View>

          <Text
            style={{
              fontSize: isMobile ? 26 : 32, // más grande
              fontWeight: "800",
              color: theme.colors.text,
              textAlign: "center",
              marginTop: isMobile ? 6 : 10,
            }}
          >
            Página no encontrada
          </Text>
          <Text
            style={{
              fontSize: 15, // más grande
              color: theme.colors.muted,
              textAlign: "center",
              marginTop: isMobile ? 8 : 12,
              paddingHorizontal: isMobile ? 16 : 32,
              lineHeight: 22,
            }}
          >
            La ruta que buscas no existe o fue movida.{"\n"}
            Verifica la dirección o regresa a la anterior página.
          </Text>

          {/* Separador */}
          <Animated.View
            entering={FadeIn.delay(300).duration(600)}
            style={{
              width: 60,
              height: 3,
              backgroundColor: theme.colors.primary + "40",
              marginTop: isMobile ? 18 : 26,
              marginBottom: isMobile ? 22 : 26,
              alignSelf: "center",
              borderRadius: 2,
            }}
          />

          {/* Botón */}
          <Animated.View
            entering={SlideInDown.delay(500).springify().duration(500)}
            style={{ width: isMobile ? 200 : 220 }}
          >
            <SubmitButton
              title="Volver"
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/");
                }
              }}
              loading={false}
              disabled={false}
            />
          </Animated.View>

          {/* Error 404 */}
          <Animated.Text
            entering={FadeIn.delay(800).duration(400)}
            style={{
              fontSize: isMobile ? 13 : 14, // más grande
              color: theme.colors.muted,
              marginTop: isMobile ? 20 : 24,
              textAlign: "center",
              letterSpacing: 1,
            }}
          >
            ERROR 404
          </Animated.Text>
        </Animated.View>
      </View>
    </ViewWithMouse>
  );
}
