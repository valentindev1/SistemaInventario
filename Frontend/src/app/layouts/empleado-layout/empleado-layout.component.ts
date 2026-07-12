import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route: string[];
}

interface MenuGroup {
  title: string;
  icon: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-empleado-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './empleado-layout.component.html',
  styleUrl: './empleado-layout.component.css'
})
export class EmpleadoLayoutComponent implements OnInit {

  sidebarCollapsed = false;
  sidebarMobileOpen = false;
  sidebarTemporal = false;

  sucursalId!: number;

  menuGroups: MenuGroup[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.obtenerSucursalIdDesdeRuta();
  }

  private obtenerSucursalIdDesdeRuta(): void {
    this.route.paramMap.subscribe(params => {
      const sucursalIdParam = params.get('sucursalId');

      if (!sucursalIdParam) {
        this.router.navigate(['/login']);
        return;
      }

      const sucursalIdNumber = Number(sucursalIdParam);

      if (Number.isNaN(sucursalIdNumber)) {
        this.router.navigate(['/login']);
        return;
      }

      this.sucursalId = sucursalIdNumber;
      this.crearMenu();
    });
  }

  private crearMenu(): void {
    this.menuGroups = [
      {
        title: 'Principal',
        icon: 'bi-speedometer2',
        items: [
          {
            label: 'Dashboard',
            icon: 'bi-speedometer2',
            route: [
              '/empleado/sucursal',
              this.sucursalId.toString(),
              'dashboard'
            ]
          }
        ]
      },
      {
        title: 'Ventas',
        icon: 'bi-cart-check',
        items: [
          {
            label: 'Panel de ventas',
            icon: 'bi-grid',
            route: [
              '/empleado/sucursal',
              this.sucursalId.toString(),
              'ventas',
              'panel'
            ]
          },
          {
            label: 'Generar venta',
            icon: 'bi-plus-circle',
            route: [
              '/empleado/sucursal',
              this.sucursalId.toString(),
              'ventas',
              'generar'
            ]
          },
          {
            label: 'Facturas',
            icon: 'bi-receipt',
            route: [
              '/empleado/sucursal',
              this.sucursalId.toString(),
              'ventas',
              'facturas'
            ]
          },
          {
            label: 'Devolución',
            icon: 'bi-arrow-counterclockwise',
            route: [
              '/empleado/sucursal',
              this.sucursalId.toString(),
              'ventas',
              'devolucion'
            ]
          },
          {
            label: 'Histórico',
            icon: 'bi-clock-history',
            route: [
              '/empleado/sucursal',
              this.sucursalId.toString(),
              'ventas',
              'historico'
            ]
          }
        ]
      },
      {
        title: 'Inventario',
        icon: 'bi-box-seam',
        items: [
          {
            label: 'Panel inventario',
            icon: 'bi-boxes',
            route: [
              '/empleado/sucursal',
              this.sucursalId.toString(),
              'inventario',
              'panel'
            ]
          },
          {
            label: 'Inventario actual',
            icon: 'bi-clipboard-data',
            route: [
              '/empleado/sucursal',
              this.sucursalId.toString(),
              'inventario',
              'actual'
            ]
          },
          {
            label: 'Movimientos',
            icon: 'bi-arrow-left-right',
            route: [
              '/empleado/sucursal',
              this.sucursalId.toString(),
              'inventario',
              'movimientos'
            ]
          }
        ]
      },
      {
        title: 'Clientes',
        icon: 'bi-people',
        items: [
          {
            label: 'Panel clientes',
            icon: 'bi-person-lines-fill',
            route: [
              '/empleado/sucursal',
              this.sucursalId.toString(),
              'clientes',
              'panel'
            ]
          }
        ]
      }
    ];
  }

  toggleSidebar(): void {
    if (window.innerWidth < 992) {
      this.sidebarMobileOpen = !this.sidebarMobileOpen;
      return;
    }

    this.sidebarCollapsed = !this.sidebarCollapsed;

    if (!this.sidebarCollapsed) {
      this.sidebarTemporal = false;
    }
  }

  abrirSidebarTemporal(): void {
    if (this.sidebarCollapsed && window.innerWidth >= 992) {
      this.sidebarTemporal = true;
    }
  }

  cerrarSidebarTemporal(): void {
    if (this.sidebarCollapsed && window.innerWidth >= 992) {
      this.sidebarTemporal = false;
    }
  }

  cerrarSidebarMobile(): void {
    this.sidebarMobileOpen = false;
  }

  get sidebarExpandida(): boolean {
    return !this.sidebarCollapsed || this.sidebarTemporal;
  }

  cerrarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('empresaId');
    localStorage.removeItem('sucursalId');

    this.router.navigate(['/login']);
  }
}
