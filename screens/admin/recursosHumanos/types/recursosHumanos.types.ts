export type GeneroRRHH =
  | "MASCULINO"
  | "FEMENINO";

export type EstadoUsuarioRRHH =
  | "ACTIVO"
  | "INACTIVO";

export type RolRRHH = {
  idRol?: number;
  id?: number;
  rol: string;
};

export type UsuarioRRHH = {
  id: number;

  usuario: string;
  ci: string;
  nombres: string;

  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;

  genero?: GeneroRRHH | string | null;
  fecha_nac?: string | null;

  email?: string | null;
  telefono?: string | null;
  celular?: string | null;

  direccion?: string | null;
  expedido?: string | null;

  codigo_qr?: string | null;
  qrUrl?: string | null;

  foto?: string | null;
  fotoUrl?: string | null;

  estado?: EstadoUsuarioRRHH | string | null;

  roles?: RolRRHH[];
};

export type UsuarioFormRRHH = {
  usuario: string;
  ci: string;
  nombres: string;

  apellidoPaterno: string;
  apellidoMaterno: string;

  genero: GeneroRRHH;
  fecha_nac: string;

  email: string;
  telefono: string;
  celular: string;

  direccion: string;
  expedido: string;

  estado: EstadoUsuarioRRHH;
};

export type UsuarioRRHHForm =
  UsuarioFormRRHH;

export type FotoUsuarioArchivo = {
  uri: string;
  name: string;
  type: string;
};

export type UsuariosRRHHResponse = {
  usuarios: UsuarioRRHH[];
};

export type UsuarioRRHHResponse = {
  message?: string;
  usuario: UsuarioRRHH;
};