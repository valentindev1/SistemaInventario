import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { AuthTemporalService } from '../auth/auth-temporal.service';

import {
  MovimientoInventarioEmpleadoDTO
} from '../../models/inventario/inventario.model';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoInventarioService {

  private apiUrl = `${environment.apiUrl}/empleado/inventario`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService
  ) {}

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
    return new HttpParams().set(
      'usuarioId',
      this.authTemporalService.obtenerUsuarioId()
    );
  }
}
