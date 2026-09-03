import React from "react";

import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import {
  useTheme,
} from "@/theme/useTheme";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

export interface CardProps {
  children:
    React.ReactNode;

  /**
   * Permite:
   *
   * style={styles.card}
   *
   * style={[
   *   styles.card,
   *   condition && styles.active,
   * ]}
   *
   * style={[
   *   styles.card,
   *   {
   *     borderColor: color,
   *   },
   * ]}
   */
  style?:
    StyleProp<ViewStyle>;
}

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export function Card({
  children,

  style,
}: CardProps) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  return (
    <View
      style={[
        styles.card,

        {
          backgroundColor:
            c.card,

          borderColor:
            c.border,
        },

        style,
      ]}
    >
      {children}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| EXPORT DEFAULT
|--------------------------------------------------------------------------
*/

export default Card;

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    card: {
      borderWidth:
        1,

      borderRadius:
        12,

      padding:
        16,
    },
  });