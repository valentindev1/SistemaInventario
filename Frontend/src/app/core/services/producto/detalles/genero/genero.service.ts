import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../../environments/environment';
import { AuthTemporalService } from '../../../auth/auth-temporal.service';

import {
  GeneroCrearDTO,
  GeneroEditarDTO,
  GeneroObtenerDTO
} from '../../../../models/producto/detalles/genero.model';

@Injectable({
  providedIn: 'root'
})
export class GeneroService {

  private apiUrl = `${environment.apiUrl}/generos`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService
  ) {}

  crear(dto: GeneroCrearDTO): Observable<GeneroObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.post<GeneroObtenerDTO>(this.apiUrl, dto, { params });
  }

  listar(): Observable<GeneroObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.get<GeneroObtenerDTO[]>(this.apiUrl, { params });
  }

  listarPorEmpresa(empresaId: number): Observable<GeneroObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.get<GeneroObtenerDTO[]>(`${this.apiUrl}/empresa/${empresaId}`, { params });
  }

  obtenerPorId(generoId: number): Observable<GeneroObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.get<GeneroObtenerDTO>(`${this.apiUrl}/${generoId}`, { params });
  }

  editar(generoId: number, dto: GeneroEditarDTO): Observable<GeneroObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.put<GeneroObtenerDTO>(`${this.apiUrl}/${generoId}`, dto, { params });
  }

  eliminar(generoId: number): Observable<void> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.delete<void>(`${this.apiUrl}/${generoId}`, { params });
  }

  private obtenerUsuarioIdComoParam(): HttpParams {
    return new HttpParams().set(
      'usuarioId',
      this.authTemporalService.obtenerUsuarioId()
    );
  }
}
