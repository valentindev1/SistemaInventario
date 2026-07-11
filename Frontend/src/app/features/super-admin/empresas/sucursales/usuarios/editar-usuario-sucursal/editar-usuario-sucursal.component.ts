import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import Swal from 'sweetalert2';

import { UsuarioService } from '../../../../../../core/services/usuario/usuario.service';

import {
  UsuarioObtenerDTO
} from '../../../../../../core/models/usuario/usuario.model';

@Component({
  selector: 'app-editar-usuario-sucursal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './editar-usuario-sucursal.component.html',
  styleUrl: './editar-usuario-sucursal.component.css'
})
export class EditarUsuarioSucursalComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;
  usuarioId!: number;

  usuario: UsuarioObtenerDTO | null = null;

  formularioUsuario!: FormGroup;

  cargando = false;
  guardando = false;

  mensajeError = '';
  mensajeExito = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.obtenerParametrosRuta();
  }

  inicializarFormulario(): void {
    this.formularioUsuario = this.fb.group({
      nombre: [{ value: '', disabled: true }],
      username: [{ value: '', disabled: true }],
      rol: [{ value: '', disabled: true }],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  obtenerParametrosRuta(): void {
    const empresaIdParam = this.route.snapshot.paramMap.get('empresaId');
    const sucursalIdParam = this.route.snapshot.paramMap.get('sucursalId');
    const usuarioIdParam = this.route.snapshot.paramMap.get('usuarioId');

    if (!empresaIdParam || !sucursalIdParam || !usuarioIdParam) {
      this.mensajeError = 'No se pudo identificar la empresa, la sucursal o el usuario.';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);
    this.usuarioId = Number(usuarioIdParam);

    if (!this.empresaId || !this.sucursalId || !this.usuarioId) {
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

        this.formularioUsuario.patchValue({
          nombre: usuario.nombre,
          username: usuario.username,
          rol: usuario.rol,
          password: '',
          confirmarPassword: ''
        });

        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.mostrarErroresBackend(error, 'No se pudo cargar el usuario');
        console.error(error);
      }
    });
  }

  guardarCambios(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.usuario) {
      this.mensajeError = 'No hay usuario cargado.';
      return;
    }

    if (this.formularioUsuario.invalid) {
      this.formularioUsuario.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Formulario inválido',
        text: 'La contraseña es obligatoria y debe tener mínimo 6 caracteres.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0d6efd'
      });

      return;
    }

    const valores = this.formularioUsuario.getRawValue();

    if (valores.password !== valores.confirmarPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseñas diferentes',
        text: 'La nueva contraseña y la confirmación no coinciden.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0d6efd'
      });

      return;
    }

    this.guardando = true;

    this.usuarioService.cambiarPassword(
      this.usuarioId,
      valores.password.trim()
    ).subscribe({
      next: () => {
        this.guardando = false;

        Swal.fire({
          icon: 'success',
          title: 'Contraseña actualizada',
          text: 'La contraseña del usuario fue actualizada correctamente.',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#0d6efd'
        }).then(() => {
          this.volver();
        });
      },
      error: (error) => {
        this.guardando = false;
        this.mostrarErroresBackend(error, 'No se pudo actualizar la contraseña');
        console.error(error);
      }
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.formularioUsuario.get(campo);

    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched)
    );
  }

  volver(): void {
    this.router.navigate([
      '/super-admin/empresas',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'usuarios',
      'crear'
    ]);
  }

  private obtenerErroresBackend(error: any): string[] {
    if (Array.isArray(error.error?.errores)) {
      return error.error.errores;
    }

    if (typeof error.error === 'string') {
      return [error.error];
    }

    if (error.error?.message) {
      return [error.error.message];
    }

    if (error.error?.error) {
      return [error.error.error];
    }

    return ['Ocurrió un error inesperado'];
  }

  private mostrarErroresBackend(error: any, mensajeDefecto: string): void {
    const errores = this.obtenerErroresBackend(error);

    const erroresFinales = errores.length > 0
      ? errores
      : [mensajeDefecto];

    Swal.fire({
      icon: 'error',
      title: 'Error',
      html: `
        <ul style="text-align: left; margin-bottom: 0;">
          ${erroresFinales.map(e => `<li>${e}</li>`).join('')}
        </ul>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc3545'
    });
  }
}
