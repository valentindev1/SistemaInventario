
export type RolUsuario = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLEADO';

export interface UsuarioAuthTemporal {
  id: number;
  nombre: string;
  username: string;
  rol: RolUsuario;
  empresaId?: number | null;
  sucursalId?: number | null;
}
