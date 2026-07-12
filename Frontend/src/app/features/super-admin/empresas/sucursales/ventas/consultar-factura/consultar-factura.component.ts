import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import Swal from 'sweetalert2';

import { VentaService } from '../../../../../../core/services/venta/venta.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';

import {
  EstadoFactura,
  FacturaVentaDTO
} from '../../../../../../core/models/venta/venta.model';

@Component({
  selector: 'app-consultar-factura',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './consultar-factura.component.html',
  styleUrl: './consultar-factura.component.css'
})
export class ConsultarFacturaComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  tipoBusqueda: 'NUMERO' | 'ID' | 'CEDULA_CLIENTE' = 'NUMERO';
  valorBusqueda = '';

  facturaSeleccionada: FacturaVentaDTO | null = null;

  facturasOriginales: FacturaVentaDTO[] = [];
  facturas: FacturaVentaDTO[] = [];
  facturasPaginadas: FacturaVentaDTO[] = [];

  cargando = false;
  cargandoListado = false;

  mensajeError = '';
  mensajeExito = '';

  paginaActual = 1;
  tamanioPagina = 20;
  totalPaginas = 0;

  cancelando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ventaService: VentaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.obtenerEmpresaIdDesdeRuta();
    const sucursalIdParam = this.obtenerSucursalIdDesdeRuta();

    if (!empresaIdParam || !sucursalIdParam) {
      this.mensajeError = 'No se pudo identificar la empresa o la sucursal.';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);

    if (
      Number.isNaN(this.empresaId) ||
      Number.isNaN(this.sucursalId) ||
      this.empresaId <= 0 ||
      this.sucursalId <= 0
    ) {
      this.mensajeError = 'Los identificadores de empresa o sucursal no son válidos.';
      return;
    }

    if (!this.validarAccesoLocal()) {
      return;
    }

    this.cargarFacturasSucursal();
  }

  private obtenerEmpresaIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('empresaId') ??
      null
    );
  }

  private obtenerSucursalIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('sucursalId') ??
      null
    );
  }

  private obtenerRolNormalizado(): string | null {
    const rol = this.authService.obtenerRol();

    if (!rol) {
      return null;
    }

    return rol.replace('ROLE_', '');
  }

  private validarAccesoLocal(): boolean {
    const rol = this.obtenerRolNormalizado();
    const empresaIdUsuario = this.authService.obtenerEmpresaId();

    if (rol === 'SUPER_ADMIN') {
      return true;
    }

    if (rol === 'ADMIN' && empresaIdUsuario === this.empresaId) {
      return true;
    }

    this.router.navigate(['/acceso-denegado']);
    return false;
  }

  esSuperAdmin(): boolean {
    return this.obtenerRolNormalizado() === 'SUPER_ADMIN';
  }

  esAdmin(): boolean {
    return this.obtenerRolNormalizado() === 'ADMIN';
  }

  rutaPanelVentas(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'ventas',
        'panel'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'ventas',
      'panel'
    ];
  }

  cargarFacturasSucursal(): void {
    this.cargandoListado = true;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.facturaSeleccionada = null;

    this.ventaService.listarPorSucursal(this.sucursalId).subscribe({
      next: (ventas) => {
        const ventasOrdenadas = (ventas || []).sort((a, b) => {
          const fechaA = new Date(a.fechaVenta).getTime();
          const fechaB = new Date(b.fechaVenta).getTime();

          return fechaB - fechaA;
        });

        this.facturasOriginales = ventasOrdenadas;
        this.facturas = [...this.facturasOriginales];

        this.paginaActual = 1;
        this.calcularPaginacion();

        this.cargandoListado = false;
      },
      error: (error) => {
        this.cargandoListado = false;
        this.mensajeError = this.obtenerMensajeError(error);
        console.error(error);
      }
    });
  }

  consultarFactura(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
    this.facturaSeleccionada = null;

    const valor = this.valorBusqueda.trim();

    if (!valor) {
      this.mensajeError = 'Debe ingresar un valor para consultar.';
      return;
    }

    if (this.tipoBusqueda === 'CEDULA_CLIENTE') {
      this.filtrarFacturasPorCedula(valor);
      return;
    }

    this.cargando = true;

    if (this.tipoBusqueda === 'NUMERO') {
      this.ventaService.obtenerPorNumero(valor).subscribe({
        next: (factura) => {
          if (Number(factura.sucursalId) !== this.sucursalId) {
            this.facturaSeleccionada = null;
            this.cargando = false;
            this.mensajeError = 'La factura consultada no pertenece a esta sucursal.';
            return;
          }

          this.facturaSeleccionada = factura;
          this.cargando = false;
        },
        error: (error) => {
          this.cargando = false;
          this.mensajeError = this.obtenerMensajeError(error);
          console.error(error);
        }
      });

      return;
    }

    const ventaId = Number(valor);

    if (Number.isNaN(ventaId) || ventaId <= 0) {
      this.cargando = false;
      this.mensajeError = 'El ID de la factura no es válido.';
      return;
    }

    this.ventaService.obtenerPorId(ventaId).subscribe({
      next: (factura) => {
        if (Number(factura.sucursalId) !== this.sucursalId) {
          this.facturaSeleccionada = null;
          this.cargando = false;
          this.mensajeError = 'La factura consultada no pertenece a esta sucursal.';
          return;
        }

        this.facturaSeleccionada = factura;
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = this.obtenerMensajeError(error);
        console.error(error);
      }
    });
  }

  filtrarFacturasPorCedula(cedula: string): void {
    const cedulaNormalizada = cedula.trim();

    this.facturaSeleccionada = null;

    this.facturas = this.facturasOriginales.filter(factura =>
      factura.clienteDocumento?.includes(cedulaNormalizada)
    );

    this.paginaActual = 1;
    this.calcularPaginacion();

    if (this.facturas.length === 0) {
      this.mensajeError = 'No se encontraron facturas para la cédula ingresada.';
      this.mensajeExito = '';
      return;
    }

    this.mensajeError = '';
    this.mensajeExito =
      `Se encontraron ${this.facturas.length} factura(s) para la cédula ${cedulaNormalizada}.`;
  }

  limpiar(): void {
    this.valorBusqueda = '';
    this.facturaSeleccionada = null;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.facturas = [...this.facturasOriginales];

    this.paginaActual = 1;
    this.calcularPaginacion();
  }

  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.facturas.length / this.tamanioPagina);

    if (this.totalPaginas === 0) {
      this.totalPaginas = 1;
    }

    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    const fin = inicio + this.tamanioPagina;

    this.facturasPaginadas = this.facturas.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) {
      return;
    }

    this.paginaActual = pagina;
    this.calcularPaginacion();
  }

  verDetalleFactura(factura: FacturaVentaDTO): void {
    this.facturaSeleccionada = factura;
    this.mensajeError = '';
    this.mensajeExito = '';

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  volverAlPanel(): void {
    this.router.navigate(this.rutaPanelVentas());
  }

  contarFacturasRegistradas(): number {
    return this.facturasOriginales.length;
  }

  contarFacturasFiltradas(): number {
    return this.facturas.length;
  }

  calcularTotalFacturado(): number {
    return this.facturas.reduce(
      (total, factura) => total + (factura.total || 0),
      0
    );
  }

  calcularTotalDescuentos(): number {
    return this.facturas.reduce(
      (total, factura) => total + (factura.descuento || 0),
      0
    );
  }

  puedeCancelarFactura(factura: FacturaVentaDTO): boolean {
    return factura.estado === 'ACTIVA' || factura.estado === 'DEVUELTA_PARCIAL';
  }

  cancelarFactura(factura: FacturaVentaDTO): void {
    if (!this.puedeCancelarFactura(factura)) {
      Swal.fire({
        icon: 'warning',
        title: 'Factura no cancelable',
        text: 'Esta factura no se puede cancelar por su estado actual.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0d6efd'
      });

      return;
    }

    Swal.fire({
      icon: 'warning',
      title: 'Cancelar factura',
      html: `
        <p class="mb-2">
          Vas a cancelar la factura <strong>${factura.numeroVenta}</strong>.
        </p>
        <p class="mb-0 text-muted">
          Esta acción reintegrará automáticamente el inventario asociado.
        </p>
      `,
      input: 'textarea',
      inputLabel: 'Motivo de cancelación',
      inputPlaceholder: 'Ej: Error en la venta, cliente desistió, factura generada por equivocación...',
      inputAttributes: {
        maxlength: '300'
      },
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Debe ingresar un motivo para cancelar la factura.';
        }

        if (value.trim().length < 5) {
          return 'El motivo debe tener al menos 5 caracteres.';
        }

        return null;
      }
    }).then((motivoResult) => {
      if (!motivoResult.isConfirmed) {
        return;
      }

      const motivo = motivoResult.value.trim();

      Swal.fire({
        icon: 'question',
        title: 'Confirmar cancelación',
        html: `
          <p>
            ¿Está seguro de cancelar la factura
            <strong>${factura.numeroVenta}</strong>?
          </p>
          <p class="text-muted mb-0">
            El inventario será reintegrado automáticamente y la factura quedará marcada como cancelada.
          </p>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar factura',
        cancelButtonText: 'No, volver',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
      }).then((confirmacionResult) => {
        if (!confirmacionResult.isConfirmed) {
          return;
        }

        this.ejecutarCancelacionFactura(factura, motivo);
      });
    });
  }

  private ejecutarCancelacionFactura(
    factura: FacturaVentaDTO,
    motivo: string
  ): void {
    this.cancelando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    Swal.fire({
      title: 'Cancelando factura...',
      text: 'Por favor espera mientras se reintegra el inventario.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.ventaService.cancelarVenta(factura.id, motivo).subscribe({
      next: (facturaActualizada) => {
        this.cancelando = false;
        this.facturaSeleccionada = facturaActualizada;

        this.facturasOriginales = this.facturasOriginales.map(item =>
          item.id === facturaActualizada.id ? facturaActualizada : item
        );

        this.facturas = this.facturas.map(item =>
          item.id === facturaActualizada.id ? facturaActualizada : item
        );

        this.calcularPaginacion();

        this.mensajeExito =
          `Factura ${facturaActualizada.numeroVenta} cancelada correctamente.`;

        Swal.fire({
          icon: 'success',
          title: 'Factura cancelada',
          html: `
            <p>
              La factura <strong>${facturaActualizada.numeroVenta}</strong> fue cancelada correctamente.
            </p>
            <p class="text-muted mb-0">
              El inventario asociado fue reintegrado automáticamente.
            </p>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#0d6efd'
        });
      },
      error: (error) => {
        this.cancelando = false;
        this.mensajeError = this.obtenerMensajeError(error);

        Swal.fire({
          icon: 'error',
          title: 'No se pudo cancelar',
          text: this.mensajeError,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#dc3545'
        });

        console.error(error);
      }
    });
  }

  calcularCantidadVendida(factura: FacturaVentaDTO): number {
    return factura.detalles.reduce(
      (total, detalle) => total + detalle.cantidad,
      0
    );
  }

  calcularCostoTotal(factura: FacturaVentaDTO): number {
    return factura.detalles.reduce(
      (total, detalle) =>
        total + detalle.costoUnitarioMomento * detalle.cantidad,
      0
    );
  }

  calcularSubtotalFactura(factura: FacturaVentaDTO): number {
    return factura.subtotal || 0;
  }

  calcularDescuento(factura: FacturaVentaDTO): number {
    return factura.descuento || 0;
  }

  calcularTotalFactura(factura: FacturaVentaDTO): number {
    return factura.total || 0;
  }

  calcularUtilidad(factura: FacturaVentaDTO): number {
    return this.calcularTotalFactura(factura) - this.calcularCostoTotal(factura);
  }

  claseEstado(estado: EstadoFactura): string {
    switch (estado) {
      case 'ACTIVA':
        return 'bg-success';

      case 'CANCELADA':
        return 'bg-danger';

      case 'DEVUELTA_PARCIAL':
        return 'bg-warning text-dark';

      case 'DEVUELTA_TOTAL':
        return 'bg-secondary';

      default:
        return 'bg-secondary';
    }
  }

  obtenerMensajeError(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }

    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.message) {
      return error.message;
    }

    return 'Ocurrió un error al procesar la solicitud.';
  }
}
