import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { EmpresaService } from '../../../../core/services/empresa/empresa.service';
import { EmpresaObtenerDTO } from '../../../../core/models/empresa/empresa.model';

@Component({
  selector: 'app-listar-empresas',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './listar-empresas.component.html',
  styleUrl: './listar-empresas.component.css'
})
export class ListarEmpresasComponent implements OnInit {

  empresas: EmpresaObtenerDTO[] = [];

  cargando = false;
  mensajeError = '';
  mensajeExito = '';

  constructor(
    private empresaService: EmpresaService
  ) {}

  ngOnInit(): void {
    this.cargarEmpresas();
  }

  cargarEmpresas(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.empresaService.listar().subscribe({
      next: (data) => {
        this.empresas = data;
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = 'No se pudieron cargar las empresas';
        console.error(error);
      }
    });
  }

  eliminarEmpresa(id: number): void {
    const confirmar = confirm('¿Estás seguro de eliminar esta empresa?');

    if (!confirmar) {
      return;
    }

    this.mensajeError = '';
    this.mensajeExito = '';

    this.empresaService.eliminar(id).subscribe({
      next: () => {
        this.mensajeExito = 'Empresa eliminada correctamente';
        this.empresas = this.empresas.filter(empresa => empresa.id !== id);
      },
      error: (error) => {
        this.mensajeError = 'No se pudo eliminar la empresa';
        console.error(error);
      }
    });
  }
}
