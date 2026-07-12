import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth.service';

import { EmpleadoVentaService } from '../../../core/services/empleado/empleado-venta.service';

import {
  VentaHistorialEmpleadoDTO
} from '../../../core/models/venta/empleado/venta-empleado.model';

interface ModuloEmpleado {
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
  ruta: string[];
  disponible: boolean;
}

interface UsuarioEmpleadoSesion {
  usuarioId: number | null;
  username: string | null;
  nombre: string | null;
  rol: string | null;
  empresaId: number | null;
  sucursalId: number | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  sucursalId!: number;
  empresaId!: number;

  usuarioActual!: UsuarioEmpleadoSesion;

  modulos: ModuloEmpleado[] = [];

  mensajeError = '';

  ventasSucursal: VentaHistorialEmpleadoDTO[] = [];
  ventasHoy: VentaHistorialEmpleadoDTO[] = [];

  cargandoMetricas = false;

  totalVendidoHoy = 0;
  cantidadVentasHoy = 0;
  ventasActivasHoy = 0;
  ventasCanceladasHoy = 0;
  ventasDevueltasHoy = 0;

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

    this.inicializarModulos();
    this.cargarMetricasDashboard();
  }

  private validarAccesoEmpleado(): boolean {

    this.mensajeError = '';

    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return false;
    }

    const usuarioId = this.authService.obtenerUsuarioId();
    const username = this.authService.obtenerUsername();
    const nombre = this.authService.obtenerNombre();
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
        'dashboard'
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
        'dashboard'
      ]);

      return false;
    }

    if (sucursalIdRuta !== sucursalIdUsuario) {
      this.router.navigate([
        '/empleado',
        'sucursal',
        sucursalIdUsuario,
        'dashboard'
      ]);

      return false;
    }

    this.empresaId = empresaIdUsuario;
    this.sucursalId = sucursalIdUsuario;

    this.usuarioActual = {
      usuarioId,
      username,
      nombre,
      rol,
      empresaId: empresaIdUsuario,
      sucursalId: sucursalIdUsuario
    };

    return true;
  }

  private obtenerSucursalIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('sucursalId') ??
      null
    );
  }

  private inicializarModulos(): void {

    this.modulos = [
      {
        titulo: 'Ventas',
        descripcion: 'Generar ventas, consultar facturas y gestionar devoluciones.',
        icono: 'bi bi-cart-check',
        color: 'modulo-ventas',
        ruta: [
          '/empleado',
          'sucursal',
          String(this.sucursalId),
          'ventas',
          'panel'
        ],
        disponible: true
      },
      {
        titulo: 'Inventario',
        descripcion: 'Consultar productos disponibles, stock actual y precios de venta.',
        icono: 'bi bi-box-seam',
        color: 'modulo-inventario',
        ruta: [
          '/empleado',
          'sucursal',
          String(this.sucursalId),
          'inventario',
          'panel'
        ],
        disponible: true
      },
      {
        titulo: 'Clientes',
        descripcion: 'Buscar, crear y gestionar clientes de la empresa.',
        icono: 'bi bi-people',
        color: 'modulo-clientes',
        ruta: [
          '/empleado',
          'sucursal',
          String(this.sucursalId),
          'clientes',
          'panel'
        ],
        disponible: true
      }
    ];
  }

  cargarMetricasDashboard(): void {

    this.cargandoMetricas = true;
    this.mensajeError = '';

    this.empleadoVentaService.listarPorSucursal(this.sucursalId)
      .subscribe({
        next: (ventas) => {
          this.ventasSucursal = ventas || [];

          this.calcularMetricasDelDia();

          this.cargandoMetricas = false;
        },
        error: (error) => {
          this.cargandoMetricas = false;

          this.mensajeError =
            error?.error?.message ||
            error?.error ||
            'No se pudieron cargar las métricas del dashboard.';
        }
      });
  }

  private calcularMetricasDelDia(): void {

    const hoy = this.obtenerFechaLocalFormato(new Date());

    this.ventasHoy = this.ventasSucursal.filter(venta => {
      const fechaVenta = this.obtenerFechaLocalFormato(
        new Date(venta.fechaVenta)
      );

      return fechaVenta === hoy;
    });

    this.cantidadVentasHoy = this.ventasHoy.length;

    this.totalVendidoHoy = this.ventasHoy
      .filter(venta => venta.estado !== 'CANCELADA')
      .reduce(
        (total, venta) => total + (Number(venta.total) || 0),
        0
      );

    this.ventasActivasHoy = this.ventasHoy.filter(
      venta => venta.estado === 'ACTIVA'
    ).length;

    this.ventasCanceladasHoy = this.ventasHoy.filter(
      venta => venta.estado === 'CANCELADA'
    ).length;

    this.ventasDevueltasHoy = this.ventasHoy.filter(
      venta =>
        venta.estado === 'DEVUELTA_PARCIAL' ||
        venta.estado === 'DEVUELTA_TOTAL'
    ).length;
  }

  private obtenerFechaLocalFormato(fecha: Date): string {

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  navegarModulo(modulo: ModuloEmpleado): void {

    if (!modulo.disponible) {
      return;
    }

    this.router.navigate(modulo.ruta);
  }

  irCrearVenta(): void {

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

  irInventarioActual(): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'inventario',
      'actual'
    ]);
  }
}
