import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

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

  opciones: OpcionVentasEmpleado[] = [];

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
