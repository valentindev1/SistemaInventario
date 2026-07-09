import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-panel-ventas-sucursal',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './panel-ventas-sucursal.component.html',
  styleUrl: './panel-ventas-sucursal.component.css'
})
export class PanelVentasSucursalComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  mensajeError = '';

  constructor(
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.route.snapshot.paramMap.get('empresaId');
    const sucursalIdParam = this.route.snapshot.paramMap.get('sucursalId');

    if (!empresaIdParam || !sucursalIdParam) {
      this.mensajeError = 'No se pudo identificar la empresa o la sucursal.';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);

    if (!this.empresaId || !this.sucursalId) {
      this.mensajeError = 'Los identificadores de empresa o sucursal no son válidos.';
      return;
    }
  }
}
