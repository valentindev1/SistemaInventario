import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, RouterLink} from '@angular/router';

import Swal from 'sweetalert2';

import {EmpresaService} from '../../../../../../core/services/empresa/empresa.service';
import {SucursalService} from '../../../../../../core/services/sucursal/sucursal.service';
import {UsuarioService} from '../../../../../../core/services/usuario/usuario.service';

import {EmpresaObtenerDTO} from '../../../../../../core/models/empresa/empresa.model';
import {SucursalObtenerDTO} from '../../../../../../core/models/sucursal/sucursal.model';
import {
  UsuarioCrearDTO,
  UsuarioObtenerDTO
} from '../../../../../../core/models/usuario/usuario.model';
import {AuthTemporalService} from '../../../../../../core/services/auth/auth-temporal.service';

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

  mensajeError = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private empresaService: EmpresaService,
    private sucursalService: SucursalService,
    private usuarioService: UsuarioService, public authTemporalService: AuthTemporalService
  ) {
    this.formularioEmpleado = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      username: ['', [Validators.required, Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    const empresaIdParam = this.route.snapshot.paramMap.get('empresaId');
    const sucursalIdParam = this.route.snapshot.paramMap.get('sucursalId');

    if (!empresaIdParam || !sucursalIdParam) {
      this.mensajeError = 'Parámetros no válidos';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);

    this.cargarEmpresa();
    this.cargarSucursal();
    this.cargarUsuariosContexto();
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
        this.mostrarErroresBackend(error, 'No se pudo cargar la empresa');
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
        this.mostrarErroresBackend(error, 'No se pudo cargar la sucursal');
        console.error(error);
      }
    });
  }

  cargarUsuariosContexto(): void {
    this.cargandoUsuarios = true;
    this.mensajeError = '';

    this.usuarioService.listarPorEmpresaSeleccionada(this.empresaId).subscribe({
      next: (usuarios) => {
        this.usuariosContexto = usuarios
          .filter(usuario =>
            usuario.rol === 'ADMIN' ||
            (usuario.rol === 'EMPLEADO' && usuario.sucursalId === this.sucursalId)
          )
          .sort((a, b) => {
            const ordenRol: Record<string, number> = {
              ADMIN: 1,
              EMPLEADO: 2
            };

            return (ordenRol[a.rol] || 99) - (ordenRol[b.rol] || 99);
          });

        this.cargandoUsuarios = false;
      },
      error: (error) => {
        this.cargandoUsuarios = false;
        this.mostrarErroresBackend(error, 'No se pudieron cargar los usuarios');
        console.error(error);
      }
    });
  }

  crearEmpleado(): void {
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
      nombre: this.formularioEmpleado.value.nombre,
      username: this.formularioEmpleado.value.username,
      password: this.formularioEmpleado.value.password,
      rol: 'EMPLEADO',
      empresaId: this.empresaId,
      sucursalId: this.sucursalId
    };

    this.guardando = true;

    this.usuarioService.crear(dto).subscribe({
      next: () => {
        this.guardando = false;

        Swal.fire({
          icon: 'success',
          title: 'Empleado creado',
          text: 'El empleado fue creado correctamente.',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#0d6efd'
        }).then(() => {
          this.formularioEmpleado.reset();
          this.cargarUsuariosContexto();
        });
      },
      error: (error) => {
        this.guardando = false;
        this.mostrarErroresBackend(error, 'No se pudo crear el empleado');
        console.error(error);
      }
    });
  }

  eliminarUsuario(usuario: UsuarioObtenerDTO): void {
    if (!this.puedeEliminarUsuario(usuario)) {
      Swal.fire({
        icon: 'warning',
        title: 'Acción no permitida',
        text: 'No tienes permisos para eliminar este usuario.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ffc107'
      });

      return;
    }

    const textoRol = usuario.rol === 'ADMIN' ? 'administrador' : 'empleado';

    Swal.fire({
      icon: 'warning',
      title: `¿Eliminar ${textoRol}?`,
      text: `Se eliminará el usuario ${usuario.username}`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService.eliminar(usuario.id).subscribe({
          next: () => {
            this.usuariosContexto = this.usuariosContexto.filter(item => item.id !== usuario.id);

            Swal.fire({
              icon: 'success',
              title: 'Usuario eliminado',
              text: 'El usuario fue eliminado correctamente.',
              confirmButtonText: 'Continuar',
              confirmButtonColor: '#0d6efd'
            });
          },
          error: (error) => {
            this.mostrarErroresBackend(error, 'No se pudo eliminar el usuario');
            console.error(error);
          }
        });
      }
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.formularioEmpleado.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  puedeEliminarUsuario(usuario: UsuarioObtenerDTO): boolean {
    if (usuario.rol === 'EMPLEADO') {
      return true;
    }

    if (usuario.rol === 'ADMIN' && this.authTemporalService.esSuperAdmin()) {
      return true;
    }

    return false;
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
