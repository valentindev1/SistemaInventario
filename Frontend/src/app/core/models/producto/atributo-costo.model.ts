export interface AtributoCostoCrearDTO {
  nombre: string;
  descripcion?: string | null;
  empresaId: number;
  categoriaId: number;
}

export interface AtributoCostoEditarDTO {
  nombre: string;
  descripcion?: string | null;
  categoriaId: number;
}

export interface AtributoCostoObtenerDTO {
  id: number;
  nombre: string;
  descripcion: string | null;
  empresaId: number;
  categoriaId: number;
  categoriaNombre: string;
  activo: boolean;
  fechaCreacion: string;
}
