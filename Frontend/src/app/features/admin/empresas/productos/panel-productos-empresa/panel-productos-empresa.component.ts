import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';

import { EmpresaService } from '../../../../../core/services/empresa/empresa.service';
import { ProductoService } from '../../../../../core/services/producto/producto/producto.service';

import { EmpresaObtenerDTO } from '../../../../../core/models/empresa/empresa.model';
import {
  ProductoAdminObtenerDTO,
  ProductoEditarDTO
} from '../../../../../core/models/producto/producto.model';

import { ColorService } from '../../../../../core/services/producto/detalles/color/color.service';
import { CategoriaService } from '../../../../../core/services/producto/detalles/categoria/categoria.service';
import { TallaService } from '../../../../../core/services/producto/detalles/talla/talla.service';
import { GeneroService } from '../../../../../core/services/producto/detalles/genero/genero.service';

import { ColorObtenerDTO } from '../../../../../core/models/producto/detalles/color.model';
import { CategoriaObtenerDTO } from '../../../../../core/models/producto/detalles/categoria.model';
import { TallaObtenerDTO } from '../../../../../core/models/producto/detalles/talla.model';
import { GeneroObtenerDTO } from '../../../../../core/models/producto/detalles/genero.model';

@Component({
  selector: 'app-panel-productos-empresa',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './panel-productos-empresa.component.html',
  styleUrl: './panel-productos-empresa.component.css'
})
export class PanelProductosEmpresaComponent implements OnInit {

  empresaId!: number;

  empresa: EmpresaObtenerDTO | null = null;
  productos: ProductoAdminObtenerDTO[] = [];

  colores: ColorObtenerDTO[] = [];
  categorias: CategoriaObtenerDTO[] = [];
  tallas: TallaObtenerDTO[] = [];
  generos: GeneroObtenerDTO[] = [];

  cargandoEmpresa = false;
  cargandoProductos = false;
  cargandoDetalles = false;

  mensajeError = '';

  productoEditandoId: number | null = null;
  productoEditando: ProductoEditarDTO | null = null;

  // Filtro
  codigoBusqueda = '';

  // Paginación
  paginaActual = 1;
  elementosPorPagina = 10;

  constructor(
    private route: ActivatedRoute,
    private empresaService: EmpresaService,
    private productoService: ProductoService,
    private colorService: ColorService,
    private categoriaService: CategoriaService,
    private tallaService: TallaService,
    private generoService: GeneroService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.route.snapshot.paramMap.get('empresaId');

    if (!empresaIdParam) {
      this.mensajeError = 'ID de empresa no válido';
      return;
    }

    this.empresaId = Number(empresaIdParam);

    this.cargarEmpresa();
    this.cargarProductos();
    this.cargarDetallesProducto();
  }

  get productosFiltrados(): ProductoAdminObtenerDTO[] {
    const codigo = this.codigoBusqueda.trim().toLowerCase();

    if (!codigo) {
      return this.productos;
    }

    return this.productos.filter(producto =>
      producto.codigo?.toLowerCase().includes(codigo)
    );
  }

  get productosPaginados(): ProductoAdminObtenerDTO[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;

    return this.productosFiltrados.slice(
      inicio,
      inicio + this.elementosPorPagina
    );
  }

  get totalPaginas(): number {
    return Math.ceil(this.productosFiltrados.length / this.elementosPorPagina);
  }

  get paginas(): number[] {
    return Array.from(
      { length: this.totalPaginas },
      (_, index) => index + 1
    );
  }

  onBuscarCodigo(): void {
    this.paginaActual = 1;
  }

  limpiarBusqueda(): void {
    this.codigoBusqueda = '';
    this.paginaActual = 1;
  }

  onCambiarElementosPorPagina(): void {
    this.paginaActual = 1;
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) {
      return;
    }

    this.paginaActual = pagina;
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

  cargarProductos(): void {
    this.cargandoProductos = true;
    this.mensajeError = '';

    this.productoService.listarPorEmpresa(this.empresaId).subscribe({
      next: (productos) => {
        this.productos = productos;
        this.paginaActual = 1;
        this.cargandoProductos = false;
      },
      error: (error) => {
        this.cargandoProductos = false;
        this.mostrarErroresBackend(error, 'No se pudieron cargar los productos');
        console.error(error);
      }
    });
  }

