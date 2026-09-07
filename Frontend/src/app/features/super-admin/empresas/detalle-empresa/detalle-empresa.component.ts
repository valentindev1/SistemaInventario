import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EmpresaService } from '../../../../core/services/empresa/empresa.service';
import { UsuarioService } from '../../../../core/services/usuario/usuario.service';
import { SucursalService } from '../../../../core/services/sucursal/sucursal.service';

import { EmpresaObtenerDTO } from '../../../../core/models/empresa/empresa.model';
import { UsuarioObtenerDTO } from '../../../../core/models/usuario/usuario.model';
import { SucursalObtenerDTO } from '../../../../core/models/sucursal/sucursal.model';

import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-detalle-empresa',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './detalle-empresa.component.html',
  styleUrl: './detalle-empresa.component.css'
})
export class DetalleEmpresaComponent implements OnInit {

  empresaId!: number;

  empresa: EmpresaObtenerDTO | null = null;
  usuarios: UsuarioObtenerDTO[] = [];
  sucursales: SucursalObtenerDTO[] = [];

  cargandoEmpresa = false;
  cargandoUsuarios = false;
  cargandoSucursales = false;

  mensajeError = '';

  constructor(
    private route: ActivatedRoute,
    private empresaService: EmpresaService,
    private usuarioService: UsuarioService,
    private sucursalService: SucursalService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const idParam = this.obtenerEmpresaIdDesdeRuta();

    if (!idParam) {
      this.mensajeError = 'ID de empresa no válido';
      return;
    }

    this.empresaId = Number(idParam);

    if (Number.isNaN(this.empresaId)) {
      this.mensajeError = 'ID de empresa no válido';
      return;
    }

    this.cargarEmpresa();
    this.cargarUsuarios();
  }

  private obtenerEmpresaIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('id') ??
      this.route.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.snapshot.paramMap.get('id') ??
      this.route.parent?.snapshot.paramMap.get('empresaId') ??
      null
    );
  }

  cargarEmpresa(): void {
    this.cargandoEmpresa = true;
    this.mensajeError = '';

    this.empresaService.obtenerPorId(this.empresaId).subscribe({
      next: (empresa) => {
        this.empresa = empresa;
        this.cargandoEmpresa = false;

        this.cargarSucursales(empresa.nit);
      },
      error: (error) => {
        this.cargandoEmpresa = false;
        this.mensajeError = 'No se pudo cargar la empresa';
        console.error(error);
      }
    });
  }

  cargarUsuarios(): void {
    this.cargandoUsuarios = true;
    this.mensajeError = '';

    this.usuarioService.listarPorEmpresaSeleccionada(this.empresaId).subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.cargandoUsuarios = false;
      },
      error: (error) => {
        this.cargandoUsuarios = false;
        this.mensajeError = 'No se pudieron cargar los usuarios de la empresa';
        console.error(error);
      }
    });
  }

  cargarSucursales(empresaNit: string): void {
    this.cargandoSucursales = true;
    this.mensajeError = '';

    this.sucursalService.listarPorEmpresaNit(empresaNit).subscribe({
      next: (sucursales) => {
        this.sucursales = sucursales;
        this.cargandoSucursales = false;
      },
      error: (error) => {
        this.cargandoSucursales = false;
        this.mensajeError = 'No se pudieron cargar las sucursales de la empresa';
        console.error(error);
      }
    });
  }

  esSuperAdmin(): boolean {
    return this.authService.obtenerRol() === 'SUPER_ADMIN';
  }

  esAdmin(): boolean {
    return this.authService.obtenerRol() === 'ADMIN';
  }

  rutaDashboardEmpresa(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'dashboard'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'dashboard',
      'estadisticas'
    ];
  }

  rutaInformes(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'informes'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'informes'
    ];
  }

  rutaMovimientosEmpresa(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'movimientos'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'movimientos'
    ];
  }

  rutaEditarEmpresa(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas/editar',
        this.empresaId
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'editar'
    ];
  }

  rutaCrearAdministrador(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'usuarios',
        'crear'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'usuarios',
      'crear'
    ];
  }

  rutaCrearSucursal(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        'crear'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      'crear'
    ];
  }

  rutaProductos(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'productos'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'productos'
    ];
  }

  rutaDetalleSucursal(sucursalId: number): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        'detalle',
        sucursalId
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      'detalle',
      sucursalId
    ];
  }

  rutaEditarPasswordAdmin(usuarioId: number): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'usuarios',
        usuarioId,
        'editar-password'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'usuarios',
      usuarioId,
      'editar-password'
    ];
  }

  irEditarPasswordAdmin(usuarioId: number): void {
    this.router.navigate(
      this.rutaEditarPasswordAdmin(usuarioId)
    );
  }

  eliminarUsuario(usuarioId: number): void {
    const confirmar = confirm('¿Estás seguro de eliminar este usuario?');

    if (!confirmar) {
      return;
    }

    this.usuarioService.eliminar(usuarioId).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(
          usuario => usuario.id !== usuarioId
        );
      },
      error: (error) => {
        this.mensajeError = 'No se pudo eliminar el usuario';
        console.error(error);
      }
    });
  }
}
