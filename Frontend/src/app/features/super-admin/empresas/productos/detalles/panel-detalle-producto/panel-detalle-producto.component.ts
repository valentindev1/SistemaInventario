import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import Swal from 'sweetalert2';
import {EmpresaObtenerDTO} from '../../../../../../core/models/empresa/empresa.model';
import {EmpresaService} from '../../../../../../core/services/empresa/empresa.service';
import {ColorService} from '../../../../../../core/services/producto/detalles/color/color.service';
import {CategoriaService} from '../../../../../../core/services/producto/detalles/categoria/categoria.service';
import {GeneroService} from '../../../../../../core/services/producto/detalles/genero/genero.service';
import {TallaService} from '../../../../../../core/services/producto/detalles/talla/talla.service';



interface DetalleProductoItem {
  id: number;
  nombre: string;
  empresaId: number;
  empresaNombre: string;
  fechaCreacion: string;
}

type TipoDetalle = 'colores' | 'categorias' | 'generos' | 'tallas';

@Component({
  selector: 'app-panel-detalle-producto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './panel-detalle-producto.component.html',
  styleUrl: './panel-detalle-producto.component.css'
})
export class PanelDetalleProductoComponent implements OnInit {

  empresaId!: number;
  tipo!: TipoDetalle;

  empresa: EmpresaObtenerDTO | null = null;
  items: DetalleProductoItem[] = [];

  formulario: FormGroup;

  itemEditando: DetalleProductoItem | null = null;

  cargandoEmpresa = false;
  cargandoItems = false;
  guardando = false;

  mensajeError = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private empresaService: EmpresaService,
    private colorService: ColorService,
    private categoriaService: CategoriaService,
    private generoService: GeneroService,
    private tallaService: TallaService
  ) {
    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(80)]]
    });
  }

  ngOnInit(): void {
    const empresaIdParam = this.route.snapshot.paramMap.get('empresaId');
    const tipoParam = this.route.snapshot.paramMap.get('tipo') as TipoDetalle;

    if (!empresaIdParam || !tipoParam) {
      this.mensajeError = 'Parámetros no válidos';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.tipo = tipoParam;

    if (!this.tipoEsValido(this.tipo)) {
      this.mensajeError = 'Tipo de catálogo no válido';
      return;
    }

    this.cargarEmpresa();
    this.cargarItems();
  }

  cargarEmpresa(): void {
    this.cargandoEmpresa = true;

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

  cargarItems(): void {
    this.cargandoItems = true;

    this.servicioActual().listarPorEmpresa(this.empresaId).subscribe({
      next: (data: DetalleProductoItem[]) => {
        this.items = data;
        this.cargandoItems = false;
      },
      error: (error: any) => {
        this.cargandoItems = false;
        this.mostrarErroresBackend(error, `No se pudieron cargar ${this.nombrePluralMinuscula()}`);
        console.error(error);
      }
    });
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Debes ingresar un nombre válido.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ffc107'
      });

      return;
    }

    if (this.itemEditando) {
      this.editar();
    } else {
      this.crear();
    }
  }

  crear(): void {
    const dto = {
      nombre: this.formulario.value.nombre,
      empresaId: this.empresaId
    };

    this.guardando = true;

    this.servicioActual().crear(dto).subscribe({
      next: () => {
        this.guardando = false;
        this.formulario.reset();
        this.cargarItems();

        Swal.fire({
          icon: 'success',
          title: `${this.nombreSingular()} creado`,
          text: `${this.nombreSingular()} fue creado correctamente.`,
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#0d6efd'
        });
      },
      error: (error: any) => {
        this.guardando = false;
        this.mostrarErroresBackend(error, `No se pudo crear ${this.nombreSingularMinuscula()}`);
        console.error(error);
      }
    });
  }

  activarEdicion(item: DetalleProductoItem): void {
    this.itemEditando = item;

    this.formulario.patchValue({
      nombre: item.nombre
    });
  }

  cancelarEdicion(): void {
    this.itemEditando = null;
    this.formulario.reset();
  }

  editar(): void {
    if (!this.itemEditando) {
      return;
    }

    const dto = {
      nombre: this.formulario.value.nombre
    };

    this.guardando = true;

    this.servicioActual().editar(this.itemEditando.id, dto).subscribe({
      next: () => {
        this.guardando = false;
        this.itemEditando = null;
        this.formulario.reset();
        this.cargarItems();

        Swal.fire({
          icon: 'success',
          title: `${this.nombreSingular()} actualizado`,
          text: `${this.nombreSingular()} fue actualizado correctamente.`,
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#0d6efd'
        });
      },
      error: (error: any) => {
        this.guardando = false;
        this.mostrarErroresBackend(error, `No se pudo editar ${this.nombreSingularMinuscula()}`);
        console.error(error);
      }
    });
  }

  eliminar(item: DetalleProductoItem): void {
    Swal.fire({
      icon: 'warning',
      title: `¿Eliminar ${this.nombreSingularMinuscula()}?`,
      text: `Se eliminará: ${item.nombre}`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicioActual().eliminar(item.id).subscribe({
          next: () => {
            this.items = this.items.filter(i => i.id !== item.id);

            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: `${this.nombreSingular()} fue eliminado correctamente.`,
              confirmButtonText: 'Continuar',
              confirmButtonColor: '#0d6efd'
            });
          },
          error: (error: any) => {
            this.mostrarErroresBackend(error, `No se pudo eliminar ${this.nombreSingularMinuscula()}`);
            console.error(error);
          }
        });
      }
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  servicioActual(): any {
    switch (this.tipo) {
      case 'colores':
        return this.colorService;
      case 'categorias':
        return this.categoriaService;
      case 'generos':
        return this.generoService;
      case 'tallas':
        return this.tallaService;
    }
  }

  tipoEsValido(tipo: string): tipo is TipoDetalle {
    return ['colores', 'categorias', 'generos', 'tallas'].includes(tipo);
  }

  nombreSingular(): string {
    switch (this.tipo) {
      case 'colores':
        return 'Color';
      case 'categorias':
        return 'Categoría';
      case 'generos':
        return 'Género';
      case 'tallas':
        return 'Talla';
    }
  }

  nombreSingularMinuscula(): string {
    return this.nombreSingular().toLowerCase();
  }

  nombrePlural(): string {
    switch (this.tipo) {
      case 'colores':
        return 'Colores';
      case 'categorias':
        return 'Categorías';
      case 'generos':
        return 'Géneros';
      case 'tallas':
        return 'Tallas';
    }
  }

  nombrePluralMinuscula(): string {
    return this.nombrePlural().toLowerCase();
  }

  icono(): string {
    switch (this.tipo) {
      case 'colores':
        return 'bi-palette';
      case 'categorias':
        return 'bi-grid';
      case 'generos':
        return 'bi-person-badge';
      case 'tallas':
        return 'bi-rulers';
    }
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
