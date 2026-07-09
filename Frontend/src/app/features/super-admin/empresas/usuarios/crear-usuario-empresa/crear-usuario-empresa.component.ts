import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EmpresaService } from '../../../../../core/services/empresa/empresa.service';
import { UsuarioService } from '../../../../../core/services/usuario/usuario.service';

import { EmpresaObtenerDTO } from '../../../../../core/models/empresa/empresa.model';
import { UsuarioCrearDTO } from '../../../../../core/models/usuario/usuario.model';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-crear-usuario-empresa',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './crear-usuario-empresa.component.html',
  styleUrl: './crear-usuario-empresa.component.css'
})
export class CrearUsuarioEmpresaComponent implements OnInit {

  empresaId!: number;
  empresa: EmpresaObtenerDTO | null = null;

  formularioAdministrador: FormGroup;

  cargandoEmpresa = false;
  verificandoUsuarios = false;
  guardando = false;

  tieneUsuarios = false;

  mensajeExito = '';
  mensajeError = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private empresaService: EmpresaService,
    private usuarioService: UsuarioService
  ) {
    this.formularioAdministrador = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      username: ['', [Validators.required, Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('empresaId');

    if (!idParam) {
      this.mensajeError = 'ID de empresa no válido';
      return;
    }

    this.empresaId = Number(idParam);

    this.cargarEmpresa();
    this.verificarSiEmpresaTieneUsuarios();
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

  verificarSiEmpresaTieneUsuarios(): void {
    this.verificandoUsuarios = true;
    this.mensajeError = '';

    this.usuarioService.empresaTieneUsuarios(this.empresaId).subscribe({
      next: (respuesta) => {
        this.tieneUsuarios = respuesta;
        this.verificandoUsuarios = false;
      },
      error: (error) => {
        this.verificandoUsuarios = false;
        this.mensajeError = 'No se pudo verificar si la empresa tiene usuarios';
        console.error(error);
      }
    });
  }


  private obtenerMensajeError(error: any): string {
    if (typeof error.error === 'string') {
      return error.error;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.error?.error) {
      return error.error.error;
    }

    return 'Ocurrió un error inesperado';
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

  crearAdministrador(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (this.formularioAdministrador.invalid) {
      this.formularioAdministrador.markAllAsTouched();
      return;
    }

    const dto: UsuarioCrearDTO = {
      nombre: this.formularioAdministrador.value.nombre,
      username: this.formularioAdministrador.value.username,
      password: this.formularioAdministrador.value.password,
      rol: 'ADMIN',
      empresaId: this.empresaId,
      sucursalId: null
    };

    this.guardando = true;

    this.usuarioService.crear(dto).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = 'Administrador creado correctamente';

        setTimeout(() => {
          this.router.navigate(['/super-admin/empresas/detalle', this.empresaId]);
        }, 800);
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

  campoInvalido(campo: string): boolean {
    const control = this.formularioAdministrador.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}
