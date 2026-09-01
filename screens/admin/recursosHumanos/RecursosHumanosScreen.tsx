// screens/admin/recursosHumanos/RecursosHumanosScreen.tsx

import Visibility from "@/components/Visibility";

import {
  Badge,
} from "@/components/ui/Badge";

import {
  PageHeader,
} from "@/components/ui/PageHeader";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  useRef,
  useState,
} from "react";

import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import UsuarioEditModal from "./components/UsuarioEditModal";

import UsuariosTable from "./components/UsuariosTable";

import {
  useRecursosHumanos,
} from "./hooks/useRecursosHumanos";

import {
  FotoUsuarioArchivo,
  UsuarioRRHH,
} from "./types/recursosHumanos.types";

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export default function RecursosHumanosScreen() {
  const {
    theme,
  } =
    useTheme();

  /*
  |--------------------------------------------------------------------------
  | HOOK
  |--------------------------------------------------------------------------
  */

  const {
    usuarios,

    loading,

    refreshing,

    guardando,

    cargandoDetalle,

    refrescarUsuarios,

    guardarUsuario,

    cargarDetalleUsuario,

    actualizarFotoUsuario,
  } =
    useRecursosHumanos();

  /*
  |--------------------------------------------------------------------------
  | MODAL
  |--------------------------------------------------------------------------
  */

  const [
    usuarioEditando,
    setUsuarioEditando,
  ] =
    useState<UsuarioRRHH | null>(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | REQUEST ACTIVO DE DETALLE
  |--------------------------------------------------------------------------
  |
  | Evita:
  |
  | usuario A
  |   ↓
  | request lento
  |
  | usuario B
  |   ↓
  | request rápido
  |
  | respuesta de A pisa el modal de B ❌
  |
  */

  const detalleActivoRef =
    useRef<number | null>(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | ABRIR EDICIÓN
  |--------------------------------------------------------------------------
  */

  const abrirEditar =
    async (
      usuario: UsuarioRRHH,
    ) => {
      /*
       * Guardamos cuál es el usuario
       * actualmente solicitado.
       */

      detalleActivoRef.current =
        usuario.id;

      /*
       * Mostramos inmediatamente los datos
       * que ya tenemos en el listado.
       */

      setUsuarioEditando(
        usuario,
      );

      /*
       * El service revisa configCache.
       *
       * Si existe detalle:
       * → no GET
       *
       * Si no existe:
       * → GET
       * → cache
       */

      const detalle =
        await cargarDetalleUsuario(
          usuario.id,
        );

      /*
       * Solo aplicamos la respuesta si
       * el modal todavía pertenece al
       * mismo usuario.
       */

      if (
        detalle &&
        detalleActivoRef.current ===
          usuario.id
      ) {
        setUsuarioEditando(
          detalle,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR FOTO
  |--------------------------------------------------------------------------
  */

  const actualizarFoto =
    async (
      id: number,
      archivo: FotoUsuarioArchivo,
    ) => {
      const actualizado =
        await actualizarFotoUsuario(
          id,
          archivo,
        );

      if (!actualizado) {
        return;
      }

      /*
       * El service ya sincronizó:
       *
       * - listado cache
       * - detalle cache
       *
       * El hook ya sincronizó:
       *
       * - usuarios[]
       *
       * Aquí solamente sincronizamos
       * el modal abierto.
       */

      if (
        detalleActivoRef.current ===
        id
      ) {
        setUsuarioEditando(
          actualizado,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | CERRAR EDICIÓN
  |--------------------------------------------------------------------------
  */

  const cerrarEditar =
    () => {
      /*
       * Invalidamos solamente la referencia
       * de UI, NO el cache.
       */

      detalleActivoRef.current =
        null;

      setUsuarioEditando(
        null,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | BADGE HEADER
  |--------------------------------------------------------------------------
  */

  const estadoLabel =
    loading
      ? "Cargando"
      : refreshing
        ? "Actualizando"
        : `${usuarios.length} usuarios`;

  const estadoVariant:
    "warning" |
    "muted" =
    loading ||
    refreshing
      ? "warning"
      : "muted";

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={[
        styles.screen,

        {
          backgroundColor:
            theme.colors
              .background,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <Visibility
          action="Ver"
          selector=".rrhh-header"
        >
          <PageHeader
            badge="Recursos humanos"
            badgeVariant="info"
            title="Gestión de usuarios"
            description="Administra datos personales, fotografía y código QR."
            rightContent={
              <Badge
                label={
                  estadoLabel
                }
                variant={
                  estadoVariant
                }
              />
            }
          />
        </Visibility>

        {/* ================================================= */}
        {/* LISTADO */}
        {/* ================================================= */}

        <Visibility
          action="Ver"
          selector=".rrhh-listado-usuarios"
        >
          <UsuariosTable
            usuarios={
              usuarios
            }

            /*
             * Skeleton únicamente en primera
             * carga real sin cache.
             */

            loading={
              loading
            }

            /*
             * Spinner del botón.
             */

            refreshing={
              refreshing
            }
            onEditar={
              abrirEditar
            }

            /*
             * Refresh manual.
             *
             * Este sí invalida cache y
             * consulta nuevamente backend.
             */

            onRefresh={
              refrescarUsuarios
            }
          />
        </Visibility>
      </ScrollView>

      {/* ================================================= */}
      {/* MODAL */}
      {/* ================================================= */}

      <UsuarioEditModal
        visible={
          !!usuarioEditando
        }
        usuario={
          usuarioEditando
        }
        guardando={
          guardando
        }
        cargandoDetalle={
          cargandoDetalle
        }
        onClose={
          cerrarEditar
        }
        onSave={
          guardarUsuario
        }
        onFotoActualizada={
          actualizarFoto
        }
      />
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
    screen: {
      flex:
        1,
    },

    content: {
      width:
        "100%",

      maxWidth:
        1500,

      alignSelf:
        "center",

      padding:
        18,

      gap:
        16,
    },
  });