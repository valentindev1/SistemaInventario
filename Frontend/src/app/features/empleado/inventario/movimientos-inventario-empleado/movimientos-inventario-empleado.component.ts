import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { EmpleadoInventarioService } from '../../../../core/services/empleado/empleado-inventario.service';

import {
  MovimientoInventarioEmpleadoDTO
} from '../../../../core/models/inventario/inventario.model';

@Component({
  selector: 'app-movimientos-inventario-empleado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './movimientos-inventario-empleado.component.html',
  styleUrl: './movimientos-inventario-empleado.component.css'
})
export class MovimientosInventarioEmpleadoComponent implements OnInit {

  sucursalId!: number;
  empresaId!: number;

  movimientos: MovimientoInventarioEmpleadoDTO[] = [];
  movimientosFiltrados: MovimientoInventarioEmpleadoDTO[] = [];

  filtro = '';
  tipoFiltro = '';
  tipoFiltroFecha: 'TODOS' | 'DIA' | 'MES' = 'TODOS';
  menuFiltroAbierto: 'TIPO' | 'FECHA' | null = null;

  readonly opcionesTipoFiltro = [
    { valor: '', etiqueta: 'Todos los movimientos', icono: 'bi-list-ul', clase: 'filtro-todos' },
    { valor: 'INGRESO_MERCANCIA', etiqueta: 'Ingresos', icono: 'bi-box-arrow-in-down', clase: 'filtro-ingreso' },
    { valor: 'VENTA', etiqueta: 'Ventas', icono: 'bi-cart-check', clase: 'filtro-venta' },
    { valor: 'DEVOLUCION', etiqueta: 'Devoluciones', icono: 'bi-arrow-return-left', clase: 'filtro-devolucion' },
    { valor: 'AJUSTE_POSITIVO', etiqueta: 'Ajustes positivos', icono: 'bi-plus-circle', clase: 'filtro-ajuste-positivo' },
    { valor: 'AJUSTE_NEGATIVO', etiqueta: 'Ajustes negativos', icono: 'bi-dash-circle', clase: 'filtro-ajuste-negativo' },
    { valor: 'CANCELACION_FACTURA', etiqueta: 'Cancelaciones', icono: 'bi-x-circle', clase: 'filtro-cancelacion' }
  ];

  readonly opcionesFechaFiltro = [
    { valor: 'TODOS' as const, etiqueta: 'Todas las fechas', icono: 'bi-calendar3', clase: 'filtro-todos' },
    { valor: 'DIA' as const, etiqueta: 'Por día', icono: 'bi-calendar-day', clase: 'filtro-dia' },
    { valor: 'MES' as const, etiqueta: 'Por mes', icono: 'bi-calendar-month', clase: 'filtro-mes' }
  ];

  fechaDia = '';
  mesSeleccionado = '';

  cargando = false;

  mensajeError = '';
  mensajeExito = '';

