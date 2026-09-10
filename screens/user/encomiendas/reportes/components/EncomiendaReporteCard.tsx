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
  View,
} from "react-native";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface EncomiendaReporteCardProps {
  icon:
    LucideIcon;

  badge: string;

  title: string;

  description: string;

  tags: string[];

  onPress:
    () => void;
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function EncomiendaReporteCard({
  icon:
    Icon,

  badge,

  title,

  description,

  tags,

  onPress,
}: EncomiendaReporteCardProps) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  return (
    <Card
      style={
        styles.card
      }
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

      <Button
        title="Imprimir"

        onPress={
          onPress
        }
      />
    </Card>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    card: {
      flex:
        1,

      minWidth:
        280,

      maxWidth:
        430,

      minHeight:
        250,

      gap:
        16,

      justifyContent:
        "space-between",
    },

    top: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        10,
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
      borderRadius:
        6,

      paddingHorizontal:
        8,

      paddingVertical:
        4,
    },

    badgeText: {
      fontSize:
        9,

      fontWeight:
        "800",
    },

    body: {
      flex:
        1,

      gap:
        10,
    },

    title: {
      fontSize:
        17,

      fontWeight:
        "900",
    },

    description: {
      fontSize:
        12,

      lineHeight:
        18,
    },

    tags: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        6,
    },

    tag: {
      borderRadius:
        5,

      paddingHorizontal:
        7,

      paddingVertical:
        4,
    },

    tagText: {
      fontSize:
        9,

      fontWeight:
        "700",
    },
  });