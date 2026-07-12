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
  selector: 'app-facturas-empleado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './facturas-empleado.component.html',
  styleUrl: './facturas-empleado.component.css'
})
export class FacturasEmpleadoComponent implements OnInit {

  sucursalId!: number;
  empresaId!: number;

  @ViewChild('detalleFactura') detalleFacturaRef?: ElementRef<HTMLDivElement>;

  paginaActual = 1;
  registrosPorPagina = 20;
  totalPaginas = 1;

  facturas: VentaHistorialEmpleadoDTO[] = [];
  facturasFiltradas: VentaHistorialEmpleadoDTO[] = [];

  facturaSeleccionada: FacturaVentaEmpleadoDTO | null = null;

  filtro = '';

  cargando = false;
  cargandoDetalle = false;

  mensajeError = '';
  mensajeExito = '';

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

    this.cargarFacturas();
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
        'facturas'
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
        'facturas'
      ]);

      return false;
    }

    if (sucursalIdRuta !== sucursalIdUsuario) {
      this.router.navigate([
        '/empleado',
        'sucursal',
        sucursalIdUsuario,
        'ventas',
        'facturas'
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

  get facturasPaginadas(): VentaHistorialEmpleadoDTO[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;

    return this.facturasFiltradas.slice(inicio, fin);
  }

  actualizarTotalPaginas(): void {
    this.totalPaginas = Math.max(
      1,
      Math.ceil(this.facturasFiltradas.length / this.registrosPorPagina)
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
    this.subirAlListado();
  }

  irPaginaSiguiente(): void {
    if (this.paginaActual >= this.totalPaginas) {
      return;
    }

    this.paginaActual++;
    this.subirAlListado();
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) {
      return;
    }

    this.paginaActual = pagina;
    this.subirAlListado();
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

  private subirAlListado(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  cargarFacturas(): void {

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.facturaSeleccionada = null;

    this.empleadoVentaService.listarPorSucursal(this.sucursalId)
      .subscribe({
        next: (data) => {

          this.facturas = data || [];
          this.facturasFiltradas = [...this.facturas];

          this.paginaActual = 1;
          this.actualizarTotalPaginas();

          this.cargando = false;
        },
        error: (error) => {
          this.cargando = false;

          this.mensajeError = this.obtenerMensajeError(
            error,
            'No se pudieron cargar las facturas de la sucursal.'
          );

          console.error(error);
        }
      });
  }

  filtrarFacturas(): void {

    const texto = this.filtro.trim().toLowerCase();

    if (!texto) {
      this.facturasFiltradas = [...this.facturas];
      this.paginaActual = 1;
      this.actualizarTotalPaginas();
      return;
    }

    this.facturasFiltradas = this.facturas.filter(factura => {
      const numeroVenta = factura.numeroVenta?.toLowerCase() || '';
      const clienteNombre = factura.clienteNombre?.toLowerCase() || '';
      const clienteDocumento = factura.clienteDocumento?.toLowerCase() || '';
      const usuarioNombre = factura.usuarioNombre?.toLowerCase() || '';
      const estado = factura.estado?.toLowerCase() || '';

      return numeroVenta.includes(texto) ||
        clienteNombre.includes(texto) ||
        clienteDocumento.includes(texto) ||
        usuarioNombre.includes(texto) ||
        estado.includes(texto);
    });

    this.paginaActual = 1;
    this.actualizarTotalPaginas();
  }

  verDetalleFactura(ventaId: number): void {

    this.cargandoDetalle = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.empleadoVentaService.obtenerPorId(ventaId)
      .subscribe({
        next: (factura) => {

          if (factura.sucursalId !== this.sucursalId) {
            this.cargandoDetalle = false;
            this.mensajeError = 'La factura no pertenece a esta sucursal.';
            return;
          }

          this.facturaSeleccionada = factura;
          this.cargandoDetalle = false;

          setTimeout(() => {
            this.detalleFacturaRef?.nativeElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }, 100);
        },
        error: (error) => {
          this.cargandoDetalle = false;

          this.mensajeError = this.obtenerMensajeError(
            error,
            'No se pudo cargar el detalle de la factura.'
          );

          console.error(error);
        }
      });
  }

  cerrarDetalle(): void {
    this.facturaSeleccionada = null;
  }

  limpiarBusqueda(): void {
    this.filtro = '';
    this.filtrarFacturas();
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
