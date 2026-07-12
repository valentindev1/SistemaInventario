export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tipo: string;

  usuarioId: number;
  username: string;
  nombre: string;
  rol: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLEADO';

  empresaId: number | null;
  sucursalId: number | null;
}
