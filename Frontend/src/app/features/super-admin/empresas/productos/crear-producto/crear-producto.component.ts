import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import Swal from 'sweetalert2';

import { EmpresaService } from '../../../../../core/services/empresa/empresa.service';
import { ProductoService } from '../../../../../core/services/producto/producto/producto.service';

import { ColorService } from '../../../../../core/services/producto/detalles/color/color.service';
import { CategoriaService } from '../../../../../core/services/producto/detalles/categoria/categoria.service';
import { GeneroService } from '../../../../../core/services/producto/detalles/genero/genero.service';
import { TallaService } from '../../../../../core/services/producto/detalles/talla/talla.service';

import { EmpresaObtenerDTO } from '../../../../../core/models/empresa/empresa.model';
import { ProductoCrearDTO } from '../../../../../core/models/producto/producto.model';

import { ColorObtenerDTO } from '../../../../../core/models/producto/detalles/color.model';
import { CategoriaObtenerDTO } from '../../../../../core/models/producto/detalles/categoria.model';
import { GeneroObtenerDTO } from '../../../../../core/models/producto/detalles/genero.model';
import { TallaObtenerDTO } from '../../../../../core/models/producto/detalles/talla.model';

import { AuthService } from '../../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './crear-producto.component.html',
  styleUrl: './crear-producto.component.css'
})
export class CrearProductoComponent implements OnInit {

  empresaId!: number;

  empresa: EmpresaObtenerDTO | null = null;

  colores: ColorObtenerDTO[] = [];
  categorias: CategoriaObtenerDTO[] = [];
  generos: GeneroObtenerDTO[] = [];
  tallas: TallaObtenerDTO[] = [];

  formularioProducto: FormGroup;

  cargandoEmpresa = false;
  cargandoDetalles = false;
  guardando = false;

  mensajeError = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private empresaService: EmpresaService,
    private productoService: ProductoService,
    private colorService: ColorService,
    private categoriaService: CategoriaService,
    private generoService: GeneroService,
    private tallaService: TallaService,
    private authService: AuthService
  ) {
    this.formularioProducto = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      codigo: ['', [Validators.required, Validators.maxLength(80)]],
      descripcion: ['', [Validators.required, Validators.maxLength(150)]],

      colorId: ['', [Validators.required]],
      categoriaId: ['', [Validators.required]],
      tallaId: ['', [Validators.required]],
      generoId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const empresaIdParam = this.obtenerEmpresaIdDesdeRuta();

    if (!empresaIdParam) {
      this.mensajeError = 'ID de empresa no válido';
      return;
    }

    this.empresaId = Number(empresaIdParam);

    if (Number.isNaN(this.empresaId)) {
      this.mensajeError = 'ID de empresa no válido';
      return;
    }

    this.cargarEmpresa();
    this.cargarDetallesProducto();
  }

  private obtenerEmpresaIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('empresaId') ??
      null
    );
  }

  esSuperAdmin(): boolean {
    return this.authService.obtenerRol() === 'SUPER_ADMIN';
  }

  esAdmin(): boolean {
    return this.authService.obtenerRol() === 'ADMIN';
  }

  rutaProductos(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'productos'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'productos'
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
        this.mostrarErroresBackend(error, 'No se pudo cargar la empresa');
        console.error(error);
      }
    });
  }

  cargarDetallesProducto(): void {
    this.cargandoDetalles = true;
    this.mensajeError = '';

    let pendientes = 4;

    const finalizarCarga = () => {
      pendientes--;

      if (pendientes === 0) {
        this.cargandoDetalles = false;
      }
    };

    this.colorService.listarPorEmpresa(this.empresaId).subscribe({
      next: (colores) => {
        this.colores = colores;
        finalizarCarga();
      },
      error: (error) => {
        finalizarCarga();
        this.mostrarErroresBackend(error, 'No se pudieron cargar los colores');
        console.error(error);
      }
    });

    this.categoriaService.listarPorEmpresa(this.empresaId).subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        finalizarCarga();
      },
      error: (error) => {
        finalizarCarga();
        this.mostrarErroresBackend(error, 'No se pudieron cargar las categorías');
        console.error(error);
      }
    });

    this.generoService.listarPorEmpresa(this.empresaId).subscribe({
      next: (generos) => {
        this.generos = generos;
        finalizarCarga();
      },
      error: (error) => {
        finalizarCarga();
        this.mostrarErroresBackend(error, 'No se pudieron cargar los géneros');
        console.error(error);
      }
    });

    this.tallaService.listarPorEmpresa(this.empresaId).subscribe({
      next: (tallas) => {
        this.tallas = tallas;
        finalizarCarga();
      },
      error: (error) => {
        finalizarCarga();
        this.mostrarErroresBackend(error, 'No se pudieron cargar las tallas');
        console.error(error);
      }
    });
  }

  crearProducto(): void {
    this.mensajeError = '';

    if (this.formularioProducto.invalid) {
      this.formularioProducto.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Debes completar correctamente todos los campos obligatorios.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ffc107'
      });

      return;
    }

    const dto: ProductoCrearDTO = {
      nombre: this.formularioProducto.value.nombre.trim(),
      codigo: this.formularioProducto.value.codigo.trim(),
      descripcion: this.formularioProducto.value.descripcion.trim(),

      empresaId: this.empresaId,

      colorId: Number(this.formularioProducto.value.colorId),
      categoriaId: Number(this.formularioProducto.value.categoriaId),
      tallaId: Number(this.formularioProducto.value.tallaId),
      generoId: Number(this.formularioProducto.value.generoId)
    };

    this.guardando = true;

    this.productoService.crear(dto).subscribe({
      next: () => {
        this.guardando = false;

        Swal.fire({
          icon: 'success',
          title: 'Producto creado',
          text: 'El producto fue creado correctamente. El costo y precio de venta se asignarán al ingresar mercancía.',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#0d6efd'
        }).then(() => {
          this.router.navigate(this.rutaProductos());
        });
      },
      error: (error) => {
        this.guardando = false;
        this.mostrarErroresBackend(error, 'No se pudo crear el producto');
        console.error(error);
      }
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.formularioProducto.get(campo);

    return !!control && control.invalid && (control.dirty || control.touched);
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
