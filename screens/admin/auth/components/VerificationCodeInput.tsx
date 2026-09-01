// screens/admin/auth/components/VerificationCodeInput.tsx

import { useTheme } from "@/theme/useTheme";

import React, {
  useMemo,
  useRef,
} from "react";

import {
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import {
  ThemedText,
} from "@/components/ThemedText";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface VerificationCodeInputProps {
  value: string;

  onChangeText: (
    value: string,
  ) => void;

  length?: number;

  error?: string;

  disabled?: boolean;

  onComplete?: (
    code: string,
  ) => void;
}

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export function VerificationCodeInput({
  value,

  onChangeText,

  length = 6,

  error,

  disabled = false,

  onComplete,
}: VerificationCodeInputProps) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  /*
  |--------------------------------------------------------------------------
  | REFS
  |--------------------------------------------------------------------------
  */

  const inputsRef =
    useRef<
      Array<TextInput | null>
    >([]);

  /*
  |--------------------------------------------------------------------------
  | CÓDIGO NORMALIZADO
  |--------------------------------------------------------------------------
  */

  const code =
    useMemo(
      () =>
        value
          .replace(
            /\D/g,
            "",
          )
          .slice(
            0,
            length,
          ),
      [
        value,
        length,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR DÍGITO
  |--------------------------------------------------------------------------
  */

  const updateDigit = (
    index: number,
    text: string,
  ) => {
    if (disabled) {
      return;
    }

    const onlyNumbers =
      text.replace(
        /\D/g,
        "",
      );

    /*
    |--------------------------------------------------------------------------
    | PEGAR CÓDIGO COMPLETO
    |--------------------------------------------------------------------------
    |
    | Si el usuario pega:
    |
    | 038543
    |
    | lo distribuimos automáticamente.
    |
    */

    if (
      onlyNumbers.length >
      1
    ) {
      const pasted =
        onlyNumbers.slice(
          0,
          length,
        );

      onChangeText(
        pasted,
      );

      const targetIndex =
        Math.min(
          pasted.length,
          length,
        ) - 1;

      requestAnimationFrame(
        () => {
          inputsRef.current[
            targetIndex
          ]?.focus();
        },
      );

      if (
        pasted.length ===
        length
      ) {
        onComplete?.(
          pasted,
        );
      }

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | UN SOLO DÍGITO
    |--------------------------------------------------------------------------
    */

    const characters =
      Array.from({
        length,
      }).map(
        (
          _,
          position,
        ) =>
          code[
            position
          ] ?? "",
      );

    characters[index] =
      onlyNumbers;

    const nextCode =
      characters
        .join("")
        .slice(
          0,
          length,
        );

    onChangeText(
      nextCode,
    );

    /*
    |--------------------------------------------------------------------------
    | AVANZAR
    |--------------------------------------------------------------------------
    */

    if (
      onlyNumbers &&
      index <
        length - 1
    ) {
      requestAnimationFrame(
        () => {
          inputsRef.current[
            index + 1
          ]?.focus();
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETADO
    |--------------------------------------------------------------------------
    */

    if (
      nextCode.length ===
      length
    ) {
      onComplete?.(
        nextCode,
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | BACKSPACE
  |--------------------------------------------------------------------------
  */

  const handleKeyPress = (
    index: number,
    key: string,
  ) => {
    if (
      disabled ||
      key !==
        "Backspace"
    ) {
      return;
    }

    /*
     * Si el cuadro actual ya está vacío,
     * retrocedemos al anterior.
     */

    if (
      !code[index] &&
      index > 0
    ) {
      const characters =
        code.split("");

      characters[
        index - 1
      ] =
        "";

      onChangeText(
        characters
          .join("")
          .slice(
            0,
            length,
          ),
      );

      requestAnimationFrame(
        () => {
          inputsRef.current[
            index - 1
          ]?.focus();
        },
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FOCUS
  |--------------------------------------------------------------------------
  */

  const handleFocus = (
    index: number,
  ) => {
    /*
     * Evita saltar varios campos vacíos.
     *
     * Si intenta tocar la casilla 5 pero solamente
     * existen 2 números, enviamos el foco a la 3.
     */

    if (
      index >
      code.length
    ) {
      const target =
        Math.min(
          code.length,
          length - 1,
        );

      requestAnimationFrame(
        () => {
          inputsRef.current[
            target
          ]?.focus();
        },
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={
        styles.container
      }
    >
      <View
        style={
          styles.inputsRow
        }
      >
        {Array.from({
          length,
        }).map(
          (
            _,
            index,
          ) => {
            const digit =
              code[
                index
              ] ?? "";

            const filled =
              Boolean(
                digit,
              );

            return (
              <TextInput
                key={
                  index
                }
                ref={(
                  input,
                ) => {
                  inputsRef.current[
                    index
                  ] =
                    input;
                }}
                value={
                  digit
                }
                onChangeText={(
                  text,
                ) =>
                  updateDigit(
                    index,
                    text,
                  )
                }
                onFocus={() =>
                  handleFocus(
                    index,
                  )
                }
                onKeyPress={({
                  nativeEvent,
                }) =>
                  handleKeyPress(
                    index,
                    nativeEvent.key,
                  )
                }
                editable={
                  !disabled
                }
                maxLength={
                  Platform.OS ===
                  "web"
                    ? length
                    : 1
                }
                keyboardType="number-pad"
                inputMode="numeric"
                selectTextOnFocus
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                selectionColor={
                  c.primary
                }
                style={[
                  styles.input,

                  {
                    color:
                      c.text,

                    backgroundColor:
                      c.backgroundSecondary,

                    borderColor:
                      error
                        ? c.destructive
                        : filled
                          ? c.primary
                          : c.border,

                    opacity:
                      disabled
                        ? 0.55
                        : 1,
                  },

                  Platform.OS ===
                    "web"
                    ? ({
                        outlineStyle:
                          "none",

                        outlineWidth:
                          0,

                        outlineColor:
                          "transparent",
                      } as any)
                    : null,
                ]}
              />
            );
          },
        )}
      </View>

      {!!error && (
        <ThemedText
          style={[
            styles.error,

            {
              color:
                c.destructive,
            },
          ]}
        >
          {error}
        </ThemedText>
      )}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    container: {
      width:
        "100%",

      gap:
        8,
    },

    inputsRow: {
      width:
        "100%",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        10,
    },

    input: {
      width:
        52,

      height:
        58,

      borderWidth:
        1.5,

      borderRadius:
        12,

      textAlign:
        "center",

      fontSize:
        22,

      fontWeight:
        "800",

      padding:
        0,
    },

    error: {
      fontSize:
        12,

      lineHeight:
        17,

      textAlign:
        "center",
    },
  });

export default VerificationCodeInput;