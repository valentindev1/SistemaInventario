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
import {
  ClienteEditarDTO,
  ClienteObtenerDTO
} from '../../../../../../core/models/cliente/cliente.model';

@Component({
  selector: 'app-editar-cliente',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './editar-cliente.component.html',
  styleUrl: './editar-cliente.component.css'
})
export class EditarClienteComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;
  clienteId!: number;

  cliente: ClienteObtenerDTO | null = null;

  formulario!: FormGroup;

  cargando = false;
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
    const clienteIdParam = this.route.snapshot.paramMap.get('clienteId');

    if (!empresaIdParam || !sucursalIdParam || !clienteIdParam) {
      this.mensajeError = 'Parámetros no válidos';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);
    this.clienteId = Number(clienteIdParam);

    this.inicializarFormulario();
    this.cargarCliente();
  }

  inicializarFormulario(): void {
    this.formulario = this.fb.group({
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

  cargarCliente(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.clienteService.obtenerPorId(this.clienteId).subscribe({
      next: (cliente) => {
        this.cliente = cliente;

        this.formulario.patchValue({
          nombre: cliente.nombre,
          correo: cliente.correo || '',
          telefono: cliente.telefono || ''
        });

        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = 'No se pudo cargar la información del cliente';
        console.error(error);
      }
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

    const dto: ClienteEditarDTO = {
      nombre: this.formulario.value.nombre.trim(),
      correo: this.normalizarOpcional(this.formulario.value.correo),
      telefono: this.normalizarOpcional(this.formulario.value.telefono)
    };

    this.guardando = true;

    this.clienteService.editar(this.clienteId, dto).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = 'Cliente actualizado correctamente.';

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

    return 'No se pudo actualizar el cliente.';
  }
}
