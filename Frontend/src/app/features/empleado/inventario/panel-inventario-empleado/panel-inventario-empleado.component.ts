import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

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

  opciones: OpcionInventarioEmpleado[] = [];

  mensajeError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
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

    this.inicializarOpciones();
  }

  private inicializarOpciones(): void {

    this.opciones = [
      {
        titulo: 'Ver inventario actual',
        descripcion: 'Consulta productos disponibles, stock actual, tallas, colores, categorías y precio de venta.',
        icono: 'bi bi-box-seam',
        color: 'opcion-inventario',
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
        titulo: 'Ver movimientos del inventario',
        descripcion: 'Consulta entradas, salidas, ventas, devoluciones y ajustes autorizados de la sucursal.',
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
