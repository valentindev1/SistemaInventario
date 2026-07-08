export interface EmpresaCrearDTO {
  nombre: string;
  nit: string;
  correo: string;
  telefono: string;
  direccion: string;
}

export interface EmpresaEditarDTO {
  nombre: string;
  nit: string;
  correo: string;
  telefono: string;
  direccion: string;
}

export interface EmpresaObtenerDTO {
  id: number;
  nombre: string;
  nit: string;
  correo: string;
  telefono: string;
  direccion: string;
  fechaCreacion: string;
}

export interface DashboardEmpresaDTO {
  empresaId: number;
  empresaNombre: string;

  fechaInicio: string;
  fechaFin: string;

  cantidadSucursales: number;

  unidadesInventarioTotal: number;
  referenciasInventarioTotal: number;

  productosAgotados: number;
  productosBajoStock: number;
  productosAltoStock: number;

  costoInventarioTotal: number;
  valorComercialInventarioTotal: number;
  utilidadProyectadaInventario: number;

  facturasEmitidas: number;
  facturasActivas: number;
  facturasCanceladas: number;
  facturasDevueltasParcial: number;
  facturasDevueltasTotal: number;

  productosVendidos: number;
  productosDevueltos: number;

  ventasBrutas: number;
  descuentos: number;
  ventasNetas: number;

  costoVendido: number;
  utilidadBruta: number;

  valorCancelado: number;
  valorDevuelto: number;

  costoAjustesNegativos: number;
  unidadesAjustadasNegativas: number;

  resultadoOperativoEstimado: number;

  margenUtilidadBruta: number;
  margenOperativo: number;

  mejorSucursalVentas?: DashboardSucursalResumenDTO | null;
  mejorSucursalUtilidad?: DashboardSucursalResumenDTO | null;
  sucursalMayorInventario?: DashboardSucursalResumenDTO | null;
  sucursalMasAjustesNegativos?: DashboardSucursalResumenDTO | null;

  sucursales: DashboardSucursalResumenDTO[];

  productosCriticos: DashboardProductoCriticoDTO[];
}

export interface DashboardSucursalResumenDTO {
  sucursalId: number;
  sucursalNombre: string;

  unidadesInventario: number;
  referenciasInventario: number;

  productosAgotados: number;
  productosBajoStock: number;

  costoInventario: number;
  valorComercialInventario: number;
  utilidadProyectadaInventario: number;

  facturasEmitidas: number;
  facturasActivas: number;
  facturasCanceladas: number;

  ventasBrutas: number;
  descuentos: number;
  ventasNetas: number;

  costoVendido: number;
  utilidadBruta: number;

  costoAjustesNegativos: number;
  unidadesAjustadasNegativas: number;

  resultadoOperativoEstimado: number;
}

export interface DashboardProductoCriticoDTO {
  productoId: number;

  codigo: string;
  nombre: string;

  sucursalId: number;
  sucursalNombre: string;

  stockActual: number;

  costoUnitario: number;
  precioVenta: number;

  valorCostoTotal: number;
  valorComercialTotal: number;

  tipoAlerta: string;
}
