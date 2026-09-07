import {
  CheckCircle2,
  LoaderCircle,
} from "lucide-react-native";

import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  PrinterContext,
  usePrinter,
  usePrinterReducedMotion,
} from "./PrinterContext";

import type {
  PrinterDividerProps,
  PrinterHeaderProps,
  PrinterMachineProps,
  PrinterOutputProps,
  PrinterPaperProps,
  PrinterPaperSize,
  PrinterRootProps,
  PrinterScreenProps,
  PrinterStatusProps,
  PrinterTextProps,
} from "./Printer.types";

/*
|--------------------------------------------------------------------------
| COLORS
|--------------------------------------------------------------------------
*/

const MACHINE_BACKGROUND =
  "#303030";

const MACHINE_BACKGROUND_DARK =
  "#282828";

const MACHINE_BORDER =
  "#161616";

const MACHINE_SLOT =
  "#101010";

const SCREEN_BACKGROUND =
  "#1B1B1B";

const SCREEN_BORDER =
  "#101010";

const SCREEN_TEXT =
  "#FFFFFF";

const SCREEN_MUTED =
  "#A7A7A7";

const PAPER_BACKGROUND =
  "#FFFFFF";

const PAPER_TEXT =
  "#111111";

const PAPER_TEXT_MUTED =
  "#707070";

/*
|--------------------------------------------------------------------------
| NATIVE DRIVER
|--------------------------------------------------------------------------
*/

const USE_NATIVE_DRIVER =
  Platform.OS !==
  "web";

/*
|--------------------------------------------------------------------------
| PRESETS
|--------------------------------------------------------------------------
*/

type PaperPreset = {
  machineMaxWidth:
    number;

  paperWidth:
    `${number}%`;

  outputHeight:
    number;

  printingDuration:
    number;

  aspectRatio:
    number | undefined;

  minHeight:
    number;

  serrated:
    boolean;

  paperPadding:
    number;
};

const PAPER_PRESETS:
  Record<
    Exclude<
      PrinterPaperSize,
      "custom"
    >,
    PaperPreset
  > = {
  /*
  |--------------------------------------------------------------------------
  | TICKET
  |--------------------------------------------------------------------------
  */

  receipt: {
    machineMaxWidth:
      390,

    paperWidth:
      "82%",

    outputHeight:
      520,

    printingDuration:
      1750,

    aspectRatio:
      undefined,

    minHeight:
      320,

    serrated:
      true,

    paperPadding:
      24,
  },

  /*
  |--------------------------------------------------------------------------
  | CARTA
  |--------------------------------------------------------------------------
  |
  | 8.5 x 11 pulgadas
  |
  | aspectRatio = ancho / alto
  |
  |--------------------------------------------------------------------------
  */

  letter: {
    machineMaxWidth:
      760,

    paperWidth:
      "88%",

    outputHeight:
      920,

    printingDuration:
      2600,

    aspectRatio:
      8.5 / 11,

    minHeight:
      700,

    serrated:
      false,

    paperPadding:
      38,
  },

  /*
  |--------------------------------------------------------------------------
  | A4
  |--------------------------------------------------------------------------
  |
  | 210 x 297 mm
  |--------------------------------------------------------------------------
  */

  a4: {
    machineMaxWidth:
      740,

    paperWidth:
      "86%",

    outputHeight:
      940,

    printingDuration:
      2700,

    aspectRatio:
      210 / 297,

    minHeight:
      720,

    serrated:
      false,

    paperPadding:
      38,
  },
};

/*
|--------------------------------------------------------------------------
| STATUS LABELS
|--------------------------------------------------------------------------
*/

const STATUS_LABELS = {
  processing:
    "Preparando documento...",

  printing:
    "Imprimiendo documento...",

  complete:
    "Documento impreso",
} as const;

/*
|--------------------------------------------------------------------------
| ROOT
|--------------------------------------------------------------------------
*/

