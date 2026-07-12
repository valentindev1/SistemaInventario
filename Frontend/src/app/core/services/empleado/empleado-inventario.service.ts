import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { AuthService } from '../auth/auth.service';

import {
  InventarioEmpleadoDTO,
  MovimientoInventarioEmpleadoDTO
} from '../../models/inventario/inventario.model';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoInventarioService {

  private apiUrl = `${environment.apiUrl}/empleado/inventario`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  listarInventarioPorSucursal(
    sucursalId: number
  ): Observable<InventarioEmpleadoDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<InventarioEmpleadoDTO[]>(
      `${this.apiUrl}/sucursal/${sucursalId}`,
      { params }
    );
  }

  listarMovimientosPorSucursal(
    sucursalId: number
  ): Observable<MovimientoInventarioEmpleadoDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<MovimientoInventarioEmpleadoDTO[]>(
      `${this.apiUrl}/sucursal/${sucursalId}/movimientos`,
      { params }
    );
  }

  private obtenerUsuarioIdComoParam(): HttpParams {
    const usuarioId = this.authService.obtenerUsuarioId();

    if (!usuarioId) {
      throw new Error('No se pudo identificar el usuario autenticado.');
    }

    return new HttpParams().set(
      'usuarioId',
      usuarioId.toString()
    );
  }
}
