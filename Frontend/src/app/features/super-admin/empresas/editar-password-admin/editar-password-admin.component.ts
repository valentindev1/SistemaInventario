import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { UsuarioService } from '../../../../core/services/usuario/usuario.service';

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
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.route.snapshot.paramMap.get('empresaId');
    const usuarioIdParam = this.route.snapshot.paramMap.get('usuarioId');

    if (!empresaIdParam || !usuarioIdParam) {
      this.mensajeError = 'No se recibió la información necesaria para editar el usuario.';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.usuarioId = Number(usuarioIdParam);

    if (isNaN(this.empresaId) || isNaN(this.usuarioId)) {
      this.mensajeError = 'Los identificadores recibidos no son válidos.';
      return;
    }

    this.cargarUsuario();
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
        }
      },
      error: (error) => {
        console.error(error);
        this.cargando = false;
        this.mensajeError = 'No se pudo cargar la información del usuario.';
      }
    });
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
        this.mensajeError = 'No se pudo actualizar la contraseña.';
      }
    });
  }

  volverADetalleEmpresa(): void {
    this.router.navigate([
      '/super-admin/empresas/detalle',
      this.empresaId
    ]);
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

}
