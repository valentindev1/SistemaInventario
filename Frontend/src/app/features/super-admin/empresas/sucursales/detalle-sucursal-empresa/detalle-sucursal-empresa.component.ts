import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EmpresaService } from '../../../../../core/services/empresa/empresa.service';
import { SucursalService } from '../../../../../core/services/sucursal/sucursal.service';
import { UsuarioService } from '../../../../../core/services/usuario/usuario.service';
import { AuthService } from '../../../../../core/services/auth/auth.service';

import { EmpresaObtenerDTO } from '../../../../../core/models/empresa/empresa.model';
import { SucursalObtenerDTO } from '../../../../../core/models/sucursal/sucursal.model';
import { UsuarioObtenerDTO } from '../../../../../core/models/usuario/usuario.model';

@Component({
  selector: 'app-detalle-sucursal-empresa',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './detalle-sucursal-empresa.component.html',
  styleUrl: './detalle-sucursal-empresa.component.css'
})
export class DetalleSucursalEmpresaComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  empresa: EmpresaObtenerDTO | null = null;
  sucursal: SucursalObtenerDTO | null = null;
  empleados: UsuarioObtenerDTO[] = [];

  cargandoEmpresa = false;
  cargandoSucursal = false;
  cargandoEmpleados = false;

  mensajeError = '';
  mensajeExito = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private empresaService: EmpresaService,
    private sucursalService: SucursalService,
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.obtenerEmpresaIdDesdeRuta();
    const sucursalIdParam = this.obtenerSucursalIdDesdeRuta();

    if (!empresaIdParam || !sucursalIdParam) {
      this.mensajeError = 'Parámetros no válidos';
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
      this.mensajeError = 'Parámetros no válidos';
      return;
    }

    this.validarAccesoLocal();

    this.cargarEmpresa();
    this.cargarSucursal();
    this.cargarEmpleados();
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

  private validarAccesoLocal(): void {
    const rol = this.authService.obtenerRol();
    const empresaIdUsuario = this.authService.obtenerEmpresaId();

    if (rol === 'SUPER_ADMIN') {
      return;
    }

    if (rol === 'ADMIN' && empresaIdUsuario === this.empresaId) {
      return;
    }

    this.router.navigate(['/acceso-denegado']);
  }

  esSuperAdmin(): boolean {
    return this.authService.obtenerRol() === 'SUPER_ADMIN';
  }

  esAdmin(): boolean {
    return this.authService.obtenerRol() === 'ADMIN';
  }

  rutaDetalleEmpresa(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas/detalle',
        this.empresaId
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'dashboard'
    ];
  }

  rutaEditarSucursal(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        'editar',
        this.sucursalId
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      'editar',
      this.sucursalId
    ];
  }

  rutaCrearEmpleado(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'usuarios',
        'crear'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'usuarios',
      'crear'
    ];
  }

  rutaInventario(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'inventario',
        'panel'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'inventario',
      'panel'
    ];
  }

  rutaVentas(): any[] {
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

  rutaClientes(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'clientes',
        'panel'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'clientes',
      'panel'
    ];
  }

  rutaReportesContables(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'reportes-contables'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'reportes-contables'
    ];
  }

  rutaMovimientosTienda(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'movimientos'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'movimientos'
    ];
  }

  rutaComprasVarias(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'compras-varias'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'compras-varias'
    ];
  }

  cargarEmpresa(): void {
    this.cargandoEmpresa = true;
    this.mensajeError = '';

    this.empresaService.obtenerPorId(this.empresaId).subscribe({
      next: (empresa) => {
        this.empresa = empresa;
        this.cargandoEmpresa = false;
      },
      error: (error) => {
        this.cargandoEmpresa = false;
        this.mensajeError = 'No se pudo cargar la empresa';
        console.error(error);
      }
    });
  }

  cargarSucursal(): void {
    this.cargandoSucursal = true;
    this.mensajeError = '';

    this.sucursalService.obtenerPorId(this.sucursalId).subscribe({
      next: (sucursal) => {
        this.sucursal = sucursal;
        this.cargandoSucursal = false;

        this.validarSucursalPerteneceAEmpresa(sucursal);
      },
      error: (error) => {
        this.cargandoSucursal = false;
        this.mensajeError = 'No se pudo cargar la sucursal';
        console.error(error);
      }
    });
  }

  private validarSucursalPerteneceAEmpresa(sucursal: any): void {
    const rol = this.authService.obtenerRol();

    if (rol === 'SUPER_ADMIN') {
      return;
    }

    const empresaIdSucursal =
      sucursal.empresaId ??
      sucursal.empresa?.id ??
      null;

    if (!empresaIdSucursal) {
      return;
    }

    if (Number(empresaIdSucursal) !== this.empresaId) {
      this.router.navigate(['/acceso-denegado']);
    }
  }

  cargarEmpleados(): void {
    this.cargandoEmpleados = true;
    this.mensajeError = '';

    this.usuarioService.listarPorSucursal(this.sucursalId).subscribe({
      next: (usuarios) => {
        this.empleados = usuarios;
        this.cargandoEmpleados = false;
      },
      error: (error) => {
        this.cargandoEmpleados = false;
        this.mensajeError = 'No se pudieron cargar los empleados de la sucursal';
        console.error(error);
      }
    });
  }

  eliminarEmpleado(usuarioId: number): void {
    const confirmar = confirm('¿Estás seguro de eliminar este empleado?');

    if (!confirmar) {
      return;
    }

    this.mensajeError = '';
    this.mensajeExito = '';

    this.usuarioService.eliminar(usuarioId).subscribe({
      next: () => {
        this.empleados = this.empleados.filter(
          empleado => empleado.id !== usuarioId
        );

        this.mensajeExito = 'Empleado eliminado correctamente';
      },
      error: (error) => {
        this.mensajeError = 'No se pudo eliminar el empleado';
        console.error(error);
      }
    });
  }
}
