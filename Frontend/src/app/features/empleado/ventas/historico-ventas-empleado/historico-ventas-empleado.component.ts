import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { EmpleadoVentaService } from '../../../../core/services/empleado/empleado-venta.service';

import {
  FacturaVentaEmpleadoDTO,
  VentaHistorialEmpleadoDTO
} from '../../../../core/models/venta/empleado/venta-empleado.model';

@Component({
  selector: 'app-historico-ventas-empleado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './historico-ventas-empleado.component.html',
  styleUrl: './historico-ventas-empleado.component.css'
})
export class HistoricoVentasEmpleadoComponent implements OnInit {

  tipoFiltroFecha: 'TODOS' | 'DIA' | 'MES' = 'TODOS';

  fechaDia = '';
  mesSeleccionado = '';

  @ViewChild('detalleVenta') detalleVentaRef?: ElementRef<HTMLDivElement>;

  sucursalId!: number;
  empresaId!: number;

  ventas: VentaHistorialEmpleadoDTO[] = [];
  ventasFiltradas: VentaHistorialEmpleadoDTO[] = [];

  ventaSeleccionada: FacturaVentaEmpleadoDTO | null = null;

  filtro = '';
  estadoFiltro = '';

  cargando = false;
  cargandoDetalle = false;

  mensajeError = '';
  mensajeExito = '';