  cargarDetallesProducto(): void {
    this.cargandoDetalles = true;

    this.colorService.listarPorEmpresa(this.empresaId).subscribe({
      next: (colores) => {
        this.colores = colores;
      },
      error: (error) => {
        console.error(error);
      }
    });

    this.categoriaService.listarPorEmpresa(this.empresaId).subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (error) => {
        console.error(error);
      }
    });

    this.tallaService.listarPorEmpresa(this.empresaId).subscribe({
      next: (tallas) => {
        this.tallas = tallas;
      },
      error: (error) => {
        console.error(error);
      }
    });

    this.generoService.listarPorEmpresa(this.empresaId).subscribe({
      next: (generos) => {
        this.generos = generos;
        this.cargandoDetalles = false;
      },
      error: (error) => {
        this.cargandoDetalles = false;
        console.error(error);
      }
    });
  }

  estaEditando(producto: ProductoAdminObtenerDTO): boolean {
    return this.productoEditandoId === producto.id;
  }

  iniciarEdicion(producto: ProductoAdminObtenerDTO): void {
    if (producto.puedeModificar === false) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto bloqueado',
        text: producto.motivoBloqueo || 'No se puede editar este producto porque tiene registros vinculados.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0d6efd'
      });

      return;
    }

    this.productoEditandoId = producto.id;

    this.productoEditando = {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      colorId: producto.colorId,
      categoriaId: producto.categoriaId,
      tallaId: producto.tallaId,
      generoId: producto.generoId
    };
  }

  cancelarEdicion(): void {
    this.productoEditandoId = null;
    this.productoEditando = null;
  }

  guardarEdicion(producto: ProductoAdminObtenerDTO): void {
    if (!this.productoEditando) {
      return;
    }

    if (!this.productoEditando.nombre || this.productoEditando.nombre.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre obligatorio',
        text: 'El nombre del producto es obligatorio.',
        confirmButtonColor: '#0d6efd'
      });
      return;
    }

    if (!this.productoEditando.descripcion || this.productoEditando.descripcion.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Descripción obligatoria',
        text: 'La descripción del producto es obligatoria.',
        confirmButtonColor: '#0d6efd'
      });
      return;
    }

    const dto: ProductoEditarDTO = {
      nombre: this.productoEditando.nombre.trim(),
      descripcion: this.productoEditando.descripcion.trim(),
      colorId: Number(this.productoEditando.colorId),
      categoriaId: Number(this.productoEditando.categoriaId),
      tallaId: Number(this.productoEditando.tallaId),
      generoId: Number(this.productoEditando.generoId)
    };

    this.productoService.editar(producto.id, dto).subscribe({
      next: (productoActualizado) => {
        this.productos = this.productos.map(item =>
          item.id === producto.id ? productoActualizado : item
        );

        this.cancelarEdicion();

        Swal.fire({
          icon: 'success',
          title: 'Producto actualizado',
          text: 'El producto fue actualizado correctamente.',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#0d6efd'
        });
      },
      error: (error) => {
        this.mostrarErroresBackend(error, 'No se pudo actualizar el producto');
        console.error(error);
      }
    });
  }

  eliminarProducto(producto: ProductoAdminObtenerDTO): void {
    if (producto.puedeModificar === false) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto bloqueado',
        text: producto.motivoBloqueo || 'No se puede eliminar este producto porque tiene registros vinculados.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0d6efd'
      });

      return;
    }

    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar producto?',
      text: `Se eliminará el producto ${producto.nombre}`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService.eliminar(producto.id).subscribe({
          next: () => {
            this.productos = this.productos.filter(item => item.id !== producto.id);

            if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
              this.paginaActual = this.totalPaginas;
            }

            Swal.fire({
              icon: 'success',
              title: 'Producto eliminado',
              text: 'El producto fue eliminado correctamente.',
              confirmButtonText: 'Continuar',
              confirmButtonColor: '#0d6efd'
            });
          },
          error: (error) => {
            this.mostrarErroresBackend(error, 'No se pudo eliminar el producto');
            console.error(error);
          }
        });
      }
    });
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
