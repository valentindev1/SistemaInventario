import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../../environments/environment';
import { AuthTemporalService } from '../../../auth/auth-temporal.service';

import {
  CategoriaCrearDTO,
  CategoriaEditarDTO,
  CategoriaObtenerDTO
} from '../../../../models/producto/detalles/categoria.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {

  private apiUrl = `${environment.apiUrl}/categorias`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService
  ) {}

  crear(dto: CategoriaCrearDTO): Observable<CategoriaObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.post<CategoriaObtenerDTO>(this.apiUrl, dto, { params });
  }

  listar(): Observable<CategoriaObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.get<CategoriaObtenerDTO[]>(this.apiUrl, { params });
  }

  listarPorEmpresa(empresaId: number): Observable<CategoriaObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.get<CategoriaObtenerDTO[]>(`${this.apiUrl}/empresa/${empresaId}`, { params });
  }

  obtenerPorId(categoriaId: number): Observable<CategoriaObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.get<CategoriaObtenerDTO>(`${this.apiUrl}/${categoriaId}`, { params });
  }

  editar(categoriaId: number, dto: CategoriaEditarDTO): Observable<CategoriaObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.put<CategoriaObtenerDTO>(`${this.apiUrl}/${categoriaId}`, dto, { params });
  }

  eliminar(categoriaId: number): Observable<void> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.delete<void>(`${this.apiUrl}/${categoriaId}`, { params });
  }

  private obtenerUsuarioIdComoParam(): HttpParams {
    return new HttpParams().set(
      'usuarioId',
      this.authTemporalService.obtenerUsuarioId()
    );
  }
}
