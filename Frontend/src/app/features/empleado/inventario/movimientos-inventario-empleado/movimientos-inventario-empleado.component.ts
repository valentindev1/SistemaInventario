import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

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

  movimientos: MovimientoInventarioEmpleadoDTO[] = [];
  movimientosFiltrados: MovimientoInventarioEmpleadoDTO[] = [];

  filtro = '';
  tipoFiltro = '';
  tipoFiltroFecha: 'TODOS' | 'DIA' | 'MES' = 'TODOS';

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
    private empleadoInventarioService: EmpleadoInventarioService
  ) {}

  ngOnInit(): void {

    const sucursalIdParam = this.route.snapshot.paramMap.get('sucursalId');

    if (!sucursalIdParam) {
      this.mensajeError = 'No se pudo identificar la sucursal.';
      return;
    }

    this.sucursalId = Number(sucursalIdParam);

    if (!this.sucursalId) {
      this.mensajeError = 'El identificador de la sucursal no es válido.';
      return;
    }

    this.cargarMovimientos();
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

          this.mensajeError =
            error?.error?.message ||
            error?.error ||
            'No se pudieron cargar los movimientos del inventario.';
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

    this.filtrarMovimientos();
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
        return 'Devolución';

      case 'AJUSTE_POSITIVO':
        return 'Ajuste +';

      case 'AJUSTE_NEGATIVO':
        return 'Ajuste -';

      case 'CANCELACION_FACTURA':
        return 'Cancelación';

      default:
        return tipo;
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
}
