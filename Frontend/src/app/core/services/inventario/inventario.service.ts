import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import {
  AjusteInventarioDTO,
  IngresoInventarioDTO,
  InventarioAdminDTO,
  MovimientoInventarioDTO,
  ResumenInventarioSucursalDTO
} from '../../models/inventario/inventario.model';

import { AuthTemporalService } from '../auth/auth-temporal.service';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private apiUrl = `${environment.apiUrl}/inventario`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService
  ) {}

  private obtenerUsuarioIdComoParam(): HttpParams {
    const usuarioId = this.authTemporalService.obtenerUsuarioId();

    return new HttpParams().set('usuarioId', usuarioId);
  }

  ingresarMercancia(dto: IngresoInventarioDTO): Observable<void> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.post<void>(
      `${this.apiUrl}/ingresos`,
      dto,
      { params }
    );
  }

  ajustarInventario(dto: AjusteInventarioDTO): Observable<void> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.post<void>(
      `${this.apiUrl}/ajustes`,
      dto,
      { params }
    );
  }

  listarPorSucursal(sucursalId: number): Observable<InventarioAdminDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<InventarioAdminDTO[]>(
      `${this.apiUrl}/sucursal/${sucursalId}`,
      { params }
    );
  }

  obtenerResumenSucursal(sucursalId: number): Observable<ResumenInventarioSucursalDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<ResumenInventarioSucursalDTO>(
      `${this.apiUrl}/sucursal/${sucursalId}/resumen`,
      { params }
    );
  }

  listarMovimientosPorSucursal(sucursalId: number): Observable<MovimientoInventarioDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<MovimientoInventarioDTO[]>(
      `${this.apiUrl}/sucursal/${sucursalId}/movimientos`,
      { params }
    );
  }
}
