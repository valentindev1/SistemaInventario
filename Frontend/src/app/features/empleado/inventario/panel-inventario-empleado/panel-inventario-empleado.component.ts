import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth/auth.service';

interface OpcionInventarioEmpleado {
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
  ruta: string[];
  disponible: boolean;
}

@Component({
  selector: 'app-panel-inventario-empleado',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './panel-inventario-empleado.component.html',
  styleUrl: './panel-inventario-empleado.component.css'
})
export class PanelInventarioEmpleadoComponent implements OnInit {

  sucursalId!: number;
  empresaId!: number;

  opciones: OpcionInventarioEmpleado[] = [];

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
        'inventario',
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
        'inventario',
        'panel'
      ]);

      return false;
    }

    if (sucursalIdRuta !== sucursalIdUsuario) {
      this.router.navigate([
        '/empleado',
        'sucursal',
        sucursalIdUsuario,
        'inventario',
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
        titulo: 'Inventario actual',
        descripcion: 'Consulta productos disponibles, precios y stock actual de la sucursal.',
        icono: 'bi bi-box-seam',
        color: 'opcion-actual',
        ruta: [
          '/empleado',
          'sucursal',
          String(this.sucursalId),
          'inventario',
          'actual'
        ],
        disponible: true
      },
      {
        titulo: 'Movimientos',
        descripcion: 'Consulta entradas, salidas, ventas, devoluciones y ajustes de inventario.',
        icono: 'bi bi-arrow-left-right',
        color: 'opcion-movimientos',
        ruta: [
          '/empleado',
          'sucursal',
          String(this.sucursalId),
          'inventario',
          'movimientos'
        ],
        disponible: true
      }
    ];
  }

  navegar(opcion: OpcionInventarioEmpleado): void {

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
