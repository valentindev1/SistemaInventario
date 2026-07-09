import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../../environments/environment';
import { AuthTemporalService } from '../../../auth/auth-temporal.service';

import {
  TallaCrearDTO,
  TallaEditarDTO,
  TallaObtenerDTO
} from '../../../../models/producto/detalles/talla.model';

@Injectable({
  providedIn: 'root'
})
export class TallaService {

  private apiUrl = `${environment.apiUrl}/tallas`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService
  ) {}

  crear(dto: TallaCrearDTO): Observable<TallaObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.post<TallaObtenerDTO>(this.apiUrl, dto, { params });
  }

  listar(): Observable<TallaObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.get<TallaObtenerDTO[]>(this.apiUrl, { params });
  }

  listarPorEmpresa(empresaId: number): Observable<TallaObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.get<TallaObtenerDTO[]>(`${this.apiUrl}/empresa/${empresaId}`, { params });
  }

  obtenerPorId(tallaId: number): Observable<TallaObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.get<TallaObtenerDTO>(`${this.apiUrl}/${tallaId}`, { params });
  }

  editar(tallaId: number, dto: TallaEditarDTO): Observable<TallaObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.put<TallaObtenerDTO>(`${this.apiUrl}/${tallaId}`, dto, { params });
  }

  eliminar(tallaId: number): Observable<void> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.delete<void>(`${this.apiUrl}/${tallaId}`, { params });
  }

  private obtenerUsuarioIdComoParam(): HttpParams {
    return new HttpParams().set(
      'usuarioId',
      this.authTemporalService.obtenerUsuarioId()
    );
  }
}
