
export type TipoCostoProducto = 'MANUAL' | 'DESGLOSE';

export interface ProductoCostoDetalleCrearDTO {
  atributoCostoId?: number | null;
  concepto: string;
  valor: number;
}

export interface ProductoCostoDetalleDTO extends ProductoCostoDetalleCrearDTO {
  id: number;
  orden: number;
}

export interface ProductoCrearDTO {
  nombre: string;
  codigo: string;
  descripcion: string;
  empresaId: number;
  colorId: number;
  categoriaId: number;
  tallaId: number;
  generoId: number;

  tipoCosto?: TipoCostoProducto;
  esRemanufacturado?: boolean;
  costoPersonalizado?: boolean;
  costoUnitario?: number;
  desgloseCosto?: ProductoCostoDetalleCrearDTO[];
}

export interface ProductoActualizarCostoDTO {
  tipoCosto: TipoCostoProducto;
  esRemanufacturado: boolean;
  costoUnitario?: number;
  desgloseCosto?: ProductoCostoDetalleCrearDTO[];
}




export interface ProductoEditarDTO {
  nombre: string;
  descripcion: string;
  colorId: number;
  categoriaId: number;
  tallaId: number;
  generoId: number;
}


export interface ProductoAdminObtenerDTO {
  id: number;

  nombre: string;
  codigo: string;
  descripcion: string;

  empresaId: number;
  empresaNombre: string;

  colorId: number;
  colorNombre: string;

  categoriaId: number;
  categoriaNombre: string;
  categoriaTipoGanancia?: 'PORCENTAJE' | 'DINERO' | null;
  categoriaValorGanancia?: number | null;
  categoriaPorcentajeGanancia?: number | null;
  tipoGananciaProducto?: 'PORCENTAJE' | 'DINERO' | null;
  valorGananciaProducto?: number | null;

  tallaId: number;
  tallaNombre: string;

  generoId: number;
  generoNombre: string;

  costoUnitario: number;
  precioVenta: number;

  tipoCosto?: TipoCostoProducto | null;
  esRemanufacturado?: boolean;
  costoPersonalizado?: boolean;
  desgloseCosto?: ProductoCostoDetalleDTO[];

  puedeModificar?: boolean;
  motivoBloqueo?: string | null;


  fechaCreacion: string;
}

export interface ProductoEmpleadoObtenerDTO {
  id: number;

  nombre: string;
  codigo: string;
  descripcion: string;

  empresaId: number;
  empresaNombre: string;

  colorId: number;
  colorNombre: string;

  categoriaId: number;
  categoriaNombre: string;

  tallaId: number;
  tallaNombre: string;

  generoId: number;
  generoNombre: string;

  precioVenta: number;

  fechaCreacion: string;
}

export interface ProductoRankingVentasDTO {
  productoId: number;
  codigo: string;
  nombre: string;
  esRemanufacturado: boolean;
  stockActual: number;
  cantidadVendida: number;
  cantidadDevuelta: number;
  valorVendido: number;
  utilidadEstimada: number;
}

export interface RankingProductosVentasDTO {
  sucursalId: number;
  sucursalNombre: string;
  fechaInicio: string;
  fechaFin: string;
  productosMasVendidos: ProductoRankingVentasDTO[];
  productosMenosVendidos: ProductoRankingVentasDTO[];
}