function PrinterRoot({
  stage,

  paperSize =
    "letter",

  customPaper,

  animate = true,

  feedMotion =
    "smooth",

  printingDuration,

  machineMaxWidth,

  paperWidth,

  outputHeight,

  children,

  style,

  ...props
}: PrinterRootProps) {
  const reduceMotion =
    usePrinterReducedMotion();

  /*
  |--------------------------------------------------------------------------
  | PRESET
  |--------------------------------------------------------------------------
  */

  const preset =
    paperSize ===
    "custom"
      ? null
      : PAPER_PRESETS[
          paperSize
        ];

  /*
  |--------------------------------------------------------------------------
  | CONFIG
  |--------------------------------------------------------------------------
  */

  const resolvedMachineMaxWidth =
    machineMaxWidth ??
    preset?.machineMaxWidth ??
    650;

  const resolvedPaperWidth =
    paperWidth ??
    preset?.paperWidth ??
    "86%";

  const resolvedOutputHeight =
    outputHeight ??
    preset?.outputHeight ??
    800;

  const resolvedDuration =
    Math.max(
      200,

      printingDuration ??
        preset?.printingDuration ??
        2400,
    );

  const resolvedAspectRatio =
    paperSize ===
    "custom"
      ? customPaper?.aspectRatio
      : preset?.aspectRatio;

  const resolvedMinHeight =
    paperSize ===
    "custom"
      ? customPaper?.minHeight ??
        500
      : preset?.minHeight ??
        500;

  const resolvedSerrated =
    paperSize ===
    "custom"
      ? customPaper?.serrated ??
        false
      : preset?.serrated ??
        false;

  const shouldMove =
    animate &&
    !reduceMotion;

  /*
  |--------------------------------------------------------------------------
  | CONTEXT VALUE
  |--------------------------------------------------------------------------
  */

  const contextValue =
    useMemo(
      () => ({
        stage,

        paperSize,

        animate,

        feedMotion,

        printingDuration:
          resolvedDuration,

        paperWidth:
          resolvedPaperWidth,

        outputHeight:
          resolvedOutputHeight,

        paperAspectRatio:
          resolvedAspectRatio,

        paperMinHeight:
          resolvedMinHeight,

        serrated:
          resolvedSerrated,

        reduceMotion,

        shouldMove,
      }),
      [
        stage,
        paperSize,
        animate,
        feedMotion,
        resolvedDuration,
        resolvedPaperWidth,
        resolvedOutputHeight,
        resolvedAspectRatio,
        resolvedMinHeight,
        resolvedSerrated,
        reduceMotion,
        shouldMove,
      ],
    );

  return (
    <PrinterContext.Provider
      value={
        contextValue
      }
    >
      <View
        {...props}
        accessibilityLabel={
          props.accessibilityLabel ??
          "Impresora"
        }
        style={[
          styles.root,

          {
            maxWidth:
              resolvedMachineMaxWidth,
          },

          style,
        ]}
      >
        {children}
      </View>
    </PrinterContext.Provider>
  );
}

/*
|--------------------------------------------------------------------------
| MACHINE
|--------------------------------------------------------------------------
*/

