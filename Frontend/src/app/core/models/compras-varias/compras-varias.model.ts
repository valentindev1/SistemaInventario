export interface CompraVariasCrearDTO {
  concepto: string;
  descripcion?: string;
  valor: number;
  fecha: string;
}

export interface CompraVariasDTO {
  id: number;
  concepto: string;
  descripcion?: string;
  valor: number;
  fecha: string;
  sucursalId: number;
  sucursalNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  usuarioRol: string;
  fechaCreacion: string;
}
