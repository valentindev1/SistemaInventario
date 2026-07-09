import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { EmpresaService } from '../../../../core/services/empresa/empresa.service';
import { EmpresaCrearDTO } from '../../../../core/models/empresa/empresa.model';

@Component({
  selector: 'app-crear-empresa',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './crear-empresa.component.html',
  styleUrl: './crear-empresa.component.css'
})
export class CrearEmpresaComponent {

  formularioEmpresa: FormGroup;

  cargando = false;
  mensajeExito = '';
  mensajeError = '';

  constructor(
    private fb: FormBuilder,
    private empresaService: EmpresaService,
    private router: Router
  ) {
    this.formularioEmpresa = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      nit: ['', [Validators.required, Validators.maxLength(50)]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      telefono: ['', [Validators.required, Validators.maxLength(30)]],
      direccion: ['', [Validators.required, Validators.maxLength(200)]]
    });
  }

  crearEmpresa(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (this.formularioEmpresa.invalid) {
      this.formularioEmpresa.markAllAsTouched();
      return;
    }

    const dto: EmpresaCrearDTO = this.formularioEmpresa.value;

    this.cargando = true;

    this.empresaService.crear(dto).subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeExito = 'Empresa creada correctamente';

        setTimeout(() => {
          this.router.navigate(['/super-admin/empresas']);
        }, 800);
      },
      error: (error) => {
        this.cargando = false;

        if (error.error) {
          this.mensajeError = typeof error.error === 'string'
            ? error.error
            : 'No se pudo crear la empresa';
        } else {
          this.mensajeError = 'No se pudo conectar con el servidor';
        }

        console.error(error);
      }
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.formularioEmpresa.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}