  paginaActual = 1;
  registrosPorPagina = 20;
  totalPaginas = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private empleadoVentaService: EmpleadoVentaService
  ) {}

  ngOnInit(): void {

    const accesoValido = this.validarAccesoEmpleado();

    if (!accesoValido) {
      return;
    }

    this.cargarHistorico();
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
        'ventas',
        'historico'
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
        'ventas',
        'historico'
      ]);

      return false;
    }

    if (sucursalIdRuta !== sucursalIdUsuario) {
      this.router.navigate([
        '/empleado',
        'sucursal',
        sucursalIdUsuario,
        'ventas',
        'historico'
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

  cargarHistorico(): void {

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.ventaSeleccionada = null;

    this.empleadoVentaService.listarPorSucursal(this.sucursalId)
      .subscribe({
        next: (data) => {
          this.ventas = data || [];
          this.ventasFiltradas = [...this.ventas];

          this.paginaActual = 1;
          this.actualizarTotalPaginas();

          this.cargando = false;
        },
        error: (error) => {
          this.cargando = false;

          this.mensajeError = this.obtenerMensajeError(
            error,
            'No se pudo cargar el historico de ventas.'
          );

          console.error(error);
        }
      });
  }

  filtrarVentas(): void {

    const texto = this.filtro.trim().toLowerCase();
    const estado = this.estadoFiltro.trim();

    this.ventasFiltradas = this.ventas.filter(venta => {

      const coincideTexto =
        !texto ||
        venta.numeroVenta?.toLowerCase().includes(texto) ||
        venta.clienteNombre?.toLowerCase().includes(texto) ||
        venta.clienteDocumento?.toLowerCase().includes(texto) ||
        venta.usuarioNombre?.toLowerCase().includes(texto) ||
        venta.estado?.toLowerCase().includes(texto);

      const coincideEstado =
        !estado ||
        venta.estado === estado;

      const coincideFecha = this.validarFiltroFecha(venta.fechaVenta);

      return coincideTexto && coincideEstado && coincideFecha;
    });

    this.paginaActual = 1;
    this.actualizarTotalPaginas();
  }

  private validarFiltroFecha(fechaVenta: string): boolean {

    if (this.tipoFiltroFecha === 'TODOS') {
      return true;
    }

    if (!fechaVenta) {
      return false;
    }

    const fecha = new Date(fechaVenta);

    if (Number.isNaN(fecha.getTime())) {
      return false;
    }

    if (this.tipoFiltroFecha === 'DIA') {

      if (!this.fechaDia) {
        return true;
      }

      const fechaVentaFormato = fecha.toISOString().substring(0, 10);

      return fechaVentaFormato === this.fechaDia;
    }

    if (this.tipoFiltroFecha === 'MES') {

      if (!this.mesSeleccionado) {
        return true;
      }

      const anio = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const mesVentaFormato = `${anio}-${mes}`;

      return mesVentaFormato === this.mesSeleccionado;
    }

    return true;
  }

  limpiarFiltros(): void {
    this.filtro = '';
    this.estadoFiltro = '';
    this.tipoFiltroFecha = 'TODOS';
    this.fechaDia = '';
    this.mesSeleccionado = '';

    this.filtrarVentas();
  }

  cambiarTipoFiltroFecha(): void {

    if (this.tipoFiltroFecha !== 'DIA') {
      this.fechaDia = '';
    }

    if (this.tipoFiltroFecha !== 'MES') {
      this.mesSeleccionado = '';
    }

    this.filtrarVentas();
  }

  obtenerDescripcionFiltroFecha(): string {

    if (this.tipoFiltroFecha === 'TODOS') {
      return 'Todas las fechas';
    }

    if (this.tipoFiltroFecha === 'DIA') {
      return this.fechaDia
        ? `Dia seleccionado: ${this.fechaDia}`
        : 'Filtrando por dia';
    }

    if (this.tipoFiltroFecha === 'MES') {
      return this.mesSeleccionado
        ? `Mes seleccionado: ${this.mesSeleccionado}`
        : 'Filtrando por mes';
    }

    return 'Todas las fechas';
  }

  verDetalleVenta(ventaId: number): void {

    this.cargandoDetalle = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.empleadoVentaService.obtenerPorId(ventaId)
      .subscribe({
        next: (venta) => {

          if (venta.sucursalId !== this.sucursalId) {
            this.cargandoDetalle = false;
            this.mensajeError = 'La venta no pertenece a esta sucursal.';
            return;
          }

          this.ventaSeleccionada = venta;
          this.cargandoDetalle = false;

          setTimeout(() => {
            this.detalleVentaRef?.nativeElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }, 100);
        },
        error: (error) => {
          this.cargandoDetalle = false;

          this.mensajeError = this.obtenerMensajeError(
            error,
            'No se pudo cargar el detalle de la venta.'
          );

          console.error(error);
        }
      });
  }

  cerrarDetalle(): void {
    this.ventaSeleccionada = null;
  }

  get ventasPaginadas(): VentaHistorialEmpleadoDTO[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;

    return this.ventasFiltradas.slice(inicio, fin);
  }

  actualizarTotalPaginas(): void {
    this.totalPaginas = Math.max(
      1,
      Math.ceil(this.ventasFiltradas.length / this.registrosPorPagina)
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

  calcularTotalVentasFiltradas(): number {
    return this.ventasFiltradas.reduce(
      (total, venta) => total + (Number(venta.total) || 0),
      0
    );
  }

  calcularCantidadVentasActivas(): number {
    return this.ventasFiltradas.filter(
      venta => venta.estado === 'ACTIVA'
    ).length;
  }

  calcularCantidadVentasCanceladas(): number {
    return this.ventasFiltradas.filter(
      venta => venta.estado === 'CANCELADA'
    ).length;
  }

  calcularCantidadVentasDevueltas(): number {
    return this.ventasFiltradas.filter(
      venta =>
        venta.estado === 'DEVUELTA_PARCIAL' ||
        venta.estado === 'DEVUELTA_TOTAL'
    ).length;
  }

  volverPanelVentas(): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'ventas',
      'panel'
    ]);
  }

  irGenerarVenta(): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'ventas',
      'generar'
    ]);
  }

  irVerFacturas(): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'ventas',
      'facturas'
    ]);
  }

  irGenerarDevolucion(numeroVenta?: string): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'ventas',
      'devolucion'
    ], {
      queryParams: {
        numeroVenta: numeroVenta || null
      }
    });
  }

  puedeGenerarDevolucion(estado: string): boolean {
    return estado === 'ACTIVA' || estado === 'DEVUELTA_PARCIAL';
  }

  getClaseEstado(estado: string): string {

    switch (estado) {
      case 'ACTIVA':
        return 'estado-activa';

      case 'CANCELADA':
        return 'estado-cancelada';

      case 'DEVUELTA_PARCIAL':
        return 'estado-devuelta-parcial';

      case 'DEVUELTA_TOTAL':
        return 'estado-devuelta-total';

      default:
        return 'estado-default';
    }
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
