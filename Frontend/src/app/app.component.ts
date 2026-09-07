import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs';

import { EmpresaService } from './core/services/empresa/empresa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Inventario Vhela';

  private readonly nombreAplicacion = 'Inventario Vhela';
  private readonly nombresEmpresas = new Map<number, string>();

  constructor(
    private router: Router,
    private titleService: Title,
    private empresaService: EmpresaService
  ) {}

  ngOnInit(): void {
    this.actualizarTitulo(this.router.url);

    this.router.events
      .pipe(filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd))
      .subscribe(evento => this.actualizarTitulo(evento.urlAfterRedirects));
  }

  private actualizarTitulo(url: string): void {
    const urlSinParametros = url.split('?')[0].split('#')[0];
    const tituloPagina = this.obtenerNombrePagina(urlSinParametros);
    const empresaId = this.obtenerEmpresaId(urlSinParametros);

    this.titleService.setTitle(
      empresaId
        ? `${tituloPagina} · ${this.nombresEmpresas.get(empresaId) ?? 'Empresa'} | ${this.nombreAplicacion}`
        : `${tituloPagina} | ${this.nombreAplicacion}`
    );

    if (!empresaId || this.nombresEmpresas.has(empresaId)) {
      return;
    }

    this.empresaService.obtenerPorId(empresaId).subscribe({
      next: empresa => {
        this.nombresEmpresas.set(empresaId, empresa.nombre);

        if (this.obtenerEmpresaId(this.router.url) === empresaId) {
          this.titleService.setTitle(
            `${tituloPagina} · ${empresa.nombre} | ${this.nombreAplicacion}`
          );
        }
      },
      error: () => {
        // El título provisional "Empresa" ya permite identificar la pestaña.
      }
    });
  }

  private obtenerEmpresaId(url: string): number | null {
    const coincidencia = url.match(/\/(?:super-admin\/empresas|admin\/empresa)\/(\d+)(?:\/|$)/);

    if (!coincidencia) {
      return null;
    }

    const empresaId = Number(coincidencia[1]);
    return Number.isFinite(empresaId) ? empresaId : null;
  }

  private obtenerNombrePagina(url: string): string {
    const paginas: Array<[string, string]> = [
      ['/inventario/ajustar-precio', 'Ajustar precio'],
      ['/inventario/configurar-porcentajes', 'Configurar porcentajes'],
      ['/inventario/ingresar', 'Ingresar mercancía'],
      ['/inventario/ajustar', 'Ajustar inventario'],
      ['/inventario/resumen', 'Resumen de inventario'],
      ['/inventario/movimientos', 'Movimientos de inventario'],
      ['/inventario/panel', 'Inventario'],
      ['/inventario', 'Inventario'],
      ['/ventas/generar', 'Generar venta'],
      ['/ventas/consultar', 'Consultar factura'],
      ['/ventas/devolucion', 'Devoluciones'],
      ['/ventas/informe', 'Informe de ventas'],
      ['/informes', 'Informes'],
      ['/ventas/panel', 'Ventas'],
      ['/clientes/crear', 'Crear cliente'],
      ['/clientes/editar', 'Editar cliente'],
      ['/clientes/panel', 'Clientes'],
      ['/productos/detalles/categorias', 'Categorías'],
      ['/productos/detalles/colores', 'Colores'],
      ['/productos/detalles/generos', 'Géneros'],
      ['/productos/detalles/tallas', 'Tallas'],
      ['/productos/crear', 'Crear producto'],
      ['/productos', 'Productos'],
      ['/sucursales/detalle', 'Detalle de sucursal'],
      ['/sucursales/editar', 'Editar sucursal'],
      ['/sucursales/crear', 'Crear sucursal'],
      ['/usuarios/crear', 'Crear usuario'],
      ['/usuarios/', 'Usuarios'],
      ['/empresas/editar', 'Editar empresa'],
      ['/empresas/crear', 'Crear empresa'],
      ['/empresas/detalle', 'Detalle de empresa'],
      ['/empresas', 'Empresas'],
      ['/dashboard/estadisticas', 'Estadísticas'],
      ['/dashboard', 'Panel principal'],
      ['/empleado/', 'Panel de empleado'],
      ['/login', 'Iniciar sesión'],
      ['/acceso-denegado', 'Acceso denegado']
    ];

    const pagina = paginas.find(([fragmento]) => url.includes(fragmento));
    return pagina?.[1] ?? 'Inventario Vhela';
  }
}
