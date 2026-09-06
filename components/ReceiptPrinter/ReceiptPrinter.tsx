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
  ReceiptPrinterContext,
  useReceiptPrinter,
  useReceiptReducedMotion,
} from "./ReceiptPrinterContext";

import type {
  ReceiptPrinterDividerProps,
  ReceiptPrinterHeaderProps,
  ReceiptPrinterMachineProps,
  ReceiptPrinterOutputProps,
  ReceiptPrinterPaperProps,
  ReceiptPrinterRootProps,
  ReceiptPrinterScreenProps,
  ReceiptPrinterStatusProps,
  ReceiptPrinterTextProps,
} from "./ReceiptPrinter.types";

/*
|--------------------------------------------------------------------------
| CONSTANTES
|--------------------------------------------------------------------------
*/

const DEFAULT_PRINTING_DURATION =
  1750;

const DEFAULT_MAX_WIDTH =
  390;

const DEFAULT_OUTPUT_HEIGHT =
  520;

const DEFAULT_PAPER_WIDTH =
  "82%";

const PAPER_TEXT =
  "#111111";

const PAPER_TEXT_MUTED =
  "#707070";

const PAPER_BACKGROUND =
  "#FFFFFF";

const MACHINE_BACKGROUND =
  "#303030";

const MACHINE_BORDER =
  "#171717";

const MACHINE_SLOT =
  "#151515";

const SCREEN_BACKGROUND =
  "#1D1D1D";

const SCREEN_BORDER =
  "#111111";

const SCREEN_TEXT =
  "#F7F7F7";

const SCREEN_MUTED =
  "#A9A9A9";

/*
|--------------------------------------------------------------------------
| LABELS
|--------------------------------------------------------------------------
*/

const STATUS_LABELS = {
  processing:
    "Procesando...",

  printing:
    "Imprimiendo comprobante...",

  complete:
    "Impresión completada",
} as const;

/*
|--------------------------------------------------------------------------
| ROOT
|--------------------------------------------------------------------------
*/

function ReceiptPrinterRoot({
  stage,

  animate = true,

  feedMotion =
    "stepped",

  printingDuration =
    DEFAULT_PRINTING_DURATION,

  maxWidth =
    DEFAULT_MAX_WIDTH,

  paperWidth =
    DEFAULT_PAPER_WIDTH,

  outputHeight =
    DEFAULT_OUTPUT_HEIGHT,

  children,

  style,

  ...props
}: ReceiptPrinterRootProps) {
  const reduceMotion =
    useReceiptReducedMotion();

  const shouldMove =
    animate &&
    !reduceMotion;

  const contextValue =
    useMemo(
      () => ({
        stage,

        animate,

        feedMotion,

        printingDuration:

          Math.max(
            200,
            printingDuration,
          ),

        paperWidth,

        outputHeight:

          Math.max(
            200,
            outputHeight,
          ),

        reduceMotion,

        shouldMove,
      }),
      [
        stage,
        animate,
        feedMotion,
        printingDuration,
        paperWidth,
        outputHeight,
        reduceMotion,
        shouldMove,
      ],
    );

  return (
    <ReceiptPrinterContext.Provider
      value={
        contextValue
      }
    >
      <View
        {...props}
        accessibilityLabel={
          props.accessibilityLabel ??
          "Impresora de recibos"
        }
        style={[
          styles.root,

          {
            maxWidth,
          },

          style,
        ]}
      >
        {children}
      </View>
    </ReceiptPrinterContext.Provider>
  );
}

/*
|--------------------------------------------------------------------------
| MACHINE
|--------------------------------------------------------------------------
*/

