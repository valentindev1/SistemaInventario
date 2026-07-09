export type RolUsuario = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLEADO';

export interface UsuarioCrearDTO {
  nombre: string;
  username: string;
  password: string;
  rol: RolUsuario;
  empresaId?: number | null;
  sucursalId?: number | null;
}

export interface UsuarioEditarDTO {
  nombre: string;
  password: string;
  rol: RolUsuario;
}

export interface UsuarioObtenerDTO {
  id: number;
  nombre: string;
  username: string;
  rol: string;
  empresaId?: number | null;
  empresaNombre?: string | null;
  sucursalId?: number | null;
  sucursalNombre?: string | null;
}
