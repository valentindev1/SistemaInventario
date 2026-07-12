import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './acceso-denegado.component.html',
  styleUrl: './acceso-denegado.component.css'
})
export class AccesoDenegadoComponent {

  constructor(
    private router: Router
  ) {}

  volver(): void {
    const rol = localStorage.getItem('rol');
    const empresaId = localStorage.getItem('empresaId');
    const sucursalId = localStorage.getItem('sucursalId');

    if (rol === 'SUPER_ADMIN') {
      this.router.navigate(['/super-admin/empresas']);
      return;
    }

    if (rol === 'ADMIN' && empresaId) {
      this.router.navigate(['/admin/empresa', empresaId, 'dashboard']);
      return;
    }

    if (rol === 'EMPLEADO' && sucursalId) {
      this.router.navigate(['/empleado/sucursal', sucursalId, 'dashboard']);
      return;
    }

    this.router.navigate(['/login']);
  }
}
