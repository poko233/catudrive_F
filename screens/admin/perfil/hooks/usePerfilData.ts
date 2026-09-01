// screens/admin/perfil/hooks/usePerfilData.ts

import {
  useAuth,
} from "@/store/authStore";

import {
  getUserPhotoUrl,
  getUserQrSource,
} from "@/utils/userMedia";

/*
|--------------------------------------------------------------------------
| FECHA
|--------------------------------------------------------------------------
*/

function formatearFecha(
  fecha?: string | null,
): string {
  if (!fecha) {
    return "";
  }

  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  const [
    anio,
    mes,
    dia,
  ] =
    fecha
      .slice(
        0,
        10,
      )
      .split("-");

  const diaNum =
    Number(
      dia,
    );

  const mesNum =
    Number(
      mes,
    );

  if (
    !anio ||
    !Number.isInteger(
      diaNum,
    ) ||
    !Number.isInteger(
      mesNum,
    ) ||
    mesNum < 1 ||
    mesNum > 12
  ) {
    return fecha;
  }

  return `${diaNum} de ${meses[mesNum - 1]} de ${anio}`;
}

/*
|--------------------------------------------------------------------------
| PERFIL
|--------------------------------------------------------------------------
*/

export function usePerfilData() {
  const {
    user,
  } =
    useAuth();

  /*
  |--------------------------------------------------------------------------
  | NOMBRE
  |--------------------------------------------------------------------------
  */

  const apellidos =
    user
      ? [
          user.primer_apellido,
          user.segundo_apellido,
        ]
          .filter(Boolean)
          .join(" ")
          .trim()
      : "";

  const nombreCompleto =
    [
      user?.nombres,
      apellidos,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    user?.usuario ||
    "Usuario";

  /*
  |--------------------------------------------------------------------------
  | CI
  |--------------------------------------------------------------------------
  */

  const ciExpedido =
    user?.ci
      ? [
          user.ci,
          user.expedido,
        ]
          .filter(Boolean)
          .join(" ")
      : "";

  /*
  |--------------------------------------------------------------------------
  | ROLES
  |--------------------------------------------------------------------------
  */

  const roles =
    Array.isArray(
      user?.roles,
    )
      ? user.roles
          .map(
            (
              rol,
            ) =>
              rol?.rol,
          )
          .filter(
            (
              rol,
            ): rol is string =>
              typeof rol ===
                "string" &&
              rol.trim()
                .length >
                0,
          )
      : [];

  /*
  |--------------------------------------------------------------------------
  | MEDIA
  |--------------------------------------------------------------------------
  |
  | Aquí queda corregido el 404.
  |
  | Antes:
  |
  | user.foto
  | → fotos-usuarios/archivo.webp
  | → localhost:8081/fotos-usuarios/... ❌
  |
  | Ahora:
  |
  | user.fotoUrl
  | → http://192.168...:8000/fotos-usuarios/... ✅
  |
  */

  const foto =
    getUserPhotoUrl(
      user,
    );

  const codigoQr =
    getUserQrSource(
      user,
    );

  return {
    usuario:
      user?.usuario ||
      "",

    nombreCompleto,

    correo:
      user?.email ||
      "No registrado",

    email:
      user?.email ||
      "",

    telefono:
      user?.telefono ||
      "No registrado",

    celular:
      user?.celular ||
      "No registrado",

    direccion:
      user?.direccion ||
      "No registrada",

    ciExpedido,

    genero:
      user?.genero ||
      "",

    fechaNacimiento:
      formatearFecha(
        user?.fecha_nac,
      ),

    roles,

    foto,

    codigoQr,
  };
}

export default usePerfilData;