import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth/auth.service';

interface OpcionVentasEmpleado {
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
  ruta: string[];
  disponible: boolean;
}

@Component({
  selector: 'app-panel-ventas-empleado',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './panel-ventas-empleado.component.html',
  styleUrl: './panel-ventas-empleado.component.css'
})
export class PanelVentasEmpleadoComponent implements OnInit {

  sucursalId!: number;
  empresaId!: number;

  opciones: OpcionVentasEmpleado[] = [];

  mensajeError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {

    const accesoValido = this.validarAccesoEmpleado();

    if (!accesoValido) {
      return;
    }

    this.inicializarOpciones();
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
        'panel'
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
        'panel'
      ]);

      return false;
    }

    if (sucursalIdRuta !== sucursalIdUsuario) {
      this.router.navigate([
        '/empleado',
        'sucursal',
        sucursalIdUsuario,
        'ventas',
        'panel'
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

  private inicializarOpciones(): void {

    this.opciones = [
      {
        titulo: 'Crear venta',
        descripcion: 'Selecciona cliente, agrega productos y registra una nueva venta.',
        icono: 'bi bi-cart-plus',
        color: 'opcion-crear',
        ruta: [
          '/empleado',
          'sucursal',
          String(this.sucursalId),
          'ventas',
          'generar'
        ],
        disponible: true
      },
      {
        titulo: 'Generar devolución',
        descripcion: 'Busca una factura y registra devolución parcial o total.',
        icono: 'bi bi-arrow-counterclockwise',
        color: 'opcion-devolucion',
        ruta: [
          '/empleado',
          'sucursal',
          String(this.sucursalId),
          'ventas',
          'devolucion'
        ],
        disponible: true
      },
      {
        titulo: 'Ver facturas',
        descripcion: 'Consulta facturas por número, cliente o fecha.',
        icono: 'bi bi-receipt',
        color: 'opcion-facturas',
        ruta: [
          '/empleado',
          'sucursal',
          String(this.sucursalId),
          'ventas',
          'facturas'
        ],
        disponible: true
      },
      {
        titulo: 'Ver histórico de ventas',
        descripcion: 'Revisa el historial de ventas realizadas en la sucursal.',
        icono: 'bi bi-clock-history',
        color: 'opcion-historico',
        ruta: [
          '/empleado',
          'sucursal',
          String(this.sucursalId),
          'ventas',
          'historico'
        ],
        disponible: true
      }
    ];
  }

  navegar(opcion: OpcionVentasEmpleado): void {

    if (!opcion.disponible) {
      return;
    }

    this.router.navigate(opcion.ruta);
  }

  volverDashboard(): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'dashboard'
    ]);
  }
}
