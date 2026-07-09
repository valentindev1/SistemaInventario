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

  formulario!: FormGroup;

  guardando = false;

  mensajeError = '';
  mensajeExito = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private clienteService: ClienteService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.route.snapshot.paramMap.get('empresaId');
    const sucursalIdParam = this.route.snapshot.paramMap.get('sucursalId');

    if (!empresaIdParam || !sucursalIdParam) {
      this.mensajeError = 'Parámetros no válidos';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);

    this.inicializarFormulario();
  }

  inicializarFormulario(): void {
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
      telefono: this.normalizarOpcional(this.formulario.value.telefono),

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
    this.router.navigate([
      '/super-admin/empresas',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'clientes',
      'panel'
    ]);
  }

  campoInvalido(campo: string): boolean {
    const control = this.formulario.get(campo);

    return !!control && control.invalid && (control.touched || control.dirty);
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

    return 'No se pudo crear el cliente.';
  }
}
