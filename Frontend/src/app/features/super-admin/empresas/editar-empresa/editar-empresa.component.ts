import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EmpresaService } from '../../../../core/services/empresa/empresa.service';
import { EmpresaEditarDTO } from '../../../../core/models/empresa/empresa.model';

@Component({
  selector: 'app-editar-empresa',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './editar-empresa.component.html',
  styleUrl: './editar-empresa.component.css'
})
export class EditarEmpresaComponent implements OnInit {

  formularioEmpresa: FormGroup;

  empresaId!: number;

  cargando = false;
  guardando = false;

  mensajeExito = '';
  mensajeError = '';

  constructor(
    private fb: FormBuilder,
    private empresaService: EmpresaService,
    private route: ActivatedRoute,
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

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.mensajeError = 'ID de empresa no válido';
      return;
    }

    this.empresaId = Number(idParam);

    this.cargarEmpresa();
  }

  cargarEmpresa(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.empresaService.obtenerPorId(this.empresaId).subscribe({
      next: (empresa) => {
        this.formularioEmpresa.patchValue({
          nombre: empresa.nombre,
          nit: empresa.nit,
          correo: empresa.correo,
          telefono: empresa.telefono,
          direccion: empresa.direccion
        });

        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = 'No se pudo cargar la empresa';
        console.error(error);
      }
    });
  }

  editarEmpresa(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (this.formularioEmpresa.invalid) {
      this.formularioEmpresa.markAllAsTouched();
      return;
    }

    const dto: EmpresaEditarDTO = this.formularioEmpresa.value;

    this.guardando = true;

    this.empresaService.editar(this.empresaId, dto).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = 'Empresa actualizada correctamente';

        setTimeout(() => {
          this.router.navigate(['/super-admin/empresas']);
        }, 800);
      },
      error: (error) => {
        this.guardando = false;

        if (error.error) {
          this.mensajeError = typeof error.error === 'string'
            ? error.error
            : 'No se pudo actualizar la empresa';
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
