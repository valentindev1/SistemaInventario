export interface InformeFinancieroPeriodoDTO {
  periodo: string;
  facturasEfectivas: number;
  unidadesVendidas: number;
  ingresosNetos: number;
  costoProductosVendidos: number;
  utilidadBruta: number;
  costosIndirectos: number;
  gastos: number;
  perdidasAjustesInventario: number;
  utilidadNeta: number;
}

export interface InformeFinancieroSucursalDTO {
  sucursalId: number;
  sucursalNombre: string;
  facturasEfectivas: number;
  unidadesVendidas: number;
  ingresosNetos: number;
  costoProductosVendidos: number;
  utilidadBruta: number;
  costosIndirectos: number;
  gastos: number;
  perdidasAjustesInventario: number;
  utilidadNeta: number;
}

export interface InformeFinancieroClasificacionDTO {
  tipo: 'COSTO INDIRECTO' | 'GASTO' | 'AJUSTE';
  clasificacion: string;
  valor: number;
  porcentajeEgresos: number;
}

export interface InformeFinancieroTipoProductoDTO {
  tipo: 'REMANUFACTURADOS' | 'CONVENCIONALES';
  unidadesVendidas: number;
  ingresosNetos: number;
  costoVendido: number;
  utilidadBruta: number;
}

export interface InformeFinancieroEmpresaDTO {
  empresaId: number;
  empresaNombre: string;
  sucursalId?: number;
  sucursalNombre: string;
  fechaInicio: string;
  fechaFin: string;
  cantidadSucursalesIncluidas: number;
  facturasEmitidas: number;
  facturasEfectivas: number;
  facturasCanceladas: number;
  unidadesVendidas: number;
  unidadesDevueltas: number;
  ventasBrutas: number;
  descuentos: number;
  ingresosNetos: number;
  costoProductosVendidos: number;
  utilidadBruta: number;
  costosIndirectos: number;
  gastos: number;
  perdidasAjustesInventario: number;
  egresosOperativos: number;
  utilidadNeta: number;
  margenBruto: number;
  margenNeto: number;
  comprasVariasIncluidas: boolean;
  productosRemanufacturados: InformeFinancieroTipoProductoDTO;
  productosConvencionales: InformeFinancieroTipoProductoDTO;
  periodos: InformeFinancieroPeriodoDTO[];
  sucursales: InformeFinancieroSucursalDTO[];
  egresosPorClasificacion: InformeFinancieroClasificacionDTO[];
}
