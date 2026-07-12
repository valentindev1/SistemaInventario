import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { UsuarioService } from '../../../../core/services/usuario/usuario.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

import {
  RolUsuario,
  UsuarioEditarDTO,
  UsuarioObtenerDTO
} from '../../../../core/models/usuario/usuario.model';

@Component({
  selector: 'app-editar-password-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './editar-password-admin.component.html',
  styleUrls: ['./editar-password-admin.component.css']
})
export class EditarPasswordAdminComponent implements OnInit {

  empresaId!: number;
  usuarioId!: number;

  usuario: UsuarioObtenerDTO | null = null;

  nuevaPassword = '';
  confirmarPassword = '';

  cargando = false;
  guardando = false;

  mensajeError = '';
  mensajeExito = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.obtenerEmpresaIdDesdeRuta();
    const usuarioIdParam = this.obtenerUsuarioIdDesdeRuta();

    if (!empresaIdParam || !usuarioIdParam) {
      this.mensajeError = 'No se recibió la información necesaria para editar el usuario.';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.usuarioId = Number(usuarioIdParam);

    if (
      Number.isNaN(this.empresaId) ||
      Number.isNaN(this.usuarioId) ||
      this.empresaId <= 0 ||
      this.usuarioId <= 0
    ) {
      this.mensajeError = 'Los identificadores recibidos no son válidos.';
      return;
    }

    if (!this.validarAccesoLocal()) {
      return;
    }

    this.cargarUsuario();
  }

  private obtenerEmpresaIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('empresaId') ??
      null
    );
  }

  private obtenerUsuarioIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('usuarioId') ??
      this.route.parent?.snapshot.paramMap.get('usuarioId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('usuarioId') ??
      null
    );
  }

  private obtenerRolNormalizado(): string | null {
    const rol = this.authService.obtenerRol();

    if (!rol) {
      return null;
    }

    return rol.replace('ROLE_', '');
  }

  private validarAccesoLocal(): boolean {
    const rol = this.obtenerRolNormalizado();
    const empresaIdUsuario = this.authService.obtenerEmpresaId();

    if (rol === 'SUPER_ADMIN') {
      return true;
    }

    if (rol === 'ADMIN' && empresaIdUsuario === this.empresaId) {
      return true;
    }

    this.router.navigate(['/acceso-denegado']);
    return false;
  }

  esSuperAdmin(): boolean {
    return this.obtenerRolNormalizado() === 'SUPER_ADMIN';
  }

  esAdmin(): boolean {
    return this.obtenerRolNormalizado() === 'ADMIN';
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

  cargarUsuario(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.usuarioService.obtenerPorId(this.usuarioId).subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.cargando = false;

        if (usuario.rol !== 'ADMIN') {
          this.mensajeError = 'Solo se permite cambiar la contraseña de usuarios administradores.';
          return;
        }

        this.validarUsuarioPerteneceAEmpresa(usuario);
      },
      error: (error) => {
        console.error(error);
        this.cargando = false;
        this.mensajeError = 'No se pudo cargar la información del usuario.';
      }
    });
  }

  private validarUsuarioPerteneceAEmpresa(usuario: any): void {
    const empresaIdUsuarioEditado =
      usuario.empresaId ??
      usuario.empresa?.id ??
      null;

    if (!empresaIdUsuarioEditado) {
      return;
    }

    if (Number(empresaIdUsuarioEditado) !== this.empresaId) {
      this.usuario = null;
      this.mensajeError = 'El usuario administrador no pertenece a la empresa seleccionada.';
      this.router.navigate(['/acceso-denegado']);
    }
  }

  guardarPassword(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.usuario) {
      this.mensajeError = 'No hay usuario cargado.';
      return;
    }

    if (this.usuario.rol !== 'ADMIN') {
      this.mensajeError = 'Solo se permite cambiar la contraseña de administradores.';
      return;
    }

    if (!this.validarAccesoLocal()) {
      return;
    }

    if (!this.nuevaPassword || this.nuevaPassword.trim().length < 4) {
      this.mensajeError = 'La contraseña debe tener mínimo 4 caracteres.';
      return;
    }

    if (!this.confirmarPassword || this.confirmarPassword.trim().length < 4) {
      this.mensajeError = 'Debe confirmar la contraseña.';
      return;
    }

    if (this.nuevaPassword !== this.confirmarPassword) {
      this.mensajeError = 'Las contraseñas no coinciden.';
      return;
    }

    const dto: UsuarioEditarDTO = {
      nombre: this.usuario.nombre,
      password: this.nuevaPassword,
      rol: this.usuario.rol as RolUsuario
    };

    this.guardando = true;

    this.usuarioService.editar(this.usuario.id, dto).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = 'Contraseña actualizada correctamente.';

        setTimeout(() => {
          this.volverADetalleEmpresa();
        }, 800);
      },
      error: (error) => {
        console.error(error);
        this.guardando = false;
        this.mensajeError = this.obtenerMensajeError(error);
      }
    });
  }

  volverADetalleEmpresa(): void {
    this.router.navigate(this.rutaDetalleEmpresa());
  }

  obtenerInicialUsuario(): string {
    if (!this.usuario || !this.usuario.nombre) {
      return 'U';
    }

    return this.usuario.nombre.charAt(0).toUpperCase();
  }

  obtenerNombreUsuario(): string {
    return this.usuario?.nombre || '';
  }

  obtenerUsernameUsuario(): string {
    return this.usuario?.username || '';
  }

  obtenerRolUsuario(): string {
    return this.usuario?.rol || '';
  }

  usuarioEsAdmin(): boolean {
    return this.usuario?.rol === 'ADMIN';
  }

  private obtenerMensajeError(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }

    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.error?.error) {
      return error.error.error;
    }

    return 'No se pudo actualizar la contraseña.';
  }
}
