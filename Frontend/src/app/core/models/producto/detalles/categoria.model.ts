export type TipoGananciaCategoria = 'PORCENTAJE' | 'DINERO';

export interface CategoriaCrearDTO {
  nombre: string;
  empresaId: number;
  tipoGanancia?: TipoGananciaCategoria | null;
  valorGanancia?: number | null;
  porcentajeGanancia?: number | null;
}

export interface CategoriaEditarDTO {
  nombre: string;
  tipoGanancia?: TipoGananciaCategoria | null;
  valorGanancia?: number | null;
  porcentajeGanancia?: number | null;
  aplicarAArticulosConReglaPropia?: boolean;
}

export interface CategoriaObtenerDTO {
  id: number;
  nombre: string;
  empresaId: number;
  empresaNombre: string;
  tipoGanancia: TipoGananciaCategoria | null;
  valorGanancia: number | null;
  porcentajeGanancia: number | null;
  fechaCreacion: string;
}
