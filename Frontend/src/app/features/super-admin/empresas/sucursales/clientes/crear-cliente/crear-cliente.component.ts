import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { ClienteService } from '../../../../../../core/services/cliente/cliente.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';

import { ClienteCrearDTO } from '../../../../../../core/models/cliente/cliente.model';

@Component({
  selector: 'app-crear-cliente',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './crear-cliente.component.html',
  styleUrl: './crear-cliente.component.css'
})
export class CrearClienteComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  formulario: FormGroup;

  guardando = false;

  mensajeError = '';
  mensajeExito = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private authService: AuthService
  ) {
    this.formulario = this.fb.group({
      numeroDocumento: [
        '',
        [
          Validators.required,
          Validators.maxLength(30),
          Validators.pattern(/^[0-9]+$/)
        ]
      ],
      nombre: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(150)
        ]
      ],
      correo: [
        '',
        [
          Validators.email,
          Validators.maxLength(150)
        ]
      ],
      telefono: [
        '',
        [
          Validators.maxLength(30)
        ]
      ]
    });
  }

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

    if (!this.validarAccesoLocal()) {
      return;
    }
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

  private validarAccesoLocal(): boolean {
    const rol = this.authService.obtenerRol();
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
    return this.authService.obtenerRol() === 'SUPER_ADMIN';
  }

  esAdmin(): boolean {
    return this.authService.obtenerRol() === 'ADMIN';
  }

  rutaPanelClientes(): any[] {
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

  guardar(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.mensajeError = 'Por favor verifica los campos del formulario.';
      return;
    }

    const dto: ClienteCrearDTO = {
      empresaId: this.empresaId,
      numeroDocumento: this.formulario.value.numeroDocumento.trim(),
      nombre: this.formulario.value.nombre.trim(),
      correo: this.normalizarOpcional(this.formulario.value.correo),
      telefono: this.normalizarOpcional(this.formulario.value.telefono)
    };

    this.guardando = true;

    this.clienteService.crear(dto).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = 'Cliente creado correctamente.';

        setTimeout(() => {
          this.volverPanelClientes();
        }, 800);
      },
      error: (error) => {
        this.guardando = false;
        this.mensajeError = this.obtenerMensajeError(error);
        console.error(error);
      }
    });
  }

  volverPanelClientes(): void {
    this.router.navigate(this.rutaPanelClientes());
  }

  campoInvalido(campo: string): boolean {
    const control = this.formulario.get(campo);

    return !!control && control.invalid && (control.touched || control.dirty);
  }

  tieneError(campo: string, error: string): boolean {
    return !!this.formulario.get(campo)?.errors?.[error];
  }

  private normalizarOpcional(valor: string | null | undefined): string | null {
    if (!valor || valor.trim() === '') {
      return null;
    }

    return valor.trim();
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

    return 'No se pudo crear el cliente.';
  }
}
