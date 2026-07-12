import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import Swal from 'sweetalert2';

import { EmpresaService } from '../../../../../../core/services/empresa/empresa.service';
import { SucursalService } from '../../../../../../core/services/sucursal/sucursal.service';
import { UsuarioService } from '../../../../../../core/services/usuario/usuario.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';

import { EmpresaObtenerDTO } from '../../../../../../core/models/empresa/empresa.model';
import { SucursalObtenerDTO } from '../../../../../../core/models/sucursal/sucursal.model';

import {
  UsuarioCrearDTO,
  UsuarioObtenerDTO
} from '../../../../../../core/models/usuario/usuario.model';
@Component({
  selector: 'app-crear-usuario-sucursal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './crear-usuario-sucursal.component.html',
  styleUrl: './crear-usuario-sucursal.component.css'
})
export class CrearUsuarioSucursalComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  empresa: EmpresaObtenerDTO | null = null;
  sucursal: SucursalObtenerDTO | null = null;

  usuariosContexto: UsuarioObtenerDTO[] = [];

  formularioEmpleado: FormGroup;

  cargandoEmpresa = false;
  cargandoSucursal = false;
  cargandoUsuarios = false;

  guardando = false;
  cambiandoPassword = false;
  eliminando = false;

  mensajeExito = '';
  mensajeError = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private empresaService: EmpresaService,
    private sucursalService: SucursalService,
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {
    this.formularioEmpleado = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      username: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    const empresaIdParam = this.obtenerEmpresaIdDesdeRuta();
    const sucursalIdParam = this.obtenerSucursalIdDesdeRuta();

    if (!empresaIdParam || !sucursalIdParam) {
      this.mensajeError = 'ID de empresa o sucursal no válido';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);

    if (
      Number.isNaN(this.empresaId) ||
      Number.isNaN(this.sucursalId)
    ) {
      this.mensajeError = 'ID de empresa o sucursal no válido';
      return;
    }

    this.cargarEmpresa();
    this.cargarSucursal();
    this.cargarUsuarios();
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

  esSuperAdmin(): boolean {
    return this.authService.obtenerRol() === 'SUPER_ADMIN';
  }

  esAdmin(): boolean {
    return this.authService.obtenerRol() === 'ADMIN';
  }

  rutaDetalleSucursal(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        'detalle',
        this.sucursalId
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      'detalle',
      this.sucursalId
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
        this.mensajeError = 'No se pudo cargar la información de la empresa';
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
      },
      error: (error) => {
        this.cargandoSucursal = false;
        this.mensajeError = 'No se pudo cargar la información de la sucursal';
        console.error(error);
      }
    });
  }

  cargarUsuarios(): void {
    this.cargandoUsuarios = true;
    this.mensajeError = '';

    this.usuarioService.listarPorSucursal(this.sucursalId).subscribe({
      next: (usuarios) => {
        this.usuariosContexto = this.ordenarUsuarios(usuarios);
        this.cargandoUsuarios = false;
      },
      error: (error) => {
        this.cargandoUsuarios = false;
        this.mensajeError = 'No se pudieron cargar los usuarios de la sucursal';
        console.error(error);
      }
    });
  }

  private ordenarUsuarios(usuarios: UsuarioObtenerDTO[]): UsuarioObtenerDTO[] {
    return [...usuarios].sort((a, b) => {
      const prioridadRol = (rol: string): number => {
        if (rol === 'ADMIN') {
          return 1;
        }

        if (rol === 'EMPLEADO') {
          return 2;
        }

        if (rol === 'SUPER_ADMIN') {
          return 0;
        }

        return 3;
      };

      const prioridadA = prioridadRol(a.rol);
      const prioridadB = prioridadRol(b.rol);

      if (prioridadA !== prioridadB) {
        return prioridadA - prioridadB;
      }

      return a.nombre.localeCompare(b.nombre);
    });
  }

  crearEmpleado(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (this.formularioEmpleado.invalid) {
      this.formularioEmpleado.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Debes completar correctamente todos los campos obligatorios.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ffc107'
      });

      return;
    }

    const dto: UsuarioCrearDTO = {
      nombre: this.formularioEmpleado.value.nombre.trim(),
      username: this.formularioEmpleado.value.username.trim(),
      password: this.formularioEmpleado.value.password,
      rol: 'EMPLEADO',
      empresaId: this.empresaId,
      sucursalId: this.sucursalId
    };

    this.guardando = true;

    this.usuarioService.crear(dto).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = 'Empleado creado correctamente';

        this.formularioEmpleado.reset();

        Swal.fire({
          icon: 'success',
          title: 'Empleado creado',
          text: 'El usuario empleado fue creado correctamente.',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#0d6efd'
        });

        this.cargarUsuarios();
      },
      error: (error) => {
        this.guardando = false;

        const errores = this.obtenerErroresBackend(error);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          html: `
            <ul style="text-align: left; margin-bottom: 0;">
              ${errores.map(e => `<li>${e}</li>`).join('')}
            </ul>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#dc3545'
        });

        console.error(error);
      }
    });
  }

  abrirCambioPassword(usuario: UsuarioObtenerDTO): void {
    Swal.fire({
      title: 'Cambiar contraseña',
      html: `
        <div style="text-align: left;">
          <p style="margin-bottom: 8px;">
            Vas a cambiar la contraseña del usuario:
          </p>
          <strong>${usuario.nombre}</strong>
          <br>
          <small style="color: #6c757d;">${usuario.username}</small>
        </div>
      `,
      input: 'password',
      inputLabel: 'Nueva contraseña',
      inputPlaceholder: 'Mínimo 6 caracteres',
      inputAttributes: {
        autocapitalize: 'off',
        autocomplete: 'new-password'
      },
      showCancelButton: true,
      confirmButtonText: 'Guardar contraseña',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      inputValidator: (value) => {
        if (!value) {
          return 'La contraseña es obligatoria';
        }

        if (value.length < 6) {
          return 'La contraseña debe tener mínimo 6 caracteres';
        }

        return null;
      }
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.confirmarCambioPassword(
        usuario,
        result.value
      );
    });
  }

  private confirmarCambioPassword(
    usuario: UsuarioObtenerDTO,
    nuevaPassword: string
  ): void {
    Swal.fire({
      icon: 'question',
      title: 'Confirmar cambio',
      html: `
        <p>
          ¿Deseas cambiar la contraseña del usuario
          <strong>${usuario.username}</strong>?
        </p>
        <small style="color: #6c757d;">
          Recuerda compartirle la nueva contraseña al usuario.
        </small>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.cambiarPasswordUsuario(
        usuario.id,
        nuevaPassword
      );
    });
  }

  private cambiarPasswordUsuario(
    usuarioId: number,
    nuevaPassword: string
  ): void {
    this.cambiandoPassword = true;

    this.usuarioService.cambiarPassword(usuarioId, nuevaPassword).subscribe({
      next: () => {
        this.cambiandoPassword = false;

        Swal.fire({
          icon: 'success',
          title: 'Contraseña actualizada',
          text: 'La contraseña del usuario fue modificada correctamente.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#198754'
        });
      },
      error: (error) => {
        this.cambiandoPassword = false;

        const errores = this.obtenerErroresBackend(error);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          html: `
            <ul style="text-align: left; margin-bottom: 0;">
              ${errores.map(e => `<li>${e}</li>`).join('')}
            </ul>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#dc3545'
        });

        console.error(error);
      }
    });
  }

  puedeEliminarUsuario(usuario: UsuarioObtenerDTO): boolean {
    return usuario.rol === 'EMPLEADO';
  }

  eliminarUsuario(usuario: UsuarioObtenerDTO): void {
    Swal.fire({
      icon: 'warning',
      title: 'Eliminar usuario',
      html: `
        <p>
          ¿Deseas eliminar el usuario
          <strong>${usuario.username}</strong>?
        </p>
        <small style="color: #6c757d;">
          Esta acción no se puede deshacer.
        </small>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.eliminando = true;

      this.usuarioService.eliminar(usuario.id).subscribe({
        next: () => {
          this.eliminando = false;

          Swal.fire({
            icon: 'success',
            title: 'Usuario eliminado',
            text: 'El usuario fue eliminado correctamente.',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#198754'
          });

          this.cargarUsuarios();
        },
        error: (error) => {
          this.eliminando = false;

          const errores = this.obtenerErroresBackend(error);

          Swal.fire({
            icon: 'error',
            title: 'Error',
            html: `
              <ul style="text-align: left; margin-bottom: 0;">
                ${errores.map(e => `<li>${e}</li>`).join('')}
              </ul>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#dc3545'
          });

          console.error(error);
        }
      });
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.formularioEmpleado.get(campo);

    return !!control &&
      control.invalid &&
      (control.dirty || control.touched);
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
}
