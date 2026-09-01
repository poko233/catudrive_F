// utils/userMedia.ts

type UserMediaLike = {
  foto?: string | null;
  fotoUrl?: string | null;
  foto_url?: string | null;

  codigo_qr?: string | null;
  qrUrl?: string | null;
  qr_url?: string | null;
};

function isPublicImageSource(
  value?: string | null,
): value is string {
  if (!value) {
    return false;
  }

  const source =
    value.trim();

  if (!source) {
    return false;
  }

  return (
    /^https?:\/\//i.test(source) ||
    /^data:image\//i.test(source) ||
    /^blob:/i.test(source)
  );
}

/*
|--------------------------------------------------------------------------
| FOTO
|--------------------------------------------------------------------------
|
| IMPORTANTE:
|
| foto:
|   fotos-usuarios/archivo.webp
|   → ruta interna del backend
|
| fotoUrl:
|   http://192.168.../fotos-usuarios/archivo.webp
|   → URL pública lista para <Image>
|
| Nunca devolvemos una ruta relativa.
|
*/

export function getUserPhotoUrl(
  user: unknown,
): string | null {
  if (
    !user ||
    typeof user !== "object"
  ) {
    return null;
  }

  const media =
    user as UserMediaLike;

  const candidates = [
    media.fotoUrl,
    media.foto_url,

    /*
     * Permitimos foto solamente si una API
     * antigua ya la devolviera como URL absoluta.
     *
     * NO aceptamos:
     * fotos-usuarios/archivo.webp
     */
    media.foto,
  ];

  for (
    const candidate
    of candidates
  ) {
    if (
      isPublicImageSource(
        candidate,
      )
    ) {
      return candidate.trim();
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| QR
|--------------------------------------------------------------------------
*/

export function getUserQrSource(
  user: unknown,
): string | null {
  if (
    !user ||
    typeof user !== "object"
  ) {
    return null;
  }

  const media =
    user as UserMediaLike;

  const publicUrl =
    media.qrUrl ||
    media.qr_url;

  if (
    publicUrl &&
    isPublicImageSource(
      publicUrl,
    )
  ) {
    return publicUrl.trim();
  }

  const raw =
    media.codigo_qr?.trim();

  if (!raw) {
    return null;
  }

  /*
   * Conservamos compatibilidad con QR
   * almacenados como base64/data URI.
   */

  if (
    raw.startsWith(
      "data:image/",
    )
  ) {
    return raw;
  }

  if (
    /^https?:\/\//i.test(
      raw,
    )
  ) {
    return raw;
  }

  return raw;
}