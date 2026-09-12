export type TipoRegistroContable = 'COSTO' | 'GASTO';
export type ClasificacionGasto =
  | 'OPERATIVO'
  | 'ADMINISTRATIVO'
  | 'VENTAS'
  | 'PRODUCCION'
  | 'PRODUCCION_INDIRECTA'
  | 'OTRO';

export interface ClasificacionContableCrearDTO {
  nombre: string;
  tipo: TipoRegistroContable;
  empresaId: number;
}

export interface ClasificacionContableEditarDTO {
  nombre: string;
}

export interface ClasificacionContableDTO {
  id: number;
  nombre: string;
  tipo: TipoRegistroContable;
  empresaId: number;
  empresaNombre: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface ConceptoGastoCrearDTO {
  nombre: string;
  tipo?: TipoRegistroContable;
  clasificacionId?: number;
  descripcion?: string;
  clasificacion: ClasificacionGasto;
  empresaId: number;
}

export interface ConceptoGastoEditarDTO {
  nombre: string;
  tipo?: TipoRegistroContable;
  clasificacionId?: number;
  descripcion?: string;
  clasificacion: ClasificacionGasto;
}

export interface ConceptoGastoDTO {
  id: number;
  nombre: string;
  tipo?: TipoRegistroContable;
  clasificacionId?: number;
  clasificacionNombre?: string;
  descripcion?: string;
  clasificacion: ClasificacionGasto;
  empresaId: number;
  empresaNombre: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface RegistroContableCrearDTO {
  tipo: TipoRegistroContable;
  concepto: string;
  clasificacion?: ClasificacionGasto;
  conceptoGastoId?: number;
  descripcion?: string;
  valor: number;
  fecha: string;
}

export interface RegistroGastoEmpleadoDTO {
  descripcion: string;
  valor: number;
  fecha: string;
}

export interface RegistroContableDTO {
  id: number;
  tipo: TipoRegistroContable;
  concepto: string;
  conceptoGastoId?: number;
  conceptoGastoNombre?: string;
  clasificacionId?: number;
  clasificacionNombre?: string;
  clasificacion?: ClasificacionGasto;
  clasificacionGasto?: string;
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
