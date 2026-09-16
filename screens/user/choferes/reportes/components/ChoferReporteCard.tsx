import {
  ThemedText,
} from "@/components/ThemedText";

import {
  Button,
} from "@/components/ui/Button";

import {
  Card,
} from "@/components/ui/Card";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  LucideIcon,
} from "lucide-react-native";

import {
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

interface ChoferReporteCardProps {
  icon:
    LucideIcon;

  badge:
    string;

  title:
    string;

  description:
    string;

  tags:
    string[];

  onPrint:
    () => void;

  onPdf:
    () => void;
}

export function ChoferReporteCard({
  icon:
    Icon,

  badge,

  title,

  description,

  tags,

  onPrint,

  onPdf,
}: ChoferReporteCardProps) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const {
    width:
      windowWidth,
  } =
    useWindowDimensions();

  const isMobile =
    windowWidth <
    768;

  return (
    <Card
      style={[
        styles.card,

        isMobile &&
          styles.cardMobile,
      ]}
    >
      <View
        style={
          styles.top
        }
      >
        <View
          style={[
            styles.iconContainer,

            {
              backgroundColor:
                `${c.primary}18`,
            },
          ]}
        >
          <Icon
            size={
              20
            }

            color={
              c.primary
            }
          />
        </View>

        <View
          style={[
            styles.badge,

            {
              backgroundColor:
                `${c.primary}12`,
            },
          ]}
        >
          <ThemedText
            style={
              styles.badgeText
            }
          >
            {
              badge
            }
          </ThemedText>
        </View>
      </View>

      <View
        style={
          styles.body
        }
      >
        <ThemedText
          style={
            styles.title
          }
        >
          {
            title
          }
        </ThemedText>

        <ThemedText
          style={[
            styles.description,

            {
              color:
                c.textSecondary,
            },
          ]}
        >
          {
            description
          }
        </ThemedText>

        <View
          style={
            styles.tags
          }
        >
          {tags.map(
            (
              tag,
            ) => (
              <View
                key={
                  tag
                }

                style={[
                  styles.tag,

                  {
                    backgroundColor:
                      `${c.primary}10`,
                  },
                ]}
              >
                <ThemedText
                  style={
                    styles.tagText
                  }
                >
                  {
                    tag
                  }
                </ThemedText>
              </View>
            ),
          )}
        </View>
      </View>

      <View
        style={[
          styles.actions,

          isMobile &&
            styles.actionsMobile,
        ]}
      >
        <View
          style={
            styles.action
          }
        >
          <Button
            title="Imprimir"

            onPress={
              onPrint
            }
          />
        </View>

        <View
          style={
            styles.action
          }
        >
          <Button
            title="PDF"

            variant="secondary"

            onPress={
              onPdf
            }
          />
        </View>
      </View>
    </Card>
  );
}

const styles =
  StyleSheet.create({
    card: {
      flex:
        1,

      minWidth:
        280,

      minHeight:
        250,

      gap:
        16,

      justifyContent:
        "space-between",
    },

    cardMobile: {
      minWidth:
        0,

      width:
        "100%",
    },

    top: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        12,
    },

    iconContainer: {
      width:
        38,

      height:
        38,

      borderRadius:
        10,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    badge: {
      minHeight:
        24,

      paddingHorizontal:
        12,

      paddingVertical:
        5,

      borderRadius:
        999,

      justifyContent:
        "center",
    },

    badgeText: {
      fontSize:
        10,

      fontWeight:
        "900",
    },

    body: {
      flex:
        1,

      gap:
        10,
    },

    title: {
      fontSize:
        18,

      fontWeight:
        "900",
    },

    description: {
      fontSize:
        13,

      lineHeight:
        19,
    },

    tags: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        8,
    },

    tag: {
      minHeight:
        24,

      paddingHorizontal:
        10,

      paddingVertical:
        5,

      borderRadius:
        999,
    },

    tagText: {
      fontSize:
        10,

      fontWeight:
        "800",
    },

    actions: {
      flexDirection:
        "row",

      gap:
        8,
    },

    actionsMobile: {
      flexDirection:
        "column",
    },

    action: {
      flex:
        1,
    },
  });
