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
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit {

  sidebarCollapsed = false;
  sidebarMobileOpen = false;
  sidebarTemporal = false;

  empresaId!: number;

  menuGroups: MenuGroup[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.obtenerEmpresaIdDesdeRuta();
  }

  private obtenerEmpresaIdDesdeRuta(): void {
    this.route.paramMap.subscribe(params => {
      const empresaIdParam = params.get('empresaId');

      if (!empresaIdParam) {
        this.router.navigate(['/login']);
        return;
      }

      const empresaIdNumber = Number(empresaIdParam);

      if (Number.isNaN(empresaIdNumber)) {
        this.router.navigate(['/login']);
        return;
      }

      this.empresaId = empresaIdNumber;
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
            label: 'Dashboard empresa',
            icon: 'bi-speedometer2',
            route: [
              '/admin/empresa',
              this.empresaId.toString(),
              'dashboard'
            ]
          },
          {
            label: 'Estadísticas',
            icon: 'bi-bar-chart-line',
            route: [
              '/admin/empresa',
              this.empresaId.toString(),
              'dashboard',
              'estadisticas'
            ]
          }
        ]
      },
      {
        title: 'Gestión',
        icon: 'bi-grid',
        items: [
          {
            label: 'Productos',
            icon: 'bi-tags',
            route: [
              '/admin/empresa',
              this.empresaId.toString(),
              'productos'
            ]
          },
          {
            label: 'Crear producto',
            icon: 'bi-plus-circle',
            route: [
              '/admin/empresa',
              this.empresaId.toString(),
              'productos',
              'crear'
            ]
          },
          {
            label: 'Crear sucursal',
            icon: 'bi-building-add',
            route: [
              '/admin/empresa',
              this.empresaId.toString(),
              'sucursales',
              'crear'
            ]
          },
          {
            label: 'Crear administrador',
            icon: 'bi-person-plus',
            route: [
              '/admin/empresa',
              this.empresaId.toString(),
              'usuarios',
              'crear'
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
    localStorage.removeItem('tipo');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('username');
    localStorage.removeItem('nombre');
    localStorage.removeItem('rol');
    localStorage.removeItem('empresaId');
    localStorage.removeItem('sucursalId');

    this.router.navigate(['/login']);
  }
}
