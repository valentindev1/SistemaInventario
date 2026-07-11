import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EmpresaService } from '../../../../../core/services/empresa/empresa.service';
import { SucursalService } from '../../../../../core/services/sucursal/sucursal.service';

import { EmpresaObtenerDTO } from '../../../../../core/models/empresa/empresa.model';
import { SucursalCrearDTO } from '../../../../../core/models/sucursal/sucursal.model';

@Component({
  selector: 'app-crear-sucursal-empresa',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './crear-sucursal-empresa.component.html',
  styleUrl: './crear-sucursal-empresa.component.css'
})
export class CrearSucursalEmpresaComponent implements OnInit {

  empresaId!: number;
  empresa: EmpresaObtenerDTO | null = null;

  formularioSucursal: FormGroup;

  cargandoEmpresa = false;
  guardando = false;

  mensajeExito = '';
  mensajeError = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private empresaService: EmpresaService,
    private sucursalService: SucursalService
  ) {
    this.formularioSucursal = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      ciudad: ['', [Validators.required, Validators.maxLength(200)]],
      direccion: ['', [Validators.required, Validators.maxLength(200)]],
      telefono: ['', [Validators.required, Validators.maxLength(30)]]
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
        this.mensajeError = 'No se pudo cargar la empresa';
        console.error(error);
      }
    });
  }

  crearSucursal(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (this.formularioSucursal.invalid) {
      this.formularioSucursal.markAllAsTouched();
      return;
    }

    if (!this.empresa) {
      this.mensajeError = 'No hay empresa seleccionada';
      return;
    }

    const dto: SucursalCrearDTO = {
      nombre: this.formularioSucursal.value.nombre,
      ciudad: this.formularioSucursal.value.ciudad,
      direccion: this.formularioSucursal.value.direccion,
      telefono: this.formularioSucursal.value.telefono,
      empresaNit: this.empresa.nit
    };

    this.guardando = true;

    this.sucursalService.crear(dto).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = 'Sucursal creada correctamente';

        setTimeout(() => {
          this.router.navigate(['/super-admin/empresas/detalle', this.empresaId]);
        }, 800);
      },
      error: (error) => {
        this.guardando = false;

        if (typeof error.error === 'string') {
          this.mensajeError = error.error;
        } else {
          this.mensajeError = 'No se pudo crear la sucursal';
        }

        console.error(error);
      }
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.formularioSucursal.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}
