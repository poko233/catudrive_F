// components/ui/Modal.tsx

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  useTheme,
} from "@/theme/useTheme";

import React, {
  ReactNode,
} from "react";

import {
  DimensionValue,
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface ModalProps {
  visible: boolean;

  /**
   * Título opcional.
   */
  title?: string;

  /**
   * Contenido principal.
   */
  children: ReactNode;

  /**
   * Función para cerrar.
   */
  onClose: () => void;

  /**
   * Permite cerrar haciendo clic en el fondo.
   */
  closeOnBackdropPress?: boolean;

  /**
   * Ancho del modal.
   */
  width?: DimensionValue;

  /**
   * Ancho máximo.
   */
  maxWidth?: number;

  /**
   * Altura máxima personalizada.
   *
   * Si no se proporciona, se adapta
   * automáticamente a la pantalla.
   */
  maxHeight?: number;

  /**
   * Activa scroll vertical automático
   * para el contenido.
   *
   * Por defecto: true.
   */
  scrollable?: boolean;

  /**
   * Padding interior del contenido.
   */
  contentPadding?: number;

  /**
   * Estilo adicional del contenido.
   */
  contentStyle?: StyleProp<ViewStyle>;

  /**
   * Footer opcional.
   *
   * Ideal para botones.
   * Se mantiene fijo.
   */
  footer?: ReactNode;
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function Modal({
  visible,

  title,

  children,

  onClose,

  closeOnBackdropPress = true,

  width = "100%",

  maxWidth = 520,

  maxHeight,

  scrollable = true,

  contentPadding = 20,

  contentStyle,

  footer,
}: ModalProps) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const {
    height:
      windowHeight,

    width:
      windowWidth,
  } =
    useWindowDimensions();

  /*
  |--------------------------------------------------------------------------
  | RESPONSIVE
  |--------------------------------------------------------------------------
  */

  const compact =
    windowWidth <
    600;

  const backdropPadding =
    compact
      ? 10
      : 20;

  /*
  |--------------------------------------------------------------------------
  | ALTURA MÁXIMA AUTOMÁTICA
  |--------------------------------------------------------------------------
  |
  | El modal nunca debe salirse de la pantalla.
  |
  | Header:
  |   fijo
  |
  | Contenido:
  |   scroll
  |
  | Footer:
  |   fijo
  |
  */

  const automaticMaxHeight =
    Math.max(
      300,

      windowHeight -
        backdropPadding *
          2,
    );

  const resolvedMaxHeight =
    maxHeight !== undefined
      ? Math.min(
          maxHeight,
          automaticMaxHeight,
        )
      : automaticMaxHeight;

  /*
  |--------------------------------------------------------------------------
  | CONTENT
  |--------------------------------------------------------------------------
  */

  const renderedContent =
    scrollable ? (
      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={[
          styles.scrollContent,

          {
            padding:
              contentPadding,
          },

          contentStyle,
        ]}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {children}
      </ScrollView>
    ) : (
      <View
        style={[
          styles.staticContent,

          {
            padding:
              contentPadding,
          },

          contentStyle,
        ]}
      >
        {children}
      </View>
    );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <RNModal
      visible={
        visible
      }
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={
        onClose
      }
    >
      <View
        style={[
          styles.backdrop,

          {
            padding:
              backdropPadding,

            backgroundColor:
              c.overlay ??
              "rgba(0,0,0,0.5)",
          },
        ]}
      >
        {/* ================================================= */}
        {/* BACKDROP */}
        {/* ================================================= */}

        {closeOnBackdropPress ? (
          <Pressable
            style={
              StyleSheet.absoluteFill
            }
            onPress={
              onClose
            }
          />
        ) : null}

        {/* ================================================= */}
        {/* MODAL */}
        {/* ================================================= */}

        <View
          style={[
            styles.modal,

            {
              width,

              maxWidth,

              maxHeight:
                resolvedMaxHeight,

              backgroundColor:
                c.card,

              borderColor:
                c.border,
            },
          ]}
        >
          {/* ================================================= */}
          {/* HEADER FIJO */}
          {/* ================================================= */}

          <View
            style={[
              styles.header,

              {
                borderBottomColor:
                  c.border,
              },
            ]}
          >
            {/* =============================================== */}
            {/* TÍTULO */}
            {/* =============================================== */}

            <View
              style={
                styles.titleContainer
              }
            >
              {title ? (
                <ThemedText
                  numberOfLines={
                    2
                  }
                  style={
                    styles.title
                  }
                >
                  {title}
                </ThemedText>
              ) : null}
            </View>

            {/* =============================================== */}
            {/* CERRAR */}
            {/* =============================================== */}

            <Pressable
              onPress={
                onClose
              }
              hitSlop={
                10
              }
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal"
              style={({
                pressed,
              }) => [
                styles.closeButton,

                {
                  backgroundColor:
                    c.backgroundSecondary,

                  opacity:
                    pressed
                      ? 0.6
                      : 1,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.closeText,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                ×
              </ThemedText>
            </Pressable>
          </View>

          {/* ================================================= */}
          {/* CONTENIDO SCROLLEABLE */}
          {/* ================================================= */}

          <View
            style={
              styles.contentContainer
            }
          >
            {
              renderedContent
            }
          </View>

          {/* ================================================= */}
          {/* FOOTER FIJO */}
          {/* ================================================= */}

          {footer ? (
            <View
              style={[
                styles.footer,

                {
                  borderTopColor:
                    c.border,
                },
              ]}
            >
              {footer}
            </View>
          ) : null}
        </View>
      </View>
    </RNModal>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    /*
    |--------------------------------------------------------------------------
    | BACKDROP
    |--------------------------------------------------------------------------
    */

    backdrop: {
      flex:
        1,

      justifyContent:
        "center",

      alignItems:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | MODAL
    |--------------------------------------------------------------------------
    */

    modal: {
      borderWidth:
        1,

      borderRadius:
        16,

      overflow:
        "hidden",

      shadowColor:
        "#000",

      shadowOffset: {
        width:
          0,

        height:
          8,
      },

      shadowOpacity:
        0.16,

      shadowRadius:
        24,

      elevation:
        12,
    },

    /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

    header: {
      minHeight:
        58,

      flexDirection:
        "row",

      alignItems:
        "center",

      borderBottomWidth:
        1,

      paddingHorizontal:
        18,

      paddingVertical:
        10,

      flexShrink:
        0,
    },

    titleContainer: {
      flex:
        1,

      minWidth:
        0,

      paddingRight:
        12,
    },

    title: {
      fontSize:
        17,

      lineHeight:
        21,

      fontWeight:
        "800",
    },

    closeButton: {
      width:
        34,

      height:
        34,

      borderRadius:
        8,

      alignItems:
        "center",

      justifyContent:
        "center",

      flexShrink:
        0,
    },

    closeText: {
      fontSize:
        24,

      lineHeight:
        26,

      fontWeight:
        "500",
    },

    /*
    |--------------------------------------------------------------------------
    | CONTENT
    |--------------------------------------------------------------------------
    */

    contentContainer: {
      flexShrink:
        1,

      minHeight:
        0,
    },

    /*
    |--------------------------------------------------------------------------
    | SCROLL
    |--------------------------------------------------------------------------
    */

    scroll: {
      flexShrink:
        1,

      minHeight:
        0,
    },

    scrollContent: {
      flexGrow:
        0,
    },

    /*
    |--------------------------------------------------------------------------
    | STATIC CONTENT
    |--------------------------------------------------------------------------
    */

    staticContent: {
      flexShrink:
        1,

      minHeight:
        0,
    },

    /*
    |--------------------------------------------------------------------------
    | FOOTER
    |--------------------------------------------------------------------------
    */

    footer: {
      flexShrink:
        0,

      borderTopWidth:
        1,

      paddingHorizontal:
        18,

      paddingVertical:
        12,
    },
  });

export default Modal;