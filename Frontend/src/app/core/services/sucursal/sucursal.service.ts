import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthTemporalService } from '../auth/auth-temporal.service';

import {
  SucursalCrearDTO,
  SucursalEditarDTO,
  SucursalObtenerDTO
} from '../../models/sucursal/sucursal.model';

@Injectable({
  providedIn: 'root'
})
export class SucursalService {

  private apiUrl = `${environment.apiUrl}/sucursales`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService
  ) {}

  crear(dto: SucursalCrearDTO): Observable<SucursalObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.post<SucursalObtenerDTO>(
      this.apiUrl,
      dto,
      { params }
    );
  }

  listar(): Observable<SucursalObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<SucursalObtenerDTO[]>(
      this.apiUrl,
      { params }
    );
  }

  listarPorEmpresaNit(empresaNit: string): Observable<SucursalObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<SucursalObtenerDTO[]>(
      `${this.apiUrl}/empresa/${empresaNit}`,
      { params }
    );
  }

  obtenerPorId(id: number): Observable<SucursalObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<SucursalObtenerDTO>(
      `${this.apiUrl}/${id}`,
      { params }
    );
  }

  editar(id: number, dto: SucursalEditarDTO): Observable<SucursalObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.put<SucursalObtenerDTO>(
      `${this.apiUrl}/${id}`,
      dto,
      { params }
    );
  }

  eliminar(id: number): Observable<void> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`,
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
