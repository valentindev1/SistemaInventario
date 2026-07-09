import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import {
  DashboardEmpresaDTO,
  EmpresaCrearDTO,
  EmpresaEditarDTO,
  EmpresaObtenerDTO
} from '../../models/empresa/empresa.model';

import { AuthTemporalService } from '../auth/auth-temporal.service';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  private apiUrl = `${environment.apiUrl}/empresas`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService
  ) {}

  crear(dto: EmpresaCrearDTO): Observable<EmpresaObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.post<EmpresaObtenerDTO>(this.apiUrl, dto, { params });
  }

  listar(): Observable<EmpresaObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<EmpresaObtenerDTO[]>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<EmpresaObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<EmpresaObtenerDTO>(`${this.apiUrl}/${id}`, { params });
  }

  editar(id: number, dto: EmpresaEditarDTO): Observable<EmpresaObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.put<EmpresaObtenerDTO>(`${this.apiUrl}/${id}`, dto, { params });
  }

  eliminar(id: number): Observable<void> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { params });
  }


  obtenerDashboardEmpresa(
    empresaId: number,
    fechaInicio: string,
    fechaFin: string
  ) {
    const params = this.obtenerUsuarioIdComoParam()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<DashboardEmpresaDTO>(
      `${this.apiUrl}/${empresaId}/dashboard`,
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