  paginaActual = 1;
  registrosPorPagina = 20;
  totalPaginas = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private empleadoInventarioService: EmpleadoInventarioService
  ) {}

  @HostListener('document:click')
  cerrarMenusFiltroAlHacerClickFuera(): void {
    this.menuFiltroAbierto = null;
  }

  ngOnInit(): void {

    const accesoValido = this.validarAccesoEmpleado();

    if (!accesoValido) {
      return;
    }

    this.cargarMovimientos();
  }

  private validarAccesoEmpleado(): boolean {

    this.mensajeError = '';

    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return false;
    }

    const rol = this.authService.obtenerRol();
    const empresaIdUsuario = this.authService.obtenerEmpresaId();
    const sucursalIdUsuario = this.authService.obtenerSucursalId();

    if (!rol) {
      this.router.navigate(['/login']);
      return false;
    }

    if (rol !== 'EMPLEADO') {
      this.router.navigate(['/acceso-denegado']);
      return false;
    }

    if (!empresaIdUsuario || !sucursalIdUsuario) {
      this.mensajeError = 'No se pudo identificar la empresa o sucursal del empleado.';
      this.router.navigate(['/login']);
      return false;
    }

    const sucursalIdParam = this.obtenerSucursalIdDesdeRuta();

    if (!sucursalIdParam) {
      this.router.navigate([
        '/empleado',
        'sucursal',
        sucursalIdUsuario,
        'inventario',
        'movimientos'
      ]);

      return false;
    }

    const sucursalIdRuta = Number(sucursalIdParam);

    if (
      Number.isNaN(sucursalIdRuta) ||
      sucursalIdRuta <= 0
    ) {
      this.router.navigate([
        '/empleado',
        'sucursal',
        sucursalIdUsuario,
        'inventario',
        'movimientos'
      ]);

      return false;
    }

    if (sucursalIdRuta !== sucursalIdUsuario) {
      this.router.navigate([
        '/empleado',
        'sucursal',
        sucursalIdUsuario,
        'inventario',
        'movimientos'
      ]);

      return false;
    }

    this.empresaId = empresaIdUsuario;
    this.sucursalId = sucursalIdUsuario;

    return true;
  }

  private obtenerSucursalIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.parent?.parent?.snapshot.paramMap.get('sucursalId') ??
      null
    );
  }

  cargarMovimientos(): void {

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.empleadoInventarioService.listarMovimientosPorSucursal(this.sucursalId)
      .subscribe({
        next: (data) => {
          this.movimientos = data || [];
          this.movimientosFiltrados = [...this.movimientos];

          this.paginaActual = 1;
          this.actualizarTotalPaginas();

          this.cargando = false;
        },
        error: (error) => {
          this.cargando = false;

          this.mensajeError = this.obtenerMensajeError(
            error,
            'No se pudieron cargar los movimientos del inventario.'
          );

          console.error(error);
        }
      });
  }

  filtrarMovimientos(): void {

    const texto = this.filtro.trim().toLowerCase();
    const tipo = this.tipoFiltro.trim();

    this.movimientosFiltrados = this.movimientos.filter(movimiento => {

      const coincideTexto =
        !texto ||
        movimiento.productoCodigo?.toLowerCase().includes(texto) ||
        movimiento.productoNombre?.toLowerCase().includes(texto) ||
        movimiento.tipo?.toLowerCase().includes(texto) ||
        movimiento.usuarioNombre?.toLowerCase().includes(texto) ||
        movimiento.motivo?.toLowerCase().includes(texto);

      const coincideTipo =
        !tipo ||
        movimiento.tipo === tipo;

      const coincideFecha = this.validarFiltroFecha(movimiento.fecha);

      return coincideTexto && coincideTipo && coincideFecha;
    });

    this.paginaActual = 1;
    this.actualizarTotalPaginas();
  }

  private validarFiltroFecha(fechaMovimiento: string): boolean {

    if (this.tipoFiltroFecha === 'TODOS') {
      return true;
    }

    if (!fechaMovimiento) {
      return false;
    }

    const fecha = new Date(fechaMovimiento);

    if (Number.isNaN(fecha.getTime())) {
      return false;
    }

    if (this.tipoFiltroFecha === 'DIA') {

      if (!this.fechaDia) {
        return true;
      }

      const fechaFormato = fecha.toISOString().substring(0, 10);

      return fechaFormato === this.fechaDia;
    }

    if (this.tipoFiltroFecha === 'MES') {

      if (!this.mesSeleccionado) {
        return true;
      }

      const anio = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const mesFormato = `${anio}-${mes}`;

      return mesFormato === this.mesSeleccionado;
    }

    return true;
  }

  cambiarTipoFiltroFecha(): void {

    if (this.tipoFiltroFecha !== 'DIA') {
      this.fechaDia = '';
    }

    if (this.tipoFiltroFecha !== 'MES') {
      this.mesSeleccionado = '';
    }

    this.filtrarMovimientos();
  }

  limpiarFiltros(): void {
    this.filtro = '';
    this.tipoFiltro = '';
    this.tipoFiltroFecha = 'TODOS';
    this.fechaDia = '';
    this.mesSeleccionado = '';
    this.menuFiltroAbierto = null;

    this.filtrarMovimientos();
  }

  alternarMenuFiltro(menu: 'TIPO' | 'FECHA'): void {
    this.menuFiltroAbierto = this.menuFiltroAbierto === menu ? null : menu;
  }

  seleccionarTipoFiltro(valor: string): void {
    this.tipoFiltro = valor;
    this.menuFiltroAbierto = null;
    this.filtrarMovimientos();
  }

  seleccionarTipoFiltroFecha(valor: 'TODOS' | 'DIA' | 'MES'): void {
    this.tipoFiltroFecha = valor;
    this.menuFiltroAbierto = null;
    this.cambiarTipoFiltroFecha();
  }

  get etiquetaTipoFiltro(): string {
    return this.opcionesTipoFiltro.find(opcion => opcion.valor === this.tipoFiltro)?.etiqueta
      ?? 'Todos los movimientos';
  }

  get iconoTipoFiltro(): string {
    return this.opcionesTipoFiltro.find(opcion => opcion.valor === this.tipoFiltro)?.icono
      ?? 'bi-list-ul';
  }

  get claseTipoFiltro(): string {
    return this.opcionesTipoFiltro.find(opcion => opcion.valor === this.tipoFiltro)?.clase
      ?? 'filtro-todos';
  }

  get etiquetaTipoFiltroFecha(): string {
    return this.opcionesFechaFiltro.find(opcion => opcion.valor === this.tipoFiltroFecha)?.etiqueta
      ?? 'Todas las fechas';
  }

  get iconoTipoFiltroFecha(): string {
    return this.opcionesFechaFiltro.find(opcion => opcion.valor === this.tipoFiltroFecha)?.icono
      ?? 'bi-calendar3';
  }

  get claseTipoFiltroFecha(): string {
    return this.opcionesFechaFiltro.find(opcion => opcion.valor === this.tipoFiltroFecha)?.clase
      ?? 'filtro-todos';
  }

  get movimientosPaginados(): MovimientoInventarioEmpleadoDTO[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;

    return this.movimientosFiltrados.slice(inicio, fin);
  }

  actualizarTotalPaginas(): void {
    this.totalPaginas = Math.max(
      1,
      Math.ceil(this.movimientosFiltrados.length / this.registrosPorPagina)
    );

    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas;
    }
  }

  irPaginaAnterior(): void {
    if (this.paginaActual <= 1) {
      return;
    }

    this.paginaActual--;
    this.subirArriba();
  }

  irPaginaSiguiente(): void {
    if (this.paginaActual >= this.totalPaginas) {
      return;
    }

    this.paginaActual++;
    this.subirArriba();
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) {
      return;
    }

    this.paginaActual = pagina;
    this.subirArriba();
  }

  get paginasDisponibles(): number[] {

    const maxPaginasVisibles = 3;

    if (this.totalPaginas <= maxPaginasVisibles) {
      return Array.from(
        { length: this.totalPaginas },
        (_, index) => index + 1
      );
    }

    let inicio = this.paginaActual - 1;
    let fin = this.paginaActual + 1;

    if (this.paginaActual === 1) {
      inicio = 1;
      fin = 3;
    }

    if (this.paginaActual === this.totalPaginas) {
      inicio = this.totalPaginas - 2;
      fin = this.totalPaginas;
    }

    const paginas: number[] = [];

    for (let pagina = inicio; pagina <= fin; pagina++) {
      paginas.push(pagina);
    }

    return paginas;
  }

  calcularEntradas(): number {
    return this.movimientosFiltrados.filter(
      movimiento => movimiento.cantidad > 0
    ).length;
  }

  calcularSalidas(): number {
    return this.movimientosFiltrados.filter(
      movimiento => movimiento.cantidad < 0
    ).length;
  }

  calcularTotalMovimientos(): number {
    return this.movimientosFiltrados.length;
  }

  calcularUnidadesMovidas(): number {
    return this.movimientosFiltrados.reduce(
      (total, movimiento) => total + Math.abs(Number(movimiento.cantidad) || 0),
      0
    );
  }

  getClaseTipo(tipo: string): string {

    switch (tipo) {
      case 'INGRESO_MERCANCIA':
        return 'tipo-ingreso';

      case 'VENTA':
        return 'tipo-venta';

      case 'DEVOLUCION':
        return 'tipo-devolucion';

      case 'AJUSTE_POSITIVO':
        return 'tipo-ajuste-positivo';

      case 'AJUSTE_NEGATIVO':
        return 'tipo-ajuste-negativo';

      case 'CANCELACION_FACTURA':
        return 'tipo-cancelacion';

      default:
        return 'tipo-default';
    }
  }

  formatearTipo(tipo: string): string {

    switch (tipo) {
      case 'INGRESO_MERCANCIA':
        return 'Ingreso';

      case 'VENTA':
        return 'Venta';

      case 'DEVOLUCION':
        return 'Devolucion';

      case 'AJUSTE_POSITIVO':
        return 'Ajuste +';

      case 'AJUSTE_NEGATIVO':
        return 'Ajuste -';

      case 'CANCELACION_FACTURA':
        return 'Cancelacion';

      default:
        return tipo;
    }
  }

  getIconoTipo(tipo: string): string {
    switch (tipo) {
      case 'INGRESO_MERCANCIA':
        return 'bi-box-arrow-in-down';
      case 'VENTA':
        return 'bi-cart-check';
      case 'DEVOLUCION':
        return 'bi-arrow-return-left';
      case 'AJUSTE_POSITIVO':
        return 'bi-plus-circle';
      case 'AJUSTE_NEGATIVO':
        return 'bi-dash-circle';
      case 'CANCELACION_FACTURA':
        return 'bi-x-circle';
      default:
        return 'bi-arrow-left-right';
    }
  }

  volverPanelInventario(): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'inventario',
      'panel'
    ]);
  }

  private subirArriba(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  private obtenerMensajeError(error: any, mensajeDefecto: string): string {

    if (Array.isArray(error?.error?.errores)) {
      return error.error.errores.join(', ');
    }

    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.error?.error) {
      return error.error.error;
    }

    return mensajeDefecto;
  }
}
