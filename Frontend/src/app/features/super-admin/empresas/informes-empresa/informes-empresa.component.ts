import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EmpresaService } from '../../../../core/services/empresa/empresa.service';

@Component({
  selector: 'app-informes-empresa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './informes-empresa.component.html',
  styleUrl: './informes-empresa.component.css'
})
export class InformesEmpresaComponent implements OnInit {

  empresaId!: number;
  empresaNombre = 'Empresa';

  fechaInicio = '';
  fechaFin = '';
  mensajeError = '';
  mensajeInfo = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private empresaService: EmpresaService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.route.snapshot.paramMap.get('empresaId');

    if (!empresaIdParam || Number.isNaN(Number(empresaIdParam))) {
      this.mensajeError = 'No se pudo identificar la empresa.';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.establecerMesActual();

    this.empresaService.obtenerPorId(this.empresaId).subscribe({
      next: empresa => this.empresaNombre = empresa.nombre,
      error: () => this.mensajeError = 'No se pudo cargar el nombre de la empresa.'
    });
  }

  establecerMesActual(): void {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    this.fechaInicio = this.formatearFecha(primerDia);
    this.fechaFin = this.formatearFecha(ultimoDia);
    this.mensajeError = '';
    this.mensajeInfo = '';
  }

  limpiarRango(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.mensajeError = '';
    this.mensajeInfo = '';
  }

  prepararConsulta(): void {
    this.mensajeError = '';
    this.mensajeInfo = '';

    if (!this.fechaInicio || !this.fechaFin) {
      this.mensajeError = 'Selecciona una fecha inicial y una fecha final.';
      return;
    }

    if (this.fechaInicio > this.fechaFin) {
      this.mensajeError = 'La fecha inicial no puede ser posterior a la fecha final.';
      return;
    }

    this.mensajeInfo = 'Rango seleccionado. Los módulos contables se conectarán aquí cuando definamos cada informe.';
  }

  volverDetalleEmpresa(): any[] {
    return this.router.url.startsWith('/super-admin')
      ? ['/super-admin/empresas/detalle', this.empresaId]
      : ['/admin/empresa', this.empresaId, 'dashboard'];
  }

  private formatearFecha(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }
}
