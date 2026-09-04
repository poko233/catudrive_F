import { getIonicon } from "@/screens/admin/modulos/types/modulo.types";
import { useAuth } from "@/store/authStore";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  Href,
  usePathname,
  useRouter,
} from "expo-router";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";

import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useResponsive } from "../../hooks/useResponsive";

import {
  MiFormulario,
  MiModulo,
  useModulesStore,
} from "../../store/modulesStore";

import { useTheme } from "../../theme/useTheme";

import {
  getTabsForRoles,
} from "../../utils/roleBasedTabs";

import {
  SidebarCompanySelector,
} from "./SidebarCompanySelector";

import {
  SidebarFooter,
} from "./SidebarFooter";

import {
  SidebarHeader,
} from "./SidebarHeader";

/*
|--------------------------------------------------------------------------
| ANDROID LAYOUT ANIMATION
|--------------------------------------------------------------------------
*/

if (
  Platform.OS ===
    "android" &&
  UIManager
    .setLayoutAnimationEnabledExperimental
) {
  UIManager
    .setLayoutAnimationEnabledExperimental(
      true,
    );
}

/*
|--------------------------------------------------------------------------
| MINI TOOLTIP
|--------------------------------------------------------------------------
*/

const MiniTooltip: React.FC<{
  text: string;

  children:
    React.ReactNode;

  position?:
    | "top"
    | "right"
    | "bottom"
    | "left";

  disabled?: boolean;
}> = ({
  text,

  children,

  position =
    "right",

  disabled =
    false,
}) => {
  const {
    theme,
  } =
    useTheme();

  const [
    visible,
    setVisible,
  ] =
    useState(
      false,
    );

  /*
  |--------------------------------------------------------------------------
  | DESHABILITADO
  |--------------------------------------------------------------------------
  */

  if (disabled) {
    return (
      <>
        {
          children
        }
      </>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | POSICIÓN
  |--------------------------------------------------------------------------
  */

  const getPosition =
    (): any => {
      switch (
        position
      ) {
        case "top":
          return {
            bottom:
              "100%",

            left:
              "50%",

            transform: [
              {
                translateX:
                  "-50%",
              },
            ],

            marginBottom:
              6,
          };

        case "bottom":
          return {
            top:
              "100%",

            left:
              "50%",

            transform: [
              {
                translateX:
                  "-50%",
              },
            ],

            marginTop:
              6,
          };

        case "left":
          return {
            right:
              "100%",

            top:
              "50%",

            transform: [
              {
                translateY:
                  "-50%",
              },
            ],

            marginRight:
              8,
          };

        case "right":

        default:
          return {
            left:
              "100%",

            top:
              "50%",

            transform: [
              {
                translateY:
                  "-50%",
              },
            ],

            marginLeft:
              8,
          };
      }
    };

  /*
  |--------------------------------------------------------------------------
  | WEB HOVER
  |--------------------------------------------------------------------------
  */

  const hoverHandlers =
    Platform.OS ===
    "web"
      ? {
          onMouseEnter:
            () =>
              setVisible(
                true,
              ),

          onMouseLeave:
            () =>
              setVisible(
                false,
              ),
        }
      : {};

  return (
    <View
      style={[
        styles.tooltipContainer,

        {
          zIndex:
            visible
              ? 9999
              : 1,

          elevation:
            visible
              ? 8
              : 0,
        },
      ]}
    >
      {visible && (
        <Animated.View
          entering={
            FadeIn.duration(
              120,
            )
          }

          exiting={
            FadeOut.duration(
              80,
            )
          }

          pointerEvents="none"

          style={[
            styles.tooltipBox,

            getPosition(),

            {
              backgroundColor:
                theme
                  .colors
                  .popover,

              borderColor:
                theme
                  .colors
                  .border,

              borderWidth:
                1,

              shadowColor:
                theme
                  .colors
                  .shadow,
            },
          ]}
        >
          <Text
            style={[
              styles.tooltipText,

              {
                color:
                  theme
                    .colors
                    .text,
              },
            ]}
          >
            {
              text
            }
          </Text>
        </Animated.View>
      )}

      <View
        {...(
          hoverHandlers as any
        )}
      >
        {
          children
        }
      </View>
    </View>
  );
};

/*
|--------------------------------------------------------------------------
| FORMULARIO ITEM
|--------------------------------------------------------------------------
*/

const FormularioItem: React.FC<{
  formulario:
    MiFormulario;

  onNavigate?:
    () => void;

  collapsed:
    boolean;
}> = ({
  formulario,

  onNavigate,

  collapsed,
}) => {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const router =
    useRouter();

  const pathname =
    usePathname();

  /*
  |--------------------------------------------------------------------------
  | ACTIVE
  |--------------------------------------------------------------------------
  */

  const isActive =
    formulario.ruta
      ? pathname ===
          formulario.ruta ||
        pathname.startsWith(
          formulario.ruta +
            "/",
        )
      : false;

  /*
  |--------------------------------------------------------------------------
  | ANIMATION
  |--------------------------------------------------------------------------
  */

  const scale =
    useSharedValue(
      1,
    );

  const animStyle =
    useAnimatedStyle(
      () => ({
        transform: [
          {
            scale:
              scale.value,
          },
        ],
      }),
    );

  /*
  |--------------------------------------------------------------------------
  | ICONO
  |--------------------------------------------------------------------------
  */

  const iconName =
    getIonicon(
      formulario.icono ??
        "",
    ) as keyof typeof Ionicons.glyphMap;

  /*
  |--------------------------------------------------------------------------
  | NAVEGAR
  |--------------------------------------------------------------------------
  */

  const handlePress =
    useCallback(
      () => {
        if (
          !formulario.ruta
        ) {
          return;
        }

        onNavigate?.();

        router.push(
          formulario.ruta as Href,
        );
      },

      [
        formulario.ruta,
        onNavigate,
        router,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | COLAPSADO
  |--------------------------------------------------------------------------
  */

  if (collapsed) {
    return (
      <MiniTooltip
        text={
          formulario.nombre
        }

        position="right"
      >
        <Pressable
          onPress={
            handlePress
          }

          onPressIn={() =>
            (
              scale.value =
                withSpring(
                  0.92,
                )
            )
          }

          onPressOut={() =>
            (
              scale.value =
                withSpring(
                  1,
                )
            )
          }

          style={[
            styles.collapsedCircleItem,

            isActive && {
              backgroundColor:
                c.primary +
                "18",
            },
          ]}
        >
          <Animated.View
            style={
              animStyle
            }
          >
            <Text
              style={[
                styles.circleText,

                {
                  color:
                    isActive
                      ? c.primary
                      : c.textSecondary,
                },
              ]}
            >
              {
                formulario.nombre
                  .charAt(
                    0,
                  )
                  .toUpperCase()
              }
            </Text>
          </Animated.View>
        </Pressable>
      </MiniTooltip>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NORMAL
  |--------------------------------------------------------------------------
  */

  return (
    <MiniTooltip
      text={
        formulario.nombre
      }

      position="right"

      disabled={
        !collapsed
      }
    >
      <Pressable
        onPress={
          handlePress
        }

        onPressIn={() =>
          (
            scale.value =
              withSpring(
                0.97,
              )
          )
        }

        onPressOut={() =>
          (
            scale.value =
              withSpring(
                1,
              )
          )
        }

        style={[
          styles.subItem,

          isActive && {
            backgroundColor:
              c.primary +
              "18",
          },
        ]}
      >
        <View
          style={[
            styles.subLine,

            {
              backgroundColor:
                isActive
                  ? c.primary
                  : c.border,
            },
          ]}
        />

        <Ionicons
          name={
            iconName
          }

          size={
            14
          }

          color={
            isActive
              ? c.primary
              : c.textSecondary
          }
        />

        <Text
          style={[
            styles.subLabel,

            {
              color:
                isActive
                  ? c.primary
                  : c.textSecondary,

              fontWeight:
                isActive
                  ? "700"
                  : "500",
            },
          ]}

          numberOfLines={
            1
          }
        >
          {
            formulario.nombre
          }
        </Text>

        {isActive && (
          <View
            style={[
              styles.activeIndicator,

              {
                backgroundColor:
                  c.primary,
              },
            ]}
          />
        )}
      </Pressable>
    </MiniTooltip>
  );
};

/*
|--------------------------------------------------------------------------
| MODULO ITEM
|--------------------------------------------------------------------------
*/

const ModuloItem: React.FC<{
  modulo:
    MiModulo;

  onNavigate?:
    () => void;

  collapsed:
    boolean;
}> = ({
  modulo,

  onNavigate,

  collapsed,
}) => {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const router =
    useRouter();

  const pathname =
    usePathname();

  /*
  |--------------------------------------------------------------------------
  | HIJOS
  |--------------------------------------------------------------------------
  */

  const hasChildren =
    modulo.formularios.length >
    0;

  const anyChildActive =
    modulo.formularios.some(
      (
        formulario,
      ) =>
        formulario.ruta &&
        (
          pathname ===
            formulario.ruta ||
          pathname.startsWith(
            formulario.ruta +
              "/",
          )
        ),
    );

  /*
  |--------------------------------------------------------------------------
  | EXPANDED
  |--------------------------------------------------------------------------
  */

  const [
    expanded,
    setExpanded,
  ] =
    useState(
      anyChildActive,
    );

  /*
  |--------------------------------------------------------------------------
  | HREF
  |--------------------------------------------------------------------------
  */

  const href =
    `/${
      (
        modulo.nombre ??
        ""
      )
        .toLowerCase()
        .replace(
          /\s+/g,
          "-",
        )
    }`;

  const isActive =
    !hasChildren &&
    (
      pathname ===
        href ||
      pathname.startsWith(
        href +
          "/",
      )
    );

  /*
  |--------------------------------------------------------------------------
  | ANIMACIÓN
  |--------------------------------------------------------------------------
  */

  const scale =
    useSharedValue(
      1,
    );

  const chevron =
    useSharedValue(
      expanded
        ? 1
        : 0,
    );

  const iconName =
    getIonicon(
      modulo.icono,
    ) as keyof typeof Ionicons.glyphMap;

  const animStyle =
    useAnimatedStyle(
      () => ({
        transform: [
          {
            scale:
              scale.value,
          },
        ],
      }),
    );

  const chevronStyle =
    useAnimatedStyle(
      () => ({
        transform: [
          {
            rotate:
              `${
                chevron.value *
                180
              }deg`,
          },
        ],
      }),
    );

  /*
  |--------------------------------------------------------------------------
  | PRESS
  |--------------------------------------------------------------------------
  */

  const handlePress =
    useCallback(
      () => {
        if (
          hasChildren
        ) {
          LayoutAnimation.configureNext(
            LayoutAnimation
              .Presets
              .easeInEaseOut,
          );

          chevron.value =
            withTiming(
              expanded
                ? 0
                : 1,

              {
                duration:
                  200,
              },
            );

          setExpanded(
            (
              current,
            ) =>
              !current,
          );

          return;
        }

        onNavigate?.();

        router.push(
          href as Href,
        );
      },

      [
        hasChildren,
        expanded,
        href,
        onNavigate,
        router,
        chevron,
      ],
    );

  const rowActive =
    isActive ||
    anyChildActive;

  /*
  |--------------------------------------------------------------------------
  | COLAPSADO
  |--------------------------------------------------------------------------
  */

  if (collapsed) {
    return (
      <View>
        <MiniTooltip
          text={
            modulo.nombre
          }

          position="right"
        >
          <Pressable
            onPress={
              handlePress
            }

            onPressIn={() =>
              (
                scale.value =
                  withSpring(
                    0.92,
                  )
              )
            }

            onPressOut={() =>
              (
                scale.value =
                  withSpring(
                    1,
                  )
              )
            }

            style={[
              styles.collapsedModuleItem,

              rowActive && {
                backgroundColor:
                  c.primary +
                  "18",
              },
            ]}
          >
            <Animated.View
              style={
                animStyle
              }
            >
              <Ionicons
                name={
                  iconName
                }

                size={
                  22
                }

                color={
                  rowActive
                    ? c.primary
                    : c.textSecondary
                }
              />
            </Animated.View>
          </Pressable>
        </MiniTooltip>

        {expanded &&
          hasChildren && (
            <View
              style={
                styles.collapsedSubList
              }
            >
              {
                modulo.formularios.map(
                  (
                    formulario,
                  ) => (
                    <FormularioItem
                      key={
                        formulario.id
                      }

                      formulario={
                        formulario
                      }

                      onNavigate={
                        onNavigate
                      }

                      collapsed={
                        collapsed
                      }
                    />
                  ),
                )
              }
            </View>
          )}
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NORMAL
  |--------------------------------------------------------------------------
  */

  return (
    <View>
      <Animated.View
        style={
          animStyle
        }
      >
        <Pressable
          onPress={
            handlePress
          }

          onPressIn={() =>
            (
              scale.value =
                withSpring(
                  0.97,
                )
            )
          }

          onPressOut={() =>
            (
              scale.value =
                withSpring(
                  1,
                )
            )
          }

          style={[
            styles.moduleItem,

            rowActive &&
              !hasChildren && {
                backgroundColor:
                  c.primary,
              },

            rowActive &&
              hasChildren && {
                backgroundColor:
                  c.primary +
                  "12",
              },
          ]}
        >
          <View
            style={[
              styles.moduleIconWrap,

              {
                backgroundColor:
                  rowActive
                    ? c.primary +
                      "20"
                    : c.input,
              },
            ]}
          >
            <Ionicons
              name={
                iconName
              }

              size={
                18
              }

              color={
                rowActive
                  ? c.primary
                  : c.textSecondary
              }
            />
          </View>

          <Text
            style={[
              styles.moduleLabel,

              {
                color:
                  rowActive &&
                  !hasChildren
                    ? c.primaryForeground
                    : c.text,

                fontWeight:
                  rowActive
                    ? "700"
                    : "500",
              },
            ]}

            numberOfLines={
              1
            }
          >
            {
              modulo.nombre
            }
          </Text>

          {hasChildren && (
            <Animated.View
              style={
                chevronStyle
              }
            >
              <Ionicons
                name="chevron-down"

                size={
                  14
                }

                color={
                  anyChildActive
                    ? c.primary
                    : c.muted
                }
              />
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>

      {hasChildren &&
        expanded && (
          <View
            style={
              styles.subList
            }
          >
            {
              modulo.formularios.map(
                (
                  formulario,
                ) => (
                  <FormularioItem
                    key={
                      formulario.id
                    }

                    formulario={
                      formulario
                    }

                    onNavigate={
                      onNavigate
                    }

                    collapsed={
                      collapsed
                    }
                  />
                ),
              )
            }
          </View>
        )}
    </View>
  );
};

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface SidebarProps {
  onNavigate?:
    () => void;

  collapsed?:
    boolean;

  onToggleCollapse?:
    () => void;
}

/*
|--------------------------------------------------------------------------
| SIDEBAR
|--------------------------------------------------------------------------
*/

export const Sidebar: React.FC<
  SidebarProps
> = ({
  onNavigate,

  collapsed =
    false,

  onToggleCollapse,
}) => {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const {
    modulos,
    loading,
    error,
    fetchModulos,
  } =
    useModulesStore();

  const {
    user,
  } =
    useAuth();

  const {
    isDesktop,
  } =
    useResponsive();

  /*
  |--------------------------------------------------------------------------
  | HOME
  |--------------------------------------------------------------------------
  */

  const tabs =
    getTabsForRoles(
      user?.roles.map(
        (
          role,
        ) =>
          role.rol,
      ) ??
        [],
    );

  /*
   * Conservamos la resolución porque
   * puede ser utilizada por la lógica
   * de navegación del Sidebar.
   */
  const homeRoute =
    tabs.length >
    0
      ? `/${tabs[0].name}`
      : "/perfil";

  void homeRoute;

  /*
  |--------------------------------------------------------------------------
  | ANCHO
  |--------------------------------------------------------------------------
  */

  const sidebarWidth =
    useSharedValue(
      collapsed
        ? 72
        : 240,
    );

  useEffect(
    () => {
      sidebarWidth.value =
        withTiming(
          collapsed
            ? 72
            : 240,

          {
            duration:
              250,
          },
        );
    },

    [
      collapsed,
      sidebarWidth,
    ],
  );

  const animatedSidebarStyle =
    useAnimatedStyle(
      () => ({
        width:
          sidebarWidth.value,
      }),
    );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <Animated.View
      style={[
        styles.sidebar,

        animatedSidebarStyle,

        {
          backgroundColor:
            c.card,

          borderRightColor:
            c.border,

          borderRightWidth:
            1,
        },

        !isDesktop &&
          styles.sidebarMobile,
      ]}
    >
      {/*
      |--------------------------------------------------------------------------
      | TOGGLE
      |--------------------------------------------------------------------------
      */}

      {onToggleCollapse && (
        <Pressable
          onPress={
            onToggleCollapse
          }

          style={({
            pressed,
          }) => [
            styles.toggleButton,

            {
              backgroundColor:
                pressed
                  ? c.primarySubtle
                  : c.card,

              borderColor:
                c.border,
            },
          ]}
        >
          {collapsed ? (
            <ChevronRight
              size={
                16
              }

              color={
                c.textSecondary
              }
            />
          ) : (
            <ChevronLeft
              size={
                16
              }

              color={
                c.textSecondary
              }
            />
          )}
        </Pressable>
      )}

      {/*
      |--------------------------------------------------------------------------
      | PARTE FIJA SUPERIOR
      |--------------------------------------------------------------------------
      */}

      <View
        style={
          styles.topFixed
        }
      >
        {!collapsed ? (
          <SidebarCompanySelector
            collapsed={
              false
            }
          />
        ) : (
          <View
            style={
              styles.collapsedCompany
            }
          >
            <Ionicons
              name="storefront-outline"

              size={
                22
              }

              color={
                c.primary
              }
            />
          </View>
        )}

        <SidebarHeader
          collapsed={
            collapsed
          }
        />
      </View>

      {/*
      |--------------------------------------------------------------------------
      | ZONA SCROLLEABLE
      |--------------------------------------------------------------------------
      |
      | SOLUCIÓN:
      |
      | - flex: 1
      | - minHeight: 0
      | - SIN overflow visible
      | - contentContainerStyle correcto
      |
      */}

      <View
        style={
          styles.scrollArea
        }
      >
        <ScrollView
          style={
            styles.navScroll
          }

          contentContainerStyle={[
            styles.nav,

            collapsed &&
              styles.navCollapsed,
          ]}

          showsVerticalScrollIndicator={
            true
          }

          keyboardShouldPersistTaps="handled"

          nestedScrollEnabled

          bounces={
            false
          }

          overScrollMode="never"
        >
          {/*
          |--------------------------------------------------------------------------
          | LOADING
          |--------------------------------------------------------------------------
          */}

          {loading && (
            <View
              style={
                styles.center
              }
            >
              <ActivityIndicator
                size="small"

                color={
                  c.primary
                }
              />

              {!collapsed && (
                <Text
                  style={[
                    styles.loadingText,

                    {
                      color:
                        c.textSecondary,
                    },
                  ]}
                >
                  Cargando…
                </Text>
              )}
            </View>
          )}

          {/*
          |--------------------------------------------------------------------------
          | ERROR
          |--------------------------------------------------------------------------
          */}

          {!loading &&
            error && (
              <Pressable
                onPress={() =>
                  fetchModulos()
                }

                style={[
                  styles.errorBox,

                  {
                    backgroundColor:
                      "#FFF1F2",

                    borderColor:
                      "#FECDD3",
                  },
                ]}
              >
                <Ionicons
                  name="alert-circle-outline"

                  size={
                    16
                  }

                  color="#E11D48"
                />

                {!collapsed && (
                  <Text
                    style={[
                      styles.errorText,

                      {
                        color:
                          "#E11D48",
                      },
                    ]}
                  >
                    {
                      error
                    }
                  </Text>
                )}

                <Ionicons
                  name="refresh-outline"

                  size={
                    16
                  }

                  color="#E11D48"

                  style={{
                    marginLeft:
                      "auto",
                  }}
                />
              </Pressable>
            )}

          {/*
          |--------------------------------------------------------------------------
          | VACÍO
          |--------------------------------------------------------------------------
          */}

          {!loading &&
            !error &&
            modulos.length ===
              0 && (
              <View
                style={
                  styles.center
                }
              >
                <Ionicons
                  name="grid-outline"

                  size={
                    32
                  }

                  color={
                    c.muted
                  }
                />

                {!collapsed && (
                  <Text
                    style={[
                      styles.emptyText,

                      {
                        color:
                          c.textSecondary,
                      },
                    ]}
                  >
                    Sin módulos
                  </Text>
                )}
              </View>
            )}

          {/*
          |--------------------------------------------------------------------------
          | MÓDULOS
          |--------------------------------------------------------------------------
          */}

          {!loading &&
            !error &&
            modulos.map(
              (
                modulo,
              ) => (
                <ModuloItem
                  key={
                    modulo.id
                  }

                  modulo={
                    modulo
                  }

                  onNavigate={
                    onNavigate
                  }

                  collapsed={
                    collapsed
                  }
                />
              ),
            )}
        </ScrollView>
      </View>

      {/*
      |--------------------------------------------------------------------------
      | FOOTER FIJO
      |--------------------------------------------------------------------------
      */}

      <SidebarFooter
        collapsed={
          collapsed
        }
      />
    </Animated.View>
  );
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
    | SIDEBAR
    |--------------------------------------------------------------------------
    */

    sidebar: {
      height:
        "100%",

      minHeight:
        0,

      flexShrink:
        0,

      alignSelf:
        "stretch",

      zIndex:
        100,

      elevation:
        10,
    },

    sidebarMobile: {
      flex:
        1,

      width:
        "100%",

      height:
        "100%",
    },

    /*
    |--------------------------------------------------------------------------
    | FIJOS
    |--------------------------------------------------------------------------
    */

    topFixed: {
      flexShrink:
        0,

      zIndex:
        20,
    },

    /*
    |--------------------------------------------------------------------------
    | SCROLL
    |--------------------------------------------------------------------------
    */

    scrollArea: {
      flex:
        1,

      minHeight:
        0,

      width:
        "100%",
    },

    navScroll: {
      flex:
        1,

      minHeight:
        0,

      width:
        "100%",
    },

    nav: {
      paddingHorizontal:
        8,

      paddingTop:
        6,

      paddingBottom:
        14,

      gap:
        2,
    },

    navCollapsed: {
      alignItems:
        "stretch",
    },

    /*
    |--------------------------------------------------------------------------
    | TOGGLE
    |--------------------------------------------------------------------------
    */

    toggleButton: {
      position:
        "absolute",

      top:
        32,

      right:
        -17,

      zIndex:
        101,

      width:
        17,

      height:
        34,

      borderTopRightRadius:
        16,

      borderBottomRightRadius:
        16,

      borderTopLeftRadius:
        0,

      borderBottomLeftRadius:
        0,

      borderWidth:
        1,

      borderLeftWidth:
        0,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingLeft:
        2,

      shadowColor:
        "#000",

      shadowOffset: {
        width:
          2,

        height:
          0,
      },

      shadowOpacity:
        0.1,

      shadowRadius:
        3,

      elevation:
        3,
    },

    /*
    |--------------------------------------------------------------------------
    | COMPANY COLLAPSED
    |--------------------------------------------------------------------------
    */

    collapsedCompany: {
      flexShrink:
        0,

      alignItems:
        "center",

      paddingVertical:
        14,
    },

    /*
    |--------------------------------------------------------------------------
    | MODULO COLLAPSED
    |--------------------------------------------------------------------------
    */

    collapsedModuleItem: {
      alignItems:
        "center",

      justifyContent:
        "center",

      paddingVertical:
        8,

      marginVertical:
        2,

      borderRadius:
        10,
    },

    collapsedCircleItem: {
      alignItems:
        "center",

      justifyContent:
        "center",

      width:
        28,

      height:
        28,

      borderRadius:
        14,

      borderWidth:
        1,

      borderColor:
        "transparent",

      marginVertical:
        4,
    },

    collapsedSubList: {
      alignItems:
        "center",

      gap:
        2,

      marginVertical:
        4,
    },

    /*
    |--------------------------------------------------------------------------
    | TOOLTIP
    |--------------------------------------------------------------------------
    */

    tooltipContainer: {
      position:
        "relative",
    },

    tooltipBox: {
      position:
        "absolute",

      paddingHorizontal:
        10,

      paddingVertical:
        6,

      borderRadius:
        8,

      minWidth:
        120,

      alignItems:
        "center",

      shadowOffset: {
        width:
          0,

        height:
          3,
      },

      shadowOpacity:
        0.12,

      shadowRadius:
        6,

      elevation:
        6,
    },

    tooltipText: {
      fontSize:
        11,

      fontWeight:
        "600",
    },

    circleText: {
      fontSize:
        12,

      fontWeight:
        "800",
    },

    /*
    |--------------------------------------------------------------------------
    | MODULOS
    |--------------------------------------------------------------------------
    */

    moduleItem: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        8,

      paddingVertical:
        7,

      paddingHorizontal:
        8,

      borderRadius:
        8,
    },

    moduleIconWrap: {
      width:
        28,

      height:
        28,

      borderRadius:
        7,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    moduleLabel: {
      flex:
        1,

      minWidth:
        0,

      fontSize:
        12,

      fontWeight:
        "600",
    },

    /*
    |--------------------------------------------------------------------------
    | SUBLIST
    |--------------------------------------------------------------------------
    */

    subList: {
      marginLeft:
        0,

      marginTop:
        2,

      marginBottom:
        4,

      gap:
        2,
    },

    subItem: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        8,

      paddingVertical:
        6,

      paddingHorizontal:
        8,

      borderRadius:
        8,
    },

    subLine: {
      width:
        2,

      height:
        12,

      borderRadius:
        2,
    },

    subLabel: {
      flex:
        1,

      minWidth:
        0,

      fontSize:
        12,
    },

    activeIndicator: {
      width:
        5,

      height:
        5,

      borderRadius:
        3,
    },

    /*
    |--------------------------------------------------------------------------
    | STATES
    |--------------------------------------------------------------------------
    */

    center: {
      alignItems:
        "center",

      paddingVertical:
        16,

      gap:
        8,
    },

    loadingText: {
      fontSize:
        11,
    },

    emptyText: {
      fontSize:
        12,

      textAlign:
        "center",
    },

    errorBox: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        6,

      borderWidth:
        1,

      borderRadius:
        8,

      padding:
        8,

      margin:
        4,
    },

    errorText: {
      fontSize:
        11,

      flex:
        1,
    },
  });