function ReceiptPrinterMachine({
  children,

  style,

  ...props
}: ReceiptPrinterMachineProps) {
  return (
    <View
      {...props}
      style={[
        styles.machine,

        style,
      ]}
    >
      {/*
      |--------------------------------------------------------------------------
      | BRILLO SUPERIOR
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
      | CONTENIDO
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
      | RANURA
      |--------------------------------------------------------------------------
      */}

      <View
        pointerEvents="none"
        style={
          styles.slot
        }
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

function ReceiptPrinterHeader({
  children,

  style,

  ...props
}: ReceiptPrinterHeaderProps) {
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

function ReceiptPrinterScreen({
  children,

  style,

  ...props
}: ReceiptPrinterScreenProps) {
  return (
    <View
      {...props}
      style={[
        styles.screen,

        style,
      ]}
    >
      {/*
      |--------------------------------------------------------------------------
      | BRILLO PANTALLA
      |--------------------------------------------------------------------------
      */}

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
    useReceiptPrinter(
      "ReceiptPrinter.Status",
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

  const loopRef =
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
      loopRef.current?.stop();

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
                true,
            },
          ),
        );

      loopRef.current =
        animation;

      animation.start();

      return () => {
        animation.stop();
      };
    },
    [
      rotation,
      isComplete,
      shouldMove,
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
          styles.statusIconContainer
        }
      >
        <CheckCircle2
          size={
            18
          }
          strokeWidth={
            2.7
          }
          color={
            theme.colors.success
          }
          fill={
            theme.colors.success
          }
        />
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PROCESSING / PRINTING
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={
        styles.statusIconContainer
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
          size={
            18
          }
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

function ReceiptPrinterStatus({
  children,

  style,

  ...props
}: ReceiptPrinterStatusProps) {
  const {
    stage,
  } =
    useReceiptPrinter(
      "ReceiptPrinter.Status",
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
            styles.statusCustomContent
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

function ReceiptPrinterOutput({
  children,

  style,

  ...props
}: ReceiptPrinterOutputProps) {
  const {
    stage,

    feedMotion,

    shouldMove,

    printingDuration,

    paperWidth,

    outputHeight,
  } =
    useReceiptPrinter(
      "ReceiptPrinter.Output",
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
  | MEDIR PAPEL
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
  | ANIMACIÓN
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

      /*
      |--------------------------------------------------------------------------
      | El papel queda escondido
      | detrás de la impresora.
      |--------------------------------------------------------------------------
      */

      const hiddenPosition =
        -Math.max(
          measuredHeight -
            4,
          200,
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
      | COMPLETE DIRECTO / REDUCED MOTION
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
                  true,
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
                  true,
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
      |
      | Simula el avance de una
      | impresora térmica.
      |--------------------------------------------------------------------------
      */

      const steps =
        12;

      const stepDuration =
        Math.max(
          24,
          Math.floor(
            printingDuration /
              steps *
              0.62,
          ),
        );

      const pauseDuration =
        Math.max(
          12,
          Math.floor(
            printingDuration /
              steps -
              stepDuration,
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
                stepDuration,

              easing:
                Easing.out(
                  Easing.quad,
                ),

              useNativeDriver:
                true,
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
      {/*
      |--------------------------------------------------------------------------
      | SOMBRA DE LA RANURA
      |--------------------------------------------------------------------------
      */}

      {stage !==
      "processing" ? (
        <View
          pointerEvents="none"
          style={
            styles.outputTopShadow
          }
        />
      ) : null}

      <Animated.View
        onLayout={
          handlePaperLayout
        }
        style={[
          styles.paperAnimationContainer,

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

function ReceiptPrinterPaper({
  children,

  style,

  paperColor =
    PAPER_BACKGROUND,

  ...props
}: ReceiptPrinterPaperProps) {
  const teeth =
    useMemo(
      () =>
        Array.from({
          length:
            42,
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
      {/*
      |--------------------------------------------------------------------------
      | PAPEL
      |--------------------------------------------------------------------------
      */}

      <View
        style={[
          styles.paper,

          {
            backgroundColor:
              paperColor,
          },
        ]}
      >
        {children}
      </View>

      {/*
      |--------------------------------------------------------------------------
      | BORDE DENTADO
      |--------------------------------------------------------------------------
      */}

      <View
        pointerEvents="none"
        style={
          styles.teethClip
        }
      >
        <View
          style={
            styles.teethRow
          }
        >
          {teeth.map(
            (
              _,
              index,
            ) => (
              <View
                key={
                  index
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
      </View>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| PAPER TEXT
|--------------------------------------------------------------------------
*/

function ReceiptPrinterText({
  children,

  tone =
    "default",

  style,

  ...props
}: ReceiptPrinterTextProps) {
  const color =
    tone ===
    "muted"
      ? PAPER_TEXT_MUTED
      : PAPER_TEXT;

  const weight =
    tone ===
    "strong"
      ? "800"
      : "500";

  return (
    <Text
      {...props}
      style={[
        styles.paperText,

        {
          color,

          fontWeight:
            weight,
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

function ReceiptPrinterDivider({
  style,

  ...props
}: ReceiptPrinterDividerProps) {
  return (
    <View
      {...props}
      style={[
        styles.divider,

        style,
      ]}
    />
  );
}

/*
|--------------------------------------------------------------------------
| EXPORT COMPOUND COMPONENT
|--------------------------------------------------------------------------
*/

export const ReceiptPrinter = {
  Root:
    ReceiptPrinterRoot,

  Machine:
    ReceiptPrinterMachine,

  Header:
    ReceiptPrinterHeader,

  Screen:
    ReceiptPrinterScreen,

  Status:
    ReceiptPrinterStatus,

  Output:
    ReceiptPrinterOutput,

  Paper:
    ReceiptPrinterPaper,

  Text:
    ReceiptPrinterText,

  Divider:
    ReceiptPrinterDivider,
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
        32,

      shadowColor:
        "#000000",

      shadowOffset: {
        width:
          0,

        height:
          14,
      },

      shadowOpacity:
        0.28,

      shadowRadius:
        18,

      elevation:
        12,

      zIndex:
        20,
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
        "rgba(255,255,255,0.13)",
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
      minHeight:
        38,

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

      minHeight:
        104,

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

      left:
        0,

      top:
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
        "#111111",

      justifyContent:
        "center",

      overflow:
        "hidden",

      zIndex:
        5,
    },

    slotInner: {
      height:
        2,

      marginHorizontal:
        4,

      borderRadius:
        2,

      backgroundColor:
        "rgba(0,0,0,0.72)",
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

    statusIconContainer: {
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

    statusCustomContent: {
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
        -17,

      overflow:
        "hidden",

      zIndex:
        10,

      paddingHorizontal:
        10,
    },

    outputTopShadow: {
      position:
        "absolute",

      top:
        0,

      left:
        12,

      right:
        12,

      height:
        11,

      borderRadius:
        10,

      backgroundColor:
        "rgba(0,0,0,0.28)",

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
        0.24,

      shadowRadius:
        8,

      elevation:
        8,
    },

    paperAnimationContainer: {
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
          8,
      },

      shadowOpacity:
        0.16,

      shadowRadius:
        12,

      elevation:
        6,
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

      minHeight:
        320,

      paddingHorizontal:
        24,

      paddingTop:
        28,

      paddingBottom:
        26,

      position:
        "relative",
    },

    /*
    |--------------------------------------------------------------------------
    | DIENTES
    |--------------------------------------------------------------------------
    */

    teethClip: {
      width:
        "100%",

      height:
        7,

      overflow:
        "hidden",

      marginTop:
        -1,
    },

    teethRow: {
      height:
        14,

      marginTop:
        -7,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      overflow:
        "hidden",
    },

    tooth: {
      width:
        10,

      height:
        10,

      marginHorizontal:
        -0.5,

      transform: [
        {
          rotate:
            "45deg",
        },
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | PAPER TEXT
    |--------------------------------------------------------------------------
    */

    paperText: {
      fontSize:
        11,

      lineHeight:
        16,

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
        "#D6D6D6",

      borderStyle:
        "dashed",

      marginVertical:
        14,
    },
  });

/*
|--------------------------------------------------------------------------
| COLORES EXPORTABLES
|--------------------------------------------------------------------------
|
| Por si luego necesitamos crear componentes especializados para
| tickets manteniendo exactamente el mismo diseño.
|
*/

export const ReceiptPrinterColors = {
  machine:
    MACHINE_BACKGROUND,

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