function PrinterMachine({
  children,

  style,

  ...props
}: PrinterMachineProps) {
  const {
    paperSize,
  } =
    usePrinter(
      "Printer.Machine",
    );

  const isDocumentPrinter =
    paperSize ===
      "letter" ||
    paperSize ===
      "a4" ||
    paperSize ===
      "custom";

  return (
    <View
      {...props}
      style={[
        styles.machine,

        isDocumentPrinter &&
          styles.documentMachine,

        style,
      ]}
    >
      {/*
      |--------------------------------------------------------------------------
      | HIGHLIGHT
      |--------------------------------------------------------------------------
      */}

      <View
        pointerEvents="none"
        style={
          styles.machineHighlight
        }
      />

      {/*
      |--------------------------------------------------------------------------
      | SHADE
      |--------------------------------------------------------------------------
      */}

      <View
        pointerEvents="none"
        style={
          styles.machineShade
        }
      />

      {/*
      |--------------------------------------------------------------------------
      | CONTENT
      |--------------------------------------------------------------------------
      */}

      <View
        style={
          styles.machineContent
        }
      >
        {children}
      </View>

      {/*
      |--------------------------------------------------------------------------
      | PAPER SLOT
      |--------------------------------------------------------------------------
      */}

      <View
        pointerEvents="none"
        style={[
          styles.slot,

          isDocumentPrinter &&
            styles.documentSlot,
        ]}
      >
        <View
          style={
            styles.slotInner
          }
        />
      </View>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| HEADER
|--------------------------------------------------------------------------
*/

function PrinterHeader({
  children,

  style,

  ...props
}: PrinterHeaderProps) {
  return (
    <View
      {...props}
      style={[
        styles.header,

        style,
      ]}
    >
      {children}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

function PrinterScreen({
  children,

  style,

  ...props
}: PrinterScreenProps) {
  return (
    <View
      {...props}
      style={[
        styles.screen,

        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={
          styles.screenHighlight
        }
      />

      <View
        style={
          styles.screenContent
        }
      >
        {children}
      </View>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| STATUS INDICATOR
|--------------------------------------------------------------------------
*/

function StatusIndicator() {
  const {
    stage,
    shouldMove,
  } =
    usePrinter(
      "Printer.Status",
    );

  const {
    theme,
  } =
    useTheme();

  const rotation =
    useRef(
      new Animated.Value(
        0,
      ),
    ).current;

  const animationRef =
    useRef<
      Animated.CompositeAnimation | null
    >(
      null,
    );

  const isComplete =
    stage ===
    "complete";

  /*
  |--------------------------------------------------------------------------
  | SPINNER
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      animationRef.current?.stop();

      rotation.stopAnimation();

      if (
        isComplete ||
        !shouldMove
      ) {
        rotation.setValue(
          0,
        );

        return;
      }

      rotation.setValue(
        0,
      );

      const animation =
        Animated.loop(
          Animated.timing(
            rotation,
            {
              toValue:
                1,

              duration:
                850,

              easing:
                Easing.linear,

              useNativeDriver:
                USE_NATIVE_DRIVER,
            },
          ),
        );

      animationRef.current =
        animation;

      animation.start();

      return () => {
        animation.stop();
      };
    },
    [
      isComplete,
      shouldMove,
      rotation,
    ],
  );

  const rotate =
    rotation.interpolate({
      inputRange: [
        0,
        1,
      ],

      outputRange: [
        "0deg",
        "360deg",
      ],
    });

  /*
  |--------------------------------------------------------------------------
  | COMPLETE
  |--------------------------------------------------------------------------
  */

  if (
    isComplete
  ) {
    return (
      <View
        style={
          styles.statusIcon
        }
      >
        <CheckCircle2
          size={18}
          strokeWidth={
            2.8
          }
          color={
            theme.colors.success
          }
        />
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={
        styles.statusIcon
      }
    >
      <Animated.View
        style={{
          transform: [
            {
              rotate,
            },
          ],
        }}
      >
        <LoaderCircle
          size={18}
          strokeWidth={
            2.7
          }
          color={
            SCREEN_MUTED
          }
        />
      </Animated.View>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

function PrinterStatus({
  children,

  style,

  ...props
}: PrinterStatusProps) {
  const {
    stage,
  } =
    usePrinter(
      "Printer.Status",
    );

  const content =
    children ??
    STATUS_LABELS[
      stage
    ];

  return (
    <View
      {...props}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      style={[
        styles.status,

        style,
      ]}
    >
      <StatusIndicator />

      {typeof content ===
      "string" ? (
        <Text
          numberOfLines={
            1
          }
          style={
            styles.statusText
          }
        >
          {content}
        </Text>
      ) : (
        <View
          style={
            styles.statusCustom
          }
        >
          {content}
        </View>
      )}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| OUTPUT
|--------------------------------------------------------------------------
*/

function PrinterOutput({
  children,

  style,

  ...props
}: PrinterOutputProps) {
  const {
    stage,
    feedMotion,
    shouldMove,
    printingDuration,
    paperWidth,
    outputHeight,
  } =
    usePrinter(
      "Printer.Output",
    );

  const [
    paperHeight,
    setPaperHeight,
  ] =
    useState(0);

  const translateY =
    useRef(
      new Animated.Value(
        -outputHeight,
      ),
    ).current;

  const opacity =
    useRef(
      new Animated.Value(
        stage ===
          "processing"
          ? 0
          : 1,
      ),
    ).current;

  const animationRef =
    useRef<
      Animated.CompositeAnimation | null
    >(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | PAPER LAYOUT
  |--------------------------------------------------------------------------
  */

  const handlePaperLayout =
    (
      event:
        LayoutChangeEvent,
    ) => {
      const height =
        event.nativeEvent
          .layout
          .height;

      if (
        height >
        0
      ) {
        setPaperHeight(
          height,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | ANIMATION
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      animationRef.current?.stop();

      translateY.stopAnimation();

      opacity.stopAnimation();

      const measuredHeight =
        paperHeight >
        0
          ? paperHeight
          : outputHeight;

      const hiddenPosition =
        -Math.max(
          measuredHeight -
            5,
          240,
        );

      /*
      |--------------------------------------------------------------------------
      | PROCESSING
      |--------------------------------------------------------------------------
      */

      if (
        stage ===
        "processing"
      ) {
        translateY.setValue(
          hiddenPosition,
        );

        opacity.setValue(
          0,
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | COMPLETE / REDUCED MOTION
      |--------------------------------------------------------------------------
      */

      if (
        stage ===
          "complete" ||
        !shouldMove
      ) {
        translateY.setValue(
          0,
        );

        opacity.setValue(
          1,
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | PRINTING
      |--------------------------------------------------------------------------
      */

      translateY.setValue(
        hiddenPosition,
      );

      opacity.setValue(
        1,
      );

      /*
      |--------------------------------------------------------------------------
      | SMOOTH
      |--------------------------------------------------------------------------
      */

      if (
        feedMotion ===
        "smooth"
      ) {
        const animation =
          Animated.parallel([
            Animated.timing(
              opacity,
              {
                toValue:
                  1,

                duration:
                  140,

                useNativeDriver:
                  USE_NATIVE_DRIVER,
              },
            ),

            Animated.timing(
              translateY,
              {
                toValue:
                  0,

                duration:
                  printingDuration,

                easing:
                  Easing.bezier(
                    0.23,
                    1,
                    0.32,
                    1,
                  ),

                useNativeDriver:
                  USE_NATIVE_DRIVER,
              },
            ),
          ]);

        animationRef.current =
          animation;

        animation.start();

        return () => {
          animation.stop();
        };
      }

      /*
      |--------------------------------------------------------------------------
      | STEPPED
      |--------------------------------------------------------------------------
      */

      const steps =
        16;

      const totalStepDuration =
        printingDuration /
        steps;

      const movementDuration =
        Math.max(
          20,
          Math.floor(
            totalStepDuration *
              0.7,
          ),
        );

      const pauseDuration =
        Math.max(
          8,
          Math.floor(
            totalStepDuration -
              movementDuration,
          ),
        );

      const animations:
        Animated.CompositeAnimation[] =
        [];

      for (
        let step =
          1;
        step <=
        steps;
        step++
      ) {
        const progress =
          step /
          steps;

        const destination =
          hiddenPosition *
          (
            1 -
            progress
          );

        animations.push(
          Animated.timing(
            translateY,
            {
              toValue:
                destination,

              duration:
                movementDuration,

              easing:
                Easing.out(
                  Easing.quad,
                ),

              useNativeDriver:
                USE_NATIVE_DRIVER,
            },
          ),
        );

        if (
          step <
          steps
        ) {
          animations.push(
            Animated.delay(
              pauseDuration,
            ),
          );
        }
      }

      const animation =
        Animated.sequence(
          animations,
        );

      animationRef.current =
        animation;

      animation.start();

      return () => {
        animation.stop();
      };
    },
    [
      stage,
      feedMotion,
      shouldMove,
      printingDuration,
      paperHeight,
      outputHeight,
      opacity,
      translateY,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <View
      {...props}
      style={[
        styles.output,

        {
          width:
            paperWidth,

          height:
            outputHeight,
        },

        style,
      ]}
    >
      {stage !==
      "processing" ? (
        <View
          pointerEvents="none"
          style={
            styles.outputShadow
          }
        />
      ) : null}

      <Animated.View
        onLayout={
          handlePaperLayout
        }
        style={[
          styles.paperAnimation,

          {
            opacity,

            transform: [
              {
                translateY,
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| PAPER
|--------------------------------------------------------------------------
*/

function PrinterPaper({
  children,

  style,

  paperColor =
    PAPER_BACKGROUND,

  padding,

  ...props
}: PrinterPaperProps) {
  const {
    paperSize,
    paperAspectRatio,
    paperMinHeight,
    serrated,
  } =
    usePrinter(
      "Printer.Paper",
    );

  /*
  |--------------------------------------------------------------------------
  | DEFAULT PADDING
  |--------------------------------------------------------------------------
  */

  const defaultPadding =
    paperSize ===
      "receipt"
      ? 24
      : 38;

  /*
  |--------------------------------------------------------------------------
  | TEETH
  |--------------------------------------------------------------------------
  */

  const teeth =
    useMemo(
      () =>
        Array.from({
          length:
            60,
        }),
      [],
    );

  return (
    <View
      {...props}
      style={[
        styles.paperWrapper,

        style,
      ]}
    >
      <View
        style={[
          styles.paper,

          {
            backgroundColor:
              paperColor,

            minHeight:
              paperMinHeight,

            padding:
              padding ??
              defaultPadding,
          },

          paperAspectRatio
            ? {
                aspectRatio:
                  paperAspectRatio,
              }
            : null,
        ]}
      >
        {children}
      </View>

      {/*
      |--------------------------------------------------------------------------
      | TICKET SERRATED EDGE
      |--------------------------------------------------------------------------
      */}

      {serrated ? (
        <View
          pointerEvents="none"
          style={
            styles.teethContainer
          }
        >
          {teeth.map(
            (
              _,
              index,
            ) => (
              <View
                key={
                  `printer-tooth-${index}`
                }
                style={[
                  styles.tooth,

                  {
                    backgroundColor:
                      paperColor,
                  },
                ]}
              />
            ),
          )}
        </View>
      ) : null}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| TEXT
|--------------------------------------------------------------------------
*/

function PrinterText({
  children,

  tone =
    "default",

  style,

  ...props
}: PrinterTextProps) {
  const color =
    tone ===
    "muted"
      ? PAPER_TEXT_MUTED
      : PAPER_TEXT;

  return (
    <Text
      {...props}
      style={[
        styles.paperText,

        {
          color,

          fontWeight:
            tone ===
            "strong"
              ? "800"
              : "400",
        },

        style,
      ]}
    >
      {children}
    </Text>
  );
}

/*
|--------------------------------------------------------------------------
| DIVIDER
|--------------------------------------------------------------------------
*/

function PrinterDivider({
  dashed =
    false,

  style,

  ...props
}: PrinterDividerProps) {
  return (
    <View
      {...props}
      style={[
        styles.divider,

        dashed && {
          borderStyle:
            "dashed",
        },

        style,
      ]}
    />
  );
}

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export const Printer = {
  Root:
    PrinterRoot,

  Machine:
    PrinterMachine,

  Header:
    PrinterHeader,

  Screen:
    PrinterScreen,

  Status:
    PrinterStatus,

  Output:
    PrinterOutput,

  Paper:
    PrinterPaper,

  Text:
    PrinterText,

  Divider:
    PrinterDivider,
};

/*
|--------------------------------------------------------------------------
| COLORS
|--------------------------------------------------------------------------
*/

export const PrinterColors = {
  machine:
    MACHINE_BACKGROUND,

  machineDark:
    MACHINE_BACKGROUND_DARK,

  machineBorder:
    MACHINE_BORDER,

  screen:
    SCREEN_BACKGROUND,

  screenBorder:
    SCREEN_BORDER,

  screenText:
    SCREEN_TEXT,

  screenMuted:
    SCREEN_MUTED,

  paper:
    PAPER_BACKGROUND,

  paperText:
    PAPER_TEXT,

  paperMuted:
    PAPER_TEXT_MUTED,
};

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    /*
    |--------------------------------------------------------------------------
    | ROOT
    |--------------------------------------------------------------------------
    */

    root: {
      width:
        "100%",

      alignSelf:
        "center",

      alignItems:
        "center",

      position:
        "relative",
    },

    /*
    |--------------------------------------------------------------------------
    | MACHINE
    |--------------------------------------------------------------------------
    */

    machine: {
      width:
        "100%",

      position:
        "relative",

      overflow:
        "hidden",

      borderRadius:
        24,

      borderWidth:
        1,

      borderColor:
        MACHINE_BORDER,

      backgroundColor:
        MACHINE_BACKGROUND,

      padding:
        12,

      paddingBottom:
        34,

      shadowColor:
        "#000000",

      shadowOffset: {
        width:
          0,

        height:
          14,
      },

      shadowOpacity:
        0.3,

      shadowRadius:
        20,

      elevation:
        12,

      zIndex:
        20,
    },

    documentMachine: {
      paddingHorizontal:
        18,

      paddingTop:
        16,

      paddingBottom:
        38,

      borderRadius:
        26,
    },

    machineHighlight: {
      position:
        "absolute",

      top:
        0,

      left:
        0,

      right:
        0,

      height:
        2,

      backgroundColor:
        "rgba(255,255,255,0.14)",
    },

    machineShade: {
      position:
        "absolute",

      left:
        0,

      right:
        0,

      bottom:
        0,

      height:
        40,

      backgroundColor:
        MACHINE_BACKGROUND_DARK,

      opacity:
        0.9,
    },

    machineContent: {
      position:
        "relative",

      zIndex:
        2,
    },

    /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

    header: {
      width:
        "100%",

      minHeight:
        42,

      flexDirection:
        "row",

      alignItems:
        "flex-start",

      justifyContent:
        "space-between",

      gap:
        12,
    },

    /*
    |--------------------------------------------------------------------------
    | SCREEN
    |--------------------------------------------------------------------------
    */

    screen: {
      width:
        "100%",

      minHeight:
        108,

      position:
        "relative",

      overflow:
        "hidden",

      borderRadius:
        15,

      borderWidth:
        1,

      borderColor:
        SCREEN_BORDER,

      backgroundColor:
        SCREEN_BACKGROUND,

      padding:
        16,

      shadowColor:
        "#000000",

      shadowOffset: {
        width:
          0,

        height:
          2,
      },

      shadowOpacity:
        0.25,

      shadowRadius:
        5,

      elevation:
        3,
    },

    screenHighlight: {
      position:
        "absolute",

      top:
        0,

      left:
        0,

      right:
        0,

      height:
        1,

      backgroundColor:
        "rgba(255,255,255,0.08)",
    },

    screenContent: {
      position:
        "relative",

      zIndex:
        2,

      gap:
        10,
    },

    /*
    |--------------------------------------------------------------------------
    | SLOT
    |--------------------------------------------------------------------------
    */

    slot: {
      position:
        "absolute",

      left:
        24,

      right:
        24,

      bottom:
        11,

      height:
        9,

      borderRadius:
        5,

      backgroundColor:
        MACHINE_SLOT,

      borderWidth:
        1,

      borderColor:
        "#070707",

      justifyContent:
        "center",

      overflow:
        "hidden",

      zIndex:
        5,
    },

    documentSlot: {
      left:
        34,

      right:
        34,

      height:
        11,
    },

    slotInner: {
      height:
        2,

      marginHorizontal:
        5,

      borderRadius:
        2,

      backgroundColor:
        "#050505",
    },

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    status: {
      minHeight:
        22,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        8,
    },

    statusIcon: {
      width:
        20,

      height:
        20,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    statusText: {
      flex:
        1,

      color:
        SCREEN_MUTED,

      fontSize:
        12,

      lineHeight:
        16,

      fontWeight:
        "600",
    },

    statusCustom: {
      flex:
        1,
    },

    /*
    |--------------------------------------------------------------------------
    | OUTPUT
    |--------------------------------------------------------------------------
    */

    output: {
      position:
        "relative",

      marginTop:
        -18,

      overflow:
        "hidden",

      zIndex:
        10,

      paddingHorizontal:
        10,
    },

    outputShadow: {
      position:
        "absolute",

      top:
        0,

      left:
        10,

      right:
        10,

      height:
        12,

      borderRadius:
        10,

      backgroundColor:
        "rgba(0,0,0,0.32)",

      zIndex:
        20,

      shadowColor:
        "#000000",

      shadowOffset: {
        width:
          0,

        height:
          4,
      },

      shadowOpacity:
        0.25,

      shadowRadius:
        8,

      elevation:
        8,
    },

    paperAnimation: {
      position:
        "relative",

      zIndex:
        10,

      shadowColor:
        "#000000",

      shadowOffset: {
        width:
          0,

        height:
          10,
      },

      shadowOpacity:
        0.17,

      shadowRadius:
        16,

      elevation:
        7,
    },

    /*
    |--------------------------------------------------------------------------
    | PAPER
    |--------------------------------------------------------------------------
    */

    paperWrapper: {
      width:
        "100%",

      position:
        "relative",
    },

    paper: {
      width:
        "100%",

      position:
        "relative",

      backgroundColor:
        PAPER_BACKGROUND,

      shadowColor:
        "#000000",

      shadowOffset: {
        width:
          0,

        height:
          4,
      },

      shadowOpacity:
        0.08,

      shadowRadius:
        8,

      elevation:
        2,
    },

    /*
    |--------------------------------------------------------------------------
    | TEETH
    |--------------------------------------------------------------------------
    */

    teethContainer: {
      height:
        7,

      marginTop:
        -5,

      flexDirection:
        "row",

      alignItems:
        "flex-start",

      justifyContent:
        "center",

      overflow:
        "hidden",
    },

    tooth: {
      width:
        9,

      height:
        9,

      marginHorizontal:
        -0.6,

      transform: [
        {
          rotate:
            "45deg",
        },
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | TEXT
    |--------------------------------------------------------------------------
    */

    paperText: {
      fontSize:
        12,

      lineHeight:
        18,

      color:
        PAPER_TEXT,

      fontFamily:
        Platform.select({
          ios:
            "Menlo",

          android:
            "monospace",

          web:
            "monospace",

          default:
            "monospace",
        }),
    },

    /*
    |--------------------------------------------------------------------------
    | DIVIDER
    |--------------------------------------------------------------------------
    */

    divider: {
      width:
        "100%",

      borderTopWidth:
        1,

      borderTopColor:
        "#D2D2D2",

      marginVertical:
        16,
    },
  });